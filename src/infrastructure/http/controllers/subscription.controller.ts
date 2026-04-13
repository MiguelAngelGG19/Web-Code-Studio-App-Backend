import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PhysiotherapistModel } from '../../persistence/sequelize/client';

export class SubscriptionController {
  private stripe: any;

  // Los mismos planes que tiene el front
  private planesHardcodeados = [
    { id_plan: 0, name: 'Plan Gratis', patient_limit: 5, appointment_limit_mo: 10, routine_limit: 10, logbook_limit_mo: 10, tracking_limit_mo: 10, stripe_price_id: '' },
    { id_plan: 1, name: 'Plan Basico', patient_limit: 20, appointment_limit_mo: 50, routine_limit: 30, logbook_limit_mo: 50, tracking_limit_mo: 100, stripe_price_id: process.env.STRIPE_PRICE_BASIC || 'price_mock_basico' },
    { id_plan: 2, name: 'Plan Premium', patient_limit: null, appointment_limit_mo: null, routine_limit: null, logbook_limit_mo: null, tracking_limit_mo: null, stripe_price_id: process.env.STRIPE_PRICE_PREMIUM || 'price_mock_premium' }
  ];

  constructor(private createCheckoutSession: any) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });
  }

  // GET /api/suscripciones/mi-plan
  // GET /api/suscripciones/mi-plan
  miPlan = async (req: Request, res: Response) => {
    try {
      const physioId = (req as any).user?.id || (req as any).user?.id_user;

      // 🪄 MAGIA ANTI-SEQUELIZE: Consulta SQL pura para obligarlo a leer todas las columnas
      const [results]: any = await PhysiotherapistModel.sequelize!.query(
        'SELECT * FROM physiotherapist WHERE id_user = ? LIMIT 1',
        { replacements: [physioId] }
      );

      if (!results || results.length === 0) {
        return res.status(404).json({ message: 'Fisio no encontrado' });
      }

      const fisio = results[0]; // Tomamos el primer resultado de la consulta cruda

      // Traduce de la BD al Frontend
      const currentPlanName = fisio.plan_type || 'free';
      let currentPlanId = 0;
      if (currentPlanName === 'basico') currentPlanId = 1;
      if (currentPlanName === 'ilimitado') currentPlanId = 2;

      // Leemos las columnas reales de MySQL
      const planActivo = fisio.plan_activo;
      const isActive = String(planActivo) === '1' || String(planActivo) === 'true' || planActivo === 'activo' || planActivo === 1 || planActivo === true;
      const status = isActive ? 'active' : 'none';

      const matchedPlan = this.planesHardcodeados.find(p => p.id_plan === currentPlanId);

      return res.status(200).json({
        success: true,
        data: {
          id_plan: currentPlanId,
          subscription_status: status,
          plan: matchedPlan,
          pending_plan_id: null,
          pending_plan: null,
          pending_plan_change_date: null
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // GET /api/suscripciones/planes y /api/publico/planes
  listaPlanes = async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: this.planesHardcodeados
    });
  };

  // POST /api/suscripciones/checkout
  checkout = async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const physioId = (req as any).user.id;

      if (planId === undefined || planId === null) {
        return res.status(400).json({ message: 'El campo planId es requerido.' });
      }

      // 🪄 ESCUDO BLINDADO: Acepta ID o Texto y lo traduce para tu UseCase
      let planStringParaUseCase = String(planId).toLowerCase();
      if (planId === 1 || planStringParaUseCase === '1') planStringParaUseCase = 'basico';
      if (planId === 2 || planStringParaUseCase === '2') planStringParaUseCase = 'ilimitado';

      // Disparamos el caso de uso
      if (this.createCheckoutSession && this.createCheckoutSession.execute) {
         const url = await this.createCheckoutSession.execute(planStringParaUseCase, physioId);
         return res.status(200).json({ url });
      }

      return res.status(500).json({ message: 'El caso de uso de checkout no está inyectado.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // GET /api/suscripciones/confirmar-checkout
  confirmarCheckout = async (req: Request, res: Response) => {
    try {
      res.status(200).json({ success: true, message: 'Checkout confirmado' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // POST /api/suscripciones/portal
  portal = async (req: Request, res: Response) => {
    try {
      res.status(200).json({ url: 'https://billing.stripe.com/p/login/test_mock_portal' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // POST /api/suscripciones/cambiar-plan
  cambiarPlan = async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const physioId = (req as any).user.id;
      
      // 🪄 ESCUDO BLINDADO: Para guardar correctamente en BD
      let newPlanType = 'free';
      let strPlanId = String(planId).toLowerCase();
      if(planId === 1 || strPlanId === '1' || strPlanId === 'basico') newPlanType = 'basico';
      if(planId === 2 || strPlanId === '2' || strPlanId === 'ilimitado') newPlanType = 'ilimitado';

      await PhysiotherapistModel.update(
        { plan_type: newPlanType },
        { where: { id_user: physioId } }
      );

      res.status(200).json({ success: true, message: 'Plan actualizado con éxito' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // DELETE /api/suscripciones/cambio-pendiente
  cancelarCambio = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Cambio pendiente cancelado' });
  };

  // POST /api/suscripciones/webhook
  webhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ message: 'Falta la firma de Stripe.' });

    try {
      const event = this.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subActiva = event.data.object as any;
        const physioId = subActiva.metadata?.physioId;
        const metaPlanId = subActiva.metadata?.planId;

        // Limpiamos la data del webhook
        let planType = 'free';
        let strMeta = String(metaPlanId).toLowerCase();
        if (strMeta === '1' || strMeta === 'basico') planType = 'basico';
        if (strMeta === '2' || strMeta === 'ilimitado') planType = 'ilimitado';

        if (physioId) {
          await PhysiotherapistModel.update(
            { 
              plan_activo: subActiva.status === 'active' ? 1 : 0,
              plan_type: planType
            },
            { where: { id_user: physioId } }
          );
        }
      }

      if (event.type === 'customer.subscription.deleted') {
        const subCancelada = event.data.object as any;
        const physioId = subCancelada.metadata?.physioId;

        if (physioId) {
          await PhysiotherapistModel.update(
            { plan_activo: 0, plan_type: 'free' },
            { where: { id_user: physioId } }
          );
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  };
}
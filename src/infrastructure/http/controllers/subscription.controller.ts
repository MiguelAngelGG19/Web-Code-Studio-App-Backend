import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PhysiotherapistModel } from '../../persistence/sequelize/client';

export class SubscriptionController {
  private stripe: any;

  private planesHardcodeados = [
    { id_plan: 0, name: 'Plan Gratis', patient_limit: 5, appointment_limit_mo: 10, routine_limit: 10, logbook_limit_mo: 10, tracking_limit_mo: 10, stripe_price_id: '' },
    { id_plan: 1, name: 'Plan Basico', patient_limit: 20, appointment_limit_mo: 50, routine_limit: 30, logbook_limit_mo: 50, tracking_limit_mo: 100, stripe_price_id: process.env.STRIPE_PRICE_BASIC || 'price_mock_basico' },
    { id_plan: 2, name: 'Plan Premium', patient_limit: null, appointment_limit_mo: null, routine_limit: null, logbook_limit_mo: null, tracking_limit_mo: null, stripe_price_id: process.env.STRIPE_PRICE_PREMIUM || 'price_mock_premium' }
  ];

  constructor(private createCheckoutSession: any) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });
  }

  miPlan = async (req: Request, res: Response) => {
    try {
      const physioId = (req as any).user?.id || (req as any).user?.id_user;

      const [results]: any = await PhysiotherapistModel.sequelize!.query(
        'SELECT * FROM physiotherapist WHERE id_user = ? LIMIT 1',
        { replacements: [physioId] }
      );

      if (!results || results.length === 0) return res.status(404).json({ message: 'Fisio no encontrado' });

      const fisio = results[0]; 
      const currentPlanName = fisio.plan_type || 'free';
      let currentPlanId = 0;
      if (currentPlanName === 'basico') currentPlanId = 1;
      if (currentPlanName === 'ilimitado') currentPlanId = 2;

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

  listaPlanes = async (req: Request, res: Response) => {
    return res.status(200).json({ success: true, data: this.planesHardcodeados });
  };

  checkout = async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const physioId = (req as any).user?.id || (req as any).user?.id_user;

      let planString = String(planId).toLowerCase();
      if (planString === '1' || planString === 'basico') planString = 'basico';
      if (planString === '2' || planString === 'ilimitado') planString = 'ilimitado';

      if (this.createCheckoutSession && this.createCheckoutSession.execute) {
         const url = await this.createCheckoutSession.execute(planString, physioId);
         return res.status(200).json({ url });
      }
      return res.status(500).json({ message: 'El caso de uso de checkout no está inyectado.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // 🪄 LA SOLUCIÓN DEFINITIVA: Actualizamos la BD manualmente al regresar de Stripe
  confirmarCheckout = async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) return res.status(400).json({ message: 'Falta session_id' });

      // Buscamos el recibo de compra en Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      const physioId = session.metadata?.physioId;
      const planId = session.metadata?.planId;

      // Si pagó con éxito, actualizamos MySQL ¡AL INSTANTE!
      if (physioId && planId && session.payment_status === 'paid') {
        await PhysiotherapistModel.sequelize!.query(
          "UPDATE physiotherapist SET plan_activo = 1, plan_type = ? WHERE id_user = ?",
          { replacements: [planId, physioId] }
        );
      }

      res.status(200).json({ success: true, message: 'Checkout confirmado y BD actualizada' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  portal = async (req: Request, res: Response) => {
    try {
      const physioId = (req as any).user?.id || (req as any).user?.id_user;

      const subscriptions = await this.stripe.subscriptions.search({
        query: `metadata['physioId']:'${physioId}' AND status:'active'`,
      });

      if (subscriptions.data.length > 0) {
        const customerId = subscriptions.data[0].customer as string;
        const portalSession = await this.stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.FRONTEND_URL}/dashboard/subscription` 
        });
        
        return res.status(200).json({ url: portalSession.url });
      }

      res.status(404).json({ message: 'No se encontró un perfil de pago activo para gestionar.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  cambiarPlan = async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const physioId = (req as any).user?.id || (req as any).user?.id_user;
      
      let newPlanType = 'free';
      let strPlanId = String(planId).toLowerCase();
      if(strPlanId === '1' || strPlanId === 'basico') newPlanType = 'basico';
      if(strPlanId === '2' || strPlanId === 'ilimitado') newPlanType = 'ilimitado';

      if (newPlanType === 'free') {
        const subscriptions = await this.stripe.subscriptions.search({
          query: `metadata['physioId']:'${physioId}' AND status:'active'`,
        });

        if (subscriptions.data.length > 0) {
          await this.stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: true
          });
          return res.status(200).json({ success: true, message: 'Suscripción cancelada al final de tu periodo.' });
        } else {
          await PhysiotherapistModel.sequelize!.query(
            "UPDATE physiotherapist SET plan_type = 'free', plan_activo = 1 WHERE id_user = ?",
            { replacements: [physioId] }
          );
          return res.status(200).json({ success: true, message: 'Plan actualizado a Gratis con éxito.' });
        }
      }

      if (this.createCheckoutSession && this.createCheckoutSession.execute) {
         const url = await this.createCheckoutSession.execute(newPlanType, physioId);
         return res.status(200).json({ requires_checkout: true, url: url });
      }

      res.status(500).json({ message: 'Error interno conectando con Stripe.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  cancelarCambio = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Cambio cancelado' });
  };

  webhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ message: 'Falta firma' });

    try {
      const event = this.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subActiva = event.data.object as any;
        const physioId = subActiva.metadata?.physioId;
        const metaPlanId = subActiva.metadata?.planId;
        
        let planType = 'free';
        const newPriceId = subActiva.items?.data[0]?.price?.id;
        
        if (newPriceId === process.env.STRIPE_PRICE_BASICO) planType = 'basico';
        if (newPriceId === process.env.STRIPE_PRICE_ILIMITADO) planType = 'ilimitado';

        if (planType === 'free' && metaPlanId) {
          let strMeta = String(metaPlanId).toLowerCase();
          if (strMeta === '1' || strMeta === 'basico') planType = 'basico';
          if (strMeta === '2' || strMeta === 'ilimitado') planType = 'ilimitado';
        }

        if (physioId) {
          await PhysiotherapistModel.sequelize!.query(
            "UPDATE physiotherapist SET plan_activo = ?, plan_type = ? WHERE id_user = ?",
            { replacements: [subActiva.status === 'active' ? 1 : 0, planType, physioId] }
          );
        }
      }

      if (event.type === 'customer.subscription.deleted') {
        const subCancelada = event.data.object as any;
        const physioId = subCancelada.metadata?.physioId;
        if (physioId) {
          await PhysiotherapistModel.sequelize!.query(
            "UPDATE physiotherapist SET plan_activo = 1, plan_type = 'free' WHERE id_user = ?",
            { replacements: [physioId] }
          );
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Error: ${err.message}`);
    }
  };
}
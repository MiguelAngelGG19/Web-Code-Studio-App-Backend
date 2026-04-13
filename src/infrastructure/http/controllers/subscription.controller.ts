import { Request, Response } from 'express';
import Stripe from 'stripe';
import type { Subscription } from 'stripe';
import { CreateCheckoutSessionUseCase } from '../../../application/use-cases/CreateCheckoutSession.uc';
import { PhysiotherapistModel } from '../../persistence/sequelize/client';

/**
 * **************************************************************************
 * CONTROLADOR: SubscriptionController
 * DESCRIPCIÓN: Maneja los endpoints de suscripciones con Stripe.
 *
 *   POST /api/suscripciones/checkout  → Genera URL de pago de Stripe
 *   POST /api/suscripciones/webhook   → Stripe llama aquí al confirmar pago
 * **************************************************************************
 */
export class SubscriptionController {
  constructor(private createCheckoutSession: CreateCheckoutSessionUseCase) {}

  // POST /api/suscripciones/checkout
  checkout = async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const physioId = (req as any).user.id;

      if (!planId) {
        return res.status(400).json({ message: 'El campo planId es requerido.' });
      }

      const url = await this.createCheckoutSession.execute(planId, physioId);
      res.status(200).json({ url });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // POST /api/suscripciones/webhook
  // ⚠️ SIN authMiddleware — Stripe llama directamente a este endpoint.
  webhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ message: 'Falta la firma de Stripe.' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      // Suscripción creada o actualizada
      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated'
      ) {
        const subActiva = event.data.object as unknown as Subscription;
        const physioId  = subActiva.metadata?.physioId;

        if (physioId) {
          await PhysiotherapistModel.update(
            { plan_activo: subActiva.status === 'active' ? 'activo' : 'inactivo' },
            { where: { id_user: physioId } }
          );
          console.log(`✅ Plan actualizado para fisioterapeuta ID: ${physioId}`);
        }
      }

      // Suscripción cancelada o vencida
      if (event.type === 'customer.subscription.deleted') {
        const subCancelada = event.data.object as unknown as Subscription;
        const physioId     = subCancelada.metadata?.physioId;

        if (physioId) {
          await PhysiotherapistModel.update(
            { plan_activo: 'inactivo' },
            { where: { id_user: physioId } }
          );
          console.log(`❌ Plan desactivado para fisioterapeuta ID: ${physioId}`);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  };
}

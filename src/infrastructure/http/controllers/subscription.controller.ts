/**
 * **************************************************************************
 * CONTROLADOR: Suscripciones (Stripe)
 * **************************************************************************
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/CreateCheckoutSession.uc";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export class SubscriptionController {
  constructor(
    private readonly createCheckoutSession: CreateCheckoutSessionUseCase
  ) {}

  // POST /api/suscripciones/checkout
  checkout = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const url = await this.createCheckoutSession.execute(
        user.id,
        user.email
      );

      res.status(200).json({ url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // POST /api/suscripciones/webhook
  // Recibe eventos de Stripe (pago exitoso, cancelación, etc.)
  webhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("❌ Webhook signature inválida:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const physioId = session.metadata?.physioId;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (physioId) {
            await PhysiotherapistModel.update(
              {
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan_status: "active",
              },
              { where: { id_user: Number(physioId) } }
            );
            console.log(`✅ Suscripción activada para fisio ID: ${physioId}`);
          }
          break;
        }

        case "customer.subscription.deleted":
        case "customer.subscription.paused": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          await PhysiotherapistModel.update(
            { plan_status: "inactive" },
            { where: { stripe_customer_id: customerId } }
          );
          console.log(`⚠️ Suscripción cancelada/pausada para customer: ${customerId}`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          await PhysiotherapistModel.update(
            { plan_status: "past_due" },
            { where: { stripe_customer_id: customerId } }
          );
          console.log(`🔴 Pago fallido para customer: ${customerId}`);
          break;
        }

        default:
          console.log(`ℹ️ Evento no manejado: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("❌ Error procesando webhook:", error.message);
      res.status(500).json({ message: error.message });
    }
  };
}

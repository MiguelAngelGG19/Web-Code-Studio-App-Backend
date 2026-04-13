/**
 * **************************************************************************
 * CONTROLADOR: Suscripciones (Stripe)
 * Rutas completas requeridas por el frontend
 * **************************************************************************
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/CreateCheckoutSession.uc";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

// Definición de planes con sus Price IDs de Stripe
const PLANES: Record<string, { id_plan: number; name: string; patient_limit: number | null; appointment_limit_mo: number | null; routine_limit: number | null; logbook_limit_mo: number | null; tracking_limit_mo: number | null; price_id: string | null }> = {
  free: {
    id_plan: 0,
    name: "Plan Gratis",
    patient_limit: 5,
    appointment_limit_mo: 10,
    routine_limit: 10,
    logbook_limit_mo: 10,
    tracking_limit_mo: 10,
    price_id: null,
  },
  basico: {
    id_plan: 1,
    name: "Plan Basico",
    patient_limit: 20,
    appointment_limit_mo: 50,
    routine_limit: 30,
    logbook_limit_mo: 50,
    tracking_limit_mo: 100,
    price_id: process.env.STRIPE_PRICE_BASICO || null,
  },
  ilimitado: {
    id_plan: 2,
    name: "Plan Premium",
    patient_limit: null,
    appointment_limit_mo: null,
    routine_limit: null,
    logbook_limit_mo: null,
    tracking_limit_mo: null,
    price_id: process.env.STRIPE_PRICE_ILIMITADO || null,
  },
};

export class SubscriptionController {
  constructor(
    private readonly createCheckoutSession: CreateCheckoutSessionUseCase
  ) {}

  // ─────────────────────────────────────────────────────────
  // GET /api/publico/planes  — SIN autenticación
  // ─────────────────────────────────────────────────────────
  getPublicPlans = async (_req: Request, res: Response): Promise<void> => {
    const planes = Object.values(PLANES).map(({ price_id: _p, ...rest }) => rest);
    res.status(200).json({ data: planes });
  };

  // ─────────────────────────────────────────────────────────
  // GET /api/suscripciones/planes  — CON autenticación
  // ─────────────────────────────────────────────────────────
  getPlans = async (_req: Request, res: Response): Promise<void> => {
    const planes = Object.values(PLANES).map(({ price_id: _p, ...rest }) => rest);
    res.status(200).json({ data: planes });
  };

  // ─────────────────────────────────────────────────────────
  // GET /api/suscripciones/mi-plan  — CON autenticación
  // ─────────────────────────────────────────────────────────
  getMiPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const planStatus: string = physio.getDataValue("plan_status") || "inactive";
      const stripeSubId: string | null = physio.getDataValue("stripe_subscription_id");

      // Determinar id_plan según subscription de Stripe
      let currentPlanId = 0;
      let currentPlan = PLANES["free"];

      if (stripeSubId && planStatus === "active") {
        try {
          const subscription = await stripe.subscriptions.retrieve(stripeSubId);
          const priceId = subscription.items.data[0]?.price?.id;

          const planEntry = Object.entries(PLANES).find(([, p]) => p.price_id === priceId);
          if (planEntry) {
            const [, plan] = planEntry;
            currentPlanId = plan.id_plan;
            currentPlan = plan;
          }
        } catch {
          // Si falla Stripe, dejamos el plan free
        }
      }

      const { price_id: _p, ...planData } = currentPlan;

      res.status(200).json({
        data: {
          id_plan: currentPlanId,
          subscription_status: planStatus,
          plan: planData,
          stripe_subscription_id: stripeSubId,
          pending_plan_id: null,
          pending_plan: null,
          pending_plan_change_date: null,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // POST /api/suscripciones/checkout
  // ─────────────────────────────────────────────────────────
  checkout = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { planId } = req.body;

      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const planKey = planId || "basico";
      const plan = PLANES[planKey];

      if (!plan || !plan.price_id) {
        res.status(400).json({ message: "Plan no válido o sin precio configurado." });
        return;
      }

      // Crear o recuperar customer de Stripe
      let customerId: string = physio.getDataValue("stripe_customer_id");
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { physioId: String(user.id) },
        });
        customerId = customer.id;
        await PhysiotherapistModel.update(
          { stripe_customer_id: customerId },
          { where: { id_user: user.id } }
        );
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: plan.price_id, quantity: 1 }],
        mode: "subscription",
        success_url: `${frontendUrl}/fisio/subscripcion?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/fisio/subscripcion?checkout=cancel`,
        metadata: { physioId: String(user.id) },
      });

      res.status(200).json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // GET /api/suscripciones/confirmar-checkout
  // ─────────────────────────────────────────────────────────
  confirmarCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.query;

      if (!session_id) {
        res.status(400).json({ message: "session_id requerido." });
        return;
      }

      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      const physioId = session.metadata?.physioId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!physioId) {
        res.status(400).json({ message: "No se encontró physioId en la sesión." });
        return;
      }

      await PhysiotherapistModel.update(
        {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_status: "active",
        },
        { where: { id_user: Number(physioId) } }
      );

      res.status(200).json({ message: "Suscripción confirmada correctamente." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // POST /api/suscripciones/cambiar-plan
  // ─────────────────────────────────────────────────────────
  cambiarPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { planId } = req.body;

      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const stripeSubId: string | null = physio.getDataValue("stripe_subscription_id");

      if (!stripeSubId) {
        res.status(400).json({ message: "No tienes una suscripción activa en Stripe." });
        return;
      }

      const plan = PLANES[planId];
      if (!plan || !plan.price_id) {
        res.status(400).json({ message: "Plan no válido o sin precio configurado." });
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(stripeSubId);
      const itemId = subscription.items.data[0]?.id;

      await stripe.subscriptions.update(stripeSubId, {
        items: [{ id: itemId, price: plan.price_id }],
        proration_behavior: "always_invoice",
      });

      const { price_id: _p, ...planData } = plan;
      res.status(200).json({
        message: "Plan actualizado correctamente.",
        data: { id_plan: plan.id_plan, plan: planData, subscription_status: "active" },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // DELETE /api/suscripciones/cambio-pendiente
  // Cancela la suscripción al final del período (no inmediato)
  // ─────────────────────────────────────────────────────────
  cancelarCambioPendiente = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const stripeSubId: string | null = physio.getDataValue("stripe_subscription_id");

      if (!stripeSubId) {
        res.status(400).json({ message: "No tienes suscripción activa." });
        return;
      }

      // Reactivar la suscripción (quitar cancel_at_period_end si estaba programado)
      await stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: false,
      });

      res.status(200).json({ message: "Cambio pendiente cancelado. Tu plan actual se mantiene." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // POST /api/suscripciones/portal
  // ─────────────────────────────────────────────────────────
  abrirPortal = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const physio: any = await PhysiotherapistModel.findOne({
        where: { id_user: user.id },
      });

      if (!physio) {
        res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        return;
      }

      const customerId: string | null = physio.getDataValue("stripe_customer_id");

      if (!customerId) {
        res.status(400).json({ message: "No tienes un customer de Stripe asociado." });
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/fisio/subscripcion`,
      });

      res.status(200).json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // POST /api/suscripciones/webhook  — SIN autenticación (body raw)
  // ─────────────────────────────────────────────────────────
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

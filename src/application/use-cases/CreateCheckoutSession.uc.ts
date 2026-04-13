/**
 * **************************************************************************
 * CASO DE USO: Crear Sesión de Checkout en Stripe
 * **************************************************************************
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export class CreateCheckoutSessionUseCase {
  async execute(physioId: number, email: string): Promise<string> {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID as string,
          quantity: 1,
        },
      ],
      metadata: {
        physioId: String(physioId),
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    return session.url as string;
  }
}

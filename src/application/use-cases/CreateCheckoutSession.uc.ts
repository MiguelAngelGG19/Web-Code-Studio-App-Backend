import Stripe from 'stripe';

/**
 * **************************************************************************
 * CASO DE USO: CreateCheckoutSession
 * DESCRIPCIÓN: Crea una sesión de pago segura en Stripe para suscripciones.
 *              El usuario es redirigido a la página de Stripe (nunca pagamos
 *              desde el frontend propio).
 * **************************************************************************
 */
export class CreateCheckoutSessionUseCase {
  async execute(planId: string, physioId: string): Promise<string> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const prices: Record<string, string> = {
      basico:    process.env.STRIPE_PRICE_BASICO!,
      ilimitado: process.env.STRIPE_PRICE_ILIMITADO!
    };

    if (!prices[planId]) {
      throw new Error(`Plan no válido: "${planId}". Use "basico" o "ilimitado".`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: prices[planId], quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/planes?status=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/planes?status=cancel`,
      metadata: { physioId }
    });

    return session.url!;
  }
}

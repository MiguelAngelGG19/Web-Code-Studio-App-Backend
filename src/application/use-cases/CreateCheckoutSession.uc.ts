import Stripe from 'stripe';

type PlanId = 'basico' | 'ilimitado';

export class CreateCheckoutSessionUseCase {
  async execute(planId: string, physioId: string): Promise<string> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const prices: Record<PlanId, string> = {
      basico:    process.env.STRIPE_PRICE_BASICO!,
      ilimitado: process.env.STRIPE_PRICE_ILIMITADO!
    };

    if (!Object.keys(prices).includes(planId)) {
      throw new Error(`Plan no válido: "${planId}". Use "basico" o "ilimitado".`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: prices[planId as PlanId], quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/subscription?checkout=cancel`,
      
      // 🪄 FIX 1: Guardamos los datos en el recibo de compra (Para leerlos al regresar)
      metadata: { 
        physioId: String(physioId),
        planId: String(planId) 
      },
      // 🪄 FIX 2: Obligamos a Stripe a guardarlos en la Suscripción (Para el Portal y Webhooks futuros)
      subscription_data: {
        metadata: {
          physioId: String(physioId),
          planId: String(planId) 
        }
      }
    });

    return session.url!;
  }
}
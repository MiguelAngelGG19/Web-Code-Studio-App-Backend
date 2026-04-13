import Stripe from 'stripe';

/**
 * **************************************************************************
 * CASO DE USO: CreateCheckoutSession
 * DESCRIPCIÓN: Crea una sesión de pago segura en Stripe para suscripciones.
 * El usuario es redirigido a la página de Stripe (nunca pagamos
 * desde el frontend propio).
 * **************************************************************************
 */

// Tipos válidos de plan — esto evita el error rojo de TypeScript
type PlanId = 'basico' | 'ilimitado';

export class CreateCheckoutSessionUseCase {
  async execute(planId: string, physioId: string): Promise<string> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const prices: Record<PlanId, string> = {
      basico:    process.env.STRIPE_PRICE_BASICO!,
      ilimitado: process.env.STRIPE_PRICE_ILIMITADO!
    };

    // Validar que el planId recibido sea uno de los planes válidos
    if (!Object.keys(prices).includes(planId)) {
      throw new Error(`Plan no válido: "${planId}". Use "basico" o "ilimitado".`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: prices[planId as PlanId], quantity: 1 }],
      
      // 🪄 CORRECCIÓN: Rutas exactas que tu Frontend está esperando
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/subscription?checkout=cancel`,
      
      metadata: { physioId }
    });

    return session.url!;
  }
}
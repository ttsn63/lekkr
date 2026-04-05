import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import {
  deductBuyerReferralCredit,
  loadOrderForPostPayment,
  rewardReferrerIfFirstPaidOrder,
  runHellocashAfterOrder,
} from './_shared/referral-handlers'
import { sendOrderConfirmationEmail } from './_shared/order-email'
import { createSupabaseAdmin } from './_shared/supabase-admin'

export const handler: Handler = async (event) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!secret || !stripeKey) {
    return { statusCode: 500, body: 'Stripe Webhook nicht konfiguriert' }
  }

  const stripe = new Stripe(stripeKey)
  const sig = event.headers['stripe-signature']
  if (!sig || !event.body) {
    return { statusCode: 400, body: 'Missing signature or body' }
  }

  let evt: Stripe.Event
  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    return { statusCode: 400, body: msg }
  }

  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id ?? session.client_reference_id
    if (orderId) {
      const admin = createSupabaseAdmin()
      const pi = session.payment_intent
      const piId = typeof pi === 'string' ? pi : pi?.id ?? null
      await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          stripe_payment_intent: piId,
        })
        .eq('id', orderId)

      const { data: row } = await admin
        .from('orders')
        .select('tenant_id, user_id, coupon_id, discount_amount')
        .eq('id', orderId)
        .single()

      if (row?.tenant_id && row?.user_id) {
        await admin
          .from('cart_items')
          .delete()
          .eq('tenant_id', row.tenant_id as string)
          .eq('user_id', row.user_id as string)
      }

      const orderFull = await loadOrderForPostPayment(admin, orderId)
      if (orderFull) {
        const d = await deductBuyerReferralCredit(admin, orderFull)
        if (!d.ok) {
          console.error('[stripe-webhook] referral deduct', d.error)
        }
        await rewardReferrerIfFirstPaidOrder(admin, orderFull)
      }

      if (row?.coupon_id && row.user_id) {
        const { data: existingUsage } = await admin
          .from('coupon_usages')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle()
        if (!existingUsage) {
          await admin.from('coupon_usages').insert({
            tenant_id: row.tenant_id as string,
            coupon_id: row.coupon_id as string,
            order_id: orderId,
            user_id: row.user_id as string,
            discount_amount: Number(row.discount_amount ?? 0),
          })
        }
      }

      await runHellocashAfterOrder(admin, orderId)

      await sendOrderConfirmationEmail(admin, orderId)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}

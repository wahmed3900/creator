import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  // Created per request so the build does not need Stripe env vars
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-28.acacia" as any,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan || "max";
    const billingCycle = session.metadata?.billingCycle || "monthly";

    if (userId && session.subscription) {
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      // Fetch full subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Upsert the subscription record linked to the user
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan,
          interval: billingCycle,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan,
          interval: billingCycle,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
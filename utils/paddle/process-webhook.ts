import {
  type EventEntity,
  EventName,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
  type CustomerCreatedEvent,
  type CustomerUpdatedEvent,
  type TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk";
import {
  upsertCustomer,
  upsertSubscription,
  upsertTransaction,
} from "@/lib/db";

/**
 * Process verified Paddle webhook events idempotently.
 *
 * Handlers:
 * - subscription.created / updated / canceled -> upsert subscriptions
 * - customer.created / updated -> upsert customers
 * - transaction.completed -> upsert transactions
 * - other events -> safely ignored
 */
export async function processEvent(event: EventEntity): Promise<void> {
  console.log(`[Paddle Webhook] Processing event: ${event.eventType} (ID: ${event.eventId})`);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
      await handleSubscriptionEvent(
        event as
          | SubscriptionCreatedEvent
          | SubscriptionUpdatedEvent
          | SubscriptionCanceledEvent
      );
      break;

    case EventName.CustomerCreated:
    case EventName.CustomerUpdated:
      await handleCustomerEvent(
        event as CustomerCreatedEvent | CustomerUpdatedEvent
      );
      break;

    case EventName.TransactionCompleted:
      await handleTransactionCompletedEvent(
        event as TransactionCompletedEvent
      );
      break;

    default:
      console.log(`[Paddle Webhook] Unhandled event type safely ignored: ${event.eventType}`);
      break;
  }
}

async function handleSubscriptionEvent(
  event:
    | SubscriptionCreatedEvent
    | SubscriptionUpdatedEvent
    | SubscriptionCanceledEvent
): Promise<void> {
  const sub = event.data;
  const firstItem = sub.items?.[0];

  const priceId = firstItem?.price?.id || "";
  const productId = firstItem?.price?.productId || "";

  console.log(
    `[Paddle Webhook] Upserting subscription ${sub.id} for customer ${sub.customerId} (status: ${sub.status})`
  );

  upsertSubscription({
    subscription_id: sub.id,
    customer_id: sub.customerId,
    status: sub.status,
    price_id: priceId,
    product_id: productId,
    scheduled_change_action: sub.scheduledChange?.action ?? null,
    scheduled_change_at: sub.scheduledChange?.effectiveAt ?? null,
  });
}

async function handleCustomerEvent(
  event: CustomerCreatedEvent | CustomerUpdatedEvent
): Promise<void> {
  const customer = event.data;

  console.log(
    `[Paddle Webhook] Upserting customer ${customer.id} (${customer.email})`
  );

  const record = upsertCustomer(customer.id, customer.email);
  console.log(`[Paddle Webhook] Customer record after upsert:`, {
    customer_id: record.customer_id,
    email: record.email,
    updated_at: record.updated_at,
  });
}

async function handleTransactionCompletedEvent(
  event: TransactionCompletedEvent
): Promise<void> {
  const tx = event.data;

  console.log(
    `[Paddle Webhook] Upserting completed transaction ${tx.id} for customer ${tx.customerId}`
  );

  upsertTransaction({
    transaction_id: tx.id,
    customer_id: tx.customerId ?? null,
    status: tx.status,
    amount: tx.details?.totals?.total ?? null,
    currency_code: tx.currencyCode ?? null,
  });
}

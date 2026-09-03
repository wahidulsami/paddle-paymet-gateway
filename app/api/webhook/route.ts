import { NextRequest, NextResponse } from "next/server";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { processEvent } from "@/utils/paddle/process-webhook";

/**
 * Paddle Webhook Handler
 *
 * Requirements:
 * - Verify HMAC signature using `paddle.webhooks.unmarshal(rawBody, secret, signature)`
 * - Pass the RAW request body text directly without JSON.parse
 * - Use the notification signing secret (PADDLE_NOTIFICATION_WEBHOOK_SECRET), not the API key
 * - Return non-2xx status on verification error or missing secret so Paddle will retry
 * - Acknowledge with 200 on success
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? "";

  if (!signature || !rawBody) {
    console.warn("[Paddle Webhook] Rejected request: Missing paddle-signature header or empty body.");
    return NextResponse.json(
      { error: "Missing paddle-signature header or empty body" },
      { status: 400 }
    );
  }

  if (!secret) {
    console.error("[Paddle Webhook] Server error: PADDLE_NOTIFICATION_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret not configured on server" },
      { status: 500 }
    );
  }

  try {
    const paddle = getPaddleInstance();

    // Verify HMAC signature and unmarshal into typed EventEntity
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);

    if (eventData) {
      console.log(`[Paddle Webhook] Verified event: ${eventData.eventType} (ID: ${eventData.eventId})`);
      await processEvent(eventData);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Paddle Webhook] Signature verification or processing failed:", error);
    // Return non-2xx so Paddle will retry delivery per its retry policy
    return NextResponse.json(
      { error: "Webhook signature verification or processing failed" },
      { status: 500 }
    );
  }
}

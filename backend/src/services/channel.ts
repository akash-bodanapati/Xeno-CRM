import dotenv from 'dotenv';
import type { ChannelSendPayload } from '../types/index';

dotenv.config();

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL ?? '';
const CHANNEL_SERVICE_SECRET = process.env.CHANNEL_SERVICE_SECRET ?? '';

if (!CHANNEL_SERVICE_URL) {
  console.warn(
    '[channel] CHANNEL_SERVICE_URL is not set. Message sending will be a no-op.'
  );
}

/**
 * Calls the external Channel microservice to dispatch a single message.
 * Returns the external ID assigned by the channel provider (used for delivery callbacks).
 */
export async function sendMessage(payload: ChannelSendPayload): Promise<string> {
  if (!CHANNEL_SERVICE_URL) {
    // Simulate a successful send in dev when no channel service is configured.
    console.log('[channel] (mock) Sending message:', payload);
    return `mock-ext-${Date.now()}`;
  }

  const callbackUrl = process.env.CALLBACK_URL ?? 'http://localhost:3001/callbacks/delivery';

  const sendRequest = {
    communicationId: payload.metadata?.communication_id ?? '',
    recipientPhone: payload.channel !== 'email' ? payload.to : undefined,
    recipientEmail: payload.channel === 'email' ? payload.to : undefined,
    channel: payload.channel,
    message: payload.message,
    callbackUrl,
  };

  const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-secret': CHANNEL_SERVICE_SECRET,
    },
    body: JSON.stringify(sendRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Channel service responded with ${response.status}: ${text}`
    );
  }

  const data = (await response.json()) as { externalId?: string; external_id?: string };
  return data.externalId ?? data.external_id ?? '';
}


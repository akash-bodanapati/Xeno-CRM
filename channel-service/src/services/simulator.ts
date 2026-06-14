import fetch from 'node-fetch';
import type { SendRequest, CallbackPayload } from '../types/index';

/**
 * Sends a callback webhook update back to the main application CRM, with retries on failure.
 */
async function sendCallback(
  callbackUrl: string,
  payload: CallbackPayload,
  secret: string,
  attempt = 1
): Promise<void> {
  console.log(`[CALLBACK] posting status=${payload.status} to callbackUrl (Attempt ${attempt})`);
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-channel-secret': secret,
        'x-service-secret': secret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (err: any) {
    console.error(
      `[CALLBACK] attempt ${attempt} failed for external_id=${payload.external_id} status=${payload.status}:`,
      err.message
    );
    if (attempt < 3) {
      const delays = [1000, 2000, 4000];
      const delay = delays[attempt - 1] || 1000;
      console.log(
        `[RETRY] attempt ${attempt + 1} for external_id=${payload.external_id} status=${payload.status} in ${delay}ms`
      );
      setTimeout(() => {
        void sendCallback(callbackUrl, payload, secret, attempt + 1);
      }, delay);
    } else {
      console.error(
        `[CALLBACK] Max retry attempts reached for external_id=${payload.external_id} status=${payload.status}`
      );
    }
  }
}

/**
 * Simulates the async delivery flow for a message.
 */
export function simulateDelivery(_request: SendRequest, externalId: string): void {
  const callbackUrl = process.env.CALLBACK_URL ?? 'http://localhost:3001/api/callbacks/delivery';
  const secret = process.env.CHANNEL_SECRET ?? process.env.CHANNEL_SERVICE_SECRET ?? 'mysecret123';
  const sentDelay = Math.random() < 0.5 ? 0 : 1000 + Math.floor(Math.random() * 1000);

  console.log(`[SIMULATE] external_id=${externalId} → scheduling sent event in ${sentDelay}ms`);

  setTimeout(() => {
    const sentPayload: CallbackPayload = {
      external_id: externalId,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    void sendCallback(callbackUrl, sentPayload, secret);

    const isSuccessful = Math.random() < 0.9;
    const followupDelay = 3000;

    setTimeout(() => {
      if (isSuccessful) {
        const deliveredPayload: CallbackPayload = {
          external_id: externalId,
          status: 'delivered',
          timestamp: new Date().toISOString(),
        };

        void sendCallback(callbackUrl, deliveredPayload, secret);

        const isOpened = Math.random() < 0.6;
        if (isOpened) {
          setTimeout(() => {
            const openedPayload: CallbackPayload = {
              external_id: externalId,
              status: 'opened',
              timestamp: new Date().toISOString(),
            };

            void sendCallback(callbackUrl, openedPayload, secret);

            const isClicked = Math.random() < 0.3;
            if (isClicked) {
              setTimeout(() => {
                const clickedPayload: CallbackPayload = {
                  external_id: externalId,
                  status: 'clicked',
                  timestamp: new Date().toISOString(),
                };

                void sendCallback(callbackUrl, clickedPayload, secret);
              }, 12000);
            }
          }, 8000);
        }
      } else {
        const failedPayload: CallbackPayload = {
          external_id: externalId,
          status: 'failed',
          timestamp: new Date().toISOString(),
        };

        void sendCallback(callbackUrl, failedPayload, secret);
      }
    }, followupDelay);
  }, sentDelay);
}

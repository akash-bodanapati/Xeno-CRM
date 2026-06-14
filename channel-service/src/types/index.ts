export interface SendRequest {
  communicationId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  message: string;
  callbackUrl: string;
}

export interface CallbackPayload {
  external_id: string;
  status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
  timestamp: string;
}

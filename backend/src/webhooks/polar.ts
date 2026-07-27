import { Request, Response } from 'express';
// @ts-ignore
import { validateEvent } from '@polar-sh/sdk'; // Or standard webhooks verification matching Polar specs

export const polarWebhookHandler = (req: Request, res: Response) => {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  // Secure Environment Verification
  if (!webhookSecret) {
    res.status(503).json({ error: 'Webhook secret not configured' });
    return;
  }

  try {
    const rawBody = (req as any).rawBody; // Requires raw body middleware configuration
    const headers = {
      'webhook-id': req.headers['webhook-id'] as string,
      'webhook-timestamp': req.headers['webhook-timestamp'] as string,
      'webhook-signature': req.headers['webhook-signature'] as string,
    };

    // Verify and parse the event payload safely
    const event = validateEvent(rawBody, headers, webhookSecret);
    
    // Handle the event here (e.g., subscription created, order paid)
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid signature' });
  }
};

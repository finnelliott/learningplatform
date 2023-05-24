import { Webhook } from "svix";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import { WebhookEvent } from "@clerk/nextjs/server";
import type { IncomingHttpHeaders } from 'http';
import prisma from "@/../prisma/prismadb";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Replace with your webhook secret
if (!process.env.CLERK_WEBHOOK_SECRET) { throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable') }
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

// Convert headers to Record<string, string>
function convertHeaders(headers: IncomingHttpHeaders): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in headers) {
      if (typeof headers[key] === 'string') {
        result[key] = headers[key] as string;
      }
    }
    return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify webhook signature
  const payload = (await buffer(req)).toString();
  const headers = convertHeaders(req.headers);

  const webhook = new Webhook(WEBHOOK_SECRET);
  let event;
  try {
    event = webhook.verify(payload, headers);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // Handle webhook events
  const evt = event as WebhookEvent;
  switch (evt.type) {
    case 'user.created':
      // Handle new user creation
      const newUser = evt.data;
      const user = await prisma.user.create({
        data: {
            clerk_id: newUser.id,
        }
      })

      // Add your custom logic here

      break;

    // Add more cases to handle other webhook events if needed

    default:
      console.log('Unhandled event:', evt.type);
  }

  // Return a 200 status to acknowledge receipt of the webhook
  res.status(200).json({ received: true });
}
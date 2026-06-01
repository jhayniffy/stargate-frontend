import { z } from 'zod';

export const AVAILABLE_EVENTS = [
  'invoice.paid',
  'invoice.expired',
  'invoice.cancelled',
  'settlement.completed',
] as const;

export const webhookSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL (e.g. https://example.com/hook)' }),
  secret: z
    .string()
    .min(16, { message: 'Secret must be at least 16 characters' })
    .optional()
    .or(z.literal('')),
  events: z
    .array(z.string())
    .min(1, { message: 'Select at least one event type' }),
});

export type WebhookFormData = z.infer<typeof webhookSchema>;

export function validateWebhookUrl(url: string) {
  return z.string().url().safeParse(url);
}

export function parseWebhookSchema(data: unknown) {
  return webhookSchema.safeParse(data);
}

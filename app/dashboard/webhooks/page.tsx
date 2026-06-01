'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CopyField } from '@/components/ui/CopyField';
import { Input } from '@/components/ui/Input';
import { WebhookDeliveryLog } from '@/components/dashboard/WebhookDeliveryLog';
import { api } from '@/lib/api';
import { webhookSchema as schema, AVAILABLE_EVENTS } from '@/lib/webhooks';

type FormData = z.infer<typeof schema>;

export default function WebhooksPage() {
  const { data, mutate } = useSWR('webhooks', api.webhooks.list);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: '',
      secret: '',
      events: ['invoice.paid', 'invoice.expired'],
    },
  });

  async function onSubmit(data: FormData) {
    await api.webhooks.create({
      url: data.url,
      secret: data.secret || undefined,
      events: data.events,
    });
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  async function create(formData: FormData) {
    await api.webhooks.create({ url: formData.get('url'), events: ['invoice.paid', 'invoice.expired'] });
    mutate();
    // Only reset after a successful submission
    reset();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Webhooks</h1>
          <p className="text-sm text-slate-500">Endpoint delivery, event subscriptions, HMAC signatures, and retries.</p>
        </div>
      </div>

      {/* Registration form — controlled so fields are preserved on validation error */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
        noValidate
      >
        <div className="space-y-1">
          <Input
            {...register('url')}
            placeholder="https://example.com/stargate"
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? 'url-error' : undefined}
          />
          {errors.url && (
            <p id="url-error" role="alert" className="text-xs text-red-600">
              {errors.url.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Input
            {...register('secret')}
            placeholder="Signing secret (optional)"
            aria-invalid={!!errors.secret}
          />
        </div>

        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-slate-500">Event types</legend>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  value={event}
                  {...register('events')}
                  className="h-4 w-4 rounded border-slate-300 accent-violet"
                />
                {event}
              </label>
            ))}
          </div>
          {errors.events && (
            <p role="alert" className="text-xs text-red-600">
              {errors.events.message}
            </p>
          )}
        </fieldset>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering…' : 'Register'}
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-slate-200 bg-white">
          {(data ?? []).map((webhook: any) => (
            <div key={webhook.id} className="flex items-start justify-between border-b border-slate-100 p-4 text-sm">
              <div className="min-w-0 flex-1 space-y-2 pr-4">
                <div className="font-medium text-ink">{webhook.url}</div>
                <div className="text-xs text-slate-500">{webhook.events?.join(', ')}</div>
                {webhook.secret && (
                  <CopyField value={webhook.secret} label="Signing secret" masked />
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button className="bg-white text-ink ring-1 ring-slate-300" onClick={() => api.webhooks.deliveries(webhook.id)}>Deliveries</Button>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-slate-200 bg-white">
          {(data ?? []).map((webhook: any) => (
            <div key={webhook.id} className="flex items-center justify-between border-b border-slate-100 p-4 text-sm">
              <div>
                <div className="font-medium text-ink">{webhook.url}</div>
                <div className="mt-1 text-xs text-slate-500">{webhook.events?.join(', ')}</div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white text-ink ring-1 ring-slate-300" onClick={() => setSelectedWebhook(selectedWebhook === webhook.id ? null : webhook.id)}>
                  {selectedWebhook === webhook.id ? 'Hide' : 'Logs'}
                </Button>
                <Button className="bg-red-700" onClick={async () => { await api.webhooks.remove(webhook.id); mutate(); }}>Delete</Button>
              </div>
            </div>
          ))}
          {!(data ?? []).length && <div className="p-6 text-sm text-slate-500">No webhook endpoints yet.</div>}
        </div>

        <Card className="space-y-3">
          <h2 className="font-semibold text-ink">Event simulator</h2>
          <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option>invoice.paid</option>
            <option>invoice.expired</option>
            <option>invoice.cancelled</option>
            <option>settlement.completed</option>
          </select>
          <pre className="max-h-52 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify({ event: 'invoice.paid', invoice_id: 'inv_demo', amount: '49.00', currency: 'USDC' }, null, 2)}</pre>
          <Button className="w-full">Send test event</Button>
        </Card>
      </div>
      {selectedWebhook && <WebhookDeliveryLog webhookId={selectedWebhook} />}
    </div>
  );
}

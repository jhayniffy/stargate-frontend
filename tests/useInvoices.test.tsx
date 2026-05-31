import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { useInvoices } from '../hooks/useInvoices';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const makeInvoice = (id: string) => ({
  id,
  merchant_id: 'merchant-1',
  amount_usdc: '10.00',
  gross_usdc: '10.00',
  fee_usdc: '0.10',
  net_usdc: '9.90',
  status: 'pending',
  muxed_address: 'MDEMO',
  payment_url: `http://localhost:3000/pay/${id}`,
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  created_at: '2024-01-01T00:00:00Z',
});

describe('useInvoices', () => {
  it('cursor construction: passes query string verbatim to the API path', async () => {
    const captured: string[] = [];
    server.use(
      http.get(`${API_URL}/invoices`, ({ request }) => {
        captured.push(new URL(request.url).search);
        return HttpResponse.json({ page: 1, limit: 20, total: 0, items: [] });
      })
    );

    const { result } = renderHook(() => useInvoices('?status=paid&page=2'));
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(captured[0]).toBe('?status=paid&page=2');
  });

  it('page increment: returns items for page 1 and page 2 queries independently', async () => {
    server.use(
      http.get(`${API_URL}/invoices`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        const id = page === '2' ? 'inv-page2' : 'inv-page1';
        return HttpResponse.json({ page: Number(page), limit: 20, total: 2, items: [makeInvoice(id)] });
      })
    );

    const { result: r1 } = renderHook(() => useInvoices('?page=1'));
    const { result: r2 } = renderHook(() => useInvoices('?page=2'));

    await waitFor(() => expect(r1.current.data).toBeDefined());
    await waitFor(() => expect(r2.current.data).toBeDefined());

    expect(r1.current.data?.items[0].id).toBe('inv-page1');
    expect(r1.current.data?.page).toBe(1);
    expect(r2.current.data?.items[0].id).toBe('inv-page2');
    expect(r2.current.data?.page).toBe(2);
  });

  it('empty-state detection: items array is empty and total is 0', async () => {
    server.use(
      http.get(`${API_URL}/invoices`, () =>
        HttpResponse.json({ page: 1, limit: 20, total: 0, items: [] })
      )
    );

    const { result } = renderHook(() => useInvoices());
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.items).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it('default query is empty string (no query params appended)', async () => {
    const captured: string[] = [];
    server.use(
      http.get(`${API_URL}/invoices`, ({ request }) => {
        captured.push(new URL(request.url).search);
        return HttpResponse.json({ page: 1, limit: 20, total: 0, items: [] });
      })
    );

    const { result } = renderHook(() => useInvoices());
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(captured[0]).toBe('');
  });
});

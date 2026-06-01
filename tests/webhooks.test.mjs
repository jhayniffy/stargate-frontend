import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWebhookSchema } from '../lib/webhooks.ts';

test('webhook URL validation', async (t) => {
  await t.test('rejects empty URL', () => {
    const result = parseWebhookSchema({ url: '', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.errors[0].message, /valid URL/);
    }
  });

  await t.test('rejects malformed URL', () => {
    const result = parseWebhookSchema({ url: 'not-a-url', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.errors[0].message, /valid URL/);
    }
  });

  await t.test('rejects URL without protocol', () => {
    const result = parseWebhookSchema({ url: 'example.com/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.errors[0].message, /valid URL/);
    }
  });

  await t.test('accepts valid https URL', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts valid http URL with port', () => {
    const result = parseWebhookSchema({ url: 'http://localhost:3001/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts URL with query parameters', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook?token=abc', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });
});

test('webhook secret length validation', async (t) => {
  await t.test('accepts missing secret', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts empty string secret', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: '', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('rejects secret shorter than 16 characters', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'short', events: ['invoice.paid'] });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.errors[0].message, /at least 16/);
    }
  });

  await t.test('accepts secret with exactly 16 characters', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: '1234567890123456', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts secret longer than 16 characters', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts secret with special characters', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'abc!@#$%^&*()_+=-123', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });
});

test('webhook event type validation', async (t) => {
  await t.test('rejects empty events array', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: [] });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.errors[0].message, /at least one/);
    }
  });

  await t.test('rejects missing events field', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!' });
    assert.equal(result.success, false);
  });

  await t.test('accepts a single event type', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });

  await t.test('accepts multiple event types', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: ['invoice.paid', 'invoice.expired', 'settlement.completed'] });
    assert.equal(result.success, true);
  });

  await t.test('rejects events as non-array', () => {
    const result = parseWebhookSchema({ url: 'https://example.com/hook', secret: 'a-really-long-secret-key!', events: 'invoice.paid' });
    assert.equal(result.success, false);
  });
});

test('webhook validation - combined edge cases', async (t) => {
  await t.test('rejects all invalid fields simultaneously', () => {
    const result = parseWebhookSchema({ url: 'bad', secret: 'x', events: [] });
    assert.equal(result.success, false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      assert.match(messages, /valid URL/);
      assert.match(messages, /at least 16/);
      assert.match(messages, /at least one/);
    }
  });

  await t.test('accepts minimal valid input', () => {
    const result = parseWebhookSchema({ url: 'https://hook.example.com', events: ['invoice.paid'] });
    assert.equal(result.success, true);
  });
});

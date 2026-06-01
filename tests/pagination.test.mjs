import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPageQuery, nextPage, isEmpty } from '../lib/pagination.js';

// ── buildPageQuery ─────────────────────────────────────────────────────────
test('buildPageQuery – returns empty string when no params', () => {
  assert.equal(buildPageQuery({}), '');
});

test('buildPageQuery – builds correct query with page and limit', () => {
  const q = buildPageQuery({ page: 1, limit: 20 });
  assert.equal(q, '?page=1&limit=20');
});

test('buildPageQuery – includes extra filter params', () => {
  const q = buildPageQuery({ page: 2, limit: 10, status: 'paid' });
  assert.ok(q.includes('page=2'), 'should include page');
  assert.ok(q.includes('limit=10'), 'should include limit');
  assert.ok(q.includes('status=paid'), 'should include status filter');
});

test('buildPageQuery – omits undefined values', () => {
  const q = buildPageQuery({ page: 1, limit: undefined });
  assert.equal(q, '?page=1');
});

test('buildPageQuery – encodes special characters in values', () => {
  const q = buildPageQuery({ page: 1, search: 'hello world' });
  assert.ok(q.includes('hello%20world'), 'should URL-encode spaces');
});

// ── nextPage ───────────────────────────────────────────────────────────────
test('nextPage – returns 2 when on page 1 with more items', () => {
  assert.equal(nextPage(1, 20, 50), 2);
});

test('nextPage – returns null when last page is reached', () => {
  assert.equal(nextPage(3, 20, 60), null);
});

test('nextPage – returns null when total equals one full page', () => {
  assert.equal(nextPage(1, 20, 20), null);
});

test('nextPage – returns 2 when total is one more than page size', () => {
  assert.equal(nextPage(1, 20, 21), 2);
});

test('nextPage – increments correctly across multiple pages', () => {
  assert.equal(nextPage(1, 10, 35), 2);
  assert.equal(nextPage(2, 10, 35), 3);
  assert.equal(nextPage(3, 10, 35), 4);
  assert.equal(nextPage(4, 10, 35), null); // 4*10=40 >= 35
});

// ── isEmpty ────────────────────────────────────────────────────────────────
test('isEmpty – returns true when total is 0', () => {
  assert.equal(isEmpty(0), true);
});

test('isEmpty – returns false when total is greater than 0', () => {
  assert.equal(isEmpty(1), false);
  assert.equal(isEmpty(100), false);
});

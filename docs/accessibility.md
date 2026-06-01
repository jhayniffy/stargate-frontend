# Accessibility

## Target Conformance

This project targets **WCAG 2.1 Level AA** conformance.

### Success Criteria Covered

| Criterion | Level | How We Address It |
|---|---|---|
| **1.1.1 Non-text Content** | A | Images have `alt` attributes; SVGs use `aria-hidden="true"` and are accompanied by visible/screen-reader text |
| **1.3.1 Info and Relationships** | A | Semantic HTML (`<section>`, `<button>`, `<input>`) with ARIA roles (`role="dialog"`, `role="progressbar"`, `role="status"`) |
| **1.3.5 Identify Input Purpose** | AA | Form inputs use `autocomplete` attributes where applicable |
| **1.4.1 Use of Color** | A | No information conveyed by color alone; icons and labels supplement color cues |
| **1.4.3 Contrast (Minimum)** | AA | Tailwind default color palette meets 4.5:1 ratio for normal text and 3:1 for large text |
| **1.4.4 Resize Text** | AA | No fixed font sizes; layout accommodates 200% browser zoom |
| **1.4.10 Reflow** | AA | Responsive layout with Tailwind breakpoints; no horizontal scroll at 320px width |
| **1.4.11 Non-text Contrast** | AA | Focus indicators, borders, and UI components meet 3:1 contrast ratio |
| **1.4.12 Text Spacing** | AA | No `!important` overrides that block user-agent text spacing |
| **2.1.1 Keyboard** | A | All interactive elements are natively focusable; modal has a focus trap with Tab/Shift+Tab |
| **2.1.2 No Keyboard Trap** | A | Modal focus trap includes Escape key to dismiss |
| **2.4.1 Bypass Blocks** | A | Semantic landmarks (`<nav>`, `<main>`, `<footer>`) assist skip navigation |
| **2.4.3 Focus Order** | A | Logical DOM order; modals move focus to first focusable element on open |
| **2.4.4 Link Purpose (In Context)** | A | Link text describes its destination; `aria-label` disambiguates icon-only links |
| **2.4.6 Headings and Labels** | AA | Form inputs paired with `<label>` or `aria-label`; page headings follow a logical hierarchy |
| **2.4.7 Focus Visible** | AA | `focus-visible` outlines via Tailwind's `focus:ring-2` and `focus:border-violet` |
| **2.5.3 Label in Name** | A | Accessible names match visible labels (e.g. button text matches `aria-label`) |
| **3.2.1 On Focus** | A | No context changes on focus |
| **3.3.1 Error Identification** | A | Form validation errors are displayed with `aria-describedby` linking to the input |
| **3.3.2 Labels or Instructions** | A | All inputs have associated labels or `aria-label` |
| **3.3.3 Error Suggestion** | AA | Error messages describe what's wrong and how to fix it |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | AA | Payment confirmation step before submission |
| **4.1.2 Name, Role, Value** | A | Custom components (Modal, RateLimitIndicator, CopyButton) expose proper ARIA attributes |
| **4.1.3 Status Messages** | AA | `role="status"` and `aria-live="polite"` used for dynamic updates (CopyButton tooltip) |

### Tools & Testing Layers

| Layer | Tool | Frequency |
|---|---|---|
| Static analysis | `eslint-plugin-jsx-a11y` (via `eslint-config-next`) | On every `npm run lint` |
| Unit tests | `@testing-library/jest-dom` (custom matchers) | On every `npm test` |
| Automated audit | `axe-core` via `@axe-core/playwright` | In CI (see below) |
| Visual review | Storybook + manual testing | During development |
| Screen reader | Manual testing (VoiceOver, NVDA) | Before release |

---

## Running axe-core in CI

The project uses [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright) to run automated accessibility audits against key pages.

### Test File

**[`tests/accessibility.test.mjs`](../tests/accessibility.test.mjs)** — runs axe-core on:

- `/` (marketing landing page)
- `/login`
- `/register`
- `/pay/demo_invoice_id` (payment page)
- `/pay/demo_invoice_id/success` (checkout success page)

### Local Execution

Start the dev server in one terminal:

```bash
npm run dev
```

In another terminal, run the accessibility tests:

```bash
BASE_URL=http://localhost:3000 node --test tests/accessibility.test.mjs
```

### CI Integration

The axe-core tests are part of `npm test` which runs:

```bash
node --test tests/*.test.mjs
```

The CI workflow (`.github/workflows/frontend-ci.yml`) needs a running server before executing tests. To wire it up properly, add a `start-server-and-test` step:

```yaml
- run: npm ci
- run: npm run build
- name: Start server and run tests
  run: |
    npx start-server-and-test 'npm start -- -p 3000' http://localhost:3000 'npm test'
- run: npm run build:widget
```

Alternatively, install `start-server-and-test` as a dev dependency and add a dedicated script:

```bash
npm install -D start-server-and-test
```

```jsonc
// package.json
{
  "scripts": {
    "test:a11y": "BASE_URL=http://localhost:3000 node --test tests/accessibility.test.mjs",
    "test:a11y:ci": "start-server-and-test 'npm start -- -p 3000' http://localhost:3000 'npm run test:a11y'"
  }
}
```

### Adding New Routes

To audit a new page, add a test block following the existing pattern in `tests/accessibility.test.mjs`:

```js
test('description of page has zero axe violations', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/your-route`, { waitUntil: 'networkidle' });

  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page }).analyze();
  assert.equal(results.violations.length, 0, JSON.stringify(results.violations, null, 2));

  await browser.close();
});
```

### axe-core Configuration

The `AxeBuilder` instance can be customised with tag filters, rules to disable, and context exclusions:

```js
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .disableRules(['color-contrast'])
  .exclude('.excluded-selector')
  .analyze();
```

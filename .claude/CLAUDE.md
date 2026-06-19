# CLAUDE.md — Low-Code AI Architect Chrome Extension

This file is the single source of truth for Claude Code working on this project.
Read it fully before making any changes.

---

## Project overview

A Chrome extension that takes a Make.com or n8n JSON blueprint, sends it to an
n8n workflow for AI analysis, generates a step-by-step README, and pushes it to
GitHub after human approval. Built with React + Vite, no TypeScript.

---

## File structure

```
my-extension/
├── public/
│   ├── manifest.json        Chrome extension manifest (MV3)
│   ├── pipeline_icon_v2.png Extension icon (128px PNG)
│   └── favicon.svg
├── src/
│   ├── App.jsx              Main UI — all views and state
│   ├── flowmondo.css        flowmondo brandguide bundle (tokens+base+utilities+components) — do not edit, re-copy from brandguide/dist/css/flowmondo.css
│   ├── forms.css            Cloned field-component chrome (label/input/textarea/select/checkbox) — brandguide ships this only as id-scoped demo CSS, so it's recreated here with real class names per W2/W4
│   ├── api.js               All n8n webhook calls and polling logic
│   ├── main.jsx             React entry point — do not edit
│   └── index.css            Root body styles — do not edit
├── .env.local               Webhook URLs (not committed to git)
├── index.html               Vite HTML entry — do not edit
├── vite.config.js           Vite config — do not edit
└── package.json
```

---

## Tech stack

- **React 19** with hooks, no TypeScript
- **Vite 8** for bundling
- **Plain CSS** — no Tailwind, no CSS modules, no styled-components. Styling follows
  the flowmondo brandguide (`brandguide/` submodule): `src/flowmondo.css` is the
  vendored design-system bundle, `src/forms.css` clones the one component the
  bundle ships only as scoped demo CSS. Compose UI from flowmondo's component
  classes (`.btn`, `.fm-alert`, `.badge`, `.checkbox`) and utility classes
  (`flex`, `gap-*`, `p-*`, `bg-*`, `text-*`, `radius-*`) — never invent a new
  bespoke class when an existing token-backed utility or component covers it
- **No external UI libraries**
- **Chrome Extension Manifest V3**
- Fonts: Tilt Warp (headings only), Inter (all UI/body text), JetBrains Mono
  (code/stat counters only) — self-hosted as `.ttf` files in `public/fonts/`,
  loaded via `@font-face` inside `flowmondo.css`

---

## Key rules

- Never use `localStorage` for job state — use `chrome.storage.local` via the
  helpers in `api.js` (`saveJobToStorage`, `getJobFromStorage`, `clearJobFromStorage`)
- Never inline styles for anything covered by a CSS class — use the class
- All API calls live in `api.js` — never add fetch calls directly in `App.jsx`
- No comments in code
- No TypeScript — stay in plain JS/JSX
- After any code change, run `npm run build` and reload the extension in
  `chrome://extensions` to test

---

## Environment variables

Stored in `.env.local` at the project root. Vite bakes these into the bundle
at build time. They are not secret — do not store sensitive credentials here.

```
VITE_WEBHOOK_REGISTER=https://your-n8n.com/webhook/register
VITE_WEBHOOK_GENERATE=https://your-n8n.com/webhook/generate
VITE_WEBHOOK_STATUS=https://your-n8n.com/webhook/status
VITE_WEBHOOK_APPROVE=https://your-n8n.com/webhook/approve
```

Reference in code as `import.meta.env.VITE_WEBHOOK_*`.

---

## View states

Managed by the `VIEW` enum in `App.jsx`. The app has four views:

| View | Constant | Description |
|---|---|---|
| Registration | `VIEW.REGISTER` | First-time setup. Shown if `localStorage.registered` is not set |
| Initial | `VIEW.INITIAL` | Main form — blueprint, commit info, advanced fields |
| Pending | `VIEW.PENDING` | Waiting for n8n to finish processing. Polls every 5s |
| Approval | `VIEW.APPROVAL` | Shows generated docs. User approves or declines |

State transitions:
- Register → Initial (on successful registration)
- Initial → Pending (on generate, after receiving jobId)
- Pending → Approval (when polling receives `status: "complete"`)
- Approval → Initial (on approve, after GitHub push confirmed)
- Approval → Pending (on decline, after receiving new jobId)
- Any → Initial (on error)

---

## State reference (App.jsx)

```
theme              — 'light' | 'dark', persisted to localStorage
view               — current VIEW constant
regName            — registration: full name
regEmail           — registration: email
regGithub          — registration: GitHub username
blueprint          — raw JSON blueprint string
message            — git commit message
description        — git commit description
showAdvanced       — controls advanced section animation
clickupTask        — optional ClickUp task ID
freshdeskTicket    — optional Freshdesk ticket ID
loomLink           — optional Loom URL
status             — status bar message shown to user
workflowName       — populated from polling onComplete
moduleCount        — populated from polling onComplete
connCount          — populated from polling onComplete
naming             — populated from polling onComplete
improvements       — string[], populated from polling onComplete
docOutput          — README markdown, populated from polling onComplete
jobId              — active job ID, also stored in chrome.storage.local
confirmed          — approval gate checkbox
suggestedChanges   — decline reason / reprocess instructions
```

---

## api.js reference

### Webhook functions

```js
registerUser({ name, email, github })
  // POST VITE_WEBHOOK_REGISTER
  // Returns: { success: true }

submitBlueprint({ blueprint, commitMessage, commitDescription,
                  clickupTask, freshdeskTicket, loomLink, user })
  // POST VITE_WEBHOOK_GENERATE
  // Returns: { jobId }

checkJobStatus(jobId)
  // POST VITE_WEBHOOK_STATUS
  // Returns: { status: 'pending' }
  //       or { status: 'complete', workflowName, moduleCount,
  //            connectionCount, namingConvention, improvements, documentation }
  //       or { status: 'error', message }

submitApproval({ jobId, decision, suggestedChanges, user? })
  // POST VITE_WEBHOOK_APPROVE
  // decision: 'approved' | 'declined'
  // Returns on approve: { message }
  // Returns on decline: { jobId }  ← new jobId to poll
```

### Storage helpers

```js
saveJobToStorage(jobId)      // writes to chrome.storage.local
clearJobFromStorage()        // removes from chrome.storage.local
getJobFromStorage()          // returns Promise<jobId | null>
```

### Polling helpers

```js
startPolling(jobId, { onComplete, onError })
  // polls checkJobStatus every 5000ms
  // calls onComplete(data) when status === 'complete'
  // calls onError(message) when status === 'error'
  // network errors are logged and retried — they do not stop polling

stopPolling()
  // clears the interval
  // called on component unmount via useEffect cleanup
  // called automatically by startPolling before starting a new poll
```

---

## CSS design system

The extension follows the **flowmondo brandguide** (`brandguide/` git submodule —
its own `CLAUDE.md` and `dist/BRAND.md` are the canonical rules). `src/flowmondo.css`
is a verbatim copy of `brandguide/dist/css/flowmondo.css` (only the three
`@font-face` `src:` paths are rewritten to `/fonts/...ttf` so fonts are self-hosted
instead of loaded from the submodule or a remote CDN). Never hand-edit
`flowmondo.css` — re-copy it from the submodule and re-apply the font path fix if
the brandguide changes.

All design tokens are CSS custom properties defined in `flowmondo.css`'s tokens
layer (`--surface-*`, `--text-*`, `--border-*`, `--font-*`, `--_ui-styles---*`).
Dark mode overrides are already built into that file and activate via
`[data-theme="dark"]` set on `document.documentElement` (see the `theme` `useEffect`
in `App.jsx`) — no extra dark-mode CSS is ever needed in this project.

### Hard rules (inherited from the brandguide — see `brandguide/dist/BRAND.md`)

- Every colour must resolve to a token from `flowmondo.css` — no raw hex/rgb
- `flowmondo` is always lowercase in copy (except first word of a title)
- Body text uses `var(--text-body)` / `.text-color-body` — never pure black
- Tilt Warp for headings only (`.heading-style-*`), Inter for all other UI/body
  text (the default), JetBrains Mono only for code/counters (e.g. stat numbers)
- Pill radius on tags/badges; buttons are 12px radius (`.btn`), deliberately not
  pill-shaped
- No inline `style={{ }}` attributes — reach for a utility class or, if nothing
  covers it, add a real class to `forms.css`
- UK English, no em dashes, no emoji in user-facing copy

### Component classes in use

```
.btn / .btn.secondary / .btn.link / .btn.is-destructive / .btn.icon-only
                 flowmondo button variants — see brandguide/dist/style-guide.html#button
.fm-alert / .fm-inline-alert  is-error / is-warning / is-info / is-success
                 Status messaging — see brandguide/dist/style-guide.html#inline-alert
.checkbox        Native checkbox styling (accent-color: brand pink)
```

### Utility classes in use (from flowmondo.css's utilities layer)

```
flex, flex-col, items-center, items-start, justify-between, justify-end, gap-*
p-*, px-*, py-*, mt-*, mb-*, w-full
bg-canvas, bg-muted, bg-default
border-subtle, radius-small, radius-medium
heading-style-h4, text-size-*, text-color-primary/body/muted, text-weight-*
font-mono   used on stat-counter values, per the brandguide's
            "JetBrains Mono for numeric stats/counters" rule
```

### Project-specific classes (`src/forms.css`)

The brandguide's field/form component (`brandguide/dist/components/field/`) is only
shipped as CSS scoped under `#field` (a style-guide-page artefact, not a portable
class) — so `forms.css` clones its verbatim property values into real, reusable
classes, all still built from brandguide tokens:

```
.field           Label + input/textarea wrapper (label, .required/.optional spans, .hint)
.field-row       Two .field side by side (ClickUp + Freshdesk)
.checkbox-row    <label> wrapping <input type="checkbox" class="checkbox"> + text
.search-field    Wraps a .field input with a trailing icon (ClickUp/Freshdesk search)
.advanced-toggle / .advanced-content / .advanced-inner
                 Grid-row animated disclosure for the Advanced section
.divider         1px horizontal rule using --border-subtle
```

If the brandguide ever ships a portable field/disclosure component, prefer it and
delete the matching rules from `forms.css`.

---

## n8n webhook contracts

### POST /register

Receives:
```json
{ "name": "Alex Smith", "email": "alex@co.com", "github": "alexsmith" }
```
Returns:
```json
{ "success": true }
```

### POST /generate

Receives:
```json
{
  "blueprint": "{ ... }",
  "commitMessage": "Add payment module",
  "commitDescription": "Adds Stripe to checkout flow",
  "clickupTask": "TASK-123",
  "freshdeskTicket": "FD-456",
  "loomLink": "https://loom.com/share/abc",
  "user": { "name": "Alex Smith", "email": "alex@co.com", "github": "alexsmith" }
}
```
Returns:
```json
{ "jobId": "job_abc123" }
```
n8n must respond immediately with a jobId and process async.

### POST /status

Receives:
```json
{ "jobId": "job_abc123" }
```
Returns one of:
```json
{ "status": "pending" }

{
  "status": "complete",
  "workflowName": "Stripe Checkout Flow",
  "moduleCount": 12,
  "connectionCount": 8,
  "namingConvention": "camelCase",
  "improvements": ["Rename HTTP Request 3", "Add error handling"],
  "documentation": "## Stripe Checkout Flow\n\n..."
}

{ "status": "error", "message": "Could not parse blueprint" }
```
`improvements` must always be an array — use `[]` if none.
`status` must be exactly `"pending"`, `"complete"`, or `"error"`.

### POST /approve

Receives on approve:
```json
{
  "jobId": "job_abc123",
  "decision": "approved",
  "suggestedChanges": null,
  "user": { "name": "Alex Smith", "github": "alexsmith" }
}
```
Returns on approve:
```json
{ "message": "README pushed to GitHub successfully." }
```

Receives on decline:
```json
{
  "jobId": "job_abc123",
  "decision": "declined",
  "suggestedChanges": "Please reword the intro and fix module names"
}
```
Returns on decline:
```json
{ "jobId": "job_def456" }
```
The new jobId is immediately polled by the extension. n8n must reprocess
using the original blueprint + suggestedChanges, create a new job, and
return its ID. This cycle repeats until the user approves.

---

## Build and load

```bash
npm run build        # compiles src/ into dist/
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked → select the `dist/` folder
4. After any change: `npm run build` then click ↺ on the extension card

If you changed a content script, also reload the active tab.
The popup does not need a tab reload — just rebuild and refresh the extension.
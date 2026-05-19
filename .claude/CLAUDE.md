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
│   ├── App.css              All styles and design tokens
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
- **Plain CSS** — no Tailwind, no CSS modules, no styled-components
- **No external UI libraries**
- **Chrome Extension Manifest V3**
- Font: DM Sans + DM Mono (loaded via Google Fonts in index.html)

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

All tokens are CSS custom properties on `:root`. Dark mode overrides via
`[data-theme="dark"]` set on `document.documentElement`.

### Colour tokens

```
--color-bg              Page background
--color-bg-subtle       Stat cards, subtle surfaces
--color-bg-muted        Read-only inputs
--color-bg-white        Editable inputs, buttons
--color-text-primary    Headings, values
--color-text-secondary  Labels, secondary text, placeholders label
--color-text-placeholder Input placeholder text
--color-text-muted      Stat labels
--color-border          Input borders
--color-border-subtle   Stat card borders, dividers
--color-accent          #E91E63 — primary button, focus ring, checkbox
--color-accent-fg       White — text on accent
--color-approve         Green — approve button
--color-decline         Red — decline button
--color-warning-bg/border/text  Improvements box
```

### Typography tokens

```
--font-sans     DM Sans
--font-mono     DM Mono — used on readonly inputs
--text-title    1.125rem  Page title
--text-section  0.875rem  Section headings
--text-body     0.8125rem Default body / inputs
--text-meta     0.6875rem Labels, notes, small text
--text-stat     1.25rem   Stat card values
```

### Spacing tokens

```
--space-1  4px
--space-2  8px
--space-3  12px
--space-4  16px
--space-5  20px
--space-6  24px
--r-sm     4px  Checkboxes, small buttons
--r-md     6px  Inputs, primary buttons
--r-lg     8px  Stat cards, improvements box
--height-input     2.125rem  Single-line inputs
--height-textarea  8rem      Multi-line textareas
```

### Key CSS classes

```
.popup           Flex column container, 16px padding and gap
.popup-header    Flex row — page title left, theme toggle right
.field           Label + input wrapper, enforces left-aligned labels
.field-row       Two .field side by side (used for ClickUp + Freshdesk)
.btn-primary     Accent background button (full width)
.btn-secondary   Outlined button (full width)
.btn-approve     Green approve button (flex: 1 inside .btn-row)
.btn-decline     Red decline button (flex: 1 inside .btn-row)
.btn-row         Flex row for approve/decline pair
.stat-grid       3-column grid for stat cards
.stat-card       Individual stat card
.stat-value      Large number inside stat card
.stat-label      Uppercase small label inside stat card
.improvements-box Warning-coloured box for AI suggestions
.divider         0.5px horizontal rule
.advanced-toggle Chevron button for advanced section
.advanced-content Grid-row animated collapsible wrapper
.advanced-inner  Inner content of collapsible
.search-input-wrap Input with trailing search icon
.checkbox-row    Custom checkbox + label row
.checkbox-box    The visual checkbox square (add .checked for filled state)
.theme-toggle    Icon-only button for light/dark toggle
.reg-header      Top-right container for theme toggle on register page
.h-input         Sets height to --height-input
.h-textarea      Sets height to --height-textarea
```

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
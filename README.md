# Low-Code AI Architect

A Chrome extension that takes a Make.com or n8n JSON blueprint, sends it to an n8n workflow for AI analysis, generates a step-by-step README, and pushes it to GitHub after human approval.

---

## Tech stack

- **React 19** + **Vite 8** — no TypeScript, plain JS/JSX
- **Plain CSS** with CSS custom properties — no Tailwind or component libraries
- **Chrome Extension Manifest V3**
- **n8n** for webhook orchestration and AI processing
- **Airtable** for user and job record storage
- Fonts: DM Sans + DM Mono

---

## Views

| View | Description |
|---|---|
| Register | First-time setup. Request access or log in with an existing User ID |
| Initial | Main form — blueprint, commit info, advanced fields |
| Pending | Waiting for n8n to finish processing. Polls every 5s |
| Approval | Shows generated docs. User approves or declines |

---

## Authentication

Users request access via the register form. An administrator approves the account in Airtable and the user receives a User ID. Sessions persist for 7 days and can be ended via the sign out button.

Login responses from n8n:
- `{ "found": true, "name": "...", "email": "...", "github": "..." }` — success
- `{ "found": false, "reason": "pending" }` — account awaiting approval
- `{ "found": false, "reason": "invalid" }` — User ID not found

---

## Webhooks

All webhook URLs are set in `.env.local` and baked into the bundle at build time.

```
VITE_WEBHOOK_REGISTER=https://...
VITE_WEBHOOK_LOGIN=https://...
VITE_WEBHOOK_GENERATE=https://...
VITE_WEBHOOK_STATUS=https://...
VITE_WEBHOOK_APPROVE=https://...
```

### POST /registration

Receives:
```json
{ "name": "Alex Smith", "email": "alex@co.com", "github": "alexsmith" }
```
Returns:
```json
{ "success": true }
```

### POST /login

Receives:
```json
{ "userId": "abc123" }
```
Returns one of:
```json
{ "found": true, "name": "Alex Smith", "email": "alex@co.com", "github": "alexsmith" }
{ "found": false, "reason": "pending" }
{ "found": false, "reason": "invalid" }
```

### POST /generation

Receives:
```json
{
  "blueprint": "{ ... }",
  "commitMessage": "Add payment module",
  "commitDescription": "Adds Stripe to checkout flow",
  "clickupTask": "TASK-123",
  "freshdeskTicket": "FD-456",
  "loomLink": "https://loom.com/share/abc",
  "user": { "name": "Alex Smith", "email": "alex@co.com", "github": "alexsmith", "userId": "abc123" }
}
```
Returns immediately:
```json
{ "jobId": "job_abc123" }
```
n8n processes the blueprint async and updates the job record when complete.

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

### POST /approval

Receives on approve:
```json
{
  "jobId": "job_abc123",
  "decision": "approved",
  "suggestedChanges": null,
  "user": { "name": "Alex Smith", "github": "alexsmith", "userId": "abc123" }
}
```
Returns:
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
Returns:
```json
{ "jobId": "job_def456" }
```
The new jobId is immediately polled. n8n reprocesses using the original blueprint + suggested changes.

---

## Airtable

### Users table

| Field | Type |
|---|---|
| Unique ID | Single line text |
| Full Name | Single line text |
| Email | Single line text |
| GitHub Username | Single line text |
| Approval State | Single select — `Awaiting Approval`, `Approved`, `Rejected` |

### Jobs table

| Field | Type |
|---|---|
| Job ID | Single line text |
| Status | Single select — `pending`, `complete`, `error` |
| Blueprint | Long text |
| Job Output \| Raw JSON | Long text |
| Source User | Linked record → Users |
| Commit Message | Single line text |
| Commit Description | Long text |
| ClickUp Task | Single line text |
| Freshdesk Ticket | Single line text |
| Loom Link | Single line text |

---

## Build and load

```bash
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked → select the `dist/` folder
4. After any change: `npm run build` then click ↺ on the extension card

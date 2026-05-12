const URL_REGISTER = import.meta.env.VITE_WEBHOOK_REGISTER
const URL_LOGIN    = import.meta.env.VITE_WEBHOOK_LOGIN
const URL_GENERATE = import.meta.env.VITE_WEBHOOK_GENERATE
const URL_STATUS   = import.meta.env.VITE_WEBHOOK_STATUS
const URL_APPROVE  = import.meta.env.VITE_WEBHOOK_APPROVE

export async function registerUser(payload) {
  const res = await fetch(URL_REGISTER, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`)
  return res.json()
}

export async function loginUser(userId) {
  const res = await fetch(URL_LOGIN, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  return res.json()
}

export async function submitBlueprint(payload) {
  const res = await fetch(URL_GENERATE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Blueprint submission failed: ${res.status}`)
  return res.json()
}

export async function checkJobStatus(jobId) {
  const res = await fetch(URL_STATUS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ jobId }),
  })
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}

export async function submitApproval(payload) {
  const res = await fetch(URL_APPROVE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Approval failed: ${res.status}`)
  return res.json()
}

// ─── Polling ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000
let   pollTimer        = null

export function saveJobToStorage(jobId) {
  chrome.storage.local.set({ activeJobId: jobId })
}

export function clearJobFromStorage() {
  chrome.storage.local.remove('activeJobId')
}

export function getJobFromStorage() {
  return new Promise(resolve => {
    chrome.storage.local.get('activeJobId', result => {
      resolve(result.activeJobId || null)
    })
  })
}

export function startPolling(jobId, { onComplete, onError }) {
  stopPolling()

  const poll = async () => {
    try {
      const data = await checkJobStatus(jobId)

      if (data.status === 'complete') {
        stopPolling()
        clearJobFromStorage()
        onComplete(data)
      } else if (data.status === 'error') {
        stopPolling()
        clearJobFromStorage()
        onError(data.message || 'Job failed.')
      }
    } catch (err) {
      console.error('Poll error:', err)
    }
  }

  poll()
  pollTimer = setInterval(poll, POLL_INTERVAL_MS)
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
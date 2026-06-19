import { useState, useEffect } from 'react'
import './forms.css'
import {
  registerUser,
  loginUser,
  submitBlueprint,
  submitApproval,
  saveJobToStorage,
  clearJobFromStorage,
  getJobFromStorage,
  pollJobOnce,
} from './Api.js'

const VIEW = {
  REGISTER: 'register',
  INITIAL:  'initial',
  PENDING:  'pending',
  APPROVAL: 'approval',
}

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="search-icon">
    <circle cx="5.5" cy="5.5" r="4" stroke="var(--text-muted)" strokeWidth="1.2"/>
    <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M12 7.5A5 5 0 016.5 2a5 5 0 100 10A5 5 0 0012 7.5z" fill="currentColor"/>
  </svg>
)

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2.5" fill="currentColor"/>
    <line x1="7" y1="1" x2="7" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="11" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="1" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="11" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9.66" y1="9.66" x2="11.07" y2="11.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="11.07" y1="2.93" x2="9.66" y2="4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="4.34" y1="9.66" x2="2.93" y2="11.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

function Field({ label, htmlFor, required, optional, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="required"> *</span>}
        {optional && <span className="optional"> (optional)</span>}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" className="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

function SearchInput({ id, placeholder, value, onChange }) {
  return (
    <div className="search-field">
      <input id={id} name={id} type="text" placeholder={placeholder} value={value} onChange={onChange} />
      <SearchIcon />
    </div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="btn icon-only sm" onClick={onToggle}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function Alert({ tone, children }) {
  return (
    <div className={`fm-alert fm-inline-alert is-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="fm-alert-body"><div className="fm-alert-title">{children}</div></div>
    </div>
  )
}

function PostGeneration({ workflowName, moduleCount, connCount, naming, improvements, docOutput }) {
  return (
    <>
      <Field label="Workflow name" htmlFor="workflow-name">
        <input id="workflow-name" name="workflow-name" type="text" placeholder="Scenario name will appear here..." value={workflowName} readOnly />
      </Field>

      <div className="grid-3 gap-2">
        <div className="p-3 bg-muted border-subtle radius-small flex flex-col items-center gap-1">
          <span className="font-mono text-size-large text-color-primary">{moduleCount}</span>
          <span className="text-size-tiny text-color-muted">Modules</span>
        </div>
        <div className="p-3 bg-muted border-subtle radius-small flex flex-col items-center gap-1">
          <span className="font-mono text-size-large text-color-primary">{connCount}</span>
          <span className="text-size-tiny text-color-muted">Connections</span>
        </div>
        <div className="p-3 bg-muted border-subtle radius-small flex flex-col items-center gap-1">
          <span className="font-mono text-size-small text-color-primary">{naming}</span>
          <span className="text-size-tiny text-color-muted">Naming</span>
        </div>
      </div>

      {improvements.length > 0 && (
        <div className="fm-alert is-warning">
          <div className="fm-alert-body">
            <div className="fm-alert-title">Suggested improvements</div>
            <ul className="fm-alert-msg">
              {improvements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Field label="Step-by-step documentation" htmlFor="doc-output">
        <textarea id="doc-output" name="doc-output" placeholder="AI output will appear here..." value={docOutput} readOnly />
      </Field>
    </>
  )
}

export default function App() {

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

  const signOut = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('reg_name')
    localStorage.removeItem('reg_email')
    localStorage.removeItem('reg_github')
    localStorage.removeItem('loginTimestamp')
    clearJobFromStorage()
    setView(VIEW.REGISTER)
  }

  const [view, setView] = useState(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) return VIEW.REGISTER
    const ts = parseInt(localStorage.getItem('loginTimestamp') || '0', 10)
    if (Date.now() - ts > SESSION_TTL) {
      localStorage.removeItem('userId')
      localStorage.removeItem('reg_name')
      localStorage.removeItem('reg_email')
      localStorage.removeItem('reg_github')
      localStorage.removeItem('loginTimestamp')
      return VIEW.REGISTER
    }
    return VIEW.INITIAL
  })

  useEffect(() => {
    window.fmSetView = (name) => {
      const target = VIEW[String(name).toUpperCase()]
      if (!target) {
        console.warn(`Unknown view "${name}". Valid views: ${Object.keys(VIEW).join(', ')}`)
        return
      }
      setView(target)
    }
    return () => { delete window.fmSetView }
  }, [])

  const [regName,   setRegName]   = useState('')
  const [regEmail,  setRegEmail]  = useState('')
  const [regGithub, setRegGithub] = useState('')
  const [regUserId, setRegUserId] = useState('')
  const [regStatus,      setRegStatus]      = useState('')
  const [regStatusError, setRegStatusError] = useState(false)

  const setRegInfo  = (msg) => { setRegStatus(msg); setRegStatusError(false) }
  const setRegError = (msg) => { setRegStatus(msg); setRegStatusError(true) }

  const [sourceUrl,       setSourceUrl]      = useState('')
  const [blueprint,       setBlueprint]      = useState('')
  const [message,         setMessage]        = useState('')
  const [description,     setDescription]    = useState('')
  const [showAdvanced,    setShowAdvanced]    = useState(false)
  const [clickupTask,     setClickupTask]     = useState('')
  const [freshdeskTicket, setFreshdeskTicket] = useState('')
  const [loomLink,        setLoomLink]        = useState('')
  const [status,          setStatus]          = useState('Copy a blueprint, then click generate. Analysis takes roughly 1 minute.')
  const [statusError,     setStatusError]     = useState(false)

  const setInfo  = (msg) => { setStatus(msg); setStatusError(false) }
  const setError = (msg) => { setStatus(msg); setStatusError(true) }

  const [workflowName,     setWorkflowName]     = useState('')
  const [moduleCount,      setModuleCount]      = useState('—')
  const [connCount,        setConnCount]        = useState('—')
  const [naming,           setNaming]           = useState('—')
  const [improvements,     setImprovements]     = useState([])
  const [docOutput,        setDocOutput]        = useState('')
  const [jobId,            setJobId]            = useState('')
  const [confirmed,        setConfirmed]        = useState(false)
  const [suggestedChanges, setSuggestedChanges] = useState('')

  const handlePollingComplete = (data) => {
    setWorkflowName(data.workflowName || '')
    setModuleCount(data.moduleCount ?? '—')
    setConnCount(data.connectionCount ?? '—')
    setNaming(data.namingConvention || '—')
    setImprovements(Array.isArray(data.improvements) ? data.improvements : [])
    setDocOutput(data.documentation || '')
    setInfo('Documentation ready. Review and approve below.')
    setView(VIEW.APPROVAL)
  }

  const handlePollingError = (msg) => {
    setError(msg || 'An error occurred.')
    setView(VIEW.INITIAL)
  }

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setSourceUrl(tabs[0]?.url || '')
    })
    getJobFromStorage().then(id => {
      if (id) {
        setJobId(id)
        setView(VIEW.PENDING)
        setInfo('Checking job status...')
        pollJobOnce(id, { onComplete: handlePollingComplete, onError: handlePollingError })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegister = async () => {
    if (!regName || !regEmail || !regGithub) {
      setRegError('Please fill in all fields.')
      return
    }
    try {
      await registerUser({ name: regName, email: regEmail, github: regGithub })
      setRegInfo('Registration submitted. An administrator will review your account and provide you with a User ID. Once received, store it somewhere safe (e.g. 1Password) — you will need it to log in.')
    } catch (err) {
      setRegError(`Registration failed: ${err.message}`)
    }
  }

  const handleEnterUserId = async () => {
    if (!regUserId.trim()) {
      setRegError('Please enter your User ID.')
      return
    }
    try {
      const data = await loginUser(regUserId.trim())
      if (!data.found) {
        setRegError(
          data.reason === 'pending'
            ? 'Your account is awaiting approval. Please try again once an administrator has approved your account.'
            : 'Invalid User ID. Please check it and try again.'
        )
        return
      }
      localStorage.setItem('userId',          regUserId.trim())
      localStorage.setItem('reg_name',        data.name)
      localStorage.setItem('reg_email',        data.email)
      localStorage.setItem('reg_github',       data.github)
      localStorage.setItem('loginTimestamp',   Date.now().toString())
      setView(VIEW.INITIAL)
    } catch {
      setRegError('Invalid User ID. Please check it and try again.')
    }
  }

  const handleGenerate = async () => {
    let bp = blueprint
    if (!bp) {
      bp = await navigator.clipboard.readText().catch(() => '')
      if (bp.trim()) setBlueprint(bp.trim())
      bp = bp.trim()
    }
    if (!bp || !message || !description) {
      setError('Please fill in all required fields.')
      return
    }
    let workflowName = ''
    try {
      workflowName = JSON.parse(bp).name || ''
    } catch {
      // blueprint not valid JSON — workflowName stays empty
    }
    const user = {
      name:   localStorage.getItem('reg_name')   || '',
      email:  localStorage.getItem('reg_email')  || '',
      github: localStorage.getItem('reg_github') || '',
      userId: localStorage.getItem('userId')     || '',
    }
    try {
      setInfo('Submitting blueprint...')
      const { jobId: id } = await submitBlueprint({
        blueprint: bp,
        workflowName,
        commitMessage:     message,
        commitDescription: description,
        clickupTask,
        freshdeskTicket,
        loomLink,
        sourceUrl,
        user,
      })
      setJobId(id)
      saveJobToStorage(id)
      setView(VIEW.PENDING)
      setInfo('Analysing blueprint. Reopen the extension to check progress.')
      pollJobOnce(id, { onComplete: handlePollingComplete, onError: handlePollingError })
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  const handleApprove = async () => {
    if (!confirmed) {
      setError('Please confirm you have read and reviewed the README.')
      return
    }
    const user = {
      name:   localStorage.getItem('reg_name')   || '',
      github: localStorage.getItem('reg_github') || '',
      userId: localStorage.getItem('userId')     || '',
    }
    try {
      setInfo('Pushing to GitHub...')
      await submitApproval({ jobId, decision: 'approved', suggestedChanges: null, user })
      clearJobFromStorage()
      setConfirmed(false)
      setSuggestedChanges('')
      setView(VIEW.INITIAL)
      setInfo('README pushed to GitHub successfully.')
    } catch (err) {
      setError(`Approval failed: ${err.message}`)
    }
  }

  const handleDecline = async () => {
    try {
      setInfo('Sending feedback for reprocessing...')
      const { jobId: newId } = await submitApproval({ jobId, decision: 'declined', suggestedChanges })
      setJobId(newId)
      saveJobToStorage(newId)
      setConfirmed(false)
      setView(VIEW.PENDING)
      setInfo('Reprocessing. Reopen the extension to check progress.')
      pollJobOnce(newId, { onComplete: handlePollingComplete, onError: handlePollingError })
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }


  if (view === VIEW.REGISTER) {
    return (
      <div className="bg-canvas">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4>low-code AI architect</h4>
              <p className="text-size-tiny text-color-muted mt-1">Set up your account to get started.</p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <Field label="Full name" htmlFor="reg-name" required>
            <input id="reg-name" name="reg-name" type="text" placeholder="Your name" value={regName} onChange={e => setRegName(e.target.value)} />
          </Field>

          <Field label="Email" htmlFor="reg-email" required>
            <input id="reg-email" name="reg-email" type="email" placeholder="you@flowmondo.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
          </Field>

          <Field label="GitHub username" htmlFor="reg-github" required>
            <input id="reg-github" name="reg-github" type="text" placeholder="github-username" value={regGithub} onChange={e => setRegGithub(e.target.value)} />
          </Field>

          <button className="btn w-full" onClick={handleRegister}>Request access</button>

          <div className="divider" />

          <div>
            <p className="text-size-small text-weight-semibold text-color-primary mb-1">Already have a User ID?</p>
            <p className="text-size-tiny text-color-muted mb-2">Enter the ID provided by your administrator. Keep it stored somewhere safe (e.g. 1Password).</p>
          </div>

          <Field label="User ID" htmlFor="reg-user-id" required>
            <input id="reg-user-id" name="reg-user-id" type="text" placeholder="Enter your User ID" value={regUserId} onChange={e => setRegUserId(e.target.value)} />
          </Field>

          <button className="btn secondary w-full" onClick={handleEnterUserId}>Continue</button>

          {regStatus && (
            regStatusError
              ? <Alert tone="error">{regStatus}</Alert>
              : <p className="text-size-tiny text-color-muted text-align-center">{regStatus}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-canvas">

      <div className="p-4 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <h4>low-code AI architect</h4>
          <div className="flex items-center gap-2">
            <button className="btn link" onClick={signOut}>Sign out</button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        <button className="btn w-full" onClick={handleGenerate}>
          Generate documentation
        </button>

        {statusError
          ? <Alert tone="error">{status}</Alert>
          : <p className="text-size-tiny text-color-muted text-align-center">{status}</p>
        }

        {view === VIEW.INITIAL && (
          <>
            <Field label="Blueprint content" htmlFor="blueprint" required>
              <textarea
                id="blueprint"
                name="blueprint"
                placeholder="Copy the blueprint and click generate or paste the blueprint here"
                value={blueprint}
                onChange={e => setBlueprint(e.target.value)}
              />
            </Field>

            <Field label="Commit message" htmlFor="commit-message" required>
              <input id="commit-message" name="commit-message" type="text" placeholder="Write a short commit message" value={message} onChange={e => setMessage(e.target.value)} />
            </Field>

            <Field label="Commit description" htmlFor="commit-description" required>
              <textarea id="commit-description" name="commit-description" placeholder="Write a description of the changes made" value={description} onChange={e => setDescription(e.target.value)} />
            </Field>

            <button
              className={`btn link advanced-toggle ${showAdvanced ? 'open' : ''}`}
              onClick={() => setShowAdvanced(v => !v)}
            >
              <span className="arrow">›</span>
              <span>Advanced</span>
            </button>

            <div className={`advanced-content ${showAdvanced ? 'open' : ''}`}>
              <div className="advanced-inner">
                <div className="field-row">
                  <Field label="ClickUp task" htmlFor="clickup-task" optional>
                    <SearchInput id="clickup-task" placeholder="Search or paste ID" value={clickupTask} onChange={e => setClickupTask(e.target.value)} />
                  </Field>
                  <Field label="Freshdesk ticket" htmlFor="freshdesk-ticket" optional>
                    <SearchInput id="freshdesk-ticket" placeholder="Search or paste ID" value={freshdeskTicket} onChange={e => setFreshdeskTicket(e.target.value)} />
                  </Field>
                </div>

                <Field label="Loom link" htmlFor="loom-link" optional>
                  <input id="loom-link" name="loom-link" type="text" placeholder="A quick loom explaining what you have done" value={loomLink} onChange={e => setLoomLink(e.target.value)} />
                </Field>
              </div>
            </div>
          </>
        )}

        {view === VIEW.PENDING && (
          <>
            <PostGeneration workflowName={workflowName} moduleCount={moduleCount} connCount={connCount} naming={naming} improvements={improvements} docOutput={docOutput} />
            <div className="divider" />
            <Field label="Job ID" htmlFor="job-id" hint="Approving will delete this job ID">
              <input id="job-id" name="job-id" type="text" placeholder="Job ID will appear here..." value={jobId} readOnly />
            </Field>
          </>
        )}

        {view === VIEW.APPROVAL && (
          <>
            <PostGeneration workflowName={workflowName} moduleCount={moduleCount} connCount={connCount} naming={naming} improvements={improvements} docOutput={docOutput} />
            <div className="divider" />

            <Field label="Job ID" htmlFor="job-id" hint="Approving will delete this job ID">
              <input id="job-id" name="job-id" type="text" placeholder="Job ID will appear here..." value={jobId} readOnly />
            </Field>

            <div className="flex flex-col gap-3">
              <p className="text-size-small text-weight-semibold text-color-primary">Approval gate</p>
              <p className="text-size-tiny text-color-muted">Please read the generated README and confirm it is correct</p>

              <div className="flex gap-2 w-full">
                <button className="btn flex-1" onClick={handleApprove}>Approve</button>
                <button className="btn is-destructive flex-1" onClick={handleDecline}>Decline</button>
              </div>

              <Checkbox
                checked={confirmed}
                onChange={() => setConfirmed(v => !v)}
                label="I confirm I have read and suggested the necessary changes"
              />
            </div>

            <Field label="Suggested changes" htmlFor="suggested-changes" optional>
              <textarea id="suggested-changes" name="suggested-changes" placeholder="Necessary changes to the README..." value={suggestedChanges} onChange={e => setSuggestedChanges(e.target.value)} />
            </Field>
          </>
        )}

      </div>
    </div>
  )
}

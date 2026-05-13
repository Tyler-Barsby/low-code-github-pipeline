import { useState, useEffect } from 'react'
import './App.css'
import {
  registerUser,
  loginUser,
  submitBlueprint,
  submitApproval,
  saveJobToStorage,
  clearJobFromStorage,
  getJobFromStorage,
  startPolling,
  stopPolling,
} from './Api.js'

const VIEW = {
  REGISTER: 'register',
  INITIAL:  'initial',
  PENDING:  'pending',
  APPROVAL: 'approval',
}

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="5.5" cy="5.5" r="4" stroke="var(--color-text-placeholder)" strokeWidth="1.2"/>
    <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="var(--color-text-placeholder)" strokeWidth="1.2" strokeLinecap="round"/>
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

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <div className="checkbox-row" onClick={onChange}>
      <div className={`checkbox-box ${checked ? 'checked' : ''}`}>
        {checked && (
          <svg width="8" height="7" viewBox="0 0 9 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      {label && <span className="checkbox-label">{label}</span>}
    </div>
  )
}

function SearchInput({ placeholder, value, onChange }) {
  return (
    <div className="search-input-wrap">
      <input type="text" placeholder={placeholder} value={value} onChange={onChange} />
      <SearchIcon />
    </div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export default function App() {

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const [view, setView] = useState(() =>
    localStorage.getItem('userId') ? VIEW.INITIAL : VIEW.REGISTER
  )

  const [regName,   setRegName]   = useState('')
  const [regEmail,  setRegEmail]  = useState('')
  const [regGithub, setRegGithub] = useState('')
  const [regUserId, setRegUserId] = useState('')
  const [regStatus, setRegStatus] = useState('')

  const [blueprint,       setBlueprint]      = useState('')
  const [message,         setMessage]        = useState('')
  const [description,     setDescription]    = useState('')
  const [showAdvanced,    setShowAdvanced]    = useState(false)
  const [clickupTask,     setClickupTask]     = useState('')
  const [freshdeskTicket, setFreshdeskTicket] = useState('')
  const [loomLink,        setLoomLink]        = useState('')
  const [status,          setStatus]          = useState('Copy a blueprint, then click generate. Analysis takes roughly 1 minute.')

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
    setStatus('Documentation ready. Review and approve below.')
    setView(VIEW.APPROVAL)
  }

  const handlePollingError = (msg) => {
    setStatus(msg || 'An error occurred.')
    setView(VIEW.INITIAL)
  }

  useEffect(() => {
    getJobFromStorage().then(id => {
      if (id) {
        setJobId(id)
        setView(VIEW.PENDING)
        setStatus('Resuming analysis...')
        startPolling(id, { onComplete: handlePollingComplete, onError: handlePollingError })
      }
    })
    return () => stopPolling()
  }, [])

  const handleRegister = async () => {
    if (!regName || !regEmail || !regGithub) {
      setRegStatus('Please fill in all fields.')
      return
    }
    try {
      await registerUser({ name: regName, email: regEmail, github: regGithub })
      setRegStatus('Registration submitted. An administrator will review your account and provide you with a User ID. Once received, store it somewhere safe (e.g. 1Password) — you will need it to log in.')
    } catch (err) {
      setRegStatus(`Registration failed: ${err.message}`)
    }
  }

  const handleEnterUserId = async () => {
    if (!regUserId.trim()) {
      setRegStatus('Please enter your User ID.')
      return
    }
    try {
      const { name, email, github } = await loginUser(regUserId.trim())
      localStorage.setItem('userId',     regUserId.trim())
      localStorage.setItem('reg_name',   name)
      localStorage.setItem('reg_email',  email)
      localStorage.setItem('reg_github', github)
      setView(VIEW.INITIAL)
    } catch (err) {
      setRegStatus('Invalid User ID. Please check it and try again.')
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
      setStatus('Please fill in all required fields.')
      return
    }
    const user = {
      name:   localStorage.getItem('reg_name')   || '',
      email:  localStorage.getItem('reg_email')  || '',
      github: localStorage.getItem('reg_github') || '',
      userId: localStorage.getItem('userId')     || '',
    }
    try {
      setStatus('Submitting blueprint...')
      const { jobId: id } = await submitBlueprint({
        blueprint: bp,
        commitMessage:     message,
        commitDescription: description,
        clickupTask,
        freshdeskTicket,
        loomLink,
        user,
      })
      setJobId(id)
      saveJobToStorage(id)
      setView(VIEW.PENDING)
      setStatus('Analysing blueprint. This takes roughly 1 minute...')
      startPolling(id, { onComplete: handlePollingComplete, onError: handlePollingError })
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  const handleApprove = async () => {
    if (!confirmed) {
      setStatus('Please confirm you have read and reviewed the README.')
      return
    }
    const user = {
      name:   localStorage.getItem('reg_name')   || '',
      github: localStorage.getItem('reg_github') || '',
      userId: localStorage.getItem('userId')     || '',
    }
    try {
      setStatus('Pushing to GitHub...')
      await submitApproval({ jobId, decision: 'approved', suggestedChanges: null, user })
      clearJobFromStorage()
      setConfirmed(false)
      setSuggestedChanges('')
      setView(VIEW.INITIAL)
      setStatus('README pushed to GitHub successfully.')
    } catch (err) {
      setStatus(`Approval failed: ${err.message}`)
    }
  }

  const handleDecline = async () => {
    try {
      setStatus('Sending feedback for reprocessing...')
      const { jobId: newId } = await submitApproval({ jobId, decision: 'declined', suggestedChanges })
      setJobId(newId)
      saveJobToStorage(newId)
      setConfirmed(false)
      setView(VIEW.PENDING)
      setStatus('Reprocessing. This takes roughly 1 minute...')
      startPolling(newId, { onComplete: handlePollingComplete, onError: handlePollingError })
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  const PostGeneration = () => (
    <>
      <Field label="Workflow name">
        <input type="text" className="h-input" placeholder="Scenario name will appear here..." value={workflowName} readOnly />
      </Field>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{moduleCount}</span>
          <span className="stat-label">Modules</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{connCount}</span>
          <span className="stat-label">Connections</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ fontSize: 'var(--text-body)' }}>{naming}</span>
          <span className="stat-label">Naming</span>
        </div>
      </div>

      {improvements.length > 0 && (
        <div className="improvements-box">
          <h4>⚠ Suggested improvements</h4>
          <ul style={{ paddingLeft: '1rem', margin: 0 }}>
            {improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Step-by-step documentation">
        <textarea className="h-textarea" placeholder="AI output will appear here..." value={docOutput} readOnly />
      </Field>
    </>
  )

  if (view === VIEW.REGISTER) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
        <div className="reg-header">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="popup">
          <div>
            <p className="page-title">Low-Code AI Architect</p>
            <p style={{ fontSize: 'var(--text-meta)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Set up your account to get started.
            </p>
          </div>

          <Field label="Full name">
            <input type="text" className="h-input" placeholder="Your name" value={regName} onChange={e => setRegName(e.target.value)} />
          </Field>

          <Field label="Email">
            <input type="email" className="h-input" placeholder="you@flowmondo.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
          </Field>

          <Field label="GitHub username">
            <input type="text" className="h-input" placeholder="github-username" value={regGithub} onChange={e => setRegGithub(e.target.value)} />
          </Field>

          <button className="btn-primary" onClick={handleRegister}>Request access</button>

          <div className="divider" />

          <div>
            <p style={{ fontSize: 'var(--text-section)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Already have a User ID?</p>
            <p style={{ fontSize: 'var(--text-meta)', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Enter the ID provided by your administrator. Keep it stored somewhere safe (e.g. 1Password).</p>
          </div>

          <Field label="User ID">
            <input type="text" className="h-input" placeholder="Enter your User ID" value={regUserId} onChange={e => setRegUserId(e.target.value)} />
          </Field>

          <button className="btn-secondary" onClick={handleEnterUserId}>Continue</button>

          {regStatus && <p className="status-text">{regStatus}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      <div className="popup">

        <div className="popup-header">
          <p className="page-title">Low-Code AI Architect</p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <button className="btn-primary" onClick={handleGenerate}>
          Generate documentation
        </button>

        <p className="status-text">{status}</p>

        {view === VIEW.INITIAL && (
          <>
            <Field label="Blueprint content*">
              <textarea
                className="h-textarea"
                style={{ resize: 'vertical' }}
                placeholder="Copy the blueprint and click generate or paste the blueprint here"
                value={blueprint}
                onChange={e => setBlueprint(e.target.value)}
              />
            </Field>

            <Field label="Commit message*">
              <input type="text" className="h-input" placeholder="Write a short commit message" value={message} onChange={e => setMessage(e.target.value)} />
            </Field>

            <Field label="Commit description*">
              <textarea className="h-textarea" placeholder="Write a description of the changes made" value={description} onChange={e => setDescription(e.target.value)} />
            </Field>

            <button
              className={`advanced-toggle ${showAdvanced ? 'open' : ''}`}
              onClick={() => setShowAdvanced(v => !v)}
            >
              <span className="arrow">›</span>
              <span>Advanced</span>
            </button>

            <div className={`advanced-content ${showAdvanced ? 'open' : ''}`}>
              <div className="advanced-inner">
                <div className="field-row">
                  <Field label="ClickUp task">
                    <SearchInput placeholder="Search or paste ID" value={clickupTask} onChange={e => setClickupTask(e.target.value)} />
                  </Field>
                  <Field label="Freshdesk ticket">
                    <SearchInput placeholder="Search or paste ID" value={freshdeskTicket} onChange={e => setFreshdeskTicket(e.target.value)} />
                  </Field>
                </div>

                <Field label="Loom link">
                  <input type="text" className="h-input" placeholder="A quick loom explaining what you have done" value={loomLink} onChange={e => setLoomLink(e.target.value)} />
                </Field>
              </div>
            </div>
          </>
        )}

        {view === VIEW.PENDING && (
          <>
            <PostGeneration />
            <div className="divider" />
            <Field label="Job ID">
              <input type="text" className="h-input" placeholder="Job ID will appear here..." value={jobId} readOnly />
              <p className="note-text">Approving will delete this job ID</p>
            </Field>
          </>
        )}

        {view === VIEW.APPROVAL && (
          <>
            <PostGeneration />
            <div className="divider" />

            <Field label="Job ID">
              <input type="text" className="h-input" placeholder="Job ID will appear here..." value={jobId} readOnly />
              <p className="note-text">Approving will delete this job ID</p>
            </Field>

            <div className="approval-section">
              <p className="section-title">Approval gate</p>
              <p className="note-text" style={{ marginTop: 3 }}>Please read the generated README and confirm it is correct</p>

              <div className="btn-row">
                <button className="btn-approve" onClick={handleApprove}>Approve</button>
                <button className="btn-decline" onClick={handleDecline}>Decline</button>
              </div>

              <Checkbox
                checked={confirmed}
                onChange={() => setConfirmed(v => !v)}
                label="I confirm I have read and suggested the necessary changes"
              />
            </div>

            <Field label="Suggested changes">
              <textarea className="h-textarea" placeholder="Necessary changes to the README..." value={suggestedChanges} onChange={e => setSuggestedChanges(e.target.value)} />
            </Field>
          </>
        )}

      </div>
    </div>
  )
}

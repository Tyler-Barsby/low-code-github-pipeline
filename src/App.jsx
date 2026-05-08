import { useState } from 'react'
import './App.css'

function App() {
  const [blueprint, setBlueprint]       = useState('')
  const [message, setMessage]           = useState('')
  const [description, setDescription]   = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [status, setStatus]             = useState('Copy a blueprint, then click generate. Analysis takes roughly 1 minute.')

  const [workflowName, setWorkflowName] = useState('')
  const [moduleCount, setModuleCount]   = useState('-')
  const [connCount, setConnCount]       = useState('-')
  const [naming, setNaming]             = useState('-')
  const [improvements, setImprovements] = useState([])
  const [docOutput, setDocOutput]       = useState('')

  const handleGenerate = () => {
    if (!blueprint || !message || !description) {
      setStatus('Please fill in all required fields.')
      return
    }
    setStatus('Generating documentation...')
  }

  return (
    <div className="popup p-popup bg gap-section">

      {/* Header */}
      <h3 className="text-primary font-bold text-lg">Low-Code AI Architect</h3>

      {/* Primary action */}
      <button
        className="rounded-md p-btn bg-accent text-accent-fg font-bold text-md"
        style={{ cursor: 'pointer', border: 'none' }}
        onClick={handleGenerate}
      >
        Generate Documentation
      </button>

      {/* Status */}
      <p className="text-secondary text-sm" style={{ textAlign: 'center' }}>{status}</p>

      {/* Blueprint Content */}
      <div className="box">
        <h4 className="text-primary font-bold text-base">Blueprint Content*</h4>
        <input
          type="text"
          className="p-input h-input rounded-sm border bg"
          placeholder="Paste blueprint here..."
          value={blueprint}
          onChange={e => setBlueprint(e.target.value)}
          required
        />
      </div>

      {/* Commit Message */}
      <div className="box">
        <h4 className="text-primary font-bold text-base">Commit Message*</h4>
        <input
          type="text"
          className="p-input h-input rounded-sm border bg"
          placeholder="Short commit message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>

      {/* Commit Description */}
      <div className="box">
        <h4 className="text-primary font-bold text-base">Commit Description*</h4>
        <textarea
          className="p-input h-textarea rounded-sm border bg"
          placeholder="Describe the changes made"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Advanced toggle */}
      <a
        className="text-secondary text-sm"
        style={{ cursor: 'pointer', display: 'flex', gap: 'var(--gap-inline)', alignItems: 'center' }}
        onClick={() => setShowAdvanced(v => !v)}
      >
        <span>Advanced</span>
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.2s ease-in-out',
            transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          →
        </span>
      </a>

      {/* Animated Advanced Section */}
      <div className={`advanced-content ${showAdvanced ? 'is-open' : ''}`}>
        <div className="advanced-inner">

          {/* New Example Field 1 */}
          <div className="box">
            <h4 className="text-primary font-bold text-base">Example Field 1</h4>
            <input type="text" className="p-input h-input rounded-sm border bg-muted" placeholder="Example value" />
          </div>

          {/* New Example Field 2 */}
          <div className="box">
            <h4 className="text-primary font-bold text-base">Example Field 2</h4>
            <input type="text" className="p-input h-input rounded-sm border bg-muted" placeholder="Example value" />
          </div>

          {/* New Example Field 3 */}
          <div className="box">
            <h4 className="text-primary font-bold text-base">Example Field 3</h4>
            <input type="text" className="p-input h-input rounded-sm border bg-muted" placeholder="Example value" />
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
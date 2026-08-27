import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { screenDocument } from '../api.js'
import VerdictBanner from '../components/VerdictBanner.jsx'
import FindingList from '../components/FindingList.jsx'

const DOCUMENT_TYPES = [
  'PASSPORT',
  'VISA',
  'NATIONAL_ID',
  'DRIVING_LICENCE',
  'PERMIT',
  'TRAVEL_AUTHORIZATION',
  'UNKNOWN',
]

export default function ScreenPage() {
  const navigate = useNavigate()

  const [documentFile, setDocumentFile] = useState(null)
  const [liveFile, setLiveFile] = useState(null)
  const [documentType, setDocumentType] = useState('PASSPORT')
  const [checkpointId, setCheckpointId] = useState('')
  const [laneId, setLaneId] = useState('')
  const [officerId, setOfficerId] = useState('')
  const [text, setText] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function submit(event) {
    event.preventDefault()
    if (!documentFile) {
      setError('Select the document image before screening.')
      return
    }

    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const screened = await screenDocument({
        document: documentFile,
        live: liveFile,
        documentType,
        checkpointId,
        laneId,
        officerId,
        text,
      })
      setResult(screened)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Screen a document</h1>
      <p className="page-subtitle">
        Upload the presented document. All four modules run, and a recommendation is
        returned with the reasoning behind it.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="grid-2">
        <form className="panel" onSubmit={submit}>
          <h2>Presented document</h2>

          <label>
            <span className="label-text">Document image (required)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            <span className="label-text">Document type</span>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <div className="hint">
              A hint only. The modules report what they actually find, not what was selected.
            </div>
          </label>

          <label>
            <span className="label-text">Live capture (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLiveFile(e.target.files?.[0] ?? null)}
            />
            <div className="hint">
              Enables Module 4. Without it, face verification reports that it did not run.
            </div>
          </label>

          <label>
            <span className="label-text">Chip read or keyed MRZ (optional)</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10'
              }
              spellCheck={false}
            />
            <div className="hint">
              When supplied, this is trusted over pixel OCR - it is the exact text the chip
              or the printed page carries.
            </div>
          </label>

          <div className="grid-3">
            <label>
              <span className="label-text">Checkpoint</span>
              <input type="text" value={checkpointId} onChange={(e) => setCheckpointId(e.target.value)} />
            </label>
            <label>
              <span className="label-text">Lane</span>
              <input type="text" value={laneId} onChange={(e) => setLaneId(e.target.value)} />
            </label>
            <label>
              <span className="label-text">Officer</span>
              <input type="text" value={officerId} onChange={(e) => setOfficerId(e.target.value)} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Screening...' : 'Screen document'}
            </button>
          </div>
        </form>

        <div>
          {busy && <div className="panel spinner">Running the screening pipeline...</div>}

          {result && (
            <>
              <VerdictBanner risk={result.risk} />

              <div className="panel">
                <h2>Case {result.caseReference}</h2>
                <table className="field-table">
                  <tbody>
                    <tr>
                      <td>Name</td>
                      <td>{fullName(result.extracted) || '--'}</td>
                    </tr>
                    <tr>
                      <td>Document number</td>
                      <td className="mono">{result.extracted?.documentNumber || '--'}</td>
                    </tr>
                    <tr>
                      <td>Nationality</td>
                      <td>{result.extracted?.nationality || '--'}</td>
                    </tr>
                    <tr>
                      <td>Date of birth</td>
                      <td>{result.extracted?.dateOfBirth || '--'}</td>
                    </tr>
                    <tr>
                      <td>Expires</td>
                      <td>{result.extracted?.dateOfExpiry || '--'}</td>
                    </tr>
                    <tr>
                      <td>Processed in</td>
                      <td>{result.processingMillis} ms</td>
                    </tr>
                  </tbody>
                </table>
                <div className="button-row" style={{ marginTop: 16 }}>
                  <button onClick={() => navigate(`/cases/${result.caseReference}`)}>
                    Open full case
                  </button>
                </div>
              </div>

              <div className="panel">
                <h2>Findings</h2>
                <FindingList flags={result.risk?.flags} />
              </div>
            </>
          )}

          {!busy && !result && (
            <div className="panel empty">
              Screening results appear here.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function fullName(extracted) {
  if (!extracted) return null
  return [extracted.givenNames, extracted.surname].filter(Boolean).join(' ')
}

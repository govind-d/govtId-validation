import { useCallback, useEffect, useState } from 'react'
import { addWatchlistEntry, deactivateWatchlistEntry, listWatchlist } from '../api.js'
import Badge from '../components/Badge.jsx'

const LIST_TYPES = [
  'STOLEN_DOCUMENT',
  'REVOKED_DOCUMENT',
  'ENTRY_BAN',
  'WANTED',
  'VISA_OVERSTAY',
  'LOCAL_INTEREST',
]

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const EMPTY_FORM = {
  documentNumber: '',
  surname: '',
  givenNames: '',
  dateOfBirth: '',
  nationality: '',
  listType: 'STOLEN_DOCUMENT',
  severity: 'CRITICAL',
  reason: '',
  source: '',
  addedBy: '',
}

export default function WatchlistPage() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await listWatchlist()
      setEntries(page.content ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await addWatchlistEntry({
        ...form,
        documentNumber: form.documentNumber || null,
        surname: form.surname || null,
        givenNames: form.givenNames || null,
        dateOfBirth: form.dateOfBirth || null,
        nationality: form.nationality || null,
      })
      setForm(EMPTY_FORM)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(id) {
    setError(null)
    try {
      await deactivateWatchlistEntry(id, form.addedBy || undefined)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <h1 className="page-title">Watchlist</h1>
      <p className="page-subtitle">
        Stolen, revoked and flagged documents and identities. Screening matches against
        these on every presentation.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="grid-2">
        <form className="panel" onSubmit={submit}>
          <h2>Add an entry</h2>

          <label>
            <span className="label-text">Document number</span>
            <input
              type="text"
              value={form.documentNumber}
              onChange={(e) => update('documentNumber', e.target.value)}
            />
          </label>

          <div className="grid-2">
            <label>
              <span className="label-text">Surname</span>
              <input type="text" value={form.surname} onChange={(e) => update('surname', e.target.value)} />
            </label>
            <label>
              <span className="label-text">Given names</span>
              <input
                type="text"
                value={form.givenNames}
                onChange={(e) => update('givenNames', e.target.value)}
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              <span className="label-text">Date of birth</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
              />
            </label>
            <label>
              <span className="label-text">Nationality (alpha-3)</span>
              <input
                type="text"
                maxLength={3}
                value={form.nationality}
                onChange={(e) => update('nationality', e.target.value.toUpperCase())}
              />
            </label>
          </div>

          <div className="hint" style={{ marginBottom: 14 }}>
            Provide a document number, or a surname together with a date of birth. A name
            on its own is too common to match on safely.
          </div>

          <div className="grid-2">
            <label>
              <span className="label-text">List</span>
              <select value={form.listType} onChange={(e) => update('listType', e.target.value)}>
                {LIST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label-text">Severity</span>
              <select value={form.severity} onChange={(e) => update('severity', e.target.value)}>
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span className="label-text">Reason</span>
            <input type="text" value={form.reason} onChange={(e) => update('reason', e.target.value)} />
          </label>

          <div className="grid-2">
            <label>
              <span className="label-text">Source</span>
              <input type="text" value={form.source} onChange={(e) => update('source', e.target.value)} />
            </label>
            <label>
              <span className="label-text">Added by</span>
              <input type="text" value={form.addedBy} onChange={(e) => update('addedBy', e.target.value)} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add to watchlist'}
            </button>
          </div>
        </form>

        <div className="panel">
          <h2>Current entries</h2>
          {loading && <div className="spinner">Loading...</div>}
          {!loading && entries.length === 0 && <div className="empty">The watchlist is empty.</div>}
          {!loading && entries.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Identity</th>
                  <th>List</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="mono">{entry.documentNumberKey || '--'}</td>
                    <td>
                      {entry.displayName || '--'}
                      {entry.dateOfBirth && (
                        <div className="module-note">{entry.dateOfBirth}</div>
                      )}
                    </td>
                    <td>{entry.listType?.replace(/_/g, ' ')}</td>
                    <td>
                      <Badge value={entry.severity} />
                    </td>
                    <td>{entry.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      {entry.active && (
                        <button onClick={() => deactivate(entry.id)}>Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="hint" style={{ marginTop: 12 }}>
            Entries are deactivated, never deleted. Removing a row outright would erase the
            reason any past case was rejected.
          </div>
        </div>
      </div>
    </>
  )
}

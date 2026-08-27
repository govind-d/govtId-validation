import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCases } from '../api.js'
import Badge from '../components/Badge.jsx'

export default function CasesPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listCases(page, 25)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <>
      <h1 className="page-title">Screened cases</h1>
      <p className="page-subtitle">
        Every document presented, most recent first. This history is also what makes
        repeat presentations and multiple identities visible.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        {loading && <div className="spinner">Loading cases...</div>}

        {!loading && data?.content?.length === 0 && (
          <div className="empty">No documents have been screened yet.</div>
        )}

        {!loading && data?.content?.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Name</th>
                <th>Document</th>
                <th>Type</th>
                <th>Score</th>
                <th>Recommendation</th>
                <th>Officer</th>
                <th>Findings</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((row) => (
                <tr key={row.id}>
                  <td className="mono">
                    <Link to={`/cases/${row.caseReference}`}>{row.caseReference}</Link>
                  </td>
                  <td>{row.fullName || '--'}</td>
                  <td className="mono">{row.documentNumber || '--'}</td>
                  <td>{row.documentType?.replace(/_/g, ' ')}</td>
                  <td className="mono">{row.riskScore ?? '--'}</td>
                  <td>
                    <Badge value={row.verdict} />
                  </td>
                  <td>
                    <Badge value={row.officerDecision} fallback="pending" />
                  </td>
                  <td>{row.flagCount}</td>
                  <td className="module-note">{formatInstant(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="button-row">
        <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          Previous
        </button>
        <button
          disabled={!data || data.last}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
        {data && (
          <span className="module-note" style={{ alignSelf: 'center' }}>
            Page {data.number + 1} of {Math.max(1, data.totalPages)} - {data.totalElements} case(s)
          </span>
        )}
      </div>
    </>
  )
}

function formatInstant(value) {
  if (!value) return '--'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

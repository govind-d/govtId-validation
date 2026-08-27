import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats } from '../api.js'
import Badge from '../components/Badge.jsx'

export default function DashboardPage() {
  const [windowHours, setWindowHours] = useState(24)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStats(windowHours)
      .then((result) => {
        if (!cancelled) {
          setStats(result)
          setError(null)
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [windowHours])

  return (
    <>
      <h1 className="page-title">Checkpoint dashboard</h1>
      <p className="page-subtitle">
        Throughput and referral pattern over the selected window. A spike in one finding
        code is often the first sign of a batch of forgeries circulating.
      </p>

      <label style={{ maxWidth: 240 }}>
        <span className="label-text">Window</span>
        <select value={windowHours} onChange={(e) => setWindowHours(Number(e.target.value))}>
          <option value={1}>Last hour</option>
          <option value={8}>Last shift (8 hours)</option>
          <option value={24}>Last 24 hours</option>
          <option value={168}>Last 7 days</option>
        </select>
      </label>

      {error && <div className="error">{error}</div>}
      {loading && <div className="panel spinner">Loading statistics...</div>}

      {!loading && stats && (
        <>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="stat">
              <div className="stat-value">{stats.totalScreenings}</div>
              <div className="stat-label">Screened in window</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.referredForReview}</div>
              <div className="stat-label">
                Referred ({Math.round((stats.referralRate ?? 0) * 100)}%)
              </div>
            </div>
            <div className="stat">
              <div className="stat-value">
                {stats.medianProcessingMillis != null ? `${stats.medianProcessingMillis} ms` : '--'}
              </div>
              <div className="stat-label">Median screening time</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="panel">
              <h2>Most frequent findings</h2>
              {Object.keys(stats.topFlags ?? {}).length === 0 ? (
                <div className="empty">No findings in this window.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Finding</th>
                      <th style={{ width: 80 }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.topFlags).map(([code, count]) => (
                      <tr key={code}>
                        <td className="mono">{code}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <div className="panel">
                <h2>Recommendations</h2>
                {Object.keys(stats.byVerdict ?? {}).length === 0 ? (
                  <div className="empty">No completed screenings in this window.</div>
                ) : (
                  <table>
                    <tbody>
                      {Object.entries(stats.byVerdict).map(([verdict, count]) => (
                        <tr key={verdict}>
                          <td>
                            <Badge value={verdict} />
                          </td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="panel">
                <h2>Highest risk cases</h2>
                {(stats.highestRiskCases ?? []).length === 0 ? (
                  <div className="empty">Nothing flagged in this window.</div>
                ) : (
                  <table>
                    <tbody>
                      {stats.highestRiskCases.map((row) => (
                        <tr key={row.caseReference}>
                          <td className="mono">
                            <Link to={`/cases/${row.caseReference}`}>{row.caseReference}</Link>
                          </td>
                          <td className="mono">{row.score}</td>
                          <td>
                            <Badge value={row.verdict} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="panel">
                <h2>Documents seen</h2>
                {Object.keys(stats.byDocumentType ?? {}).length === 0 ? (
                  <div className="empty">Nothing in this window.</div>
                ) : (
                  <table>
                    <tbody>
                      {Object.entries(stats.byDocumentType).map(([type, count]) => (
                        <tr key={type}>
                          <td>{type.replace(/_/g, ' ')}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

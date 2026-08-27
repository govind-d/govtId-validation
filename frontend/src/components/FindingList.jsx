import Badge from './Badge.jsx'

/**
 * Findings, most severe first, each with the evidence that produced it. The evidence
 * chips are what make a finding auditable: an officer can see the actual values a rule
 * compared, not just its conclusion.
 */
export default function FindingList({ flags }) {
  if (!flags?.length) {
    return <div className="empty">No findings were raised.</div>
  }

  return (
    <div>
      {flags.map((flag, index) => (
        <div key={`${flag.code}-${index}`} className={`finding sev-${flag.severity}`}>
          <div className="finding-head">
            <Badge value={flag.severity} />
            <span className="finding-code">{flag.code}</span>
          </div>
          <div className="finding-message">{flag.message}</div>
          {flag.evidence && Object.keys(flag.evidence).length > 0 && (
            <div className="evidence">
              {Object.entries(flag.evidence)
                .filter(([key]) => key !== 'heatmap')
                .map(([key, value]) => (
                  <span className="evidence-item" key={key}>
                    {key}: {formatValue(value)}
                  </span>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function formatValue(value) {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

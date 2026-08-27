/**
 * The headline an officer reads first: the score, the recommended action, and the
 * reasoning behind it. The rationale is shown, not hidden behind a click, so the
 * recommendation can be challenged rather than merely followed.
 */
export default function VerdictBanner({ risk }) {
  if (!risk) {
    return (
      <div className="verdict-banner verdict-REVIEW">
        <div className="score-dial">?</div>
        <div>
          <div className="verdict-label">No assessment</div>
          <div className="verdict-explanation">
            This case did not complete screening, so no recommendation was produced.
          </div>
        </div>
      </div>
    )
  }

  const wording = {
    CLEAR: 'Clear to proceed',
    REVIEW: 'Refer to officer',
    REJECT: 'Do not accept',
  }

  return (
    <div className={`verdict-banner verdict-${risk.verdict}`}>
      <div className="score-dial">{risk.score}</div>
      <div>
        <div className="verdict-label">{wording[risk.verdict] || risk.verdict}</div>
        <div className="verdict-explanation">{risk.explanation}</div>
      </div>
    </div>
  )
}

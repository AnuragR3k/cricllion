'use client'

import type { TierId } from '@/lib/tiers'

const W = 700
const H = 168
const PAD_X = 28
const PAD_TOP = 26
const PAD_BOTTOM = 30
const MAX = 500

/**
 * The seven balls as a plain bar chart. No population data is invented: it
 * shows exactly the scores the player made, one bar per ball.
 */
export function ScoreComparisonChart({
  results,
}: {
  results: { score: number; tier: TierId | null }[]
}) {
  const base = H - PAD_BOTTOM
  const slot = (W - PAD_X * 2) / Math.max(results.length, 1)
  const barW = Math.min(46, Math.max(18, slot * 0.52))

  return (
    <svg
      className="score-bars"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Score for each of your seven balls"
    >
      <line
        x1={PAD_X}
        y1={base}
        x2={W - PAD_X}
        y2={base}
        stroke="var(--line)"
        strokeWidth="1"
      />
      {results.map((result, index) => {
        const height = Math.max(4, Math.round((result.score / MAX) * (base - PAD_TOP)))
        const x = PAD_X + slot * index + (slot - barW) / 2
        const color = result.tier ? `var(--tier-${result.tier})` : 'var(--tier-miss)'
        return (
          <g key={index}>
            <rect x={x} y={base - height} width={barW} height={height} fill={color} opacity="0.88" />
            <rect
              x={x}
              y={base - height}
              width={barW}
              height="2"
              fill="var(--ink)"
              opacity="0.45"
            />
            <text x={x + barW / 2} y={base - height - 7} textAnchor="middle" className="bars-value">
              {result.score}
            </text>
            <text x={x + barW / 2} y={base + 17} textAnchor="middle" className="bars-label">
              {index + 1}
            </text>
          </g>
        )
      })}
      <text x={PAD_X} y={H - 4} className="bars-label">
        0
      </text>
      <text x={W - PAD_X} y={H - 4} textAnchor="end" className="bars-label">
        500
      </text>
    </svg>
  )
}
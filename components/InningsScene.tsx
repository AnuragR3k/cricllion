'use client'

import type { ResultItem } from '@/lib/client-types'

const CX = 320
const CY = 198
const RX = 248
const RY = 108

/**
 * A pixel wagon wheel: one line per ball, from the batter to where the shot
 * went. Longer line, rarer answer. Drawn as SVG so it matches the rest of the
 * cabinet rather than dropping a lit 3D scene into it.
 */
export default function InningsScene({ results }: { results: ResultItem[] }) {
  return (
    <div className="shotmap">
      <div className="shotmap-title">
        Wagon wheel <span>longer shot = rarer answer</span>
      </div>
      <svg
        className="wagon"
        viewBox="0 0 640 330"
        role="img"
        aria-label="Wagon wheel of your seven shots"
      >
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="var(--panel-veil)"
          stroke="var(--line-2)"
          strokeWidth="2"
        />
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX * 0.56}
          ry={RY * 0.56}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <rect x={CX - 6} y={CY - 34} width="12" height="68" fill="var(--world-ground-2)" />
        <rect x={CX - 4} y={CY - 30} width="8" height="60" fill="var(--world-ground)" />

        {results.map((result, index) => {
          // One line per ball, evenly spread around the ground so no two shots
          // hide each other. Rarer answers reach further out.
          const angle = (index / Math.max(results.length, 1)) * Math.PI * 2 - Math.PI / 2
          const reach = result.tier ? 0.2 + (result.score / 500) * 0.72 : 0.16
          const x = CX + Math.cos(angle) * RX * reach
          const y = CY + Math.sin(angle) * RY * reach
          const color = result.tier ? `var(--tier-${result.tier})` : 'var(--tier-miss)'
          return (
            <g key={`${result.promptId}-${index}`}>
              <line
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke={color}
                strokeWidth="2"
                opacity="0.9"
              />
              <rect x={x - 3} y={y - 3} width="6" height="6" fill={color} />
            </g>
          )
        })}

        <rect x={CX - 2} y={CY - 2} width="4" height="4" fill="var(--ink)" />
        <text x={CX - RX - 6} y={CY + 3} textAnchor="end" className="wagon-label">
          LEG SIDE
        </text>
        <text x={CX + RX + 6} y={CY + 3} className="wagon-label">
          OFF SIDE
        </text>
      </svg>
    </div>
  )
}
/**
 * The floodlit-night arcade backdrop: a pixel sky, cricket grounds floating in
 * it, and a green outfield along the bottom. Pure SVG so every edge stays crisp
 * at any size, and every moving part is a transform the compositor can own.
 */

const STARS = Array.from({ length: 54 }, (_, i) => ({
  x: (i * 263 + 97) % 1600,
  y: ((i * i * 37 + i * 53) % 660) + 20,
  s: i % 4 === 0 ? 3 : 2,
  d: ((i * 7) % 53) / 10,
}))

function Floodlight({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="19" y="40" width="4" height="86" fill="var(--world-far)" />
      <rect x="11" y="56" width="20" height="3" fill="var(--world-far)" />
      <rect x="14" y="74" width="14" height="3" fill="var(--world-far)" />
      <g fill="var(--world-mid)">
        <rect x="8" y="34" width="26" height="4" />
        <rect x="5" y="28" width="32" height="4" />
        <rect x="2" y="22" width="38" height="4" />
        <rect x="0" y="16" width="42" height="4" />
      </g>
      <g fill="var(--world-light)">
        <rect x="4" y="17" width="4" height="2" />
        <rect x="12" y="17" width="4" height="2" />
        <rect x="20" y="17" width="4" height="2" />
        <rect x="28" y="17" width="4" height="2" />
        <rect x="36" y="17" width="4" height="2" />
        <rect x="6" y="23" width="4" height="2" />
        <rect x="14" y="23" width="4" height="2" />
        <rect x="22" y="23" width="4" height="2" />
        <rect x="30" y="23" width="4" height="2" />
      </g>
    </g>
  )
}

function Pavilion({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="12" y="42" width="116" height="56" fill="var(--world-far)" />
      <rect x="8" y="38" width="124" height="4" fill="var(--world-mid)" />
      <rect x="16" y="32" width="108" height="6" fill="var(--world-mid)" />
      <rect x="26" y="26" width="88" height="6" fill="var(--world-mid)" />
      <rect x="36" y="20" width="68" height="6" fill="var(--world-mid)" />
      <rect x="48" y="14" width="44" height="6" fill="var(--world-mid)" />
      <rect x="26" y="20" width="8" height="22" fill="var(--world-far)" />
      <rect x="106" y="20" width="8" height="22" fill="var(--world-far)" />
      <rect x="66" y="18" width="8" height="8" fill="var(--world-light)" />
      <rect x="70" y="46" width="16" height="52" fill="var(--world-mid)" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={22 + col * 17}
            y={50 + row * 14}
            width="7"
            height="8"
            fill={
              (row * 6 + col) % 7 === 0 ? 'var(--world-light)' : 'var(--world-mid)'
            }
          />
        )),
      )}
    </g>
  )
}

function Bowl({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="56" width="170" height="22" fill="var(--world-far)" />
      <rect x="12" y="48" width="146" height="8" fill="var(--world-far)" />
      <rect x="30" y="40" width="110" height="8" fill="var(--world-far)" />
      <rect x="52" y="32" width="66" height="8" fill="var(--world-far)" />
      <rect x="74" y="26" width="22" height="6" fill="var(--world-mid)" />
      <g fill="var(--world-mid)">
        <rect x="12" y="56" width="4" height="22" />
        <rect x="40" y="56" width="4" height="22" />
        <rect x="68" y="56" width="4" height="22" />
        <rect x="96" y="56" width="4" height="22" />
        <rect x="124" y="56" width="4" height="22" />
        <rect x="152" y="56" width="4" height="22" />
      </g>
      <g fill="var(--world-light)">
        <rect x="16" y="50" width="4" height="2" />
        <rect x="46" y="50" width="4" height="2" />
        <rect x="76" y="50" width="4" height="2" />
        <rect x="106" y="50" width="4" height="2" />
        <rect x="136" y="50" width="4" height="2" />
      </g>
    </g>
  )
}

function Stand({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="14" y="34" width="104" height="62" fill="var(--world-far)" />
      <rect x="22" y="26" width="88" height="8" fill="var(--world-far)" />
      <rect x="34" y="18" width="64" height="8" fill="var(--world-far)" />
      <rect x="28" y="14" width="76" height="4" fill="var(--world-mid)" />
      <rect x="44" y="10" width="44" height="4" fill="var(--world-mid)" />
      <g fill="var(--world-mid)">
        <rect x="22" y="40" width="6" height="56" />
        <rect x="50" y="40" width="6" height="56" />
        <rect x="78" y="40" width="6" height="56" />
        <rect x="106" y="40" width="6" height="56" />
      </g>
      <g fill="var(--world-light)">
        <rect x="26" y="20" width="3" height="2" />
        <rect x="38" y="20" width="3" height="2" />
        <rect x="50" y="20" width="3" height="2" />
        <rect x="62" y="20" width="3" height="2" />
        <rect x="74" y="20" width="3" height="2" />
        <rect x="86" y="20" width="3" height="2" />
      </g>
    </g>
  )
}

function Screen({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const cells: { cx: number; cy: number; on: boolean; warm: boolean }[] = []
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 10; col++) {
      const seed = row * 10 + col
      cells.push({
        cx: 9 + col * 7,
        cy: 9 + row * 6,
        on: seed % 3 !== 0,
        warm: seed % 11 === 0,
      })
    }
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="0" width="88" height="52" fill="var(--world-far)" />
      <rect x="4" y="4" width="80" height="36" fill="var(--world-deep)" />
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.cx}
          y={cell.cy}
          width="4"
          height="3"
          fill={cell.on ? (cell.warm ? 'var(--world-warm)' : 'var(--world-light)') : 'var(--world-mid)'}
        />
      ))}
      <rect x="10" y="52" width="5" height="22" fill="var(--world-far)" />
      <rect x="73" y="52" width="5" height="22" fill="var(--world-far)" />
    </g>
  )
}

function Ball({ x, y }: { x: number; y: number }) {
  const rows = [
    [-14, 8, 16],
    [-11, 4, 20],
    [-8, 2, 26],
    [-5, 1, 30],
    [-2, 0, 32],
    [1, 0, 32],
    [4, 1, 30],
    [7, 2, 26],
    [10, 4, 20],
    [13, 8, 16],
  ]
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" r="34" fill="url(#px-ball-glow)" opacity="0.5" />
      <g className="px-pulse">
        {rows.map(([ry, rx, w], i) => (
          <rect key={i} x={-w / 2} y={ry} width={w} height="3" fill="var(--world-ball)" />
        ))}
        <g fill="var(--world-ball-dark)">
          <rect x="-1" y="-13" width="2" height="4" />
          <rect x="-2" y="-8" width="2" height="4" />
          <rect x="-1" y="-3" width="2" height="4" />
          <rect x="-2" y="2" width="2" height="4" />
          <rect x="-1" y="7" width="2" height="4" />
          <rect x="-2" y="11" width="2" height="3" />
        </g>
        <rect x="-10" y="-8" width="5" height="4" fill="var(--world-ball-light)" />
      </g>
    </g>
  )
}

function Batter({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="8" y="0" width="13" height="7" fill="var(--world-warm)" />
      <rect x="20" y="3" width="7" height="3" fill="var(--world-warm)" />
      <rect x="9" y="8" width="12" height="16" fill="var(--world-warm)" />
      <rect x="9" y="24" width="5" height="16" fill="var(--world-warm)" />
      <rect x="16" y="24" width="5" height="16" fill="var(--world-warm)" />
      <rect x="8" y="40" width="7" height="4" fill="var(--world-mid)" />
      <rect x="16" y="40" width="7" height="4" fill="var(--world-mid)" />
      <g transform="rotate(-28 22 14)">
        <rect x="21" y="2" width="4" height="30" fill="var(--world-warm-light)" />
        <rect x="20" y="30" width="6" height="3" fill="var(--world-mid)" />
      </g>
    </g>
  )
}

function Stumps({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="2" y="6" width="4" height="42" fill="var(--world-rim)" />
      <rect x="12" y="6" width="4" height="42" fill="var(--world-rim)" />
      <rect x="22" y="6" width="4" height="42" fill="var(--world-rim)" />
      <rect x="1" y="2" width="13" height="3" fill="var(--world-rim)" />
      <rect x="14" y="2" width="13" height="3" fill="var(--world-rim)" />
      <rect x="-8" y="48" width="44" height="3" fill="var(--world-ground-2)" />
    </g>
  )
}

function Bat({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-24)`}>
      <rect x="0" y="0" width="6" height="18" fill="var(--world-mid)" />
      <rect x="-3" y="18" width="12" height="26" fill="var(--world-far)" />
      <rect x="-1" y="20" width="8" height="22" fill="var(--world-warm)" />
    </g>
  )
}

function Trophy({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="8" y="2" width="28" height="3" fill="var(--world-gold)" />
      <rect x="11" y="5" width="22" height="9" fill="var(--world-gold)" />
      <rect x="16" y="14" width="12" height="7" fill="var(--world-gold)" />
      <rect x="20" y="21" width="4" height="9" fill="var(--world-gold)" />
      <rect x="12" y="30" width="20" height="4" fill="var(--world-gold)" />
      <rect x="8" y="34" width="28" height="3" fill="var(--world-gold)" />
      <rect x="3" y="5" width="4" height="9" fill="var(--world-gold)" />
      <rect x="37" y="5" width="4" height="9" fill="var(--world-gold)" />
    </g>
  )
}

export default function PixelWorld() {
  return (
    <div className="px-world" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--world-sky-top)" />
            <stop offset="0.55" stopColor="var(--world-sky-mid)" />
            <stop offset="1" stopColor="var(--world-sky-low)" />
          </linearGradient>
          <radialGradient id="px-ball-glow">
            <stop offset="0" stopColor="var(--world-ball)" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="var(--world-ball)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--world-ball)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#px-sky)" />

        <g className="px-stars">
          {STARS.map((star, i) => (
            <rect
              key={i}
              x={star.x}
              y={star.y}
              width={star.s}
              height={star.s}
              fill="var(--world-star)"
              className="px-twinkle"
              style={{ animationDelay: `${star.d}s` }}
            />
          ))}
        </g>

        <g className="px-haze">
          <rect x="0" y="138" width="1600" height="2" fill="var(--world-haze)" />
          <rect x="0" y="286" width="1600" height="1" fill="var(--world-haze)" />
          <rect x="0" y="438" width="1600" height="2" fill="var(--world-haze)" />
          <rect x="0" y="598" width="1600" height="1" fill="var(--world-haze)" />
          <rect x="0" y="702" width="1600" height="2" fill="var(--world-haze)" />
        </g>

        <g className="px-monuments">
          <Floodlight x={56} y={128} scale={1.05} />
          <Pavilion x={120} y={252} scale={0.85} />
          <Bowl x={286} y={72} scale={0.8} />
          <Stand x={470} y={96} scale={0.7} />
          <Screen x={1330} y={352} scale={0.92} />
          <Stand x={908} y={214} scale={0.95} />
          <Bowl x={1150} y={70} scale={0.62} />
          <Floodlight x={1448} y={560} scale={0.9} />
          <Pavilion x={40} y={556} scale={0.55} />
        </g>

        <g className="px-captions">
          <text x={56} y={248} className="px-caption" textAnchor="middle">
            HEADINGLEY
          </text>
          <text x={56} y={259} className="px-caption px-caption-year" textAnchor="middle">
            1890
          </text>
          <text x={141} y={402} className="px-caption" textAnchor="middle">
            LORD&apos;S
          </text>
          <text x={141} y={413} className="px-caption px-caption-year" textAnchor="middle">
            1814
          </text>
          <text x={354} y={188} className="px-caption" textAnchor="middle">
            MCG
          </text>
          <text x={354} y={199} className="px-caption px-caption-year" textAnchor="middle">
            1853
          </text>
          <text x={956} y={360} className="px-caption" textAnchor="middle">
            EDEN GARDENS
          </text>
          <text x={956} y={371} className="px-caption px-caption-year" textAnchor="middle">
            1864
          </text>
          <text x={1200} y={196} className="px-caption" textAnchor="middle">
            WANKHEDE
          </text>
          <text x={1200} y={207} className="px-caption px-caption-year" textAnchor="middle">
            1974
          </text>
          <text x={1374} y={462} className="px-caption" textAnchor="middle">
            THE OVAL
          </text>
          <text x={1374} y={473} className="px-caption px-caption-year" textAnchor="middle">
            1845
          </text>
        </g>

        <g className="px-ground">
          <path
            d="M0 806 H120 V788 H226 V800 H332 V772 H444 V794 H556 V776 H668 V800 H780 V768 H892 V790 H1004 V774 H1116 V798 H1228 V778 H1340 V796 H1452 V774 H1600 V900 H0 Z"
            fill="var(--world-ground-2)"
          />
          <path
            d="M0 770 H120 V752 H226 V764 H332 V736 H444 V758 H556 V740 H668 V764 H780 V732 H892 V754 H1004 V738 H1116 V762 H1228 V742 H1340 V760 H1452 V738 H1600 V900 H0 Z"
            fill="var(--world-ground)"
          />
          <path
            d="M0 770 H120 V752 H226 V764 H332 V736 H444 V758 H556 V740 H668 V764 H780 V732 H892 V754 H1004 V738 H1116 V762 H1228 V742 H1340 V760 H1452 V738 H1600"
            fill="none"
            stroke="var(--world-rim)"
            strokeWidth="2"
          />
          <g fill="var(--world-grass)">
            <rect x="70" y="790" width="3" height="6" />
            <rect x="160" y="812" width="3" height="5" />
            <rect x="280" y="784" width="3" height="6" />
            <rect x="390" y="800" width="3" height="5" />
            <rect x="520" y="786" width="3" height="6" />
            <rect x="640" y="806" width="3" height="5" />
            <rect x="760" y="780" width="3" height="6" />
            <rect x="880" y="798" width="3" height="5" />
            <rect x="1010" y="782" width="3" height="6" />
            <rect x="1140" y="802" width="3" height="5" />
            <rect x="1260" y="786" width="3" height="6" />
            <rect x="1390" y="800" width="3" height="5" />
            <rect x="1510" y="782" width="3" height="6" />
          </g>
        </g>

        <g className="px-sprites">
          <Bat x={396} y={726} />
          <Batter x={596} y={722} />
          <Ball x={786} y={748} />
          <Stumps x={962} y={715} />
          <Trophy x={1146} y={729} />
          <g transform="translate(1042 747)">
            <rect x="0" y="0" width="4" height="4" fill="var(--world-light)" />
            <rect x="0" y="5" width="4" height="9" fill="var(--world-light)" />
            <rect x="-2" y="14" width="3" height="5" fill="var(--world-light)" />
            <rect x="3" y="14" width="3" height="5" fill="var(--world-light)" />
          </g>
        </g>
      </svg>
      <div className="px-vignette" />
      <div className="px-scan" />
    </div>
  )
}
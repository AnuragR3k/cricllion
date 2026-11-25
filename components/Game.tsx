'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANSWER_MS, MISS_MARK, TIERS } from '@/lib/tiers'
import type { TierId } from '@/lib/tiers'
import { playConfirm, playCorrect, playWrong, setMuted } from '@/lib/sound'
import type {
  Prompt,
  ResultItem,
  Reveal,
  RevealedPrompt,
  Session,
  Summary,
} from '@/lib/client-types'

const PLAYER_KEY = 'dm-player-v1'

type Phase = 'loading' | 'intro' | 'playing' | 'done'

type ReviewState = {
  tier: TierId | null
  score: number
  displayAnswer: string
  raw: string
  quip: string | null
  matchType: 'exact' | 'alias' | 'fuzzy' | 'miss'
  autocorrected: boolean
}

/** A small side-to-side nudge so a wrong answer feels wrong. */
function shakeAnswerBox(field: HTMLInputElement | null): void {
  if (!field || typeof field.animate !== 'function') return
  field.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 380, easing: 'ease-in-out' },
  )
}

function buildShareText(summary: Summary): string {
  const row = summary.results
    .map((result) => (result.tier ? TIERS[result.tier].mark : MISS_MARK))
    .join(' ')
  return `Cricllion 🏏\n${summary.score}\n\n${row}`
}

/** A small coloured tile standing in for a tier icon. */
function TierTile({ tier, small = false }: { tier: TierId | null; small?: boolean }) {
  const info = tier ? TIERS[tier] : null
  return (
    <span
      className={`tier-tile${tier ? '' : ' miss'}${small ? ' small' : ''}`}
      style={{ '--tier': info?.color ?? 'var(--tier-miss)' } as CSSProperties}
      role="img"
      aria-label={info?.name ?? 'Miss'}
    >
      {info?.mark ?? MISS_MARK}
    </span>
  )
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const [index, setIndex] = useState(0)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [howtoOpen, setHowtoOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [echo, setEcho] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ raw: string; correction: string } | null>(null)
  const [muted, setMutedState] = useState(false)
  const [booting, setBooting] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState(ANSWER_MS)
  const [copied, setCopied] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const deadlineRef = useRef(0)
  const autoFiredRef = useRef(false)
  const submittingRef = useRef(false)
  const advanceRef = useRef<number | null>(null)
  const reviewRef = useRef<ReviewState | null>(null)

  reviewRef.current = review

  const loadReveal = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/reveal?runId=${encodeURIComponent(id)}`)
      if (!res.ok) return
      const data = (await res.json()) as Reveal
      setReveal(data)
    } catch {
      /* the sheet can retry later */
    }
  }, [])

  const completeInnings = useCallback(
    async (id: string, player: string) => {
      setCompleting(true)
      setError(null)
      try {
        const res = await fetch('/api/session/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ playerId: player, runId: id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not file the scorecard.')
        setSummary(data as Summary)
        setPhase('done')
        void loadReveal(id)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not file the scorecard.')
      } finally {
        setCompleting(false)
      }
    },
    [loadReveal],
  )

  const advance = useCallback(
    (next: ResultItem[]) => {
      if (advanceRef.current) {
        window.clearTimeout(advanceRef.current)
        advanceRef.current = null
      }
      if (next.length >= 7) {
        if (runId && playerId) void completeInnings(runId, playerId)
        return
      }
      setReview(null)
      setIndex(next.length)
      setInput('')
      setEcho(null)
      setConfirm(null)
      setRemaining(ANSWER_MS)
    },
    [completeInnings, runId, playerId],
  )

  const boot = useCallback(async () => {
    setBooting(true)
    setError(null)
    try {
      let id = ''
      try {
        id = localStorage.getItem(PLAYER_KEY) ?? ''
        if (!id) {
          id = crypto.randomUUID()
          localStorage.setItem(PLAYER_KEY, id)
        }
      } catch {
        id = crypto.randomUUID()
      }
      setPlayerId(id)

      // Always show the home page first. A session is drawn only when they play.
      setPhase('intro')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
      setPhase('intro')
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(
    () => () => {
      if (advanceRef.current) window.clearTimeout(advanceRef.current)
    },
    [],
  )

  const submitAnswer = useCallback(
    async (raw: string) => {
      if (!session || !playerId || !runId) return
      if (submittingRef.current || reviewRef.current) return
      const prompt = session.prompts[index]
      if (!prompt) return

      submittingRef.current = true
      setSending(true)
      setError(null)
      setEcho(null)
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            promptId: prompt.id,
            answer: raw,
            playerId,
            runId,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 410 || res.status === 404) {
            setRunId(null)
            setSession(null)
            setResults([])
            setIndex(0)
            setReview(null)
            setPhase('intro')
          }
          setError(data.error ?? 'Signal lost. Send it again.')
          submittingRef.current = false
          setSending(false)
          return
        }

        // Wrong answer: stay on the same ball and let them try again.
        if (data.retry) {
          setConfirm(null)
          setEcho(`“${raw.trim()}”: not in the book, try again`)
          setInput('')
          playWrong()
          shakeAnswerBox(inputRef.current)
          inputRef.current?.focus()
          return
        }

        // Close or alternate spelling: show the correction and ask them to
        // submit again (or edit) before it is recorded.
        if (data.confirm) {
          setEcho(null)
          setConfirm({ raw: data.raw ?? raw.trim(), correction: data.correction ?? raw })
          playConfirm()
          setInput(data.correction ?? raw)
          const field = inputRef.current
          field?.focus()
          field?.setSelectionRange(field.value.length, field.value.length)
          return
        }

        setConfirm(null)
        playCorrect(data.tier ?? null)
        const item: ResultItem = {
          promptId: prompt.id,
          slot: data.slot,
          answer: data.displayAnswer ?? raw,
          tier: data.tier ?? null,
          score: data.score ?? 0,
          quip: data.quip ?? null,
          miss: !data.tier,
          matchType: data.matchType ?? 'miss',
          autocorrected: data.autocorrected ?? false,
        }
        const next = [...results, item]
        setResults(next)
        setReview({
          tier: data.tier ?? null,
          score: data.score ?? 0,
          displayAnswer: data.displayAnswer ?? raw,
          raw,
          quip: data.quip ?? null,
          matchType: data.matchType ?? 'miss',
          autocorrected: data.autocorrected ?? false,
        })
        if (advanceRef.current) window.clearTimeout(advanceRef.current)
        advanceRef.current = window.setTimeout(() => advance(next), 3600)
      } catch {
        setError('Signal lost. Check your connection and send it again.')
      } finally {
        submittingRef.current = false
        setSending(false)
      }
    },
    [session, playerId, runId, index, results, advance],
  )

  const submitRef = useRef(submitAnswer)
  submitRef.current = submitAnswer

  // One clock per ball. Stops the moment a review card is on screen.
  useEffect(() => {
    if (phase !== 'playing' || review || results.length >= 7) return
    deadlineRef.current = Date.now() + ANSWER_MS
    autoFiredRef.current = false
    setRemaining(ANSWER_MS)
    const interval = window.setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now())
      setRemaining(left)
      if (left <= 0 && !autoFiredRef.current) {
        autoFiredRef.current = true
        void submitRef.current('')
      }
    }, 100)
    return () => window.clearInterval(interval)
  }, [phase, review, index, results.length])

  useEffect(() => {
    if (phase === 'playing' && !review) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(timer)
    }
  }, [phase, review, index])

  const start = useCallback(async () => {
    if (!playerId) return
    setError(null)
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not deal a fresh innings.')
      const next = data as Session
      setSession(next)
      setRunId(next.runId)
      setResults([])
      setIndex(0)
      setReview(null)
      setSummary(null)
      setEcho(null)
      setConfirm(null)
      setInput('')
      setRemaining(ANSWER_MS)
      setPhase('playing')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not deal a fresh innings.')
    }
  }, [playerId])

  const toggleSound = useCallback(() => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }, [muted])

  const handleShare = async () => {
    if (!summary) return
    const text = `${buildShareText(summary)}\n\n${window.location.origin}`
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch {
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setError('Clipboard is blocked. Select the scorecard and copy it by hand.')
    }
  }

  const liveScore = useMemo(
    () => results.reduce((total, result) => total + result.score, 0),
    [results],
  )

  if (booting) {
    return (
      <main className="shell">
        <div className="loading">Walking out to bat…</div>
      </main>
    )
  }

  return (
    <main className="shell">
      {phase === 'intro' ? (
        <Intro
          error={error}
          onStart={() => void start()}
          onRetry={() => void boot()}
          howtoOpen={howtoOpen}
          setHowtoOpen={setHowtoOpen}
        />
      ) : null}

      {phase === 'playing' && session ? (
        <Play
          session={session}
          index={index}
          results={results}
          review={review}
          remaining={remaining}
          input={input}
          sending={sending}
          completing={completing}
          liveScore={liveScore}
          error={error}
          echo={echo}
          confirm={confirm}
          muted={muted}
          onToggleSound={toggleSound}
          inputRef={inputRef}
          onInput={setInput}
          onSubmit={() => void submitAnswer(input.trim())}
          onNext={() => advance(results)}
          onFinish={() => runId && playerId && void completeInnings(runId, playerId)}
          onRestart={() => void start()}
          onHome={() => setPhase('intro')}
        />
      ) : null}

      {phase === 'done' && summary ? (
        <ResultView
          summary={summary}
          session={session}
          reveal={reveal}
          sheetOpen={sheetOpen}
          copied={copied}
          error={error}
          onShare={() => void handleShare()}
          onPlayAgain={() => void start()}
          onToggleSheet={() => {
            setSheetOpen((open) => !open)
            if (!reveal && summary) void loadReveal(summary.runId)
          }}
        />
      ) : null}

      {phase === 'done' && !summary ? <div className="loading">Checking the scorecard…</div> : null}
    </main>
  )
}

/* ------------------------------------------------------------------- intro */

function Intro({
  error,
  onStart,
  onRetry,
  howtoOpen,
  setHowtoOpen,
}: {
  error: string | null
  onStart: () => void
  onRetry: () => void
  howtoOpen: boolean
  setHowtoOpen: (open: boolean) => void
}) {
  return (
    <section className="intro">
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden="true" />

      {/* Top-left HUD */}
      <div className="hud-hud">
        <div className="hud-item">0 RR</div>
      </div>

      <div className="intro-body">
        <h1 className="hero">CRICLLION</h1>
        <p className="subtitle">CRICKET TRIVIA</p>
        <p className="tagline">
          Seven cricket prompts a game. Obscure answers earn more rating.
        </p>

        <div className="badge-row">
          <span className="badge">BETA</span>
          <span className="badge">LIMITED TIME</span>
        </div>

        {error ? <div className="banner">{error}</div> : null}

        <div className="actions">
          <button className="cta queue" onClick={onStart}>
            QUEUE UP ▲
          </button>
          <div className="meta-line answers">
            7 SIX ANSWERS = 700 PTS
          </div>
        </div>
        {error ? (
          <button className="cta ghost" onClick={onRetry} style={{ marginTop: 14 }}>
            Reload the pitch
          </button>
        ) : null}

        <div className="how-to-play">
          <button
            className="howto-btn"
            onClick={() => setHowtoOpen(!howtoOpen)}
            aria-expanded={howtoOpen}
          >
            HOW TO PLAY ▾
          </button>
          <div
            className="howto-panel"
            style={{ display: howtoOpen ? 'grid' : 'none' }}
          >
            <h3 className="howto-title">Rules</h3>
            <ul className="howto-list">
              <li>
                <strong>Seven prompts a game.</strong> Any questions from the
                whole book, answered in order — one ball per prompt.
              </li>
              <li>
                <strong>25 seconds per ball.</strong> Type your answer before
                the clock runs out; time-out counts as a miss.
              </li>
              <li>
                <strong>Scoring by rarity.</strong> The rarer the answer, the
                more points — from Duck (0) up to Six (100).
              </li>
              <li>
                <strong>Spelling is forgiven.</strong> Close matches count,
                but ambiguous answers are treated as a miss.
              </li>
              <li>
                <strong>Wrong? Try again.</strong> Only right answers count, so
                a miss never ends your ball early.
              </li>
              <li>
                <strong>Max score 700.</strong> Answer all seven as Sixes to
                top the leaderboard.
              </li>
              <li>
                <strong>Play as often as you like.</strong> Every new innings
                deals a fresh set of questions.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- play */

function Play({
  session,
  index,
  results,
  review,
  remaining,
  input,
  sending,
  completing,
  liveScore,
  error,
  echo,
  confirm,
  muted,
  onToggleSound,
  inputRef,
  onInput,
  onSubmit,
  onNext,
  onFinish,
  onRestart,
  onHome,
}: {
  session: Session
  index: number
  results: ResultItem[]
  review: ReviewState | null
  remaining: number
  input: string
  sending: boolean
  completing: boolean
  liveScore: number
  error: string | null
  echo: string | null
  confirm: { raw: string; correction: string } | null
  muted: boolean
  onToggleSound: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onInput: (value: string) => void
  onSubmit: () => void
  onNext: () => void
  onFinish: () => void
  onRestart: () => void
  onHome: () => void
}) {
  const prompt: Prompt | undefined = session.prompts[index]
  const seconds = Math.max(0, Math.ceil(remaining / 1000))
  const low = remaining <= 7000 && !review
  const step = Math.min(index + 1, 7)

  if (!prompt) {
    return (
      <div className="intro">
        <div className="banner">{error ?? 'That ball went missing.'}</div>
        <button className="cta" onClick={onRestart} style={{ marginTop: 20 }}>
          Start a new innings
        </button>
      </div>
    )
  }

  return (
    <section className="play-screen">
      <div className="dive-hud">
        <button className="icon-btn" type="button" onClick={onHome} aria-label="Back to home">
          <span aria-hidden="true">◀</span>
        </button>

        <div className="hud-cluster">
          <div className="hud-panel">
            <span className="hud-label">Ball</span>
            <span className="hud-value">
              {step}
              <i>/7</i>
            </span>
          </div>

          <div className="hud-progress">
            <div className="progress-squares" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, slot) => {
                const result = results[slot]
                return (
                  <span
                    key={slot}
                    className={`progress-square${result ? ' done' : ''}${
                      slot === index && !review && !result ? ' active' : ''
                    }`}
                    style={
                      result
                        ? { background: result.tier ? TIERS[result.tier].color : 'var(--tier-miss)' }
                        : undefined
                    }
                  />
                )
              })}
            </div>
            <div className="progress-caption">Prompt {step} of 7</div>
          </div>

          <div className="hud-panel score-panel">
            <span className="hud-label">Score</span>
            <span className="hud-value">{liveScore}</span>
          </div>
        </div>

        <button
          className={`icon-btn sound-icon${muted ? ' muted' : ''}`}
          type="button"
          onClick={onToggleSound}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          aria-pressed={muted}
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" />
            <path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {review ? (
        <ReviewCard review={review} onNext={onNext} />
      ) : (
        <div className="prompt-card">
          <div className="prompt-tag">Prompt {step} of 7</div>
          <h2 className="prompt-title">{prompt.text}</h2>
          <div className="prompt-sub">▾ rarer answers score higher ▾</div>
          <span className="prompt-scroll" aria-hidden="true" />
        </div>
      )}

      {confirm ? (
        <div className="sea-echo confirm">
          <span className="echo-fix">
            “{confirm.raw}” <i aria-hidden="true">→</i> “{confirm.correction}”
          </span>
          <span className="echo-hint">submit again to confirm · or edit</span>
        </div>
      ) : null}
      {echo ? <div className="sea-echo">{echo}</div> : null}
      {error ? <div className="sea-echo error">{error}</div> : null}

      {!review ? (
        results.length >= 7 ? (
            <div className="dive-bar">
              <button className="dive-btn wide" type="button" onClick={onFinish} disabled={completing}>
                {completing ? 'Filing…' : 'File the scorecard'}
              </button>
            </div>
          ) : (
            <form
              className="dive-bar"
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
              }}
            >
              <span className={`timer-ring${low ? ' low' : ''}`} aria-label={`${seconds} seconds on the ball`}>
                {seconds}
              </span>
              <input
                ref={inputRef}
                className="dive-input"
                value={input}
                onChange={(event) => onInput(event.target.value)}
                placeholder="type an answer…"
                aria-label="Your answer"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={120}
              />
              <button className="dive-btn" type="submit" disabled={sending}>
                {sending ? 'Locking…' : 'Lock in'}
              </button>
            </form>
          )
      ) : null}
    </section>
  )
}

function ReviewCard({ review, onNext }: { review: ReviewState; onNext: () => void }) {
  const tier = review.tier ? TIERS[review.tier] : null
  const color = tier ? tier.color : 'var(--tier-miss)'
  const timedOut = review.raw.trim().length === 0
  const showRaw =
    tier &&
    review.raw.trim().length > 0 &&
    review.raw.trim().toLowerCase() !== review.displayAnswer.toLowerCase()
  const autocorrected = review.autocorrected && tier && review.matchType !== 'exact'

  const title = timedOut ? 'Timed out' : tier ? tier.name : 'Not in the book'
  const subtitle = timedOut ? 'No answer' : tier ? review.displayAnswer : review.raw.trim() || '—'
  const note = timedOut
    ? 'The clock ran out'
    : tier
      ? tier.blurb
      : 'No match in the book'

  return (
    <div
      className={`review-overlay${timedOut || !tier ? ' soft' : ''}`}
      style={{ '--tier': color } as CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div className="review-card">
        <h2 className="review-title">{title}</h2>
        <div className="review-answer">{subtitle}</div>
        <div className="review-points">
          +{review.score} <i>pts</i>
        </div>
        <div className="review-note">{note}</div>
        {autocorrected ? (
          <div className="review-hint">Autocorrected to “{review.displayAnswer}”</div>
        ) : showRaw ? (
          <div className="review-hint">you said “{review.raw.trim()}”</div>
        ) : null}
        {review.quip ? <div className="review-quip">{review.quip}</div> : null}
        <button className="next-btn" type="button" onClick={onNext}>
          Next ▲
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ result */

/** A wagon wheel of the innings: one line per answer, longer = rarer. */
function InningsMap({ results }: { results: ResultItem[] }) {
  const cx = 160
  const cy = 120
  const rx = 145
  const ry = 105
  const squash = ry / rx

  return (
    <div className="shotmap">
      <div className="shotmap-title">
        Wagon wheel <span>· longer line = rarer answer</span>
      </div>
      <svg viewBox="0 0 320 240" role="img" aria-label="Map of your seven answers">
        <defs>
          <radialGradient id="ground" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(44, 100, 62, 0.88)" />
            <stop offset="100%" stopColor="rgba(16, 52, 34, 0.92)" />
          </radialGradient>
        </defs>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="url(#ground)"
          stroke="rgba(200, 235, 200, 0.4)"
          strokeWidth="1.5"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx * 0.62}
          ry={ry * 0.62}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
        />
        <line
          x1={cx}
          y1={cy - ry}
          x2={cx}
          y2={cy + ry}
          stroke="rgba(255, 255, 255, 0.1)"
        />
        <rect
          x={cx - 6}
          y={cy - 20}
          width="12"
          height="40"
          fill="rgba(196, 164, 110, 0.7)"
          stroke="rgba(255, 240, 210, 0.45)"
        />
        <line x1={cx - 14} y1={cy - 16} x2={cx + 14} y2={cy - 16} stroke="rgba(255,255,255,0.5)" />
        <line x1={cx - 14} y1={cy + 16} x2={cx + 14} y2={cy + 16} stroke="rgba(255,255,255,0.5)" />
        {results.map((result, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 7
          const reach = 24 + (result.score / 100) * 104
          const x = cx + Math.cos(angle) * reach
          const y = cy + Math.sin(angle) * reach * squash
          const color = result.tier ? TIERS[result.tier].color : 'var(--tier-miss)'
          return (
            <g key={result.promptId}>
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                style={{ stroke: color }}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={x} cy={y} r="4" style={{ fill: color }} />
              <text
                className="shotmap-num"
                x={x + Math.cos(angle) * 10}
                y={y + Math.sin(angle) * 10 + 3}
                textAnchor="middle"
              >
                {index + 1}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ResultView({
  summary,
  session,
  reveal,
  sheetOpen,
  copied,
  error,
  onShare,
  onPlayAgain,
  onToggleSheet,
}: {
  summary: Summary
  session: Session | null
  reveal: Reveal | null
  sheetOpen: boolean
  copied: boolean
  error: string | null
  onShare: () => void
  onPlayAgain: () => void
  onToggleSheet: () => void
}) {
  const bandTier = TIERS[summary.band.tier]
  const promptById = new Map(
    (session?.prompts ?? []).map((prompt, slot) => [`p${slot + 1}`, prompt.text]),
  )

  return (
    <>
      <section className="result-head">
        <div className="result-day">Innings complete</div>
        <div className="score-big">
          {summary.score}
          <span>/ 700</span>
        </div>
        <div className="band-name" style={{ '--tier': bandTier.color } as CSSProperties}>
          {bandTier.name}
        </div>
        <p className="verdict">{summary.band.verdict}</p>
        <div className="tier-row" aria-label="Your seven results">
          {summary.results.map((result) => (
            <TierTile key={result.promptId} tier={result.tier} />
          ))}
        </div>

        <InningsMap results={summary.results} />

        <div className="result-actions">
          <button className="cta" onClick={onPlayAgain}>
            Play again ▲
          </button>
          <button className="cta ghost" onClick={onShare}>
            {copied ? 'Copied' : 'Share scorecard'}
          </button>
          <button className="cta ghost" onClick={onToggleSheet}>
            {sheetOpen ? 'Hide answers' : 'Answer sheet'}
          </button>
        </div>
      </section>

      {error ? <div className="banner">{error}</div> : null}

      <section className="breakdown" aria-label="Innings breakdown">
        {summary.results.map((result) => (
          <div className="breakdown-row" key={result.promptId}>
            <TierTile tier={result.tier} small />
            <span>
              <span className="breakdown-q">{promptById.get(result.promptId)}</span>
              <span className={`breakdown-a${result.miss ? ' miss' : ''}`}>
                {result.miss ? `${result.answer || 'No answer'} — not in the book` : result.answer}
              </span>
            </span>
            <span className="breakdown-points">{result.score}</span>
          </div>
        ))}
      </section>

      {sheetOpen ? <AnswerSheet reveal={reveal} summary={summary} /> : null}
    </>
  )
}

/* ------------------------------------------------------------------- sheet */

const TIER_ORDER: TierId[] = ['six', 'four', 'two', 'slog', 'legbye', 'duck']

function AnswerSheet({ reveal, summary }: { reveal: Reveal | null; summary: Summary }) {
  if (!reveal) return <div className="loading">Opening the book…</div>
  const total = reveal.prompts.reduce((count, prompt) => count + prompt.answers.length, 0)

  return (
    <section className="sheet">
      <div className="sheet-intro">
        <h2>The answer sheet</h2>
        <span className="meta-line">{total.toLocaleString()} answers</span>
      </div>
      {reveal.prompts.map((prompt) => (
        <SheetPrompt
          key={prompt.id}
          prompt={prompt}
          mine={summary.results.find((result) => result.promptId === `p${prompt.slot}`)}
        />
      ))}
    </section>
  )
}

function SheetPrompt({ prompt, mine }: { prompt: RevealedPrompt; mine?: ResultItem }) {
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    answers: prompt.answers.filter((answer) => answer.tier === tier),
  })).filter((group) => group.answers.length > 0)
  const gem = prompt.answers.find((answer) => answer.tier === 'six')

  return (
    <details className="sheet-prompt">
      <summary>
        <span className="sheet-num">{String(prompt.slot).padStart(2, '0')}</span>
        <span className="sheet-text">{prompt.text}</span>
        <span className="sheet-you">
          {mine ? (mine.miss ? 'missed' : mine.answer) : ''}
        </span>
      </summary>
      <div className="sheet-body">
        {groups.map((group) => {
          const tier = TIERS[group.tier]
          return (
            <div
              className="tier-group"
              key={group.tier}
              style={{ '--tier': tier.color } as CSSProperties}
            >
              <h4>
                <TierTile tier={group.tier} small /> {tier.name}{' '}
                <span>· {tier.score} pts · {group.answers.length}</span>
              </h4>
              <div className="answer-list">
                {group.answers.map((answer) => (
                  <span
                    key={answer.answer}
                    className={group.tier === 'six' ? 'gem' : undefined}
                  >
                    {answer.answer}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {gem?.quip ? <p className="gem-quip">{gem.quip}</p> : null}
      </div>
    </details>
  )
}

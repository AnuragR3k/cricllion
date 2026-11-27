'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANSWER_MS, MISS_MARK, TIERS } from '@/lib/tiers'
import type { TierId } from '@/lib/tiers'
import { playConfirm, playCorrect, playWrong, setMuted } from '@/lib/sound'
import InningsScene from '@/components/InningsScene'
import PixelWorld from '@/components/PixelWorld'
import { ScoreComparisonChart } from '@/components/ScoreComparisonChart'
import PluckedText from '@/components/kokonutui/plucked-text'
import type {
  Prompt,
  ResultItem,
  Reveal,
  RevealedPrompt,
  Session,
  Summary,
} from '@/lib/client-types'

const PLAYER_KEY = 'dm-player-v1'
const COUNTDOWN_STEP_MS = 650

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

function todayIST(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
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
  const [countdown, setCountdown] = useState(0)
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
      setCountdown(3)
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

  // The 3-2-1 walk-up before each ball. The clock waits for it.
  useEffect(() => {
    if (phase !== 'playing' || review || results.length >= 7) return
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), COUNTDOWN_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [phase, review, countdown, results.length])

  // One clock per ball. Stops the moment a review card is on screen.
  useEffect(() => {
    if (phase !== 'playing' || review || results.length >= 7 || countdown > 0) return
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
  }, [phase, review, index, results.length, countdown])

  useEffect(() => {
    if (phase === 'playing' && !review && countdown === 0) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(timer)
    }
  }, [phase, review, index, countdown])

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
      setCountdown(3)
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
      <>
        <PixelWorld />
        <main className="shell">
          <div className="loading">Walking out to bat…</div>
        </main>
      </>
    )
  }

  return (
    <>
      {/* The backdrop sits beside the shell, not inside it: a positioned sibling
          of the content container can't out-paint the flow content. */}
      <PixelWorld />
      <main className="shell">
      {phase === 'intro' ? (
        <Intro
          error={error}
          onStart={() => void start()}
          onRetry={() => void boot()}
          howtoOpen={howtoOpen}
          setHowtoOpen={setHowtoOpen}
          muted={muted}
          onToggleSound={toggleSound}
        />
      ) : null}

      {phase === 'playing' && session ? (
        <Play
          session={session}
          index={index}
          results={results}
          review={review}
          remaining={remaining}
          countdown={countdown}
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
    </>
  )
}

/* ------------------------------------------------------------------- intro */

function Intro({
  error,
  onStart,
  onRetry,
  howtoOpen,
  setHowtoOpen,
  muted,
  onToggleSound,
}: {
  error: string | null
  onStart: () => void
  onRetry: () => void
  howtoOpen: boolean
  setHowtoOpen: (open: boolean) => void
  muted: boolean
  onToggleSound: () => void
}) {
  return (
    <section className="intro">
      <div className="hud">
        <div className="hud-left">
          <div className="hud-box">
            <span>Rating</span>
            <b>
              0<i>PTS</i>
            </b>
          </div>
        </div>
        <div />
        <div className="hud-right">
          <button
            className={`sound-btn${muted ? ' muted' : ''}`}
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
      </div>

      <div className="intro-body">
        <div className="wordmark">
          <PluckedText
            text="CRICLLION"
            className="wordmark"
            textClassName="wordmark-text"
            charClassName={(_, letterIndex) => (letterIndex < 4 ? 'wordmark-red' : 'wordmark-light')}
          />
        </div>

        <p className="wordmark-sub">Daily Cricket Trivia</p>
        <p className="intro-tagline">
          Seven prompts a day. The rarer your answer, the deeper it goes.
        </p>

        <div className="coverage">
          <span className="coverage-title">Coverage</span>
          <p>All-time cricket: Tests, ODIs, T20Is, the IPL and the women&apos;s game.</p>
          <p className="coverage-note">
            Answers come from a fixed book. Spelling is forgiven.
          </p>
        </div>

        {error ? <div className="banner">{error}</div> : null}

        <button className="queue-btn" type="button" onClick={onStart}>
          QUEUE UP ▲
        </button>

        <div className="intro-meta">
          <span>{todayIST()} · resets 00:00 IST</span>
          <span>
            <b>7 SIXES = 3,500 PTS</b>
          </span>
        </div>

        {error ? (
          <button className="action-btn" type="button" onClick={onRetry} style={{ marginTop: 12 }}>
            Reload the pitch
          </button>
        ) : null}

        <details
          className="rules"
          open={howtoOpen}
          onToggle={(event) => setHowtoOpen((event.currentTarget as HTMLDetailsElement).open)}
        >
          <summary>How to play ▾</summary>
          <div className="rules-body">
            <ul className="rules-list">
              <li>
                <strong>Seven prompts a game.</strong> Drawn from the whole book and served one
                per ball.
              </li>
              <li>
                <strong>20 seconds per ball.</strong> Type your answer before the clock runs out.
              </li>
              <li>
                <strong>Rarer answers score more.</strong> From a Single (1) up to a Six (500).
                Fail to answer and you are out for a Duck (0).
              </li>
              <li>
                <strong>Spelling is forgiven.</strong> Close matches count; an ambiguous answer is
                treated as a miss.
              </li>
              <li>
                <strong>A wrong answer costs nothing.</strong> Try again until the clock runs out.
              </li>
              <li>
                <strong>Max score 3,500.</strong> Answer all seven prompts as Sixes.
              </li>
            </ul>
          </div>
        </details>
      </div>

      <footer className="intro-foot">
        <span>Daily cricket dive</span>
        <span>20 seconds a ball</span>
        <span>One innings at a time</span>
      </footer>
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
  countdown,
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
  countdown: number
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
  const low = remaining <= 7000 && !review && countdown === 0
  const step = Math.min(index + 1, 7)
  const armed = !review && countdown === 0
  const meter = Math.max(0, Math.min(1, remaining / ANSWER_MS))

  // One distinct entrance per ball, drawn from the run id so it stays put on re-render.
  const reveals = useMemo(() => revealOrder(session.runId), [session.runId])
  const revealAnim = reveals[index % reveals.length]

  if (!prompt) {
    return (
      <section className="play-screen">
        <div className="stage">
          <div className="banner">{error ?? 'That ball went missing.'}</div>
        </div>
        <button className="action-btn" type="button" onClick={onRestart}>
          Start a new innings
        </button>
      </section>
    )
  }

  return (
    <section className="play-screen">
      <header className="hud">
        <div className="hud-left">
          <button className="home-btn" type="button" onClick={onHome} aria-label="Back to home">
            ◀ Home
          </button>
          <div className="hud-box">
            <span>Rating</span>
            <b>
              {liveScore}
              <i>PTS</i>
            </b>
          </div>
        </div>

        <div className="hud-center">
          <div className="pips" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, slot) => {
              const result = results[slot]
              return (
                <span
                  key={slot}
                  className={`pip${result ? ' done' : ''}${
                    slot === index && !review && countdown === 0 ? ' active' : ''
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
          <span className="pips-label">Daily · {step}/7</span>
        </div>

        <div className="hud-right">
          <div className={`hud-box hud-time${low ? ' low' : ''}`}>
            <span>Time</span>
            <b>
              {countdown > 0 ? '--' : seconds}
              <i>S</i>
            </b>
          </div>
          <button
            className={`sound-btn${muted ? ' muted' : ''}`}
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
      </header>

      <div className="stage">
        {review ? (
          <ReviewCard review={review} anim={revealAnim} onNext={onNext} />
        ) : countdown > 0 ? (
          <div className="countdown">
            <p className="countdown-label">Prompt {pad2(step)} in</p>
            <div className="countdown-num" key={countdown}>
              {countdown}
            </div>
          </div>
        ) : (
          <article className="prompt-card">
            <div className="prompt-tag">Prompt {pad2(step)} / 07</div>
            <h2 className="prompt-title">{prompt.text}</h2>
            <div className="prompt-meta">
              <span>All-time cricket</span>
              <span>Fewer picks = higher</span>
            </div>
          </article>
        )}
      </div>

      {confirm ? (
        <div className="echo confirm">
          <span>
            “{confirm.raw}” <i aria-hidden="true">→</i> “{confirm.correction}”
          </span>
          <span className="echo-hint">submit again to confirm · or edit</span>
        </div>
      ) : null}
      {echo ? <div className="echo">{echo}</div> : null}
      {error ? <div className="echo error">{error}</div> : null}

      {!review && countdown === 0 ? (
        results.length >= 7 ? (
          <div className="answer-dock">
            <div className="answer-bar">
              <button
                className="lock-btn wide"
                type="button"
                onClick={onFinish}
                disabled={completing}
              >
                {completing ? 'Filing…' : 'File the scorecard'}
              </button>
            </div>
          </div>
        ) : (
          <div className="answer-dock">
            <form
              className="answer-bar"
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
              }}
            >
              <div className="answer-field">
                <input
                  ref={inputRef}
                  className="answer-input"
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
                {armed ? (
                  <span
                    className={`answer-meter${low ? ' low' : ''}`}
                    style={{ transform: `scaleX(${meter})` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <button className="lock-btn" type="submit" disabled={sending}>
                {sending ? 'Locking…' : 'Lock in'}
              </button>
            </form>
          </div>
        )
      ) : null}
    </section>
  )
}

/** The cricket-flavoured entrances a scored ball can play. */
const REVEAL_ANIMS = [
  'ball',
  'drive',
  'umpire',
  'sweep',
  'yorker',
  'loft',
  'stumping',
  'bouncer',
  'reverse-swing',
  'googly',
  'carrom',
  'pull',
  'hook',
  'slog-sweep',
  'cut-shot',
  'run-out',
  'hat-trick',
  'scoreboard',
] as const

/**
 * Shuffle the entrances with the run id as the seed, so one innings draws a
 * different entrance each ball (seven balls, no repeats) and a reload of the
 * same run keeps the same order.
 */
function revealOrder(seed: string): string[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const pool: string[] = [...REVEAL_ANIMS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

function ReviewCard({
  review,
  anim,
  onNext,
}: {
  review: ReviewState
  anim: string
  onNext: () => void
}) {
  const tier = review.tier ? TIERS[review.tier] : null
  const color = tier ? tier.color : 'var(--tier-miss)'
  const timedOut = review.raw.trim().length === 0
  const showRaw =
    tier &&
    review.raw.trim().length > 0 &&
    review.raw.trim().toLowerCase() !== review.displayAnswer.toLowerCase()
  const autocorrected = review.autocorrected && tier && review.matchType !== 'exact'

  const title = timedOut ? 'Duck' : tier ? tier.name : 'Not in the book'
  const subtitle = timedOut ? 'No answer' : tier ? review.displayAnswer : review.raw.trim() || '—'
  const note = timedOut
    ? 'Out for a duck — the clock ran out'
    : tier
      ? tier.blurb
      : 'No match in the book'

  return (
    <div
      className="review-overlay"
      style={{ '--tier': color } as CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div
        className="review-card"
        data-reveal={timedOut || !tier ? 'bowled' : anim}
      >
        <h2 className={`rank${timedOut || !tier ? ' soft' : ''}`}>{title}</h2>
        <div className="review-answer">{subtitle}</div>
        <div className="review-points">
          +{review.score} <i>PTS</i>
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
    <section className="result">
      <header className="result-head">
        <p className="result-kicker">Daily climb · {summary.date}</p>
        <div className="result-score">
          {summary.score}
          <span>PTS</span>
        </div>
        <p className="result-avg" style={{ '--tier': bandTier.color } as CSSProperties}>
          Average answer: <b>{bandTier.name}</b> · {summary.band.verdict}
        </p>
      </header>

      <section className="result-panel" aria-label="Score by ball">
        <div className="result-panel-head">
          <span>Score by ball</span>
          <span>{summary.score.toLocaleString()} / 3,500</span>
        </div>
        <ScoreComparisonChart results={summary.results} />
      </section>

      <ol className="result-list" aria-label="Innings breakdown">
        {summary.results.map((result, slot) => {
          const tier = result.tier ? TIERS[result.tier] : null
          return (
            <li
              className="result-row"
              key={result.promptId}
              style={{ '--tier': tier?.color ?? 'var(--tier-miss)' } as CSSProperties}
            >
              <span className="row-num">{pad2(slot + 1)}</span>
              <span>
                <span className="row-a">{result.miss ? 'No answer' : result.answer}</span>
                <span className="row-q">{promptById.get(result.promptId)}</span>
                <span className="row-tier">{tier?.name ?? 'Miss'}</span>
              </span>
              <span className="row-pts">+{result.score}</span>
            </li>
          )
        })}
      </ol>

      <InningsScene results={summary.results} />

      {error ? <div className="banner">{error}</div> : null}

      <div className="result-actions">
        <button className="action-btn primary" type="button" onClick={onPlayAgain}>
          Play again ▲
        </button>
        <button className="action-btn" type="button" onClick={onShare}>
          {copied ? 'Copied' : 'Share scorecard'}
        </button>
        <button className="action-btn" type="button" onClick={onToggleSheet}>
          {sheetOpen ? 'Hide answers' : 'Answer sheet'}
        </button>
      </div>

      {sheetOpen ? <AnswerSheet reveal={reveal} summary={summary} /> : null}
    </section>
  )
}

/* ------------------------------------------------------------------- sheet */

const TIER_ORDER: TierId[] = ['six', 'four', 'two', 'slog', 'legbye', 'single', 'duck']

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
        <span className="sheet-num">{pad2(prompt.slot)}</span>
        <span className="sheet-text">{prompt.text}</span>
        <span className="sheet-you">{mine ? (mine.miss ? 'missed' : mine.answer) : ''}</span>
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
                  <span key={answer.answer} className={group.tier === 'six' ? 'gem' : undefined}>
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
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANSWER_MS, MISS_EMOJI, TIERS, TIERS_BY_DEPTH, tierScore } from '@/lib/tiers'
import type { Band, TierId } from '@/lib/tiers'
import type {
  Prompt,
  ResultItem,
  Reveal,
  RevealedPrompt,
  Summary,
  Today,
} from '@/lib/client-types'

const PLAYER_KEY = 'dm-player-v1'
const RUN_KEY = 'dm-run-v1'

type Phase = 'loading' | 'intro' | 'playing' | 'done'

type ReviewState = {
  tier: TierId | null
  score: number
  displayAnswer: string
  raw: string
  quip: string | null
}

function writeSavedRun(run: { date: string; runId: string; results: ResultItem[] }): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run))
  } catch {
    /* ignore */
  }
}

function clearSavedRun(): void {
  try {
    localStorage.removeItem(RUN_KEY)
  } catch {
    /* ignore */
  }
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildShareText(summary: Summary): string {
  const row = summary.results
    .map((result) => (result.tier ? TIERS[result.tier].emoji : MISS_EMOJI))
    .join('')
  return `Cricllion #${summary.dayNumber} 🏏\n${summary.score}\n\n${row}`
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [today, setToday] = useState<Today | null>(null)
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

  const loadReveal = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/reveal?date=${encodeURIComponent(date)}`)
      if (!res.ok) return
      const data = (await res.json()) as Reveal
      setReveal(data)
    } catch {
      /* the sheet can retry later */
    }
  }, [])

  const completeInnings = useCallback(
    async (id: string, date: string, player: string) => {
      setCompleting(true)
      setError(null)
      try {
        const res = await fetch('/api/today/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ date, playerId: player, runId: id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not file the scorecard.')
        setSummary(data as Summary)
        setPhase('done')
        clearSavedRun()
        void loadReveal(date)
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
        if (runId && today && playerId) void completeInnings(runId, today.date, playerId)
        return
      }
      setReview(null)
      setIndex(next.length)
      setInput('')
      setRemaining(ANSWER_MS)
    },
    [completeInnings, runId, today, playerId],
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

      const todayRes = await fetch('/api/today')
      if (!todayRes.ok) {
        const payload = await todayRes.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Could not load today’s dive.')
      }
      const todayData = (await todayRes.json()) as Today
      setToday(todayData)

      const statusRes = await fetch(
        `/api/status?date=${encodeURIComponent(todayData.date)}&playerId=${encodeURIComponent(id)}`,
      )
      if (statusRes.ok) {
        const status = await statusRes.json()
        if (status?.completed) {
          setSummary(status as Summary)
          setPhase('done')
          setBooting(false)
          return
        }
      }

      // Always show the home page first. Let the user choose to begin.
      setPhase('intro')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
      setPhase('intro')
    } finally {
      setBooting(false)
    }
  }, [completeInnings])

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
      if (!today || !playerId || !runId) return
      if (submittingRef.current || reviewRef.current) return
      const prompt = today.prompts[index]
      if (!prompt) return

      submittingRef.current = true
      setSending(true)
      setError(null)
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            date: today.date,
            promptId: prompt.id,
            answer: raw,
            playerId,
            runId,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 410) {
            clearSavedRun()
            setRunId(null)
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

        const item: ResultItem = {
          promptId: prompt.id,
          slot: data.slot,
          answer: data.displayAnswer ?? raw,
          tier: data.tier ?? null,
          score: data.score ?? 0,
          quip: data.quip ?? null,
          miss: !data.tier,
        }
        const next = [...results, item]
        setResults(next)
        writeSavedRun({ date: today.date, runId, results: next })
        setReview({
          tier: data.tier ?? null,
          score: data.score ?? 0,
          displayAnswer: data.displayAnswer ?? raw,
          raw,
          quip: data.quip ?? null,
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
    [today, playerId, runId, index, results, advance],
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

  const start = useCallback(() => {
    if (!today) return
    const id = crypto.randomUUID()
    setRunId(id)
    setResults([])
    setIndex(0)
    setReview(null)
    setSummary(null)
    setError(null)
    setInput('')
    setRemaining(ANSWER_MS)
    setPhase('playing')
    writeSavedRun({ date: today.date, runId: id, results: [] })
  }, [today])

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

  const countdown = useCountdown(today?.resetsAt)

  const liveScore = useMemo(
    () => results.reduce((total, result) => total + result.score, 0),
    [results],
  )

  if (booting) {
    return (
      <main className="shell">
        <TopBar dayNumber={today?.dayNumber} />
        <div className="loading">Walking out to bat…</div>
      </main>
    )
  }

  if (!today) {
    return (
      <main className="shell">
        <TopBar />
        <div className="intro">
          {error ? <div className="banner">{error}</div> : null}
          <button className="cta" onClick={() => void boot()} style={{ marginTop: 24 }}>
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="shell">
      <TopBar dayNumber={today.dayNumber} />

      {phase === 'intro' ? (
        <Intro
          today={today}
          error={error}
          onStart={start}
          onRetry={() => void boot()}
          howtoOpen={howtoOpen}
          setHowtoOpen={setHowtoOpen}
        />
      ) : null}

      {phase === 'playing' ? (
        <Play
          today={today}
          index={index}
          results={results}
          review={review}
          remaining={remaining}
          input={input}
          sending={sending}
          completing={completing}
          liveScore={liveScore}
          error={error}
          inputRef={inputRef}
          onInput={setInput}
          onSubmit={() => void submitAnswer(input.trim())}
          onNext={() => advance(results)}
          onFinish={() => runId && playerId && void completeInnings(runId, today.date, playerId)}
          onRestart={start}
        />
      ) : null}

      {phase === 'done' && summary ? (
        <ResultView
          summary={summary}
          today={today}
          reveal={reveal}
          sheetOpen={sheetOpen}
          countdown={countdown}
          copied={copied}
          error={error}
          onShare={() => void handleShare()}
          onToggleSheet={() => {
            setSheetOpen((open) => !open)
            if (!reveal) void loadReveal(today.date)
          }}
        />
      ) : null}

      {phase === 'done' && !summary ? <div className="loading">Checking the scorecard…</div> : null}
    </main>
  )
}

/* ------------------------------------------------------------------ chrome */

function TopBar({ dayNumber }: { dayNumber?: number }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="stumps" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="brand-name">Cricllion</span>
      </div>
      {typeof dayNumber === 'number' ? (
        <span className="daychip">Day {dayNumber}</span>
      ) : (
        <span className="daychip">The daily dive</span>
      )}
    </header>
  )
}

/* ------------------------------------------------------------------- intro */

function Intro({
  today,
  error,
  onStart,
  onRetry,
  howtoOpen,
  setHowtoOpen,
}: {
  today: Today
  error: string | null
  onStart: () => void
  onRetry: () => void
  howtoOpen: boolean
  setHowtoOpen: (open: boolean) => void
}) {
  return (
    <section className="intro">
      <div className="pitch-scene" aria-hidden="true">
        <div className="sky"></div>
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="sun"></div>
        <div className="pitch"></div>
        <div className="creases"></div>
        <div className="stumps">
          <span className="stump" style={{ left: '44%' }} />
          <span className="stump" style={{ left: '50%' }} />
          <span className="stump" style={{ left: '56%' }} />
          <span className="bail" style={{ left: '47%', top: '34%' }} />
          <span className="bail" style={{ left: '53%', top: '34%' }} />
        </div>
        <div className="ball" />
        <div className="glare" />
      </div>

      <div className="intro-body">
        <p className="kicker">The daily cricket dive</p>
        <h1 className="hero">
          C<span className="glitch" data-text="R">R</span>I<span className="glitch" data-text="C">C</span>L<span className="glitch" data-text="L">L</span>ION
        </h1>
        <p className="subtitle">THE DAILY DIVE</p>
        <p className="tagline">
          7 prompts · 25 seconds each · rarer answers sink deeper
        </p>

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
                <strong>One innings per day.</strong> Seven prompts, answered in
                order — one ball per prompt.
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
                <strong>One answer per ball.</strong> Can't change after
                sending.
              </li>
              <li>
                <strong>Max score 700.</strong> Answer all seven as Sixes to
                top the leaderboard.
              </li>
              <li>
                <strong>Resets at midnight IST.</strong> A fresh dive every
                day.
              </li>
            </ul>
          </div>
        </div>

        <div className="badge-row">
          <span className="badge">BETA</span>
          <span className="badge">LIMITED TIME</span>
        </div>

        {error ? <div className="banner">{error}</div> : null}

        <div className="actions">
          <button className="cta primary" onClick={onStart}>
            BEGIN INNINGS
          </button>
          <span className="meta-line">
            {formatDate(today.date)} · Day {today.dayNumber} · 7 balls · 25s each
          </span>
        </div>
        {error ? (
          <button className="cta ghost" onClick={onRetry} style={{ marginTop: 14 }}>
            Reload the pitch
          </button>
        ) : null}

        <div className="section-label">How it scores</div>
        <div className="ladder">
          {TIERS_BY_DEPTH.map((tier) => (
            <div className="ladder-row" key={tier.id}>
              <span className="emoji" aria-hidden="true">
                {tier.emoji}
              </span>
              <span className="ladder-name">
                {tier.name}
                <span className="ladder-blurb">{tier.blurb}</span>
              </span>
              <span className="ladder-points">{tier.score} pts</span>
            </div>
          ))}
        </div>

        <div className="footnote">
          <span>Max 700 · resets at midnight IST</span>
          <span>All-time cricket, one answer per ball</span>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- play */

function Play({
  today,
  index,
  results,
  review,
  remaining,
  input,
  sending,
  completing,
  liveScore,
  error,
  inputRef,
  onInput,
  onSubmit,
  onNext,
  onFinish,
  onRestart,
}: {
  today: Today
  index: number
  results: ResultItem[]
  review: ReviewState | null
  remaining: number
  input: string
  sending: boolean
  completing: boolean
  liveScore: number
  error: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onInput: (value: string) => void
  onSubmit: () => void
  onNext: () => void
  onFinish: () => void
  onRestart: () => void
}) {
  const prompt: Prompt | undefined = today.prompts[index]
  const seconds = (remaining / 1000).toFixed(1)
  const low = remaining <= 7000 && !review

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
    <section>
      <div className="playhead">
        <div className="ballcount">
          Ball <b>{Math.min(index + 1, 7)}</b> / 7
        </div>
        <div className="live-score">
          <b>{liveScore}</b> pts
        </div>
      </div>

      <div className="stumps-row" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, slot) => {
          const result = results[slot]
          return (
            <span
              key={slot}
              className="stump-mark"
              style={
                result
                  ? {
                      background: result.tier ? TIERS[result.tier].color : 'var(--tier-miss)',
                    }
                  : undefined
              }
            />
          )
        })}
      </div>

      <div className="timer-wrap">
        <div className="timer-meta">
          <span>{review ? 'Answer locked' : 'Time on the ball'}</span>
          <span className={`seconds${low ? ' low' : ''}`}>{review ? '—' : `${seconds}s`}</span>
        </div>
        <div className="timer-track">
          <div
            className="timer-fill"
            style={{ width: review ? '0%' : `${Math.max(0, (remaining / ANSWER_MS) * 100)}%` }}
          />
        </div>
      </div>

      <div className="prompt-block">
        <p className="prompt-text">{prompt.text}</p>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      {review ? (
        <ReviewCard review={review} onNext={onNext} />
      ) : results.length >= 7 ? (
        <div className="actions">
          <button className="cta" onClick={onFinish} disabled={completing}>
            {completing ? 'Filing…' : 'File the scorecard'}
          </button>
        </div>
      ) : (
        <>
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <input
              ref={inputRef}
              className="answer-input"
              value={input}
              onChange={(event) => onInput(event.target.value)}
              placeholder="Your answer"
              aria-label="Your answer"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={120}
            />
            <button className="send" type="submit" disabled={sending}>
              {sending ? 'Sending' : 'Send'}
            </button>
          </form>
          <p className="hint">Enter to send · spelling is forgiven · one answer per ball</p>
        </>
      )}
    </section>
  )
}

function ReviewCard({ review, onNext }: { review: ReviewState; onNext: () => void }) {
  const tier = review.tier ? TIERS[review.tier] : null
  const color = tier ? tier.color : 'var(--tier-miss)'
  const showRaw =
    tier &&
    review.raw.trim().length > 0 &&
    review.raw.trim().toLowerCase() !== review.displayAnswer.toLowerCase()

  return (
    <div className="review" style={{ '--tier': color } as CSSProperties} role="status" aria-live="polite">
      <div className="review-top">
        <span className="tier-chip">
          {tier ? `${tier.emoji} ${tier.name}` : `${MISS_EMOJI} Miss`}
        </span>
        <span className="points">{review.score > 0 ? `+${review.score}` : '0'}</span>
      </div>
      <p className="review-answer">
        <small>{tier ? 'The book says' : 'Not in the book'}</small>
        {tier ? review.displayAnswer : review.raw || '—'}
      </p>
      {showRaw ? <p className="hint">you said “{review.raw.trim()}”</p> : null}
      {review.quip ? <p className="quip">{review.quip}</p> : null}
      <button
        className="next-hint"
        onClick={onNext}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        Next ball →
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ result */

function ResultView({
  summary,
  today,
  reveal,
  sheetOpen,
  countdown,
  copied,
  error,
  onShare,
  onToggleSheet,
}: {
  summary: Summary
  today: Today
  reveal: Reveal | null
  sheetOpen: boolean
  countdown: string
  copied: boolean
  error: string | null
  onShare: () => void
  onToggleSheet: () => void
}) {
  const bandTier = TIERS[summary.band.tier]
  const promptById = new Map(today.prompts.map((prompt, slot) => [`p${slot + 1}`, prompt.text]))

  return (
    <>
      <section className="result-head">
        <div className="result-day">
          Innings complete · {formatDate(summary.date)}
        </div>
        <div className="score-big">
          {summary.score}
          <span>/ 700</span>
        </div>
        <div className="band-name" style={{ '--tier': bandTier.color } as CSSProperties}>
          {bandTier.name}
        </div>
        <p className="verdict">{summary.band.verdict}</p>
        <div className="emoji-row" aria-label="Your seven results">
          {summary.results
            .map((result) => (result.tier ? TIERS[result.tier].emoji : MISS_EMOJI))
            .join(' ')}
        </div>
        {summary.streak > 1 ? (
          <div className="streak-line">{summary.streak}-day streak</div>
        ) : null}

        <div className="result-actions">
          <button className="cta" onClick={onShare}>
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
            <span className="breakdown-tier" aria-hidden="true">
              {result.tier ? TIERS[result.tier].emoji : MISS_EMOJI}
            </span>
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

      <div className="countdown">Next dive in {countdown}</div>
    </>
  )
}

/* ------------------------------------------------------------------- sheet */

const TIER_ORDER: TierId[] = ['six', 'four', 'two', 'slog', 'duck']

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
                {tier.emoji} {tier.name} <span>· {tier.score} pts · {group.answers.length}</span>
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

/* ---------------------------------------------------------------- countdown */

function useCountdown(resetsAt?: string): string {
  const [text, setText] = useState('--:--:--')

  useEffect(() => {
    if (!resetsAt) return
    const tick = () => {
      const ms = new Date(resetsAt).getTime() - Date.now()
      if (!Number.isFinite(ms) || ms <= 0) {
        setText('00:00:00')
        return
      }
      const hours = Math.floor(ms / 3600000)
      const minutes = Math.floor((ms % 3600000) / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      setText(
        [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':'),
      )
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [resetsAt])

  return text
}

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Direction = 'ltr' | 'rtl'

type Train = {
  id: number
  emoji: string
  lane: number
  direction: Direction
  durationMs: number
  startedAt: number
}

type Puff = {
  id: number
  x: number
  y: number
  char: string
}

type Celebration = {
  id: number
  count: number
}

type ConfettiPiece = {
  id: number
  x: number
  drift: number
  delayMs: number
  durationMs: number
  rotation: number
  color: string
  shape: 'strip' | 'square' | 'circle'
}

type ConfettiStyle = CSSProperties & {
  '--confetti-x': string
  '--confetti-drift': string
  '--confetti-color': string
  '--confetti-rotation': string
}

const TRAIN_EMOJIS = ['🚂', '🚃', '🚅', '🚋', '🚄']
const PUFF_CHARS = ['·', '°', '・', '∘']
const CONFETTI_COLORS = [
  '#db4437',
  '#f4b400',
  '#0f9d58',
  '#4285f4',
  '#ab47bc',
  '#00acc1',
  '#ff7043',
  '#7cb342',
]
const CONFETTI_PIECES: ConfettiPiece[] = Array.from({ length: 84 }, (_, i) => {
  const wave = Math.sin(i * 2.17)
  return {
    id: i,
    x: (i * 37) % 100,
    drift: Math.round(wave * 34),
    delayMs: (i % 14) * 72,
    durationMs: 2100 + (i % 9) * 130,
    rotation: ((i * 53) % 360) - 180,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: i % 5 === 0 ? 'circle' : i % 3 === 0 ? 'square' : 'strip',
  }
})
const LANE_COUNT = 5
const DISPATCH_THROTTLE_MS = 120
const PUFF_COUNT = 4
const MIN_DURATION_MS = 4500
const MAX_DURATION_MS = 7500

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function App() {
  const [trains, setTrains] = useState<Train[]>([])
  const [puffs, setPuffs] = useState<Puff[]>([])
  const [count, setCount] = useState(0)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('wtc:muted') === '1'
  })
  const [hasDispatched, setHasDispatched] = useState(false)

  const nextIdRef = useRef(1)
  const dispatchCountRef = useRef(0)
  const lastDispatchRef = useRef(0)
  const lastLaneRef = useRef(-1)
  const lastDirRef = useRef<Direction>('rtl')
  const chooRef = useRef<HTMLAudioElement | null>(null)
  const mutedRef = useRef(muted)

  useEffect(() => {
    mutedRef.current = muted
    localStorage.setItem('wtc:muted', muted ? '1' : '0')
  }, [muted])

  useEffect(() => {
    if (chooRef.current) return
    const choo = new Audio('/choo-choo.mp3')
    choo.preload = 'auto'
    chooRef.current = choo
  }, [])

  useEffect(() => {
    document.title =
      count === 0
        ? 'welcome to conductor'
        : `welcome to conductor (${count})`
  }, [count])

  const playChoo = useCallback(() => {
    if (mutedRef.current) return
    const choo = chooRef.current
    if (!choo) return
    const node = choo.cloneNode(true) as HTMLAudioElement
    node.volume = 0.28
    node.play().catch(() => {})
  }, [])

  const removeTrain = useCallback((id: number) => {
    setTrains((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const removePuff = useCallback((id: number) => {
    setPuffs((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const dispatch = useCallback(() => {
    const now = performance.now()
    if (now - lastDispatchRef.current < DISPATCH_THROTTLE_MS) return
    lastDispatchRef.current = now

    let lane = Math.floor(Math.random() * LANE_COUNT)
    if (lane === lastLaneRef.current) lane = (lane + 1) % LANE_COUNT
    lastLaneRef.current = lane

    const direction: Direction = lastDirRef.current === 'ltr' ? 'rtl' : 'ltr'
    lastDirRef.current = direction

    const durationMs = MIN_DURATION_MS + Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS)
    const train: Train = {
      id: nextIdRef.current++,
      emoji: pick(TRAIN_EMOJIS),
      lane,
      direction,
      durationMs,
      startedAt: now,
    }

    setTrains((prev) => [...prev, train])
    const nextCount = dispatchCountRef.current + 1
    dispatchCountRef.current = nextCount
    setCount(nextCount)
    if (nextCount % 10 === 0) {
      setCelebration({ id: nextIdRef.current++, count: nextCount })
    }
    setHasDispatched(true)
    playChoo()

    const y = 10 + train.lane * 16
    for (let i = 0; i < PUFF_COUNT; i++) {
      const t = (train.durationMs / (PUFF_COUNT + 1)) * (i + 1)
      setTimeout(() => {
        const elapsed = performance.now() - train.startedAt
        const progress = Math.min(elapsed / train.durationMs, 1)
        const x =
          train.direction === 'ltr' ? -15 + 130 * progress : 115 - 130 * progress
        setPuffs((prev) => [
          ...prev,
          { id: nextIdRef.current++, x, y, char: pick(PUFF_CHARS) },
        ])
      }, t)
    }
  }, [playChoo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        dispatch()
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  return (
    <main onClick={dispatch}>
      <div className={`hero${hasDispatched ? ' dispatched' : ''}`} aria-hidden={hasDispatched}>
        <span className="train-emoji" role="img" aria-label="train">🚂</span>
        <span className="tagline">click anywhere to dispatch a train</span>
      </div>

      {trains.map((t) => (
        <span
          key={t.id}
          className={`train ${t.direction}`}
          style={{
            top: `${10 + t.lane * 16}vh`,
            animationDuration: `${t.durationMs}ms`,
          }}
          onAnimationEnd={() => removeTrain(t.id)}
        >
          {t.emoji}
        </span>
      ))}

      {puffs.map((p) => (
        <span
          key={p.id}
          className="steam"
          style={{ left: `${p.x}vw`, top: `${p.y}vh` }}
          onAnimationEnd={() => removePuff(p.id)}
        >
          {p.char}
        </span>
      ))}

      {celebration && (
        <div
          key={celebration.id}
          className="celebration"
          role="status"
          aria-live="polite"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) setCelebration(null)
          }}
        >
          <div className="celebration-wash" aria-hidden="true" />
          <div className="celebration-spotlight left" aria-hidden="true" />
          <div className="celebration-spotlight right" aria-hidden="true" />
          <div className="confetti-field" aria-hidden="true">
            {CONFETTI_PIECES.map((piece) => {
              const style: ConfettiStyle = {
                '--confetti-x': `${piece.x}vw`,
                '--confetti-drift': `${piece.drift}vw`,
                '--confetti-color': piece.color,
                '--confetti-rotation': `${piece.rotation}deg`,
                animationDelay: `${piece.delayMs}ms`,
                animationDuration: `${piece.durationMs}ms`,
              }

              return (
                <span
                  key={piece.id}
                  className={`confetti ${piece.shape}`}
                  style={style}
                />
              )
            })}
          </div>
          <div className="celebration-burst" aria-hidden="true">
            <span>✦</span>
            <span>★</span>
            <span>✶</span>
            <span>✹</span>
            <span>✦</span>
            <span>★</span>
            <span>✷</span>
            <span>✸</span>
          </div>
          <div className="celebration-stage">
            <span className="celebration-kicker">dispatch milestone</span>
            <span className="celebration-count">{celebration.count}</span>
            <span className="celebration-copy">trains dispatched</span>
            <span className="celebration-train" aria-hidden="true">🚆</span>
            <div className="celebration-fleet" aria-hidden="true">
              <span>🚂</span>
              <span>🚃</span>
              <span>🚋</span>
              <span>🚄</span>
              <span>🚅</span>
            </div>
          </div>
        </div>
      )}

      <button
        className="mute-toggle"
        onClick={(e) => {
          e.stopPropagation()
          setMuted((m) => !m)
        }}
        aria-label={muted ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <div className="counter" aria-live="polite">
        {count} {count === 1 ? 'train' : 'trains'} dispatched
      </div>
    </main>
  )
}

export default App

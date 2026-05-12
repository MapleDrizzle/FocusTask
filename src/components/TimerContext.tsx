import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type Mood = "Low" | "Medium" | "High"

interface Session {
  id: number
  minutes: number
  completed: boolean
  isTest: boolean
  timeStr: string
  mood: Mood
}

interface TimerContextType {
  secondsLeft: number | null
  sessionDuration: number
  isRunning: boolean
  totalMinutes: number
  sessions: Session[]
  mood: Mood
  setMood: (m: Mood) => void
  startWithMinutes: (minutes: number) => void
  stopTimer: () => void
  addTestMinutes: () => void
}

const TimerContext = createContext<TimerContextType | null>(null)

export function TimerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [mood, setMood] = useState<Mood>("Medium")

  const [endTime, setEndTime] = useState<number | null>(null)
  const [sessionStart, setSessionStart] = useState<number | null>(null)

  const sessionStartRef = useRef<number | null>(null)

  useEffect(() => {
    sessionStartRef.current = sessionStart
  }, [sessionStart])

  const finishSession = (
    completed: boolean,
    isTest = false
  ) => {
    const start = sessionStartRef.current

    const elapsedMs = start
      ? Date.now() - start
      : 0

    const elapsedMinutes = Math.max(
      0,
      Math.round(elapsedMs / 60000)
    )

    setTotalMinutes((m) => m + elapsedMinutes)

    const now = new Date()

    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    setSessions((prev) => [
      {
        id: Date.now(),
        minutes: elapsedMinutes,
        completed,
        isTest,
        timeStr,
        mood,
      },
      ...prev,
    ])

    setSessionStart(null)
    sessionStartRef.current = null
    setEndTime(null)
  }

  useEffect(() => {
    if (!isRunning || !endTime) return

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((endTime - Date.now()) / 1000)
      )

      setSecondsLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        setIsRunning(false)
        finishSession(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, endTime])

  const startWithMinutes = (minutes: number) => {
    const start = Date.now()
    const duration = minutes * 60
    const end = start + duration * 1000

    setSecondsLeft(duration)
    setSessionDuration(duration)
    setSessionStart(start)
    sessionStartRef.current = start
    setEndTime(end)
    setIsRunning(true)
  }

  const stopTimer = () => {
    setIsRunning(false)
    finishSession(false)
    setSecondsLeft(null)
    setSessionDuration(0)
  }

  const addTestMinutes = () => {
    setTotalMinutes((m) => m + 15)
  }

  return (
    <TimerContext.Provider
      value={{
        secondsLeft,
        sessionDuration,
        isRunning,
        totalMinutes,
        sessions,
        mood,
        setMood,
        startWithMinutes,
        stopTimer,
        addTestMinutes,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimer() {
  const context = useContext(TimerContext)

  if (!context) {
    throw new Error(
      "useTimer must be used inside TimerProvider"
    )
  }

  return context
}
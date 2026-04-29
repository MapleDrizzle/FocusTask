import { useEffect, useState } from "react"
import TimerDisplay from "../components/TimerDisplay"
import "./Timer.css"

export default function Timer() {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const [completedTasks] = useState(3)
    const [totalMinutes, setTotalMinutes] = useState(0)
    const [sessionStart, setSessionStart] = useState<number | null>(null)

    useEffect(() => {
    if (!isRunning || secondsLeft === null) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)

          if (sessionStart) {
            const elapsedMs = Date.now() - sessionStart
            const elapsedMinutes = Math.floor(elapsedMs / 60000)
            setTotalMinutes((m) => m + elapsedMinutes)
            setSessionStart(null)
          }

          return 0
        }
        return prev - 1
      })
    }, 1000)
    
        return () => clearInterval(interval)
    }, [isRunning, secondsLeft])

    const startWithMinutes = (minutes: number) => {
        setSecondsLeft(minutes * 60)
        setSessionStart(Date.now())
        setShowModal(false)
        setIsRunning(true)
    }

    const stopTimer = () => {
        if (sessionStart) {
            const elapsedMs = Date.now() - sessionStart
            const elapsedMinutes = Math.floor(elapsedMs / 60000)
            setTotalMinutes((m) => m + elapsedMinutes)
        }

        setIsRunning(false)
        setSecondsLeft(null)
        setSessionStart(null)
    }

    return (
        <main className="timer-layout">
        <h1>Focus Tracker</h1>

        <div className="timer-top-cards">
            <div className="timer-card">
            <h2>Total Time</h2>
            <p>{totalMinutes} min</p>
            </div>

            <div className="timer-card">
            <h2>Tasks Done</h2>
            <p>{completedTasks}</p>
            </div>
        </div>

        <div className="timer-center">
            {secondsLeft === null ? (
            <button
                className="start-button"
                onClick={() => setShowModal(true)}
            >
                Start Timer
            </button>
            ) : (
            <>
                <TimerDisplay totalSeconds={secondsLeft} />
                <button className="stop-button" onClick={stopTimer}>
                Stop Timer
                </button>
            </>
            )}
        </div>

        {showModal && (
            <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <h2>Select Study Time</h2>
                <div className="time-options">
                {[15, 30, 45, 60].map((min) => (
                    <button key={min} onClick={() => startWithMinutes(min)}>
                    {min} min
                    </button>
                ))}
                </div>
                <button className="close" onClick={() => setShowModal(false)}>
                Cancel
                </button>
            </div>
            </div>
        )}
        </main>
    )
}

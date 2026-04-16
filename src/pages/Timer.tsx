import { useEffect, useState } from "react"
import TimerDisplay from "../components/TimerDisplay"

export default function Timer() {
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [completedTasks, setCompletedTasks] = useState(0)
    const [todayMinutes, setTodayMinutes] = useState(0)

    useEffect(() => {
        if (!isRunning) return

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev === 0) {
                    clearInterval(timer)
                    setIsRunning(false)
                    setTodayMinutes((m) => m + 45)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isRunning])

    const toggleTimer = () => setIsRunning((v) => !v)
    const resetTimer = () => {
        setIsRunning(false)
        setSecondsLeft(45 * 60)
    }

    return (
        <main className="timer-page">
            <h1>Time Tracker</h1>
            <section className="stats-grid" aria-label="Daily progress">
                <div className="card">
                <h2>Today's Time</h2>
                <p>{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</p>
                </div>

                <div className="card">
                <h2>Tasks Done</h2>
                <p>{completedTasks}/--</p>
                </div>
            </section>

            <section className="timer-card" aria-label="Focus timer">
                <TimerDisplay totalSeconds={secondsLeft} />

                <div className="button-row">
                <button onClick={toggleTimer}>
                    {isRunning ? 'Pause Timer' : 'Start Timer'}
                </button>
                <button onClick={resetTimer}>Reset</button>
                </div>
            </section>

            <section className="tasks-card">
                <h2>Upcoming Tasks</h2>
                <ul>
                <li>Task here</li>
                <li>Task here</li>
                <li>Task here</li>
                </ul>
            </section>
        </main>
    )
}

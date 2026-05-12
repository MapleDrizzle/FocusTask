import { useState } from "react"
import TimerDisplay from "../components/TimerDisplay"
import { useTimer } from "../components/TimerContext"
import "./Timer.css"

type Mood = "Low" | "Medium" | "High"

export default function Timer() {
  const {
    secondsLeft,
    sessionDuration,
    isRunning,
    totalMinutes,
    sessions,
    mood,
    setMood,
    startWithMinutes,
    stopTimer,
  } = useTimer()

  const [showModal, setShowModal] = useState(false)

  const completedTasks = 3

  const progressPct =
    sessionDuration > 0 && secondsLeft !== null
      ? (secondsLeft / sessionDuration) * 100
      : 0

  const moodColor = (m: Mood) =>
    m === "High"
      ? "#2e7d52"
      : m === "Low"
      ? "#c0392b"
      : "#b07d1a"

  return (
    <main className="timer-layout">
      <h1>Focus Timer</h1>

      {/* Top stat cards */}
      <div className="timer-top-cards">
        <div className="timer-stat-card">
          <h2>Total Time</h2>
          <p>{totalMinutes} min</p>
        </div>

        <div className="timer-stat-card">
          <h2>Sessions</h2>
          <p>{sessions.length}</p>
        </div>

        <div className="timer-stat-card">
          <h2>Tasks Done</h2>
          <p>{completedTasks}</p>
        </div>
      </div>

      {/* Main timer card */}
      <div className="timer-main-card">
        <TimerDisplay
          totalSeconds={secondsLeft ?? 0}
        />

        {/* Progress bar */}
        {isRunning && (
          <div
            className="progress-bar-wrap"
            aria-hidden="true"
          >
            <div
              className="progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        <p className="session-status-label">
          {isRunning
            ? "Session in progress"
            : "Ready to focus"}
        </p>

        {/* Mood selector */}
        {!isRunning && (
          <div
            className="mood-row"
            role="group"
            aria-label="Focus mood"
          >
            <span className="mood-label">
              Focus mood:
            </span>

            {(["Low", "Medium", "High"] as Mood[]).map(
              (m) => (
                <button
                  key={m}
                  className={`mood-btn${
                    mood === m ? " active" : ""
                  }`}
                  onClick={() => setMood(m)}
                  style={
                    mood === m
                      ? {
                          borderColor: moodColor(m),
                          color: moodColor(m),
                        }
                      : {}
                  }
                >
                  {m}
                </button>
              )
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="timer-actions">
          {!isRunning ? (
            <button
              className="start-button"
              onClick={() => setShowModal(true)}
            >
              ▶ Start Timer
            </button>
          ) : (
            <div className="running-btn-row">
              <button
                className="stop-button"
                onClick={stopTimer}
              >
                ⏹ Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Previous sessions */}
      <section className="sessions-section">
        <h3 className="section-heading">
          Previous Sessions
        </h3>

        <div className="sessions-card">
          {sessions.length === 0 ? (
            <p className="sessions-empty">
              No sessions yet — start your first timer!
            </p>
          ) : (
            sessions.map((s, i) => (
              <div
                key={s.id}
                className="session-row"
              >
                <span
                  className="session-dot"
                  style={{
                    background: moodColor(s.mood),
                  }}
                  title={`Mood: ${s.mood}`}
                />

                <div className="session-info">
                  <span className="session-name">
                    Session {sessions.length - i}

                    {s.isTest && (
                      <span className="test-tag">
                        test
                      </span>
                    )}
                  </span>

                  <span className="session-meta">
                    {s.timeStr} ·{" "}
                    {s.completed ? (
                      <span className="status-complete">
                        completed
                      </span>
                    ) : (
                      <span className="status-stopped">
                        stopped early
                      </span>
                    )}{" "}
                    · mood: {s.mood}
                  </span>
                </div>

                <span className="session-duration">
                  {s.minutes} min
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Time picker modal */}
      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            <h2>
              How long do you want to focus?
            </h2>

            <div className="time-options">
              {[5, 10, 15, 25, 30, 45, 60, 90].map(
                (min) => (
                  <button
                    key={min}
                    onClick={() => {
                      startWithMinutes(min)
                      setShowModal(false)
                    }}
                  >
                    {min} min
                  </button>
                )
              )}
            </div>

            <button
              className="close"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
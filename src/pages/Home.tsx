import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  getCourses,
  getAssignments,
  getAssignmentGroups,
  type Assignment,
  type AssignmentGroup,
  type Course,
} from "../api/canvasApi"
import "./Home.css"

const DONE_TASKS_KEY = "homepage-done-tasks"
const MINUTES_BY_DATE_KEY = "focusTrackerMinutesByDate"

function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function loadDoneTaskIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DONE_TASKS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((n) => typeof n === "number"))
  } catch {
    return new Set()
  }
}

function saveDoneTaskIds(ids: Set<number>) {
  localStorage.setItem(DONE_TASKS_KEY, JSON.stringify([...ids]))
}

type MinutesByDate = Record<string, number>

function loadMinutesByDate(): MinutesByDate {
  try {
    const raw = localStorage.getItem(MINUTES_BY_DATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as MinutesByDate
  } catch {
    return {}
  }
}

function getMinutesForToday(): number {
  const map = loadMinutesByDate()
  return map[getLocalDateKey()] ?? 0
}

function formatStudyMinutes(totalMinutes: number): string {
  const safe = Number.isFinite(totalMinutes) ? Math.max(0, Math.floor(totalMinutes)) : 0
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

function formatDueShort(dueAt: string): string {
  const d = new Date(dueAt)
  if (Number.isNaN(d.getTime())) return "Unknown date"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function useHomepageAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    async function fetchData() {
      const courses = await getCourses()

      const allAssignments = await Promise.all(
        courses.map(async (course: Course) => {
          const [data, groups] = await Promise.all([getAssignments(course.id), getAssignmentGroups(course.id)])

          return data.map((a: any) => {
            const assignment_group_name =
              groups.find((g: AssignmentGroup) => g.id === a.assignment_group_id)?.name ?? "Other"

            return {
              id: a.id,
              name: a.name,
              due_at: a.due_at,
              course_id: course.id,
              course_name: course.name,
              course_code: course.course_code,
              submitted_at: a.submission?.submitted_at ?? null,
              assignment_group_name,
            } satisfies Assignment
          })
        })
      )

      setAssignments(
        allAssignments
          .flat()
          .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
      )
    }

    fetchData().catch(console.error)
  }, [])

  return assignments
}

export default function Home() {
  const assignments = useHomepageAssignments()
  const [todayMinutes, setTodayMinutes] = useState<number>(() => getMinutesForToday())

  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<number>>(() => loadDoneTaskIds())

  useEffect(() => {
    setTodayMinutes(getMinutesForToday())
  }, [])

  useEffect(() => {
    saveDoneTaskIds(checkedTaskIds)
  }, [checkedTaskIds])

  const upcomingTasks = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 7)

    return assignments
      .filter((a) => {
        if (a.submitted_at) return false
        const due = new Date(a.due_at)
        return due >= now && due <= end
      })
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
      .slice(0, 8)
  }, [assignments])

  const tasksDone = useMemo(() => {
    return upcomingTasks.filter((t) => checkedTaskIds.has(t.id)).length
  }, [upcomingTasks, checkedTaskIds])

  function toggleTask(id: number) {
    setCheckedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className="home-page">
      <div className="home-shell">
        <h1 className="home-title">Focus Tracker Home</h1>

        <section className="home-metrics" aria-label="Today summary">
          <div className="home-card home-card--metric">
            <div className="home-card-label">Today's time</div>
            <div className="home-metric-value home-metric-value--mono">{formatStudyMinutes(todayMinutes)}</div>
          </div>

          <div className="home-card home-card--metric">
            <div className="home-card-label">Tasks Done</div>
            <div className="home-metric-value">
              {tasksDone}/{upcomingTasks.length}
            </div>
          </div>
        </section>

        <div className="home-card home-card--start">
          <Link to="/timer" className="home-start-link">
            <button className="home-start-button" type="button">
              START TIMER
            </button>
          </Link>
        </div>

        <section className="home-card home-card--upcoming" aria-label="Upcoming tasks">
          <div className="home-upcoming-header">
            <div className="home-upcoming-title">Upcoming Canvas Tasks:</div>
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="home-empty">No upcoming tasks in the next 7 days.</p>
          ) : (
            <ul className="home-task-list">
              {upcomingTasks.map((task) => {
                const isDone = checkedTaskIds.has(task.id)
                return (
                  <li key={task.id} className="home-task-item">
                    <label className={`home-task-label${isDone ? " is-done" : ""}`}>
                      <input type="checkbox" checked={isDone} onChange={() => toggleTask(task.id)} />
                      <span className="home-task-text">
                        <span className="home-task-course">{task.course_code}</span>
                        <span className="home-task-name">{task.name}</span>
                      </span>
                    </label>
                    <div className="home-task-due">{formatDueShort(task.due_at)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
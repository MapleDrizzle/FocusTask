import { useEffect, useMemo, useState, useCallback } from 'react'
import { getCourses, getAssignments, getAssignmentGroups, type Course, type Assignment, type AssignmentGroup } from '../api/canvasApi'
import './Schedule.css'

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'To Do' | 'In Progress' | 'Complete'

type DayEntry =
  | { type: 'day'; date: Date }
  | { type: 'range'; start: Date; end: Date }

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CYCLE: Status[] = ['To Do', 'In Progress', 'Complete']

// ─── Pure utilities ───────────────────────────────────────────────────────────

function nextStatus(current: Status): Status {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
}

function groupByDate(assignments: Assignment[]): Map<number, Assignment[]> {
  const map = new Map<number, Assignment[]>()
  for (const a of assignments) {
    const key = new Date(a.due_at).setHours(0, 0, 0, 0)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return map
}

function getTimeframeEnd(timeframe: string, lastAssignmentDate: Date | null): Date {
  const end = new Date()
  if (timeframe === 'next_week') end.setDate(end.getDate() + 7)
  else if (timeframe === 'next_2_weeks') end.setDate(end.getDate() + 14)
  else if (timeframe === 'next_month') end.setMonth(end.getMonth() + 1)
  else if (timeframe === 'everything') return lastAssignmentDate ?? end
  return end
}

function getPastTimeframeStart(pastTimeframe: string, firstAssignmentDate: Date | null): Date {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (pastTimeframe === 'last_week') start.setDate(start.getDate() - 7)
  else if (pastTimeframe === 'last_2_weeks') start.setDate(start.getDate() - 14)
  else if (pastTimeframe === 'last_month') start.setMonth(start.getMonth() - 1)
  else if (pastTimeframe === 'all') return firstAssignmentDate ?? start
  return start
}

function getDateRange(start: Date, end: Date): Date[] {
  const result: Date[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endNorm = new Date(end)
  endNorm.setHours(0, 0, 0, 0)
  while (current <= endNorm) {
    result.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

function condenseDates(
  dates: Date[],
  assignmentsByDate: Map<number, Assignment[]>,
  todayTime: number
): DayEntry[] {
  const entries: DayEntry[] = []
  let i = 0
  while (i < dates.length) {
    const date = dates[i]
    if (date.getTime() === todayTime) {
      entries.push({ type: 'day', date })
      i++
      continue
    }
    let emptyCount = 0
    while (
      i + emptyCount < dates.length &&
      dates[i + emptyCount].getTime() !== todayTime &&
      (assignmentsByDate.get(dates[i + emptyCount].getTime())?.length ?? 0) === 0
    ) {
      emptyCount++
    }
    if (emptyCount >= 3) {
      entries.push({ type: 'range', start: dates[i], end: dates[i + emptyCount - 1] })
      i += emptyCount
    } else {
      entries.push({ type: 'day', date: dates[i] })
      i++
    }
  }
  return entries
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssignmentRow({
  assignment,
  status,
  onCycle,
}: {
  assignment: Assignment
  status: Status
  onCycle: (a: Assignment) => void
}) {
  const isLocked = !!assignment.submitted_at
  const cssClass = status.toLowerCase().replace(' ', '-')

  return (
    <div className={`assignment-row ${cssClass}`}>
      <button
        onClick={() => onCycle(assignment)}
        disabled={isLocked}
        className={`status-button ${cssClass}${isLocked ? ' locked' : ''}`}
      >
        {status}
      </button>
      <p>{assignment.course_code} — {assignment.name}</p>
    </div>
  )
}

// ─── Custom hook ──────────────────────────────────────────────────────────────

function useScheduleData() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    async function fetchData() {
      const courseData = await getCourses()
      setCourses(courseData)

      const allAssignments = await Promise.all(
        courseData.map(async (course: Course) => {
          const [data, groups] = await Promise.all([
            getAssignments(course.id),
            getAssignmentGroups(course.id),
          ])
          return data.map((a: any) => ({
            id: a.id,
            name: a.name,
            due_at: a.due_at,
            course_id: course.id,
            course_name: course.name,
            course_code: course.course_code,
            submitted_at: a.submission?.submitted_at ?? null,
            assignment_group_name:
              groups.find((g: AssignmentGroup) => g.id === a.assignment_group_id)?.name ?? 'Other',
          }))
        })
      )

      setAssignments(
        allAssignments.flat().sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
      )
    }

    fetchData().catch(console.error)
  }, [])

  return { courses, assignments }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Schedule() {
  const { courses, assignments } = useScheduleData()

  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [timeframe, setTimeframe] = useState('everything')
  const [statuses, setStatuses] = useState<Map<number, Status>>(() => {
    const saved = localStorage.getItem('assignment-statuses')
    return saved ? new Map(JSON.parse(saved)) : new Map()
  })
  const [showPrevious, setShowPrevious] = useState(false)
  const [pastTimeframe, setPastTimeframe] = useState('last_week')
  const [hideComplete, setHideComplete] = useState(false)

  useEffect(() => {
    localStorage.setItem('assignment-statuses', JSON.stringify([...statuses]))
  }, [statuses])

  useEffect(() => {
    if (courses.length > 0) setSelectedCourses(new Set(courses.map(c => c.id)))
  }, [courses])

  useEffect(() => {
    if (assignments.length > 0) setSelectedGroups(new Set(assignments.map(a => a.assignment_group_name)))
  }, [assignments])

  function toggleCourse(courseId: number) {
    setSelectedCourses(prev => {
      const next = new Set(prev)
      next.has(courseId) ? next.delete(courseId) : next.add(courseId)
      return next
    })
  }

  function toggleGroup(group: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const getStatus = useCallback((assignment: Assignment): Status => {
    if (assignment.submitted_at) return 'Complete'
    return statuses.get(assignment.id) ?? 'To Do'
  }, [statuses])

  function cycleStatus(assignment: Assignment) {
    if (assignment.submitted_at) return
    setStatuses(prev => {
      const next = new Map(prev)
      next.set(assignment.id, nextStatus(next.get(assignment.id) ?? 'To Do'))
      return next
    })
  }

  function filterComplete(list: Assignment[]): Assignment[] {
    return hideComplete ? list.filter(a => getStatus(a) !== 'Complete') : list
  }

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const { pastAssignments, futureAssignmentsByDate, lastAssignmentDate, firstAssignmentDate, allGroups } = useMemo(() => {
    const pastAssignments: Assignment[] = []
    const futureAssignmentsByDate = new Map<number, Assignment[]>()
    const groupSet = new Set<string>()

    for (const a of assignments) {
      groupSet.add(a.assignment_group_name)
      if (!selectedCourses.has(a.course_id)) continue
      if (!selectedGroups.has(a.assignment_group_name)) continue

      const due = new Date(a.due_at)
      due.setHours(0, 0, 0, 0)

      if (due < today) {
        pastAssignments.push(a)
      } else {
        const key = due.getTime()
        if (!futureAssignmentsByDate.has(key)) futureAssignmentsByDate.set(key, [])
        futureAssignmentsByDate.get(key)!.push(a)
      }
    }

    const firstAssignmentDate = pastAssignments.length > 0
      ? new Date(new Date(pastAssignments[0].due_at).setHours(0, 0, 0, 0))
      : null

    const lastAssignmentDate = futureAssignmentsByDate.size > 0
      ? new Date(Math.max(...futureAssignmentsByDate.keys()))
      : null

    return { pastAssignments, futureAssignmentsByDate, lastAssignmentDate, firstAssignmentDate, allGroups: [...groupSet] }
  }, [assignments, selectedCourses, selectedGroups, today])

  const lateAssignments = useMemo(() =>
    pastAssignments.filter(a => {
      if (a.submitted_at) return false
      return (statuses.get(a.id) ?? 'To Do') !== 'Complete'
    }),
    [pastAssignments, statuses]
  )

  const visiblePastAssignments = useMemo(() => {
    if (!showPrevious) return []
    const start = getPastTimeframeStart(pastTimeframe, firstAssignmentDate)
    return pastAssignments.filter(a => {
      const due = new Date(a.due_at)
      due.setHours(0, 0, 0, 0)
      return due >= start
    })
  }, [pastAssignments, pastTimeframe, firstAssignmentDate, showPrevious])

  const condensedFuture = useMemo(() => {
    const timeframeEnd = getTimeframeEnd(timeframe, lastAssignmentDate)
    const futureDates = lastAssignmentDate ? getDateRange(today, timeframeEnd) : []
    return condenseDates(futureDates, futureAssignmentsByDate, today.getTime())
  }, [timeframe, lastAssignmentDate, futureAssignmentsByDate, today])

  return (
    <div className="schedule-layout">
      <div className="schedule-sidebar">
        <h3>Courses</h3>
        {courses.map(course => (
          <div key={course.id}>
            <label>
              <input type="checkbox" checked={selectedCourses.has(course.id)} onChange={() => toggleCourse(course.id)} />
              {' '}{course.name}
            </label>
          </div>
        ))}

        <h3>Type</h3>
        {allGroups.map(group => (
          <div key={group}>
            <label>
              <input type="checkbox" checked={selectedGroups.has(group)} onChange={() => toggleGroup(group)} />
              {' '}{group}
            </label>
          </div>
        ))}

        <h3>Timeframe</h3>
        {[
          { value: 'next_week', label: 'Next Week' },
          { value: 'next_2_weeks', label: 'Next 2 Weeks' },
          { value: 'next_month', label: 'Next Month' },
          { value: 'everything', label: 'Everything' },
        ].map(({ value, label }) => (
          <div key={value}>
            <label>
              <input type="radio" name="timeframe" value={value} checked={timeframe === value} onChange={() => setTimeframe(value)} />
              {' '}{label}
            </label>
          </div>
        ))}

        <h3>Previous</h3>
        <label>
          <input type="checkbox" checked={showPrevious} onChange={() => setShowPrevious(prev => !prev)} />
          {' '}Show previous assignments
        </label>

        {showPrevious && [
          { value: 'last_week', label: 'Last Week' },
          { value: 'last_2_weeks', label: 'Last 2 Weeks' },
          { value: 'last_month', label: 'Last Month' },
          { value: 'all', label: 'All Assignments' },
        ].map(({ value, label }) => (
          <div key={value}>
            <label>
              <input type="radio" name="pastTimeframe" value={value} checked={pastTimeframe === value} onChange={() => setPastTimeframe(value)} />
              {' '}{label}
            </label>
          </div>
        ))}

        <h3>View</h3>
        <label>
          <input type="checkbox" checked={hideComplete} onChange={() => setHideComplete(prev => !prev)} />
          {' '}Hide complete
        </label>
      </div>

      <div className="schedule-main">
        <h1>Schedule</h1>

        {filterComplete(lateAssignments).length > 0 && (
          <div className="schedule-late">
            <h2>Late</h2>
            {filterComplete(lateAssignments).map(a => (
              <AssignmentRow key={a.id} assignment={a} status={getStatus(a)} onCycle={cycleStatus} />
            ))}
          </div>
        )}

        {visiblePastAssignments.length > 0 && (
          <div className="schedule-previous">
            <h2>Previous</h2>
            {[...groupByDate(visiblePastAssignments).entries()]
              .sort(([a], [b]) => a - b)
              .map(([timestamp, dateAssignments]) => {
                const filtered = filterComplete(dateAssignments)
                if (filtered.length === 0) return null
                return (
                  <div key={timestamp} className="schedule-previous-date">
                    <h3>{formatDate(new Date(timestamp))}</h3>
                    {filtered.map(a => (
                      <AssignmentRow key={a.id} assignment={a} status={getStatus(a)} onCycle={cycleStatus} />
                    ))}
                  </div>
                )
              })}
          </div>
        )}

        {condensedFuture.map((entry, idx) => {
          if (entry.type === 'range') {
            return (
              <div key={`range-${idx}`} className="schedule-range">
                <h2>{formatShortDate(entry.start)} – {formatShortDate(entry.end)}</h2>
                <p>No assignments due</p>
              </div>
            )
          }

          const isToday = entry.date.getTime() === today.getTime()
          const dateAssignments = filterComplete(futureAssignmentsByDate.get(entry.date.getTime()) ?? [])

          return (
            <div key={entry.date.toISOString()} className={`schedule-day${isToday ? ' today' : ''}`}>
              <h2>{formatDate(entry.date)}</h2>
              {dateAssignments.length === 0 ? (
                <p>No assignments due</p>
              ) : (
                dateAssignments.map(a => (
                  <AssignmentRow key={a.id} assignment={a} status={getStatus(a)} onCycle={cycleStatus} />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
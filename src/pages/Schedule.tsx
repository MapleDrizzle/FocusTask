import { useEffect, useState } from 'react'
import { getCourses, getAssignments, getAssignmentGroups, type Course, type Assignment, type AssignmentGroup } from '../api/canvasApi'

export default function Schedule() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [timeframe, setTimeframe] = useState('everything')
  const [showPrevious, setShowPrevious] = useState(false)

  function getDateRange(start: Date, end: Date): Date[] {
    const result: Date[] = []
    const current = new Date(start)
    current.setHours(0, 0, 0, 0)
    while (current <= end) {
      result.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return result
  }

  function toggleCourse(courseId: number) {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  function toggleGroup(group: string) {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    )
  }

  function getTimeframeEnd(timeframe: string): Date {
    const end = new Date()
    if (timeframe === 'next_week') end.setDate(end.getDate() + 7)
    if (timeframe === 'next_2_weeks') end.setDate(end.getDate() + 14)
    if (timeframe === 'next_month') end.setMonth(end.getMonth() + 1)
    if (timeframe === 'everything') end.setFullYear(end.getFullYear() + 10)
    return end
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const courseData = await getCourses()
        setCourses(courseData)
        setSelectedCourses(courseData.map((c: Course) => c.id))

        const allAssignments = await Promise.all(
          courseData.map(async (course: Course) => {
            const [data, groups] = await Promise.all([
              getAssignments(course.id),
              getAssignmentGroups(course.id)
            ])

            return data.map((a: any) => ({
              id: a.id,
              name: a.name,
              due_at: a.due_at,
              course_id: course.id,
              course_name: course.name,
              submitted_at: a.submission?.submitted_at ?? null,
              assignment_group_name: groups.find((g: AssignmentGroup) => g.id === a.assignment_group_id)?.name ?? 'Other'
            }))
          })
        )

        const sorted = allAssignments.flat().sort((a, b) =>
          new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        )

        setAssignments(sorted)
        setSelectedGroups([...new Set(sorted.map(a => a.assignment_group_name))])
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = showPrevious && assignments.length > 0
    ? new Date(assignments[0].due_at)
    : today

  const timeframeEnd = getTimeframeEnd(timeframe)
  const visibleDates = assignments.length > 0 ? getDateRange(startDate, timeframeEnd) : []

  const visibleAssignments = assignments.filter(a =>
    selectedCourses.includes(a.course_id) &&
    selectedGroups.includes(a.assignment_group_name)
  )

  const allGroups = [...new Set(assignments.map(a => a.assignment_group_name))]

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ width: '200px', flexShrink: 0 }}>
        <h3>Courses</h3>
        {courses.map(course => (
          <div key={course.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedCourses.includes(course.id)}
                onChange={() => toggleCourse(course.id)}
              />
              {' '}{course.name}
            </label>
          </div>
        ))}

        <h3>Type</h3>
        {allGroups.map(group => (
          <div key={group}>
            <label>
              <input
                type="checkbox"
                checked={selectedGroups.includes(group)}
                onChange={() => toggleGroup(group)}
              />
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
              <input
                type="radio"
                name="timeframe"
                value={value}
                checked={timeframe === value}
                onChange={() => setTimeframe(value)}
              />
              {' '}{label}
            </label>
          </div>
        ))}

        <h3>Previous</h3>
        <label>
          <input
            type="checkbox"
            checked={showPrevious}
            onChange={() => setShowPrevious(prev => !prev)}
          />
          {' '}Show previous assignments
        </label>
      </div>

      <div className="page home-page">
        <h1>Schedule</h1>
        {visibleDates.map((date) => {
          const dateAssignments = visibleAssignments.filter((a) => {
            const due = new Date(a.due_at)
            due.setHours(0, 0, 0, 0)
            return due.getTime() === date.getTime()
          })

          return (
            <div key={date.toISOString()}>
              <h2>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              {dateAssignments.length === 0 ? (
                <p>No assignments due</p>
              ) : (
                dateAssignments.map((assignment) => (
                  <div key={assignment.id}>
                    <p>{assignment.course_name} — {assignment.name} — {assignment.assignment_group_name} — Submitted: {assignment.submitted_at ?? 'Not submitted'}</p>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
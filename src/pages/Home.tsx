import { useEffect, useState } from 'react'
import { getCourses, getAssignments } from '../api/canvasApi'

export default function Home() {
  const [courseData, setCourseData] = useState<any[]>([])

  useEffect(() => {
    getCourses()
      .then(data => {
        return Promise.all(
          data.map((course: any) =>
            getAssignments(course.id).then(assignments => ({
              ...course,
              assignments
            }))
          )
        )
      })
      .then(combined => {
        console.log('Combined:', combined)
        setCourseData(combined)
      })
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="page home-page">
    <h1>TEST FOR CANVAS DATA PULL</h1>
      {courseData.map((course: any) => (
        <div key={course.id}>
          <h2>{course.name}</h2>
          {course.assignments.length === 0 ? (
            <p>No assignments</p>
          ) : (
            course.assignments.map((assignment: any) => (
              <p key={assignment.id}>
                {assignment.name} — Due: {assignment.due_at}
              </p>
            ))
          )}
        </div>
      ))}
    </div>
  )
}
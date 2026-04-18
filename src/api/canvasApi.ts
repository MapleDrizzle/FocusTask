const TOKEN = import.meta.env.VITE_CANVAS_TOKEN

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

export interface Course {
  id: number
  name: string
}

export interface Assignment {
  id: number
  name: string
  due_at: string
  course_id: number
  course_name: string
  submitted_at: string | null
  assignment_group_name: string
}

export interface AssignmentGroup {
  id: number
  name: string
}

export async function getCourses() {
  const response = await fetch('/api/courses', { headers })
  if (!response.ok) throw new Error('Failed to fetch courses')
  return response.json()
}

export async function getAssignments(courseId: number) {
  const response = await fetch(`/api/courses/${courseId}/assignments`, { headers })
  if (!response.ok) throw new Error('Failed to fetch assignments')
  return response.json()
}

export async function getAssignmentGroups(courseId: number) {
  const response = await fetch(`/api/courses/${courseId}/assignment_groups`, { headers })
  if (!response.ok) throw new Error('Failed to fetch assignment groups')
  return response.json()
}
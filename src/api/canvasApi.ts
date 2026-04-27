const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_CANVAS_TOKEN}`,
  'Content-Type': 'application/json',
}

export interface Course {
  id: number
  name: string
  course_code: string
}

export interface Assignment {
  id: number
  name: string
  due_at: string
  course_id: number
  course_name: string
  course_code: string
  submitted_at: string | null
  assignment_group_name: string
}

export interface AssignmentGroup {
  id: number
  name: string
}

async function apiFetch(path: string) {
  const res = await fetch(path, { headers })
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export const getCourses = () => apiFetch('/api/courses')
export const getAssignments = (id: number) => apiFetch(`/api/courses/${id}/assignments`)
export const getAssignmentGroups = (id: number) => apiFetch(`/api/courses/${id}/assignment_groups`)
const TOKEN = import.meta.env.VITE_CANVAS_TOKEN
console.log('Token: ', TOKEN)

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
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
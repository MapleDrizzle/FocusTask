///////////////////////
const MANUAL = true
///////////////////////

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENT_GROUPS: AssignmentGroup[] = [
  { id: 1, name: 'Homework' },
  { id: 2, name: 'Quizzes'  },
  { id: 3, name: 'Exams'    },
  { id: 4, name: 'Projects' },
  { id: 5, name: 'Extras'   },
]

const MOCK_COURSES: Course[] = [
  { id: 1, name: 'Artificial Intelligence', course_code: 'CISC481'   },
  { id: 2, name: 'Introduction to Operations Management',course_code: 'BUAD306' },
  { id: 3, name: 'Development of Assistive Technology',course_code: 'CISC334'  },
  { id: 4, name: 'Computer Science Senior Design Project II',course_code: 'CISC499'   },
  { id: 5, name: 'Probability Theory and Simulation Methods',course_code: 'MATH350'   },
]



//May 14th
const MOCK_ASSIGNMENTS: Record<number, { id: number; name: string; due_at: string; assignment_group_id: number; submission?: { submitted_at: string | null } }[]> = {
  1: [{ id: 1001, name: 'Homework 1: Learning!',  due_at: '2026-05-13T23:59:00', assignment_group_id: 1 },
      { id: 1002, name: 'Quiz 1: Testing You!',  due_at: '2026-05-16T23:59:00', assignment_group_id: 2 },
      { id: 1003, name: 'Final Exam: Good Luck!',  due_at: '2026-05-20T23:59:00', assignment_group_id: 3 },
      { id: 1004, name: 'Team Project Final Submission',  due_at: '2026-05-14T23:59:00', assignment_group_id: 4, submission: { submitted_at: '2026-05-01T20:00:00Z' } },
      { id: 1005, name: 'Bonus Points',  due_at: '2026-05-25T23:59:00', assignment_group_id: 5 }
    
  ],
  2: [{ id: 2001, name: 'Homework 2: Learning More!',  due_at: '2026-05-14T23:59:00', assignment_group_id: 1 },
      { id: 2002, name: 'Quiz 2: Testing You!',  due_at: '2026-05-10T23:59:00', assignment_group_id: 2, submission: { submitted_at: '2026-05-01T20:00:00Z' }},
      { id: 2003, name: 'Final Exam... Yikes!',  due_at: '2026-05-21T23:59:00', assignment_group_id: 3 },
      { id: 2004, name: 'Team Project Final Submission',  due_at: '2026-05-14T23:59:00', assignment_group_id: 4,  },
    
  ],
  3: [{ id: 3001, name: 'How Good is your eyesight?',  due_at: '2026-05-19T23:59:00', assignment_group_id: 1 },
      { id: 3002, name: 'How good is your hearing?',  due_at: '2026-05-09T23:59:00', assignment_group_id: 1, submission: { submitted_at: '2026-04-01T20:00:00Z' }},
      { id: 3002, name: 'How are you doing today?',  due_at: '2026-04-01T23:59:00', assignment_group_id: 1, submission: { submitted_at: '2026-04-01T20:00:00Z' }},
      { id: 3003, name: 'Project Rough Draft',  due_at: '2026-05-10T23:59:00', assignment_group_id: 4 },
      { id: 3004, name: 'Project Presentation',  due_at: '2026-05-30T23:59:00', assignment_group_id: 4,  },
  ],
  4: [{ id: 4001, name: 'Submit Some Resumes',  due_at: '2026-05-05T23:59:00', assignment_group_id: 1 },
      { id: 4002, name: 'Dance for bonus points',  due_at: '2026-05-19T23:59:00', assignment_group_id: 5 },
      { id: 4003, name: 'Project Submission',  due_at: '2026-05-15T23:59:00', assignment_group_id: 4 },
      { id: 4004, name: 'Project Ideas',  due_at: '2026-05-16T23:59:00', assignment_group_id: 4, submission: { submitted_at: '2026-05-01T20:00:00Z' } },
      { id: 4005, name: 'Project... ',  due_at: '2026-05-21T23:59:00', assignment_group_id: 4 }
    
  ],
  5: [
      { id: 5001, name: 'Homework Stuff',  due_at: '2026-05-11T23:59:00', assignment_group_id: 1, submission: { submitted_at: '2026-05-01T20:00:00Z' }},
      { id: 5002, name: 'Quiz 60: Testing You AGAIN!',  due_at: '2026-05-18T23:59:00', assignment_group_id: 2 },
      { id: 5002, name: 'Quiz 61: Testing You AGAIN! AGAIN!',  due_at: '2026-05-19T23:59:00', assignment_group_id: 2 },
      { id: 5003, name: 'Final Exam! Part 2!',  due_at: '2026-05-26T23:59:00', assignment_group_id: 3 },
      { id: 5003, name: 'Final Exam! Part 3!',  due_at: '2026-05-27T23:59:00', assignment_group_id: 3 },

  ]
}

// ─── API ──────────────────────────────────────────────────────────────────────

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_CANVAS_TOKEN}`,
  'Content-Type': 'application/json',
}

async function apiFetch(path: string): Promise<any> {
  if (MANUAL) {
    if (path === '/api/courses') return MOCK_COURSES

    const assignmentsMatch = path.match(/^\/api\/courses\/(\d+)\/assignments$/)
    if (assignmentsMatch) return MOCK_ASSIGNMENTS[Number(assignmentsMatch[1])] ?? []

    const groupsMatch = path.match(/^\/api\/courses\/(\d+)\/assignment_groups$/)
    if (groupsMatch) return MOCK_ASSIGNMENT_GROUPS

    throw new Error(`No mock data for path: ${path}`)
  }

  const res = await fetch(path, { headers })
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export const getCourses          = ()           => apiFetch('/api/courses')
export const getAssignments      = (id: number) => apiFetch(`/api/courses/${id}/assignments`)
export const getAssignmentGroups = (id: number) => apiFetch(`/api/courses/${id}/assignment_groups`)
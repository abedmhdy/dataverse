import { useCallback, useSyncExternalStore } from 'react'

// Local-only progress: lessons completed, quiz answers, exercise results. Survives reloads, never leaves the browser.
export interface Progress {
  lessons: Record<string, boolean>
  quiz: Record<string, { correct: boolean; at: number }>
  exercises: Record<string, { score: number; at: number }>
}

const KEY = 'dataverse.progress.v1'
const empty = (): Progress => ({ lessons: {}, quiz: {}, exercises: {} })
let cache: Progress | null = null
const listeners = new Set<() => void>()

function read(): Progress {
  if (cache) return cache
  try {
    cache = { ...empty(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    cache = empty()
  }
  return cache!
}

function write(p: Progress) {
  cache = p
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable (private mode) — progress lives for this session only */
  }
  listeners.forEach((l) => l())
}

export function updateProgress(fn: (p: Progress) => Progress) {
  write(fn(read()))
}

export function resetProgress() {
  write(empty())
}

export function useProgress() {
  const p = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    read,
  )
  const setLesson = useCallback((id: string, done: boolean) => updateProgress((x) => ({ ...x, lessons: { ...x.lessons, [id]: done } })), [])
  const answer = useCallback((id: string, correct: boolean) => updateProgress((x) => ({ ...x, quiz: { ...x.quiz, [id]: { correct, at: Date.now() } } })), [])
  const exercise = useCallback(
    (id: string, score: number) =>
      updateProgress((x) => ({ ...x, exercises: { ...x.exercises, [id]: { score: Math.max(score, x.exercises[id]?.score ?? 0), at: Date.now() } } })),
    [],
  )
  return { progress: p, setLesson, answer, exercise }
}

/** Per-key persisted value (drafts of diagrams and queries). */
export function loadDraft<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`dataverse.draft.${key}`)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveDraft(key: string, value: unknown) {
  try {
    localStorage.setItem(`dataverse.draft.${key}`, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

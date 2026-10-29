import type { ComponentType } from 'react'
import { ER1, ER2, ER3 } from './er/part1'
import { ER4, ER5, ER6 } from './er/part2'
import { ER7, ER8, ER9, ERExam } from './er/part3'

export const LESSONS: Record<string, ComponentType> = {
  'er-1': ER1,
  'er-2': ER2,
  'er-3': ER3,
  'er-4': ER4,
  'er-5': ER5,
  'er-6': ER6,
  'er-7': ER7,
  'er-8': ER8,
  'er-9': ER9,
  'er-exam': ERExam,
}

import type { ComponentType } from 'react'
import { RA1, RA2, RA3, RA4, RA5, RA6, RAExam } from './algebra/lessons'
import { ER1, ER2, ER3 } from './er/part1'
import { ER4, ER5, ER6 } from './er/part2'
import { ER7, ER8, ER9, ERExam } from './er/part3'
import { RM1, RM2, RM3, RM4, RMExam } from './relational/lessons'

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
  'rm-1': RM1,
  'rm-2': RM2,
  'rm-3': RM3,
  'rm-4': RM4,
  'rm-exam': RMExam,
  'ra-1': RA1,
  'ra-2': RA2,
  'ra-3': RA3,
  'ra-4': RA4,
  'ra-5': RA5,
  'ra-6': RA6,
  'ra-exam': RAExam,
}

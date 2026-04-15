// food-classifier/lib/ml/uncertainty.ts
export type UncertaintyLevel = 'low' | 'medium' | 'high'

export function getUncertaintyLevel(sigma: number): UncertaintyLevel {
  if (sigma < 0.05) return 'low'
  if (sigma < 0.15) return 'medium'
  return 'high'
}

export const UNCERTAINTY_LABELS: Record<UncertaintyLevel, string> = {
  low:    '높은 확신',
  medium: '보통 확신',
  high:   '낮은 확신',
}

export const UNCERTAINTY_COLORS: Record<UncertaintyLevel, string> = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
}

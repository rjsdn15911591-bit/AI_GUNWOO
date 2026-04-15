// food-classifier/components/UncertaintyBadge.tsx
import {
  getUncertaintyLevel,
  UNCERTAINTY_LABELS,
  UNCERTAINTY_COLORS,
} from '@/lib/ml/uncertainty'

interface Props { sigma: number }

export default function UncertaintyBadge({ sigma }: Props) {
  const level = getUncertaintyLevel(sigma)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${UNCERTAINTY_COLORS[level]}`}>
      불확실도: {UNCERTAINTY_LABELS[level]}
      <span className="opacity-60">(σ={sigma.toFixed(3)})</span>
    </span>
  )
}

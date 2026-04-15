// food-classifier/components/ResultPanel.tsx
import type { ClassificationResult } from '@/lib/ml/classifier'
import ConfidenceBar from './ConfidenceBar'
import UncertaintyBadge from './UncertaintyBadge'
import { isLikelyFood } from '@/lib/ml/foodLabels'

interface Props {
  result: ClassificationResult
  isPremium: boolean
}

export default function ResultPanel({ result, isPremium }: Props) {
  const displayResults = isPremium ? result.results : result.results.slice(0, 1)
  const likelyFood = isLikelyFood(result.results)

  return (
    <div className="flex flex-col gap-4">
      {!likelyFood && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          🤔 음식이 아닌 사진일 수 있어요 (신뢰도가 낮습니다)
        </div>
      )}

      <div className="flex flex-col gap-3">
        {displayResults.map((r) => (
          <ConfidenceBar
            key={r.rank}
            label={r.label}
            confidence={r.confidence}
            rank={r.rank}
            isFood={r.isFood}
          />
        ))}
      </div>

      {isPremium && result.sigma > 0 && (
        <UncertaintyBadge sigma={result.sigma} />
      )}

      <p className="text-xs text-gray-400">
        추론: {result.backend.toUpperCase()} 백엔드
      </p>
    </div>
  )
}

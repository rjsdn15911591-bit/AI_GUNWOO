// food-classifier/components/ConfidenceBar.tsx

interface Props {
  label: string
  labelKo: string
  confidence: number
  rank: number
  isFood: boolean
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

export default function ConfidenceBar({ label, labelKo, confidence, rank, isFood }: Props) {
  const pct = (confidence * 100).toFixed(1)
  const barWidth = `${Math.round(confidence * 100)}%`

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-1.5">
          <span>{RANK_EMOJIS[rank - 1] ?? `${rank}.`}</span>
          <span className={`font-medium ${isFood ? 'text-gray-900' : 'text-gray-400'}`}>
            {labelKo}
          </span>
          <span className="text-xs text-gray-400">({label})</span>
          {!isFood && rank === 1 && (
            <span className="text-xs text-orange-500">음식 아님?</span>
          )}
        </span>
        <span className="font-bold tabular-nums text-brand">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${
            rank === 1 ? 'bg-brand' : 'bg-gray-300'
          }`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  )
}

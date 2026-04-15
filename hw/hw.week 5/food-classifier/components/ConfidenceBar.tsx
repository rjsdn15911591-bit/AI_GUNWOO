// food-classifier/components/ConfidenceBar.tsx

interface Props {
  label: string
  confidence: number
  rank: number
  isFood: boolean
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

export default function ConfidenceBar({ label, confidence, rank, isFood }: Props) {
  const pct = (confidence * 100).toFixed(1)
  const barWidth = `${Math.round(confidence * 100)}%`

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-1.5">
          <span>{RANK_EMOJIS[rank - 1]}</span>
          <span className={`font-medium ${isFood ? 'text-gray-900' : 'text-gray-400'}`}>
            {label}
          </span>
          {!isFood && rank === 1 && (
            <span className="text-xs text-orange-500">(음식 아님?)</span>
          )}
        </span>
        <span className="text-gray-500 tabular-nums">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            rank === 1 ? 'bg-brand' : 'bg-gray-300'
          }`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  )
}

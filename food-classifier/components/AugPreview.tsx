// food-classifier/components/AugPreview.tsx

interface Props {
  cropPreviews: string[]
}

export default function AugPreview({ cropPreviews }: Props) {
  if (!cropPreviews.length) return null
  const labels = ['Center', 'TL', 'TR', 'BL', 'BR']

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500">
        TTA 5-crop — 앙상블 추론에 사용된 변형
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cropPreviews.map((src, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <img
              src={src}
              alt={labels[i]}
              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
            />
            <span className="text-xs text-gray-400">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

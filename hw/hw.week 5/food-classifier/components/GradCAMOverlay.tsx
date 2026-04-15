// food-classifier/components/GradCAMOverlay.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { computeSaliencyMap, drawHeatmap } from '@/lib/ml/gradcam'

interface Props {
  model: mobilenet.MobileNet
  image: HTMLImageElement
  classIndex: number
}

export default function GradCAMOverlay({ model, image, classIndex }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    computeSaliencyMap(model, image, classIndex)
      .then((heatmap) => {
        if (canvasRef.current) drawHeatmap(canvasRef.current, image, heatmap)
        setLoading(false)
      })
      .catch(() => {
        setError('Grad-CAM 생성 실패')
        setLoading(false)
      })
  }, [model, image, classIndex])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500">Grad-CAM — 모델 판단 근거</p>
      {loading && <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <canvas
        ref={canvasRef}
        className={`rounded-xl w-full max-w-xs ${loading ? 'hidden' : ''}`}
        style={{ imageRendering: 'pixelated' }}
      />
      <p className="text-xs text-gray-400">
        밝은 영역 = 분류에 영향을 많이 준 부분
      </p>
    </div>
  )
}

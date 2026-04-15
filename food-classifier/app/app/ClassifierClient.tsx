'use client'

import { useState, useCallback } from 'react'
import * as mobilenet from '@tensorflow-models/mobilenet'
import ModelLoader from '@/components/ModelLoader'
import ImageUploader from '@/components/ImageUploader'
import CameraCapture from '@/components/CameraCapture'
import ResultPanel from '@/components/ResultPanel'
import GradCAMOverlay from '@/components/GradCAMOverlay'
import AugPreview from '@/components/AugPreview'
import PlanGate from '@/components/PlanGate'
import { classify, type TFBackend, type ClassificationResult } from '@/lib/ml/classifier'
import { checkAndIncrementUsage, saveClassification } from '@/lib/supabase/usage'
import Link from 'next/link'

interface Props { isPremium: boolean }

export default function ClassifierClient({ isPremium }: Props) {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null)
  const [backend, setBackend] = useState<TFBackend>('webgl')
  const [modelError, setModelError] = useState('')
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [limitError, setLimitError] = useState('')

  const onModelReady = useCallback((m: mobilenet.MobileNet, b: TFBackend) => {
    setModel(m)
    setBackend(b)
  }, [])

  async function handleImage(img: HTMLImageElement) {
    setSelectedImage(img)
    setResult(null)
    setLimitError('')
    if (!model) return

    const usage = await checkAndIncrementUsage()
    if (!usage.allowed) {
      setLimitError('오늘 무료 분류 한도(5회)를 초과했습니다.')
      return
    }

    setLoading(true)
    try {
      const r = await classify(img, model, backend, isPremium)
      setResult(r)
      if (isPremium) {
        await saveClassification({
          imageUrl: null,
          top1Label: r.results[0]?.label ?? '',
          top1Conf:  r.results[0]?.confidence ?? 0,
          results:   r.results,
          sigma:     r.sigma,
          backend:   r.backend,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <ModelLoader onReady={onModelReady} onError={setModelError} />

      {modelError && (
        <p className="text-red-600 text-sm text-center">{modelError}</p>
      )}

      {model && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <ImageUploader onImageSelected={handleImage} />
            <CameraCapture onImageCaptured={handleImage} />
          </div>

          {limitError && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 flex items-center justify-between">
              <span>{limitError}</span>
              <Link href="/pricing" className="font-medium underline ml-2">업그레이드</Link>
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-500 text-sm animate-pulse">
              분류 중...
            </div>
          )}

          {result && selectedImage && !loading && (
            <div className="grid md:grid-cols-2 gap-6">
              <ResultPanel result={result} isPremium={isPremium} />

              <div className="flex flex-col gap-6">
                <PlanGate isPremium={isPremium} featureName="Grad-CAM 히트맵">
                  <GradCAMOverlay
                    model={model}
                    image={selectedImage}
                    classIndex={0}
                  />
                </PlanGate>

                <PlanGate isPremium={isPremium} featureName="TTA 5-crop 미리보기">
                  <AugPreview cropPreviews={result.cropPreviews} />
                </PlanGate>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

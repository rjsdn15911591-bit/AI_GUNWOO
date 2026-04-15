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
  const [previewSrc, setPreviewSrc] = useState<string>('')
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [limitError, setLimitError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [secretCode, setSecretCode] = useState('')
  const [secretUnlocked, setSecretUnlocked] = useState(false)

  function handleSecretInput(val: string) {
    setSecretCode(val)
    if (val === '060227') {
      setSecretUnlocked(true)
      setSecretCode('')
    }
  }

  const onModelReady = useCallback((m: mobilenet.MobileNet, b: TFBackend) => {
    setModel(m)
    setBackend(b)
  }, [])

  function handleImage(img: HTMLImageElement) {
    setSelectedImage(img)
    setResult(null)
    setLimitError('')
    // 미리보기용 canvas
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.8))
  }

  async function handleClassify() {
    if (!model || !selectedImage) return

    if (!secretUnlocked) {
      const usage = await checkAndIncrementUsage()
      if (!usage.allowed) {
        setLimitError('오늘 무료 분류 한도(5회)를 초과했습니다.')
        setRemaining(0)
        return
      }
      if (!isPremium) setRemaining(usage.remaining)
    }

    setLoading(true)
    setLimitError('')
    try {
      const r = await classify(selectedImage, model, backend, isPremium)
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
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6 relative">
      {/* 시크릿 입력창 */}
      <input
        type="text"
        value={secretCode}
        onChange={(e) => handleSecretInput(e.target.value)}
        maxLength={6}
        autoComplete="off"
        aria-hidden="true"
        className="absolute top-0 left-0 w-10 h-5 rounded bg-blue-100 border border-blue-200 text-blue-100 text-[10px] focus:outline-none focus:ring-0 cursor-text z-50"
        style={{ caretColor: 'transparent' }}
      />
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

          {previewSrc && (
            <div className="flex flex-col items-center gap-3">
              <img src={previewSrc} alt="선택된 이미지"
                className="max-h-64 rounded-xl object-contain border" />
              <button
                onClick={handleClassify}
                disabled={loading}
                className="px-8 py-3 bg-brand text-white rounded-full text-lg font-bold disabled:opacity-50"
              >
                {loading ? '분류 중...' : '🔍 분류 시작'}
              </button>
            </div>
          )}

          {!isPremium && !secretUnlocked && remaining !== null && (
            <p className="text-sm text-center text-gray-500">
              오늘 남은 무료 분류 횟수: <span className="font-bold text-brand">{remaining}회</span> / 5회
            </p>
          )}

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

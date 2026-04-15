// food-classifier/components/ModelLoader.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { initBackend, loadModel, type TFBackend } from '@/lib/ml/classifier'

interface Props {
  onReady: (model: mobilenet.MobileNet, backend: TFBackend) => void
  onError: (msg: string) => void
}

export default function ModelLoader({ onReady, onError }: Props) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [backend, setBackend] = useState<TFBackend | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setProgress(0)

    try {
      const b = await initBackend()
      setBackend(b)
      setProgress(20)

      const model = await loadModel((pct) =>
        setProgress(20 + Math.round(pct * 0.8))
      )
      setStatus('done')
      onReady(model, b)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '모델 로드 실패'
      setErrorMsg(msg)
      setStatus('error')
      onError(msg)
    }
  }, [onReady, onError])

  useEffect(() => { load() }, [load])

  if (status === 'done') return null

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {status === 'loading' && (
        <>
          <div className="text-sm text-gray-500">
            AI 모델 로딩 중... {progress}%
            {backend && (
              <span className="ml-2 text-xs text-gray-400">
                ({backend === 'webgl' ? 'GPU 가속' : backend === 'wasm' ? 'WASM' : 'CPU 모드'})
              </span>
            )}
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {backend && backend !== 'webgl' && (
            <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
              {backend === 'wasm' ? 'WASM 모드 (WebGL 미지원)' : '최저 성능 CPU 모드'} — 추론 속도가 느릴 수 있습니다
            </p>
          )}
        </>
      )}

      {status === 'error' && (
        <div className="text-center">
          <p className="text-red-600 mb-3">{errorMsg}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}

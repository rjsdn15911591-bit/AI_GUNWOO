// food-classifier/components/CameraCapture.tsx
'use client'

import { useRef, useState, useEffect } from 'react'

interface Props {
  onImageCaptured: (img: HTMLImageElement) => void
}

export default function CameraCapture({ onImageCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setActive(true)
        setError('')
      }
    } catch {
      setError('카메라 접근 권한이 거부됐습니다. 파일 업로드를 이용해주세요.')
    }
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    const img = new Image()
    img.src = canvas.toDataURL('image/jpeg')
    img.onload = () => {
      onImageCaptured(img)
      stopCamera()
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    setActive(false)
  }

  useEffect(() => () => { stopCamera() }, [])

  if (error) return <p className="text-sm text-red-500">{error}</p>

  return (
    <div className="flex flex-col gap-3">
      {!active && (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium"
        >
          📷 카메라로 촬영
        </button>
      )}
      <div className={active ? 'relative rounded-xl overflow-hidden bg-black' : 'hidden'}>
        <video ref={videoRef} className="w-full rounded-xl" muted playsInline />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
          <button
            onClick={capture}
            className="px-6 py-2 bg-brand text-white rounded-full font-bold shadow-lg"
          >
            촬영
          </button>
          <button
            onClick={stopCamera}
            className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm"
          >
            취소
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

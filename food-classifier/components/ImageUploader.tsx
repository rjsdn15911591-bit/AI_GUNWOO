// food-classifier/components/ImageUploader.tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  onImageSelected: (img: HTMLImageElement) => void
}

export default function ImageUploader({ onImageSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    const img = new Image()
    img.src = url
    img.onload = () => onImageSelected(img)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer border-2 border-dashed rounded-2xl
        flex flex-col items-center justify-center gap-3 p-8 transition-colors
        ${dragOver ? 'border-brand bg-green-50' : 'border-gray-300 hover:border-brand'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {preview ? (
        <img src={preview} alt="preview" className="max-h-56 rounded-xl object-contain" />
      ) : (
        <>
          <span className="text-4xl">🍽️</span>
          <p className="text-gray-600 font-medium">이미지를 드래그하거나 클릭해서 업로드</p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP 지원</p>
        </>
      )}
    </div>
  )
}

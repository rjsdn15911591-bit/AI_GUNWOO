// food-classifier/lib/ml/classifier.ts
import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { filterAndRankResults, type FoodResult } from './foodLabels'

export type TFBackend = 'webgl' | 'wasm' | 'cpu'

export interface ClassificationResult {
  results: FoodResult[]
  sigma: number
  backend: TFBackend
  cropPreviews: string[]
}

let _modelPromise: Promise<mobilenet.MobileNet> | null = null

export async function initBackend(): Promise<TFBackend> {
  for (const backend of ['webgl', 'wasm', 'cpu'] as TFBackend[]) {
    try {
      await tf.setBackend(backend)
      await tf.ready()
      return backend
    } catch {
      continue
    }
  }
  throw new Error('사용 가능한 TF.js 백엔드가 없습니다.')
}

export async function loadModel(
  onProgress?: (pct: number) => void
): Promise<mobilenet.MobileNet> {
  if (_modelPromise) return _modelPromise
  onProgress?.(10)
  _modelPromise = mobilenet.load({ version: 2, alpha: 1.0 })
  const model = await _modelPromise
  onProgress?.(100)
  return model
}

function extractCrops(
  img: HTMLImageElement | HTMLCanvasElement | ImageData
): tf.Tensor3D[] {
  const base = tf.browser.fromPixels(img as HTMLImageElement)
    .resizeBilinear([256, 256])  // float32, values [0, 255]
  const cropSize = 224

  const offsets: [number, number][] = [
    [16, 16],
    [0, 0],
    [0, 256 - cropSize],
    [256 - cropSize, 0],
    [256 - cropSize, 256 - cropSize],
  ]

  // NOTE: NO .div(255) here — MobileNet.classify() normalizes [0,255]→[-1,1] internally.
  // Dividing by 255 before classify() caused double-normalization → all pixels ≈ -1 → garbage results.
  const crops = offsets.map(([y, x]) =>
    base
      .slice([y, x, 0], [cropSize, cropSize, 3])
      .toFloat() as tf.Tensor3D
  )

  base.dispose()
  return crops
}

async function tensorToBase64(t: tf.Tensor3D): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  const normalized = t.div(255) as tf.Tensor3D
  await tf.browser.toPixels(normalized, canvas)
  normalized.dispose()
  return canvas.toDataURL('image/jpeg', 0.7)
}


function computeSigma(
  allPreds: Array<Array<{ className: string; probability: number }>>
): number {
  const top1Probs = allPreds.map((p) => p[0].probability)
  const mean = top1Probs.reduce((a, b) => a + b) / top1Probs.length
  const variance =
    top1Probs.reduce((s, p) => s + (p - mean) ** 2, 0) / top1Probs.length
  return Math.sqrt(variance)
}

export async function classify(
  img: HTMLImageElement | HTMLCanvasElement | ImageData,
  model: mobilenet.MobileNet,
  backend: TFBackend,
  isPremium: boolean
): Promise<ClassificationResult> {
  const crops = extractCrops(img)
  const numCrops = isPremium ? 5 : 3

  // Pass Tensor3D directly — values in [0,255]; MobileNet handles normalization internally
  const allRaw = await Promise.all(
    crops.slice(0, numCrops).map((crop) =>
      model.classify(crop as unknown as HTMLImageElement, 20)
    )
  )

  const allCalibrated = allRaw

  const classMap = new Map<string, number>()
  allCalibrated.forEach((preds) => {
    preds.forEach(({ className, probability }) => {
      classMap.set(className, (classMap.get(className) ?? 0) + probability / numCrops)
    })
  })
  const averaged = Array.from(classMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([className, probability]) => ({ className, probability }))

  const sigma = isPremium ? computeSigma(allCalibrated) : 0

  const cropPreviews: string[] = []
  if (isPremium) {
    for (const crop of crops) {
      cropPreviews.push(await tensorToBase64(crop))
    }
  }

  crops.forEach((c) => c.dispose())

  return {
    results: filterAndRankResults(averaged, 5),
    sigma,
    backend,
    cropPreviews,
  }
}

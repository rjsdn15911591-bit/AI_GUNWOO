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
): tf.Tensor4D[] {
  const base = tf.browser.fromPixels(img as HTMLImageElement)
    .resizeBilinear([256, 256])
  const cropSize = 224

  const offsets: [number, number][] = [
    [16, 16],
    [0, 0],
    [0, 256 - cropSize],
    [256 - cropSize, 0],
    [256 - cropSize, 256 - cropSize],
  ]

  const crops = offsets.map(([y, x]) =>
    base
      .slice([y, x, 0], [cropSize, cropSize, 3])
      .toFloat()
      .div(255.0)
      .expandDims(0) as tf.Tensor4D
  )

  base.dispose()  // dispose intermediate tensor
  return crops
}

async function tensorToBase64(t: tf.Tensor4D): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  await tf.browser.toPixels(t.squeeze([0]) as tf.Tensor3D, canvas)
  return canvas.toDataURL('image/jpeg', 0.7)
}

function applyTemperature(
  preds: Array<{ className: string; probability: number }>,
  T = 1.5
): Array<{ className: string; probability: number }> {
  const logits = preds.map((p) => Math.log(p.probability + 1e-10) / T)
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return preds.map((p, i) => ({ ...p, probability: exps[i] / sum }))
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
  const numCrops = isPremium ? 5 : 3   // 무료도 3-crop으로 정확도 향상

  const allRaw = await Promise.all(
    crops.slice(0, numCrops).map((crop) =>
      model.classify(crop as unknown as HTMLImageElement, 20)  // top-20으로 확장
    )
  )

  const allCalibrated = allRaw  // 온도 스케일링 제거 — confidence 그대로 유지

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

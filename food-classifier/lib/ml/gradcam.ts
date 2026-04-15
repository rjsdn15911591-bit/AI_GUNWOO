// food-classifier/lib/ml/gradcam.ts
// Note: @tensorflow-models/mobilenet loads as a GraphModel, so true Grad-CAM
// (gradient w.r.t. intermediate conv layer activations) is not directly accessible.
// This uses input-gradient saliency maps as an approximation:
// ∂(classScore) / ∂(input pixel) → channel mean abs → ReLU → normalize → jet colormap

import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'

export async function computeSaliencyMap(
  model: mobilenet.MobileNet,
  img: HTMLImageElement | HTMLCanvasElement,
  classIndex: number
): Promise<ImageData> {
  const inputTensor = tf.tidy(() =>
    tf.browser
      .fromPixels(img as HTMLImageElement)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0) as tf.Tensor4D
  )

  const gradFn = tf.grad((x: tf.Tensor) => {
    const logits = model.infer(x as tf.Tensor<tf.Rank>, false) as tf.Tensor2D
    return logits.slice([0, classIndex], [1, 1]).squeeze() as tf.Scalar
  })

  const gradients = tf.tidy(() => {
    const g = gradFn(inputTensor) as tf.Tensor4D
    return g.abs().mean(3).squeeze([0]) as tf.Tensor2D
  })

  const normalized = tf.tidy(() => {
    const min = gradients.min()
    const max = gradients.max()
    return gradients.sub(min).div(max.sub(min).add(1e-7)) as tf.Tensor2D
  })

  // Jet colormap approximation: blue → green → red
  const heatmapRGBA = tf.tidy(() => {
    const flat = normalized.flatten()
    const r = flat.mul(2).clipByValue(0, 1)
    const g = flat.mul(2).sub(0.5).clipByValue(0, 1).mul(
                flat.mul(-2).add(2).clipByValue(0, 1)
              )
    const b = tf.scalar(1).sub(flat.mul(2)).clipByValue(0, 1)
    const alpha = flat.mul(0.7).add(0.1).clipByValue(0, 1)

    return tf.stack([r, g, b, alpha], 1)
      .reshape([224, 224, 4])
      .mul(255)
      .cast('int32')
  })

  const pixels = await heatmapRGBA.data()
  const imageData = new ImageData(
    new Uint8ClampedArray(pixels),
    224,
    224
  )

  inputTensor.dispose()
  gradients.dispose()
  normalized.dispose()
  heatmapRGBA.dispose()

  return imageData
}

export function drawHeatmap(
  canvas: HTMLCanvasElement,
  originalImg: HTMLImageElement | HTMLCanvasElement,
  heatmapData: ImageData
): void {
  const ctx = canvas.getContext('2d')!
  canvas.width = 224
  canvas.height = 224

  ctx.drawImage(originalImg, 0, 0, 224, 224)

  const heatmapCanvas = document.createElement('canvas')
  heatmapCanvas.width = 224
  heatmapCanvas.height = 224
  heatmapCanvas.getContext('2d')!.putImageData(heatmapData, 0, 0)
  ctx.globalAlpha = 0.6
  ctx.drawImage(heatmapCanvas, 0, 0)
  ctx.globalAlpha = 1.0
}

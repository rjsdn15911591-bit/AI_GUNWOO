import api from './auth'
import type { AnalysisResult } from '../types'

export const uploadAndAnalyze = (files: File[]): Promise<AnalysisResult> => {
  const form = new FormData()
  files.forEach((file) => form.append('images', file))
  return api.post('/api/v1/analysis/upload', form, { timeout: 100_000 }).then((r) => r.data)
}

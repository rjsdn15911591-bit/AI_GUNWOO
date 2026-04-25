import api from './auth'
import type { AnalysisResult } from '../types'

export const uploadAndAnalyze = (file: File): Promise<AnalysisResult> => {
  const form = new FormData()
  form.append('image', file)
  return api.post('/api/v1/analysis/upload', form).then((r) => r.data)
}

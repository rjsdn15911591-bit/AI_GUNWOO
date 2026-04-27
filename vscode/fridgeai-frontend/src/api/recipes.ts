import api from './auth'
import type { Recipe, QuotaStatus } from '../types'

export const getRecommendations = (): Promise<Recipe[]> =>
  api.get('/api/v1/recipes/recommend').then((r) => r.data)

export const getRecipeDetail = (id: string) =>
  api.get(`/api/v1/recipes/${id}`).then((r) => r.data)

export const getQuotaStatus = (): Promise<QuotaStatus> =>
  api.get('/api/v1/quota/status').then((r) => r.data)

export const getAICandidates = (data: {
  food_types: string[]
  custom_type?: string
  tastes: string[]
}): Promise<{ candidates: { name: string; description: string }[]; recipe_remaining?: number }> =>
  api.post('/api/v1/recipes/ai-candidates', data).then((r) => r.data)

export const generateAIRecipeFromDish = (data: {
  food_types: string[]
  custom_type?: string
  tastes: string[]
  selected_dish: string
}): Promise<any> =>
  api.post('/api/v1/recipes/ai-generate', data).then((r) => r.data)

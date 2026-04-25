import api from './auth'
import type { Recipe, QuotaStatus } from '../types'

export const getRecommendations = (): Promise<Recipe[]> =>
  api.get('/api/v1/recipes/recommend').then((r) => r.data)

export const getRecipeDetail = (id: string) =>
  api.get(`/api/v1/recipes/${id}`).then((r) => r.data)

export const getQuotaStatus = (): Promise<QuotaStatus> =>
  api.get('/api/v1/quota/status').then((r) => r.data)

import api from './auth'
import type { Refrigerator } from '../types'

export const getFridge = (): Promise<Refrigerator> =>
  api.get('/api/v1/fridge').then((r) => r.data)

export const addIngredient = (data: {
  name: string
  quantity?: number
  unit?: string
  expiry_date?: string
}) => api.post('/api/v1/fridge/ingredients', data).then((r) => r.data)

export const updateIngredient = (id: string, data: object) =>
  api.patch(`/api/v1/fridge/ingredients/${id}`, data).then((r) => r.data)

export const deleteIngredient = (id: string) =>
  api.delete(`/api/v1/fridge/ingredients/${id}`)

export const bulkAddIngredients = (
  items: { name: string; quantity?: number; unit?: string }[]
) => api.post('/api/v1/fridge/ingredients/bulk', items).then((r) => r.data)

export const classifyIngredients = (
  names: string[]
): Promise<Record<string, string>> =>
  api.post('/api/v1/fridge/ingredients/classify', { names }).then((r) => r.data)

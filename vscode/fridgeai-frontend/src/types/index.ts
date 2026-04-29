export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

export interface Ingredient {
  id: string
  name: string
  original_name: string | null
  quantity: number | null
  unit: string | null
  expiry_date: string | null
  source: 'manual' | 'ai_analysis'
  created_at: string
}

export interface Refrigerator {
  id: string
  name: string
  ingredients: Ingredient[]
}

export interface QuotaStatus {
  year_month: string
  plan_type: 'free' | 'premium'
  reset_date: string
  // 냉장고 분석
  analysis_usage: number
  analysis_limit: number
  analysis_remaining: number
  // 레시피 생성
  recipe_usage: number
  recipe_limit: number
  recipe_remaining: number
  // 하위 호환
  usage_count: number
  limit_count: number
  remaining: number
}

export interface DetectedIngredient {
  name: string
  quantity: number | null
  unit: string | null
  confidence: number
}

export interface AnalysisResult {
  analysis_id: string
  detected_ingredients: DetectedIngredient[]
  usage_remaining: number
}

export interface Recipe {
  id: string | number
  title: string
  image: string | null
  ready_in_minutes: number | null
  matched_count: number
  matched_ingredients: string[]
  missing_count: number
  missing_ingredients: string[]
  nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number }
}

export interface Subscription {
  plan_type: 'free' | 'premium'
  status: string
  current_period_end: string | null
}

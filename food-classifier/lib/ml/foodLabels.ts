// food-classifier/lib/ml/foodLabels.ts

const FOOD_KEYWORDS = [
  'pizza', 'burger', 'hamburger', 'hot dog', 'hotdog', 'sandwich',
  'taco', 'burrito', 'sushi', 'ramen', 'noodle', 'pasta', 'spaghetti',
  'steak', 'chicken', 'fish', 'shrimp', 'lobster', 'crab',
  'bread', 'bagel', 'pretzel', 'croissant', 'waffle', 'pancake',
  'cake', 'cupcake', 'donut', 'cookie', 'chocolate', 'ice cream',
  'coffee', 'espresso', 'tea', 'beer', 'wine', 'juice',
  'apple', 'banana', 'orange', 'lemon', 'strawberry', 'cherry',
  'grape', 'watermelon', 'pineapple', 'mango', 'avocado',
  'broccoli', 'cauliflower', 'mushroom', 'pepper', 'tomato',
  'egg', 'cheese', 'butter', 'cream', 'yogurt', 'milk',
  'soup', 'stew', 'curry', 'rice', 'salad', 'sauce',
  'fries', 'chips', 'nachos', 'popcorn',
  'dumpling', 'spring roll', 'pot sticker', 'fried rice',
  'meatball', 'sausage', 'bacon', 'ham', 'turkey',
  'gelatin', 'pudding', 'trifle', 'tiramisu', 'mousse',
  'guacamole', 'hummus', 'salsa', 'pesto', 'mayo',
]

export interface FoodResult {
  label: string
  confidence: number  // 0~1
  rank: number
  isFood: boolean
}

export function filterAndRankResults(
  predictions: Array<{ className: string; probability: number }>,
  topK = 5
): FoodResult[] {
  return predictions.slice(0, topK).map((p, i) => ({
    label: p.className.replace(/_/g, ' '),
    confidence: p.probability,
    rank: i + 1,
    isFood: FOOD_KEYWORDS.some((kw) =>
      p.className.toLowerCase().includes(kw.toLowerCase())
    ),
  }))
}

export function isLikelyFood(results: FoodResult[]): boolean {
  return results[0]?.confidence >= 0.20 && results[0]?.isFood
}

// food-classifier/lib/ml/foodLabels.ts

export const FOOD_KEYWORDS = [
  // 서양 음식
  'pizza', 'burger', 'hamburger', 'hot dog', 'hotdog', 'sandwich', 'cheeseburger',
  'taco', 'burrito', 'quesadilla', 'nachos', 'enchilada',
  'sushi', 'sashimi', 'ramen', 'noodle', 'pasta', 'spaghetti', 'lasagna', 'ravioli',
  'steak', 'chicken', 'fish', 'shrimp', 'lobster', 'crab', 'salmon', 'tuna', 'cod',
  'bread', 'bagel', 'pretzel', 'croissant', 'waffle', 'pancake', 'muffin', 'biscuit',
  'cake', 'cupcake', 'donut', 'doughnut', 'cookie', 'brownie', 'chocolate', 'ice cream',
  'coffee', 'espresso', 'latte', 'cappuccino', 'tea', 'beer', 'wine', 'juice', 'smoothie',
  // 과일
  'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'cherry', 'blueberry',
  'grape', 'watermelon', 'pineapple', 'mango', 'avocado', 'peach', 'pear', 'kiwi',
  'pomegranate', 'fig', 'coconut', 'papaya', 'melon', 'plum', 'apricot',
  // 채소
  'broccoli', 'cauliflower', 'mushroom', 'pepper', 'tomato', 'carrot', 'corn',
  'spinach', 'lettuce', 'cucumber', 'onion', 'garlic', 'potato', 'sweet potato',
  'eggplant', 'zucchini', 'asparagus', 'celery', 'cabbage', 'kale', 'artichoke',
  // 유제품/달걀
  'egg', 'omelette', 'cheese', 'butter', 'cream', 'yogurt', 'milk', 'ice cream',
  // 요리
  'soup', 'stew', 'curry', 'rice', 'fried rice', 'salad', 'sauce', 'gravy',
  'fries', 'chips', 'popcorn', 'pretzel',
  'dumpling', 'spring roll', 'pot sticker', 'wonton', 'dim sum',
  'meatball', 'sausage', 'bacon', 'ham', 'turkey', 'pork', 'beef', 'lamb',
  'gelatin', 'pudding', 'trifle', 'tiramisu', 'mousse', 'macaron', 'eclair',
  'guacamole', 'hummus', 'salsa', 'pesto', 'mayo', 'ketchup', 'mustard',
  'burrito', 'wrap', 'gyro', 'kebab', 'falafel',
  // 한식 — 밥류
  'bibimbap', 'gimbap', 'fried rice', 'dolsot', 'congee', 'porridge', 'juk',
  'bokkeum', 'bokkeumbap', 'rice bowl',
  // 한식 — 국·찌개·탕
  'kimchi jjigae', 'doenjang jjigae', 'sundubu jjigae', 'budae jjigae',
  'seolleongtang', 'galbitang', 'samgyetang', 'haejangguk', 'miyeokguk',
  'yukgaejang', 'kongnamulguk', 'gukbap',
  // 한식 — 고기류
  'bulgogi', 'galbi', 'samgyeopsal', 'dakgalbi', 'buldak', 'jeyuk bokkeum',
  'galbi jjim', 'braised short rib', 'dwaeji galbi', 'chadolbaegi',
  // 한식 — 김치·반찬
  'kimchi', 'kkakdugi', 'oi sobagi', 'nabak kimchi', 'dongchimi',
  'japchae', 'sigeumchi namul', 'kongnamul', 'doraji namul', 'gosari namul',
  'dubu jorim', 'gamja jorim', 'myeolchi bokkeum',
  // 한식 — 면류
  'jjajangmyeon', 'jjamppong', 'naengmyeon', 'mul naengmyeon', 'bibim naengmyeon',
  'ramyeon', 'udon', 'kalguksu', 'sujebi', 'kongguksu',
  // 한식 — 분식
  'tteokbokki', 'tteok', 'mandu', 'kimbap', 'twigim', 'sundae',
  'hotteok', 'bungeoppang', 'gyeran ppang', 'odeng', 'eomuk',
  // 한식 — 해산물
  'haemul', 'haemul pajeon', 'pajeon', 'bindaetteok', 'jeon',
  'ganjang gejang', 'yangnyeom gejang', 'ojingeo bokkeum',
  // 한식 — 디저트·음료
  'bingsu', 'patbingsu', 'sikhye', 'sujeonggwa', 'makgeolli', 'soju',
  'misugaru', 'injeolmi', 'yakgwa', 'hangwa', 'chapssaltteok',
  // 일식
  'sushi', 'sashimi', 'ramen', 'udon', 'soba', 'tempura', 'tonkatsu', 'katsu',
  'teriyaki', 'miso', 'onigiri', 'takoyaki', 'okonomiyaki', 'yakitori', 'gyoza',
  'edamame', 'tofu', 'natto', 'karaage', 'shabu', 'sukiyaki', 'yakiniku',
  'donburi', 'oyakodon', 'katsudon', 'gyudon', 'kaiseki', 'bento',
  'mochi', 'wagashi', 'dorayaki', 'taiyaki', 'anmitsu', 'matcha',
  'dashi', 'ponzu', 'wasabi', 'nori', 'wakame', 'kombu',
  'unagi', 'ikura', 'tobiko', 'uni', 'toro', 'hamachi',
  // 동남아
  'pad thai', 'pho', 'banh mi', 'tom yum', 'green curry',
  'paella', 'risotto', 'gnocchi', 'focaccia', 'bruschetta',
  'churro', 'crepe', 'macaron', 'profiterole', 'tart', 'pie', 'cobbler',
  'granola', 'oatmeal', 'cereal', 'toast', 'french toast',
  'burrito', 'empanada', 'tamale',
  'poke', 'ceviche', 'gazpacho',
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

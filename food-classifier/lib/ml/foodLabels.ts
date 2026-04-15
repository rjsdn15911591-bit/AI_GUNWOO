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
  // ImageNet 실제 출력 클래스 (모델이 실제로 예측하는 음식 관련 레이블)
  'consomme', 'cheeseburger', 'french loaf', 'loaf', 'meat loaf', 'meatloaf',
  'squash', 'butternut', 'acorn squash', 'Granny Smith',
  'carbonara', 'broth', 'bouillon', 'bisque', 'chowder',
  'fried', 'breaded', 'cutlet', 'schnitzel', 'katsu',
  'dough', 'batter', 'bun', 'roll', 'flatbread', 'tortilla', 'pita',
  'cheddar', 'gouda', 'brie', 'mozzarella', 'parmesan',
  'sirloin', 'tenderloin', 'ribeye', 'brisket', 'chuck', 'loin',
  'drumstick', 'wing', 'breast', 'thigh', 'roast',
  'nori', 'seaweed', 'kombu', 'bonito', 'anchovy',
  'clam', 'oyster', 'mussel', 'scallop', 'squid', 'octopus',
  'lentil', 'chickpea', 'bean', 'pea', 'edamame',
  'ginger', 'turmeric', 'cinnamon', 'sesame', 'soy',
  'vinegar', 'olive oil', 'broth', 'stock',
  'naan', 'chapati', 'dumpling', 'pierogi', 'empanada',
  'affogato', 'gelato', 'sorbet', 'parfait', 'sundae',
  'chutney', 'relish', 'aioli', 'tapenade',
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

export const KOREAN_MAP: Record<string, string> = {
  // 서양 음식
  pizza: '피자', burger: '버거', hamburger: '햄버거', cheeseburger: '치즈버거',
  'hot dog': '핫도그', hotdog: '핫도그', sandwich: '샌드위치',
  taco: '타코', burrito: '부리토', quesadilla: '케사디아', nachos: '나초',
  sushi: '스시', sashimi: '사시미', ramen: '라멘', udon: '우동', soba: '소바',
  noodle: '면', pasta: '파스타', spaghetti: '스파게티', lasagna: '라자냐',
  steak: '스테이크', chicken: '치킨', fish: '생선', shrimp: '새우',
  lobster: '랍스터', crab: '게', salmon: '연어', tuna: '참치',
  bread: '빵', bagel: '베이글', pretzel: '프레첼', croissant: '크루아상',
  waffle: '와플', pancake: '팬케이크', muffin: '머핀',
  cake: '케이크', cupcake: '컵케이크', donut: '도넛', doughnut: '도넛',
  cookie: '쿠키', brownie: '브라우니', chocolate: '초콜릿', 'ice cream': '아이스크림',
  coffee: '커피', espresso: '에스프레소', latte: '라떼', cappuccino: '카푸치노',
  tea: '차', beer: '맥주', wine: '와인', juice: '주스', smoothie: '스무디',
  // 과일
  apple: '사과', banana: '바나나', orange: '오렌지', lemon: '레몬', lime: '라임',
  strawberry: '딸기', cherry: '체리', blueberry: '블루베리',
  grape: '포도', watermelon: '수박', pineapple: '파인애플',
  mango: '망고', avocado: '아보카도', peach: '복숭아', pear: '배',
  kiwi: '키위', pomegranate: '석류', fig: '무화과', coconut: '코코넛',
  papaya: '파파야', melon: '멜론', plum: '자두', apricot: '살구',
  // 채소
  broccoli: '브로콜리', cauliflower: '콜리플라워', mushroom: '버섯',
  pepper: '피망', tomato: '토마토', carrot: '당근', corn: '옥수수',
  spinach: '시금치', lettuce: '상추', cucumber: '오이', onion: '양파',
  garlic: '마늘', potato: '감자', 'sweet potato': '고구마',
  eggplant: '가지', zucchini: '애호박', asparagus: '아스파라거스',
  celery: '셀러리', cabbage: '양배추',
  // 유제품
  egg: '달걀', cheese: '치즈', butter: '버터', cream: '크림',
  yogurt: '요거트', milk: '우유', tofu: '두부',
  // 요리
  soup: '수프', stew: '스튜', curry: '카레', rice: '쌀밥', salad: '샐러드',
  fries: '감자튀김', chips: '칩', popcorn: '팝콘',
  dumpling: '만두', gyoza: '교자', 'spring roll': '스프링롤',
  meatball: '미트볼', sausage: '소시지', bacon: '베이컨', ham: '햄',
  tempura: '튀김', tonkatsu: '돈카츠', karaage: '가라아게',
  teriyaki: '데리야키', takoyaki: '타코야키', okonomiyaki: '오코노미야키',
  yakitori: '야키토리', onigiri: '주먹밥', bento: '도시락',
  mochi: '모찌', matcha: '말차', edamame: '에다마메',
  unagi: '장어', 'pot sticker': '군만두',
  // 한식
  bibimbap: '비빔밥', gimbap: '김밥', kimchi: '김치',
  bulgogi: '불고기', galbi: '갈비', samgyeopsal: '삼겹살',
  tteokbokki: '떡볶이', tteok: '떡', japchae: '잡채',
  mandu: '만두', dakgalbi: '닭갈비', jjigae: '찌개',
  'kimchi jjigae': '김치찌개', 'doenjang jjigae': '된장찌개',
  'sundubu jjigae': '순두부찌개', 'budae jjigae': '부대찌개',
  samgyetang: '삼계탕', galbitang: '갈비탕', seolleongtang: '설렁탕',
  naengmyeon: '냉면', jjajangmyeon: '짜장면', jjamppong: '짬뽕',
  kalguksu: '칼국수', pajeon: '파전', bindaetteok: '빈대떡',
  bingsu: '빙수', hotteok: '호떡', bungeoppang: '붕어빵',
  // 기타
  'pad thai': '팟타이', pho: '쌀국수', 'banh mi': '반미',
  'tom yum': '똠얌', risotto: '리소토', paella: '파에야',
  crepe: '크레이프', churro: '추로스', macaron: '마카롱',
  granola: '그래놀라', oatmeal: '오트밀', toast: '토스트',
  'french toast': '프렌치토스트', kebab: '케밥', gyro: '지로',
  falafel: '팔라펠', hummus: '후무스', guacamole: '과카몰리',
  'green curry': '그린카레',
  // ImageNet 실제 출력 클래스 한글화
  consomme: '콩소메 수프', 'french loaf': '바게트', 'meat loaf': '미트로프',
  meatloaf: '미트로프', squash: '스쿼시', butternut: '버터넛 스쿼시',
  'Granny Smith': '그래니 스미스 사과', schnitzel: '슈니첼', cutlet: '커틀릿',
  brisket: '브리스킷', loin: '등심', sirloin: '등심 스테이크',
  tenderloin: '안심', ribeye: '립아이', drumstick: '닭다리',
  roast: '구이', clam: '조개', oyster: '굴', mussel: '홍합',
  scallop: '가리비', squid: '오징어', octopus: '문어',
  lentil: '렌틸콩', chickpea: '병아리콩', bean: '콩',
  sesame: '참깨', ginger: '생강', naan: '난', pierogi: '피에로기',
  gelato: '젤라토', sorbet: '셔벗', parfait: '파르페', sundae: '선데',
  affogato: '아포가토', anchovy: '멸치', bonito: '가다랑어',
}

export function toKorean(label: string): string {
  const lower = label.toLowerCase().replace(/_/g, ' ')
  // 정확히 일치하는 키 먼저 찾기
  if (KOREAN_MAP[lower]) return KOREAN_MAP[lower]
  // 부분 일치
  for (const [key, value] of Object.entries(KOREAN_MAP)) {
    if (lower.includes(key)) return value
  }
  return label.replace(/_/g, ' ')  // 번역 없으면 원어 그대로
}

export interface FoodResult {
  label: string
  labelKo: string
  confidence: number  // 0~1
  rank: number
  isFood: boolean
}

export function filterAndRankResults(
  predictions: Array<{ className: string; probability: number }>,
  topK = 5
): FoodResult[] {
  const tagged = predictions.map((p, i) => ({
    label: p.className.replace(/_/g, ' '),
    labelKo: toKorean(p.className),
    confidence: p.probability,
    rank: i + 1,
    isFood: FOOD_KEYWORDS.some((kw) =>
      p.className.toLowerCase().includes(kw.toLowerCase())
    ),
  }))

  // 음식으로 분류된 항목만 먼저 추출
  const foodOnly = tagged.filter((r) => r.isFood)

  // 음식 결과가 1개 이상이면 음식만 표시, 없으면 전체에서 top-K 표시 (경고 메시지용)
  const toShow = foodOnly.length > 0 ? foodOnly : tagged.slice(0, topK)

  return toShow.slice(0, topK).map((r, i) => ({ ...r, rank: i + 1 }))
}

export function isLikelyFood(results: FoodResult[]): boolean {
  return results[0]?.confidence >= 0.20 && results[0]?.isFood
}

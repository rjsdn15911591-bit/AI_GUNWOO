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
  // ── 서양 음식 ──────────────────────────────────────────────
  pizza: '피자',
  burger: '햄버거', hamburger: '햄버거', cheeseburger: '치즈버거',
  'hot dog': '핫도그', hotdog: '핫도그',
  sandwich: '샌드위치', wrap: '랩 샌드위치',
  taco: '타코', burrito: '부리토', quesadilla: '케사디야',
  nachos: '나초', enchilada: '엔칠라다', tamale: '타말레',
  empanada: '엠파나다',

  // ── 면·파스타 ───────────────────────────────────────────────
  noodle: '면', pasta: '파스타', spaghetti: '스파게티',
  lasagna: '라자냐', ravioli: '라비올리', gnocchi: '뇨키',
  carbonara: '카르보나라',

  // ── 스시·일식 ────────────────────────────────────────────────
  sushi: '초밥',                    // 표준국어대사전: 초밥
  sashimi: '생선회',                // 표준국어대사전: 회/생선회
  ramen: '라멘', udon: '우동', soba: '소바', ramyeon: '라면',
  tempura: '덴푸라',                // 표준국어대사전: 덴푸라
  tonkatsu: '돈가스',               // 표준국어대사전: 돈가스
  katsu: '돈가스', katsudon: '가쓰동', oyakodon: '오야코동',
  gyudon: '규동', donburi: '덮밥',
  karaage: '가라아게', teriyaki: '데리야키',
  takoyaki: '타코야키', okonomiyaki: '오코노미야키',
  yakitori: '야키토리', yakiniku: '야키니쿠',
  onigiri: '주먹밥', bento: '도시락',
  gyoza: '교자만두', 'pot sticker': '군만두',
  mochi: '모치',                    // 국립국어원 표기: 모치
  matcha: '말차', wagashi: '일본 전통 과자',
  dorayaki: '도라야키', taiyaki: '다이야키', anmitsu: '안미쓰',
  dashi: '다시 국물', ponzu: '폰즈', wasabi: '와사비',
  nori: '김', wakame: '미역', kombu: '다시마',
  edamame: '풋콩',                  // 풋콩이 표준(에다마메는 외래어)
  tofu: '두부', natto: '낫토',
  shabu: '샤부샤부', sukiyaki: '스키야키',
  kaiseki: '가이세키', miso: '된장',
  unagi: '민물장어', ikura: '연어알', tobiko: '날치알',
  uni: '성게알', toro: '참치 뱃살', hamachi: '방어',

  // ── 육류·해산물 ─────────────────────────────────────────────
  steak: '스테이크',
  chicken: '닭고기', fish: '생선', shrimp: '새우',
  lobster: '바닷가재',              // 표준국어대사전: 바닷가재
  crab: '게', salmon: '연어', tuna: '참치', cod: '대구',
  beef: '쇠고기', pork: '돼지고기', lamb: '양고기', turkey: '칠면조',
  ham: '햄', bacon: '베이컨', sausage: '소시지',
  meatball: '미트볼',
  sirloin: '채끝등심', tenderloin: '안심', ribeye: '립아이 스테이크',
  brisket: '양지 살', loin: '등심', cutlet: '커틀릿', schnitzel: '슈니첼',
  drumstick: '닭다리', wing: '닭 날개', breast: '닭 가슴살', thigh: '닭 넓적다리살',
  roast: '구이',
  clam: '조개', oyster: '굴', mussel: '홍합', scallop: '가리비',
  squid: '오징어', octopus: '문어', anchovy: '멸치', bonito: '가다랑어',

  // ── 빵·과자·디저트 ──────────────────────────────────────────
  bread: '빵', bagel: '베이글',
  pretzel: '프레츠엘',             // 국립국어원 표기: 프레츠엘
  croissant: '크루아상', waffle: '와플', pancake: '팬케이크',
  muffin: '머핀', biscuit: '비스킷', bun: '번', roll: '롤빵',
  flatbread: '납작빵', tortilla: '토르티야', pita: '피타빵',
  naan: '난', chapati: '차파티',
  'french loaf': '프랑스 빵', 'meat loaf': '미트로프', meatloaf: '미트로프',
  loaf: '식빵',
  cake: '케이크', cupcake: '컵케이크',
  donut: '도넛', doughnut: '도넛',   // 표준국어대사전: 도넛
  cookie: '쿠키', brownie: '브라우니', chocolate: '초콜릿',
  'ice cream': '아이스크림',
  gelatin: '젤라틴', pudding: '푸딩', trifle: '트라이플',
  tiramisu: '티라미수', mousse: '무스',
  macaron: '마카롱', eclair: '에클레르', profiterole: '프로피테롤',
  tart: '타르트', pie: '파이', cobbler: '코블러',
  churro: '추로스', crepe: '크레이프',
  gelato: '젤라토', sorbet: '셔벗', parfait: '파르페',
  sundae: '선데이',                 // 아이스크림 선데이
  affogato: '아포가토',
  granola: '그래놀라', oatmeal: '오트밀', cereal: '시리얼',
  toast: '토스트', 'french toast': '프렌치토스트',
  pierogi: '피에로기',

  // ── 음료 ────────────────────────────────────────────────────
  coffee: '커피', espresso: '에스프레소',
  latte: '라테',                    // 국립국어원 표기: 라테 (라떼 아님)
  cappuccino: '카푸치노', tea: '차', beer: '맥주', wine: '와인',
  juice: '주스', smoothie: '스무디',

  // ── 과일 ────────────────────────────────────────────────────
  apple: '사과', banana: '바나나', orange: '오렌지', lemon: '레몬', lime: '라임',
  strawberry: '딸기', cherry: '체리', blueberry: '블루베리',
  grape: '포도', watermelon: '수박', pineapple: '파인애플',
  mango: '망고', avocado: '아보카도', peach: '복숭아', pear: '배',
  kiwi: '키위', pomegranate: '석류', fig: '무화과', coconut: '코코넛',
  papaya: '파파야', melon: '멜론', plum: '자두', apricot: '살구',
  'Granny Smith': '그래니스미스 사과',

  // ── 채소 ────────────────────────────────────────────────────
  broccoli: '브로콜리',
  cauliflower: '꽃양배추',          // 표준국어대사전: 꽃양배추
  mushroom: '버섯', pepper: '피망', tomato: '토마토',
  carrot: '당근', corn: '옥수수', spinach: '시금치', lettuce: '상추',
  cucumber: '오이', onion: '양파', garlic: '마늘', potato: '감자',
  'sweet potato': '고구마',
  eggplant: '가지',
  zucchini: '주키니호박',           // 주키니호박이 더 정확
  asparagus: '아스파라거스', celery: '셀러리', cabbage: '양배추',
  kale: '케일', artichoke: '아티초크',
  squash: '호박', butternut: '버터넛 호박', 'acorn squash': '도토리 호박',
  lentil: '렌틸콩', chickpea: '병아리콩', bean: '콩', pea: '완두콩',
  ginger: '생강', turmeric: '강황', cinnamon: '계피', sesame: '참깨',

  // ── 유제품·달걀 ─────────────────────────────────────────────
  egg: '달걀', omelette: '오믈렛',
  cheese: '치즈', butter: '버터', cream: '크림',
  yogurt: '요구르트',               // 표준국어대사전: 요구르트
  milk: '우유',
  cheddar: '체다 치즈', gouda: '고다 치즈', brie: '브리 치즈',
  mozzarella: '모차렐라', parmesan: '파르메산 치즈',

  // ── 소스·조미료 ─────────────────────────────────────────────
  soup: '수프', stew: '스튜', curry: '카레',
  sauce: '소스', gravy: '그레이비 소스',
  salad: '샐러드', rice: '쌀밥', 'fried rice': '볶음밥',
  fries: '감자튀김', chips: '칩', popcorn: '팝콘',
  'spring roll': '스프링롤', dumpling: '만두', wonton: '완탕', 'dim sum': '딤섬',
  guacamole: '과카몰레',            // 국립국어원 표기: 과카몰레
  hummus: '후무스', salsa: '살사', pesto: '페스토',
  mayo: '마요네즈', ketchup: '케첩', mustard: '머스터드',
  soy: '간장', vinegar: '식초', 'olive oil': '올리브유',
  broth: '육수', stock: '육수', bouillon: '부용', consomme: '콩소메',
  bisque: '비스크', chowder: '차우더',
  chutney: '처트니', aioli: '아이올리',

  // ── 중동·지중해 ─────────────────────────────────────────────
  kebab: '케밥', gyro: '자이로스',   // 그리스어 표기: 자이로스
  falafel: '팔라펠', gyros: '자이로스',

  // ── 동남아·기타 세계 음식 ────────────────────────────────────
  'pad thai': '팟타이', pho: '쌀국수', 'banh mi': '반미',
  'tom yum': '똠얌꿍', 'green curry': '그린 카레',
  risotto: '리소토', paella: '파에야',
  focaccia: '포카치아', bruschetta: '브루스케타',
  poke: '포케', ceviche: '세비체', gazpacho: '가스파초',

  // ── 한식 — 밥류 ─────────────────────────────────────────────
  bibimbap: '비빔밥', gimbap: '김밥', kimbap: '김밥',
  dolsot: '돌솥', congee: '죽', porridge: '죽', juk: '죽',
  bokkeumbap: '볶음밥', 'rice bowl': '덮밥',

  // ── 한식 — 국·찌개·탕 ───────────────────────────────────────
  'kimchi jjigae': '김치찌개', 'doenjang jjigae': '된장찌개',
  'sundubu jjigae': '순두부찌개', 'budae jjigae': '부대찌개',
  seolleongtang: '설렁탕', galbitang: '갈비탕', samgyetang: '삼계탕',
  haejangguk: '해장국', miyeokguk: '미역국',
  yukgaejang: '육개장', kongnamulguk: '콩나물국', gukbap: '국밥',
  jjigae: '찌개',

  // ── 한식 — 고기류 ───────────────────────────────────────────
  bulgogi: '불고기', galbi: '갈비', samgyeopsal: '삼겹살',
  dakgalbi: '닭갈비', buldak: '불닭', 'jeyuk bokkeum': '제육볶음',
  'galbi jjim': '갈비찜', 'braised short rib': '갈비찜',
  'dwaeji galbi': '돼지갈비', chadolbaegi: '차돌박이',

  // ── 한식 — 김치·반찬 ────────────────────────────────────────
  kimchi: '김치', kkakdugi: '깍두기', 'oi sobagi': '오이소박이',
  'nabak kimchi': '나박김치', dongchimi: '동치미',
  japchae: '잡채', 'sigeumchi namul': '시금치 나물',
  kongnamul: '콩나물', 'doraji namul': '도라지 나물', 'gosari namul': '고사리 나물',
  'dubu jorim': '두부조림', 'gamja jorim': '감자조림', 'myeolchi bokkeum': '멸치볶음',

  // ── 한식 — 면류 ─────────────────────────────────────────────
  jjajangmyeon: '짜장면', jjamppong: '짬뽕',
  naengmyeon: '냉면', 'mul naengmyeon': '물냉면', 'bibim naengmyeon': '비빔냉면',
  kalguksu: '칼국수', sujebi: '수제비', kongguksu: '콩국수',

  // ── 한식 — 분식 ─────────────────────────────────────────────
  tteokbokki: '떡볶이', tteok: '떡', mandu: '만두',
  twigim: '튀김', hotteok: '호떡', bungeoppang: '붕어빵',
  'gyeran ppang': '계란빵', odeng: '오뎅', eomuk: '어묵',

  // ── 한식 — 해산물 ───────────────────────────────────────────
  haemul: '해물', 'haemul pajeon': '해물파전', pajeon: '파전',
  bindaetteok: '빈대떡', jeon: '전',
  'ganjang gejang': '간장게장', 'yangnyeom gejang': '양념게장',
  'ojingeo bokkeum': '오징어볶음',

  // ── 한식 — 디저트·음료 ──────────────────────────────────────
  bingsu: '빙수', patbingsu: '팥빙수', sikhye: '식혜',
  sujeonggwa: '수정과', makgeolli: '막걸리', soju: '소주',
  misugaru: '미숫가루', injeolmi: '인절미',
  yakgwa: '약과', hangwa: '한과', chapssaltteok: '찹쌀떡',
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

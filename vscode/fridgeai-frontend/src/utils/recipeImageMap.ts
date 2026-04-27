import type { ImageSource } from './foodishImages'

/**
 * 레시피 ID → Pexels 검색어 매핑
 * image: None 인 레시피 (local-20 ~) 전부 포함
 */
export const RECIPE_IMAGE_MAP: Record<string, ImageSource> = {
  // ── 한식 (Wikipedia에 없어서 Pexels로 처리) ──────────────────────────────
  'local-3':  { query: 'korean egg fried rice bowl' },           // 계란볶음밥
  'local-4':  { query: 'korean stir fried potato strips gamja' }, // 감자볶음
  'local-6':  { query: 'korean spinach seasoned side dish namul' }, // 시금치나물
  'local-10': { query: 'korean bean sprout soup kongnamul guk' }, // 콩나물국
  'local-11': { query: 'korean fish cake stir fry eomuk' },      // 어묵볶음
  'local-15': { query: 'korean cucumber salad seasoned oi muchim' }, // 오이무침
  'local-24': { query: 'korean fish cake skewer soup odeng' },    // 어묵탕
  'local-25': { query: 'soy marinated soft boiled eggs korean jangjorim' }, // 계란장

  // ── 일식 ──────────────────────────────────────────────────────────────────
  'local-26': { query: 'gyudon beef bowl japanese rice' },
  'local-27': { query: 'miso soup tofu seaweed japanese' },
  'local-28': { query: 'oyakodon chicken egg rice bowl japanese' },
  'local-29': { query: 'yakisoba stir fried noodles japanese' },
  'local-30': { query: 'teriyaki chicken sauce glaze' },
  'local-31': { query: 'steamed egg custard japanese chawanmushi' },
  'local-32': { query: 'curry udon noodle soup japanese' },

  // ── 중식 ──────────────────────────────────────────────────────────────────
  'local-33': { query: 'mapo tofu spicy sichuan chinese' },
  'local-34': { query: 'tomato egg stir fry chinese home cooking' },
  'local-35': { query: 'bok choy stir fry oyster sauce' },
  'local-36': { query: 'crispy fried chicken chinese spicy' },
  'local-37': { query: 'eggplant garlic sauce stir fry asian' },
  'local-38': { query: 'chinese fried rice wok' },
  'local-39': { query: 'sweet and sour pork chinese' },

  // ── 양식 ──────────────────────────────────────────────────────────────────
  'local-40': { query: 'spaghetti carbonara cream pasta' },
  'local-41': { query: 'tomato spaghetti marinara pasta' },
  'local-42': { query: 'beef steak pan seared' },
  'local-43': { query: 'omelette butter egg folded pan' },
  'local-44': { query: 'cream soup bowl white dinner' },
  'local-45': { query: 'gratin baked cheese crust casserole' },
  'local-46': { query: 'risotto parmesan cream italian' },

  // ── 일식 추가 ─────────────────────────────────────────────────────────────
  'local-47': { query: 'cold udon noodles dipping sauce' },
  'local-48': { query: 'okonomiyaki japanese pancake savory' },
  'local-49': { query: 'inari sushi tofu pocket' },
  'local-50': { query: 'japanese fried rice egg tamago' },
  'local-51': { query: 'ramen noodle soup bowl' },
  'local-52': { query: 'udon noodle hot pot soup' },
  'local-53': { query: 'tempura rice bowl tendon japanese' },

  // ── 중식 추가 ─────────────────────────────────────────────────────────────
  'local-54': { query: 'black bean sauce noodle chinese korean' },  // 자장면
  'local-55': { query: 'spicy seafood noodle soup red broth' },     // 짬뽕
  'local-56': { query: 'pan fried dumplings potstickers golden' },
  'local-57': { query: 'beef pepper black bean stir fry wok' },
  'local-58': { query: 'shrimp chili sauce stir fry' },
  'local-59': { query: 'red braised pork belly dongpo' },
  'local-60': { query: 'seafood stir fry wok mixed' },

  // ── 양식 추가 ─────────────────────────────────────────────────────────────
  'local-61': { query: 'clam pasta white wine vongole' },
  'local-62': { query: 'meatball spaghetti tomato sauce' },
  'local-63': { query: 'eggs benedict hollandaise sauce brunch' },
  'local-64': { query: 'caesar salad romaine parmesan crouton' },
  'local-65': { query: 'cream of mushroom soup bowl' },
  'local-66': { query: 'creamy chicken sauce rice dinner' },
  'local-67': { query: 'french onion soup cheese bread crouton' },
}

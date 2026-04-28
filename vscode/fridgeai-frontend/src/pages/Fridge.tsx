import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getFridge, addIngredient, deleteIngredient, updateIngredient, classifyIngredients } from '../api/fridge'
import type { Refrigerator, Ingredient } from '../types'

// ─── 재료 메타 시스템 ──────────────────────────────────────────────────────
type CategoryId =
  | 'vegetable' | 'fruit' | 'meat_fish' | 'dairy'
  | 'cooked' | 'egg_convenience' | 'ready_made' | 'sauce' | 'beverage' | 'grain' | 'other'
type StorageType = '실온' | '냉장' | '냉동'

interface IngredientMeta {
  category: CategoryId
  storage: StorageType | null
  shortShelf: boolean
  spoilage: boolean
}

const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'vegetable',       label: '채소',          emoji: '🥦' },
  { id: 'fruit',           label: '과일',          emoji: '🍎' },
  { id: 'meat_fish',       label: '육류·생선',     emoji: '🥩' },
  { id: 'dairy',           label: '유제품',        emoji: '🧀' },
  { id: 'cooked',          label: '조리식품·반찬', emoji: '🍱' },
  { id: 'egg_convenience', label: '달걀·간편식',   emoji: '🥚' },
  { id: 'ready_made',      label: '완제품',        emoji: '🍕' },
  { id: 'sauce',           label: '소스·양념',     emoji: '🧂' },
  { id: 'beverage',        label: '음료',          emoji: '🥤' },
  { id: 'grain',           label: '곡물·건식품',   emoji: '🌾' },
  { id: 'other',           label: '기타',          emoji: '📦' },
]

function getIngredientMeta(name: string): IngredientMeta {
  const n = name
  if (/냉동|아이스크림/.test(n))
    return { category: 'egg_convenience', storage: '냉동', shortShelf: false, spoilage: false }
  if (/계란|달걀|메추리알/.test(n))
    return { category: 'egg_convenience', storage: '냉장', shortShelf: true, spoilage: true }
  if (/소고기|쇠고기|우육|돼지고기|닭고기|닭가슴|닭다리|닭날개|닭봉|삼겹살|목살|앞다리살|갈비|불고기용|다진고기|차슈|육류/.test(n))
    return { category: 'meat_fish', storage: '냉장', shortShelf: true, spoilage: true }
  if (/베이컨|햄\b|소시지|스팸|런천미트|핫도그소시지/.test(n))
    return { category: 'meat_fish', storage: '냉장', shortShelf: true, spoilage: true }
  if (/고등어|꽁치|갈치|조기|광어|연어|참치\b|오징어|낙지|문어|새우|바지락|홍합|굴\b|조개|명태|동태|코다리|게\b|꽃게|아귀|전복|관자|해산물|생선|어류/.test(n))
    return { category: 'meat_fish', storage: '냉장', shortShelf: true, spoilage: true }
  if (/생멸치|멸치\b/.test(n))
    return { category: 'meat_fish', storage: '냉장', shortShelf: true, spoilage: true }
  if (/건멸치|마른멸치|멸치포|건새우|건오징어|건어물|북어포|황태/.test(n))
    return { category: 'grain', storage: '실온', shortShelf: false, spoilage: false }
  if (/우유|두유|요거트|요구르트|치즈|버터|생크림|크림치즈|모차렐라|파르메산|그뤼에르|리코타|브리치즈|슬라이스치즈|아이스크림/.test(n))
    return { category: 'dairy', storage: '냉장', shortShelf: true, spoilage: true }
  if (/딸기|체리|블루베리|라즈베리|복숭아|자두|수박|멜론|아보카도|바나나|무화과/.test(n))
    return { category: 'fruit', storage: '냉장', shortShelf: true, spoilage: true }
  if (/사과|배\b|감귤|귤|오렌지|레몬|라임|포도|파인애플|키위|망고|과일/.test(n))
    return { category: 'fruit', storage: '냉장', shortShelf: true, spoilage: false }
  if (/두부|순두부|연두부|찌개용두부/.test(n))
    return { category: 'cooked', storage: '냉장', shortShelf: true, spoilage: true }
  if (/김치|깍두기|총각김치|동치미|깻잎김치|장아찌|어묵|묵\b|도토리묵|나물\b|볶음\b|조림\b|유부|반찬/.test(n))
    return { category: 'cooked', storage: '냉장', shortShelf: true, spoilage: true }
  // 완제품 — AI가 분류 (category + storage 모두 AI 판단)
  if (/라면|컵라면|즉석밥|간편식/.test(n))
    return { category: 'egg_convenience', storage: '냉동', shortShelf: false, spoilage: false }
  if (/마요네즈/.test(n))
    return { category: 'sauce', storage: '냉장', shortShelf: true, spoilage: false }
  if (/머스타드|머스터드|잼\b|딸기잼|포도잼|블루베리잼|초장|쌈장\b/.test(n))
    return { category: 'sauce', storage: '냉장', shortShelf: false, spoilage: false }
  if (/간장|된장|고추장|고춧가루|소금|설탕|식초|참기름|들기름|올리브유|식용유|케첩|굴소스|미림|맛술|청주|전분|밀가루|녹말|빵가루|바질|오레가노|로즈마리|타임|통깨|깨소금|깨\b|소스|양념|향신료|후추|너트메그|파프리카파우더|카레가루|허브/.test(n))
    return { category: 'sauce', storage: '실온', shortShelf: false, spoilage: false }
  if (/시금치|상추|깻잎|쑥갓|콩나물|숙주|아욱|미나리|쪽파|실파|부추|새싹|로메인|케일|루꼴라/.test(n))
    return { category: 'vegetable', storage: '냉장', shortShelf: true, spoilage: true }
  if (/배추|양배추|대파|당근|무\b|오이|호박|애호박|단호박|가지|고추|청양고추|풋고추|홍고추|피망|파프리카|토마토|방울토마토|브로콜리|버섯|표고|양송이|팽이|느타리|새송이|셀러리|채소/.test(n))
    return { category: 'vegetable', storage: '냉장', shortShelf: true, spoilage: false }
  if (/옥수수|작두콩|강낭콩\b|완두콩|땅콩\b/.test(n))
    return { category: 'vegetable', storage: '냉장', shortShelf: false, spoilage: false }
  if (/양파|마늘|생강|감자|고구마|도라지|연근/.test(n))
    return { category: 'vegetable', storage: '실온', shortShelf: false, spoilage: false }
  if (/주스|생과일주스|콜라|사이다|맥주|와인|소주|커피|녹차|홍차|음료|탄산수|이온음료/.test(n))
    return { category: 'beverage', storage: '냉장', shortShelf: false, spoilage: false }
  if (/생수|물\b/.test(n))
    return { category: 'beverage', storage: '실온', shortShelf: false, spoilage: false }
  if (/쌀\b|잡곡|보리\b|현미|귀리|오트밀|스파게티|파스타|국수|당면|건미역|다시마|견과류|호두|아몬드|캐슈넛|피스타치오|빵\b|식빵|베이글|크래커|시리얼|통조림|참치캔|흑태|메주콩|팥\b|녹두|콩\b|렌틸|코코아|초콜릿/.test(n))
    return { category: 'grain', storage: '실온', shortShelf: false, spoilage: false }
  return { category: 'other', storage: null, shortShelf: false, spoilage: false }
}

// ─── 스토리지 뱃지 ──────────────────────────────────────────────────────────
const STORAGE_STYLE: Record<StorageType, { bg: string; color: string; icon: string }> = {
  '실온': { bg: 'rgba(250,199,117,0.15)', color: '#9A7A2A', icon: '🌡️' },
  '냉장': { bg: 'rgba(93,202,165,0.12)', color: '#1D9E75',  icon: '❄️' },
  '냉동': { bg: 'rgba(100,130,220,0.12)', color: '#4A6BC9', icon: '🧊' },
}

function StorageBadge({ type }: { type: StorageType | null }) {
  if (!type) return null
  const s = STORAGE_STYLE[type]
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.icon}{type}
    </span>
  )
}

const CATEGORY_DEFAULT_STORAGE: Record<CategoryId, StorageType | null> = {
  vegetable: '냉장', fruit: '냉장', meat_fish: '냉장', dairy: '냉장',
  cooked: '냉장', egg_convenience: '냉장', ready_made: '냉장', sauce: '실온', beverage: '냉장',
  grain: '실온', other: null,
}

type AIMeta = { category: CategoryId; storage: StorageType | null }
const AI_CACHE_KEY = 'fridgeai_classify_cache_v2'
function getCache(): Record<string, AIMeta> {
  try { return JSON.parse(localStorage.getItem(AI_CACHE_KEY) ?? '{}') } catch { return {} }
}
function mergeCache(updates: Record<string, AIMeta>) {
  const merged = { ...getCache(), ...updates }
  try { localStorage.setItem(AI_CACHE_KEY, JSON.stringify(merged)) } catch { /* ignore */ }
  return merged
}

export default function Fridge() {
  const [fridge, setFridge] = useState<Refrigerator | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editExpiry, setEditExpiry] = useState('')
  const [aiCategories, setAiCategories] = useState<Record<string, AIMeta>>(getCache)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addUnit, setAddUnit] = useState('')
  const [addExpiry, setAddExpiry] = useState('')
  const [adding, setAdding] = useState(false)

  const inputStyle: React.CSSProperties = {
    border: '1px solid #D3D1C7',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#fff',
    color: '#1A1A1A',
    outline: 'none',
    width: '100%',
  }

  const handleAdd = async () => {
    if (!addName.trim()) return
    setAdding(true)
    try {
      await addIngredient({
        name: addName.trim(),
        quantity: addQty !== '' ? Number(addQty) || undefined : undefined,
        unit: addUnit.trim() || undefined,
        expiry_date: addExpiry || undefined,
      })
      setAddName(''); setAddQty(''); setAddUnit(''); setAddExpiry('')
      setShowAddForm(false)
      load(true) // 서버 ID 동기화 (로딩 화면 없이 조용히)
    } catch (e) { console.error(e) }
    finally { setAdding(false) }
  }

  const load = (silent = false) => {
    if (!silent) setLoading(true)
    getFridge()
      .then((data) => {
        setFridge(data)
        const cache = getCache()
        const unknowns = data.ingredients
          .map((i) => i.name)
          .filter((name) => {
            const meta = getIngredientMeta(name)
            return meta.category === 'other' && !cache[name]
          })
        if (unknowns.length > 0) {
          classifyIngredients(unknowns)
            .then((result) => {
              const updated = mergeCache(result as unknown as Record<string, AIMeta>)
              setAiCategories({ ...updated })
            })
            .catch(() => {})
        }
      })
      .catch(console.error)
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('이 재료를 삭제하시겠습니까?')) return
    // 낙관적 즉시 제거
    setFridge((prev) => prev ? { ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) } : prev)
    await deleteIngredient(id).catch(() => load()) // 실패 시 서버 상태로 복원
  }

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id)
    setEditQty(ing.quantity != null ? String(ing.quantity) : '')
    setEditUnit(ing.unit ?? '')
    setEditExpiry(ing.expiry_date ?? '')
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: string) => {
    const data = {
      quantity: editQty !== '' ? (Number(editQty) || null) : null,
      unit: editUnit.trim() !== '' ? editUnit.trim() : null,
      expiry_date: editExpiry || null,
    }
    // 낙관적 즉시 반영
    setFridge((prev) => prev ? {
      ...prev,
      ingredients: prev.ingredients.map((i) => i.id === id ? { ...i, ...data } as Ingredient : i),
    } : prev)
    setEditingId(null)
    await updateIngredient(id, data).catch(() => load()) // 실패 시 서버 상태로 복원
  }

  const getDaysUntilExpiry = (expiry: string | null): number | null => {
    if (!expiry) return null
    return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
  }

  const grouped = useMemo(() => {
    if (!fridge) return new Map<CategoryId, { ing: Ingredient; meta: IngredientMeta }[]>()
    const map = new Map<CategoryId, { ing: Ingredient; meta: IngredientMeta }[]>()
    for (const cat of CATEGORIES) map.set(cat.id, [])
    for (const ing of fridge.ingredients) {
      const base = getIngredientMeta(ing.name)
      const aiMeta = base.category === 'other' ? aiCategories[ing.name] : undefined
      const meta: IngredientMeta = aiMeta
        ? { ...base, category: aiMeta.category, storage: aiMeta.storage ?? CATEGORY_DEFAULT_STORAGE[aiMeta.category] }
        : base
      map.get(meta.category)!.push({ ing, meta })
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.ing.name.localeCompare(b.ing.name, 'ko'))
    }
    return map
  }, [fridge, aiCategories])

  const total = fridge?.ingredients.length ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex items-center"
        style={{ background: '#0D1F1A', position: 'relative' }}
      >
        <Link
          to="/dashboard"
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{ color: '#9FE1CB', border: '1px solid rgba(93,202,165,0.25)', zIndex: 1 }}
        >
          ← 대시보드
        </Link>
        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 16,
          color: '#F1EFE8', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>냉장고 관리</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ml-auto"
          style={{ background: '#1D9E75', color: '#fff', zIndex: 1 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#17845F')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1D9E75')}
        >
          + 추가
        </button>
      </div>

      {/* ── 수동 재료 추가 폼 ── */}
      {showAddForm && (
        <div className="px-5 py-4" style={{ background: '#fff', borderBottom: '1px solid #D3D1C7' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>재료 직접 추가</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="재료 이름 (예: 당근)"
              style={{ ...inputStyle, flex: 2 }}
              autoFocus
            />
            <input
              type="number"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="수량"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              value={addUnit}
              onChange={(e) => setAddUnit(e.target.value)}
              placeholder="단위"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div className="mb-3">
            <label className="text-xs mb-0.5 block" style={{ color: '#5F5E5A' }}>유효기한 (선택)</label>
            <input type="date" value={addExpiry} onChange={(e) => setAddExpiry(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !addName.trim()}
              className="flex-1 text-sm py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{ background: '#1D9E75', color: '#fff' }}
            >
              {adding ? '추가 중...' : '추가'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddName(''); setAddQty(''); setAddUnit(''); setAddExpiry('') }}
              className="flex-1 text-sm py-2 rounded-lg font-medium transition-all"
              style={{ background: '#F1EFE8', color: '#5F5E5A' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center py-10 text-sm" style={{ color: '#888780' }}>로딩 중...</p>
        ) : total === 0 ? (
          <div className="text-center py-16" style={{ color: '#888780' }}>
            <p className="text-4xl mb-3">🥬</p>
            <p className="font-semibold text-sm" style={{ color: '#5F5E5A' }}>냉장고가 비어있습니다</p>
            <p className="text-xs mt-1">재료를 추가하거나 AI 사진 분석을 시작하세요</p>
            <Link
              to="/analyze"
              className="inline-block mt-4 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ background: '#1D9E75', color: '#fff' }}
            >
              📸 AI 사진 분석
            </Link>
          </div>
        ) : (
          <>
            {/* 범례 */}
            <div
              className="rounded-xl px-4 py-3 mb-4"
              style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}
            >

              <p className="text-xs font-semibold mb-2" style={{ color: '#888780' }}>기호 안내</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '🌡️실온', bg: 'rgba(250,199,117,0.15)', color: '#9A7A2A' },
                  { label: '❄️냉장', bg: 'rgba(93,202,165,0.12)', color: '#1D9E75' },
                  { label: '🧊냉동', bg: 'rgba(100,130,220,0.12)', color: '#4A6BC9' },
                  { label: '⏰단기', bg: 'rgba(250,199,117,0.2)', color: '#9A7A2A' },
                  { label: '⚡부패주의', bg: 'rgba(220,80,80,0.1)', color: '#C0392B' },
                  { label: '⚠️유효기한임박', bg: 'rgba(220,80,80,0.1)', color: '#C0392B' },
                ].map(({ label, bg, color }) => (
                  <span key={label} className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* 카테고리별 카드 */}
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const items = grouped.get(cat.id)!
                if (items.length === 0) return null
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}
                  >
                    {/* 카테고리 헤더 */}
                    <div
                      className="px-4 py-2.5 flex items-center justify-between"
                      style={{ background: '#F5F3EE', borderBottom: '1px solid #E8E4DC' }}
                    >
                      <span style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>
                        {cat.emoji} {cat.label}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: '#888780' }}>{items.length}개</span>
                    </div>

                    {/* 재료 목록 */}
                    <div>
                      {items.map(({ ing, meta }, idx: number) => {
                        const daysLeft = getDaysUntilExpiry(ing.expiry_date)
                        const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
                        const expired = daysLeft !== null && daysLeft < 0

                        return (
                          <div
                            key={ing.id}
                            style={idx > 0 ? { borderTop: '1px solid #F1EFE8' } : undefined}
                          >
                            {editingId === ing.id ? (
                              /* ── 편집 모드 ── */
                              <div className="p-4">
                                <p className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>{ing.name}</p>
                                <div className="flex gap-2 mb-2">
                                  <div className="flex-1">
                                    <label className="text-xs mb-0.5 block" style={{ color: '#888780' }}>수량</label>
                                    <input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} placeholder="예: 2" style={inputStyle} />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs mb-0.5 block" style={{ color: '#888780' }}>단위</label>
                                    <input type="text" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="개, g, ml" style={inputStyle} />
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <label className="text-xs mb-0.5 block" style={{ color: '#888780' }}>유효기한</label>
                                  <input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} style={inputStyle} />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(ing.id)}
                                    className="flex-1 text-sm py-2 rounded-lg font-semibold transition-all"
                                    style={{ background: '#1D9E75', color: '#fff' }}
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="flex-1 text-sm py-2 rounded-lg font-medium transition-all"
                                    style={{ background: '#F1EFE8', color: '#5F5E5A' }}
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── 보기 모드 ── */
                              <div
                                className="px-4 py-3 flex justify-between items-start"
                                style={expired ? { background: 'rgba(220,80,80,0.05)' } : expiringSoon ? { background: 'rgba(250,199,117,0.08)' } : undefined}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{ing.name}</span>
                                    {ing.quantity != null ? (
                                      <span
                                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                        style={{ background: '#E1F5EE', color: '#1D9E75' }}
                                      >
                                        {ing.quantity}{ing.unit ?? ''}
                                      </span>
                                    ) : ing.unit ? (
                                      <span
                                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                        style={{ background: '#E1F5EE', color: '#1D9E75' }}
                                      >
                                        {ing.unit}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    <StorageBadge type={meta.storage} />
                                    {meta.shortShelf && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(250,199,117,0.2)', color: '#9A7A2A' }}>⏰단기</span>
                                    )}
                                    {meta.spoilage && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(220,80,80,0.1)', color: '#C0392B' }}>⚡부패주의</span>
                                    )}
                                    {ing.source === 'ai_analysis' && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#1D9E75' }}>AI</span>
                                    )}
                                    {expired && (
                                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(220,80,80,0.1)', color: '#C0392B' }}>⚠️유효기한 만료</span>
                                    )}
                                    {expiringSoon && !expired && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(250,199,117,0.2)', color: '#9A7A2A' }}>⚠️{daysLeft}일 남음</span>
                                    )}
                                  </div>

                                  {ing.expiry_date && (
                                    <p className="text-xs mt-1" style={{ color: '#888780' }}>
                                      유효기한: {ing.expiry_date}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 ml-3 flex-shrink-0 pt-0.5">
                                  <button
                                    onClick={() => startEdit(ing)}
                                    className="text-xs font-medium transition-all"
                                    style={{ color: '#1D9E75' }}
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(ing.id)}
                                    className="text-xs font-medium transition-all"
                                    style={{ color: '#C0392B' }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-center mt-4" style={{ color: '#888780' }}>
              총 {total}개 재료 등록됨
            </p>
          </>
        )}
      </div>
    </div>
  )
}

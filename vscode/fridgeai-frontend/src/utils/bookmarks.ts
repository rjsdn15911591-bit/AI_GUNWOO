const KEY = 'fridge_ai_bookmarks'

export interface BookmarkedRecipe {
  id: string
  title: string
  category?: string
  serving?: string
  ready_in_minutes?: number | null
  image?: string | null
  savedAt: number
}

export function getBookmarks(): BookmarkedRecipe[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((r) => r.id === id)
}

export function addBookmark(recipe: Omit<BookmarkedRecipe, 'savedAt'>): void {
  const list = getBookmarks().filter((r) => r.id !== recipe.id)
  list.unshift({ ...recipe, savedAt: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function removeBookmark(id: string): void {
  const list = getBookmarks().filter((r) => r.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function toggleBookmark(recipe: Omit<BookmarkedRecipe, 'savedAt'>): boolean {
  if (isBookmarked(recipe.id)) {
    removeBookmark(recipe.id)
    return false
  } else {
    addBookmark(recipe)
    return true
  }
}

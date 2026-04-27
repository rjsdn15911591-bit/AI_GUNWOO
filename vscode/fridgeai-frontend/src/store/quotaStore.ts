import { create } from 'zustand'
import type { QuotaStatus } from '../types'

interface QuotaState {
  quota: QuotaStatus | null
  setQuota: (quota: QuotaStatus | null) => void
}

export const useQuotaStore = create<QuotaState>((set) => ({
  quota: null,
  setQuota: (quota) => set({ quota }),
}))

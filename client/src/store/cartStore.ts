import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartLine = {
  productId: string
  quantity: number
}

type CartState = {
  lines: CartLine[]
  /** Normaler Coupon-Code (Großbuchstaben empfohlen) */
  couponCode: string | null
  /** Produkt-IDs für Bundle-Coupons (Auswahl im Konfigurator) */
  bundleCouponProductIds: string[] | null
  sidebarOpen: boolean
  lastTenantId: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setLines: (lines: CartLine[]) => void
  setLastTenantId: (id: string | null) => void
  setCouponCode: (code: string | null) => void
  setBundleCouponProductIds: (ids: string[] | null) => void
  add: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      bundleCouponProductIds: null,
      sidebarOpen: false,
      lastTenantId: null,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLines: (lines) => set({ lines }),
      setLastTenantId: (id) => set({ lastTenantId: id }),
      setCouponCode: (code) => set({ couponCode: code?.trim() || null }),
      setBundleCouponProductIds: (ids) => set({ bundleCouponProductIds: ids }),
      add: (productId, quantity = 1) => {
        const lines = [...get().lines]
        const i = lines.findIndex((l) => l.productId === productId)
        if (i >= 0) {
          lines[i] = { productId, quantity: lines[i].quantity + quantity }
        } else {
          lines.push({ productId, quantity })
        }
        set({ lines })
      },
      setQuantity: (productId, quantity) => {
        if (quantity < 1) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) })
          return
        }
        const lines = get().lines.map((l) =>
          l.productId === productId ? { ...l, quantity: Math.min(99, quantity) } : l,
        )
        set({ lines })
      },
      remove: (productId) => {
        set({ lines: get().lines.filter((l) => l.productId !== productId) })
      },
      clear: () => set({ lines: [], couponCode: null, bundleCouponProductIds: null }),
    }),
    {
      name: 'lekkr-cart-v2',
      partialize: (s) => ({
        lines: s.lines,
        lastTenantId: s.lastTenantId,
        couponCode: s.couponCode,
        bundleCouponProductIds: s.bundleCouponProductIds,
      }),
    },
  ),
)

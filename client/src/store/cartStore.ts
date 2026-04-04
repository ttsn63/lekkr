import { create } from 'zustand'

export type CartLine = {
  productId: string
  quantity: number
}

type CartState = {
  lines: CartLine[]
  add: (productId: string, quantity?: number) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  add: (productId, quantity = 1) => {
    const lines = [...get().lines]
    const i = lines.findIndex((l) => l.productId === productId)
    if (i >= 0) {
      lines[i] = {
        productId,
        quantity: lines[i].quantity + quantity,
      }
    } else {
      lines.push({ productId, quantity })
    }
    set({ lines })
  },
  remove: (productId) => {
    set({ lines: get().lines.filter((l) => l.productId !== productId) })
  },
  clear: () => set({ lines: [] }),
}))

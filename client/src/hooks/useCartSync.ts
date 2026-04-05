import { useEffect, useRef } from 'react'
import { fetchRemoteCart, replaceRemoteCart } from '@/lib/queries/cartRemote'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { useCartStore } from '@/store/cartStore'

export function useCartSync() {
  const tenant = useTenant()
  const { user, loading } = useAuthSession()
  const lines = useCartStore((s) => s.lines)
  const setLines = useCartStore((s) => s.setLines)
  const clear = useCartStore((s) => s.clear)
  const lastTenantId = useCartStore((s) => s.lastTenantId)
  const setLastTenantId = useCartStore((s) => s.setLastTenantId)

  useEffect(() => {
    if (lastTenantId !== null && lastTenantId !== tenant.id) {
      clear()
    }
    setLastTenantId(tenant.id)
  }, [tenant.id, lastTenantId, clear, setLastTenantId])

  const mergedKey = useRef<string>('')

  useEffect(() => {
    mergedKey.current = ''
  }, [tenant.id])

  useEffect(() => {
    if (loading || !user) {
      mergedKey.current = ''
      return
    }
    const key = `${user.id}:${tenant.id}`
    if (mergedKey.current === key) return
    mergedKey.current = key

    let cancelled = false
    void (async () => {
      try {
        const remote = await fetchRemoteCart(tenant.id, user.id)
        if (cancelled) return
        const map = new Map<string, number>()
        for (const r of remote) map.set(r.productId, r.quantity)
        const local = useCartStore.getState().lines
        for (const l of local) {
          map.set(l.productId, Math.max(map.get(l.productId) ?? 0, l.quantity))
        }
        const merged = [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }))
        setLines(merged)
        await replaceRemoteCart(tenant.id, user.id, merged)
      } catch {
        mergedKey.current = ''
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, user, tenant.id, setLines])

  useEffect(() => {
    if (loading || !user) return
    const t = window.setTimeout(() => {
      void replaceRemoteCart(tenant.id, user.id, lines).catch(() => {})
    }, 450)
    return () => window.clearTimeout(t)
  }, [lines, loading, user, tenant.id])
}

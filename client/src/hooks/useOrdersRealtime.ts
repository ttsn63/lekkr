import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { playOrderBeep } from '@/lib/sound/playOrderBeep'

/**
 * Invalidiert Küchen-/Fahrer-Order-Queries bei Realtime-Änderungen.
 * Bei neuer Bestellung (INSERT) optional Ton abspielen.
 */
export function useOrdersRealtime(tenantId: string, playSoundOnInsert = false) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel(`realtime-orders-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          void qc.invalidateQueries({ queryKey: ['kitchen-orders', tenantId] })
          void qc.invalidateQueries({ queryKey: ['driver-orders', tenantId] })

          if (playSoundOnInsert && payload.eventType === 'INSERT') {
            playOrderBeep()
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId, qc, playSoundOnInsert])
}

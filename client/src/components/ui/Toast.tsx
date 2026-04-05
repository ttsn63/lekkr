import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastVariant = 'default' | 'success' | 'warning' | 'error'

export type ToastPayload = {
  title?: string
  message: string
  variant?: ToastVariant
  /** ms, Standard 4200 */
  duration?: number
}

type ToastItem = ToastPayload & { id: string }

type ToastContextValue = {
  toast: (payload: ToastPayload) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast muss innerhalb von ToastProvider verwendet werden.')
  }
  return ctx
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-bg-secondary text-text-primary',
  success:
    'border-[color:var(--color-success)] bg-[color:var(--color-mint)]/25 text-navy',
  warning: 'border-[color:var(--color-warning)] bg-brand-cream-dark text-text-primary',
  error: 'border-[color:var(--color-error)] bg-brand-red/10 text-text-primary',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (payload: ToastPayload) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `toast-${Date.now()}`
      const duration = payload.duration ?? 4200
      setItems((list) => [...list, { ...payload, id }])
      window.setTimeout(() => {
        dismiss(id)
      }, duration)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-ds-lg right-ds-lg z-toast flex max-w-sm flex-col gap-ds-sm p-ds-xs"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full rounded-sm border px-ds-md py-ds-sm shadow-lg ${variantStyles[t.variant ?? 'default']}`}
          >
            {t.title ? (
              <p className="font-heading text-ds-sm font-semibold text-navy">{t.title}</p>
            ) : null}
            <p className={`text-ds-sm ${t.title ? 'mt-ds-2xs' : ''}`}>{t.message}</p>
            <button
              type="button"
              className="mt-ds-xs text-ds-xs font-medium text-text-secondary underline hover:text-navy"
              onClick={() => dismiss(t.id)}
            >
              Schließen
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

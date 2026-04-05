import { createPortal } from 'react-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Primäraktion (optional, z. B. Speichern) */
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean }
  /** Sekundär = Abbrechen */
  showCloseButton?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  primaryAction,
  showCloseButton = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-ds-md"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[1px]"
        aria-label="Dialog schließen"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-desc' : undefined}
        tabIndex={-1}
        className="relative z-[1] w-full max-w-lg rounded-md border border-brand-cream-darker bg-bg-secondary shadow-xl outline-none"
      >
        <div className="border-b border-brand-cream-dark px-ds-lg py-ds-md">
          <div className="flex items-start justify-between gap-ds-md">
            <div>
              <h2 id="modal-title" className="font-heading text-ds-2xl font-semibold text-navy">
                {title}
              </h2>
              {description ? (
                <p id="modal-desc" className="mt-ds-xs text-ds-sm text-text-secondary">
                  {description}
                </p>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Schließen">
                ✕
              </Button>
            ) : null}
          </div>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-ds-lg py-ds-md">{children}</div>
        {(footer != null || primaryAction) ? (
          <div className="flex flex-wrap items-center justify-end gap-ds-sm border-t border-brand-cream-dark px-ds-lg py-ds-md">
            {footer}
            {primaryAction ? (
              <Button
                type="button"
                variant="primary"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

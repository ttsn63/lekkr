import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type InputProps = {
  label?: ReactNode
  error?: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id: idProp, className = '', disabled, ...rest },
  ref,
) {
  const uid = useId()
  const id = idProp ?? `input-${uid}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(error)

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-ds-xs block text-ds-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? errorId : hint ? hintId : undefined
        }
        className={[
          'w-full rounded-sm border bg-bg-secondary px-ds-md py-ds-sm text-ds-base text-text-primary shadow-inner',
          'border-border outline-none transition-[border-color,box-shadow] duration-200',
          'placeholder:text-text-secondary/70',
          'focus:border-border-focus focus:ring-2 focus:ring-[color:var(--color-focus-ring)] focus:ring-offset-1 focus:ring-offset-[color:var(--color-focus-ring-offset)]',
          hasError
            ? 'border-[color:var(--color-error)] focus:border-[color:var(--color-error)] focus:ring-[color:var(--color-error)]'
            : '',
          disabled ? 'cursor-not-allowed opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {hasError ? (
        <p id={errorId} className="mt-ds-xs text-ds-sm text-[color:var(--color-error)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-ds-xs text-ds-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

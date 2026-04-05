import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** 5 Varianten gemäß Design System */
const variantClasses = {
  primary:
    'bg-[var(--color-primary)] text-text-light shadow-sm hover:bg-brand-red-light active:bg-brand-red-dark',
  secondary:
    'bg-[var(--color-secondary)] text-text-light shadow-sm hover:bg-navy-light active:bg-navy-dark',
  ghost:
    'bg-transparent text-navy hover:bg-brand-cream-dark active:bg-brand-cream-darker',
  danger:
    'bg-[var(--color-error)] text-text-light shadow-sm hover:bg-brand-red-light focus-visible:ring-brand-red',
  success:
    'bg-[var(--color-success)] text-text-light shadow-sm hover:brightness-105 active:brightness-95',
} as const

/** 4 Größen: SM, MD, LG, FULL */
const sizeClasses = {
  sm: 'h-8 min-h-[32px] px-ds-sm text-ds-sm',
  md: 'h-11 min-h-[44px] px-ds-md text-ds-base',
  lg: 'h-14 min-h-[56px] px-ds-xl text-ds-lg',
  full: 'h-11 min-h-[44px] w-full px-ds-md text-ds-base',
} as const

export type ButtonVariant = keyof typeof variantClasses
export type ButtonSize = keyof typeof sizeClasses

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-ds-sm rounded-sm font-medium transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-focus-ring-offset)] disabled:pointer-events-none disabled:opacity-50'

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

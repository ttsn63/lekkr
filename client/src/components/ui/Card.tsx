import type { HTMLAttributes } from 'react'

const cardBase =
  'rounded-md border border-brand-cream-darker bg-bg-secondary text-text-primary shadow-md'

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${cardBase} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-b border-brand-cream-dark px-ds-lg py-ds-md ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`font-heading text-ds-xl font-semibold text-navy ${className}`} {...rest}>
      {children}
    </h3>
  )
}

export function CardDescription({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`mt-ds-xs text-ds-sm text-text-secondary ${className}`} {...rest}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-ds-lg py-ds-md ${className}`} {...rest}>
      {children}
    </div>
  )
}

export type CardFooterProps = {
  /** rechtsbündige Aktionen (Buttons) */
  align?: 'start' | 'end' | 'between'
} & HTMLAttributes<HTMLDivElement>

export function CardFooter({
  className = '',
  align = 'end',
  children,
  ...rest
}: CardFooterProps) {
  const alignClass =
    align === 'start'
      ? 'justify-start'
      : align === 'between'
        ? 'justify-between'
        : 'justify-end'
  return (
    <div
      className={`flex flex-wrap gap-ds-sm border-t border-brand-cream-dark px-ds-lg py-ds-md ${alignClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

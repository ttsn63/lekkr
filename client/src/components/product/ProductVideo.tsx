type ProductVideoProps = {
  url: string | null | undefined
  title: string
}

export function ProductVideo({ url, title }: ProductVideoProps) {
  if (!url?.trim()) return null

  return (
    <div className="space-y-ds-sm">
      <video
        className="w-full max-h-[420px] rounded-md border border-brand-cream-darker bg-black shadow-md"
        controls
        playsInline
        preload="metadata"
        title={title}
      >
        <source src={url.trim()} />
      </video>
    </div>
  )
}

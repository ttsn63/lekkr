import { useState } from 'react'

type ProductGalleryProps = {
  alt: string
  mainUrl: string | null
  extraUrls: (string | null | undefined)[]
}

export function ProductGallery({ alt, mainUrl, extraUrls }: ProductGalleryProps) {
  const urls = [mainUrl, ...extraUrls].filter((u): u is string => Boolean(u && u.length > 0))
  const [active, setActive] = useState(0)

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-brand-cream-dark font-heading text-ds-3xl text-brand-red/30">
        —
      </div>
    )
  }

  return (
    <div className="space-y-ds-md">
      <div className="overflow-hidden rounded-md border border-brand-cream-darker bg-brand-cream-dark shadow-md">
        <img
          src={urls[active]}
          alt={alt}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      {urls.length > 1 ? (
        <ul className="flex gap-ds-sm overflow-x-auto pb-ds-xs">
          {urls.map((url, i) => (
            <li key={url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition ${
                  active === i ? 'border-navy' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

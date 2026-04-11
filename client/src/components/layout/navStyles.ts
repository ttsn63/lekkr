const baseNavLinkClass = 'rounded-md px-3 py-2 text-sm font-medium transition-colors'

/** Klassen für Desktop-Navigation inkl. aktivem Zustand */
export const getNavLinkClass = (active: boolean) =>
  `${baseNavLinkClass} ${
    active ? 'bg-navy text-text-light shadow-sm' : 'text-navy hover:bg-brand-cream'
  }`

/** Klassen für Mobile-Menülinks mit voller Breite */
export const getMobileNavLinkClass = (active: boolean) =>
  `${baseNavLinkClass} block w-full ${
    active ? 'bg-navy text-text-light shadow-sm' : 'text-navy hover:bg-brand-cream'
  }`

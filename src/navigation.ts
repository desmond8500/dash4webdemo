/** Écrans de la maquette ; un écran n'apparaît que si le compte a une des permissions (l'API vérifie de toute façon). */
export interface NavItem {
  name: string
  label: string
  icon: string
  accent: string
  permissions: string[]
}

export const NAV: NavItem[] = [
  { name: 'hq', label: 'QG', icon: '🛰️', accent: 'var(--cyan)', permissions: [] },
  { name: 'missions', label: 'Missions', icon: '🎯', accent: 'var(--gold)', permissions: ['tasks.view', 'tasks.view.own'] },
  { name: 'sites', label: 'Chantiers', icon: '🏗️', accent: 'var(--orange)', permissions: ['projects.view', 'projects.view.own'] },
  { name: 'inventory', label: 'Inventaire', icon: '🎒', accent: 'var(--violet)', permissions: ['stock.view'] },
  { name: 'armory', label: 'Armurerie', icon: '🛠️', accent: 'var(--green)', permissions: ['tools.view', 'tools.view.own'] },
  { name: 'garage', label: 'Garage', icon: '🚚', accent: 'var(--pink)', permissions: ['vehicles.view', 'vehicles.view.own'] },
]

export function visibleNav(canAny: (permissions: string[]) => boolean): NavItem[] {
  return NAV.filter((n) => !n.permissions.length || canAny(n.permissions))
}

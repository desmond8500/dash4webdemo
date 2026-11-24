/**
 * Menu de la maquette : les MÊMES entrées et les MÊMES permissions que dash4-web (`src/menu.ts`), pour
 * que chaque compte y ait les mêmes accès. Les écrans déjà refaits « façon jeu » ont leur page ici
 * (`ready`) ; les autres montrent une page d'attente avec un lien vers le même écran de dash4-web.
 * Un élément n'apparaît que si le compte a une des permissions (l'API vérifie de toute façon).
 */
export interface NavItem {
  /** Nom de la route (écran refait) ou clé de la page d'attente. */
  name: string
  label: string
  /** Nom « jeu » affiché en titre de l'écran. */
  nickname?: string
  icon: string
  accent: string
  permissions: string[]
  /** Permissions toutes nécessaires en plus (ex. voir les prix). */
  allOf?: string[]
  /** Adresse du même écran dans dash4-web. */
  webPath: string
  /** Écran refait dans la maquette. */
  ready: boolean
  /** Dans la barre d'onglets du téléphone (les autres sont dans « Menu »). */
  tab?: boolean
}

export const NAV: NavItem[] = [
  { name: 'hq', label: 'Tableau de bord', nickname: 'QG', icon: '🛰️', accent: 'var(--primary)', permissions: ['dashboard.view', 'dashboard.view.own'], webPath: '/', ready: true, tab: true },
  { name: 'clients', label: 'Clients', icon: '🏢', accent: 'var(--info)', permissions: ['clients.view', 'clients.view.own'], webPath: '/clients', ready: false },
  { name: 'client-requests', label: 'Demandes', icon: '📨', accent: 'var(--info)', permissions: ['client_requests.view', 'client_requests.view.own'], webPath: '/demandes', ready: false },
  { name: 'sites', label: 'Projets', nickname: 'Chantiers', icon: '🏗️', accent: 'var(--orange)', permissions: ['projects.view', 'projects.view.own'], webPath: '/projets', ready: true, tab: true },
  { name: 'messages', label: 'Messages', icon: '💬', accent: 'var(--info)', permissions: [], webPath: '/messages', ready: false },
  { name: 'missions', label: 'Tâches', nickname: 'Missions', icon: '🎯', accent: 'var(--amber)', permissions: ['tasks.view', 'tasks.view.own'], webPath: '/taches', ready: true, tab: true },
  { name: 'planning', label: 'Planning', icon: '🗓️', accent: 'var(--amber)', permissions: ['tasks.view', 'tasks.view.own'], webPath: '/planning', ready: false },
  { name: 'journals', label: 'Journaux', icon: '📖', accent: 'var(--amber)', permissions: ['journals.view', 'journals.view.own'], webPath: '/journaux', ready: false },
  { name: 'tech-space', label: 'Espace technicien', icon: '🔑', accent: 'var(--amber)', permissions: ['tech_shares.view', 'tech_shares.view.own', 'tech_access_requests.view', 'tech_access_requests.view.own'], webPath: '/espace-technicien', ready: false },
  { name: 'quotes', label: 'Devis', icon: '📜', accent: 'var(--help)', permissions: ['quotes.view', 'quotes.view.own'], webPath: '/devis', ready: false },
  { name: 'invoices', label: 'Factures', icon: '🧾', accent: 'var(--help)', permissions: ['invoices.view'], webPath: '/factures', ready: false },
  { name: 'schedule', label: 'Échéancier', icon: '⏳', accent: 'var(--help)', permissions: ['invoices.view'], webPath: '/echeancier', ready: false },
  { name: 'contracts', label: 'Contrats', icon: '🤝', accent: 'var(--help)', permissions: ['contracts.view'], webPath: '/contrats', ready: false },
  { name: 'inventory', label: 'Stock', nickname: 'Inventaire', icon: '🎒', accent: 'var(--help)', permissions: ['stock.view'], webPath: '/stock', ready: true, tab: true },
  { name: 'armory', label: 'Outillage', nickname: 'Armurerie', icon: '🛠️', accent: 'var(--primary)', permissions: ['tools.view', 'tools.view.own'], webPath: '/stock/outillage', ready: true },
  { name: 'garage', label: 'Parc automobile', nickname: 'Garage', icon: '🚚', accent: 'var(--pink)', permissions: ['vehicles.view', 'vehicles.view.own'], webPath: '/parc', ready: true },
  { name: 'purchases', label: 'Achats', icon: '🛒', accent: 'var(--orange)', permissions: ['purchases.view', 'purchases.view.own'], webPath: '/achats', ready: false },
  { name: 'expenses', label: 'Dépenses', icon: '💸', accent: 'var(--orange)', permissions: ['accounting.view', 'accounting.view.own'], webPath: '/depenses', ready: false },
  { name: 'exports', label: 'Exports', icon: '📤', accent: 'var(--orange)', permissions: ['exports.run'], allOf: ['prices.view'], webPath: '/exports', ready: false },
  { name: 'accounting', label: 'Comptabilité', icon: '📊', accent: 'var(--orange)', permissions: ['accounting.view'], webPath: '/comptabilite', ready: false },
  { name: 'contacts', label: 'Contacts', icon: '📇', accent: 'var(--info)', permissions: ['clients.view', 'clients.view.own'], webPath: '/contacts', ready: false },
  { name: 'users', label: 'Utilisateurs', icon: '👥', accent: 'var(--muted)', permissions: ['users.view'], webPath: '/utilisateurs', ready: false },
  { name: 'company', label: 'Entreprise', icon: '⚙️', accent: 'var(--muted)', permissions: ['company.view', 'bank.view', 'signature.manage', 'settings.view'], webPath: '/entreprise', ready: false },
  { name: 'backups', label: 'Sauvegardes', icon: '💾', accent: 'var(--muted)', permissions: ['backups.manage'], webPath: '/sauvegardes', ready: false },
]

export function visibleNav(canAny: (permissions: string[]) => boolean): NavItem[] {
  return NAV.filter((n) => (n.permissions.length === 0 || canAny(n.permissions)) && (n.allOf ?? []).every((p) => canAny([p])))
}

/** Lien vers un écran : sa page dans la maquette, sinon la page d'attente. */
export function navTarget(item: NavItem): { name: string; params?: Record<string, string> } {
  return item.ready ? { name: item.name } : { name: 'module', params: { screen: item.name } }
}

/** Adresse de dash4-web (pour les écrans pas encore refaits). */
export const DASH4_WEB_URL = (import.meta.env.VITE_DASH4_WEB_URL as string | undefined) || 'https://dash4web.netlify.app'

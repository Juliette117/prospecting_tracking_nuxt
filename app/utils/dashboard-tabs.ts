export const dashboardTabs = [
  {
    label: 'Tableau de Bord',
    icon: 'i-heroicons-squares-2x2',
    to: '/dashboard',
    activePaths: ['/dashboard'],
  },
  {
    label: 'Candidatures',
    icon: 'i-heroicons-briefcase',
    to: '/recherche-emploi',
    activePaths: ['/recherche-emploi'],
  },
  {
    label: 'Missions Freelance',
    icon: 'i-heroicons-computer-desktop',
    to: '/missions-freelance',
    activePaths: ['/missions-freelance'],
  },
  {
    label: 'Entretiens',
    icon: 'i-heroicons-calendar-days',
    to: '/entretiens',
    activePaths: ['/entretiens'],
  },
  {
    label: 'Graphe de Relations',
    icon: 'i-heroicons-share',
    to: '/graphe-relations',
    activePaths: ['/graphe-relations'],
  },
  {
    label: 'Premium',
    icon: 'i-heroicons-sparkles',
    to: '/premium',
    activePaths: ['/premium'],
  },
] as const

export type NavItem = {
  label: string;
  to: string;
};

/** Primary app navigation (UI-D4). No Builder route — deck editor opens from Decks. */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Search', to: '/search' },
  { label: 'Formats', to: '/formats' },
  { label: 'Decks', to: '/decks' },
  { label: 'Collection', to: '/collection' },
  { label: 'Lists', to: '/lists' },
  { label: 'About', to: '/about' },
  { label: 'Account', to: '/account' },
];

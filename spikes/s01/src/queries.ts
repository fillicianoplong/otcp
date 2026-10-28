import type { FacetSelection } from './types.ts';

export type KeystrokeSeries = {
  label: string;
  text: string;
  selected: FacetSelection;
};

export const KEYSTROKE_SERIES: readonly KeystrokeSeries[] = [
  { label: 'dark magician', text: 'dark magician', selected: {} },
  { label: 'ash blossom', text: 'ash blossom', selected: {} },
  { label: 'blue-eyes', text: 'blue-eyes', selected: {} },
  { label: 'accesscode talker', text: 'accesscode talker', selected: {} },
  { label: 'nibiru', text: 'nibiru', selected: {} },
  { label: 'effect veiler', text: 'effect veiler', selected: {} },
  { label: 'called by the grave', text: 'called by the grave', selected: {} },
  { label: 'mirror force', text: 'mirror force', selected: {} },
  { label: 'pot of', text: 'pot of', selected: {} },
  { label: 'no match', text: 'zzzqqq', selected: {} },
  { label: 'dark magician + DARK', text: 'dark magician', selected: { attribute: ['DARK'] } },
  { label: 'passcode Blue-Eyes', text: '89631139', selected: {} },
  { label: 'passcode Dark Magician', text: '46986420', selected: {} },
  { label: 'passcode Ash Blossom', text: '14558127', selected: {} },
  { label: 'passcode Accesscode', text: '86066372', selected: {} },
  { label: 'passcode Nibiru', text: '27204311', selected: {} },
];

export type FacetStep = {
  label: string;
  query: string;
  selected: FacetSelection;
};

export const FACET_STEPS: readonly FacetStep[] = [
  { label: 'type Effect Monster', query: '', selected: { type: ['Effect Monster'] } },
  {
    label: 'type + DARK',
    query: '',
    selected: { type: ['Effect Monster'], attribute: ['DARK'] },
  },
  {
    label: 'type + DARK + Spellcaster',
    query: '',
    selected: { type: ['Effect Monster'], attribute: ['DARK'], race: ['Spellcaster'] },
  },
  {
    label: 'level 4',
    query: '',
    selected: { type: ['Effect Monster'], attribute: ['DARK'], level: ['4'] },
  },
  {
    label: 'level 4-8',
    query: '',
    selected: { type: ['Effect Monster'], level: ['4', '5', '6', '7', '8'] },
  },
  { label: 'atk 2001-3000', query: '', selected: { atk: ['2001-3000'] } },
  {
    label: 'atk + def 2001-3000',
    query: '',
    selected: { atk: ['2001-3000'], def: ['2001-3000'] },
  },
  { label: 'archetype Dark Magician', query: '', selected: { archetype: ['Dark Magician'] } },
  { label: 'banlist Forbidden', query: '', selected: { banlist: ['Forbidden'] } },
  {
    label: 'banlist Limited or Semi-Limited',
    query: '',
    selected: { banlist: ['Limited', 'Semi-Limited'] },
  },
  {
    label: 'Spell + Quick-Play',
    query: '',
    selected: { type: ['Spell Card'], race: ['Quick-Play'] },
  },
  { label: 'name dragon + LIGHT', query: 'dragon', selected: { attribute: ['LIGHT'] } },
  {
    label: 'name dark + types + archetype',
    query: 'dark',
    selected: { type: ['Effect Monster', 'Normal Monster'], archetype: ['Dark Magician'] },
  },
  { label: 'clear all', query: '', selected: {} },
];

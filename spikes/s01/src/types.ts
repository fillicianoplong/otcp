export const FACET_GROUPS = [
  'type',
  'attribute',
  'race',
  'level',
  'atk',
  'def',
  'archetype',
  'banlist',
] as const;

export type FacetGroupId = (typeof FACET_GROUPS)[number];

/** Groups that fit on a phone Filters sheet before the user scrolls. */
export const ON_SCREEN_GROUPS = [
  'type',
  'attribute',
  'race',
] as const satisfies readonly FacetGroupId[];

export type FacetSelection = Partial<Record<FacetGroupId, readonly string[]>>;

/** Fields kept from the card feed to build the in-memory index. */
export type TrimmedCard = {
  id: number;
  name: string;
  desc: string;
  type: string;
  race: string;
  attribute?: string;
  level?: number;
  linkval?: number;
  atk?: number;
  def?: number;
  archetype?: string;
  /** TCG banlist status from banlist_info.ban_tcg. Absent means Unlimited. */
  banTcg?: string;
};

export type ApiCard = {
  id: number;
  name: string;
  desc?: string;
  type?: string;
  race?: string;
  attribute?: string;
  level?: number;
  linkval?: number;
  atk?: number;
  def?: number;
  archetype?: string;
  banlist_info?: {
    ban_tcg?: string;
  };
};

export const PUBLISHED_FIELDS = [
  'id',
  'name',
  'desc',
  'type',
  'race',
  'attribute',
  'level',
  'linkval',
  'atk',
  'def',
  'archetype',
  'banTcg',
] as const;

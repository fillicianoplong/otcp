export type YgoBanlistInfo = {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
  ban_speed_duel?: string;
};

export type YgoMiscInfo = {
  formats?: string[];
};

export type YgoCardSet = {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code?: string;
  set_price?: string;
};

export type YgoCardPrices = {
  cardmarket_price?: string;
  tcgplayer_price?: string;
  ebay_price?: string;
  amazon_price?: string;
  coolstuffinc_price?: string;
};

export type YgoCardImage = {
  id: number;
  image_url?: string;
  image_url_small?: string;
  image_url_cropped?: string;
};

export type YgoApiCard = {
  id: number;
  name: string;
  desc?: string;
  pend_desc?: string;
  monster_desc?: string;
  type?: string;
  race?: string;
  attribute?: string;
  level?: number | null;
  rank?: number | null;
  atk?: number | null;
  def?: number | null;
  archetype?: string;
  linkval?: number;
  linkmarkers?: string[];
  scale?: number;
  genesys_points?: number;
  banlist_info?: YgoBanlistInfo;
  misc_info?: YgoMiscInfo[];
  card_sets?: YgoCardSet[];
  card_prices?: YgoCardPrices[];
  card_images?: YgoCardImage[];
};

export type YgoCardinfoResponse = {
  data: YgoApiCard[];
};

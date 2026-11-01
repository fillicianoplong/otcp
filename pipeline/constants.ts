/** Pinned YGOPRODeck bulk card dump (ADR-003). */
export const YGOPRODECK_CARDINFO_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';

/** Documented User-Agent for upstream requests (ADR-003). */
export const OTCP_PIPELINE_USER_AGENT = 'OTCP/0.1.0 (+https://github.com/fillicianoplong/otcp)';

export const DEFAULT_POINTER_REL = 'public/data/current.json';
export const DEFAULT_DATA_DIR = 'public/data';
export const DATASETS_SUBDIR = 'datasets';
export const CARD_IMAGES_SUBDIR = 'card-images';

/** Upper bound per re-hosted image file (ADR-003 / SR-07). */
export const MAX_CARD_IMAGE_LARGE_BYTES = 3_000_000;
export const MAX_CARD_IMAGE_SMALL_BYTES = 500_000;

/** Polite spacing between upstream image requests during refresh. */
export const IMAGE_FETCH_DELAY_MS = 100;

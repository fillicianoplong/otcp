/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** When true, preview/e2e may load bundled dev-art fixtures (never set in production CI build). */
  readonly VITE_DEV_ART_FALLBACK?: string;
  readonly VITE_DISABLE_CATALOG_ART_WARM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

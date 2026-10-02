/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API server; defaults to the Vite dev proxy at /api */
  readonly VITE_API_URL?: string;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API server; defaults to the Vite dev proxy at /api */
  readonly VITE_API_URL?: string;
  /** "true" shows the demo login on the login page outside development */
  readonly VITE_SHOW_DEMO_LOGIN?: string;
}

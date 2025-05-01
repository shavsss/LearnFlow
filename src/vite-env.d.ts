/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FB_KEY: string;
  readonly VITE_FB_AUTH: string;
  readonly VITE_FB_PROJECT: string;
  readonly VITE_FB_BUCKET: string;
  readonly VITE_FB_SENDER: string;
  readonly VITE_FB_APPID: string;
  readonly VITE_FB_MEASURE: string;
  // הוסף משתני סביבה נוספים כאן...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 
import { useState, useEffect } from 'react';
import { en } from './en';
import { bg } from './bg';

const LANG_KEY = 'la-busche:language';
const LANG_EVENT = 'la-busche:language-changed';

export type Language = 'en' | 'bg';

function readLang(): Language {
  try {
    return localStorage.getItem(LANG_KEY) === 'bg' ? 'bg' : 'en';
  } catch {
    return 'en';
  }
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(LANG_EVENT));
}

export function useTranslation() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') return readLang();
    return 'en';
  });

  useEffect(() => {
    setLang(readLang());
    function onChange() { setLang(readLang()); }
    window.addEventListener(LANG_EVENT, onChange);
    return () => window.removeEventListener(LANG_EVENT, onChange);
  }, []);

  const dict = lang === 'bg' ? bg : null;

  return {
    lang,
    t(key: keyof typeof en | string, vars?: Record<string, string | number>): string {
      const override = dict?.[key as keyof typeof en];
      let str = (override || (en as Record<string, string>)[key]) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
  };
}

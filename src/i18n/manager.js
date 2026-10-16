// Language infrastructure. EN/TR remain unavailable until UI artwork is ready.
(() => {
  'use strict';
  const dictionaries = new Map();
  const ready = new Set(['ru']);
  const key = 'berries_language_v1';
  let language = 'ru';
  const normalize = value => String(value || '').toLowerCase().split(/[-_]/)[0];
  const resolve = value => ready.has(normalize(value)) ? normalize(value) : 'ru';
  window.BerriesI18n = Object.freeze({
    get language() { return language; },
    get availableLanguages() { return [...ready]; },
    register(locale, dictionary) {
      if (!['ru', 'en', 'tr'].includes(locale)) throw new Error('Unsupported locale');
      dictionaries.set(locale, Object.freeze({ ...dictionary }));
    },
    init(platformLanguage) {
      let saved;
      try { saved = window.localStorage.getItem(key); } catch {}
      language = resolve(saved || platformLanguage || window.navigator?.language);
      return language;
    },
    setLanguage(locale) {
      if (!ready.has(normalize(locale))) return false;
      language = resolve(locale);
      try { window.localStorage.setItem(key, language); } catch {}
      return true;
    },
    t(id, params = {}) {
      const template = dictionaries.get(language)?.[id] ?? dictionaries.get('ru')?.[id] ?? id;
      return template.replace(/\{(\w+)\}/g, (token, name) =>
        Object.hasOwn(params, name) ? String(params[name]) : token);
    }
  });
})();

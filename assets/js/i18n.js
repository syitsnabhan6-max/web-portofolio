(() => {
  const STORAGE_KEY = 'portfolio_lang';
  const SUPPORTED = [
    { code: 'en', label: 'English' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },
    { code: 'ru', label: 'Русский' },
    { code: 'es', label: 'Español' }
  ];
  const RTL_LANGS = new Set();

  const dictCache = new Map();
  let currentLang = 'en';
  let currentDict = {};

  const CATEGORY_KEY_BY_NAME = {
    'web development': 'categories.web-development',
    'mobile development': 'categories.mobile-development',
    'graphic design': 'categories.graphic-design',
    'photography': 'categories.photography',
    'videography': 'categories.videography',
    'ui/ux design': 'categories.ui-ux-design',
    'ui ux design': 'categories.ui-ux-design',
    'branding': 'categories.branding',
    'illustration': 'categories.illustration',
    'animation': 'categories.animation',
    'other': 'categories.other'
  };

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  function interpolate(input, vars) {
    const str = String(input);
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      if (vars[key] === undefined || vars[key] === null) return `{${key}}`;
      return String(vars[key]);
    });
  }

  function t(key, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const vars = opts.vars || opts;
    const value = getNested(currentDict, key);
    if (typeof value === 'string') return interpolate(value, vars);
    if (opts.defaultText !== undefined) return interpolate(opts.defaultText, vars);
    return String(key);
  }

  function tCategory(name) {
    const raw = String(name || '').trim();
    if (!raw) return t('categories.other', { defaultText: 'Other' });
    const key = CATEGORY_KEY_BY_NAME[raw.toLowerCase()];
    if (key) return t(key, { defaultText: raw });
    return raw;
  }

  async function loadDict(lang) {
    const code = String(lang || '').toLowerCase();
    if (dictCache.has(code)) return dictCache.get(code);
    const url = `./assets/i18n/${encodeURIComponent(code)}.json`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load language file: ${code}`);
    const json = await res.json();
    dictCache.set(code, json);
    return json;
  }

  function applyTranslations(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key, { defaultText: el.textContent });
    });

    scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key, { defaultText: el.innerHTML });
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const current = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', t(key, { defaultText: current }));
    });

    scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const current = el.getAttribute('title') || '';
      el.setAttribute('title', t(key, { defaultText: current }));
    });

    scope.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const current = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', t(key, { defaultText: current }));
    });
  }

  function normalizeLang(input) {
    const raw = String(input || '').toLowerCase();
    if (!raw) return null;
    if (raw.includes('-')) return raw.split('-')[0];
    return raw;
  }

  function pickInitialLanguage() {
    const saved = normalizeLang(localStorage.getItem(STORAGE_KEY));
    if (saved && SUPPORTED.some((l) => l.code === saved)) return saved;

    const navLangs = [];
    if (Array.isArray(navigator.languages)) navLangs.push(...navigator.languages);
    if (navigator.language) navLangs.push(navigator.language);
    for (const candidate of navLangs) {
      const code = normalizeLang(candidate);
      if (code && SUPPORTED.some((l) => l.code === code)) return code;
    }

    return 'en';
  }

  async function setLanguage(lang, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const code = normalizeLang(lang) || 'en';
    const resolved = SUPPORTED.some((l) => l.code === code) ? code : 'en';

    currentLang = resolved;
    document.documentElement.lang = resolved;
    document.documentElement.dir = RTL_LANGS.has(resolved) ? 'rtl' : 'ltr';

    try {
      currentDict = await loadDict(resolved);
    } catch {
      currentDict = resolved === 'en' ? {} : await loadDict('en');
      currentLang = resolved === 'en' ? 'en' : 'en';
      document.documentElement.lang = currentLang;
      document.documentElement.dir = 'ltr';
    }

    if (opts.save !== false) {
      localStorage.setItem(STORAGE_KEY, currentLang);
    }

    applyTranslations(document);
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: currentLang } }));
  }

  function initLanguageSelector() {
    const select = document.getElementById('langSelect');
    if (!select) return;

    if (select.options.length === 0) {
      for (const lang of SUPPORTED) {
        const opt = document.createElement('option');
        opt.value = lang.code;
        opt.textContent = lang.code.toUpperCase();
        opt.dataset.fullLabel = lang.label;
        select.appendChild(opt);
      }
    }

    select.value = currentLang;
    const syncTitle = () => {
      const selected = SUPPORTED.find((l) => l.code === select.value);
      select.title = selected ? selected.label : select.value.toUpperCase();
    };
    syncTitle();
    select.addEventListener('change', () => {
      setLanguage(select.value);
      syncTitle();
    });

    document.addEventListener('i18n:change', (e) => {
      if (e?.detail?.lang) select.value = e.detail.lang;
      syncTitle();
    });
  }

  window.i18n = {
    supported: SUPPORTED,
    t,
    tCategory,
    setLanguage,
    getLanguage: () => currentLang,
    applyTranslations
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const initial = pickInitialLanguage();
    await setLanguage(initial, { save: true });
    initLanguageSelector();
  });
})();

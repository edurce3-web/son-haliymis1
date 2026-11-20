/*
 * Dil desteği.
 *
 * Arayüz Türkçe yazıldı; metinler 175 dosyaya dağılmış durumda. Hepsini tek tek
 * anahtarlara çevirmek yerine burada bir çeviri katmanı var: dil İngilizce
 * seçilince sayfadaki metin düğümleri ve birkaç öznitelik (placeholder, title,
 * aria-label, alt) sözlükten karşılığıyla değiştiriliyor. Sözlük `en.ts`;
 * yalnızca İngilizce seçildiğinde indiriliyor, Türkçe kullanan ziyaretçi bu
 * baytları hiç indirmiyor.
 *
 * Neden güvenli: yalnızca metin düğümünün değeri (nodeValue) değişiyor,
 * düğümün kendisi değil. React aynı düğümü güncellemeye devam ediyor; React
 * düğümü Türkçeye geri yazarsa gözlemci bunu görüp yeniden çeviriyor.
 *
 * Neler çevrilmiyor: veritabanından gelen içerik (kurs adı, açıklama, yorum)
 * sözlükte olmadığı için olduğu gibi kalıyor. Bir alanın hiç çevrilmemesi
 * gerekiyorsa üstündeki öğeye `translate="no"` ya da `data-no-translate`
 * eklemek yeterli.
 */

export type Lang = 'tr' | 'en' | 'de' | 'fr' | 'it' | 'ru' | 'ar' | 'id' | 'ky';

/** Seçilebilen diller. `name` Türkçe adı; seçicide yerel adın altında görünüyor. */
export const LANGUAGES: { code: Lang; label: string; name: string; short: string }[] = [
    { code: 'tr', label: 'Türkçe', name: 'Türkçe', short: 'TR' },
    { code: 'en', label: 'English', name: 'İngilizce', short: 'EN' },
    { code: 'de', label: 'Deutsch', name: 'Almanca', short: 'DE' },
    { code: 'fr', label: 'Français', name: 'Fransızca', short: 'FR' },
    { code: 'it', label: 'Italiano', name: 'İtalyanca', short: 'IT' },
    { code: 'ru', label: 'Русский', name: 'Rusça', short: 'RU' },
    { code: 'ar', label: 'العربية', name: 'Arapça', short: 'AR' },
    { code: 'id', label: 'Bahasa Indonesia', name: 'Endonezce', short: 'ID' },
    { code: 'ky', label: 'Кыргызча', name: 'Kırgızca', short: 'KY' },
];

const CODES = new Set<string>(LANGUAGES.map(l => l.code));

const STORAGE_KEY = 'edurce-lang';
const EVENT = 'edurce-lang-change';

export function getLang(): Lang {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v && CODES.has(v)) return v as Lang;
    } catch { /* gizli pencere */ }
    return 'tr';
}

/* ── Sözlük ───────────────────────────────────────────────────────────── */

type Pattern = { re: RegExp; out: string };

let dict: Map<string, string> | null = null;
let patterns: Pattern[] = [];
let dictLang: Lang | null = null;
let loading: { lang: Lang; p: Promise<void> } | null = null;

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Her dilin sözlüğü ayrı parça; yalnızca o dil seçilince indiriliyor.
   İngilizce dışındaki dillerde karşılığı olmayan metin İngilizceye düşüyor. */
const LOADERS: Record<Exclude<Lang, 'tr'>, () => Promise<{ default: Record<string, string> }>> = {
    en: () => import('./en'),
    de: () => import('./locales/de'),
    fr: () => import('./locales/fr'),
    it: () => import('./locales/it'),
    ru: () => import('./locales/ru'),
    ar: () => import('./locales/ar'),
    id: () => import('./locales/id'),
    ky: () => import('./locales/ky'),
};

function build(data: Record<string, string>) {
    const map = new Map<string, string>();
    const pats: Pattern[] = [];
    for (let [tr, out] of Object.entries(data)) {
        if (!out) continue;
        // Yan yana iki yer tutucu ("{}{}%") metni nereden böleceğini
        // bilemiyor; "11" gibi bir sayıyı ikiye ayırabiliyor. Tek yap.
        while (tr.includes('{}{}')) tr = tr.replace('{}{}', '{}');
        while (out.includes('{}{}')) out = out.replace('{}{}', '{}');
        if (tr.includes('{}')) {
            // "{} kurs hazırlanıyor" → /^(.+?) kurs hazırlanıyor$/
            const parts = tr.split('{}').map(escapeRe);
            pats.push({ re: new RegExp('^' + parts.join('(.+?)') + '$'), out });
        } else {
            map.set(norm(tr), out);
        }
    }
    // Uzun kalıplar önce: daha özgül olan kazansın
    pats.sort((a, b) => b.re.source.length - a.re.source.length);
    return { map, pats };
}

async function loadDict(lang: Exclude<Lang, 'tr'>) {
    if (dictLang === lang) return;
    if (!loading || loading.lang !== lang) {
        const p = (async () => {
            const en = (await LOADERS.en()).default;
            const own = lang === 'en' ? {} : (await LOADERS[lang]()).default;
            const { map, pats } = build({ ...en, ...own });
            if (loading?.lang !== lang) return;
            dict = map; patterns = pats; dictLang = lang;
        })();
        loading = { lang, p };
    }
    await loading.p;
}

/* Tarihler: Türkçe ay ve gün adları seçili dilde Intl ile yazılıyor. */
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_TR_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTH_ALT = [...MONTHS_TR, ...MONTHS_TR_SHORT].join('|');
const DATE_RE = new RegExp(`^(\\d{1,2})\\s(${MONTH_ALT})(\\s\\d{4})?$`);
const MONTH_YEAR_RE = new RegExp(`^(${MONTH_ALT})(\\s\\d{4})?$`);

const locale = () => (dictLang === 'ar' ? 'ar-u-nu-latn' : dictLang || 'en');
const monthIndex = (m: string) => {
    const i = MONTHS_TR.indexOf(m);
    return i >= 0 ? { i, short: false } : { i: MONTHS_TR_SHORT.indexOf(m), short: true };
};
function fmt(date: Date, opts: Intl.DateTimeFormatOptions) {
    try { return new Intl.DateTimeFormat(locale(), opts).format(date); } catch { return null; }
}

/* Türkçede sayıdan sonra isim tekil kalıyor ("1 gün", "3 gün"); İngilizcede
   sözlük çoğul yazıyor. Sayı 1 ise ismi tekile çevir: "1 days" → "1 day". */
const SINGULAR: Record<string, string> = {
    days: 'day', hours: 'hour', minutes: 'minute', students: 'student', courses: 'course',
    lessons: 'lesson', sales: 'sale', reviews: 'review', stars: 'star', certificates: 'certificate',
    results: 'result', notifications: 'notification', credits: 'credit', questions: 'question',
    answers: 'answer', uses: 'use', pages: 'page', sections: 'section', tasks: 'task',
};
const SINGULAR_RE = new RegExp(`(^|[^\\d.,])1 (${Object.keys(SINGULAR).join('|')})\\b`, 'g');
const singular = (s: string) => s
    .replace(SINGULAR_RE, (_m, pre, w) => `${pre}1 ${SINGULAR[w]}`)
    .replace(/\b1 tasks are\b/, '1 task is');

/** Bir metnin seçili dildeki karşılığı; yoksa null. */
export function translate(text: string): string | null {
    if (!dict) return null;
    const t = norm(text);
    if (!t) return null;
    const hit = dict.get(t);
    if (hit != null) return hit;

    for (const p of patterns) {
        const m = t.match(p.re);
        if (m) {
            let i = 1;
            // Yer tutucuların içi de çevrilebiliyorsa çevir ("3 gün önce" içindeki "gün" değil, tamamı)
            const out = p.out.replace(/\{\}/g, () => {
                const v = m[i++] ?? '';
                return translate(v) ?? v;
            });
            return dictLang === 'en' ? singular(out) : out;
        }
    }

    const d = t.match(DATE_RE);
    if (d) {
        const { i, short } = monthIndex(d[2]);
        const y = d[3] ? Number(d[3]) : 2000;
        return fmt(new Date(y, i, Number(d[1])), { day: 'numeric', month: short ? 'short' : 'long', ...(d[3] ? { year: 'numeric' } : {}) });
    }
    const my = t.match(MONTH_YEAR_RE);
    if (my) {
        const { i, short } = monthIndex(my[1]);
        return fmt(new Date(my[2] ? Number(my[2]) : 2000, i, 1), { month: short ? 'short' : 'long', ...(my[2] ? { year: 'numeric' } : {}) });
    }
    const day = DAYS_TR.indexOf(t);
    if (day >= 0) return fmt(new Date(2024, 0, 7 + day), { weekday: 'long' });
    return null;
}

/* ── DOM katmanı ──────────────────────────────────────────────────────── */

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;

/** Metin düğümünün Türkçe aslı ve en son bizim yazdığımız değer. */
const textOrig = new WeakMap<Text, { orig: string; set: string }>();
/** Özniteliklerin Türkçe aslı. */
const attrOrig = new WeakMap<Element, Record<string, { orig: string; set: string }>>();

let active = false;
let observer: MutationObserver | null = null;
let titleObserver: MutationObserver | null = null;
let titleOrig: string | null = null;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'svg', 'SVG']);

function skipped(el: Element | null): boolean {
    for (let e = el; e; e = e.parentElement) {
        if (SKIP_TAGS.has(e.tagName)) return true;
        if (e.getAttribute('translate') === 'no' || e.hasAttribute('data-no-translate')) return true;
        if ((e as HTMLElement).isContentEditable) return true;
    }
    return false;
}

function doText(node: Text) {
    const cur = node.nodeValue ?? '';
    const rec = textOrig.get(node);
    // React düğümü yeniden yazdıysa yeni değer Türkçe asıl olur
    const orig = rec && cur === rec.set ? rec.orig : cur;
    if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(orig)) return;
    if (skipped(node.parentElement)) return;
    const en = translate(orig);
    if (en == null) {
        if (rec && cur === rec.set) { node.nodeValue = rec.orig; }
        textOrig.delete(node);
        return;
    }
    const lead = orig.match(/^\s*/)?.[0] ?? '';
    const trail = orig.match(/\s*$/)?.[0] ?? '';
    const next = lead + en + trail;
    if (cur !== next) node.nodeValue = next;
    textOrig.set(node, { orig, set: next });
}

function doAttrs(el: Element) {
    let recs = attrOrig.get(el);
    for (const a of ATTRS) {
        const cur = el.getAttribute(a);
        if (cur == null) continue;
        const r = recs?.[a];
        const orig = r && cur === r.set ? r.orig : cur;
        const en = translate(orig);
        if (en == null) continue;
        if (cur !== en) el.setAttribute(a, en);
        if (!recs) { recs = {}; attrOrig.set(el, recs); }
        recs[a] = { orig, set: en };
    }
}

function walk(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) { doText(root as Text); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    const el = root as Element;
    if (el.nodeType === Node.ELEMENT_NODE) {
        if (skipped(el)) return;
        doAttrs(el);
    }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = tw.nextNode();
    while (n) {
        if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
        else if (ATTRS.some(a => (n as Element).hasAttribute(a))) doAttrs(n as Element);
        n = tw.nextNode();
    }
}

/* Gözlemci geri çağrısı DOM değişikliğinden hemen sonra, ekran çizilmeden
   çalışıyor; çeviri orada yapılınca Türkçe metin bir an bile görünmüyor.
   Dil Türkçeye döndüyse bekleyen hiçbir şey çevrilmiyor. */
function enqueue(n: Node) {
    if (active && n.isConnected) walk(n);
}

function doTitle() {
    const t = document.title;
    if (titleOrig != null && t === translate(titleOrig)) return;
    titleOrig = t;
    const en = translate(t);
    if (en != null && en !== t) document.title = en;
}

function start() {
    if (active) return;
    active = true;
    walk(document.body);
    observer = new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === 'childList') m.addedNodes.forEach(enqueue);
            else if (m.type === 'characterData') enqueue(m.target);
            else if (m.type === 'attributes') enqueue(m.target);
        }
    });
    observer.observe(document.body, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: [...ATTRS],
    });
    const titleEl = document.querySelector('title');
    if (titleEl) {
        doTitle();
        titleObserver = new MutationObserver(doTitle);
        titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }
}

function stop() {
    if (!active) return;
    active = false;
    observer?.disconnect(); observer = null;
    titleObserver?.disconnect(); titleObserver = null;
    // Sayfayı dolaşıp bizim yazdığımız her şeyi Türkçe aslına döndür
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n: Node | null = tw.currentNode;
    while (n) {
        if (n.nodeType === Node.TEXT_NODE) {
            const r = textOrig.get(n as Text);
            if (r && n.nodeValue === r.set) n.nodeValue = r.orig;
            textOrig.delete(n as Text);
        } else {
            const recs = attrOrig.get(n as Element);
            if (recs) {
                for (const [a, r] of Object.entries(recs)) if ((n as Element).getAttribute(a) === r.set) (n as Element).setAttribute(a, r.orig);
                attrOrig.delete(n as Element);
            }
        }
        n = tw.nextNode();
    }
    if (titleOrig != null) { document.title = titleOrig; titleOrig = null; }
}

export async function applyLang(lang: Lang) {
    document.documentElement.lang = lang;
    if (lang === 'tr') { stop(); return; }
    const switching = active && dictLang !== lang;
    await loadDict(lang);
    if (getLang() !== lang) return;
    // Başka bir yabancı dilden geçiliyorsa önce Türkçe asıllara dön, sonra yeniden çevir
    if (switching) stop();
    start();
}

export async function setLang(lang: Lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* yok say */ }
    await applyLang(lang);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: lang }));
}

export function onLangChange(fn: (l: Lang) => void) {
    const h = (e: Event) => fn((e as CustomEvent).detail as Lang);
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
}

/** Uygulama açılırken bir kez çağrılıyor. */
export function initI18n() {
    const l = getLang();
    if (l !== 'tr') applyLang(l);
}

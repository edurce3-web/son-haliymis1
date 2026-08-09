import { useEffect } from 'react';

export interface SeoBreadcrumb {
    name: string;
    url: string;
}

export interface SeoData {
    title?: string;
    description?: string;
    /** "index, follow" | "noindex, follow" ... */
    robots?: string;
    canonical?: string;
    prev?: string | null;
    next?: string | null;
    /** Open Graph görseli (mutlak adres olmalı) */
    image?: string | null;
    type?: string;
    /** schema.org JSON-LD blokları */
    jsonLd?: unknown[];
}

const MANAGED = 'data-seo-managed';

/** İçeriği verilen <meta> etiketini bulur veya oluşturur. */
function setMeta(attr: 'name' | 'property', key: string, content?: string | null) {
    const head = document.head;
    let el = head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);

    if (!content) {
        // Bu sayfaya ait değilse ve biz eklediysek temizle
        if (el?.hasAttribute(MANAGED)) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        el.setAttribute(MANAGED, '');
        head.appendChild(el);
    }
    el.setAttribute('content', content);
}

/** rel="canonical" / "prev" / "next" bağlantıları. */
function setLink(rel: string, href?: string | null) {
    const head = document.head;
    let el = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

    if (!href) {
        if (el?.hasAttribute(MANAGED)) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        el.setAttribute(MANAGED, '');
        head.appendChild(el);
    }
    el.setAttribute('href', href);
}

/**
 * Sayfa başına SEO etiketlerini yönetir.
 *
 * Neden react-helmet değil: proje bir Vite SPA ve yeni bağımlılık eklemeden
 * aynı işi doğrudan DOM üzerinden yapmak mümkün. Google JavaScript'i
 * çalıştırdığı için istemci tarafında yazılan etiketler taranıyor.
 *
 * NOT: Sosyal medya kazıyıcıları (WhatsApp, Twitter) JavaScript çalıştırmaz.
 * Paylaşım önizlemelerinin de doğru çıkması için ileride ön render (prerender)
 * ya da Cloudflare Worker ile sunucu tarafı enjeksiyon gerekir.
 */
export function useSeo(seo: SeoData | null | undefined, deps: unknown[] = []) {
    useEffect(() => {
        if (!seo) return;

        const previousTitle = document.title;
        if (seo.title) document.title = seo.title;

        setMeta('name', 'description', seo.description);
        setMeta('name', 'robots', seo.robots || 'index, follow');

        // Open Graph
        setMeta('property', 'og:title', seo.title);
        setMeta('property', 'og:description', seo.description);
        setMeta('property', 'og:type', seo.type || 'website');
        setMeta('property', 'og:url', seo.canonical);
        setMeta('property', 'og:site_name', 'Edurce');
        setMeta('property', 'og:locale', 'tr_TR');
        setMeta('property', 'og:image', seo.image || undefined);

        // Twitter
        setMeta('name', 'twitter:card', seo.image ? 'summary_large_image' : 'summary');
        setMeta('name', 'twitter:title', seo.title);
        setMeta('name', 'twitter:description', seo.description);
        setMeta('name', 'twitter:image', seo.image || undefined);

        setLink('canonical', seo.canonical);
        setLink('prev', seo.prev);
        setLink('next', seo.next);

        // JSON-LD: her render'da tamamen değiştiriliyor, birikmesin
        const scripts: HTMLScriptElement[] = [];
        for (const block of seo.jsonLd || []) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute(MANAGED, '');
            script.textContent = JSON.stringify(block);
            document.head.appendChild(script);
            scripts.push(script);
        }

        return () => {
            scripts.forEach(s => s.remove());
            document.title = previousTitle;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

export default useSeo;

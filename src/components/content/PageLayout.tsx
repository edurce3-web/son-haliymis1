import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSeo } from '@/hooks/useSeo';

export interface Section {
    id: string;
    title: string;
    body: React.ReactNode;
}

interface Props {
    title: string;
    /** Başlığın altındaki tek cümlelik özet */
    lead?: string;
    /** Yasal metinlerde yürürlük tarihi */
    updatedAt?: string;
    /** İçindekiler + gövde. Verilmezse children kullanılır. */
    sections?: Section[];
    children?: React.ReactNode;
    seo?: { title: string; description: string; canonical: string };
}

/**
 * Bilgi ve yasal sayfaların ortak çerçevesi.
 *
 * Süsleme tamamen tipografi, renk ve boşlukla yapılıyor — ikon yok. Bölüm
 * numaraları kenarda büyük ve soluk duruyor, başlıkların altında marka rengi
 * bir çizgi var, içindekiler okunan bölümü işaretliyor.
 */
export const PageLayout: React.FC<Props> = ({
    title, lead, updatedAt, sections, children, seo,
}) => {
    const [activeId, setActiveId] = useState<string>('');

    useSeo(seo ? { ...seo, robots: 'index, follow' } : null, [seo?.canonical]);

    // Görünür bölümü içindekilerde işaretle
    useEffect(() => {
        if (!sections?.length) return;

        const observer = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visible) setActiveId(visible.target.id);
            },
            // Üstteki header'ı hesaba kat
            { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
        );

        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="min-h-screen bg-white">
            <PageHeader title={title} lead={lead} updatedAt={updatedAt} />

            <div className="container px-4 py-14 lg:py-20">
                {sections?.length ? (
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                        {/* İçindekiler */}
                        <nav className="lg:w-64 shrink-0" aria-label="İçindekiler">
                            <div className="lg:sticky lg:top-24">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700/70 mb-4">
                                    İçindekiler
                                </p>
                                <ol className="space-y-0.5">
                                    {sections.map((s, i) => {
                                        const active = activeId === s.id;
                                        return (
                                            <li key={s.id}>
                                                <a
                                                    href={`#${s.id}`}
                                                    className={cn(
                                                        'group flex items-baseline gap-2.5 rounded-md px-3 py-1.5 text-sm transition-all duration-200',
                                                        active
                                                            ? 'bg-brand-50 text-brand-900 font-semibold'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                    )}
                                                >
                                                    <span className={cn(
                                                        'text-[11px] tabular-nums font-semibold transition-colors',
                                                        active ? 'text-brand-600' : 'text-slate-300 group-hover:text-slate-400'
                                                    )}>
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="leading-snug">{s.title}</span>
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </nav>

                        {/* Gövde */}
                        <div className="flex-1 min-w-0 max-w-3xl">
                            {sections.map((s, i) => (
                                <section
                                    key={s.id}
                                    id={s.id}
                                    className="scroll-mt-24 mb-14 last:mb-0 relative"
                                >
                                    {/* Kenardaki soluk bölüm numarası — sadece geniş ekranda */}
                                    <span
                                        aria-hidden
                                        className="hidden xl:block absolute -left-20 top-0 text-5xl font-bold tabular-nums text-brand-100 select-none leading-none"
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>

                                    <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">
                                        {s.title}
                                    </h2>
                                    <span className="block w-10 h-[3px] rounded-full bg-brand-600 mt-3 mb-6" />

                                    <div className="prose-page">{s.body}</div>
                                </section>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl prose-page">{children}</div>
                )}
            </div>
        </div>
    );
};

/**
 * Sayfa başlığı bloğu.
 *
 * Ayrı export edilmesinin sebebi: İletişim ve Yardım gibi bölüm listesi
 * olmayan sayfalar da aynı başlığı kullanabilsin.
 */
export const PageHeader: React.FC<{
    title: string;
    lead?: React.ReactNode;
    updatedAt?: string;
    children?: React.ReactNode;
}> = ({ title, lead, updatedAt, children }) => (
    <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/70 via-brand-50/25 to-white">
        {/* Köşedeki yumuşak marka lekesi — dokusal derinlik için */}
        <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-brand-200/25 blur-3xl"
        />

        <div className="container relative px-4 py-14 lg:py-20">
            <nav className="text-xs text-slate-500 mb-5">
                <Link to="/" className="hover:text-brand-700 transition-colors">Ana sayfa</Link>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-700 font-medium">{title}</span>
            </nav>

            <h1 className="text-[34px] lg:text-[44px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.1]">
                {title}
            </h1>
            <span className="block w-14 h-1 rounded-full bg-brand-600 mt-5" />

            {lead && (
                <p className="text-[17px] lg:text-[18px] text-slate-600 mt-6 max-w-2xl leading-[1.65]">
                    {lead}
                </p>
            )}
            {updatedAt && (
                <p className="inline-block text-[13px] text-brand-800 bg-white/70 border border-brand-200 rounded-full px-3.5 py-1 mt-7">
                    Yürürlük tarihi: {updatedAt}
                </p>
            )}
            {children}
        </div>
    </header>
);

/** Metin bölümlerinde tekrar eden paragraf stili. */
export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[15.5px] text-slate-700 leading-[1.8] mb-4 last:mb-0">{children}</p>
);

/** Madde listesi — işaretler marka renginde ince çizgiler. */
export const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className="mb-5 space-y-2.5">
        {items.map((item, i) => (
            <li key={i} className="text-[15.5px] text-slate-700 leading-[1.8] pl-6 relative">
                <span className="absolute left-0 top-[13px] w-3 h-px bg-brand-500" />
                {item}
            </li>
        ))}
    </ul>
);

/** Numaralı liste — adım anlatımlarında. */
export const OL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ol className="mb-5 space-y-3">
        {items.map((item, i) => (
            <li key={i} className="text-[15.5px] text-slate-700 leading-[1.8] pl-9 relative">
                <span className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold tabular-nums flex items-center justify-center">
                    {i + 1}
                </span>
                {item}
            </li>
        ))}
    </ol>
);

/** Ara başlık. */
export const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-[15.5px] font-bold text-slate-900 mt-8 mb-3 pl-3 border-l-2 border-brand-400">
        {children}
    </h3>
);

/** Vurgulanması gereken not. */
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative my-6 rounded-r-lg border-l-[3px] border-brand-500 bg-gradient-to-r from-brand-50 to-brand-50/20 pl-5 pr-4 py-4">
        <p className="text-[14.5px] text-slate-700 leading-[1.7]">{children}</p>
    </div>
);

/**
 * Öne çıkan sayı.
 *
 * Metin içindeki önemli rakamı (gelir payı, süre, oran) büyük harflerle
 * göstermek için — ikon kullanmadan görsel vurgu sağlar.
 */
export const Stats: React.FC<{ items: Array<{ value: string; label: string }> }> = ({ items }) => (
    <div className="grid gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden my-6 sm:grid-cols-3">
        {items.map(item => (
            <div key={item.label} className="bg-white px-5 py-5">
                <div className="text-[26px] font-bold text-brand-800 tabular-nums tracking-tight leading-none">
                    {item.value}
                </div>
                <div className="text-[13px] text-slate-500 mt-2 leading-snug">{item.label}</div>
            </div>
        ))}
    </div>
);

/** Basit veri tablosu. */
export const Table: React.FC<{
    head: string[];
    rows: React.ReactNode[][];
    /** Son satırı toplam gibi vurgula */
    emphasizeLast?: boolean;
}> = ({ head, rows, emphasizeLast }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200">
        <table className="w-full text-[14.5px] min-w-[420px]">
            <thead>
                <tr className="bg-slate-50/80 text-left">
                    {head.map(h => (
                        <th
                            key={h}
                            className="font-semibold text-slate-600 text-[12px] uppercase tracking-wider px-4 py-3 border-b border-slate-200 whitespace-nowrap"
                        >
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                    <tr
                        key={i}
                        className={cn(
                            'transition-colors hover:bg-brand-50/40',
                            emphasizeLast && i === rows.length - 1 && 'bg-brand-50/50 font-semibold text-brand-900'
                        )}
                    >
                        {r.map((cell, j) => (
                            <td
                                key={j}
                                className={cn(
                                    'px-4 py-3 align-top leading-relaxed',
                                    j === 0 ? 'text-slate-800 font-medium' : 'text-slate-700'
                                )}
                            >
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default PageLayout;

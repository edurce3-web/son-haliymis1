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
 * Bilinçli olarak sade: ikon yok, gradyan yok, kart yığını yok. Bu sayfalarda
 * kullanıcı bir şey OKUMAYA gelir; süsleme okumayı zorlaştırır. Ölçüm satır
 * uzunluğu ~70 karakterde tutuluyor.
 *
 * Uzun metinlerde solda içindekiler çıkar ve kaydırma sırasında okunan bölüm
 * işaretlenir.
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
            {/* Başlık */}
            <header className="border-b border-slate-200 bg-slate-50/70">
                <div className="container px-4 py-12 lg:py-16">
                    <nav className="text-xs text-slate-500 mb-4">
                        <Link to="/" className="hover:text-brand-700">Ana sayfa</Link>
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="text-slate-700">{title}</span>
                    </nav>

                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                        {title}
                    </h1>
                    {lead && (
                        <p className="text-[17px] text-slate-600 mt-4 max-w-2xl leading-relaxed">
                            {lead}
                        </p>
                    )}
                    {updatedAt && (
                        <p className="text-sm text-slate-500 mt-5">
                            Yürürlük tarihi: {updatedAt}
                        </p>
                    )}
                </div>
            </header>

            <div className="container px-4 py-12 lg:py-16">
                {sections?.length ? (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* İçindekiler */}
                        <nav className="lg:w-60 shrink-0" aria-label="İçindekiler">
                            <div className="lg:sticky lg:top-24">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                                    İçindekiler
                                </p>
                                <ol className="space-y-1 border-l border-slate-200">
                                    {sections.map((s, i) => (
                                        <li key={s.id}>
                                            <a
                                                href={`#${s.id}`}
                                                className={cn(
                                                    '-ml-px block border-l-2 pl-3 py-1 text-sm transition-colors',
                                                    activeId === s.id
                                                        ? 'border-brand-600 text-brand-800 font-medium'
                                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                                )}
                                            >
                                                {i + 1}. {s.title}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </nav>

                        {/* Gövde */}
                        <div className="flex-1 min-w-0 max-w-3xl">
                            {sections.map((s, i) => (
                                <section key={s.id} id={s.id} className="scroll-mt-24 mb-12 last:mb-0">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">
                                        {i + 1}. {s.title}
                                    </h2>
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

/** Metin bölümlerinde tekrar eden paragraf stili. */
export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[15px] text-slate-700 leading-[1.75] mb-4 last:mb-0">{children}</p>
);

/** Madde listesi. */
export const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className="mb-4 space-y-2">
        {items.map((item, i) => (
            <li key={i} className="text-[15px] text-slate-700 leading-[1.75] pl-5 relative">
                <span className="absolute left-0 top-[11px] w-1.5 h-1.5 rounded-full bg-slate-400" />
                {item}
            </li>
        ))}
    </ul>
);

/** Ara başlık. */
export const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-[15px] font-bold text-slate-900 mt-6 mb-2.5">{children}</h3>
);

/** Vurgulanması gereken not. */
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="border-l-2 border-brand-300 bg-brand-50/60 pl-4 py-3 my-5">
        <p className="text-[14px] text-slate-700 leading-relaxed">{children}</p>
    </div>
);

/** Basit veri tablosu. */
export const Table: React.FC<{ head: string[]; rows: React.ReactNode[][] }> = ({ head, rows }) => (
    <div className="overflow-x-auto my-5">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead>
                <tr className="bg-slate-50 text-left">
                    {head.map(h => (
                        <th key={h} className="font-semibold text-slate-700 px-4 py-2.5 border-b border-slate-200">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                    <tr key={i}>
                        {r.map((cell, j) => (
                            <td key={j} className="px-4 py-2.5 text-slate-700 align-top">{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default PageLayout;

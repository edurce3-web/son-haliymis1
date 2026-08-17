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
    lead?: React.ReactNode;
    /** Yasal metinlerde yürürlük tarihi */
    updatedAt?: string;
    /** İçindekiler + gövde. Verilmezse children kullanılır. */
    sections?: Section[];
    children?: React.ReactNode;
    seo?: { title: string; description: string; canonical: string };
    /** Alttaki iletişim şeridi gizlensin mi (İletişim sayfasında gereksiz) */
    hideContactBand?: boolean;
}

/**
 * Bilgi ve yasal sayfaların ortak çerçevesi.
 *
 * Tasarım: koyu marka renginde tam genişlikte bir başlık bandı, altında
 * iki sütunlu editoryal gövde. Başlıklarda logonun fontu (Montserrat 800)
 * kullanılıyor, metinde Inter. İkon yok — hiyerarşi tipografi, renk ve
 * boşlukla kuruluyor. Ölçüm satırı ~70 karakterde tutuluyor.
 */
export const PageLayout: React.FC<Props> = ({
    title, lead, updatedAt, sections, children, seo, hideContactBand,
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

            <div className="container px-4 py-16 lg:py-24">
                {sections?.length ? (
                    <div className="flex flex-col lg:flex-row gap-14 lg:gap-20">
                        <TableOfContents sections={sections} activeId={activeId} />

                        <div className="flex-1 min-w-0 max-w-[42rem]">
                            {sections.map((s, i) => (
                                <section
                                    key={s.id}
                                    id={s.id}
                                    className={cn(
                                        'scroll-mt-28',
                                        i > 0 && 'mt-16 pt-16 border-t border-slate-100'
                                    )}
                                >
                                    <h2 className="font-montserrat text-[26px] lg:text-[30px] font-extrabold text-slate-900 tracking-[-0.02em] leading-[1.15] mb-6">
                                        {s.title}
                                    </h2>
                                    <div className="prose-page">{s.body}</div>
                                </section>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[42rem] prose-page">{children}</div>
                )}
            </div>

            {!hideContactBand && <ContactBand />}
        </div>
    );
};

/** Sol sütundaki yapışkan içindekiler. */
const TableOfContents: React.FC<{ sections: Section[]; activeId: string }> = ({
    sections, activeId,
}) => (
    <nav className="lg:w-64 shrink-0" aria-label="İçindekiler">
        <div className="lg:sticky lg:top-28">
            <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-5">
                Bu sayfada
            </p>
            <ol className="relative border-l border-slate-200">
                {sections.map(s => {
                    const active = activeId === s.id;
                    return (
                        <li key={s.id} className="relative">
                            {/* Aktif bölümün yanındaki dolu çubuk */}
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute -left-px top-1 bottom-1 w-[2px] rounded-full transition-all duration-300',
                                    active ? 'bg-brand-600 opacity-100' : 'opacity-0'
                                )}
                            />
                            <a
                                href={`#${s.id}`}
                                className={cn(
                                    'block pl-5 pr-2 py-2 text-[13.5px] leading-snug transition-colors duration-200',
                                    active
                                        ? 'text-brand-800 font-semibold'
                                        : 'text-slate-500 hover:text-slate-900'
                                )}
                            >
                                {s.title}
                            </a>
                        </li>
                    );
                })}
            </ol>
        </div>
    </nav>
);

/**
 * Sayfa başlığı bandı.
 *
 * Koyu marka zemin, logonun fontuyla büyük başlık. Ayrı export edilmesinin
 * sebebi İletişim ve Yardım gibi bölüm listesi olmayan sayfaların da birebir
 * aynı bandı kullanması.
 */
export const PageHeader: React.FC<{
    title: string;
    lead?: React.ReactNode;
    updatedAt?: string;
    /** Başlığın altına giren ek içerik (ör. arama kutusu) */
    children?: React.ReactNode;
}> = ({ title, lead, updatedAt, children }) => (
    <header className="relative overflow-hidden bg-brand-900">
        {/* Zemine derinlik veren iki yumuşak ışık — düz renk düz duruyor */}
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_-10%,rgba(74,165,160,0.35),transparent_55%),radial-gradient(90%_90%_at_-10%_110%,rgba(18,74,74,0.6),transparent_60%)]"
        />

        <div className="container relative px-4 pt-14 pb-16 lg:pt-20 lg:pb-24">
            <nav className="text-[13px] mb-7">
                <Link to="/" className="text-brand-200 hover:text-white transition-colors">
                    Ana sayfa
                </Link>
                <span className="mx-2.5 text-brand-500">/</span>
                <span className="text-white/80">{title}</span>
            </nav>

            <h1 className="font-montserrat text-[38px] sm:text-[46px] lg:text-[56px] font-extrabold text-white tracking-[-0.03em] leading-[1.02] max-w-4xl">
                {title}
            </h1>

            {lead && (
                <p className="text-[17px] lg:text-[19px] text-brand-100 mt-6 max-w-2xl leading-[1.65]">
                    {lead}
                </p>
            )}

            {updatedAt && (
                <p className="inline-block text-[12.5px] font-medium text-brand-100 border border-brand-600 rounded-full px-4 py-1.5 mt-8">
                    Yürürlük tarihi: {updatedAt}
                </p>
            )}

            {children}
        </div>
    </header>
);

/** Sayfaların altındaki ortak iletişim şeridi. */
export const ContactBand: React.FC = () => (
    <section className="border-t border-slate-200 bg-slate-50">
        <div className="container px-4 py-14 lg:py-16">
            <div className="max-w-3xl">
                <h2 className="font-montserrat text-[24px] lg:text-[28px] font-extrabold text-slate-900 tracking-[-0.02em]">
                    Sorunuz mu var?
                </h2>
                <p className="text-[16px] text-slate-600 mt-3 leading-[1.7] max-w-xl">
                    Yardım merkezinde aradığınızı bulamazsanız doğrudan yazın. Mesajınıza
                    talep numarası verilir, en geç iki iş günü içinde dönüş yapılır.
                </p>
                <div className="flex flex-wrap gap-3 mt-7">
                    <Link
                        to="/contact"
                        className="h-11 px-7 leading-[44px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                    >
                        İletişime geç
                    </Link>
                    <Link
                        to="/help"
                        className="h-11 px-7 leading-[42px] rounded-lg border border-slate-300 bg-white hover:border-brand-400 hover:text-brand-800 text-slate-700 text-sm font-semibold transition-colors"
                    >
                        Yardım merkezi
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

/**
 * Metin bölümlerinde tekrar eden paragraf stili.
 *
 * Bölümün ilk paragrafı bir tık büyük — editoryal sayfalarda girişi ayıran
 * klasik yöntem, ayrı bir bileşen gerektirmiyor.
 */
export const P: React.FC<{ children: React.ReactNode; lead?: boolean }> = ({ children, lead }) => (
    <p className={cn(
        'mb-5 last:mb-0',
        lead
            ? 'text-[18px] text-slate-800 leading-[1.7]'
            : 'text-[16px] text-slate-600 leading-[1.8]'
    )}>
        {children}
    </p>
);

/** Madde listesi. */
export const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className="mb-6 space-y-3">
        {items.map((item, i) => (
            <li key={i} className="text-[16px] text-slate-600 leading-[1.8] pl-6 relative">
                <span className="absolute left-0 top-[13px] w-2.5 h-[2px] rounded-full bg-brand-500" />
                {item}
            </li>
        ))}
    </ul>
);

/** Numaralı liste — adım anlatımlarında. */
export const OL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ol className="mb-6 space-y-4">
        {items.map((item, i) => (
            <li key={i} className="text-[16px] text-slate-600 leading-[1.8] pl-10 relative">
                <span className="absolute left-0 top-0.5 font-montserrat text-[13px] font-extrabold text-brand-700 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                </span>
                {item}
            </li>
        ))}
    </ol>
);

/** Ara başlık. */
export const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="font-montserrat text-[16px] font-extrabold text-slate-900 tracking-tight mt-10 mb-3 first:mt-0">
        {children}
    </h3>
);

/** Vurgulanması gereken not. */
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <aside className="my-7 rounded-xl bg-brand-50 border border-brand-100 px-6 py-5">
        <p className="text-[15px] text-brand-950 leading-[1.75]">{children}</p>
    </aside>
);

/**
 * Öne çıkan sayılar.
 *
 * Metin içindeki kritik rakamı (gelir payı, süre, oran) okumadan görülebilir
 * hale getirir.
 */
export const Stats: React.FC<{ items: Array<{ value: string; label: string }> }> = ({ items }) => (
    <div className="my-8 grid gap-8 sm:grid-cols-3 border-y border-slate-200 py-7">
        {items.map(item => (
            <div key={item.label}>
                <div className="font-montserrat text-[30px] font-extrabold text-brand-800 tracking-[-0.03em] leading-none">
                    {item.value}
                </div>
                <div className="text-[13.5px] text-slate-500 mt-2.5 leading-snug">{item.label}</div>
            </div>
        ))}
    </div>
);

/** Basit veri tablosu. */
export const Table: React.FC<{
    head: string[];
    rows: React.ReactNode[][];
    /** Son satırı sonuç/toplam gibi vurgula */
    emphasizeLast?: boolean;
}> = ({ head, rows, emphasizeLast }) => (
    <div className="my-7 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[15px] min-w-[440px]">
            <thead>
                <tr className="bg-brand-900 text-left">
                    {head.map(h => (
                        <th
                            key={h}
                            className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-100 px-5 py-3.5 whitespace-nowrap"
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
                            emphasizeLast && i === rows.length - 1
                                ? 'bg-brand-50'
                                : 'bg-white'
                        )}
                    >
                        {r.map((cell, j) => (
                            <td
                                key={j}
                                className={cn(
                                    'px-5 py-3.5 align-top leading-relaxed',
                                    j === 0 ? 'font-semibold text-slate-900' : 'text-slate-600',
                                    emphasizeLast && i === rows.length - 1 && 'text-brand-900 font-semibold'
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

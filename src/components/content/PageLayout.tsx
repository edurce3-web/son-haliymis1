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

            <div className="container px-5 sm:px-8 py-14 lg:py-20 max-w-[1140px]">
                {sections?.length ? (
                    <div className="flex flex-col lg:flex-row gap-14 lg:gap-20">
                        <TableOfContents sections={sections} activeId={activeId} />

                        <div className="flex-1 min-w-0">
                            {sections.map((s, i) => (
                                <section
                                    key={s.id}
                                    id={s.id}
                                    className={cn('scroll-mt-28', i > 0 && 'mt-20')}
                                >
                                    <h2 className="font-montserrat text-[26px] lg:text-[32px] font-extrabold text-[#111827] tracking-[-0.025em] leading-[1.12] mb-6">
                                        {s.title}
                                    </h2>
                                    <div className="prose-page">{s.body}</div>
                                </section>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[46rem] mx-auto prose-page">{children}</div>
                )}
            </div>

            {!hideContactBand && <ContactBand />}
        </div>
    );
};

/** Sol sütundaki yapışkan içindekiler: çizgisiz, seçili bölüm yeşil zeminde. */
const TableOfContents: React.FC<{ sections: Section[]; activeId: string }> = ({
    sections, activeId,
}) => (
    <nav className="lg:w-60 shrink-0" aria-label="İçindekiler">
        <div className="lg:sticky lg:top-28">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF] mb-3 px-3">
                Bu sayfada
            </p>
            <ol className="space-y-0.5">
                {sections.map(s => {
                    const active = activeId === s.id;
                    return (
                        <li key={s.id}>
                            <a
                                href={`#${s.id}`}
                                className={cn(
                                    'block rounded-xl px-3 py-2 text-[14px] leading-snug transition-colors duration-200',
                                    active
                                        ? 'bg-[#EEFBF3] text-[#1B7A43] font-bold'
                                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F6F8]'
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
 * Sayfa başlığı.
 *
 * Kenarlardan içeri çekilmiş, köşeleri yuvarlak açık gri bir yüzey; sağ
 * kenarında logonun nane renginde büyük, yumuşak bir şekil. Desen, çizgi ve
 * gradyan yok. İletişim ve Yardım gibi bölüm listesi olmayan sayfalar da
 * aynı başlığı kullanıyor.
 */
export const PageHeader: React.FC<{
    title: string;
    lead?: React.ReactNode;
    updatedAt?: string;
    /** Başlığın üstündeki küçük etiket */
    eyebrow?: string;
    /** Başlığın altına giren ek içerik (ör. arama kutusu) */
    children?: React.ReactNode;
}> = ({ title, lead, updatedAt, eyebrow, children }) => (
    <div className="px-3 sm:px-4 pt-3 sm:pt-4">
        <header className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#F5F6F8]">
            <div aria-hidden className="absolute -right-24 -top-24 w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-[38%] bg-[#B2F0C8] rotate-12" />
            <div aria-hidden className="absolute right-[12%] bottom-[-120px] w-[220px] h-[220px] rounded-full bg-white/70 hidden md:block" />

            <div className="container relative px-5 sm:px-10 pt-10 pb-12 lg:pt-14 lg:pb-16 max-w-[1140px]">
                <nav className="text-[13px] font-medium mb-8 sm:mb-10">
                    <Link to="/" className="text-[#6B7280] hover:text-[#111827] transition-colors">
                        Ana sayfa
                    </Link>
                    <span className="mx-2 text-[#9CA3AF]">/</span>
                    <span className="text-[#111827]">{title}</span>
                </nav>

                {eyebrow && (
                    <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43] mb-3">{eyebrow}</p>
                )}

                <h1 className="font-montserrat text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold text-[#111827] tracking-[-0.035em] leading-[1.02] max-w-[16ch]">
                    {title}
                </h1>

                {lead && (
                    <p className="text-[17px] lg:text-[19px] text-[#4B5563] mt-5 max-w-[46ch] leading-[1.65]">
                        {lead}
                    </p>
                )}

                {updatedAt && (
                    <p className="inline-flex items-center h-9 text-[13px] font-semibold text-[#111827] bg-white rounded-full px-4 mt-7">
                        Yürürlük tarihi: {updatedAt}
                    </p>
                )}

                {children}
            </div>
        </header>
    </div>
);

/** Sayfaların altındaki ortak iletişim şeridi. */
export const ContactBand: React.FC = () => (
    <section className="px-3 sm:px-4 pb-14">
        <div className="rounded-[28px] sm:rounded-[36px] bg-[#B2F0C8]">
            <div className="container max-w-[1140px] px-6 sm:px-10 py-12 lg:py-14 flex flex-col md:flex-row md:items-center justify-between gap-7">
                <div className="max-w-xl">
                    <h2 className="font-montserrat text-[26px] lg:text-[32px] font-extrabold text-[#111827] tracking-[-0.025em] leading-tight">
                        Sorunuz mu var?
                    </h2>
                    <p className="text-[16px] text-[#1F2937]/80 mt-3 leading-[1.7]">
                        Yardım merkezinde aradığınızı bulamazsanız doğrudan yazın. Mesajınıza
                        talep numarası verilir ve 48 saat içinde yanıtlanır.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                    <Link
                        to="/contact"
                        className="h-12 px-7 inline-flex items-center rounded-2xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[15px] font-bold transition-colors"
                    >
                        İletişime geç
                    </Link>
                    <Link
                        to="/help"
                        className="h-12 px-7 inline-flex items-center rounded-2xl bg-white/70 hover:bg-white text-[#111827] text-[15px] font-bold transition-colors"
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
    <aside className="my-7 rounded-2xl bg-[#EEFBF3] px-6 py-5">
        <p className="text-[15px] text-[#134D30] leading-[1.75]">{children}</p>
    </aside>
);

/**
 * Öne çıkan sayılar.
 *
 * Metin içindeki kritik rakamı (gelir payı, süre, oran) okumadan görülebilir
 * hale getirir.
 */
export const Stats: React.FC<{ items: Array<{ value: string; label: string }> }> = ({ items }) => (
    <div className="my-8 grid gap-3 sm:grid-cols-3">
        {items.map(item => (
            <div key={item.label} className="rounded-2xl bg-[#F5F6F8] p-5">
                <div className="font-montserrat text-[30px] font-extrabold text-[#1B7A43] tracking-[-0.03em] leading-none">
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
    <div className="my-7 overflow-x-auto rounded-2xl bg-[#F5F6F8] p-1.5">
        <table className="w-full text-[15px] min-w-[440px] bg-white rounded-xl overflow-hidden">
            <thead>
                <tr className="bg-[#F5F6F8] text-left">
                    {head.map(h => (
                        <th
                            key={h}
                            className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600 px-5 py-3.5 whitespace-nowrap"
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

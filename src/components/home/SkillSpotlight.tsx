import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
    ChevronLeft, ChevronRight, ArrowRight, GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/** Kategori ağacındaki `icon` alanı lucide bileşen adı tutuyor. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
};

/**
 * Koyu kategori vitrini.
 *
 * Sayfanın ortasında duran koyu bir blok: üstündeki ve altındaki beyaz kurs
 * ızgaralarını ayırıyor, böylece sayfa tek bir uzun beyaz şerit gibi
 * görünmüyor. İçerik kategori ağacından geliyor — isim, açıklama, uzmanlık
 * dalları ve gerçek kurs sayısı.
 *
 * Sekiz kartın hepsi DOM'da duruyor ve yatay kaydırılıyor; sayfalayıp
 * gizlemek, görünmeyen kategorilerin bağlantılarını da yok etmek olurdu.
 */
export const SkillSpotlight: React.FC = () => {
    const { data } = useCategoryNav();
    const categories = data?.categories || [];

    const railRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);
    const [progress, setProgress] = useState(0);

    const update = () => {
        const el = railRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < max - 4);
        setProgress(max > 0 ? el.scrollLeft / max : 0);
    };

    useEffect(() => {
        const el = railRef.current;
        if (!el) return;
        update();
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [categories.length]);

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
    };

    if (categories.length === 0) return null;

    const dots = 3;
    const activeDot = Math.min(dots - 1, Math.round(progress * (dots - 1)));

    return (
        <section className="relative w-full py-16 lg:py-20 bg-brand-950 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -top-40 -left-28 w-[520px] h-[520px] bg-brand-500/25 rounded-full blur-[150px]" />
                <div className="absolute -bottom-44 right-[-6rem] w-[560px] h-[560px] bg-emerald-500/10 rounded-full blur-[150px]" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),'
                            + 'linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="container relative px-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-11">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-200 backdrop-blur-md">
                            <GraduationCap className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                                Uzmanlık alanları
                            </span>
                        </div>

                        <h2 className="font-montserrat text-[28px] lg:text-[36px] font-extrabold text-white tracking-tight leading-[1.14] mt-4">
                            Hangi alanda{' '}
                            <span className="bg-gradient-to-r from-brand-300 via-emerald-300 to-brand-200 bg-clip-text text-transparent">
                                derinleşmek
                            </span>{' '}
                            istersin?
                        </h2>

                        <p className="text-[14.5px] lg:text-[15.5px] text-brand-100/70 leading-relaxed mt-4">
                            Sekiz ana alan, yüzlerce uzmanlık dalı. Her alanın altındaki
                            dallara inip tam olarak aradığın konuyu bulabilirsin.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => scroll(-1)}
                            disabled={!canLeft}
                            aria-label="Önceki alanlar"
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-25 disabled:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1.5 px-1" aria-hidden>
                            {Array.from({ length: dots }).map((_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'rounded-full transition-all duration-300',
                                        i === activeDot
                                            ? 'w-7 h-2 bg-emerald-400'
                                            : 'w-2 h-2 bg-white/25'
                                    )}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => scroll(1)}
                            disabled={!canRight}
                            aria-label="Sonraki alanlar"
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-25 disabled:hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div
                    ref={railRef}
                    className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {categories.map(cat => {
                        const Icon = (cat.icon && ICONS[cat.icon]) || Sparkles;

                        return (
                            <article
                                key={cat.slug}
                                className="group snap-start shrink-0 w-[286px] sm:w-[310px] flex flex-col rounded-3xl bg-white/[0.06] border border-white/10 hover:border-emerald-400/40 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.09]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/40 to-brand-700/40 border border-white/15 flex items-center justify-center shrink-0">
                                        <Icon className="w-6 h-6 text-emerald-300" />
                                    </span>
                                    {cat.count > 0 && (
                                        <span className="text-[11px] font-bold text-brand-200/80 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 shrink-0 tabular-nums">
                                            {cat.count} kurs
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-[17px] font-bold text-white leading-snug mt-4 group-hover:text-emerald-200 transition-colors">
                                    {cat.name}
                                </h3>

                                {cat.description && (
                                    <p className="text-[12.5px] text-brand-100/60 leading-[1.65] mt-2 line-clamp-3">
                                        {cat.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {cat.subcategories.slice(0, 4).map(sub => (
                                        <Link
                                            key={sub.slug}
                                            to={`/courses/${cat.slug}/${sub.slug}`}
                                            className="px-2.5 py-1 rounded-lg bg-brand-950/50 border border-white/10 text-brand-100/80 text-[11px] hover:border-emerald-400/50 hover:text-white transition-colors"
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                    {cat.subcategories.length > 4 && (
                                        <span className="px-2.5 py-1 rounded-lg text-brand-200/50 text-[11px]">
                                            +{cat.subcategories.length - 4}
                                        </span>
                                    )}
                                </div>

                                <Link
                                    to={`/courses/${cat.slug}`}
                                    className="mt-5 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white/10 border border-white/15 text-white text-[13px] font-bold hover:bg-emerald-400 hover:text-emerald-950 hover:border-emerald-400 transition-colors"
                                >
                                    Alanı keşfet
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SkillSpotlight;

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, ChevronRight,
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/** Kategori ağacındaki `icon` alanı lucide bileşen adı tutuyor. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
};

const CategoryIcon: React.FC<{ name?: string | null }> = ({ name }) => {
    const Icon = (name && ICONS[name]) || Sparkles;
    return <Icon className="w-[18px] h-[18px] text-brand-700" />;
};

/**
 * Kategori keşif bloğu.
 *
 * Üstte kategori sekmeleri, altında seçilenin alt dalları. Fareyle üzerine
 * gelmek de seçiyor: ziyaretçi tıklamadan önce içeriğe göz atabilsin.
 *
 * Hem misafir hem üye sayfasında kullanılıyor; yalnızca sayfadaki yeri
 * değişiyor. Misafirde keşif birincil olduğu için yukarıda, üyede ikincil
 * olduğu için en altta.
 */
export const CategoryExplorer: React.FC<{
    title?: string;
    /**
     * Sayfanın kendi kabının içinde çizilirken: dış kap ve boşluk eklenmez,
     * başlık raf başlıklarıyla aynı yazıtipini alır.
     */
    bare?: boolean;
}> = ({
    title = 'Ne öğrenmek istersin?',
    bare,
}) => {
    const { data } = useCategoryNav();
    const categories = data?.categories || [];
    const [active, setActive] = useState<string | null>(null);

    const shown = useMemo(
        () => categories.find(c => c.slug === active) || categories[0] || null,
        [categories, active]
    );

    if (categories.length === 0) return null;

    return (
        <section className={bare ? 'font-jakarta' : 'container px-4 pt-10 pb-4'}>
            <h2
                className={
                    bare
                        ? 'text-[20px] sm:text-[24px] leading-8 font-extrabold text-[#131b2e] tracking-tight mb-3'
                        : 'text-2xl font-bold text-slate-900 tracking-tight mb-4'
                }
            >
                {title}
            </h2>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map(cat => {
                    const isActive = shown?.slug === cat.slug;
                    return (
                        <button
                            key={cat.slug}
                            onClick={() => setActive(cat.slug)}
                            onMouseEnter={() => setActive(cat.slug)}
                            className={cn(
                                'shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap shadow-sm',
                                isActive
                                    ? 'bg-[#005c55] text-white'
                                    : 'bg-white text-[#3e4947] hover:text-[#131b2e] hover:bg-[#eaedff]'
                            )}
                        >
                            {cat.name}
                        </button>
                    );
                })}
            </div>

            {shown && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                <CategoryIcon name={shown.icon} />
                            </span>
                            <h3 className="text-[15.5px] font-bold text-slate-900 truncate">
                                {shown.name} alt başlıkları
                            </h3>
                            <span className="shrink-0 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 whitespace-nowrap">
                                {shown.subcategories.length} uzmanlık alanı · {shown.count} kurs
                            </span>
                        </div>

                        <Link
                            to={`/courses/${shown.slug}`}
                            className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-700 hover:gap-2 transition-all shrink-0"
                        >
                            Kategoriye git <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {shown.subcategories.map(sub => (
                            <Link
                                key={sub.slug}
                                to={`/courses/${shown.slug}/${sub.slug}`}
                                className="group flex items-center justify-between gap-2 bg-slate-50 hover:bg-brand-50 rounded-xl px-3.5 py-3 transition-all hover:translate-x-0.5"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <ChevronRight className="w-3.5 h-3.5 text-brand-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    <span className="text-[13.5px] font-medium text-slate-800 truncate">
                                        {sub.name}
                                    </span>
                                </span>
                                {sub.count > 0 && (
                                    <span className="shrink-0 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 tabular-nums">
                                        {sub.count} kurs
                                    </span>
                                )}
                            </Link>
                        ))}
                        {shown.subcategories.length === 0 && (
                            <p className="text-sm text-slate-400 col-span-full py-2">
                                Bu kategoride henüz alt dal yok.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default CategoryExplorer;

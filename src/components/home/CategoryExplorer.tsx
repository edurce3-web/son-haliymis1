import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav } from '@/hooks/useCategoryNav';

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
export const CategoryExplorer: React.FC<{ title?: string }> = ({
    title = 'Ne öğrenmek istersin?',
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
        <section className="container px-4 pt-10 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">{title}</h2>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map(cat => {
                    const isActive = shown?.slug === cat.slug;
                    return (
                        <button
                            key={cat.slug}
                            onClick={() => setActive(cat.slug)}
                            onMouseEnter={() => setActive(cat.slug)}
                            className={cn(
                                'shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all whitespace-nowrap',
                                isActive
                                    ? 'bg-brand-700 text-white border-brand-700'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-800'
                            )}
                        >
                            {cat.name}
                        </button>
                    );
                })}
            </div>

            {shown && (
                <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-6 lg:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{shown.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {shown.subcategories.length} uzmanlık dalı · {shown.count} kurs
                            </p>
                        </div>
                        <Link
                            to={`/courses/${shown.slug}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                        >
                            Kategoriye git <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {shown.subcategories.map(sub => (
                            <Link
                                key={sub.slug}
                                to={`/courses/${shown.slug}/${sub.slug}`}
                                className="group flex items-center justify-between gap-2 bg-white border border-brand-100 rounded-lg px-3.5 py-2.5 hover:border-brand-400 hover:shadow-sm transition-all"
                            >
                                <span className="text-sm text-slate-700 group-hover:text-brand-800 truncate">
                                    {sub.name}
                                </span>
                                {sub.count > 0 && (
                                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                                        {sub.count}
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

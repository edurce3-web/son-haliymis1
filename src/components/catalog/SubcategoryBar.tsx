import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavCategory } from '@/hooks/useCategoryNav';

interface Props {
    category: NavCategory;
    activeSubcategorySlug?: string | null;
    categoryHref: string;
    subcategoryHref: (slug: string) => string;
}

/**
 * Kategori başlığı + alt kategoriler, tek satır yatay çubuk.
 *
 * Alt kategoriler hem burada hem yan çubukta duruyor: burası hızlı geçiş için
 * (en çok kullanılan hareket), yan çubuk ise kategoriler arası gezinme için.
 * Sığmayan alt kategoriler yatay kaydırmayla ulaşılır; taşma olduğunda
 * kenarlarda ok düğmeleri belirir.
 */
export const SubcategoryBar: React.FC<Props> = ({
    category,
    activeSubcategorySlug,
    categoryHref,
    subcategoryHref,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        updateArrows();
        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);
        return () => {
            el.removeEventListener('scroll', updateArrows);
            window.removeEventListener('resize', updateArrows);
        };
    }, [category.id]);

    const scrollBy = (delta: number) => {
        scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
    };

    if (category.subcategories.length === 0) return null;

    return (
        <div className="relative bg-white border border-slate-200 rounded-xl mb-6 flex items-stretch overflow-hidden">
            {/* Kategori adı — sağ kenarı çentikli, alt kategorilere "akıyor" */}
            <Link
                to={categoryHref}
                className={cn(
                    'shrink-0 flex items-center pl-5 pr-6 font-bold text-[15px] transition-colors',
                    !activeSubcategorySlug
                        ? 'text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                )}
            >
                {category.name}
            </Link>

            <span className="shrink-0 self-center text-slate-300 select-none">
                <ChevronRight className="w-4 h-4" />
            </span>

            {canScrollLeft && (
                <>
                    <div className="absolute left-[var(--fade-left,0)] pointer-events-none" />
                    <button
                        onClick={() => scrollBy(-260)}
                        aria-label="Sola kaydır"
                        className="absolute left-0 top-0 bottom-0 z-10 w-9 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                </>
            )}

            <div
                ref={scrollRef}
                className="flex-1 flex items-center gap-1 overflow-x-auto py-2.5 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {category.subcategories.map(sub => {
                    const active = activeSubcategorySlug === sub.slug;
                    return (
                        <Link
                            key={sub.id}
                            to={subcategoryHref(sub.slug)}
                            className={cn(
                                'shrink-0 px-3.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                                active
                                    ? 'bg-slate-900 text-white font-medium'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            {sub.name}
                            {sub.count > 0 && (
                                <span className={cn(
                                    'ml-1.5 text-[11px] tabular-nums',
                                    active ? 'text-white/60' : 'text-slate-400'
                                )}>
                                    {sub.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {canScrollRight && (
                <button
                    onClick={() => scrollBy(260)}
                    aria-label="Sağa kaydır"
                    className="absolute right-0 top-0 bottom-0 z-10 w-9 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent"
                >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            )}
        </div>
    );
};

export default SubcategoryBar;

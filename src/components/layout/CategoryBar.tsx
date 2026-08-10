import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/**
 * Header'ın hemen altındaki kategori şeridi.
 *
 * Solda içinde bulunulan kategori, sağında alt kategorileri. Yalnızca
 * /courses/:kategori adreslerinde görünür.
 *
 * Rota parametrelerini useParams ile alamıyoruz: bu bileşen <Routes> dışında,
 * yerleşim katmanında duruyor. Bu yüzden yol doğrudan çözümleniyor.
 */
const matchCategoryRoute = (pathname: string) => {
    const m = pathname.match(/^\/courses\/([^/?#]+)(?:\/([^/?#]+))?\/?$/);
    if (!m) return null;
    return { categorySlug: decodeURIComponent(m[1]), subcategorySlug: m[2] ? decodeURIComponent(m[2]) : null };
};

export const CategoryBar: React.FC = () => {
    const { pathname } = useLocation();
    const { data } = useCategoryNav();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const route = matchCategoryRoute(pathname);
    const category = route
        ? (data?.categories || []).find(c => c.slug === route.categorySlug) || null
        : null;

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
    }, [category?.id]);

    // Seçili alt kategori görünür alanın dışındaysa ona kaydır
    useEffect(() => {
        if (!route?.subcategorySlug) return;
        const el = scrollRef.current?.querySelector<HTMLElement>('[data-active="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [route?.subcategorySlug, category?.id]);

    if (!category || category.subcategories.length === 0) return null;

    const scrollBy = (delta: number) => {
        scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
    };

    return (
        <div className="hidden md:block bg-white border-b border-slate-200">
            <div className="container px-4">
                <div className="relative flex items-stretch h-12">

                    {/* Kategori adı — alt kategorilere doğru "akan" başlık */}
                    <Link
                        to={`/courses/${category.slug}`}
                        className={cn(
                            'shrink-0 flex items-center pr-4 text-[15px] font-bold transition-colors',
                            !route?.subcategorySlug
                                ? 'text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                        )}
                    >
                        {category.name}
                    </Link>

                    <span className="shrink-0 self-center text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                    </span>

                    {/* Kaydırma okları bu sarmalayıcıya göre konumlanır ki
                        soldaki ok kategori adının üstüne binmesin */}
                    <div className="relative flex-1 min-w-0">
                        {canScrollLeft && (
                            <button
                                onClick={() => scrollBy(-280)}
                                aria-label="Sola kaydır"
                                className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-start bg-gradient-to-r from-white via-white to-transparent"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                            </button>
                        )}

                        <div
                            ref={scrollRef}
                            className="h-full flex items-center gap-1 overflow-x-auto px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                            {category.subcategories.map(sub => {
                                const active = route?.subcategorySlug === sub.slug;
                                return (
                                    <Link
                                        key={sub.id}
                                        to={`/courses/${category.slug}/${sub.slug}`}
                                        data-active={active}
                                        className={cn(
                                            'shrink-0 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                                            active
                                                ? 'bg-slate-900 text-white font-medium'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        )}
                                    >
                                        {sub.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {canScrollRight && (
                            <button
                                onClick={() => scrollBy(280)}
                                aria-label="Sağa kaydır"
                                className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-end bg-gradient-to-l from-white via-white to-transparent"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryBar;

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShelfCourseCard, { ShelfBadge } from './ShelfCourseCard';

/**
 * Kurs rafı — başlık, açıklama ve kart ızgarası.
 *
 * Izgara yatay kaydırılıyor ama kartlar satır düzeninde duruyor: dar
 * ekranda tek tek kayıyor, geniş ekranda dört ya da beş kart yan yana
 * sığıyor ve ok düğmeleri sönükleşiyor. Böylece aynı bileşen hem "sizin
 * için önerilenler" gibi kısa raflarda hem de kategori raflarında
 * çalışıyor.
 *
 * Oklar yalnızca kaydırılacak yer varken etkin; her rafın altına çalışmayan
 * iki düğme koymak, raf kısa olduğunda kullanıcıyı boşa tıklatıyordu.
 */
export const ShelfSection: React.FC<{
    title: string;
    subtitle?: string;
    /** Başlığın yanındaki küçük rozet — "Editör seçimi", "%100 Türkçe" gibi. */
    chip?: { text: string; icon?: React.ReactNode };
    href?: string;
    hrefLabel?: string;
    courses: any[];
    loading?: boolean;
    /** Geniş ekranda yan yana kaç kart duracak. */
    columns?: 4 | 5 | 6;
    /**
     * Verilirse raf kaymıyor, bu kadar satırlık sabit ızgara oluyor.
     * Kategori raflarında iki satır: kullanıcı on iki kursu kaydırmadan
     * görüyor, devamı "Tümünü gör"de. Ok düğmeleri bu kipte çizilmiyor.
     */
    rows?: number;
    compactCards?: boolean;
    /** Kayıtlı olunan kurslar: kartta fiyat yerine ilerleme çıkar. */
    owned?: boolean;
    badgeFor?: (course: any, index: number) => ShelfBadge;
    emptyText?: string;
}> = ({
    title,
    subtitle,
    chip,
    href,
    hrefLabel = 'Tümünü gör',
    courses,
    loading,
    columns = 4,
    rows,
    compactCards,
    owned,
    badgeFor,
    emptyText,
}) => {
    const railRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const update = () => {
        const el = railRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
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
    }, [courses.length, loading]);

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
    };

    if (!loading && courses.length === 0 && !emptyText) return null;

    // Kart genişliği sütun sayısına göre; aradaki boşluk da hesaba katılıyor.
    const cardWidth = columns === 6
        ? 'w-[196px] sm:w-[204px] lg:w-[calc((100%-5*1rem)/6)]'
        : columns === 5
            ? 'w-[228px] sm:w-[236px] lg:w-[calc((100%-4*1rem)/5)]'
            : 'w-[262px] sm:w-[272px] lg:w-[calc((100%-3*1.25rem)/4)]';

    const isGrid = Boolean(rows && rows > 0);
    /*
     * Izgara yalnızca geniş ekranda. Dar ekranda aynı kartlar yatay kayan
     * tek satıra diziliyor: iki sütunlu ızgarada on iki kurs altı satır
     * oluyor ve sayfa kurs listesine dönüşüyordu.
     */
    const gridCols = columns === 6
        ? 'lg:grid-cols-6'
        : columns === 5
            ? 'lg:grid-cols-5'
            : 'lg:grid-cols-4';
    const mobileItem = 'w-[196px] sm:w-[220px] shrink-0 snap-start lg:w-auto';
    const gridItems = isGrid ? courses.slice(0, columns * (rows || 1)) : courses;

    return (
        <section className="w-full font-jakarta">
            {/* Başlık satırı tasarımdan birebir: Plus Jakarta Sans, 24/32
                ekstra kalın, rozet başlığın yanında, açıklama altında. */}
            <div className="flex items-center justify-between gap-4 pb-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[20px] sm:text-[24px] leading-8 font-extrabold text-[#131b2e] tracking-tight">
                            {title}
                        </h2>
                        {chip && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#005c55]/10 text-[#005c55] text-[11px] leading-[14px] font-bold">
                                {chip.icon}
                                {chip.text}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-[14px] leading-5 text-[#3e4947] mt-0.5">{subtitle}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {href && (
                        <Link
                            to={href}
                            className="hidden sm:inline-flex items-center gap-1 text-[14px] leading-5 font-semibold text-[#005c55] hover:text-[#0f766e] transition-colors"
                        >
                            {hrefLabel}
                            <ArrowRight className="w-[18px] h-[18px]" />
                        </Link>
                    )}

                    <div className={cn('hidden items-center gap-1.5 ml-2', !isGrid && 'md:flex')}>
                        <button
                            type="button"
                            onClick={() => scroll(-1)}
                            disabled={!canLeft}
                            aria-label="Önceki"
                            className="w-9 h-9 rounded-full bg-white text-[#3e4947] shadow-sm flex items-center justify-center hover:text-[#131b2e] hover:bg-[#eaedff] disabled:opacity-35 disabled:hover:bg-white transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll(1)}
                            disabled={!canRight}
                            aria-label="Sonraki"
                            className="w-9 h-9 rounded-full bg-white text-[#3e4947] shadow-sm flex items-center justify-center hover:text-[#131b2e] hover:bg-[#eaedff] disabled:opacity-35 disabled:hover:bg-white transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {!loading && courses.length === 0 ? (
                <p className="text-[14px] text-slate-500 py-6">{emptyText}</p>
            ) : isGrid ? (
                <div
                    className={cn(
                        'flex gap-4 pt-3 pb-2 overflow-x-auto snap-x -mx-1 px-1',
                        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                        'lg:grid lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0',
                        gridCols
                    )}
                >
                    {loading
                        ? Array.from({ length: columns * (rows || 1) }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(mobileItem, 'bg-white rounded-lg overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(19,27,46,0.08)]')}
                            >
                                <div className="aspect-video bg-[#e2e7ff]" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3.5 bg-[#eaedff] rounded w-full" />
                                    <div className="h-3.5 bg-[#eaedff] rounded w-3/5" />
                                    <div className="h-3 bg-[#eaedff] rounded w-2/5 mt-3" />
                                    <div className="h-5 bg-[#eaedff] rounded w-1/3 mt-3" />
                                </div>
                            </div>
                        ))
                        : gridItems.map((course, i) => (
                            <div key={course.id ?? course.course_id} className={mobileItem}>
                                <ShelfCourseCard
                                    course={course}
                                    compact={compactCards}
                                    owned={owned}
                                    badge={badgeFor ? badgeFor(course, i) : undefined}
                                />
                            </div>
                        ))}
                </div>
            ) : (
                <div
                    ref={railRef}
                    className={cn(
                        'flex overflow-x-auto overflow-y-visible pt-3 pb-2 -mx-1 px-1 snap-x',
                        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                        columns === 4 ? 'gap-5' : 'gap-4'
                    )}
                >
                    {loading
                        ? Array.from({ length: columns }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(cardWidth, 'shrink-0 ', 'bg-white rounded-lg overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(19,27,46,0.08)]')}
                            >
                                <div className="aspect-video bg-[#e2e7ff]" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3.5 bg-[#eaedff] rounded w-full" />
                                    <div className="h-3.5 bg-[#eaedff] rounded w-3/5" />
                                    <div className="h-3 bg-[#eaedff] rounded w-2/5 mt-3" />
                                    <div className="h-5 bg-[#eaedff] rounded w-1/3 mt-3" />
                                </div>
                            </div>
                        ))
                        : courses.map((course, i) => (
                            <div
                                key={course.id ?? course.course_id}
                                className={cn(cardWidth, 'shrink-0 snap-start')}
                            >
                                <ShelfCourseCard
                                    course={course}
                                    compact={compactCards}
                                    owned={owned}
                                    badge={badgeFor ? badgeFor(course, i) : undefined}
                                />
                            </div>
                        ))}
                </div>
            )}
        </section>
    );
};

export default ShelfSection;

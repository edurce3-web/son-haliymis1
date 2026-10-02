import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';

/**
 * Yatay kaydırmalı kurs rafı.
 *
 * Ana sayfanın yapı taşı: hem misafir vitrininde hem üye panelinde aynı raf
 * kullanılıyor. Kart olarak platformun her yerindeki CourseCard'ı alıyor;
 * ana sayfaya özel bir kart, kataloğa göre farklı görünen bir kurs demekti.
 *
 * Alt başlık (`reason`) isteğe bağlı ama öneri şeritlerinde önemli: kullanıcı
 * bir kursun neden karşısına çıktığını görebilmeli. "Sizin için seçtik" diyen
 * açıklamasız bir liste ne güven veriyor ne de düzeltilebiliyor.
 */
export const CourseRail: React.FC<{
    title: string;
    reason?: string;
    courses: any[];
    href?: string;
    hrefLabel?: string;
    loading?: boolean;
    isAuthenticated?: boolean;
    /** Veri boşken rafı tamamen gizlemek yerine bu metni göster. */
    emptyText?: string;
}> = ({ title, reason, courses, href, hrefLabel = 'Tümünü gör', loading, isAuthenticated, emptyText }) => {
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
    }, [courses.length]);

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
    };

    if (!loading && courses.length === 0 && !emptyText) return null;

    return (
        <section className="pt-2 pb-5">
            <div className="flex items-end justify-between gap-4 mb-3">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                        {title}
                    </h2>
                    {reason && (
                        <p className="text-[13.5px] text-slate-500 mt-1">{reason}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {href && (
                        <Link
                            to={href}
                            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                        >
                            {hrefLabel} <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                    <div className="hidden md:flex gap-1">
                        <button
                            onClick={() => scroll(-1)}
                            disabled={!canLeft}
                            aria-label="Geri"
                            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-slate-200 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll(1)}
                            disabled={!canRight}
                            aria-label="İleri"
                            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-slate-200 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {!loading && courses.length === 0 ? (
                <p className="text-[14px] text-slate-500 py-6">{emptyText}</p>
            ) : (
                /* Kartlar arası boşluk dar tutuldu; detay paneli kartın yanında
                   açıldığı için taşmayı engellemek adına ray kırpılmıyor. */
                <div
                    ref={railRef}
                    className="flex gap-2.5 overflow-x-auto overflow-y-visible pb-3 -mx-1 px-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-[262px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                                <div className="aspect-video bg-slate-100" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    <div className="h-5 bg-slate-100 rounded w-1/3 mt-4" />
                                </div>
                            </div>
                        ))
                        : courses.map(course => (
                            <div key={course.id} className="w-[262px] shrink-0 snap-start">
                                <CourseCard course={course} isAuthenticated={isAuthenticated} />
                            </div>
                        ))}
                </div>
            )}
        </section>
    );
};

export default CourseRail;

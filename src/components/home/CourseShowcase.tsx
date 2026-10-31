import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShelfCourseCard, { ShelfBadge } from './ShelfCourseCard';

/**
 * Izgara vitrin bölümü — misafir ana sayfasının omurgası.
 *
 * Rafların aksine kaydırma yok: dört kurs birden tamamen görünür. Misafir için
 * amaç çok kurs taratmak değil, birkaç kursu ikna edici göstermek; yatay
 * kaydırmada kart yarım kalıyor ve kimse kaydırmıyordu.
 */
export const CourseShowcase: React.FC<{
    eyebrow?: string;
    eyebrowIcon?: React.ReactNode;
    title: string;
    subtitle?: string;
    note?: string;
    href?: string;
    hrefLabel?: string;
    courses: any[];
    loading?: boolean;
    /** Kaçıncı karta hangi etiket binecek. */
    badgeFor?: (course: any, index: number) => ShelfBadge;
    limit?: number;
    tone?: 'white' | 'tint';
}> = ({
    eyebrow,
    eyebrowIcon,
    title,
    subtitle,
    note,
    href,
    hrefLabel = 'Tümünü gör',
    courses,
    loading,
    badgeFor,
    limit = 6,
    tone = 'white',
}) => {
    const items = (courses || []).slice(0, limit);

    if (!loading && items.length === 0) return null;

    return (
        <section
            className={cn(
                'w-full py-14 lg:py-16',
                tone === 'tint' ? 'bg-brand-50/50 border-y border-brand-100/70' : 'bg-white'
            )}
        >
            <div className="container px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-9">
                    <div className="max-w-2xl">
                        {eyebrow && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100/80 text-brand-800 text-[11px] font-extrabold uppercase tracking-[0.1em] mb-3">
                                {eyebrowIcon}
                                {eyebrow}
                            </div>
                        )}

                        <h2 className="font-montserrat text-[26px] sm:text-[30px] font-extrabold text-slate-900 tracking-tight leading-tight">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="text-[14.5px] text-slate-600 mt-2.5 leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {note && (
                            <span className="hidden lg:inline-block text-[12px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                                {note}
                            </span>
                        )}
                        {href && (
                            <Link
                                to={href}
                                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand-700 hover:text-brand-900 hover:gap-2.5 transition-all"
                            >
                                {hrefLabel}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {loading
                        ? Array.from({ length: limit }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse"
                            >
                                <div className="aspect-[16/9] bg-slate-100" />
                                <div className="p-5 space-y-3">
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                    <div className="h-4 bg-slate-100 rounded w-full" />
                                    <div className="h-4 bg-slate-100 rounded w-3/5" />
                                    <div className="h-10 bg-slate-100 rounded-xl mt-6" />
                                </div>
                            </div>
                        ))
                        : items.map((course, i) => (
                            <ShelfCourseCard
                                key={course.id ?? course.course_id}
                                course={course}
                                compact
                                badge={badgeFor ? badgeFor(course, i) : undefined}
                            />
                        ))}
                </div>
            </div>
        </section>
    );
};

export default CourseShowcase;

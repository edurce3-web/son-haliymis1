import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Kartlar sırayla bu dört vurgu rengini alıyor (tasarımdaki gibi). */
const ACCENTS = [
    { text: 'text-emerald-300', link: 'text-emerald-300', ring: 'hover:border-emerald-400/50', dot: 'bg-emerald-400' },
    { text: 'text-teal-300', link: 'text-teal-300', ring: 'hover:border-teal-400/50', dot: 'bg-teal-400' },
    { text: 'text-violet-300', link: 'text-violet-300', ring: 'hover:border-violet-400/50', dot: 'bg-violet-400' },
    { text: 'text-rose-300', link: 'text-rose-300', ring: 'hover:border-rose-400/50', dot: 'bg-rose-400' },
];

const LEVELS: Record<string, string> = {
    beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri', all: 'Her seviye',
};

/** Piksel / kare. Saniyede ~20 piksel: göz takip edebiliyor, okunabiliyor. */
const DRIFT_SPEED = 0.35;
const DOTS = 3;

const durationLabel = (seconds?: number | null) => {
    const s = Number(seconds) || 0;
    if (s < 60) return null;
    const h = Math.round(s / 3600);
    return h >= 1 ? `${h} Saat Uygulamalı` : `${Math.round(s / 60)} dk Uygulamalı`;
};

/**
 * Koyu vitrin şeridi — misafir ana sayfası.
 *
 * Kurslar moderasyon panelinden seçiliyor ("Kayan vitrin"); seçim boşsa
 * sunucu puana göre öne çıkanları gönderiyor.
 *
 * Şerit kendiliğinden yavaşça sağa kayıyor. Liste iki kez art arda
 * çiziliyor ve kaydırma konumu yarıya gelince başa sarılıyor; böylece
 * sonsuz bir bant gibi görünüyor, sonda boşluk ya da geri sıçrama yok.
 *
 * Kayma şu durumlarda duruyor: imleç şeridin üzerindeyken (kart okunurken
 * kaçmasın), parmakla kaydırılırken, sekme arka plandayken ve kullanıcı
 * işletim sisteminde hareketi azalt'ı açmışsa. Oklar ve noktalar kayan
 * bantla birlikte çalışıyor.
 */
export const SpotlightCarousel: React.FC<{ courses: any[] }> = ({ courses }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);
    const [activeDot, setActiveDot] = useState(0);

    const list = courses || [];
    const loop = list.length >= 3;

    /*
     * Bandın bir kopyası ekrandan geniş olmalı; yoksa başa sarma noktası
     * görünür alana düşüp şerit her karede ileri geri sıçrar. Liste, en az
     * sekiz kart edecek kadar (ve tam katları hâlinde, desen bozulmasın diye)
     * tekrarlanıyor, sonra iki kez art arda çiziliyor.
     */
    const copyLength = loop ? Math.ceil(8 / list.length) * list.length : list.length;
    const copy = loop ? Array.from({ length: copyLength }, (_, i) => list[i % list.length]) : list;
    const items = loop ? [...copy, ...copy] : list;

    useEffect(() => {
        const el = railRef.current;
        if (!el || !loop) return;

        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const half = () => el.scrollWidth / 2;

        // Sağa kayma = kaydırma konumunun azalması; yarıdan başlıyoruz.
        el.scrollLeft = half();

        let raf = 0;
        let lastDot = -1;
        let carry = 0;

        const tick = () => {
            const h = half();
            // Bant ekrandan dar kalırsa (çok küçük liste) kaydırılacak yer yok.
            const roomy = h > el.clientWidth;
            if (roomy && !pausedRef.current && !reduced && !document.hidden) {
                // Tarayıcılar kesirli scrollLeft'i yuvarlıyor; küçük adımları biriktir.
                carry += DRIFT_SPEED;
                const step = Math.floor(carry);
                if (step > 0) {
                    carry -= step;
                    el.scrollLeft -= step;
                }
            }
            if (roomy) {
                if (el.scrollLeft <= 1) el.scrollLeft += h;
                else if (el.scrollLeft >= h * 2 - el.clientWidth - 1) el.scrollLeft -= h;

                const dot = Math.min(DOTS - 1, Math.floor(((el.scrollLeft % h) / h) * DOTS));
                if (dot !== lastDot) {
                    lastDot = dot;
                    setActiveDot(DOTS - 1 - dot);
                }
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [loop, list.length]);

    const pause = (v: boolean) => { pausedRef.current = v; };

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.75), behavior: 'smooth' });
    };

    if (list.length === 0) return null;

    return (
        <section className="relative w-full overflow-hidden bg-[#0b1220] py-16 lg:py-20 font-jakarta">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-teal-500/15 rounded-full blur-[150px]" />
                <div className="absolute -bottom-48 right-[-8rem] w-[560px] h-[560px] bg-emerald-500/10 rounded-full blur-[150px]" />
            </div>

            <div className="container relative mx-auto px-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/25 text-teal-300 text-[11px] font-extrabold uppercase tracking-[0.12em]">
                            <Sparkles className="w-3.5 h-3.5" />
                            Geleceğin becerileri & kariyer yetkinlikleri
                        </span>

                        <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.1] font-extrabold text-white tracking-tight mt-5">
                            Yapay Zeka Devriminde{' '}
                            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                                Bir Adım Önde Olun
                            </span>
                        </h2>

                        <p className="text-[14.5px] lg:text-[15.5px] text-slate-400 leading-relaxed mt-4">
                            Geleneksel yöntemlerin ötesine geçin. Sektörün en yeni konularını
                            uygulamalı içerik ve ileri düzey yetkinlik modülleriyle kavrayın.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 px-1" aria-hidden>
                            {Array.from({ length: DOTS }).map((_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'h-2 rounded-full transition-all duration-500',
                                        i === activeDot ? 'w-7 bg-teal-400' : 'w-2 bg-white/20'
                                    )}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => scroll(-1)}
                            aria-label="Önceki kurslar"
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/15 text-white flex items-center justify-center hover:bg-white/15 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll(1)}
                            aria-label="Sonraki kurslar"
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/15 text-white flex items-center justify-center hover:bg-white/15 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div
                    ref={railRef}
                    onMouseEnter={() => pause(true)}
                    onMouseLeave={() => pause(false)}
                    onPointerDown={() => pause(true)}
                    onPointerUp={() => pause(false)}
                    onTouchEnd={() => pause(false)}
                    onFocus={() => pause(true)}
                    onBlur={() => pause(false)}
                    className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {items.map((course, i) => {
                        const accent = ACCENTS[(i % list.length) % ACCENTS.length];
                        const img = getCourseImageUrl(
                            course.id ?? course.course_id,
                            course.image_url || course.image || course.thumbnail || course.image_path
                        );
                        const url = `/course/${course.slug || course.id}`;
                        const duration = durationLabel(course.duration_seconds);
                        const lessons = Number(course.lesson_count) || 0;
                        const level = course.level ? (LEVELS[course.level] || course.level) : null;
                        const tags = [level, lessons > 0 ? `${lessons} ders` : null, 'Sertifikalı']
                            .filter(Boolean) as string[];
                        const duplicate = loop && i >= list.length;

                        return (
                            <article
                                key={`${course.id}-${i}`}
                                aria-hidden={duplicate || undefined}
                                className={cn(
                                    'group shrink-0 w-[280px] sm:w-[300px] flex flex-col rounded-2xl p-4',
                                    'bg-slate-800/50 border border-slate-700/60 backdrop-blur-md',
                                    'transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/80',
                                    accent.ring
                                )}
                            >
                                <Link
                                    to={url}
                                    tabIndex={duplicate ? -1 : undefined}
                                    className="relative block aspect-[16/10] rounded-xl overflow-hidden bg-slate-950"
                                >
                                    <img
                                        src={img}
                                        alt={course.title}
                                        loading="lazy"
                                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                    />
                                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                                    {course.category_name && (
                                        <span
                                            className={cn(
                                                'absolute top-2.5 left-2.5 max-w-[80%] truncate px-2.5 py-0.5 rounded-full',
                                                'bg-slate-950/80 border border-white/10 text-[11px] font-bold backdrop-blur-md',
                                                accent.text
                                            )}
                                        >
                                            {course.category_name}
                                        </span>
                                    )}

                                    {duration && (
                                        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200">
                                            <Clock className={cn('w-3.5 h-3.5', accent.text)} />
                                            {duration}
                                        </span>
                                    )}
                                </Link>

                                <h3 className="text-[15px] font-bold text-white mt-4 truncate">
                                    <Link to={url} tabIndex={duplicate ? -1 : undefined}>{course.title}</Link>
                                </h3>

                                {course.short_description && (
                                    <p className="text-[12.5px] leading-[1.6] text-slate-400 mt-1.5 line-clamp-2">
                                        {course.short_description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {tags.map(t => (
                                        <span
                                            key={t}
                                            className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-slate-300 text-[11px]"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-5">
                                    <Link
                                        to={url}
                                        tabIndex={duplicate ? -1 : undefined}
                                        className={cn('inline-flex items-center gap-1.5 text-[13px] font-bold group/link', accent.link)}
                                    >
                                        Kursu keşfet
                                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                                    </Link>
                                    <Link
                                        to={url}
                                        tabIndex={-1}
                                        aria-hidden
                                        className="w-8 h-8 rounded-full bg-slate-950/60 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:text-white transition-colors"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SpotlightCarousel;

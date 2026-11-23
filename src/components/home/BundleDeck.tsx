import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Award, ChevronDown, ChevronLeft, ChevronRight, MonitorPlay, Star } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface BundleCourse {
    id: number;
    title: string;
    slug?: string | null;
    image?: string;
    thumbnail?: string | null;
    price: number;
    rating?: number | null;
    duration_seconds?: number | null;
    category_name?: string | null;
    instructor_name?: string | null;
}

export interface Bundle {
    id: number;
    title: string;
    description: string | null;
    price: number;
    list_total: number;
    savings_percent: number;
    total_hours: number;
    course_count: number;
    courses: BundleCourse[];
}

/** Kuruşlu tutar iki haneyle (2.149,90 ₺), tam tutar kuruşsuz (649 ₺). */
const lira = (n: number) => {
    const v = Number(n) || 0;
    const digits = Math.round(v * 100) % 100 === 0 ? 0 : 2;
    return `${v.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ₺`;
};

/** "3'ü 1 Arada" — sayının okunuşuna göre ek. */
const SUFFIX: Record<number, string> = { 2: 'si', 3: 'ü', 4: 'ü', 5: 'i', 6: 'sı', 7: 'si', 8: 'i', 9: 'u', 10: 'u', 11: 'i', 12: 'si' };
const togetherLabel = (n: number) => `${n}'${SUFFIX[n] || 'ü'} 1 Arada`;

const hoursOf = (s?: number | null) => Math.round((Number(s) || 0) / 3600);

const imageOf = (c: BundleCourse) => getCourseImageUrl(c.id, c.image || c.thumbnail || null);

const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)';

/**
 * Kurs paketleri — "deste" görünümü.
 *
 * Her paket üst üste dizilmiş kurs kartları gibi duruyor. Fareyle üzerine
 * gelince arkadaki kartlar iskambil eli gibi yanlara açılıyor. Pakette dörtten
 * fazla kurs varsa destede ilk dördü görünüyor, köşede "+5" gibi kalanların
 * sayısı yazıyor. "İçindeki N kursu gör" desteyi aynı alanda listeye
 * çeviriyor; liste uzunsa kendi içinde kayıyor, kartın boyu değişmiyor.
 *
 * Dokunmatik ekranda üzerine gelmek yok; desteye dokunmak kartları açıyor.
 *
 * Satın alma ödeme sayfasına gidiyor; fiyat orada sunucudan yeniden
 * hesaplanıyor.
 */
export const BundleDeck: React.FC<{
    bundles: Bundle[];
    /** Başlığı ve alt başlığı değiştir (kategori, arama sayfaları) */
    title?: string;
    subtitle?: string;
    /** Sayfa içine gömülü: tam genişlik zemin yerine yuvarlak kutu */
    embedded?: boolean;
}> = ({ bundles, title, subtitle, embedded }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const update = () => {
        const el = railRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < max - 4);
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
    }, [bundles.length]);

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.9), behavior: 'smooth' });
    };

    if (!bundles || bundles.length === 0) return null;

    const counts = new Set(bundles.map(b => (b.courses || []).length));
    const heading = title || (counts.size === 1
        ? `${togetherLabel([...counts][0])} Mega Paketler`
        : 'Bir Arada Mega Paketler');

    return (
        <section className={embedded ? 'w-full  bg-[#F5F6F8] py-6 font-jakarta overflow-hidden' : 'w-full bg-[#F5F6F8] py-7 lg:py-8 font-jakarta overflow-hidden'}>
            <div className={embedded ? 'px-4 sm:px-6' : 'container mx-auto px-4'}>
                <div className="flex items-end justify-between gap-6 mb-5">
                    <div className="min-w-0">
                        <h2 className="text-[20px] sm:text-[22px] leading-tight font-extrabold text-[#111827] tracking-[-0.02em]">
                            {heading}
                        </h2>
                        <p className="text-[13px] text-[#6B7280] mt-1">
                            {subtitle || 'Birbiri ardına dizilmiş kurslar; tüm seti tek seferde, avantajlı fiyatla al.'}
                        </p>
                    </div>

                    {(canLeft || canRight) && (
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            {[-1, 1].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => scroll(d as 1 | -1)}
                                    disabled={d === -1 ? !canLeft : !canRight}
                                    aria-label={d === -1 ? 'Önceki paketler' : 'Sonraki paketler'}
                                    className="w-10 h-10 rounded-full bg-white text-[#111827] flex items-center justify-center  hover:bg-[#111827] hover:text-white disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-[#111827] transition-colors"
                                >
                                    {d === -1 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Şerit kartlardan biraz geniş: açılan kartlar ve gölge kenarda kesilmesin */}
                <div
                    ref={railRef}
                    className="flex gap-4 overflow-x-auto snap-x scroll-pl-4 sm:scroll-pl-8 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-4 pb-8 -mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {bundles.map(b => (
                        <div
                            key={b.id}
                            className="relative shrink-0 snap-start w-[78%] sm:w-[290px] lg:w-[calc((100%-3rem)/4)] hover:z-10"
                        >
                            <BundleCard bundle={b} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/**
 * Arkadaki kartların açıldığı konumlar: yatay %, dikey %, açı, ölçek.
 * Destede en fazla üç arka kart açılıyor; daha fazlası "+N" ile söyleniyor.
 */
type Spot = { x: number; y: number; r: number; s: number };
const FAN: Record<number, Spot[]> = {
    1: [{ x: 14, y: -12, r: 6, s: 0.93 }],
    2: [{ x: -15, y: -6, r: -6, s: 0.92 }, { x: 14, y: -15, r: 5.5, s: 0.9 }],
    3: [{ x: -15, y: -6, r: -6, s: 0.92 }, { x: 14, y: -15, r: 5.5, s: 0.9 }, { x: -2, y: -23, r: -1.5, s: 0.87 }],
};

const CARD_H = 112;
const DECK_H = CARD_H + 18;

const BundleCard: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const listId = useId();
    const [fan, setFan] = useState(false);
    const [list, setList] = useState(false);

    const courses = bundle.courses || [];
    const front = courses[0];
    const behind = courses.slice(1, 4);
    const extra = Math.max(0, courses.length - 4);
    const spots = FAN[behind.length] || [];
    const open = fan && !list;

    const buy = () => {
        const target = `/checkout?bundle=${bundle.id}`;
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(target)}`);
            return;
        }
        navigate(target);
    };

    /* Fareyle desteye tıklamak listeyi açıyor (kartlar zaten üzerine gelince
       açıldı); dokunmatikte kartları açıp kapatıyor. */
    const onDeckClick = () => {
        const canHover = window.matchMedia('(hover: hover)').matches;
        if (canHover) setList(v => !v);
        else setFan(v => !v);
    };

    return (
        <article
            className="group h-full flex flex-col bg-white  p-3.5 transition-shadow duration-300  hover:shadow-[0_24px_48px_-26px_rgba(17,24,39,0.4)]"
            onPointerEnter={e => { if (e.pointerType === 'mouse') setFan(true); }}
            onPointerLeave={e => { if (e.pointerType === 'mouse') setFan(false); }}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#111827] text-white text-[11px] font-extrabold whitespace-nowrap">
                    {togetherLabel(courses.length)} Mega Paket
                </span>
                {bundle.savings_percent > 0 && (
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#EEFBF3] text-[#1B7A43] text-[11px] font-extrabold whitespace-nowrap">
                        {`%${bundle.savings_percent} tasarruf`}
                    </span>
                )}
            </div>

            {/* ── Deste: yükseklik sabit, açılınca alttaki içerik oynamıyor ── */}
            <div className="relative mt-3" style={{ height: DECK_H }}>
                <div
                    aria-hidden
                    onClick={onDeckClick}
                    className={cn(
                        'absolute inset-0 cursor-pointer select-none transition-opacity duration-200',
                        list && 'opacity-0 pointer-events-none'
                    )}
                >
                    {behind.map((c, i) => {
                        const spot = spots[i];
                        const depth = i + 1;
                        return (
                            <div
                                key={c.id}
                                className="absolute inset-x-0 top-0 pointer-events-none transition-transform motion-reduce:transition-none"
                                style={{
                                    height: CARD_H,
                                    zIndex: 5 - depth,
                                    transitionDuration: '380ms',
                                    transitionTimingFunction: EASE_OUT,
                                    transitionDelay: open ? `${i * 35}ms` : '0ms',
                                    transform: open && spot
                                        ? `translate(${spot.x}%, ${spot.y}%) rotate(${spot.r}deg) scale(${spot.s})`
                                        : `translate(0, ${depth * 7}px) scale(${1 - depth * 0.045})`,
                                }}
                            >
                                <CourseFace course={c} label={`${depth + 1}. kurs`} lifted={open} />
                            </div>
                        );
                    })}

                    {front && (
                        <div
                            className={cn(
                                'absolute inset-x-0 top-0 z-10 transition-transform duration-300 motion-reduce:transition-none',
                                open && '-translate-y-0.5'
                            )}
                            style={{ height: CARD_H, transitionTimingFunction: EASE_OUT }}
                        >
                            <CourseFace course={front} label={behind.length ? '1. kurs · önde' : '1. kurs'} lifted strong={open} />
                        </div>
                    )}

                    {extra > 0 && (
                        <span
                            className="absolute z-20 right-2 top-2 h-7 min-w-[1.75rem] px-2 rounded-full bg-[#1B7A43] text-white text-[12px] font-extrabold tabular-nums flex items-center justify-center"
                            title={`${extra} kurs daha`}
                        >
                            +{extra}
                        </span>
                    )}
                </div>

                {/* Liste: kartların yerine, uzunsa kendi içinde kayıyor */}
                <ol
                    id={listId}
                    className={cn(
                        'absolute inset-0 flex-col gap-1 overflow-y-auto overscroll-contain pr-1 animate-in fade-in duration-200',
                        '[scrollbar-width:thin] [scrollbar-color:#D1D5DB_transparent]',
                        courses.length <= 4 && 'justify-center',
                        list ? 'flex' : 'hidden'
                    )}
                >
                    {courses.map((c, i) => {
                        const meta = [c.instructor_name, hoursOf(c.duration_seconds) > 0 ? `${hoursOf(c.duration_seconds)} saat` : null]
                            .filter(Boolean).join(' · ');
                        const row = (
                            <>
                                <span className="w-5 text-center text-[11.5px] font-extrabold text-[#1B7A43] tabular-nums shrink-0">{i + 1}</span>
                                <img
                                    src={imageOf(c)}
                                    alt=""
                                    loading="lazy"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                    className="w-12 h-[27px]  object-cover shrink-0 bg-[#EEFBF3]"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[12.5px] leading-tight font-bold text-[#111827] truncate">{c.title}</span>
                                    {meta && <span className="block text-[10.5px] leading-tight text-[#6B7280] truncate mt-0.5">{meta}</span>}
                                </span>
                                <span className="text-[11px] text-[#6B7280] line-through tabular-nums shrink-0 pr-1.5">{lira(c.price)}</span>
                            </>
                        );
                        const rowClass = 'shrink-0 flex items-center gap-2 h-[34px]  bg-[#F5F6F8] pl-1';
                        return (
                            <li key={c.id}>
                                {c.slug ? (
                                    <Link
                                        to={`/course/${c.slug}`}
                                        className={cn(rowClass, 'hover:bg-[#EEFBF3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7A43]/50')}
                                    >
                                        {row}
                                    </Link>
                                ) : (
                                    <div className={rowClass}>{row}</div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>

            <button
                type="button"
                aria-expanded={list}
                aria-controls={listId}
                onClick={() => setList(v => !v)}
                className="relative z-20 self-center mt-2 inline-flex items-center gap-1 h-6 pl-3 pr-2 rounded-full bg-[#F5F6F8] text-[11px] font-bold text-[#111827] hover:bg-[#EEFBF3] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7A43]/50"
            >
                {list ? 'Kartlara dön' : `İçindeki ${courses.length} kursu gör`}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', list && 'rotate-180')} />
            </button>

            <h3 className="text-[14.5px] font-extrabold text-[#111827] mt-3 leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-[#1B7A43]">
                {bundle.title}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold text-[#6B7280]">
                {bundle.total_hours > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                        <MonitorPlay className="w-3.5 h-3.5 text-[#6B7280]" />
                        {`${bundle.total_hours} saat video`}
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#6B7280]" />
                    {`${courses.length} ayrı sertifika`}
                </span>
            </p>

            <div className="mt-auto pt-3">
                <div className="pt-3 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[11px] text-[#6B7280]">
                            <span className="line-through tabular-nums">{lira(bundle.list_total)}</span> yerine
                        </p>
                        <p className="text-[19px] leading-none font-extrabold text-[#111827] tabular-nums mt-1">
                            {lira(bundle.price)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={buy}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5  bg-[#1B7A43] hover:bg-[#16613A] active:scale-[0.98] text-white text-[13px] font-bold whitespace-nowrap transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7A43]/50 focus-visible:ring-offset-2"
                    >
                        Paketi al
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </article>
    );
};

/** Destedeki tek bir kurs kartı: kapak, sıra etiketi, ad, eğitmen, puan. */
const CourseFace: React.FC<{ course: BundleCourse; label: string; lifted?: boolean; strong?: boolean }> = ({
    course, label, lifted, strong,
}) => (
    <div
        className={cn(
            'h-full flex flex-col  bg-white overflow-hidden transition-shadow duration-300',
            strong
                ? 'shadow-[0_18px_34px_-14px_rgba(19,27,46,0.5)]'
                : lifted
                    ? 'shadow-[0_10px_24px_-14px_rgba(19,27,46,0.4)]'
                    : ''
        )}
    >
        <div className="relative h-[64px] shrink-0 bg-[#F1F3F5] m-[2px] mb-0  overflow-hidden">
            <img
                src={imageOf(course)}
                alt=""
                loading="lazy"
                draggable={false}
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                className="w-full h-full object-cover"
            />
            <span className="absolute top-1.5 left-1.5 px-1.5 py-[2px]  bg-[#111827]/85 text-white text-[9px] font-extrabold uppercase tracking-[0.04em]">
                {label}
            </span>
        </div>
        <div className="flex-1 min-h-0 flex items-center gap-2 px-3">
            <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-tight font-bold text-[#111827] truncate">{course.title}</p>
                {course.instructor_name && (
                    <p className="text-[10.5px] leading-tight text-[#6B7280] truncate mt-0.5">{course.instructor_name}</p>
                )}
            </div>
            {Number(course.rating) > 0 && (
                <span className="flex items-center gap-1 text-[11.5px] font-extrabold text-[#c77700] shrink-0 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#fea619] text-[#fea619]" />
                    {Number(course.rating).toFixed(1)}
                </span>
            )}
        </div>
    </div>
);

export default BundleDeck;

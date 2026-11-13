import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Award, ChevronDown, ChevronLeft, ChevronRight, Layers, MonitorPlay, Star } from 'lucide-react';
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
const togetherLabel = (n: number) => {
    const suffix: Record<number, string> = { 2: 'si', 3: 'ü', 4: 'ü', 5: 'i' };
    return `${n}'${suffix[n] || 'ü'} 1 Arada Mega Paket`;
};

const hoursOf = (s?: number | null) => Math.round((Number(s) || 0) / 3600);

const imageOf = (c: BundleCourse) =>
    getCourseImageUrl(c.id, c.image || c.thumbnail || null);

const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)';

/**
 * Kurs paketleri — "deste" görünümü.
 *
 * Her paket üst üste dizilmiş kurs kartları gibi duruyor: önde ilk kurs,
 * altında diğerlerinin kenarları. Fareyle üzerine gelince arkadaki kartlar
 * iskambil eli gibi yanlara açılıyor; alıcı pakette hangi kursların olduğunu
 * kapaklarıyla görüyor. "İçindeki N kursu gör" aynı alanı okunaklı bir
 * listeye çeviriyor: ad, eğitmen, tek tek fiyat.
 *
 * Dokunmatik ekranda üzerine gelmek yok; desteye dokunmak kartları açıyor.
 *
 * Satın alma ödeme sayfasına gidiyor; fiyat orada sunucudan yeniden
 * hesaplanıyor. Pakettekilerden birine zaten sahip olan alıcı için o kurs
 * düşülüp fiyat aynı oranda iniyor.
 */
export const BundleDeck: React.FC<{ bundles: Bundle[] }> = ({ bundles }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);
    const [page, setPage] = useState(0);

    const update = () => {
        const el = railRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < max - 4);
        setPage(max > 0 ? Math.round((el.scrollLeft / max) * 2) : 0);
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

    const scrollable = canLeft || canRight;

    // Bütün paketler aynı sayıda kurs içeriyorsa başlık onu söylüyor
    // ("3'ü 1 Arada Mega Paketler"); karışıksa genel başlık.
    const counts = new Set(bundles.map(b => (b.courses || []).length));
    const heading = counts.size === 1
        ? `${togetherLabel([...counts][0])}ler`
        : 'Bir Arada Mega Paketler';

    return (
        <section className="w-full bg-[#f2f3ff] py-14 lg:py-16 font-jakarta overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#005c55] text-white text-[10.5px] font-extrabold uppercase tracking-[0.1em]">
                            <Layers className="w-3.5 h-3.5" />
                            Destelenmiş kurs paketleri
                        </span>
                        <h2 className="text-[26px] sm:text-[30px] leading-tight font-extrabold text-[#131b2e] tracking-tight mt-3">
                            {heading}
                        </h2>
                        <p className="text-[14px] text-[#3e4947] mt-2 leading-relaxed">
                            Birbiri ardına dizilmiş kurs kartları! Arkasındaki diğer kursları
                            keşfedin, tüm seti tek seferde avantajlı fiyatla edinin.
                        </p>
                    </div>

                    {scrollable && (
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => scroll(-1)}
                                disabled={!canLeft}
                                aria-label="Önceki paketler"
                                className="w-10 h-10 rounded-full bg-white shadow-sm text-[#131b2e] flex items-center justify-center hover:bg-[#eaedff] disabled:opacity-35 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1.5" aria-hidden>
                                {[0, 1, 2].map(i => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'h-2 rounded-full transition-all',
                                            i === page ? 'w-6 bg-[#005c55]' : 'w-2 bg-[#005c55]/25'
                                        )}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => scroll(1)}
                                disabled={!canRight}
                                aria-label="Sonraki paketler"
                                className="w-10 h-10 rounded-full bg-white shadow-sm text-[#131b2e] flex items-center justify-center hover:bg-[#eaedff] disabled:opacity-35 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Kenar boşlukları: açılan kartlar ve gölge kaydırma alanının
                    kenarında kesilmesin diye şerit kartlardan biraz geniş. */}
                <div
                    ref={railRef}
                    className="flex gap-6 overflow-x-auto snap-x scroll-pl-4 sm:scroll-pl-8 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-4 pb-12 -mb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {bundles.map(b => (
                        <div
                            key={b.id}
                            className="relative shrink-0 snap-start w-[88%] sm:w-[360px] lg:w-[calc((100%-3rem)/3)] hover:z-10"
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
 * Arkadaki kartların açıldığı konumlar: [yatay %, dikey %, açı, ölçek].
 * Yüzdeler kartın kendi boyutuna göre. Kart sayısına göre ayrı dizilim:
 * iki arka kart sola ve sağa açılıyor, fazlası ortadan yukarı yükseliyor.
 */
type Spot = { x: number; y: number; r: number; s: number };
const FAN: Record<number, Spot[]> = {
    1: [{ x: 15, y: -11, r: 6, s: 0.93 }],
    2: [{ x: -16, y: -5, r: -6, s: 0.92 }, { x: 15, y: -15, r: 5.5, s: 0.9 }],
    3: [{ x: -16, y: -5, r: -6, s: 0.92 }, { x: 15, y: -15, r: 5.5, s: 0.9 }, { x: -3, y: -22, r: -1.5, s: 0.88 }],
    4: [{ x: -16, y: -5, r: -6, s: 0.92 }, { x: 15, y: -15, r: 5.5, s: 0.9 }, { x: -5, y: -21, r: -2.5, s: 0.88 }, { x: 5, y: -27, r: 2, s: 0.86 }],
};

const CARD_H = 186;

const BundleCard: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const listId = useId();
    const [fan, setFan] = useState(false);
    const [list, setList] = useState(false);

    const courses = (bundle.courses || []).slice(0, 5);
    const front = courses[0];
    const behind = courses.slice(1);
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
       açıldı). Dokunmatikte üzerine gelmek olmadığı için dokunmak kartları
       açıp kapatıyor; liste alttaki düğmede. */
    const onDeckClick = () => {
        const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
        if (canHover) setList(v => !v);
        else setFan(v => !v);
    };

    return (
        <article
            className="group h-full flex flex-col bg-white rounded-3xl border border-[#e6e8f3] p-5 transition-shadow duration-300 hover:shadow-[0_30px_60px_-28px_rgba(19,27,46,0.4)]"
            onPointerEnter={e => { if (e.pointerType === 'mouse') setFan(true); }}
            onPointerLeave={e => { if (e.pointerType === 'mouse') setFan(false); }}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#131b2e] text-white text-[11px] font-extrabold whitespace-nowrap">
                    {togetherLabel(courses.length)}
                </span>
                {bundle.savings_percent > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#e2f6ee] text-[#086f57] text-[11px] font-extrabold whitespace-nowrap">
                        %{bundle.savings_percent} Tasarruf
                    </span>
                )}
            </div>

            {/* ── Deste ─────────────────────────────────────────────────
                Yükseklik sabit: kartlar açılınca ya da liste gelince
                alttaki içerik yerinden oynamıyor. */}
            <div className="relative mt-5" style={{ height: CARD_H + 20 }}>
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
                                    // Kapalı: her kart bir öncekinin altından 5px taşıyor
                                    transform: open && spot
                                        ? `translate(${spot.x}%, ${spot.y}%) rotate(${spot.r}deg) scale(${spot.s})`
                                        : `translate(0, ${depth * 9}px) rotate(0deg) scale(${1 - depth * 0.045})`,
                                }}
                            >
                                <CourseFace
                                    course={c}
                                    label={depth === behind.length ? `${depth + 1}. Kurs (arkada)` : `${depth + 1}. Kurs`}
                                    lifted={open}
                                />
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
                            <CourseFace
                                course={front}
                                label={behind.length ? '1. Kurs (önde)' : '1. Kurs'}
                                lifted
                                strong={open}
                            />
                        </div>
                    )}
                </div>

                {/* Liste: aynı alanda, kartların yerine */}
                <ol
                    id={listId}
                    className={cn(
                        'absolute inset-0 flex-col justify-center gap-[5px] animate-in fade-in duration-200',
                        list ? 'flex' : 'hidden'
                    )}
                >
                    {courses.map((c, i) => {
                        const meta = [c.instructor_name, hoursOf(c.duration_seconds) > 0 ? `${hoursOf(c.duration_seconds)} saat` : null]
                            .filter(Boolean).join(' · ');
                        const row = (
                            <>
                                <span className="w-5 text-center text-[11.5px] font-extrabold text-[#005c55] tabular-nums shrink-0">
                                    {i + 1}
                                </span>
                                <img
                                    src={imageOf(c)}
                                    alt=""
                                    loading="lazy"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                    className="w-[50px] h-7 rounded-md object-cover shrink-0 bg-[#eaedff]"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[12.5px] leading-tight font-bold text-[#131b2e] truncate">{c.title}</span>
                                    {meta && <span className="block text-[10.5px] leading-tight text-[#5b6472] truncate mt-0.5">{meta}</span>}
                                </span>
                                <span className="text-[11px] text-[#5b6472] line-through tabular-nums shrink-0 pr-1.5">
                                    {lira(c.price)}
                                </span>
                            </>
                        );
                        const rowClass = 'flex items-center gap-2.5 h-9 rounded-xl bg-[#f6f7ff] border border-[#e2e7ff] pl-1 pr-1';
                        return (
                            <li key={c.id}>
                                {c.slug ? (
                                    <Link
                                        to={`/course/${c.slug}`}
                                        className={cn(rowClass, 'hover:bg-[#eceeff] hover:border-[#c7cdf5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/50')}
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
                className="relative z-20 self-center mt-4 inline-flex items-center gap-1.5 h-7 pl-3.5 pr-2.5 rounded-full bg-white border border-[#d6d9e8] text-[11.5px] font-bold text-[#131b2e] hover:border-[#131b2e]/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/50"
            >
                {list ? 'Kartlara dön' : `İçindeki ${courses.length} kursu gör`}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', list && 'rotate-180')} />
            </button>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
                {bundle.total_hours > 0 && (
                    <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 sm:px-3 rounded-full bg-[#eaf3ff] text-[11.5px] font-semibold text-[#1b5fa8]">
                        <MonitorPlay className="w-3.5 h-3.5" />
                        Toplam {bundle.total_hours} Saat Video
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 sm:px-3 rounded-full bg-[#f5edff] text-[11.5px] font-semibold text-[#7429b8]">
                    <Award className="w-3.5 h-3.5" />
                    {courses.length} Ayrı Sertifika
                </span>
            </div>

            <h3 className="text-[17px] font-extrabold text-[#131b2e] mt-4 leading-snug text-balance transition-colors duration-200 group-hover:text-[#005c55]">
                {bundle.title}
            </h3>
            {bundle.description && (
                <p className="text-[12.5px] text-[#3e4947] leading-relaxed mt-1.5 line-clamp-2">{bundle.description}</p>
            )}

            <div className="mt-auto pt-5">
                <div className="border-t border-[#eef0f6] pt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11.5px] text-[#5b6472]">
                            <span className="line-through tabular-nums">{lira(bundle.list_total)}</span> yerine
                        </p>
                        <p className="text-[23px] leading-none font-extrabold text-[#131b2e] tabular-nums mt-1.5">
                            {lira(bundle.price)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={buy}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#131b2e] hover:bg-[#005c55] active:scale-[0.98] text-white text-[13.5px] font-bold whitespace-nowrap shadow-[0_8px_16px_-8px_rgba(19,27,46,0.6)] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/50 focus-visible:ring-offset-2"
                    >
                        Paketi satın al
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
            'h-full flex flex-col rounded-[14px] bg-white border-2 border-[#c3c9f6] overflow-hidden transition-shadow duration-300',
            strong
                ? 'shadow-[0_18px_34px_-14px_rgba(19,27,46,0.5)]'
                : lifted
                    ? 'shadow-[0_10px_24px_-14px_rgba(19,27,46,0.4)]'
                    : ''
        )}
    >
        <div className="relative h-[106px] shrink-0 bg-[#eaedff]">
            <img
                src={imageOf(course)}
                alt=""
                loading="lazy"
                draggable={false}
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                className="w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 px-2 py-[3px] rounded-md bg-[#131b2e]/90 text-white text-[9.5px] font-extrabold uppercase tracking-[0.04em]">
                {label}
            </span>
        </div>
        <div className="flex-1 min-h-0 flex items-center gap-3 px-3.5">
            <div className="min-w-0 flex-1">
                <p className="text-[14.5px] leading-tight font-bold text-[#131b2e] truncate">{course.title}</p>
                {course.instructor_name && (
                    <p className="text-[12px] leading-tight text-[#5b6472] truncate mt-1">{course.instructor_name}</p>
                )}
            </div>
            {Number(course.rating) > 0 && (
                <span className="flex items-center gap-1 text-[13.5px] font-extrabold text-[#c77700] shrink-0 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#fea619] text-[#fea619]" />
                    {Number(course.rating).toFixed(1)}
                </span>
            )}
        </div>
    </div>
);

export default BundleDeck;

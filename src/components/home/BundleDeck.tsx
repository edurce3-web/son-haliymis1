import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, ChevronLeft, ChevronRight, Layers, MonitorPlay, Star } from 'lucide-react';
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

const lira = (n: number) =>
    `${(Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

/** "3'ü 1 Arada" — sayının okunuşuna göre ek. */
const togetherLabel = (n: number) => {
    const suffix: Record<number, string> = { 2: 'si', 3: 'ü', 4: 'ü', 5: 'i' };
    return `${n}'${suffix[n] || 'ü'} 1 Arada Mega Paket`;
};

const hoursOf = (s?: number | null) => Math.round((Number(s) || 0) / 3600);

const imageOf = (c: BundleCourse) =>
    getCourseImageUrl(c.id, c.image || c.thumbnail || null);

/**
 * Kurs paketleri — "deste" görünümü.
 *
 * Her paket üst üste dizilmiş kartlar gibi duruyor: önde ilk kurs, arkada
 * diğerlerinin kenarları. Üzerine gelince deste açılıyor ve paketteki bütün
 * kurslar (2-5) satır satır görünüyor; alıcı ne aldığını sepete gitmeden
 * görebiliyor. Dokunmatik ekranda üzerine gelmek olmadığı için desteye
 * dokunmak aynı işi yapıyor.
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
        <section className="w-full bg-[#f2f3ff] py-14 lg:py-16 font-jakarta">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
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

                <div
                    ref={railRef}
                    className="flex gap-6 overflow-x-auto snap-x pb-3 -mx-1 px-1 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {bundles.map(b => (
                        <div
                            key={b.id}
                            className="shrink-0 snap-start w-[88%] sm:w-[360px] lg:w-[calc((100%-3rem)/3)]"
                        >
                            <BundleCard bundle={b} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const BundleCard: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);

    const courses = bundle.courses || [];
    const front = courses[0];
    const behind = courses.slice(1, 4);

    const buy = () => {
        const target = `/checkout?bundle=${bundle.id}`;
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(target)}`);
            return;
        }
        navigate(target);
    };

    return (
        <article className="h-full flex flex-col bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(19,27,46,0.06)] hover:shadow-[0_24px_48px_-20px_rgba(19,27,46,0.3)] transition-shadow">
            <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#131b2e] text-white text-[10.5px] font-extrabold">
                    {togetherLabel(courses.length)}
                </span>
                {bundle.savings_percent > 0 && (
                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
                        %{bundle.savings_percent} Tasarruf
                    </span>
                )}
            </div>

            {/* ── Deste ─────────────────────────────────────────────────
                İki katman üst üste: kapalıyken önde ilk kurs ve arkada
                diğerlerinin kenarları; açıkken bütün kurslar satır satır.
                Katmanlar arasında yalnızca saydamlık ve konum geçişi var;
                kartın yüksekliği sabit, açılınca alttaki içerik zıplamasın. */}
            <div
                className="group/deck relative h-[214px] mt-5 cursor-pointer select-none"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onClick={() => setOpen(v => !v)}
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-label={`${bundle.title} paketindeki kursları göster`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v); } }}
            >
                {/* Kapalı: deste */}
                <div
                    className={cn(
                        'absolute inset-0 transition-all duration-300',
                        open ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                    )}
                >
                    {behind.map((c, i) => (
                        <div
                            key={c.id}
                            aria-hidden
                            className="absolute inset-x-3 top-3 bottom-3 rounded-xl border-2 border-[#c7cdf5] bg-white"
                            style={{
                                transform: `translate(${(i + 1) * 7}px, ${-(i + 1) * 7}px) rotate(${(i + 1) * 2}deg)`,
                                zIndex: 3 - i,
                            }}
                        />
                    ))}

                    {front && (
                        <div className="absolute inset-x-3 top-3 bottom-3 z-10 rounded-xl bg-white border border-[#e2e7ff] shadow-[0_8px_24px_-10px_rgba(19,27,46,0.35)] overflow-hidden flex flex-col">
                            <div className="relative h-[104px] shrink-0 bg-[#eaedff]">
                                <img
                                    src={imageOf(front)}
                                    alt={front.title}
                                    loading="lazy"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                                    className="w-full h-full object-cover"
                                />
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#131b2e]/85 text-white text-[9.5px] font-extrabold uppercase tracking-wide">
                                    1. Kurs (önde)
                                </span>
                                {hoursOf(front.duration_seconds) > 0 && (
                                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#131b2e]/80 text-white text-[10px] font-bold">
                                        {hoursOf(front.duration_seconds)} Saat
                                    </span>
                                )}
                            </div>
                            <div className="p-3 min-w-0">
                                {front.category_name && (
                                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#005c55] truncate">
                                        {front.category_name}
                                    </p>
                                )}
                                <p className="text-[13px] font-bold text-[#131b2e] leading-snug line-clamp-1 mt-0.5">
                                    {front.title}
                                </p>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <span className="text-[11px] text-[#6e7977] truncate">{front.instructor_name}</span>
                                    {Number(front.rating) > 0 && (
                                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#855300] shrink-0">
                                            <Star className="w-3 h-3 fill-[#fea619] text-[#fea619]" />
                                            {Number(front.rating).toFixed(2).replace(/0$/, '')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full bg-white border border-[#e2e7ff] text-[10.5px] font-bold text-[#3e4947] shadow-sm whitespace-nowrap">
                        İçindeki {courses.length} kursu gör
                    </span>
                </div>

                {/* Açık: bütün kurslar */}
                <ol
                    className={cn(
                        'absolute inset-0 flex flex-col justify-center gap-1.5 transition-all duration-300',
                        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                    )}
                >
                    {courses.map((c, i) => (
                        <li
                            key={c.id}
                            className="flex items-center gap-2.5 rounded-lg bg-[#f7f8ff] border border-[#e2e7ff] p-1 transition-all duration-300"
                            style={{ transitionDelay: open ? `${i * 45}ms` : '0ms' }}
                        >
                            <span className="w-5 text-center text-[11px] font-extrabold text-[#005c55] shrink-0">
                                {i + 1}
                            </span>
                            <img
                                src={imageOf(c)}
                                alt=""
                                loading="lazy"
                                onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                                className="w-12 h-7 rounded object-cover shrink-0 bg-[#eaedff]"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-bold text-[#131b2e] truncate">{c.title}</span>
                                <span className="block text-[10.5px] text-[#6e7977] truncate">
                                    {[c.instructor_name, hoursOf(c.duration_seconds) > 0 ? `${hoursOf(c.duration_seconds)} saat` : null]
                                        .filter(Boolean).join(' · ')}
                                </span>
                            </span>
                            <span className="text-[10.5px] text-[#6e7977] line-through tabular-nums shrink-0 pr-1">
                                {lira(c.price)}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
                {bundle.total_hours > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] text-[11.5px] font-semibold text-[#3e4947]">
                        <MonitorPlay className="w-3.5 h-3.5 text-[#005c55]" />
                        Toplam {bundle.total_hours} Saat Video
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] text-[11.5px] font-semibold text-[#3e4947]">
                    <Award className="w-3.5 h-3.5 text-[#005c55]" />
                    {courses.length} Ayrı Sertifika
                </span>
            </div>

            <h3 className="text-[16px] font-extrabold text-[#131b2e] mt-4 leading-snug">{bundle.title}</h3>
            {bundle.description && (
                <p className="text-[12.5px] text-[#3e4947] leading-relaxed mt-1.5 line-clamp-2">{bundle.description}</p>
            )}

            <div className="flex items-end justify-between gap-3 mt-auto pt-5">
                <div>
                    <p className="text-[11.5px] text-[#6e7977]">
                        <span className="line-through">{lira(bundle.list_total)}</span> yerine
                    </p>
                    <p className="text-[24px] leading-none font-extrabold text-[#131b2e] tabular-nums mt-1">
                        {lira(bundle.price)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={buy}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#131b2e] hover:bg-[#005c55] text-white text-[13px] font-bold transition-colors"
                >
                    Paketi satın al
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
};

export default BundleDeck;

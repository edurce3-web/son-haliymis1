import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { CATEGORY_TREE } from '@/data/categoryTree';
import { cn } from '@/lib/utils';

export interface HeroStats {
    courses: number;
    students: number;
    instructors: number;
    hours: number;
    reviews: number;
}

interface HeroInstructor {
    id: number;
    name: string;
    image: string;
}

/** Başlıktaki boşluğa sırayla gelen konular. Hepsi kategori ağacında var. */
const ROTATING = [
    'web geliştirme',
    'otomasyon',
    'yapay zekâ',
    'grafik tasarım',
    'elektronik',
    'UI/UX tasarımı',
    'siber güvenlik',
    'PCB tasarımı',
];

const POPULAR = ['Python', 'Otomasyon', 'Excel', 'Grafik tasarım', 'Elektrik tesisatı'];

type Subject = { name: string; to: string };

/**
 * Misafir ana sayfasının üst bölümü.
 *
 * Koyu mürekkep zemin, büyük tek cümle ve arama. Cümlenin ortasındaki boşluğa
 * platformdaki konular sırayla geliyor: ziyaretçi "burada ne öğrenebilirim?"
 * sorusunun cevabını okumadan görüyor.
 *
 * Sağda konu başlıkları üç sütun halinde yavaşça akıyor; her biri o konunun
 * kurs sayfasına gidiyor. Bölüm sayılara ya da kapak görsellerine dayanmıyor:
 * platform büyüdükçe değişen sayılar küçükken vitrini zayıflatıyordu.
 *
 * Hareketi azaltmayı seçen kullanıcıda konu değişmiyor, sütunlar akmıyor.
 */
export const GuestHero: React.FC<{
    stats?: HeroStats;
    instructors?: HeroInstructor[];
}> = () => {
    const navigate = useNavigate();
    const [term, setTerm] = useState('');
    const [i, setI] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const t = setInterval(() => setI(n => (n + 1) % ROTATING.length), 2600);
        return () => clearInterval(t);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    // Bütün alt konular, ana konuya göre karışık sırayla üç sütuna
    const columns = useMemo(() => {
        const all: Subject[] = CATEGORY_TREE.flatMap(p =>
            p.children.map(c => ({ name: c.name, to: `/courses/${p.slug}/${c.slug}` }))
        );
        const cols: Subject[][] = [[], [], []];
        all.forEach((s, n) => cols[n % 3].push(s));
        return cols;
    }, []);

    return (
        <section className="relative overflow-hidden bg-[#00201d] text-white">
            <style>{`
                @keyframes hero-up { from { transform: translateY(0) } to { transform: translateY(-50%) } }
                @keyframes hero-down { from { transform: translateY(-50%) } to { transform: translateY(0) } }
                @keyframes hero-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }
                .hero-flow:hover .hero-track { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) { .hero-track { animation: none !important; } }
            `}</style>

            {/* Zemin: tek nane ışığı ve ince nokta dokusu */}
            <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-40 -left-24 w-[640px] h-[640px] rounded-full bg-[#9cf2e8]/[0.10] blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(156,242,232,0.18) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                        maskImage: 'linear-gradient(90deg, #000 0%, transparent 60%)',
                        WebkitMaskImage: 'linear-gradient(90deg, #000 0%, transparent 60%)',
                    }}
                />
            </div>

            <div className="container relative px-4">
                <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-10 lg:gap-14 items-center py-14 sm:py-16 lg:py-0 lg:min-h-[560px]">

                    {/* ── Sol: cümle ve arama ───────────────────────────── */}
                    <div className="min-w-0 lg:py-20">
                        <h1 className="font-jakarta font-extrabold tracking-[-0.035em] leading-[1.02] text-[42px] sm:text-[58px] lg:text-[68px]">
                            <span className="block">Bugün</span>
                            <span className="block relative h-[1.08em] overflow-hidden" aria-live="polite">
                                <span
                                    key={i}
                                    className="absolute left-0 top-0 whitespace-nowrap text-[#9cf2e8] animate-in fade-in slide-in-from-bottom-6 duration-500 motion-reduce:animate-none"
                                >
                                    {ROTATING[i]}
                                </span>
                            </span>
                            <span className="block">öğrenmeye başla.</span>
                        </h1>

                        <p className="mt-6 text-[16.5px] sm:text-[18px] leading-relaxed text-[#b6d6d0] max-w-[34rem]">
                            Alanında çalışan eğitmenlerden Türkçe kurslar. Bir kez al, ömür boyu izle;
                            abonelik yok, ders saati yok.
                        </p>

                        <form onSubmit={submit} className="mt-9 max-w-[36rem]">
                            <label htmlFor="hero-search" className="sr-only">Kurs ara</label>
                            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] focus-within:ring-4 focus-within:ring-[#9cf2e8]/40 transition-shadow">
                                <Search aria-hidden className="w-5 h-5 text-[#4a6360] ml-3 shrink-0" />
                                <input
                                    id="hero-search"
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                    placeholder="Ne öğrenmek istiyorsun?"
                                    className="flex-1 min-w-0 bg-transparent px-2 py-3 text-[16px] text-[#00201d] placeholder:text-[#7c918e] outline-none"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 inline-flex items-center gap-2 h-12 px-5 sm:px-6 rounded-xl bg-[#9cf2e8] hover:bg-[#86e9dd] active:scale-[0.98] text-[#00201d] text-[15px] font-extrabold transition-[background-color,transform]"
                                >
                                    <span className="hidden sm:inline">Kurs bul</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="text-[13px] text-[#7fa8a1] mr-1">Çok arananlar</span>
                            {POPULAR.map(s => (
                                <Link
                                    key={s}
                                    to={`/search?q=${encodeURIComponent(s)}`}
                                    className="h-8 px-3.5 inline-flex items-center rounded-full ring-1 ring-inset ring-white/15 text-[13px] font-semibold text-[#d7efea] hover:bg-white/10 hover:ring-white/30 transition-colors"
                                >
                                    {s}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Sağ: akan konular (masaüstü) ───────────────────── */}
                    <div
                        className="hero-flow hidden lg:grid grid-cols-3 gap-3 h-[560px] -my-px"
                        style={{
                            maskImage: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
                        }}
                        aria-label="Konular"
                    >
                        {columns.map((col, c) => (
                            <div key={c} className="overflow-hidden">
                                <div
                                    className="hero-track flex flex-col gap-3"
                                    style={{ animation: `${c === 1 ? 'hero-down' : 'hero-up'} ${70 + c * 12}s linear infinite` }}
                                >
                                    {[...col, ...col].map((s, n) => (
                                        <SubjectChip key={n} s={s} tone={(n + c) % 5 === 0 ? 'mint' : (n + c) % 3 === 0 ? 'soft' : 'line'} hidden={n >= col.length} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Akan konular (telefon ve tablet): iki yatay şerit ────── */}
            <div
                className="hero-flow lg:hidden relative pb-12 space-y-3 overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
                    WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
                }}
                aria-label="Konular"
            >
                {[columns[0], columns[1]].map((row, r) => (
                    <div
                        key={r}
                        className="hero-track flex gap-3 w-max"
                        style={{ animation: `hero-left ${80 + r * 15}s linear infinite`, animationDirection: r ? 'reverse' : 'normal' }}
                    >
                        {[...row, ...row].map((s, n) => (
                            <SubjectChip key={n} s={s} tone={(n + r) % 4 === 0 ? 'mint' : 'line'} hidden={n >= row.length} inline />
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
};

const SubjectChip: React.FC<{ s: Subject; tone: 'mint' | 'soft' | 'line'; hidden?: boolean; inline?: boolean }> = ({
    s, tone, hidden, inline,
}) => (
    <Link
        to={s.to}
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden || undefined}
        className={cn(
            'group/chip flex items-center justify-between gap-3 rounded-2xl font-bold transition-colors duration-200',
            inline ? 'h-11 px-4 text-[13.5px] whitespace-nowrap' : 'min-h-[64px] px-4 py-3 text-[14px] leading-snug',
            tone === 'mint' && 'bg-[#9cf2e8] text-[#00201d] hover:bg-white',
            tone === 'soft' && 'bg-white/[0.07] text-white hover:bg-white/[0.14]',
            tone === 'line' && 'ring-1 ring-inset ring-white/[0.12] text-[#d7efea] hover:bg-white/[0.08] hover:text-white'
        )}
    >
        <span>{s.name}</span>
        <ArrowRight
            aria-hidden
            className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover/chip:opacity-100 group-hover/chip:translate-x-0 transition-[opacity,transform] duration-200"
        />
    </Link>
);

export default GuestHero;

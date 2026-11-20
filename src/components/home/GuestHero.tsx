import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, Check, Code2, Cpu, Palette, Search } from 'lucide-react';
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

const POPULAR = ['Python', 'Otomasyon', 'Excel', 'Grafik tasarım', 'Elektrik tesisatı'];
const PROMISES = ['Tek seferlik ödeme', 'Süresiz erişim', 'Bitirince sertifika'];

const byslug = (slug: string) => CATEGORY_TREE.find(c => c.slug === slug)!;

/**
 * Misafir ana sayfasının üst bölümü.
 *
 * Zemin logonun nane yeşili (#B2F0C8). Solda tek cümle, arama ve kısa
 * vaatler; sağda platformun dört büyük alanı karolar halinde. Karolar
 * doğrudan kategori sayfalarına gidiyor, alt dallar da tek tıkla açılıyor.
 *
 * Bölüm sayılara ya da kapak görsellerine dayanmıyor: platform büyüdükçe
 * değişen sayılar küçükken vitrini zayıflatıyordu.
 */
export const GuestHero: React.FC<{
    stats?: HeroStats;
    instructors?: HeroInstructor[];
}> = () => {
    const navigate = useNavigate();
    const [term, setTerm] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const soft = byslug('yazilim-teknoloji');
    const design = byslug('tasarim-gorsel-sanatlar');
    const eng = byslug('muhendislik-donanim');
    const biz = byslug('is-dunyasi-yonetim-finans');

    return (
        <section className="relative overflow-hidden bg-[#b2f0c8] text-[#111827]">
            <style>{`
                @keyframes hero-draw { from { stroke-dashoffset: 420 } to { stroke-dashoffset: 0 } }
                .hero-line { stroke-dasharray: 420; animation: hero-draw 900ms cubic-bezier(0.23,1,0.32,1) 250ms both; }
                @media (prefers-reduced-motion: reduce) { .hero-line { animation: none; } .hero-tile { animation: none !important; } }
            `}</style>

            {/* Arka planda iki yumuşak ışık; zemin düz kalmasın */}
            <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] w-[720px] h-[720px] rounded-full bg-white/35 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-56 -left-40 w-[560px] h-[560px] rounded-full bg-[#7EDFA2]/50 blur-3xl" />

            <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
                {/* Sol: söz ve arama */}
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 h-8 pl-2.5 pr-3.5 rounded-full bg-white/60 text-[13px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#1B7A43]" />
                        Türkçe online kurslar
                    </p>

                    <h1 className="mt-5 text-[40px] sm:text-[54px] lg:text-[64px] leading-[1.02] font-extrabold tracking-[-0.045em] text-balance">
                        Yeni bir beceri,{' '}
                        <span className="relative inline-block whitespace-nowrap">
                            bir kurs
                            <svg aria-hidden viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute left-0 -bottom-1.5 sm:-bottom-2 w-full h-[14px] sm:h-[18px]">
                                <path className="hero-line" d="M4 16 C 70 4, 150 4, 296 12" fill="none" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
                            </svg>
                        </span>{' '}
                        uzağında.
                    </h1>

                    <p className="mt-6 text-[16.5px] sm:text-[18px] leading-relaxed text-[#111827]/75 max-w-[50ch]">
                        Yazılımdan tasarıma, mühendislikten iş dünyasına; alanında çalışan eğitmenlerden
                        istediğin zaman izleyebileceğin kurslar.
                    </p>

                    <form onSubmit={submit} role="search" className="mt-8 max-w-[560px]">
                        <label htmlFor="hero-search" className="sr-only">Kurs ara</label>
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white shadow-[0_18px_40px_-22px_rgba(11,38,25,0.55)] focus-within:ring-2 focus-within:ring-[#111827]/25 transition-shadow">
                            <Search aria-hidden className="ml-3 w-5 h-5 shrink-0 text-[#6B7280]" />
                            <input
                                id="hero-search"
                                type="search"
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                placeholder="Ne öğrenmek istiyorsun?"
                                className="min-w-0 flex-1 h-12 bg-transparent text-[16px] text-[#111827] placeholder:text-[#9CA3AF] border-0 outline-none"
                            />
                            <button
                                type="submit"
                                className="shrink-0 inline-flex items-center gap-2 h-12 px-5 sm:px-6 rounded-xl bg-[#1B7A43] text-white text-[15px] font-bold hover:bg-[#16613A] active:scale-[0.98] transition-[background-color,transform]"
                            >
                                <span className="hidden sm:inline">Kurs bul</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#111827]/60 mr-1">Çok arananlar</span>
                        {POPULAR.map(s => (
                            <Link
                                key={s}
                                to={`/search?q=${encodeURIComponent(s)}`}
                                className="h-8 px-3.5 inline-flex items-center rounded-full bg-white/55 text-[13px] font-semibold hover:bg-white transition-colors"
                            >
                                {s}
                            </Link>
                        ))}
                    </div>

                    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                        {PROMISES.map(p => (
                            <li key={p} className="inline-flex items-center gap-2 text-[14px] font-semibold">
                                <span className="w-5 h-5 rounded-full bg-[#1B7A43] text-white flex items-center justify-center">
                                    <Check className="w-3 h-3" strokeWidth={3} />
                                </span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Sağ: dört büyük alan */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                    <Link
                        to={`/courses/${soft.slug}`}
                        className="hero-tile group col-span-2 sm:row-span-2 relative overflow-hidden rounded-[28px] bg-[#1B7A43] text-white p-6 sm:p-7 flex flex-col min-h-[260px] sm:min-h-[330px] animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both hover:-translate-y-0.5 transition-transform"
                    >
                        <span className="w-12 h-12 rounded-2xl bg-[#b2f0c8] text-[#111827] flex items-center justify-center">
                            <Code2 className="w-6 h-6" />
                        </span>
                        <pre aria-hidden className="mt-6 font-mono text-[12.5px] leading-[1.7] text-white/45 overflow-hidden">
                            <span className="text-white">const</span> hedef = <span className="text-[#f5c26b]">'yeni beceri'</span>;{'\n'}
                            <span className="text-white">await</span> öğren(hedef);{'\n'}
                            kariyer.<span className="text-[#7EDFA2]">ilerle</span>();
                        </pre>
                        <div className="mt-auto pt-6">
                            <p className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] leading-tight">{soft.name}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {soft.children.slice(0, 3).map(c => (
                                    <span key={c.slug} className="h-7 px-2.5 inline-flex items-center rounded-full bg-white/10 text-[12.5px] font-semibold text-white/85">
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <ArrowUpRight aria-hidden className="absolute top-6 right-6 w-6 h-6 text-white transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>

                    <Tile to={`/courses/${design.slug}`} icon={Palette} name={design.name} count={design.children.length} delay={80} />
                    <Tile to={`/courses/${eng.slug}`} icon={Cpu} name={eng.name} count={eng.children.length} delay={140} />

                    <div
                        className="hero-tile col-span-2 sm:col-span-3 rounded-[28px] bg-white/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                        style={{ animationDelay: '200ms' }}
                    >
                        <Link to={`/courses/${biz.slug}`} className="group flex items-center gap-3.5 min-w-0 flex-1">
                            <span className="w-11 h-11 shrink-0 rounded-2xl bg-white text-[#1B7A43] flex items-center justify-center">
                                <BarChart3 className="w-5 h-5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[16px] font-extrabold tracking-[-0.01em] leading-snug group-hover:underline underline-offset-4">{biz.name}</span>
                                <span className="block text-[13px] text-[#111827]/60">{`${biz.children.length} konu`}</span>
                            </span>
                        </Link>
                        <Link
                            to="/courses"
                            className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-[#1B7A43] text-white text-[14px] font-bold hover:bg-[#16613A] transition-colors"
                        >
                            Tüm kategoriler <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Tile: React.FC<{ to: string; icon: React.ElementType; name: string; count: number; delay: number }> = ({
    to, icon: Icon, name, count, delay,
}) => (
    <Link
        to={to}
        className={cn(
            'hero-tile group relative rounded-[28px] bg-white p-5 sm:p-6 flex flex-col justify-between min-h-[160px]',
            'shadow-[0_18px_40px_-28px_rgba(11,38,25,0.5)] hover:-translate-y-0.5 transition-transform',
            'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both'
        )}
        style={{ animationDelay: `${delay}ms` }}
    >
        <span className="w-11 h-11 rounded-2xl bg-[#E3F8EB] text-[#1B7A43] flex items-center justify-center">
            <Icon className="w-5 h-5" />
        </span>
        <span className="mt-5">
            <span className="block text-[15.5px] font-extrabold tracking-[-0.01em] leading-snug">{name}</span>
            <span className="block mt-1 text-[12.5px] text-[#111827]/55">{`${count} konu`}</span>
        </span>
        <ArrowUpRight aria-hidden className="absolute top-5 right-5 w-5 h-5 text-[#1B7A43] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-200" />
    </Link>
);

export default GuestHero;

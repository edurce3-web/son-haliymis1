import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight, Infinity as InfinityIcon, Users } from 'lucide-react';

const POPULAR_SEARCHES = ['Yapay Zeka', 'Python', 'React', 'Excel', 'İngilizce', 'Grafik Tasarım'];

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

/**
 * Misafir ana sayfasının kahraman bölümü.
 *
 * Üye sayfasındaki `HomeHero`'dan ayrı: oradaki iş kullanıcıyı bıraktığı derse
 * döndürmek, buradaki iş platformun ne olduğunu ve neden güvenilir olduğunu
 * tek ekranda göstermek. Bu yüzden solda arama, sağda sayılarla güven kartı
 * var ve zemin açık — koyu bir blok, altındaki beyaz kurs ızgarasından
 * kopuyordu.
 *
 * Sağdaki karttaki her sayı veritabanından geliyor. Sıfır olan kalem hiç
 * çizilmiyor; "0 eğitmen" yazmak rakam vermemekten kötü.
 */
export const GuestHero: React.FC<{
    stats?: HeroStats;
    instructors?: HeroInstructor[];
}> = ({ stats, instructors = [] }) => {
    const navigate = useNavigate();
    const [term, setTerm] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const tiles = [
        { value: stats?.courses, label: 'yayında kurs' },
        { value: stats?.instructors, label: 'uzman eğitmen' },
        { value: stats?.hours, label: 'saat video içerik' },
        { value: stats?.reviews, label: 'öğrenci yorumu' },
    ].filter(t => (Number(t.value) || 0) > 0);

    const faces = instructors.filter(i => i.image).slice(0, 4);

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white border-b border-slate-200/80">

            {/* Zemin dokusu: marka renginden iki yumuşak ışık ve ince ızgara.
                Düz beyaz zemin, altındaki kart bölümlerinden ayrışmıyordu. */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -top-44 -left-32 w-[560px] h-[560px] bg-brand-300/30 rounded-full blur-[140px]" />
                <div className="absolute -bottom-52 right-[-8rem] w-[620px] h-[620px] bg-brand-200/40 rounded-full blur-[150px]" />
                <div
                    className="absolute inset-0 opacity-[0.55]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(23,93,93,.05) 1px, transparent 1px),'
                            + 'linear-gradient(90deg, rgba(23,93,93,.05) 1px, transparent 1px)',
                        backgroundSize: '58px 58px',
                        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%)',
                    }}
                />
            </div>

            <div className="container relative px-4 py-14 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">

                    {/* ── Sol: vaat ve arama ──────────────────────────────── */}
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-brand-200 text-brand-800 shadow-sm backdrop-blur-sm">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                                Türkçe · Süresiz erişim · Abonelik yok
                            </span>
                        </div>

                        <h1 className="font-montserrat text-[34px] sm:text-[44px] lg:text-[50px] font-extrabold text-slate-900 tracking-tight leading-[1.08] mt-6">
                            Öğrenmek istediğin şeyi{' '}
                            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
                                kendi hızında
                            </span>{' '}
                            öğren
                        </h1>

                        <p className="text-[16px] lg:text-[17.5px] text-slate-600 leading-relaxed mt-5 max-w-2xl">
                            Yazılımdan tasarıma, mühendislikten müziğe. Alanında çalışan
                            eğitmenlerin anlattığı Türkçe kurslar; bir kez alırsın, ömür boyu
                            senin kalır.
                        </p>

                        <form onSubmit={submit} className="mt-8 max-w-xl">
                            <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.22)] focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-400/15 transition-all">
                                <Search className="w-5 h-5 text-slate-400 ml-2.5 shrink-0" />
                                <input
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                    placeholder="Hangi alanda ilerlemek istiyorsun?"
                                    aria-label="Kurs ara"
                                    className="flex-1 min-w-0 px-2 py-2.5 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-[14px] font-bold transition-colors"
                                >
                                    Keşfet
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className="text-[12px] font-semibold text-slate-500 mr-0.5">
                                Popüler:
                            </span>
                            {POPULAR_SEARCHES.map(s => (
                                <Link
                                    key={s}
                                    to={`/search?q=${encodeURIComponent(s)}`}
                                    className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-[12px] font-semibold hover:border-brand-400 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                                >
                                    {s}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Sağ: güven kartı ────────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <div className="relative rounded-3xl bg-white border border-slate-200 p-6 shadow-[0_32px_70px_-32px_rgba(13,56,56,0.35)]">

                            {(Number(stats?.students) || 0) > 0 && (
                                <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-100">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-12 h-12 rounded-2xl bg-brand-700 flex items-center justify-center shrink-0 shadow-lg shadow-brand-700/25">
                                            <Users className="w-6 h-6 text-white" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-montserrat text-[22px] font-extrabold text-slate-900 tabular-nums leading-none">
                                                {Number(stats?.students).toLocaleString('tr-TR')}
                                            </p>
                                            <p className="text-[12.5px] text-slate-500 mt-1">
                                                öğrenci Edurce'de ders izliyor
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold tracking-wide border border-emerald-100">
                                        CANLI
                                    </span>
                                </div>
                            )}

                            {tiles.length > 0 && (
                                <dl className="grid grid-cols-2 gap-3 mt-5">
                                    {tiles.map(t => (
                                        <div
                                            key={t.label}
                                            className="rounded-2xl bg-brand-50/70 border border-brand-100 px-4 py-3.5"
                                        >
                                            <dd className="font-montserrat text-[19px] font-extrabold text-brand-800 tabular-nums leading-none">
                                                {Number(t.value).toLocaleString('tr-TR')}
                                            </dd>
                                            <dt className="text-[12px] text-slate-500 mt-1.5">{t.label}</dt>
                                        </div>
                                    ))}
                                </dl>
                            )}

                            <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-slate-100">
                                {faces.length > 0 ? (
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex -space-x-2.5 shrink-0">
                                            {faces.map(i => (
                                                <Link
                                                    key={i.id}
                                                    to={`/instructors/${i.id}`}
                                                    title={i.name}
                                                    className="block w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-slate-100 hover:ring-brand-300 transition-all"
                                                >
                                                    <img
                                                        src={i.image}
                                                        alt={i.name}
                                                        className="w-full h-full object-cover"
                                                        onError={e => {
                                                            (e.target as HTMLImageElement).style.visibility = 'hidden';
                                                        }}
                                                    />
                                                </Link>
                                            ))}
                                        </div>
                                        <p className="text-[12.5px] text-slate-500 leading-snug min-w-0">
                                            Alanında çalışan<br />eğitmenlerden
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[12.5px] text-slate-500 leading-snug">
                                        Alanında çalışan eğitmenlerden
                                    </p>
                                )}

                                <span className="flex items-center gap-1.5 shrink-0 text-[12px] font-bold text-brand-800 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1.5">
                                    <InfinityIcon className="w-4 h-4" />
                                    Süresiz erişim
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GuestHero;

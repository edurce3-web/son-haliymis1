import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, getCourseImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_TREE } from '@/data/categoryTree';

/*
 * Kategori ve arama sayfalarının yardımcı parçaları.
 *
 * Önceki sürümde sonuçların üstünde büyük bir vitrin vardı (seviye kartları,
 * paket destesi, eğitmenler); kurslar ekranın ortasına itiliyordu. Artık
 * kurslar ilk sırada. Paketler kurs ızgarasının arasına ince bir şerit olarak
 * giriyor, eğitmenler listenin altına iniyor, arama sayfasının ilgili
 * konuları başlığın altında tek satır.
 */

interface BundleCourse { id: number; title: string; image?: string; thumbnail?: string | null; category_name?: string | null }
export interface Bundle {
    id: number;
    title: string;
    price: number;
    list_total: number;
    savings_percent: number;
    total_hours: number;
    course_count: number;
    courses: BundleCourse[];
}

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

const lira = (n: number) => {
    const v = Number(n) || 0;
    const digits = Math.round(v * 100) % 100 === 0 ? 0 : 2;
    return `${v.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ₺`;
};

function usePublicBundles() {
    return useQuery<Bundle[]>({
        queryKey: ['public-bundles'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/home`);
            if (!r.ok) return [];
            const d = await r.json();
            return (d.bundles || []) as Bundle[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Sayfaya uyan paketler.
 *
 * Kategoride: içinde bu alanın kursu olan paketler; yoksa hepsi.
 * Aramada: adında ya da kurslarında aranan kelime geçen paketler.
 */
export function useCatalogBundles(opts: { categorySlug?: string; categoryName?: string; subcategoryName?: string; query?: string }) {
    const { data: bundles = [] } = usePublicBundles();
    const { categorySlug, categoryName, subcategoryName, query } = opts;

    return useMemo(() => {
        if (query) {
            const tokens = norm(query).split(' ').filter(t => t.length >= 3);
            if (!tokens.length) return { list: [] as Bundle[], related: false };
            const list = bundles.filter(b => tokens.some(t => norm(b.title).includes(t) || (b.courses || []).some(c => norm(c.title).includes(t))));
            return { list, related: true };
        }
        if (!categoryName) return { list: bundles, related: false };
        const names = new Set<string>([norm(categoryName)]);
        if (subcategoryName) names.add(norm(subcategoryName));
        else CATEGORY_TREE.find(c => c.slug === categorySlug)?.children.forEach(c => names.add(norm(c.name)));
        const related = bundles.filter(b => (b.courses || []).some(c => c.category_name && names.has(norm(c.category_name))));
        return related.length ? { list: related, related: true } : { list: bundles, related: false };
    }, [bundles, categorySlug, categoryName, subcategoryName, query]);
}

/* ── Paket şeridi ─────────────────────────────────────────────────────── */

export const BundleStrip: React.FC<{ bundles: Bundle[]; title: string }> = ({ bundles, title }) => {
    if (!bundles.length) return null;
    return (
        <section aria-label={title} className="col-span-full rounded-[22px] bg-[#EEFBF3] px-4 sm:px-5 py-4">
            <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-[16px] sm:text-[17px] font-extrabold tracking-[-0.01em] text-[#0A2A1A]">{title}</h2>
                <span className="hidden sm:inline text-[12.5px] font-semibold text-[#1B7A43]">Tek tek almaktan daha uygun</span>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {bundles.map(b => <BundleTile key={b.id} bundle={b} />)}
            </div>
        </section>
    );
};

const BundleTile: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth() as any;
    const courses = bundle.courses || [];
    const count = bundle.course_count || courses.length;

    const buy = () => {
        const target = `/checkout?bundle=${bundle.id}`;
        navigate(isAuthenticated ? target : `/login?redirect=${encodeURIComponent(target)}`);
    };

    return (
        <article className="snap-start shrink-0 w-[300px] sm:w-[340px] flex gap-3 rounded-2xl bg-white p-3 ">
            {/* Üst üste kapaklar: paketin kaç kurstan oluştuğu bir bakışta */}
            <div className="relative w-[84px] h-[84px] shrink-0">
                {courses.slice(0, 3).map((c, i) => (
                    <img
                        key={c.id}
                        src={getCourseImageUrl(c.id, c.image || c.thumbnail || null)}
                        alt=""
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        className="absolute w-[68px] h-[68px] rounded-xl object-cover bg-[#F1F3F5]"
                        style={{ left: i * 8, top: i * 8, zIndex: 3 - i }}
                    />
                ))}
                <span className="absolute z-10 -bottom-0.5 -right-0.5 min-w-[26px] h-[22px] px-1.5 rounded-full bg-[#0A2A1A] text-white text-[11px] font-extrabold flex items-center justify-center tabular-nums">
                    {`${count} kurs`}
                </span>
            </div>

            <div className="min-w-0 flex-1 flex flex-col">
                <h3 className="text-[13.5px] leading-[18px] font-extrabold text-[#111827] line-clamp-2">{bundle.title}</h3>
                {bundle.savings_percent > 0 && (
                    <p className="mt-0.5 text-[11.5px] font-bold text-[#1B7A43]">{`%${bundle.savings_percent} tasarruf`}</p>
                )}
                <div className="mt-auto pt-1.5 flex items-end justify-between gap-2">
                    <span className="min-w-0">
                        {bundle.list_total > bundle.price && (
                            <span className="block text-[11px] text-[#9CA3AF] line-through tabular-nums leading-none">{lira(bundle.list_total)}</span>
                        )}
                        <span className="block text-[16px] font-extrabold text-[#111827] tabular-nums leading-tight">{lira(bundle.price)}</span>
                    </span>
                    <button
                        type="button"
                        onClick={buy}
                        className="shrink-0 h-8 px-3 rounded-lg bg-[#1B7A43] hover:bg-[#16613A] active:scale-[0.98] text-white text-[12.5px] font-bold transition-[background-color,transform] duration-150"
                    >
                        Paketi al
                    </button>
                </div>
            </div>
        </article>
    );
};

/* ── Arama: ilgili konular ────────────────────────────────────────────── */

export function useRelatedTopics(query: string) {
    return useMemo(() => {
        const tokens = norm(query).split(' ').filter(t => t.length >= 3);
        if (!tokens.length) return [];
        const out: Array<{ name: string; to: string }> = [];
        for (const cat of CATEGORY_TREE) {
            if (tokens.some(t => norm(cat.name).includes(t))) out.push({ name: cat.name, to: `/courses/${cat.slug}` });
            for (const sub of cat.children) {
                if (tokens.some(t => norm(sub.name).includes(t))) out.push({ name: sub.name, to: `/courses/${cat.slug}/${sub.slug}` });
            }
        }
        return out.slice(0, 10);
    }, [query]);
}

/* ── Eğitmenler: listenin altında tek satır ───────────────────────────── */

export const InstructorRow: React.FC<{ instructors: Array<{ id: number; name: string; count: number }>; scope: string }> = ({ instructors, scope }) => {
    if (instructors.length < 2) return null;
    return (
        <section className="mt-12">
            <h2 className="text-[16px] font-extrabold text-[#111827] mb-3">{`${scope} eğitmenleri`}</h2>
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {instructors.map(ins => (
                    <Link
                        key={ins.id}
                        to={`/instructors/${ins.id}`}
                        className="shrink-0 flex items-center gap-2.5 h-12 pl-1.5 pr-4 rounded-2xl bg-[#F5F6F8] hover:bg-[#EEFBF3] transition-colors"
                    >
                        <span className="w-9 h-9 rounded-xl bg-[#B2F0C8] text-[#134D30] text-[12px] font-extrabold flex items-center justify-center">
                            {ins.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR')}
                        </span>
                        <span className="leading-tight">
                            <span className="block text-[13px] font-bold whitespace-nowrap">{ins.name}</span>
                            <span className="block text-[11.5px] text-[#6B7280]">{`${ins.count} kurs`}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

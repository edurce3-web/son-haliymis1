import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star } from 'lucide-react';
import { API_BASE_URL, getCourseImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CATEGORY_TREE } from '@/data/categoryTree';
import BundleDeck from '@/components/home/BundleDeck';
import type { CatalogFacets } from './CatalogFilters';

/*
 * Kategori ve arama sayfalarının vitrini.
 *
 * Sonuç listesinin üstünde, yalnızca ilk sayfada ve filtre seçilmemişken
 * görünür. Amaç ziyaretçiye "nereden başlarım" sorusunun cevabını vermek ve
 * paketleri (toplu kursları) öne çıkarmak:
 *
 *   Kategori: seviye yolu → bu alandaki paketler → sekmeli raflar →
 *             alanın eğitmenleri
 *   Arama:    ilgili konular → aramayla eşleşen paketler
 *
 * Paketler ana sayfa verisinden geliyor (/api/home); ayrı bir uç noktaya
 * gerek kalmadan içinde bu alanın kursu bulunan paketler seçiliyor.
 */

interface ShowcaseCourse {
    id: number;
    course_id?: number;
    title: string;
    slug?: string;
    image?: string;
    image_path?: string;
    thumbnail?: string;
    price?: number;
    rating?: number;
    review_count?: number;
    student_count?: number;
    level?: string;
    instructor_id?: number;
    instructor_name?: string;
    category_name?: string;
}

interface BundleCourse { id: number; title: string; category_name?: string }
interface Bundle { id: number; title: string; courses: BundleCourse[]; [k: string]: any }

const LEVEL_STEPS = [
    { level: 'Başlangıç', title: 'Temelden başla', text: 'Hiç bilmiyorsan buradan başla; konuyu sıfırdan kurarsın.' },
    { level: 'Orta', title: 'Derinleş', text: 'Temelin varsa uygulamalı projelerle bir üst seviyeye geç.' },
    { level: 'İleri', title: 'Ustalaş', text: 'İleri teknikler ve gerçek iş problemleriyle uzmanlaş.' },
];

const TABS = [
    { sort: 'popular', label: 'En çok tercih edilenler' },
    { sort: 'newest', label: 'Yeni çıkanlar' },
    { sort: 'rating', label: 'En yüksek puanlılar' },
];

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const lira = (n?: number) => (Number(n) > 0 ? `₺${Number(n).toLocaleString('tr-TR')}` : 'Ücretsiz');

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

/* ── Kategori vitrini ─────────────────────────────────────────────────── */

export const CategoryShowcase: React.FC<{
    categorySlug: string;
    categoryName: string;
    subcategorySlug?: string;
    subcategoryName?: string;
    facets?: CatalogFacets | null;
    onLevel: (level: string) => void;
}> = ({ categorySlug, categoryName, subcategorySlug, subcategoryName, facets, onLevel }) => {
    const [tab, setTab] = useState(TABS[0].sort);
    const { data: bundles = [] } = usePublicBundles();

    const scopeName = subcategoryName || categoryName;
    const tree = CATEGORY_TREE.find(c => c.slug === categorySlug);
    const names = useMemo(() => {
        const set = new Set<string>([norm(categoryName)]);
        if (subcategoryName) set.add(norm(subcategoryName));
        else tree?.children.forEach(c => set.add(norm(c.name)));
        return set;
    }, [categoryName, subcategoryName, tree]);

    const related = bundles.filter(b => (b.courses || []).some(c => c.category_name && names.has(norm(c.category_name))));
    const shownBundles = related.length > 0 ? related : bundles;

    const { data: rail, isLoading } = useQuery<ShowcaseCourse[]>({
        queryKey: ['showcase-rail', categorySlug, subcategorySlug, tab],
        queryFn: async () => {
            const p = new URLSearchParams({ category: categorySlug, sort: tab, limit: '10' });
            if (subcategorySlug) p.set('subcategory', subcategorySlug);
            const r = await fetch(`${API_BASE_URL}/catalog?${p}`);
            if (!r.ok) return [];
            const d = await r.json();
            return d.courses || [];
        },
        staleTime: 60 * 1000,
    });

    const instructors = useMemo(() => {
        const map = new Map<number, { id: number; name: string; count: number; rating: number }>();
        for (const c of rail || []) {
            if (!c.instructor_id || !c.instructor_name?.trim()) continue;
            const cur = map.get(c.instructor_id) || { id: c.instructor_id, name: c.instructor_name.trim(), count: 0, rating: 0 };
            cur.count += 1;
            cur.rating = Math.max(cur.rating, Number(c.rating) || 0);
            map.set(c.instructor_id, cur);
        }
        return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
    }, [rail]);

    const levelCount = (lvl: string) => facets?.levels?.find(l => l.level === lvl)?.count ?? 0;
    const anyLevel = LEVEL_STEPS.some(s => levelCount(s.level) > 0);

    return (
        <div className="space-y-10 mb-12">
            {/* Seviye yolu */}
            {anyLevel && (
                <section>
                    <SectionHead title={`${scopeName}: seviyene göre başla`} sub="Nerede olduğunu seç, sana uygun kursları gösterelim." />
                    <ol className="mt-5 grid md:grid-cols-3 gap-3">
                        {LEVEL_STEPS.map((s, i) => {
                            const n = levelCount(s.level);
                            return (
                                <li key={s.level}>
                                    <button
                                        type="button"
                                        disabled={n === 0}
                                        onClick={() => onLevel(s.level)}
                                        className={cn(
                                            'group relative w-full h-full text-left rounded-[24px] p-5 sm:p-6 transition-colors',
                                            i === 0 ? 'bg-[#B2F0C8] hover:bg-[#9BE8B6]' : 'bg-[#F5F6F8] hover:bg-[#EEFBF3]',
                                            n === 0 && 'opacity-50 cursor-not-allowed hover:bg-[#F5F6F8]'
                                        )}
                                    >
                                        <span className="flex items-center justify-between gap-3">
                                            <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#134D30]">
                                                {`${i + 1}. adım · ${s.level}`}
                                            </span>
                                            <span className="h-7 px-2.5 inline-flex items-center rounded-full bg-white text-[12.5px] font-bold tabular-nums">
                                                {`${n} kurs`}
                                            </span>
                                        </span>
                                        <span className="block mt-4 text-[20px] font-extrabold tracking-[-0.015em]">{s.title}</span>
                                        <span className="block mt-1.5 text-[14px] leading-relaxed text-[#374151]">{s.text}</span>
                                        <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#1B7A43]">
                                            Kursları göster <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}

            {/* Paketler */}
            {shownBundles.length > 0 && (
                <BundleDeck
                    bundles={shownBundles as any}
                    embedded
                    title={related.length > 0 ? `${scopeName} paketleri` : 'Mega paketler'}
                    subtitle={related.length > 0
                        ? 'Bu alanın kurslarını bir arada al; tek tek almaktan daha uygun.'
                        : 'Birden çok kursu bir arada, tek tek almaktan daha uygun fiyata al.'}
                />
            )}

            {/* Sekmeli raf */}
            <section>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <SectionHead title={`${scopeName} kursları`} sub="Başlamak için öne çıkanlar" />
                    <div role="tablist" className="flex gap-1 p-1 rounded-2xl bg-[#F5F6F8] overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        {TABS.map(t => (
                            <button
                                key={t.sort}
                                role="tab"
                                aria-selected={tab === t.sort}
                                onClick={() => setTab(t.sort)}
                                className={cn(
                                    'shrink-0 h-9 px-4 rounded-xl text-[13.5px] font-bold transition-colors',
                                    tab === t.sort ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.08)]' : 'text-[#6B7280] hover:text-[#111827]'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-5 flex gap-4 overflow-x-auto snap-x pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {isLoading && Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="shrink-0 w-[250px] h-[250px] rounded-[20px] bg-[#F5F6F8] animate-pulse" />
                    ))}
                    {(rail || []).map(c => <RailCard key={c.id ?? c.course_id} course={c} />)}
                    {!isLoading && (rail || []).length === 0 && (
                        <p className="text-[14px] text-[#6B7280] py-6">Bu alanda henüz kurs yok.</p>
                    )}
                </div>
            </section>

            {/* Eğitmenler */}
            {instructors.length > 0 && (
                <section>
                    <SectionHead title={`${scopeName} eğitmenleri`} sub="Bu alanda kurs veren eğitmenler" />
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {instructors.map(ins => (
                            <Link
                                key={ins.id}
                                to={`/instructors/${ins.id}`}
                                className="rounded-[20px] bg-[#F5F6F8] hover:bg-[#EEFBF3] p-4 transition-colors"
                            >
                                <span className="w-11 h-11 rounded-full bg-[#B2F0C8] text-[#134D30] text-[15px] font-extrabold flex items-center justify-center">
                                    {ins.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR')}
                                </span>
                                <span className="block mt-3 text-[14px] font-bold truncate">{ins.name}</span>
                                <span className="block mt-0.5 text-[12.5px] text-[#6B7280]">
                                    {`${ins.count} kurs`}{ins.rating > 0 ? ` · ${ins.rating.toFixed(1)} puan` : ''}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

/* ── Arama vitrini ────────────────────────────────────────────────────── */

export const SearchShowcase: React.FC<{ query: string }> = ({ query }) => {
    const { data: bundles = [] } = usePublicBundles();
    const q = norm(query);
    const tokens = q.split(' ').filter(t => t.length >= 3);

    const topics = useMemo(() => {
        if (!tokens.length) return [];
        const out: Array<{ name: string; to: string; parent?: string }> = [];
        for (const cat of CATEGORY_TREE) {
            if (tokens.some(t => norm(cat.name).includes(t))) out.push({ name: cat.name, to: `/courses/${cat.slug}` });
            for (const sub of cat.children) {
                if (tokens.some(t => norm(sub.name).includes(t))) out.push({ name: sub.name, to: `/courses/${cat.slug}/${sub.slug}`, parent: cat.name });
            }
        }
        return out.slice(0, 10);
    }, [q]);

    const matched = tokens.length
        ? bundles.filter(b => tokens.some(t => norm(b.title).includes(t) || (b.courses || []).some(c => norm(c.title).includes(t))))
        : [];

    if (!topics.length && !matched.length) return null;

    return (
        <div className="space-y-8 mb-10">
            {topics.length > 0 && (
                <section>
                    <SectionHead title="İlgili konular" sub="Aramanla eşleşen kategoriler; doğrudan oraya git." />
                    <div className="mt-4 flex flex-wrap gap-2">
                        {topics.map(t => (
                            <Link
                                key={t.to}
                                to={t.to}
                                className="h-10 px-4 inline-flex items-center gap-2 rounded-2xl bg-[#F5F6F8] hover:bg-[#EEFBF3] hover:text-[#1B7A43] text-[14px] font-bold transition-colors"
                            >
                                {t.name}
                                {t.parent && <span className="text-[12px] font-medium text-[#9CA3AF]">{t.parent}</span>}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
            {matched.length > 0 && (
                <BundleDeck
                    bundles={matched as any}
                    embedded
                    title={`"${query}" içeren paketler`}
                    subtitle="Aradığın konudaki kursları bir arada, daha uygun fiyata al."
                />
            )}
        </div>
    );
};

/* ── Parçalar ─────────────────────────────────────────────────────────── */

const SectionHead: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
    <div className="min-w-0">
        <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-[-0.02em] text-[#111827]">{title}</h2>
        {sub && <p className="mt-1 text-[14px] text-[#6B7280]">{sub}</p>}
    </div>
);

const RailCard: React.FC<{ course: ShowcaseCourse }> = ({ course }) => {
    const id = course.course_id ?? course.id;
    const img = getCourseImageUrl(id, course.image || course.image_path || course.thumbnail);
    const href = `/course/${course.slug || id}`;
    const rating = Number(course.rating) || 0;
    return (
        <Link to={href} className="group shrink-0 snap-start w-[250px] rounded-[20px] bg-white ring-1 ring-black/[0.06] overflow-hidden hover:shadow-[0_18px_40px_-22px_rgba(17,24,39,0.35)] transition-shadow">
            <span className="block aspect-video bg-[#F1F3F5] overflow-hidden">
                <img
                    src={img}
                    alt=""
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
            </span>
            <span className="block p-3.5">
                <span className="block text-[14px] font-bold leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-[#1B7A43] transition-colors">{course.title}</span>
                {course.instructor_name && <span className="block mt-1 text-[12.5px] text-[#6B7280] truncate">{course.instructor_name}</span>}
                <span className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[12.5px] text-[#6B7280]">
                        {rating > 0 ? (
                            <>
                                <Star className="w-3.5 h-3.5 fill-[#f5a524] text-[#f5a524]" />
                                <b className="text-[#111827]">{rating.toFixed(1)}</b>
                            </>
                        ) : course.level || ''}
                    </span>
                    <span className="text-[15px] font-extrabold tabular-nums">{lira(course.price)}</span>
                </span>
            </span>
        </Link>
    );
};

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
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
    subcategoryName?: string;
    facets?: CatalogFacets | null;
    instructors?: Array<{ id: number; name: string; count: number }>;
    onLevel: (level: string) => void;
}> = ({ categorySlug, categoryName, subcategoryName, facets, instructors = [], onLevel }) => {
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

    const levelCount = (lvl: string) => facets?.levels?.find(l => l.level === lvl)?.count ?? 0;
    const anyLevel = LEVEL_STEPS.some(s => levelCount(s.level) > 0);

    return (
        <div className="space-y-6 mb-8">
            {/* Seviye yolu: tek ince satır */}
            {anyLevel && (
                <section aria-label="Seviyene göre başla" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {LEVEL_STEPS.map((s, i) => {
                        const n = levelCount(s.level);
                        return (
                            <button
                                key={s.level}
                                type="button"
                                disabled={n === 0}
                                onClick={() => onLevel(s.level)}
                                className={cn(
                                    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                                    i === 0 ? 'bg-[#B2F0C8] hover:bg-[#9BE8B6]' : 'bg-[#F5F6F8] hover:bg-[#EEFBF3]',
                                    n === 0 && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <span className="w-8 h-8 shrink-0 rounded-full bg-white text-[13px] font-extrabold flex items-center justify-center tabular-nums">{i + 1}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-extrabold leading-tight">{`${s.title} · ${s.level}`}</span>
                                    <span className="block text-[12.5px] text-[#4B5563]">{`${n} kurs`}</span>
                                </span>
                                <ArrowRight className="w-4 h-4 text-[#1B7A43] shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        );
                    })}
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

            {/* Eğitmenler: küçük çipler */}
            {instructors.length > 0 && (
                <section className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] mr-1">Eğitmenler</span>
                    {instructors.map(ins => (
                        <Link
                            key={ins.id}
                            to={`/instructors/${ins.id}`}
                            className="shrink-0 h-10 pl-1 pr-3.5 inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] hover:bg-[#EEFBF3] transition-colors"
                        >
                            <span className="w-8 h-8 rounded-full bg-[#B2F0C8] text-[#134D30] text-[11.5px] font-extrabold flex items-center justify-center">
                                {ins.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR')}
                            </span>
                            <span className="text-[13px] font-bold whitespace-nowrap">{ins.name}</span>
                            <span className="text-[12px] text-[#9CA3AF] tabular-nums">{ins.count}</span>
                        </Link>
                    ))}
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
        <div className="space-y-5 mb-8">
            {topics.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] mr-1">İlgili konular</span>
                        {topics.map(t => (
                            <Link
                                key={t.to}
                                to={t.to}
                                className="shrink-0 h-9 px-3.5 inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] hover:bg-[#EEFBF3] hover:text-[#1B7A43] text-[13px] font-bold whitespace-nowrap transition-colors"
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import {
    Search, SlidersHorizontal, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CatalogFilters, { type CatalogFacets, type FilterState, type FacetCategory } from './CatalogFilters';
import { type CatalogCourse } from './CatalogCourseCard';
import { ShelfCourseCard } from '@/components/home/ShelfCourseCard';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { CATEGORY_TREE } from '@/data/categoryTree';
import { CategoryShowcase, SearchShowcase } from './CatalogShowcase';

interface CategoryRef {
    category_id: number;
    name: string;
    slug: string;
    description?: string;
}

interface CatalogResponse {
    courses: CatalogCourse[];
    category: CategoryRef | null;
    subcategory: CategoryRef | null;
    subcategories: FacetCategory[];
    facets: CatalogFacets;
    pagination: { page: number; limit: number; total: number; totalPages: number };
    sort: string;
    seo: {
        title: string; description: string; robots: string; canonical: string;
        prev: string | null; next: string | null;
        breadcrumbs: Array<{ name: string; url: string }>;
        jsonLd: unknown[];
    };
}

const SORT_OPTIONS = [
    { value: 'relevance', label: 'En ilgili' },
    { value: 'popular', label: 'Popüler' },
    { value: 'rating', label: 'En yüksek puan' },
    { value: 'newest', label: 'En yeni' },
    { value: 'price_asc', label: 'Ucuzdan pahalıya' },
    { value: 'price_desc', label: 'Pahalıdan ucuza' },
];

interface Props {
    /** 'search' = /search, 'category' = /courses/:slug */
    mode: 'search' | 'category';
    categorySlug?: string;
    subcategorySlug?: string;
}

export const CatalogPage: React.FC<Props> = ({ mode, categorySlug, subcategorySlug }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState<CatalogResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Sahip olunan ve sepetteki kurslar — kartın doğru butonu göstermesi için
    const { ownedIds, cartIds, progressById } = useOwnedCourses();

    // URL tek gerçek kaynak: filtreler adres çubuğunda durur ki sayfa
    // paylaşılabilsin, geri tuşu çalışsın ve arama motoru varyantları görsün.
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const sort = searchParams.get('sort') || '';

    const filters: FilterState = useMemo(() => ({
        levels: (searchParams.get('level') || '').split(',').filter(Boolean),
        minRating: parseFloat(searchParams.get('minRating') || '0') || 0,
        freeOnly: searchParams.get('free') === '1',
    }), [searchParams]);

    // Kategori ağacı — yan çubuk ve alt kategori şeridi bunu kullanır.
    // Katalog yanıtındaki facet'lerden ayrı: facet'ler aktif filtreye göre
    // daralır, bu ise her zaman tüm kategorileri verir.
    const { data: navData } = useCategoryNav();
    const navCategories = navData?.categories || [];

    const updateParams = useCallback((changes: Record<string, string | null>, resetPage = true) => {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
        }
        if (resetPage) next.delete('page');
        setSearchParams(next, { replace: false });
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const params = new URLSearchParams();
                if (query) params.set('q', query);
                if (categorySlug) params.set('category', categorySlug);
                if (subcategorySlug) params.set('subcategory', subcategorySlug);
                if (filters.levels.length) params.set('level', filters.levels.join(','));
                if (filters.minRating) params.set('minRating', String(filters.minRating));
                if (filters.freeOnly) params.set('free', '1');
                if (sort) params.set('sort', sort);
                if (page > 1) params.set('page', String(page));

                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/catalog?${params.toString()}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (res.status === 404) {
                    if (!cancelled) { setNotFound(true); setData(null); }
                    return;
                }
                if (!res.ok) throw new Error('Katalog alınamadı');

                const json = await res.json();
                if (!cancelled) setData(json);
            } catch {
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [query, categorySlug, subcategorySlug, filters, sort, page]);

    // Sayfa değişince listenin başına dön — filtre değiştirince kullanıcı
    // sonuçların ortasında kalmasın
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    useSeo(data?.seo, [data?.seo?.canonical, data?.seo?.title]);

    const facets = data?.facets;
    const pagination = data?.pagination;
    const courses = data?.courses || [];

    /**
     * Kategori bağlantısı.
     *
     * Arama terimi bilinçli olarak taşınmıyor: kategori seçimi ile arama iki
     * ayrı gezinme yolu. Önceden ikisi birleşiyor ve "yazılım" araması bir
     * kategoriye girildiğinde de uygulanmaya devam ediyordu; kullanıcı
     * kategoriye baktığını sanarken aslında kategori içinde arama sonucu
     * görüyordu.
     */
    const categoryHref = useCallback((slug: string) => `/courses/${slug}`, []);

    const resetFilters = () => updateParams({ level: null, minRating: null, free: null });

    /** "Tüm kurslar" — arama terimini taşımaz, katalogun tamamına gider */
    const allCoursesHref = '/courses';


    const heading = data?.subcategory?.name
        || data?.category?.name
        || (query ? `"${query}" için sonuçlar` : 'Tüm kurslar');

    const activeFilterCount =
        filters.levels.length + (filters.minRating ? 1 : 0) + (filters.freeOnly ? 1 : 0);

    const showShowcase = Boolean(data) && page === 1 && activeFilterCount === 0 && (Boolean(data?.category) || Boolean(query));

    if (notFound) {
        return (
            <div className="min-h-[70vh] bg-white flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Kategori bulunamadı</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Aradığın kategori kaldırılmış ya da adresi değişmiş olabilir.
                    </p>
                    <Link to="/courses">
                        <Button className="rounded-xl bg-[#1B7A43] hover:bg-[#16613A] font-bold">
                            Tüm kurslara göz at
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const activeCat = data?.category ? navCategories.find(c => c.slug === data.category!.slug) : null;
    const treeCat = data?.category ? CATEGORY_TREE.find(c => c.slug === data.category!.slug) : null;
    const description = data?.subcategory?.description
        || data?.category?.description
        || (!data?.subcategory ? treeCat?.description : null)
        || (query ? null : (!data?.category ? 'Yazılımdan tasarıma, mühendislikten iş dünyasına; alanında uzman eğitmenlerden Türkçe online kurslar.' : null));
    const eyebrow = data?.subcategory ? data.category?.name : data?.category ? 'Kategori' : query ? 'Arama' : 'Katalog';

    // Bu sayfadaki kursların eğitmenleri — vitrinde küçük bir satır
    const instructors = (() => {
        const map = new Map<number, { id: number; name: string; count: number }>();
        for (const c of courses as any[]) {
            if (!c.instructor_id || !String(c.instructor_name || '').trim()) continue;
            const cur = map.get(c.instructor_id) || { id: c.instructor_id, name: String(c.instructor_name).trim(), count: 0 };
            cur.count += 1;
            map.set(c.instructor_id, cur);
        }
        return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    })();

    const currentSort = data?.sort || sort || (query ? 'relevance' : 'popular');
    const sortTabs = SORT_OPTIONS.filter(o => o.value !== 'relevance' || query);
    const applyFilters = (changes: Partial<FilterState>) => updateParams({
        level: changes.levels !== undefined
            ? (changes.levels.length ? changes.levels.join(',') : null)
            : searchParams.get('level'),
        minRating: changes.minRating !== undefined
            ? (changes.minRating ? String(changes.minRating) : null)
            : searchParams.get('minRating'),
        free: changes.freeOnly !== undefined
            ? (changes.freeOnly ? '1' : null)
            : searchParams.get('free'),
    });

    return (
        <div className="min-h-screen bg-white text-[#111827] font-jakarta">
            {/* Başlık: sıkı, tek blok */}
            <div className="px-3 sm:px-4 pt-3">
                <header className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-[#F5F6F8]">
                    <div aria-hidden className="absolute -right-16 -top-24 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] rounded-[38%] bg-[#B2F0C8] rotate-12" />
                    <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 py-5 lg:py-6">
                        {data?.seo?.breadcrumbs && data.seo.breadcrumbs.length > 1 && (
                            <nav aria-label="Kırıntı navigasyonu" className="mb-3">
                                <ol className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#6B7280] flex-wrap">
                                    {data.seo.breadcrumbs.map((b, i) => {
                                        const last = i === data.seo.breadcrumbs.length - 1;
                                        const path = b.url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                        return (
                                            <li key={b.url} className="flex items-center gap-1.5">
                                                {last ? <span className="text-[#111827]">{b.name}</span> : (
                                                    <>
                                                        <Link to={path} className="hover:text-[#111827] transition-colors">{b.name}</Link>
                                                        <span className="text-[#9CA3AF]">/</span>
                                                    </>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>
                        )}

                        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                            <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.03em] leading-[1.1] max-w-[24ch]">
                                {loading && !data ? 'Yükleniyor…' : heading}
                            </h1>
                            {pagination && (
                                <span className="mb-1 h-7 px-2.5 inline-flex items-center rounded-full bg-white text-[12.5px] font-bold">
                                    {`${pagination.total} kurs`}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="mt-1.5 text-[14px] leading-[1.55] text-[#4B5563] max-w-[70ch] line-clamp-2">{description}</p>
                        )}

                        {!data?.category && (
                            <form
                                role="search"
                                onSubmit={e => {
                                    e.preventDefault();
                                    const q = String(new FormData(e.currentTarget).get('q') || '').trim();
                                    updateParams({ q: q || null, page: null });
                                }}
                                className="mt-3.5 max-w-lg"
                            >
                                <div className="flex items-center gap-2 p-1 rounded-xl bg-white focus-within:ring-2 focus-within:ring-[#1B7A43]/40">
                                    <Search aria-hidden className="ml-2.5 w-4 h-4 text-[#9CA3AF] shrink-0" />
                                    <input
                                        key={query}
                                        name="q"
                                        type="search"
                                        defaultValue={query}
                                        aria-label="Kurs ara"
                                        placeholder="Kurs, konu ya da eğitmen ara…"
                                        className="min-w-0 flex-1 h-9 bg-transparent text-[14px] placeholder:text-[#9CA3AF] border-0 outline-none"
                                    />
                                    <button type="submit" className="h-9 px-4 rounded-lg bg-[#1B7A43] hover:bg-[#16613A] text-white text-[13px] font-bold transition-colors">
                                        Ara
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Alt kategoriler: tek satır, kayar */}
                        {activeCat && activeCat.subcategories.length > 0 && (
                            <ChipRow>
                                <Link
                                    to={`/courses/${activeCat.slug}`}
                                    className={cn('shrink-0 h-8 px-3.5 inline-flex items-center rounded-full text-[13px] font-bold transition-colors',
                                        !data?.subcategory ? 'bg-[#1B7A43] text-white' : 'bg-white text-[#374151] hover:text-[#1B7A43]')}
                                >
                                    Tümü
                                </Link>
                                {activeCat.subcategories.map(sub => {
                                    const on = data?.subcategory?.slug === sub.slug;
                                    return (
                                        <Link
                                            key={sub.slug}
                                            to={`/courses/${activeCat.slug}/${sub.slug}`}
                                            className={cn('shrink-0 h-8 px-3.5 inline-flex items-center rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors',
                                                on ? 'bg-[#1B7A43] text-white font-bold' : 'bg-white text-[#374151] hover:text-[#1B7A43]')}
                                        >
                                            {sub.name}
                                        </Link>
                                    );
                                })}
                            </ChipRow>
                        )}
                    </div>
                </header>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-12">
                {showShowcase && data?.category && (
                    <CategoryShowcase
                        categorySlug={data.category.slug}
                        categoryName={data.category.name}
                        subcategoryName={data.subcategory?.name}
                        facets={facets}
                        instructors={instructors}
                        onLevel={lvl => updateParams({ level: lvl })}
                    />
                )}
                {showShowcase && !data?.category && query && <SearchShowcase query={query} />}

                {/* Araç çubuğu: filtre düğmesi + sıralama sekmeleri */}
                <div id="catalog-results" className="scroll-mt-28 flex flex-wrap items-center gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters(true)}
                        className={cn(
                            'h-10 px-4 rounded-xl inline-flex items-center gap-2 text-[14px] font-bold transition-colors',
                            activeFilterCount > 0 ? 'bg-[#1B7A43] text-white hover:bg-[#16613A]' : 'bg-[#F1F3F5] text-[#111827] hover:bg-[#E9ECEF]'
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtrele
                        {activeFilterCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1 rounded-full bg-white text-[#1B7A43] text-[11px] font-extrabold flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {filters.levels.map(l => (
                        <button key={l} onClick={() => updateParams({ level: filters.levels.filter(x => x !== l).join(',') || null })}
                            className="h-8 inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 hover:bg-[#D7F5E2]">
                            {l} <X className="w-3 h-3" />
                        </button>
                    ))}
                    {filters.minRating > 0 && (
                        <button onClick={() => updateParams({ minRating: null })}
                            className="h-8 inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 hover:bg-[#D7F5E2]">
                            {`${filters.minRating}+ puan`} <X className="w-3 h-3" />
                        </button>
                    )}
                    {filters.freeOnly && (
                        <button onClick={() => updateParams({ free: null })}
                            className="h-8 inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 hover:bg-[#D7F5E2]">
                            Ücretsiz <X className="w-3 h-3" />
                        </button>
                    )}

                    <div role="tablist" aria-label="Sırala" className="ml-auto flex gap-0.5 p-1 rounded-xl bg-[#F5F6F8] overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        {sortTabs.map(o => (
                            <button
                                key={o.value}
                                role="tab"
                                aria-selected={currentSort === o.value}
                                onClick={() => updateParams({ sort: o.value })}
                                className={cn(
                                    'shrink-0 h-8 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors',
                                    currentSort === o.value ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.08)]' : 'text-[#6B7280] hover:text-[#111827]'
                                )}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-video bg-[#F1F3F5] rounded-2xl" />
                                <div className="h-3.5 bg-[#F1F3F5] rounded w-4/5 mt-3" />
                                <div className="h-3 bg-[#F5F6F8] rounded w-2/5 mt-2" />
                                <div className="h-4 bg-[#F1F3F5] rounded w-1/3 mt-3" />
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-[#F5F6F8] rounded-[24px] py-14 text-center px-6">
                        <h2 className="text-[18px] font-extrabold mb-1.5">
                            {query ? `"${query}" için sonuç yok` : 'Burada henüz kurs yok'}
                        </h2>
                        <p className="text-[14px] text-[#6B7280] max-w-md mx-auto mb-5">
                            {activeFilterCount > 0
                                ? 'Filtreleri gevşetmeyi dene; sonuçlar genişleyebilir.'
                                : query ? 'Farklı bir kelime deneyebilir ya da kategorilere göz atabilirsin.' : 'Bu bölüme yakında yeni kurslar eklenecek.'}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters} className="h-10 px-5 rounded-xl bg-white text-[14px] font-bold">Filtreleri temizle</button>
                            )}
                            <Link to="/courses" className="h-10 px-5 inline-flex items-center rounded-xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14px] font-bold">
                                Tüm kurslara göz at
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4">
                            {courses.map(course => {
                                const id = course.course_id ?? course.id;
                                const owned = ownedIds.has(id);
                                return (
                                    <ShelfCourseCard
                                        key={course.id}
                                        course={{ ...course, id, progress: progressById.get(id) ?? 0, image: course.image }}
                                        owned={owned}
                                        compact
                                    />
                                );
                            })}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onChange={p => updateParams({ page: p > 1 ? String(p) : null }, false)}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Filtre penceresi: ekranın ortasında */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Filtreler">
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-150" onClick={() => setShowMobileFilters(false)} />
                    <div className="relative w-full sm:max-w-[640px] max-h-[88vh] flex flex-col bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_40px_90px_-30px_rgba(17,24,39,0.6)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 pt-5 pb-3">
                            <h2 className="text-[19px] font-extrabold">Filtrele</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F1F3F5]" aria-label="Kapat">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-2">
                            <CatalogFilters
                                facets={facets}
                                navCategories={navCategories}
                                activeCategory={data?.category ? { name: data.category.name, slug: data.category.slug } : null}
                                allCoursesHref={allCoursesHref}
                                filters={filters}
                                onChange={applyFilters}
                                onReset={resetFilters}
                                categoryHref={categoryHref}
                                className="w-full"
                                layout="modal"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4">
                            <button
                                onClick={resetFilters}
                                disabled={activeFilterCount === 0}
                                className="h-11 px-5 rounded-xl text-[14px] font-bold text-[#374151] hover:bg-[#F1F3F5] disabled:opacity-40"
                            >
                                Temizle
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 h-11 rounded-xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14.5px] font-bold"
                            >
                                {loading ? 'Yükleniyor…' : `${pagination?.total ?? 0} kursu göster`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/** Tek satır, yana kayan çip dizisi; kenarlarda yumuşak geçiş. */
const ChipRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative mt-3.5 -mx-5 sm:mx-0">
        <div className="flex gap-1.5 overflow-x-auto px-5 sm:px-0 pr-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {children}
        </div>
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F5F6F8] to-transparent" />
    </div>
);

/** Sayfa numaraları — çok sayfada "1 … 4 5 6 … 20" biçimine düşer. */
const Pagination: React.FC<{
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}> = ({ page, totalPages, onChange }) => {
    const pages = useMemo(() => {
        const out: Array<number | '…'> = [];
        const push = (n: number) => { if (!out.includes(n)) out.push(n); };

        push(1);
        if (page > 3) out.push('…');
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) push(p);
        if (page < totalPages - 2) out.push('…');
        if (totalPages > 1) push(totalPages);
        return out;
    }, [page, totalPages]);

    return (
        <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Sayfalama">
            <button
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
                className="h-10 px-4 rounded-xl text-[14px] font-semibold text-[#374151] hover:bg-[#F1F3F5] disabled:opacity-30 disabled:hover:bg-transparent"
            >
                Önceki
            </button>

            {pages.map((p, i) =>
                p === '…' ? (
                    <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        className={cn(
                            'h-10 min-w-[40px] px-2 rounded-xl text-[14px] font-bold tabular-nums transition-colors',
                            p === page
                                ? 'bg-[#1B7A43] text-white'
                                : 'text-[#374151] bg-[#F5F6F8] hover:bg-[#E9ECEF]'
                        )}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                className="h-10 px-4 rounded-xl text-[14px] font-semibold text-[#374151] hover:bg-[#F1F3F5] disabled:opacity-30 disabled:hover:bg-transparent"
            >
                Sonraki
            </button>
        </nav>
    );
};

export default CatalogPage;

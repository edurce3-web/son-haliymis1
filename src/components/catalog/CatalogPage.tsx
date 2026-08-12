import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import {
    Search, SlidersHorizontal, X, BookOpen, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CatalogFilters, { type CatalogFacets, type FilterState, type FacetCategory } from './CatalogFilters';
import CatalogCourseCard, { type CatalogCourse } from './CatalogCourseCard';
import { useCategoryNav } from '@/hooks/useCategoryNav';

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
    { value: 'popular', label: 'En popüler' },
    { value: 'rating', label: 'En yüksek puan' },
    { value: 'newest', label: 'En yeni' },
    { value: 'price_asc', label: 'Fiyat: düşük → yüksek' },
    { value: 'price_desc', label: 'Fiyat: yüksek → düşük' },
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

    const categoryHref = useCallback((slug: string) => {
        if (mode === 'category') return `/courses/${slug}`;
        // Arama sayfasından kategoriye giderken aramayı koru
        return query ? `/courses/${slug}?q=${encodeURIComponent(query)}` : `/courses/${slug}`;
    }, [mode, query]);

    const resetFilters = () => updateParams({ level: null, minRating: null, free: null });

    /** "Tüm kurslar" — aramadayken arama terimini koru */
    const allCoursesHref = query ? `/search?q=${encodeURIComponent(query)}` : '/courses';


    const heading = data?.subcategory?.name
        || data?.category?.name
        || (query ? `"${query}" için sonuçlar` : 'Tüm kurslar');

    const activeFilterCount =
        filters.levels.length + (filters.minRating ? 1 : 0) + (filters.freeOnly ? 1 : 0);

    if (notFound) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Kategori bulunamadı</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Aradığın kategori kaldırılmış ya da adresi değişmiş olabilir.
                    </p>
                    <Link to="/courses">
                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            Tüm kurslara göz at
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8">

                {/* Kırıntı navigasyonu — hem kullanıcı hem arama motoru için */}
                {data?.seo?.breadcrumbs && data.seo.breadcrumbs.length > 1 && (
                    <nav aria-label="Kırıntı navigasyonu" className="mb-4">
                        <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                            {data.seo.breadcrumbs.map((b, i) => {
                                const last = i === data.seo.breadcrumbs.length - 1;
                                const path = b.url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                return (
                                    <li key={b.url} className="flex items-center gap-1.5">
                                        {last ? (
                                            <span className="text-slate-800 font-medium">{b.name}</span>
                                        ) : (
                                            <>
                                                <Link to={path} className="hover:text-indigo-600">{b.name}</Link>
                                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                            </>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                )}

                {/* Başlık */}
                <header className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                        {loading && !data ? 'Yükleniyor…' : heading}
                    </h1>
                    {(data?.subcategory?.description || data?.category?.description) && !query && (
                        <p className="text-slate-600 mt-2 max-w-3xl text-[15px] leading-relaxed">
                            {data.subcategory?.description || data.category?.description}
                        </p>
                    )}
                    {pagination && (
                        <p className="text-sm text-slate-500 mt-2">
                            {pagination.total > 0
                                ? `${pagination.total.toLocaleString('tr-TR')} kurs bulundu`
                                : 'Kurs bulunamadı'}
                        </p>
                    )}
                </header>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sol: filtreler */}
                    <div className="hidden lg:block">
                        <CatalogFilters
                            facets={facets}
                            navCategories={navCategories}
                            activeCategory={data?.category ? { name: data.category.name, slug: data.category.slug } : null}
                            allCoursesHref={allCoursesHref}
                            filters={filters}
                            onChange={changes => updateParams({
                                level: changes.levels !== undefined
                                    ? (changes.levels.length ? changes.levels.join(',') : null)
                                    : searchParams.get('level'),
                                minRating: changes.minRating !== undefined
                                    ? (changes.minRating ? String(changes.minRating) : null)
                                    : searchParams.get('minRating'),
                                free: changes.freeOnly !== undefined
                                    ? (changes.freeOnly ? '1' : null)
                                    : searchParams.get('free'),
                            })}
                            onReset={resetFilters}
                            categoryHref={categoryHref}
                        />
                    </div>

                    {/* Sağ: sonuçlar */}
                    <div className="flex-1 min-w-0">
                        {/* Araç çubuğu */}
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <Button
                                variant="outline"
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden h-10 rounded-xl gap-2"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filtrele
                                {activeFilterCount > 0 && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>

                            <div className="ml-auto flex items-center gap-2">
                                <label htmlFor="sort" className="text-sm text-slate-500 hidden sm:inline">
                                    Sırala:
                                </label>
                                <select
                                    id="sort"
                                    value={data?.sort || sort || (query ? 'relevance' : 'popular')}
                                    onChange={e => updateParams({ sort: e.target.value })}
                                    className="h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    {SORT_OPTIONS
                                        // Arama yokken "en ilgili" anlamsız
                                        .filter(o => o.value !== 'relevance' || query)
                                        .map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* Seçili filtre etiketleri */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {filters.levels.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => updateParams({
                                            level: filters.levels.filter(x => x !== l).join(',') || null,
                                        })}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 rounded-full pl-3 pr-2 py-1.5 hover:border-slate-300"
                                    >
                                        {l} <X className="w-3 h-3 text-slate-400" />
                                    </button>
                                ))}
                                {filters.minRating > 0 && (
                                    <button
                                        onClick={() => updateParams({ minRating: null })}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 rounded-full pl-3 pr-2 py-1.5 hover:border-slate-300"
                                    >
                                        {filters.minRating} puan ve üzeri <X className="w-3 h-3 text-slate-400" />
                                    </button>
                                )}
                                {filters.freeOnly && (
                                    <button
                                        onClick={() => updateParams({ free: null })}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 rounded-full pl-3 pr-2 py-1.5 hover:border-slate-300"
                                    >
                                        Ücretsiz <X className="w-3 h-3 text-slate-400" />
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                                        <div className="aspect-[16/10] bg-slate-100" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                                            <div className="h-4 bg-slate-100 rounded w-4/5" />
                                            <div className="h-3 bg-slate-50 rounded w-2/3" />
                                            <div className="h-10 bg-slate-100 rounded-lg mt-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center px-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-7 h-7 text-slate-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">
                                    {query ? `"${query}" için sonuç yok` : 'Burada henüz kurs yok'}
                                </h2>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                                    {activeFilterCount > 0
                                        ? 'Filtreleri gevşetmeyi dene; sonuçlar genişleyebilir.'
                                        : query
                                            ? 'Farklı bir kelime deneyebilir ya da kategorilere göz atabilirsin.'
                                            : 'Bu bölüme yakında yeni kurslar eklenecek.'}
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    {activeFilterCount > 0 && (
                                        <Button variant="outline" onClick={resetFilters} className="rounded-xl">
                                            Filtreleri temizle
                                        </Button>
                                    )}
                                    <Link to="/courses">
                                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                                            Tüm kurslara göz at
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {courses.map(course => (
                                        <CatalogCourseCard
                                            key={course.id}
                                            course={course}
                                            highlight={query}
                                        />
                                    ))}
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
                </div>
            </div>

            {/* Mobil filtre çekmecesi */}
            {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="relative ml-auto w-[85%] max-w-sm bg-white h-full overflow-y-auto p-5">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold text-slate-900">Filtreler</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-700"
                                aria-label="Kapat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <CatalogFilters
                            facets={facets}
                            navCategories={navCategories}
                            activeCategory={data?.category ? { name: data.category.name, slug: data.category.slug } : null}
                            allCoursesHref={allCoursesHref}
                            filters={filters}
                            onChange={changes => updateParams({
                                level: changes.levels !== undefined
                                    ? (changes.levels.length ? changes.levels.join(',') : null)
                                    : searchParams.get('level'),
                                minRating: changes.minRating !== undefined
                                    ? (changes.minRating ? String(changes.minRating) : null)
                                    : searchParams.get('minRating'),
                                free: changes.freeOnly !== undefined
                                    ? (changes.freeOnly ? '1' : null)
                                    : searchParams.get('free'),
                            })}
                            onReset={resetFilters}
                            categoryHref={categoryHref}
                            className="w-full"
                        />
                        <Button
                            onClick={() => setShowMobileFilters(false)}
                            className="w-full mt-6 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                        >
                            {pagination?.total ?? 0} kursu göster
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

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
                className="h-9 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent disabled:opacity-30 disabled:hover:bg-transparent"
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
                            'h-9 min-w-[36px] px-2 rounded-lg text-sm font-medium transition-colors',
                            p === page
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 bg-white border border-slate-200 hover:border-slate-300'
                        )}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                className="h-9 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent disabled:opacity-30 disabled:hover:bg-transparent"
            >
                Sonraki
            </button>
        </nav>
    );
};

export default CatalogPage;

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
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { CATEGORY_TREE } from '@/data/categoryTree';

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

    return (
        <div className="min-h-screen bg-white text-[#111827]">
            {/* Başlık */}
            <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                <header className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#F5F6F8]">
                    <div aria-hidden className="absolute -right-24 -top-28 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-[38%] bg-[#B2F0C8] rotate-12" />
                    <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-7 pb-7 lg:pt-9 lg:pb-9">
                        {data?.seo?.breadcrumbs && data.seo.breadcrumbs.length > 1 && (
                            <nav aria-label="Kırıntı navigasyonu" className="mb-6">
                                <ol className="flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] flex-wrap">
                                    {data.seo.breadcrumbs.map((b, i) => {
                                        const last = i === data.seo.breadcrumbs.length - 1;
                                        const path = b.url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                        return (
                                            <li key={b.url} className="flex items-center gap-1.5">
                                                {last ? (
                                                    <span className="text-[#111827]">{b.name}</span>
                                                ) : (
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

                        {eyebrow && <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#1B7A43]">{eyebrow}</p>}
                        <h1 className="mt-2 font-montserrat text-[30px] sm:text-[40px] lg:text-[46px] font-extrabold tracking-[-0.035em] leading-[1.05] max-w-[22ch]">
                            {loading && !data ? 'Yükleniyor…' : heading}
                        </h1>
                        {description && (
                            <p className="mt-3 text-[15.5px] sm:text-[16.5px] leading-[1.6] text-[#4B5563] max-w-[60ch]">{description}</p>
                        )}
                        {pagination && (
                            <p className="mt-4 inline-flex items-center h-8 px-3 rounded-full bg-white text-[13px] font-bold">
                                {`${pagination.total} kurs`}
                            </p>
                        )}

                        {/* Arama sayfasında aramayı buradan daralt */}
                        {!data?.category && (
                            <form
                                role="search"
                                onSubmit={e => {
                                    e.preventDefault();
                                    const q = String(new FormData(e.currentTarget).get('q') || '').trim();
                                    updateParams({ q: q || null, page: null });
                                }}
                                className="mt-5 max-w-xl"
                            >
                                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white shadow-[0_10px_30px_-20px_rgba(17,24,39,0.4)] focus-within:ring-2 focus-within:ring-[#1B7A43]/40">
                                    <Search aria-hidden className="ml-3 w-[18px] h-[18px] text-[#9CA3AF] shrink-0" />
                                    <input
                                        key={query}
                                        name="q"
                                        type="search"
                                        defaultValue={query}
                                        aria-label="Kurs ara"
                                        placeholder="Kurs, konu ya da eğitmen ara…"
                                        className="min-w-0 flex-1 h-11 bg-transparent text-[15px] placeholder:text-[#9CA3AF] border-0 outline-none"
                                    />
                                    <button type="submit" className="h-11 px-5 rounded-xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14px] font-bold transition-colors">
                                        Ara
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Kategori sayfasında alt kategoriler */}
                        {activeCat && activeCat.subcategories.length > 0 && (
                            <div className="mt-6 -mx-5 sm:mx-0 px-5 sm:px-0 flex gap-2 overflow-x-auto sm:flex-wrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                                <Link
                                    to={`/courses/${activeCat.slug}`}
                                    className={cn(
                                        'shrink-0 h-9 px-4 inline-flex items-center rounded-full text-[13.5px] font-bold transition-colors',
                                        !data?.subcategory ? 'bg-[#1B7A43] text-white' : 'bg-white text-[#374151] hover:bg-[#EEFBF3] hover:text-[#1B7A43]'
                                    )}
                                >
                                    Tümü
                                </Link>
                                {activeCat.subcategories.map(sub => {
                                    const on = data?.subcategory?.slug === sub.slug;
                                    return (
                                        <Link
                                            key={sub.slug}
                                            to={`/courses/${activeCat.slug}/${sub.slug}`}
                                            className={cn(
                                                'shrink-0 h-9 px-4 inline-flex items-center rounded-full text-[13.5px] font-semibold transition-colors',
                                                on ? 'bg-[#1B7A43] text-white font-bold' : 'bg-white text-[#374151] hover:bg-[#EEFBF3] hover:text-[#1B7A43]'
                                            )}
                                        >
                                            {sub.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </header>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
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
                                variant="ghost"
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden h-10 rounded-xl gap-2 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#111827] font-bold"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filtrele
                                {activeFilterCount > 0 && (
                                    <span className="bg-[#1B7A43] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>

                            <div className="ml-auto flex items-center gap-2">
                                <label htmlFor="sort" className="text-[13.5px] text-[#6B7280] hidden sm:inline">
                                    Sırala:
                                </label>
                                <select
                                    id="sort"
                                    value={data?.sort || sort || (query ? 'relevance' : 'popular')}
                                    onChange={e => updateParams({ sort: e.target.value })}
                                    className="h-10 px-3 pr-8 rounded-xl border-0 bg-[#F1F3F5] text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B7A43]/30 cursor-pointer"
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
                                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 py-1.5 hover:bg-[#D7F5E2]"
                                    >
                                        {l} <X className="w-3 h-3" />
                                    </button>
                                ))}
                                {filters.minRating > 0 && (
                                    <button
                                        onClick={() => updateParams({ minRating: null })}
                                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 py-1.5 hover:bg-[#D7F5E2]"
                                    >
                                        {filters.minRating} puan ve üzeri <X className="w-3 h-3" />
                                    </button>
                                )}
                                {filters.freeOnly && (
                                    <button
                                        onClick={() => updateParams({ free: null })}
                                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#EEFBF3] text-[#1B7A43] rounded-full pl-3 pr-2 py-1.5 hover:bg-[#D7F5E2]"
                                    >
                                        Ücretsiz <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-[#F5F6F8] rounded-2xl overflow-hidden animate-pulse">
                                        <div className="aspect-[16/9] bg-[#E9ECEF]" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-2 bg-slate-100 rounded w-1/3" />
                                            <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                                            <div className="h-2.5 bg-slate-50 rounded w-full" />
                                            <div className="h-2.5 bg-slate-50 rounded w-2/3" />
                                            <div className="h-8 bg-slate-100 rounded-md mt-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="bg-[#F5F6F8] rounded-[28px] py-20 text-center px-6">
                                <h2 className="text-[20px] font-extrabold text-[#111827] mb-2">
                                    {query ? `"${query}" için sonuç yok` : 'Burada henüz kurs yok'}
                                </h2>
                                <p className="text-[14.5px] text-[#6B7280] max-w-md mx-auto mb-6">
                                    {activeFilterCount > 0
                                        ? 'Filtreleri gevşetmeyi dene; sonuçlar genişleyebilir.'
                                        : query
                                            ? 'Farklı bir kelime deneyebilir ya da kategorilere göz atabilirsin.'
                                            : 'Bu bölüme yakında yeni kurslar eklenecek.'}
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    {activeFilterCount > 0 && (
                                        <Button variant="ghost" onClick={resetFilters} className="rounded-xl bg-white hover:bg-white/70 font-bold">
                                            Filtreleri temizle
                                        </Button>
                                    )}
                                    <Link to="/courses">
                                        <Button className="rounded-xl bg-[#1B7A43] hover:bg-[#16613A] font-bold">
                                            Tüm kurslara göz at
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map(course => {
                                        const id = course.course_id ?? course.id;
                                        return (
                                            <CatalogCourseCard
                                                key={course.id}
                                                course={course}
                                                highlight={query}
                                                owned={ownedIds.has(id)}
                                                progress={progressById.get(id) ?? 0}
                                                inCart={cartIds.has(id)}
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
                </div>
            </div>

            {/* Mobil filtre çekmecesi */}
            {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="relative ml-auto w-[88%] max-w-sm bg-white h-full overflow-y-auto p-5 rounded-l-[24px]">
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
                            className="w-full mt-6 h-11 rounded-xl bg-[#1B7A43] hover:bg-[#16613A] font-bold"
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

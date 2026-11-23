import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import {
    SlidersHorizontal, X, ChevronDown, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CatalogFilters, { type CatalogFacets, type FilterState, type FacetCategory } from './CatalogFilters';
import { type CatalogCourse } from './CatalogCourseCard';
import { ShelfCourseCard } from '@/components/home/ShelfCourseCard';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { CATEGORY_TREE } from '@/data/categoryTree';
import { BundleStrip, InstructorRow, useCatalogBundles, useRelatedTopics } from './CatalogShowcase';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
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

    const columns = useColumns();
    const topics = useRelatedTopics(query);
    const bundleSet = useCatalogBundles({
        categorySlug: data?.category?.slug,
        categoryName: data?.category?.name,
        subcategoryName: data?.subcategory?.name,
        query: data?.category ? undefined : query || undefined,
    });

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

    // Bu sayfadaki kursların eğitmenleri. Aynı adla iki hesap varsa tek
    // çip görünsün; listede aynı ismin iki kez durması bozuk görünüyordu.
    const instructors = (() => {
        const map = new Map<string, { id: number; name: string; count: number }>();
        for (const c of courses as any[]) {
            const name = String(c.instructor_name || '').trim();
            if (!c.instructor_id || !name) continue;
            const key = name.toLocaleLowerCase('tr-TR');
            const cur = map.get(key) || { id: c.instructor_id, name, count: 0 };
            cur.count += 1;
            map.set(key, cur);
        }
        return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    })();

    const currentSort = data?.sort || sort || (query ? 'relevance' : 'popular');
    const sortOptions = SORT_OPTIONS.filter(o => o.value !== 'relevance' || query);
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
    const toggleLevel = (lvl: string) => applyFilters({
        levels: filters.levels.includes(lvl) ? filters.levels.filter(l => l !== lvl) : [...filters.levels, lvl],
    });

    // Hızlı seviye düğmeleri: filtre penceresini açmadan en sık kullanılan seçim
    const quickLevels = (facets?.levels || []).filter(l => l.count > 0 || filters.levels.includes(l.level));

    // Paket şeridi ızgaranın ikinci satırından sonra giriyor
    const split = Math.min(courses.length, columns * 2);
    const showBundles = page === 1 && bundleSet.list.length > 0;
    const bundleTitle = query
        ? `"${query}" içeren paketler`
        : bundleSet.related ? `${data?.subcategory?.name || data?.category?.name} paketleri` : 'Paketler: birkaç kurs, tek fiyat';

    const card = (course: CatalogCourse) => {
        const id = course.course_id ?? course.id;
        return (
            <ShelfCourseCard
                key={course.id}
                course={{ ...course, id, progress: progressById.get(id) ?? 0, image: course.image }}
                owned={ownedIds.has(id)}
                compact
            />
        );
    };

    return (
        <div className="min-h-screen bg-white text-[#111827] font-jakarta">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-16">

                {/* Başlık */}
                {data?.seo?.breadcrumbs && data.seo.breadcrumbs.length > 1 && (
                    <nav aria-label="Kırıntı navigasyonu" className="hidden sm:block mb-2">
                        <ol className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#6B7280] flex-wrap">
                            {data.seo.breadcrumbs.slice(0, -1).map(b => {
                                const path = b.url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                return (
                                    <li key={b.url} className="flex items-center gap-1.5">
                                        <Link to={path} className="hover:text-[#1B7A43] transition-colors">{b.name}</Link>
                                        <span className="text-[#D1D5DB]">/</span>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                )}

                <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.035em] leading-[1.08] text-[#0A2A1A]">
                    {loading && !data ? 'Yükleniyor…' : heading}
                </h1>
                <p className="mt-2 text-[14px] sm:text-[14.5px] leading-[1.55] text-[#4B5563] max-w-[78ch] line-clamp-2">
                    {pagination && <span className="font-bold text-[#111827]">{`${pagination.total} kurs`}</span>}
                    {pagination && description && <span className="text-[#D1D5DB]">{'  ·  '}</span>}
                    {description}
                </p>

                {/* Alt kategoriler ya da ilgili konular: tek satır */}
                {activeCat && activeCat.subcategories.length > 0 && (
                    <ScrollRow className="mt-4">
                        <NavPill to={`/courses/${activeCat.slug}`} on={!data?.subcategory}>Tümü</NavPill>
                        {activeCat.subcategories.map(sub => (
                            <NavPill key={sub.slug} to={`/courses/${activeCat.slug}/${sub.slug}`} on={data?.subcategory?.slug === sub.slug}>
                                {sub.name}
                            </NavPill>
                        ))}
                    </ScrollRow>
                )}
                {!data?.category && topics.length > 0 && (
                    <ScrollRow className="mt-4">
                        <span className="shrink-0 self-center text-[12.5px] font-semibold text-[#6B7280] mr-1">İlgili konular</span>
                        {topics.map(t => <NavPill key={t.to} to={t.to}>{t.name}</NavPill>)}
                    </ScrollRow>
                )}

                {/* Araç çubuğu */}
                <div id="catalog-results" className="scroll-mt-28 mt-5 mb-4 flex items-center gap-2 rounded-2xl bg-[#F5F6F8] p-1.5">
                    <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters(true)}
                            className={cn(
                                'shrink-0 h-9 pl-3 pr-3.5 rounded-xl inline-flex items-center gap-2 text-[13.5px] font-bold transition-colors',
                                activeFilterCount > 0 ? 'bg-[#1B7A43] text-white hover:bg-[#16613A]' : 'bg-white text-[#111827] hover:bg-[#EEFBF3] '
                            )}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtrele
                            {activeFilterCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#1B7A43] text-[11px] font-extrabold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <span aria-hidden className="hidden sm:block shrink-0 w-2" />

                        {quickLevels.map(l => {
                            const on = filters.levels.includes(l.level);
                            return (
                                <button
                                    key={l.level}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleLevel(l.level)}
                                    className={cn(
                                        'hidden sm:inline-flex shrink-0 h-9 px-3 rounded-xl items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
                                        on ? 'bg-[#0A2A1A] text-white' : 'text-[#374151] hover:bg-white'
                                    )}
                                >
                                    {l.level}
                                    <span className={cn('text-[11.5px] font-bold tabular-nums', on ? 'text-white/70' : 'text-[#9CA3AF]')}>{l.count}</span>
                                </button>
                            );
                        })}
                        {filters.minRating > 0 && (
                            <RemovableChip onRemove={() => updateParams({ minRating: null })}>{`${filters.minRating}+ puan`}</RemovableChip>
                        )}
                        {filters.freeOnly && (
                            <RemovableChip onRemove={() => updateParams({ free: null })}>Ücretsiz</RemovableChip>
                        )}
                    </div>

                    <SortMenu options={sortOptions} value={currentSort} onChange={v => updateParams({ sort: v })} />
                </div>

                {/* Kurslar */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-video bg-[#F1F3F5] rounded-lg" />
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
                            {courses.slice(0, split).map(card)}
                            {showBundles && <BundleStrip bundles={bundleSet.list} title={bundleTitle} />}
                            {courses.slice(split).map(card)}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onChange={p => updateParams({ page: p > 1 ? String(p) : null }, false)}
                            />
                        )}

                        {page === 1 && data?.category && (
                            <InstructorRow instructors={instructors} scope={data.subcategory?.name || data.category.name} />
                        )}
                    </>
                )}
            </div>

            {/* Filtre penceresi: ekranın ortasında, telefonda alttan */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Filtreler">
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-150" onClick={() => setShowMobileFilters(false)} />
                    <div className="relative w-full sm:max-w-[600px] max-h-[88vh] flex flex-col bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_40px_90px_-30px_rgba(17,24,39,0.6)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 pt-5 pb-2">
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

/** Ekran genişliğine göre ızgaranın sütun sayısı (Tailwind kırılımlarıyla aynı). */
function useColumns() {
    const get = () => {
        if (typeof window === 'undefined') return 5;
        const w = window.innerWidth;
        return w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2;
    };
    const [n, setN] = useState(get);
    useEffect(() => {
        const onResize = () => setN(get());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return n;
}

/** Tek satır, yana kayan dizi; sağ kenarda yumuşak geçiş. */
const ScrollRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('relative -mx-4 sm:mx-0', className)}>
        <div className="flex gap-1 overflow-x-auto px-4 sm:px-0 pr-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {children}
        </div>
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent" />
    </div>
);

const NavPill: React.FC<{ to: string; on?: boolean; children: React.ReactNode }> = ({ to, on, children }) => (
    <Link
        to={to}
        aria-current={on ? 'page' : undefined}
        className={cn(
            'shrink-0 h-9 px-3.5 inline-flex items-center rounded-full text-[13.5px] whitespace-nowrap transition-colors',
            on ? 'bg-[#0A2A1A] text-white font-bold' : 'text-[#374151] font-semibold hover:bg-[#F5F6F8] hover:text-[#111827]'
        )}
    >
        {children}
    </Link>
);

const RemovableChip: React.FC<{ onRemove: () => void; children: React.ReactNode }> = ({ onRemove, children }) => (
    <button
        type="button"
        onClick={onRemove}
        className="shrink-0 h-9 inline-flex items-center gap-1.5 rounded-xl bg-[#0A2A1A] text-white pl-3 pr-2.5 text-[13px] font-semibold whitespace-nowrap"
    >
        {children}
        <X className="w-3.5 h-3.5 opacity-70" />
    </button>
);

/** Sıralama: tek düğme, açılır liste. Altı sekme yerine yer kaplamıyor. */
const SortMenu: React.FC<{
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (v: string) => void;
}> = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    const current = options.find(o => o.value === value) || options[0];

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
    }, [open]);

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                className="h-9 pl-3 pr-2.5 rounded-xl inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#111827] hover:bg-white transition-colors"
            >
                <span className="hidden sm:inline font-semibold text-[#6B7280]">Sırala:</span>
                {current?.label}
                <ChevronDown className={cn('w-4 h-4 text-[#6B7280] transition-transform duration-200', open && 'rotate-180')} />
            </button>
            {open && (
                <ul
                    role="listbox"
                    className="absolute right-0 top-[calc(100%+6px)] z-30 w-[220px] p-1.5 rounded-2xl bg-white shadow-[0_20px_50px_-12px_rgba(17,24,39,0.3)] animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                >
                    {options.map(o => (
                        <li key={o.value}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={o.value === value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={cn(
                                    'w-full h-10 px-3 rounded-xl flex items-center justify-between text-left text-[13.5px] transition-colors',
                                    o.value === value ? 'bg-[#EEFBF3] text-[#1B7A43] font-bold' : 'text-[#374151] font-semibold hover:bg-[#F5F6F8]'
                                )}
                            >
                                {o.label}
                                {o.value === value && <Check className="w-4 h-4" />}
                            </button>
                        </li>
                    ))}
                </ul>
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

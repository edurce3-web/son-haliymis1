import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavCategory } from '@/hooks/useCategoryNav';

export interface FacetCategory { id: number; name: string; slug: string; count: number; }
export interface FacetLevel { level: string; count: number; }
export interface FacetRating { min: number; count: number; }

export interface CatalogFacets {
    categories: FacetCategory[];
    levels: FacetLevel[];
    ratings: FacetRating[];
    priceRange: { min: number; max: number; freeCount: number };
}

export interface FilterState {
    levels: string[];
    minRating: number;
    freeOnly: boolean;
}

interface Props {
    facets?: CatalogFacets | null;
    /** Tüm kategoriler — aktif seçimden bağımsız, gezinme için */
    navCategories?: NavCategory[];
    /** Kategori sayfasındaysak seçili kategori; arama sayfasında null */
    activeCategory?: { name: string; slug: string } | null;
    filters: FilterState;
    onChange: (next: Partial<FilterState>) => void;
    onReset: () => void;
    categoryHref: (slug: string) => string;
    /** "Tüm kurslar" bağlantısı — aramada aramayı korur */
    allCoursesHref: string;
    className?: string;
    /** Görünüm: ortada açılan filtre penceresi */
    layout?: 'modal';
}

/*
 * Filtreler ortada açılan bir pencerede duruyor; yan sütun kaldırıldı,
 * kurslara yer açıldı. Seçenekler onay kutusu yerine tıklanır kutucuklar:
 * pencerede daha az yer kaplıyor, dokunmatikte daha kolay seçiliyor.
 * Her seçim anında uygulanıyor; alttaki düğme kaç kurs kaldığını gösteriyor.
 */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-4 first:pt-1">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] mb-2.5">{title}</h3>
        <div className="flex flex-wrap gap-2">{children}</div>
    </div>
);

const Option: React.FC<{
    on: boolean;
    onClick: () => void;
    disabled?: boolean;
    count?: number;
    children: React.ReactNode;
}> = ({ on, onClick, disabled, count, children }) => (
    <button
        type="button"
        aria-pressed={on}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'h-10 px-3.5 inline-flex items-center gap-2 rounded-xl text-[13.5px] font-semibold transition-colors',
            on ? 'bg-[#1B7A43] text-white' : 'bg-[#F5F6F8] text-[#374151] hover:bg-[#EEFBF3] hover:text-[#1B7A43]',
            disabled && 'opacity-40 cursor-not-allowed hover:bg-[#F5F6F8] hover:text-[#374151]'
        )}
    >
        {children}
        {count != null && (
            <span className={cn('text-[11.5px] font-bold tabular-nums', on ? 'text-white/80' : 'text-[#9CA3AF]')}>{count}</span>
        )}
    </button>
);

export const CatalogFilters: React.FC<Props> = ({
    facets,
    navCategories = [],
    activeCategory,
    filters,
    onChange,
    categoryHref,
    allCoursesHref,
    className,
}) => {
    const toggleLevel = (level: string) => {
        const next = filters.levels.includes(level)
            ? filters.levels.filter(l => l !== level)
            : [...filters.levels, level];
        onChange({ levels: next });
    };

    const chip = (on: boolean) => cn(
        'h-10 px-3.5 inline-flex items-center gap-2 rounded-xl text-[13.5px] font-semibold transition-colors',
        on ? 'bg-[#111827] text-white' : 'bg-[#F5F6F8] text-[#374151] hover:bg-[#EEFBF3] hover:text-[#1B7A43]'
    );

    return (
        <div className={cn('w-full', className)}>
            <Section title="Seviye">
                {(facets?.levels || []).map(l => (
                    <Option
                        key={l.level}
                        on={filters.levels.includes(l.level)}
                        onClick={() => toggleLevel(l.level)}
                        count={l.count}
                        disabled={l.count === 0 && !filters.levels.includes(l.level)}
                    >
                        {l.level}
                    </Option>
                ))}
                {(facets?.levels || []).length === 0 && <p className="text-[13px] text-[#9CA3AF]">Seviye bilgisi yok</p>}
            </Section>

            <Section title="Puan">
                {(facets?.ratings || []).map(r => {
                    const active = filters.minRating === r.min;
                    return (
                        <Option
                            key={r.min}
                            on={active}
                            onClick={() => onChange({ minRating: active ? 0 : r.min })}
                            count={r.count}
                            disabled={r.count === 0 && !active}
                        >
                            <Star className={cn('w-3.5 h-3.5', active ? 'fill-white text-white' : 'fill-[#f5a524] text-[#f5a524]')} />
                            {`${r.min.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} ve üzeri`}
                        </Option>
                    );
                })}
            </Section>

            {(facets?.priceRange?.freeCount ?? 0) > 0 && (
                <Section title="Fiyat">
                    <Option
                        on={filters.freeOnly}
                        onClick={() => onChange({ freeOnly: !filters.freeOnly })}
                        count={facets?.priceRange.freeCount}
                    >
                        Yalnızca ücretsiz
                    </Option>
                </Section>
            )}

            <Section title="Kategori">
                <Link to={allCoursesHref} className={chip(!activeCategory)}>Tüm kurslar</Link>
                {navCategories.map(cat => (
                    <Link key={cat.slug} to={categoryHref(cat.slug)} className={chip(activeCategory?.slug === cat.slug)}>
                        {cat.name}
                    </Link>
                ))}
            </Section>
        </div>
    );
};

export default CatalogFilters;

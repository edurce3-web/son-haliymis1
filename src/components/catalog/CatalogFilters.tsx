import React from 'react';
import { Link } from 'react-router-dom';
import { Star, X } from 'lucide-react';
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
    activeSubcategory?: { name: string; slug: string } | null;
    filters: FilterState;
    onChange: (next: Partial<FilterState>) => void;
    onReset: () => void;
    categoryHref: (slug: string) => string;
    subcategoryHref: (slug: string) => string;
    /** "Tüm kurslar" bağlantısı — aramada aramayı korur */
    allCoursesHref: string;
    className?: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-5 border-b border-slate-200 last:border-0">
        <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
        {children}
    </div>
);

const Checkbox: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: React.ReactNode;
    count?: number;
    disabled?: boolean;
}> = ({ checked, onChange, label, count, disabled }) => (
    <label
        className={cn(
            'flex items-center gap-2.5 py-1.5 group',
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        )}
    >
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 focus:ring-2 shrink-0"
        />
        <span className={cn(
            'text-sm flex-1',
            checked ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-900'
        )}>
            {label}
        </span>
        {count != null && <span className="text-xs text-slate-400 tabular-nums">{count}</span>}
    </label>
);

export const CatalogFilters: React.FC<Props> = ({
    facets,
    navCategories = [],
    activeCategory,
    activeSubcategory,
    filters,
    onChange,
    onReset,
    categoryHref,
    subcategoryHref,
    allCoursesHref,
    className,
}) => {
    const toggleLevel = (level: string) => {
        const next = filters.levels.includes(level)
            ? filters.levels.filter(l => l !== level)
            : [...filters.levels, level];
        onChange({ levels: next });
    };

    const hasActiveFilters =
        filters.levels.length > 0 || filters.minRating > 0 || filters.freeOnly;

    return (
        <aside className={cn('w-full lg:w-64 xl:w-72 shrink-0', className)}>
            <div className="lg:sticky lg:top-24">
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="w-full mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg py-2 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Filtreleri temizle
                    </button>
                )}

                {/*
                  Kategoriler: aktif kategoriden bağımsız olarak HEPSİ listelenir.
                  Eskiden bir kategori sayfasındayken yalnızca o kategorinin alt
                  dalları görünüyordu; kullanıcı başka bir kategoriye geçmek için
                  başka bir sayfaya gitmek zorunda kalıyordu.
                  Seçili kategori vurgulanır ve alt dalları hemen altında açılır.
                */}
                <Section title="Kategoriler">
                    <div className="space-y-0.5">
                        <Link
                            to={allCoursesHref}
                            className={cn(
                                'flex items-center justify-between gap-2 text-sm py-1.5 rounded-md transition-colors',
                                !activeCategory
                                    ? 'text-indigo-700 font-semibold'
                                    : 'text-slate-600 hover:text-indigo-700'
                            )}
                        >
                            <span>Tüm kurslar</span>
                        </Link>

                        {navCategories.map(cat => {
                            const isActive = activeCategory?.slug === cat.slug;
                            return (
                                <div key={cat.id}>
                                    <Link
                                        to={categoryHref(cat.slug)}
                                        className={cn(
                                            'flex items-center justify-between gap-2 text-sm py-1.5 rounded-md transition-colors',
                                            isActive
                                                ? 'text-indigo-700 font-semibold'
                                                : 'text-slate-600 hover:text-indigo-700'
                                        )}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        <span className="text-xs text-slate-400 tabular-nums shrink-0">{cat.count}</span>
                                    </Link>

                                    {/* Seçili kategorinin alt dalları burada açılır */}
                                    {isActive && cat.subcategories.length > 0 && (
                                        <div className="ml-3 pl-3 border-l border-slate-200 mt-0.5 mb-1.5 space-y-0.5">
                                            <Link
                                                to={categoryHref(cat.slug)}
                                                className={cn(
                                                    'block text-[13px] py-1 transition-colors',
                                                    !activeSubcategory
                                                        ? 'text-indigo-700 font-medium'
                                                        : 'text-slate-500 hover:text-indigo-700'
                                                )}
                                            >
                                                Tümü
                                            </Link>
                                            {cat.subcategories.map(sub => {
                                                const subActive = activeSubcategory?.slug === sub.slug;
                                                return (
                                                    <Link
                                                        key={sub.id}
                                                        to={subcategoryHref(sub.slug)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-2 text-[13px] py-1 transition-colors',
                                                            subActive
                                                                ? 'text-indigo-700 font-medium'
                                                                : 'text-slate-500 hover:text-indigo-700'
                                                        )}
                                                    >
                                                        <span className="truncate">{sub.name}</span>
                                                        <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                                                            {sub.count}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {navCategories.length === 0 && (
                            <p className="text-xs text-slate-400 py-1">Kategori bulunamadı</p>
                        )}
                    </div>
                </Section>

                {/* Seviye */}
                <Section title="Seviye">
                    {(facets?.levels || []).map(l => (
                        <Checkbox
                            key={l.level}
                            checked={filters.levels.includes(l.level)}
                            onChange={() => toggleLevel(l.level)}
                            label={l.level}
                            count={l.count}
                            // Sayısı 0 olan seviye seçilebilir olmamalı, ama zaten
                            // seçiliyse kilitlemiyoruz — kullanıcı geri alabilsin
                            disabled={l.count === 0 && !filters.levels.includes(l.level)}
                        />
                    ))}
                </Section>

                {/* Puan */}
                <Section title="Puan">
                    <div className="space-y-0.5">
                        {(facets?.ratings || []).map(r => {
                            const active = filters.minRating === r.min;
                            return (
                                <button
                                    key={r.min}
                                    onClick={() => onChange({ minRating: active ? 0 : r.min })}
                                    disabled={r.count === 0 && !active}
                                    className={cn(
                                        'w-full flex items-center gap-2 py-1.5 text-left rounded-md transition-colors',
                                        r.count === 0 && !active && 'opacity-40 cursor-not-allowed'
                                    )}
                                >
                                    <span className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    'w-3.5 h-3.5',
                                                    i <= Math.round(r.min)
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-300'
                                                )}
                                            />
                                        ))}
                                    </span>
                                    <span className={cn(
                                        'text-sm flex-1',
                                        active ? 'text-slate-900 font-semibold' : 'text-slate-600'
                                    )}>
                                        {r.min.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} ve üzeri
                                    </span>
                                    <span className="text-xs text-slate-400 tabular-nums">{r.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {/* Fiyat */}
                {(facets?.priceRange?.freeCount ?? 0) > 0 && (
                    <Section title="Fiyat">
                        <Checkbox
                            checked={filters.freeOnly}
                            onChange={() => onChange({ freeOnly: !filters.freeOnly })}
                            label="Yalnızca ücretsiz"
                            count={facets?.priceRange.freeCount}
                        />
                    </Section>
                )}
            </div>
        </aside>
    );
};

export default CatalogFilters;

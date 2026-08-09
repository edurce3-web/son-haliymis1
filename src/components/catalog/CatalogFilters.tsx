import React from 'react';
import { Link } from 'react-router-dom';
import { Star, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    /** Kategori sayfasındaysak seçili kategori; arama sayfasında null */
    activeCategory?: { name: string; slug: string } | null;
    activeSubcategory?: { name: string; slug: string } | null;
    subcategories?: FacetCategory[];
    filters: FilterState;
    onChange: (next: Partial<FilterState>) => void;
    onReset: () => void;
    /** Kategori bağlantılarının tabanı: arama sayfasında filtre, kategori sayfasında gezinme */
    categoryHref: (slug: string) => string;
    subcategoryHref: (slug: string) => string;
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
    activeCategory,
    activeSubcategory,
    subcategories = [],
    filters,
    onChange,
    onReset,
    categoryHref,
    subcategoryHref,
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

                {/* Kategoriler — kategori sayfasındayken alt kategoriler gösterilir */}
                <Section title={activeCategory ? 'Alt kategoriler' : 'Kategoriler'}>
                    {activeCategory ? (
                        <div className="space-y-0.5">
                            <Link
                                to={categoryHref(activeCategory.slug)}
                                className={cn(
                                    'flex items-center justify-between text-sm py-1.5 rounded-md transition-colors',
                                    !activeSubcategory
                                        ? 'text-indigo-700 font-semibold'
                                        : 'text-slate-600 hover:text-slate-900'
                                )}
                            >
                                <span>Tümü</span>
                            </Link>

                            {subcategories.map(sub => {
                                const active = activeSubcategory?.slug === sub.slug;
                                return (
                                    <Link
                                        key={sub.id}
                                        to={subcategoryHref(sub.slug)}
                                        className={cn(
                                            'flex items-center justify-between gap-2 text-sm py-1.5 rounded-md transition-colors',
                                            active
                                                ? 'text-indigo-700 font-semibold'
                                                : 'text-slate-600 hover:text-slate-900'
                                        )}
                                    >
                                        <span className="truncate">{sub.name}</span>
                                        <span className="text-xs text-slate-400 tabular-nums shrink-0">{sub.count}</span>
                                    </Link>
                                );
                            })}

                            {subcategories.length === 0 && (
                                <p className="text-xs text-slate-400 py-1">Alt kategori yok</p>
                            )}

                            <Link
                                to="/categories"
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 pt-2 mt-1 border-t border-slate-100"
                            >
                                Tüm kategoriler <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {(facets?.categories || []).slice(0, 12).map(cat => (
                                <Link
                                    key={cat.id}
                                    to={categoryHref(cat.slug)}
                                    className="flex items-center justify-between gap-2 text-sm text-slate-600 hover:text-indigo-700 py-1.5 transition-colors"
                                >
                                    <span className="truncate">{cat.name}</span>
                                    <span className="text-xs text-slate-400 tabular-nums shrink-0">{cat.count}</span>
                                </Link>
                            ))}
                            {(facets?.categories || []).length === 0 && (
                                <p className="text-xs text-slate-400 py-1">Sonuçlarda kategori yok</p>
                            )}
                        </div>
                    )}
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

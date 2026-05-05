import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
    Filter,
    X,
    Star,
    Globe,
    Clock,
    DollarSign,
    Award,
    ChevronDown
} from 'lucide-react';

interface SearchSidebarProps {
    filters: any;
    setFilters: (filters: any) => void;
    className?: string;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({ filters, setFilters, className }) => {
    const { data: categories, loading: categoriesLoading } = useCategories();

    const levels = [
        { value: 'beginner', label: 'Başlangıç' },
        { value: 'intermediate', label: 'Orta' },
        { value: 'advanced', label: 'İleri' }
    ];

    const languages = [
        { value: 'tr', label: 'Türkçe' },
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' }
    ];

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleArrayToggle = (key: string, value: string) => {
        const current = (filters[key] || []) as string[];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        handleFilterChange(key, updated);
    };

    const clearFilters = () => {
        setFilters({
            category: undefined,
            level: undefined,
            price_min: undefined,
            price_max: undefined,
            rating: undefined,
            language: undefined
        });
    };

    return (
        <aside className={cn("w-full lg:w-72 space-y-6", className)}>
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            Filtreler
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors h-8 px-2"
                        >
                            Temizle
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                    {/* Categories */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Kategoriler</h4>
                        <div className="space-y-2">
                            {categoriesLoading ? (
                                <div className="animate-pulse space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted rounded w-3/4" />)}
                                </div>
                            ) : (
                                categories?.slice(0, 8).map((cat: any) => (
                                    <div key={cat.category_id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sidebar-cat-${cat.category_id}`}
                                            checked={filters.category === cat.category_id.toString()}
                                            onCheckedChange={() => handleFilterChange('category', filters.category === cat.category_id.toString() ? undefined : cat.category_id.toString())}
                                        />
                                        <label
                                            htmlFor={`sidebar-cat-${cat.category_id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {cat.name}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Level */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Seviye</h4>
                        <div className="space-y-2">
                            {levels.map(level => (
                                <div key={level.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`sidebar-level-${level.value}`}
                                        checked={filters.level === level.value}
                                        onCheckedChange={() => handleFilterChange('level', filters.level === level.value ? undefined : level.value)}
                                    />
                                    <label
                                        htmlFor={`sidebar-level-${level.value}`}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {level.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Price Range */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Fiyat</h4>
                        <div className="px-2 pt-2">
                            <Slider
                                defaultValue={[filters.price_min || 0, filters.price_max || 1000]}
                                max={1000}
                                step={50}
                                onValueChange={(val) => {
                                    handleFilterChange('price_min', val[0]);
                                    handleFilterChange('price_max', val[1]);
                                }}
                                className="mb-4"
                            />
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span>₺{filters.price_min || 0}</span>
                                <span>₺{filters.price_max || 1000}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Rating */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Puan</h4>
                        <div className="space-y-2">
                            {[4.5, 4.0, 3.5, 3.0].map(rating => (
                                <div key={rating} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`sidebar-rating-${rating}`}
                                        checked={filters.rating === rating}
                                        onCheckedChange={() => handleFilterChange('rating', filters.rating === rating ? undefined : rating)}
                                    />
                                    <label
                                        htmlFor={`sidebar-rating-${rating}`}
                                        className="flex items-center text-sm font-medium leading-none cursor-pointer"
                                    >
                                        <div className="flex items-center mr-2">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 mr-0.5" />
                                            <span>{rating} ve üzeri</span>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            Sonuçları Uygula
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
};

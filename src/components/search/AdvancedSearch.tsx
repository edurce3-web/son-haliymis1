import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCategories, useSearch } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Star,
  Clock,
  DollarSign,
  Globe,
  Award,
  Sparkles,
  TrendingUp,
  Users,
  BookOpen,
  Zap
} from 'lucide-react';

interface SearchFilters {
  query: string;
  categories: string[];
  instructors: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  levels: string[];
  languages: string[];
  duration: string;
  sortBy: string;
}

interface AdvancedSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch, className }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get categories from backend
  const { data: categories, loading: categoriesLoading } = useCategories();

  // Search hook with backend integration
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading: searchLoading
  } = useSearch(searchParams.get('q') || '');

  const [localFilters, setLocalFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    instructors: searchParams.get('instructors')?.split(',').filter(Boolean) || [],
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '1000'),
    minRating: parseInt(searchParams.get('minRating') || '0'),
    levels: searchParams.get('levels')?.split(',').filter(Boolean) || [],
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    duration: searchParams.get('duration') || '',
    sortBy: searchParams.get('sortBy') || 'relevance'
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [priceRange, setPriceRange] = useState([localFilters.minPrice, localFilters.maxPrice]);
  const [ratingFilter, setRatingFilter] = useState(localFilters.minRating);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Sync local filters with search hook
  useEffect(() => {
    setQuery(localFilters.query);
    setFilters({
      category: localFilters.categories[0] || undefined,
      level: localFilters.levels[0] || undefined,
      price_min: localFilters.minPrice > 0 ? localFilters.minPrice : undefined,
      price_max: localFilters.maxPrice < 1000 ? localFilters.maxPrice : undefined,
      rating: localFilters.minRating > 0 ? localFilters.minRating : undefined
    });
  }, [localFilters, setQuery, setFilters]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (localFilters.query) params.set('q', localFilters.query);
    if (localFilters.categories.length) params.set('categories', localFilters.categories.join(','));
    if (localFilters.levels.length) params.set('levels', localFilters.levels.join(','));
    if (localFilters.minPrice > 0) params.set('minPrice', localFilters.minPrice.toString());
    if (localFilters.maxPrice < 1000) params.set('maxPrice', localFilters.maxPrice.toString());
    if (localFilters.minRating > 0) params.set('minRating', localFilters.minRating.toString());

    setSearchParams(params);
  }, [localFilters, setSearchParams]);

  // Predefined options
  const levels = [
    { value: 'beginner', label: 'Başlangıç', icon: '🌱' },
    { value: 'intermediate', label: 'Orta', icon: '🌿' },
    { value: 'advanced', label: 'İleri', icon: '🌳' }
  ];

  const languages = [
    { value: 'tr', label: 'Türkçe', icon: '🇹🇷' },
    { value: 'en', label: 'English', icon: '🇺🇸' },
    { value: 'de', label: 'Deutsch', icon: '🇩🇪' },
    { value: 'fr', label: 'Français', icon: '🇫🇷' }
  ];

  const durations = [
    { value: '0-2', label: '0-2 saat' },
    { value: '2-6', label: '2-6 saat' },
    { value: '6-17', label: '6-17 saat' },
    { value: '17+', label: '17+ saat' }
  ];

  const sortOptions = [
    { value: 'rating_desc', label: 'En Yüksek Puan' },
    { value: 'rating_asc', label: 'En Düşük Puan' },
    { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
    { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
    { value: 'created_desc', label: 'En Yeni' },
    { value: 'created_asc', label: 'En Eski' }
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key: keyof SearchFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(item => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    setLocalFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1] }));
  };

  const handleSearch = () => {
    const searchFilters = {
      ...localFilters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minRating: ratingFilter
    };

    setLocalFilters(searchFilters);
    onSearch?.(searchFilters);

    // Navigate to search results if not already there
    if (!window.location.pathname.includes('/search')) {
      navigate('/search');
    }
  };

  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      categories: [],
      instructors: [],
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      levels: [],
      languages: [],
      duration: '',
      sortBy: 'relevance'
    };

    setLocalFilters(defaultFilters);
    setPriceRange([0, 1000]);
    setRatingFilter(0);
    setSearchParams({});
  };

  const getActiveFiltersCount = () => {
    const activeFiltersCount = [
      localFilters.categories.length,
      localFilters.instructors.length,
      localFilters.levels.length,
      localFilters.languages.length,
      localFilters.minPrice > 0 ? 1 : 0,
      localFilters.maxPrice < 1000 ? 1 : 0,
      localFilters.minRating > 0 ? 1 : 0,
      localFilters.duration ? 1 : 0
    ].reduce((sum, count) => sum + count, 0);

    return activeFiltersCount;
  };

  // Initial search on component mount
  useEffect(() => {
    if (localFilters.query || Object.values(localFilters).some(v =>
      Array.isArray(v) ? v.length > 0 : v && v !== '' && v !== 0
    )) {
      handleSearch();
    }
  }, []);

  return (
    <div className={cn(className, "transition-all duration-500", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Enhanced Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className={cn(
          "flex-1 relative transition-all duration-300",
          searchFocused ? "scale-[1.02]" : "scale-100"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl blur-xl opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"></div>
          <div className="relative">
            <Search className={cn(
              "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-200",
              searchFocused ? "text-primary scale-110" : "text-muted-foreground"
            )} />
            <Input
              placeholder="🔍 Kurs, eğitmen, konu ara..."
              value={localFilters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "pl-12 pr-4 py-3 text-lg border-2 rounded-xl transition-all duration-200",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                searchFocused ? "shadow-lg" : "shadow-sm"
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={searchLoading}
            />
            {localFilters.query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('query', '')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Button
          onClick={handleSearch}
          className="bg-gradient-primary hover:shadow-course-hover"
          disabled={searchLoading}
        >
          <Search className="w-4 h-4 mr-2" />
          {searchLoading ? 'Aranıyor...' : 'Ara'}
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          size="lg"
          className={cn(
            "relative px-6 py-3 rounded-xl font-semibold transition-all duration-200",
            "hover:scale-105 hover:shadow-md",
            isExpanded ? "bg-primary/10 border-primary" : ""
          )}
        >
          <Filter className={cn(
            "w-5 h-5 mr-2 transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )} />
          Filtreler
          {getActiveFiltersCount() > 0 && (
            <Badge className={cn(
              "absolute -top-2 -right-2 min-w-[24px] h-6 rounded-full text-xs font-bold",
              "bg-gradient-to-r from-red-500 to-pink-500 text-white",
              "animate-pulse shadow-lg"
            )}>
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Enhanced Active Filters */}
      {(localFilters.categories.length > 0 || localFilters.levels.length > 0 || localFilters.languages.length > 0 || localFilters.minRating > 0 || localFilters.duration) && (
        <div className={cn(
          "flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50",
          "transition-all duration-300 animate-in slide-in-from-top-2"
        )}>
          <div className="flex items-center text-sm font-medium text-muted-foreground mb-2 w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Aktif Filtreler:
          </div>

          {localFilters.categories.map((categoryId, index) => {
            const category = categories?.find((c: any) => c.category_id.toString() === categoryId);
            return (
              <Badge
                key={categoryId}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105",
                  "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                  "animate-in fade-in slide-in-from-left-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Award className="w-3 h-3 mr-1" />
                {category?.name || categoryId}
                <X
                  className="w-3 h-3 ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  onClick={() => handleArrayFilterToggle('categories', categoryId)}
                />
              </Badge>
            );
          })}

          {localFilters.levels.map((level, index) => (
            <Badge
              key={level}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105",
                "bg-gradient-to-r from-green-500 to-green-600 text-white",
                "animate-in fade-in slide-in-from-left-2"
              )}
              style={{ animationDelay: `${(localFilters.categories.length + index) * 50}ms` }}
            >
              <Star className="w-3 h-3 mr-1" />
              {level}
              <X
                className="w-3 h-3 ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                onClick={() => handleArrayFilterToggle('levels', level)}
              />
            </Badge>
          ))}

          {localFilters.languages.map((language, index) => (
            <Badge
              key={language}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105",
                "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
                "animate-in fade-in slide-in-from-left-2"
              )}
              style={{ animationDelay: `${(localFilters.categories.length + localFilters.levels.length + index) * 50}ms` }}
            >
              <Globe className="w-3 h-3 mr-1" />
              {language}
              <X
                className="w-3 h-3 ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                onClick={() => handleArrayFilterToggle('languages', language)}
              />
            </Badge>
          ))}

          {localFilters.minRating > 0 && (
            <Badge className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105",
              "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
            )}>
              <Star className="w-3 h-3 mr-1 fill-current" />
              {localFilters.minRating}+ Puan
              <X
                className="w-3 h-3 ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                onClick={() => handleFilterChange('minRating', 0)}
              />
            </Badge>
          )}

          {localFilters.duration && (
            <Badge className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105",
              "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            )}>
              <Clock className="w-3 h-3 mr-1" />
              {durations.find(d => d.value === localFilters.duration)?.label}
              <X
                className="w-3 h-3 ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                onClick={() => handleFilterChange('duration', '')}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className={cn(
              "ml-auto transition-all duration-200 hover:scale-105",
              "hover:bg-red-50 hover:text-red-600 border border-red-200"
            )}
          >
            <X className="w-4 h-4 mr-2" />
            Tümünü Temizle
          </Button>
        </div>
      )}

      {/* Enhanced Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="transition-all duration-300">
          <Card className={cn(
            "mb-6 overflow-hidden transition-all duration-300",
            "bg-gradient-to-br from-background to-muted/20",
            "border-2 border-border/50 shadow-xl",
            isExpanded ? "animate-in slide-in-from-top-4" : ""
          )}>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-border/50">
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-primary to-purple-500 rounded-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Gelişmiş Filtreler
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Kategoriler
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categoriesLoading ? (
                      <div className="text-sm text-muted-foreground">Kategoriler yükleniyor...</div>
                    ) : categories?.map((category: any) => (
                      <div key={category.category_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.category_id}`}
                          checked={localFilters.categories.includes(category.category_id.toString())}
                          onCheckedChange={() => handleArrayFilterToggle('categories', category.category_id.toString())}
                        />
                        <label htmlFor={`category-${category.category_id}`} className="text-sm cursor-pointer">
                          {category.name} ({category.course_count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Seviye
                  </h4>
                  <div className="space-y-2">
                    {levels.map(level => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`level-${level.value}`}
                          checked={localFilters.levels.includes(level.value)}
                          onCheckedChange={() => handleArrayFilterToggle('levels', level.value)}
                        />
                        <label htmlFor={`level-${level.value}`} className="text-sm cursor-pointer">
                          {level.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Dil
                  </h4>
                  <div className="space-y-2">
                    {languages.map(language => (
                      <div key={language.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language.value}`}
                          checked={localFilters.languages.includes(language.value)}
                          onCheckedChange={() => handleArrayFilterToggle('languages', language.value)}
                        />
                        <label htmlFor={`language-${language.value}`} className="text-sm cursor-pointer">
                          {language.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Fiyat Aralığı
                  </h4>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₺{priceRange[0]}</span>
                      <span>₺{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Minimum Puan
                  </h4>
                  <div className="space-y-2">
                    {[4.5, 4.0, 3.5, 3.0].map(rating => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={localFilters.minRating === rating}
                          onCheckedChange={() => handleFilterChange('minRating', localFilters.minRating === rating ? 0 : rating)}
                        />
                        <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {rating} ve üzeri
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Süre
                  </h4>
                  <Select value={localFilters.duration} onValueChange={(value) => handleFilterChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Süre seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {durations.map(duration => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="font-medium mb-3">Sıralama</h4>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={clearFilters}>
                  Temizle
                </Button>
                <Button onClick={handleSearch}>
                  Filtreleri Uygula
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

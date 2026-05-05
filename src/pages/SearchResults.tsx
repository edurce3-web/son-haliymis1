import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchSidebar } from '@/components/search/SearchSidebar';
import { CourseCard } from '@/components/course/CourseCard';
import { useSearch } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
  Grid,
  List,
  SortAsc,
  SortDesc,
  BookOpen,
  Search,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Star,
  SlidersHorizontal
} from 'lucide-react';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get search parameters from URL
  const initialQuery = searchParams.get('q') || '';
  const initialFilters = {
    category: searchParams.get('categories')?.split(',')[0] || undefined,
    level: searchParams.get('levels')?.split(',')[0] || undefined,
    price_min: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    price_max: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    rating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
  };

  // Use search hook with backend integration
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    error,
    refetch
  } = useSearch(initialQuery);

  // Set initial filters from URL
  useEffect(() => {
    setFilters(initialFilters);
  }, []);

  // Update query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams, query, setQuery]);

  const sortOptions = [
    { value: 'relevance', label: 'İlgili', icon: TrendingUp },
    { value: 'rating_desc', label: 'En Yüksek Puan', icon: Star },
    { value: 'price_asc', label: 'Fiyat: Düşük → Yüksek', icon: SortAsc },
    { value: 'price_desc', label: 'Fiyat: Yüksek → Düşük', icon: SortDesc },
    { value: 'created_desc', label: 'En Yeni', icon: Clock },
  ];

  const ResultsSkeleton = () => (
    <div className={cn(
      viewMode === 'grid'
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-6"
    )}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-none shadow-sm">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
      <div className="w-20 h-20 mx-auto mb-6 bg-background rounded-full flex items-center justify-center shadow-sm">
        <Search className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">Sonuç bulunamadı</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Arama kriterlerinize uygun kurs bulunamadı. Lütfen filtrelerinizi kontrol edin veya farklı bir arama yapın.
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" size="lg" className="rounded-xl" onClick={() => setFilters({})}>
          Filtreleri Sıfırla
        </Button>
        <Button size="lg" className="rounded-xl bg-primary text-white" onClick={() => navigate('/')}>
          Ana Sayfaya Dön
        </Button>
      </div>
    </div>
  );
  const ErrorState = () => (
    <div className="text-center py-20 bg-red-50/30 rounded-3xl border-2 border-dashed border-red-100">
      <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">Bir hata oluştu</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Arama sırasında bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.
      </p>
      <Button size="lg" className="rounded-xl flex items-center gap-2" onClick={refetch}>
        <RefreshCw className="w-4 h-4" />
        Tekrar Dene
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <SearchSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {query ? `"${query}" sonuçları` : 'Tüm Kurslar'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {results?.courses ? `${results.courses.length} eğitim bulundu` : 'Sonuçlar yükleniyor...'}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  className="lg:hidden flex-1 md:flex-none flex items-center gap-2 rounded-xl border-gray-200"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtrele
                </Button>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer px-3 py-1.5 min-w-[140px]"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn("h-8 w-8 p-0 rounded-lg", viewMode === 'grid' && "bg-primary text-white")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn("h-8 w-8 p-0 rounded-lg", viewMode === 'list' && "bg-primary text-white")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Sidebar (Collapsible) */}
            {showMobileFilters && (
              <div className="lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
                  <CardContent className="p-6">
                    <SearchSidebar filters={filters} setFilters={setFilters} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Content Area */}
            {loading ? (
              <ResultsSkeleton />
            ) : error ? (
              <ErrorState />
            ) : !results?.courses || results.courses.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-10">
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8'
                    : 'space-y-6'
                )}>
                  {results.courses.map((course: any) => (
                    <div key={course.id} className="transition-transform duration-300 hover:scale-[1.02]">
                      <CourseCard
                        course={{
                          ...course,
                          instructor: course.instructor_name,
                          studentCount: course.student_count,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {results.pagination && results.pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-10 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      disabled={results.pagination.page <= 1}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (results.pagination.page - 1).toString());
                        navigate(`/search?${params.toString()}`);
                      }}
                      className="rounded-xl flex items-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      Önceki
                    </Button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, results.pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === results.pagination.page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set('page', page.toString());
                              navigate(`/search?${params.toString()}`);
                            }}
                            className={cn(
                              "h-10 w-10 rounded-xl font-bold transition-all",
                              page === results.pagination.page
                                ? "bg-primary text-white shadow-lg shadow-primary/25 scale-110"
                                : "hover:border-primary hover:text-primary"
                            )}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      disabled={results.pagination.page >= results.pagination.totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (results.pagination.page + 1).toString());
                        navigate(`/search?${params.toString()}`);
                      }}
                      className="rounded-xl flex items-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      Sonraki
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;

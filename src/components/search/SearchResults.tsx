import React, { useState, useEffect } from 'react';
import { CourseCard } from '@/components/course/CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter,
  SortAsc,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  course_id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  student_count: number;
  thumbnail: string;
  instructor_name: string;
  category_name: string;
  level: string;
  duration: number;
  language: string;
  created_at: string;
}

interface SearchResultsProps {
  courses: Course[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  courses,
  loading,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  viewMode,
  onViewModeChange,
  searchQuery
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(0);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [courses, loading]);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 animate-pulse" />
            <Skeleton className="h-4 w-32 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
            <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className={cn(
          "grid gap-6 transition-all duration-500",
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        )}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className={cn(
              "overflow-hidden animate-pulse",
              "hover:shadow-lg transition-all duration-300"
            )}>
              <Skeleton className="h-48 w-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
                <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
                  <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={cn(
        "text-center py-16 transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-muted-foreground animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-600 animate-spin" />
          </div>
        </div>
        
        <div className="space-y-4 max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-foreground">Sonuç Bulunamadı</h3>
          <p className="text-muted-foreground text-lg">
            {searchQuery 
              ? (
                <>
                  <span className="font-medium text-primary">"{searchQuery}"</span> için arama sonucu bulunamadı.
                </>
              )
              : 'Seçilen filtrelere uygun kurs bulunamadı.'
            }
          </p>
          
          <div className="bg-muted/30 rounded-xl p-6 space-y-3">
            <h4 className="font-semibold text-foreground">Öneriler:</h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Farklı anahtar kelimeler deneyin</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Filtreleri değiştirin veya kaldırın</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Daha genel terimler kullanın</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Results Header */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-6 rounded-2xl",
        "bg-gradient-to-r from-background to-muted/30 border border-border/50",
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {totalCount.toLocaleString()}
              </span>
              <span className="text-foreground ml-2">kurs bulundu</span>
            </h2>
            {totalCount > 100 && (
              <Badge className="bg-green-100 text-green-700 animate-pulse">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popüler
              </Badge>
            )}
          </div>
          
          {searchQuery && (
            <p className="text-muted-foreground">
              <span className="font-medium text-primary">"{searchQuery}"</span> için sonuçlar
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Sayfa {currentPage} / {totalPages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{Math.ceil(totalCount / 12)} sayfa</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced View Mode Toggle */}
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "transition-all duration-200",
              viewMode === 'grid' 
                ? "bg-background shadow-sm" 
                : "hover:bg-background/50"
            )}
          >
            <Grid className="w-4 h-4 mr-2" />
            Izgara
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "transition-all duration-200",
              viewMode === 'list' 
                ? "bg-background shadow-sm" 
                : "hover:bg-background/50"
            )}
          >
            <List className="w-4 h-4 mr-2" />
            Liste
          </Button>
        </div>
      </div>

      {/* Enhanced Course Grid/List */}
      <div className={cn(
        "grid gap-6 transition-all duration-500",
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1 max-w-4xl mx-auto'
      )}>
        {courses.map((course, index) => (
          <div
            key={course.course_id}
            className={cn(
              "transition-all duration-500",
              isVisible 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-8"
            )}
            style={{
              transitionDelay: `${index * 50}ms`
            }}
          >
            <CourseCard
              course={{
                id: course.course_id,
                title: course.title,
                description: course.description,
                price: course.price,
                rating: course.rating,
                studentCount: course.student_count,
                thumbnail: course.thumbnail,
                instructor: course.instructor_name,
                category: course.category_name,
                level: course.level,
                duration: course.duration?.toString() || '0',
                language: course.language
              }}
              variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
              isAuthenticated={!!localStorage.getItem('token')}
            />
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className={cn(
          "flex justify-center items-center space-x-3 pt-12",
          "transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              currentPage === 1 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Önceki
          </Button>
          
          <div className="flex space-x-2 bg-muted/30 p-2 rounded-xl">
            {/* First page */}
            {currentPage > 3 && (
              <>
                <Button
                  variant={1 === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <div className="flex items-center px-2 text-muted-foreground">
                    <span>...</span>
                  </div>
                )}
              </>
            )}
            
            {/* Current page and neighbors */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "w-10 h-10 rounded-lg transition-all duration-200",
                    pageNum === currentPage 
                      ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                      : "hover:scale-110 hover:bg-background"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <div className="flex items-center px-2 text-muted-foreground">
                    <span>...</span>
                  </div>
                )}
                <Button
                  variant={totalPages === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  className="w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              currentPage === totalPages && "opacity-50 cursor-not-allowed"
            )}
          >
            Sonraki
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

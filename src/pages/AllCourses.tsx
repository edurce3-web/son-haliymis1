import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { SearchResults } from '@/components/search/SearchResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Link } from "react-router-dom";
import { useApiData } from '@/hooks/useApi';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';

type Course = {
  id: string | number;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  rating?: number;
  language?: string;
  image?: string;
  price?: number | string;
};

const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[]));

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

const AllCourses = () => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    instructors: [],
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    levels: [],
    languages: [],
    duration: '',
    sortBy: 'rating_desc'
  });

  // Backend API calls for courses
  const fetchAllCourses = async () => {
    const params: any = {};
    if (searchFilters.query) params.q = searchFilters.query;
    if (searchFilters.categories.length) params.categories = searchFilters.categories.join(',');
    if (searchFilters.levels.length) params.levels = searchFilters.levels.join(',');
    if (searchFilters.languages.length) params.languages = searchFilters.languages.join(',');
    if (searchFilters.minPrice > 0) params.minPrice = searchFilters.minPrice;
    if (searchFilters.maxPrice < 1000) params.maxPrice = searchFilters.maxPrice;
    if (searchFilters.minRating > 0) params.minRating = searchFilters.minRating;
    if (searchFilters.duration) params.duration = searchFilters.duration;
    if (searchFilters.sortBy) params.sort = searchFilters.sortBy;
    params.page = currentPage;
    params.pageSize = 12;
    
    return await api.courses.getAll(params);
  };

  // Fetch courses with backend integration
  const { data: coursesData, loading: isLoading, error, refetch } = useApiData(
    fetchAllCourses,
    [searchFilters, currentPage],
    { immediate: true }
  );

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Transform courses data for SearchResults component
  const transformedCourses = coursesData?.courses?.map((course: any) => ({
    course_id: course.id || course.course_id,
    title: course.title,
    description: course.description,
    price: course.price,
    rating: course.rating,
    student_count: course.student_count || 0,
    thumbnail: course.image || course.thumbnail,
    instructor_name: course.instructor || course.instructor_name,
    category_name: course.category || course.category_name,
    level: course.level,
    duration: course.duration || 0,
    language: course.language,
    created_at: course.created_at,
    is_bestseller: course.is_bestseller,
    is_new: course.is_new,
    original_price: course.original_price
  })) || [];

  const totalPages = coursesData?.pagination?.total_pages || 0;
  const totalCount = coursesData?.pagination?.total_courses || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tüm Kurslar</h1>
        <p className="text-muted-foreground">Gelişmiş arama ve filtreleme ile istediğiniz kursu bulun.</p>
      </div>

      <div className="space-y-6">
        <AdvancedSearch onSearch={handleSearch} />
        
        <SearchResults
          courses={transformedCourses}
          loading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchQuery={searchFilters.query}
        />
      </div>
    </div>
  );
};

export default AllCourses;



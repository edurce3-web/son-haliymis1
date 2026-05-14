import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Play,
  BookOpen,
  Award,
  TrendingUp,
  Heart,
  ShoppingCart,
  Eye,
  Download,
  Globe,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  SlidersHorizontal,
  Zap,
  Crown,
  Fire,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  course_id: number;
  title: string;
  description: string;
  instructor_name: string;
  instructor_avatar?: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  rating: number;
  review_count: number;
  student_count: number;
  duration: string;
  lesson_count: number;
  level: 'Başlangıç' | 'Orta' | 'İleri';
  language: string;
  image_url: string;
  categories: string[];
  tags: string[];
  last_updated: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  has_certificate?: boolean;
  preview_video?: string;
  completion_rate?: number;
  is_favorite?: boolean;
  is_in_cart?: boolean;
}

interface FilterOptions {
  categories: string[];
  levels: string[];
  languages: string[];
  priceRange: [number, number];
  rating: number;
  duration: string;
  features: string[];
}

export const CourseMarketplace: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    levels: [],
    languages: [],
    priceRange: [0, 500],
    rating: 0,
    duration: '',
    features: []
  });

  // Fetch courses data
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', searchQuery, selectedCategory, sortBy, filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        sort: sortBy,
        page: currentPage.toString(),
        ...filters
      });
      const response = await fetch(`/api/courses/marketplace?${params}`);
      return response.json();
    }
  });

  const courses = coursesData?.courses || [];
  const totalPages = coursesData?.totalPages || 1;
  const totalCourses = coursesData?.total || 0;

  // Categories and filter options
  const categories = [
    { id: 'all', name: 'Tüm Kategoriler', icon: '📚' },
    { id: 'programming', name: 'Programlama', icon: '💻' },
    { id: 'design', name: 'Tasarım', icon: '🎨' },
    { id: 'business', name: 'İş Dünyası', icon: '💼' },
    { id: 'marketing', name: 'Pazarlama', icon: '📈' },
    { id: 'data-science', name: 'Veri Bilimi', icon: '📊' },
    { id: 'photography', name: 'Fotoğrafçılık', icon: '📸' },
    { id: 'music', name: 'Müzik', icon: '🎵' },
    { id: 'language', name: 'Dil Öğrenimi', icon: '🌍' }
  ];

  const sortOptions = [
    { value: 'popularity', label: 'En Popüler' },
    { value: 'rating', label: 'En Yüksek Puan' },
    { value: 'newest', label: 'En Yeni' },
    { value: 'price_low', label: 'Fiyat (Düşük → Yüksek)' },
    { value: 'price_high', label: 'Fiyat (Yüksek → Düşük)' },
    { value: 'duration', label: 'Süre' }
  ];

  // Add to cart function
  const addToCart = async (courseId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ course_id: courseId })
      });

      if (response.ok) {
        toast.success('Kurs sepete eklendi!');
      } else {
        toast.error('Sepete eklerken hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  // Toggle favorite
  const toggleFavorite = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Favoriler güncellendi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  // Course card component
  const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
      <div className={`relative ${viewMode === 'list' ? 'w-64 flex-shrink-0' : ''}`}>
        <img
          src={course.image_url}
          alt={course.title}
          className={`w-full object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300 ${
            viewMode === 'list' ? 'h-32 rounded-l-lg rounded-t-none' : 'h-48'
          }`}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {course.is_bestseller && (
            <Badge className="bg-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Bestseller
            </Badge>
          )}
          {course.is_new && (
            <Badge className="bg-green-500 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Yeni
            </Badge>
          )}
          {course.discount_percent && (
            <Badge className="bg-red-500 text-white">
              %{course.discount_percent} İndirim
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => toggleFavorite(course.course_id)}
        >
          <Heart className={`w-4 h-4 ${course.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>

        {/* Preview play button */}
        {course.preview_video && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="w-4 h-4" />
          </Button>
        )}
      </div>

      <CardContent className={`p-4 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {course.level}
            </Badge>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Globe className="w-3 h-3" />
              <span>{course.language}</span>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {course.description}
          </p>

          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={course.instructor_avatar} />
              <AvatarFallback className="text-xs">
                {course.instructor_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">{course.instructor_name}</span>
          </div>

          <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{course.rating}</span>
              <span>({course.review_count})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{course.student_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            {course.categories.slice(0, 2).map((category, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            {course.original_price && course.original_price > course.price && (
              <span className="text-sm text-gray-500 line-through">
                ₺{course.original_price}
              </span>
            )}
            <span className="text-xl font-bold text-green-600">
              ₺{course.price}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCart(course.course_id)}
              disabled={course.is_in_cart}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {course.is_in_cart ? 'Sepette' : 'Sepete Ekle'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Filter panel component
  const FilterPanel: React.FC = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filtreler</h3>
        <Button variant="ghost" size="sm" onClick={() => setFilters({
          categories: [],
          levels: [],
          languages: [],
          priceRange: [0, 500],
          rating: 0,
          duration: '',
          features: []
        })}>
          Temizle
        </Button>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">Fiyat Aralığı</label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
            max={500}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₺{filters.priceRange[0]}</span>
            <span>₺{filters.priceRange[1]}</span>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm font-medium mb-2 block">Minimum Puan</label>
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.rating === rating}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, rating: checked ? rating : 0 }))
                  }
                />
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{rating} ve üzeri</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="text-sm font-medium mb-2 block">Seviye</label>
          <div className="space-y-2">
            {['Başlangıç', 'Orta', 'İleri'].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.levels.includes(level)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, levels: [...prev.levels, level] }));
                    } else {
                      setFilters(prev => ({ ...prev, levels: prev.levels.filter(l => l !== level) }));
                    }
                  }}
                />
                <span className="text-sm">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="text-sm font-medium mb-2 block">Özellikler</label>
          <div className="space-y-2">
            {[
              { id: 'certificate', label: 'Sertifika', icon: Award },
              { id: 'subtitles', label: 'Altyazı', icon: BookOpen },
              { id: 'mobile', label: 'Mobil Erişim', icon: Eye },
              { id: 'lifetime', label: 'Ömür Boyu Erişim', icon: Target }
            ].map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.features.includes(feature.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, features: [...prev.features, feature.id] }));
                    } else {
                      setFilters(prev => ({ ...prev, features: prev.features.filter(f => f !== feature.id) }));
                    }
                  }}
                />
                <feature.icon className="w-4 h-4" />
                <span className="text-sm">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Hayallerinizdeki Kariyere Ulaşın
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Binlerce kurs, uzman eğitmenler ve sınırsız öğrenme fırsatı
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Ne öğrenmek istiyorsunuz?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white text-gray-900 rounded-full"
              />
            </div>

            {/* Popular searches */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm opacity-75">Popüler aramalar:</span>
              {['React', 'Python', 'Tasarım', 'İngilizce', 'Pazarlama'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="flex items-center space-x-2 whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-80 flex-shrink-0`}>
            <FilterPanel />
          </div>

          {/* Course Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {totalCourses.toLocaleString()} kurs bulundu
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtreler
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Course Grid */}
            {!isLoading && (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }`}>
                {courses.map((course: Course) => (
                  <CourseCard key={course.course_id} course={course} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Önceki
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Filter,
  Grid,
  List,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  GraduationCap,
  ArrowUpRight,
  Share2,
  Bell,
  CheckCircle2,
  Trophy,
  Rocket
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { CourseCard } from '@/components/course/CourseCard';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import { CategoryHeroCard } from '@/components/category/CategoryHeroCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  instructor_avatar?: string;
  price: number;
  original_price?: number;
  rating: number;
  review_count: number;
  student_count: number;
  duration: number;
  level: string;
  thumbnail: string;
  image?: string;
  instructor?: string;
  created_at: string;
  updated_at: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  discount_percentage?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  course_count?: number;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  course_count?: number;
}

// Stats data for categories
const getCategoryStats = (slug?: string) => {
  if (!slug) return { students: 50000, courses: 200, instructors: 40, hours: 5000 };

  const stats: Record<string, { students: number; courses: number; instructors: number; hours: number }> = {
    'yazilim-gelistirme': { students: 125000, courses: 450, instructors: 89, hours: 12500 },
    'tasarim': { students: 89000, courses: 320, instructors: 67, hours: 8900 },
    'pazarlama': { students: 76000, courses: 280, instructors: 54, hours: 7200 },
    'finans-ve-muhasebe': { students: 92000, courses: 340, instructors: 72, hours: 9800 },
    'kisisel-gelisim': { students: 145000, courses: 520, instructors: 95, hours: 14200 },
    'isletme': { students: 110000, courses: 380, instructors: 78, hours: 10500 },
    'bt-ve-yazilim': { students: 98000, courses: 290, instructors: 62, hours: 8200 },
    'ofiste-verimlilik': { students: 65000, courses: 180, instructors: 45, hours: 4800 },
    'ogretim-ve-akademi': { students: 82000, courses: 310, instructors: 58, hours: 9100 },
    'muzik': { students: 71000, courses: 220, instructors: 48, hours: 6200 },
    'fotograf-ve-video': { students: 68000, courses: 195, instructors: 42, hours: 5500 },
    'saglik-ve-fitness': { students: 95000, courses: 260, instructors: 55, hours: 7800 },
    'yasam-tarzi': { students: 58000, courses: 170, instructors: 38, hours: 4200 },
  };
  return stats[slug] || { students: 50000, courses: 200, instructors: 40, hours: 5000 };
};

const CategoryCoursesPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug: string;
    subcategorySlug?: string;
  }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<SubCategory | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFollowing, setIsFollowing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (categorySlug) {
      setLoading(true);
      setError(null);
      setSubcategory(null);
      fetchCategoryData();
      fetchCourses();
    }
  }, [categorySlug, subcategorySlug, activeFilter]);

  const fetchCategoryData = async () => {
    try {
      if (subcategorySlug) {
        const response = await api.categories.getSubcategoryBySlug(categorySlug!, subcategorySlug);
        if (response) {
          setCategory(response.category || null);
          setSubcategory(response.subcategory || null);
        }
      } else {
        const response = await api.categories.getBySlug(categorySlug!);
        if (response) {
          setCategory(response.category || response || null);
        }
      }
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Kategori yüklenirken bir hata oluştu');
    }
  };

  const fetchCourses = async () => {
    try {
      let response;
      if (subcategorySlug) {
        response = await api.courses.getBySubcategorySlug(categorySlug!, subcategorySlug, activeFilter);
      } else {
        response = await api.courses.getByCategorySlug(categorySlug!, activeFilter);
      }

      if (response) {
        setCourses(response.courses || []);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = getCategoryStats(categorySlug);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex gap-12">
            <div className="w-72 hidden lg:block space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="space-y-2 mt-8">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <Skeleton className="h-[300px] w-full rounded-[2rem]" />
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-[2rem]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex gap-8">
            <CategorySidebar />
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-3xl bg-rose-100 flex items-center justify-center mb-6">
                <BookOpen className="w-12 h-12 text-rose-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Bir Hata Oluştu</h3>
              <p className="text-slate-500 max-w-md mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="rounded-xl">
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort courses
  const sortedCourses = [...courses].sort((a, b) => {
    if (activeFilter === 'price-low') return (a.price || 0) - (b.price || 0);
    if (activeFilter === 'price-high') return (b.price || 0) - (a.price || 0);
    if (activeFilter === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (activeFilter === 'newest') {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    return (b.student_count || 0) - (a.student_count || 0);
  });

  const staffPick = sortedCourses.length > 0 ? sortedCourses[0] : null;
  const featuredCourses = sortedCourses.slice(1, 4);
  const otherCourses = sortedCourses.slice(4);

  const categoryName = category?.name || 'Kategori';
  const subcategoryName = subcategory?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Background (Simplified) */}
      <div className="fixed inset-0 bg-white pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <CategorySidebar />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Course Grid */}
              {sortedCourses.length > 0 ? (
                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                  {sortedCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CourseCard course={course} isAuthenticated={isAuthenticated} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[20px] border border-zinc-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-zinc-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6 relative shadow-inner">
                    <BookOpen className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2 relative">Henüz Kurs Seçeneği Bulunmuyor</h3>
                  <p className="text-sm text-zinc-500 max-w-sm mb-6 relative">
                    Bu bölümde şimdilik içerik yer almıyor. Yeni ve kaliteli kurslar eklenmeye devam edecektir.
                  </p>
                  <Link to="/courses" className="relative">
                    <Button variant="outline" className="rounded-xl text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 font-medium tracking-wide text-xs px-6 transition-all">
                      TÜM KURSLARA DÖN
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCoursesPage;

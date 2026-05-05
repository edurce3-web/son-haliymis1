import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { HeroSection } from "@/components/hero/HeroSection";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCarousel } from "@/components/course/CourseCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiData } from "@/hooks/useApi";
import api from "@/services/api";
import {
  BookOpen,
  Code2,
  Palette,
  Megaphone,
  Database,
  Lightbulb,
  Target,
  Calculator,
  Stethoscope,
  Music
} from "lucide-react";

// Backend API call for home page data
const fetchHomePageData = async () => {
  return await api.get('/home');
};

const fetchFeaturedCourses = async () => {
  return await api.courses.getFeatured();
};

const Home = () => {
  const { isAuthenticated } = useAuth();

  // Backend data fetching
  const { data: homeData, loading: homeLoading } = useApiData(
    () => api.home.getData(),
    [],
    { immediate: true }
  );

  const loading = homeLoading;

  // Mock data for top/new courses - in real app, these would come from API
  const topCourses = [
    { id: 101, title: "[Basitten İleri Seviyeye] Her Yönüyle MERN Stack Eğitimi", instructor: "Ali Osman Hazır", rating: 0, price: 499.99, studentCount: 0, originalPrice: 899.99 },
    { id: 102, title: "MERN Stack Geliştirme Kursu", instructor: "Ahmet Buğra Çakıcı", rating: 0, price: 349.99, studentCount: 0, originalPrice: 699.99 },
    { id: 103, title: "Sıfırdan Projelerle Front-End ve React 18.x Öğren (52+ Saat)", instructor: "Hakan Yalçınkaya", rating: 0, price: 2999.99, studentCount: 0, originalPrice: 3999.99 },
    { id: 104, title: "Admin Panelli Full Stack React E-Ticaret Sitesi Yapımı", instructor: "Emin Basbayan, BilGen Yazılım", rating: 0, price: 319.99, studentCount: 0, originalPrice: 499.99 },
    { id: 105, title: "Sıfırdan Her Yönüyle React ve Redux", instructor: "Mehmet Seven", rating: 0, price: 749.99, studentCount: 0, originalPrice: 999.99 },
    { id: 106, title: "Veri Bilimi ve Makine Öğrenmesi 2026 : 100 Günlük...", instructor: "Atıl Samancıoğlu, Academy Club", rating: 0, price: 319.99, studentCount: 0, originalPrice: 499.99 }
  ];

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      'Programlama': Code2,
      'Tasarım': Palette,
      'Pazarlama': Megaphone,
      'Veri Bilimi': Database,
      'Kişisel Gelişim': Lightbulb,
      'İşletme': Target,
      'Matematik': Calculator,
      'Sağlık': Stethoscope,
      'Müzik': Music
    };
    return iconMap[categoryName] || BookOpen;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[400px] w-full rounded-xl mb-12" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-[280px] rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection data={homeData?.hero} stats={[]} />

      <div className="container mx-auto px-4 py-6">
        {/* Featured Courses */}
        <CourseCarousel title="Öne Çıkan Kurslar">
          {(homeData?.featured_courses || []).map((course: any) => (
            <CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} />
          ))}
        </CourseCarousel>

        {/* Top Sellers */}
        <CourseCarousel title="En Çok Satan Kurslar">
          {(homeData?.top_selling || []).map((course: any) => (
            <CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} />
          ))}
        </CourseCarousel>

        {/* Categories */}
        <section className="py-2 mt-2">
          <div className="mb-4">
            <h2 className="text-[22px] font-black tracking-tight text-slate-900">Popüler Kategoriler</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Kariyerinizi şekillendirecek uzmanlık alanları</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {(homeData?.popular_categories || []).map((category: any) => {
              const Icon = getCategoryIcon(category.name);
              return (
                <Link
                  key={category.id}
                  to={`/courses?category=${category.id}`}
                  className="group flex flex-col items-center py-4 px-2 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2.5 shadow-sm group-hover:bg-indigo-100 transition-colors">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 text-center leading-tight">
                    {category.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{category.course_count} Kurs</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* New Courses */}
        <CourseCarousel title="Yeni Eklenen Kurslar">
          {(homeData?.new_courses || []).map((course: any) => (
            <CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} />
          ))}
        </CourseCarousel>
      </div>
    </div>
  );
};

export default Home;
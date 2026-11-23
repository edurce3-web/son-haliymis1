import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getCourseImageUrl } from '@/lib/api';
import { PageBand } from '@/components/layout/PageBand';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Star,
  Users,
  Trash2,
  BookOpen
} from 'lucide-react';

const Favorites = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    fetchFavorites();

    const handleFavoritesUpdate = () => {
      fetchFavorites();
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { toast.error('Lütfen giriş yapın'); return; }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { favorites: [...] }
        setFavorites(data.favorites || data.items || []);
      } else if (response.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
      } else {
        toast.error('Favoriler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch favorites error:', error);
      toast.error('Favoriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromFavorites = async (courseId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { toast.error('Lütfen giriş yapın'); return; }

      const response = await fetch(`${API_BASE_URL}/favorites/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setFavorites(favorites.filter(item => (item.course_id || item.id) !== courseId));
        toast.success('Kurs favorilerden kaldırıldı');
        window.dispatchEvent(new Event('favoritesUpdated'));
      } else {
        toast.error('Favorilerden kaldırırken hata oluştu');
      }
    } catch (error) {
      toast.error('Favorilerden kaldırırken hata oluştu');
    }
  };

  const addToCart = async (course: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { toast.error('Lütfen giriş yapın'); return; }

      const courseId = course.course_id || course.id;
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId })
      });

      if (response.ok) {
        toast.success('Kurs sepete eklendi');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Sepete eklerken hata oluştu');
      }
    } catch (error) {
      toast.error('Sepete eklerken hata oluştu');
    }
  };

  const band = (
    <PageBand
      breadcrumb={<><Link to="/">Ana sayfa</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#111827]">Favorilerim</span></>}
      eyebrow="Hesabım"
      title="Favorilerim"
      subtitle={isLoading ? undefined : favorites.length > 0 ? `${favorites.length} favori kurs` : 'Beğendiğin kursları burada topla.'}
    />
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {band}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-[#F5F6F8]  animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {band}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        {favorites.length === 0 ? (
          <div className=" bg-[#F5F6F8] py-16 px-6 text-center">
            <p className="text-[20px] font-extrabold">Henüz favori kursun yok</p>
            <p className="mt-2 text-[14.5px] text-[#6B7280] max-w-md mx-auto">
              Beğendiğin kursları favorilere ekle, sonra kolayca bulursun.
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center h-11 px-6  bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14.5px] font-bold transition-colors"
            >
              Kursları keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((course) => {
              const id = course.course_id || course.id;
              const image = getCourseImageUrl(id, course.image_path || course.image_url);
              const instructor = course.instructor_name ||
                `${course.instructor_first_name || ''} ${course.instructor_last_name || ''}`.trim();
              const rating = Number(course.rating || 0);
              const students = course.student_count || course.students_count || 0;
              const price = Number(course.price || 0);
              const href = course.slug ? `/course/${course.slug}` : `/course/${id}`;

              return (
                <article key={id} className="group  bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-[0_18px_40px_-22px_rgba(17,24,39,0.35)]">
                  <div className="relative">
                    <Link to={href} className="block aspect-video bg-[#F1F3F5] overflow-hidden">
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromFavorites(id)}
                      aria-label="Favorilerden çıkar"
                      className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#e5484d] flex items-center justify-center "
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <Link to={href} className="text-[15px] font-bold leading-snug line-clamp-2 group-hover:text-[#1B7A43] transition-colors">
                      {course.title}
                    </Link>
                    {instructor && <p className="mt-1 text-[13px] text-[#6B7280] truncate">{instructor}</p>}
                    <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#6B7280]">
                      {rating > 0 && (
                        <>
                          <Star className="w-3.5 h-3.5 fill-[#f5a524] text-[#f5a524]" />
                          <span className="font-bold text-[#111827]">{rating.toFixed(1)}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{`${students} öğrenci`}</span>
                    </p>
                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                      <span className="text-[18px] font-extrabold tabular-nums">{price > 0 ? `₺${price.toLocaleString('tr-TR')}` : 'Ücretsiz'}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(course)}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5  bg-[#1B7A43] hover:bg-[#16613A] text-white text-[13px] font-bold transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Sepete ekle
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

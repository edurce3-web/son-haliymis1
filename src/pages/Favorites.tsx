import React, { useState, useEffect } from 'react';
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

      const response = await fetch('/api/favorites', {
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

      const response = await fetch(`/api/favorites/${courseId}`, {
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
      const response = await fetch('/api/cart', {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Favorilerim
        </h1>
      </div>

      {favorites.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz favori kursunuz yok</h3>
            <p className="text-muted-foreground mb-6">
              Beğendiğiniz kursları favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
            </p>
            <Link to="/courses">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Kursları Keşfet
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">{favorites.length} favori kurs bulundu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((course) => {
              const id = course.course_id || course.id;
              const image = course.image_path || course.image_url || '/placeholder.svg';
              const instructor = course.instructor_name ||
                `${course.instructor_first_name || ''} ${course.instructor_last_name || ''}`.trim();
              const rating = parseFloat(course.rating || 0).toFixed(1);
              const students = course.student_count || course.students_count || 0;
              const price = parseFloat(course.price || 0).toFixed(2);

              return (
                <Card key={id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={image}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-pink-500 hover:text-pink-600"
                      onClick={() => removeFromFavorites(id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-2">{instructor}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({students} öğrenci)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">₺{price}</span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(course)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Sepete Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Favorites;

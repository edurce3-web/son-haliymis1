import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingCart,
  Star,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface CartItem {
  course_id: number;
  title: string;
  slug?: string;
  instructor_name?: string;
  rating?: number;
  review_count?: number;
  level?: string;
  price: number;
  image?: string;
  subcategory_name?: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [removingId, setRemovingId] = useState<number | null>(null);
  // Sepettekilere göre öneriler ve kullanılabilir kredi
  const [recommended, setRecommended] = useState<CartItem[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCartItems();
    const handleCartUpdate = () => fetchCartItems();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login?redirect=/cart');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      } else if (response.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
        navigate('/login?redirect=/cart');
      } else {
        toast.error('Sepet yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
      toast.error('Sepet yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // NOT: backend sepet satırlarında `course_id` döner. Eskiden `item.id` okunuyordu
  // ve undefined geldiği için silme ile kurs bağlantıları çalışmıyordu.
  const removeFromCart = async (courseId: number) => {
    setRemovingId(courseId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cart/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setCartItems(prev => prev.filter(i => i.course_id !== courseId));
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Kurs sepetten çıkarıldı');
      } else {
        toast.error('Kurs sepetten çıkarılamadı');
      }
    } catch {
      toast.error('Kurs sepetten çıkarılamadı');
    } finally {
      setRemovingId(null);
    }
  };

  /** Öneri kartından sepete ekler ve listeyi tazeler. */
  const addRecommended = async (courseId: number) => {
    setAddingId(courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cart/${courseId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();

      window.dispatchEvent(new Event('cartUpdated'));
      await fetchCartItems();
      toast.success('Sepete eklendi');
    } catch {
      toast.error('Sepete eklenemedi');
    } finally {
      setAddingId(null);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  /**
   * Öneriler ve kredi bilgisi sepet değiştikçe tazelenir.
   * İkisi de başarısız olabilir — sepet yine çalışmalı, o yüzden hataları
   * yutuyoruz ve bölümleri boş bırakıyoruz.
   */
  useEffect(() => {
    if (cartItems.length === 0) {
      setRecommended([]);
      setCreditQuote(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    const auth = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE_URL}/cart/recommendations`, { headers: auth })
      .then(r => (r.ok ? r.json() : { courses: [] }))
      .then(d => setRecommended(d.courses || []))
      .catch(() => setRecommended([]));

  }, [cartItems, total]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kurslara dön
        </Link>

        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Sepetim</h1>
          {cartItems.length > 0 && (
            <span className="text-sm text-slate-500">{cartItems.length} kurs</span>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Sepetiniz boş</h3>
            <p className="text-sm text-slate-500 mb-6">Öğrenmeye başlamak için bir kurs ekleyin.</p>
            <Link to="/courses">
              <Button className="h-11 px-6 rounded-xl bg-brand-700 hover:bg-brand-800">
                Kursları keşfet
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Ürünler */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.course_id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4"
                >
                  <Link to={`/course/${item.course_id}`} className="shrink-0">
                    <img
                      src={item.image || '/placeholder.svg'}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      className="w-32 h-20 sm:w-40 sm:h-24 object-cover rounded-xl bg-slate-100"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/course/${item.course_id}`}
                        className="font-semibold text-slate-900 hover:text-brand-700 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{item.instructor_name || 'Eğitmen'}</p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        {Number(item.rating) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {Number(item.rating).toFixed(1)}
                            {item.review_count ? ` (${item.review_count})` : ''}
                          </span>
                        )}
                        {item.level && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {item.level}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-lg font-bold text-slate-900 whitespace-nowrap">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.course_id)}
                        disabled={removingId === item.course_id}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {removingId === item.course_id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                        Kaldır
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Özet */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Sipariş özeti
                </h2>

                <div className="space-y-2 text-sm">
                  {cartItems.map(item => (
                    <div key={item.course_id} className="flex justify-between gap-3 text-slate-600">
                      <span className="truncate">{item.title}</span>
                      <span className="shrink-0">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-baseline">
                  <span className="font-semibold text-slate-900">Toplam</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(total)}
                  </span>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full h-12 mt-5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold"
                >
                  Satın al
                </Button>

                <p className="text-xs text-slate-400 mt-3 text-center">
                  Kupon kodunu ödeme sayfasında girebilirsiniz.
                </p>

                <div className="flex items-start gap-2 mt-5 pt-5 border-t border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Güvenli ödeme · Satın aldığın kurslara ömür boyu erişim
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*
          Öneriler. Sepettekilerle aynı alt kategoriden gelenler önce sıralanır;
          zaten sahip olunan ve sepetteki kurslar sunucuda elenir.
        */}
        {recommended.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-bold text-slate-900">Bunlar da ilgini çekebilir</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Sepetindeki kurslarla aynı alanda öne çıkanlar
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommended.map(rec => (
                <div
                  key={rec.course_id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-brand-300 hover:shadow-md transition-all"
                >
                  <Link to={`/course/${rec.slug || rec.course_id}`} className="block aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={rec.image || '/placeholder.svg'}
                      alt={rec.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    {rec.subcategory_name && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 mb-1.5">
                        {rec.subcategory_name}
                      </span>
                    )}
                    <Link
                      to={`/course/${rec.slug || rec.course_id}`}
                      className="font-semibold text-slate-900 hover:text-brand-700 transition-colors line-clamp-2 leading-snug"
                    >
                      {rec.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 truncate">{rec.instructor_name}</p>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-900">{formatPrice(rec.price)}</span>
                      <button
                        onClick={() => addRecommended(rec.course_id)}
                        disabled={addingId === rec.course_id}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {addingId === rec.course_id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ShoppingCart className="w-3.5 h-3.5" />}
                        Sepete ekle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Cart;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Star,
  Users,
  Clock,
  ArrowLeft,
  Trash2,
  CreditCard,
  Gift
} from 'lucide-react';

interface CartItem {
  id: number;
  title: string;
  instructor_name: string;
  rating: number;
  students_count: number;
  price: number;
  image_url: string;
}

const Cart = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchCartItems();

    const handleCartUpdate = () => {
      fetchCartItems();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Lütfen giriş yapın');
        return;
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      } else if (response.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
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

  const removeFromCart = async (courseId: number) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Lütfen giriş yapın');
        return;
      }

      const response = await fetch(`/api/cart/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setCartItems(cartItems.filter(item => item.id !== courseId));
        toast.success("Kurs sepetten kaldırıldı");
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Sepetten kaldırırken hata oluştu');
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error('Sepetten kaldırırken hata oluştu');
    }
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  const originalTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * 1.5), 0); // Assuming 33% discount
  const totalSavings = originalTotal - total;

  const navigate = useNavigate();

  const handleCheckout = () => {
    toast.success("Satın alma işlemi başlatıldı!", {
      description: "Ödeme sayfasına yönlendiriliyorsunuz...",
    });
    navigate('/checkout');
  };

  const addToFavorites = (course: CartItem) => {
    toast.success("Kurs favorilere eklendi");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kurslara Dön
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Sepetim
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sepetiniz boş</h3>
              <p className="text-muted-foreground mb-6">
                Öğrenmeye başlamak için kurs eklemeye ne dersiniz?
              </p>
              <Link to="/courses">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Kursları Keşfet
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden border-0 shadow-course">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-32 md:h-auto">
                        <img
                          src={item.image_url || '/placeholder.svg'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link
                              to={`/course/${item.id}`}
                              className="text-lg font-semibold hover:text-primary transition-colors"
                            >
                              {item.title}
                            </Link>
                            <p className="text-muted-foreground mt-1">{item.instructor_name}</p>

                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{item.rating}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ({item.students_count} öğrenci)
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 mt-4">
                              <span className="text-2xl font-bold text-primary">₺{item.price}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Ara toplam:</span>
                      <span>₺{originalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>İndirim:</span>
                      <span>-₺{totalSavings.toFixed(2)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Toplam:</span>
                      <span className="text-primary">₺{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={handleCheckout}
                      size="lg"
                      className="w-full bg-gradient-primary hover:shadow-course-hover"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Satın Al
                    </Button>

                    <Button variant="outline" size="lg" className="w-full">
                      <Gift className="w-4 h-4 mr-2" />
                      Hediye Olarak Ver
                    </Button>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold mb-2">Ödeme Güvencesi</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 30 gün para iade garantisi</li>
                      <li>• Güvenli ödeme</li>
                      <li>• Yaşam boyu erişim</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
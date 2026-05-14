import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  CreditCard,
  Wallet,
  Gift,
  Tag,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  AlertCircle,
  Lock,
  Shield,
  Star,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  cart_item_id: number;
  course_id: number;
  title: string;
  instructor_name: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  image_url: string;
  rating: number;
  student_count: number;
  duration: string;
  level: string;
  is_bestseller?: boolean;
}

interface Coupon {
  coupon_id: number;
  code: string;
  course_id: number;
  price_level: number;
  discount_price: number;
  expires_at: string;
  usage_limit?: number;
  used_count: number;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank' | 'wallet';
  name: string;
  details: string;
  is_default: boolean;
  icon: React.ReactNode;
}

interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export const PaymentSystem: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout' | 'payment' | 'success'>('cart');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'TR'
  });
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart items
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/cart', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch available coupons
  const { data: availableCoupons } = useQuery({
    queryKey: ['available-coupons'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/coupons/available', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/payment-methods', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Ürün sepetten kaldırıldı');
    }
  });

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`${API_BASE_URL}/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code, cart_total: calculateSubtotal() })
      });
      if (!response.ok) throw new Error('Kupon geçersiz');
      return response.json();
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      setCouponCode('');
      toast.success('Kupon başarıyla uygulandı!');
    },
    onError: () => {
      toast.error('Kupon geçersiz veya süresi dolmuş');
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(`${API_BASE_URL}/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });
      if (!response.ok) throw new Error('Ödeme işlemi başarısız');
      return response.json();
    },
    onSuccess: (result) => {
      setCurrentStep('success');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Ödeme başarıyla tamamlandı!');
    },
    onError: () => {
      toast.error('Ödeme işlemi başarısız oldu');
      setIsProcessing(false);
    }
  });

  const cartItems: CartItem[] = cartData?.items || [];

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    // Find the cart item this coupon applies to
    const courseInCart = cartItems.find(item => item.course_id === appliedCoupon.course_id);
    if (!courseInCart) return 0; // If the course is not in cart, no discount
    
    return Math.max(0, courseInCart.price - appliedCoupon.discount_price);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  // Payment method options
  const paymentMethodOptions: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Kredi/Banka Kartı',
      details: 'Visa, Mastercard, American Express',
      is_default: true,
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'paypal',
      type: 'paypal',
      name: 'PayPal',
      details: 'Güvenli PayPal ödemesi',
      is_default: false,
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'bank',
      type: 'bank',
      name: 'Banka Havalesi',
      details: 'Direkt banka transferi',
      is_default: false,
      icon: <DollarSign className="w-5 h-5" />
    }
  ];

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    const paymentData = {
      items: cartItems.map(item => ({
        course_id: item.course_id,
        price: item.price
      })),
      payment_method: selectedPaymentMethod,
      billing_address: billingAddress,
      card_details: selectedPaymentMethod === 'card' ? cardDetails : null,
      coupon_code: appliedCoupon?.code,
      total_amount: calculateTotal(),
      save_payment_method: savePaymentMethod
    };

    processPaymentMutation.mutate(paymentData);
  };

  // Cart Step Component
  const CartStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sepetim ({cartItems.length} ürün)</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Toplam: ₺{calculateSubtotal().toLocaleString()}
        </Badge>
      </div>

      {cartItems.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sepetiniz boş</h3>
          <p className="text-gray-600 mb-4">Öğrenmeye başlamak için kurs ekleyin</p>
          <Button>Kurslara Göz At</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <Card key={item.cart_item_id} className="p-4">
              <div className="flex items-start space-x-4">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Eğitmen: {item.instructor_name}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{item.student_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.duration}</span>
                        </div>
                        <Badge variant="secondary">{item.level}</Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ₺{item.original_price}
                          </span>
                        )}
                        <span className="text-xl font-bold text-green-600">
                          ₺{item.price}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCartMutation.mutate(item.cart_item_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Coupon Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Kupon Kodu</h3>
            <div className="flex space-x-2 mb-3">
              <Input
                placeholder="Kupon kodunu girin"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button
                onClick={() => applyCouponMutation.mutate(couponCode)}
                disabled={!couponCode.trim() || applyCouponMutation.isPending}
              >
                {applyCouponMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Uygula'
                )}
              </Button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {appliedCoupon.code} uygulandı
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAppliedCoupon(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Available Coupons */}
            {availableCoupons && availableCoupons.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Kullanılabilir Kuponlar:</h4>
                <div className="space-y-2">
                  {availableCoupons.slice(0, 3).map((coupon: Coupon) => (
                    <div
                      key={coupon.coupon_id}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => applyCouponMutation.mutate(coupon.code)}
                    >
                      <div>
                        <span className="font-medium text-blue-600">{coupon.code}</span>
                        <p className="text-xs text-gray-600">{coupon.description}</p>
                      </div>
                      <Badge variant="outline">
                        {`Yeni Fiyat: ₺${coupon.discount_price}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Order Summary */}
          <Card className="p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Sipariş Özeti</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>₺{calculateSubtotal().toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim ({appliedCoupon.code}):</span>
                  <span>-₺{calculateDiscount().toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam:</span>
                <span>₺{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => setCurrentStep('checkout')}
              disabled={cartItems.length === 0}
            >
              Ödemeye Geç
            </Button>
          </Card>
        </div>
      )}
    </div>
  );

  // Checkout Step Component
  const CheckoutStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Ad"
                value={billingAddress.first_name}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, first_name: e.target.value }))}
              />
              <Input
                placeholder="Soyad"
                value={billingAddress.last_name}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
            <Input
              placeholder="E-posta"
              type="email"
              value={billingAddress.email}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Telefon"
              value={billingAddress.phone}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="Adres"
              value={billingAddress.address}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Şehir"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
              />
              <Input
                placeholder="Posta Kodu"
                value={billingAddress.postal_code}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Yöntemi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethodOptions.map((method) => (
              <div
                key={method.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === method.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPaymentMethod(method.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPaymentMethod === method.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  {method.icon}
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.details}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Card Details */}
            {selectedPaymentMethod === 'card' && (
              <div className="mt-4 p-4 border rounded-lg space-y-4">
                <Input
                  placeholder="Kart Numarası"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                />
                <Input
                  placeholder="Kart Üzerindeki İsim"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                  <Input
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={savePaymentMethod}
                    onCheckedChange={(checked) => setSavePaymentMethod(checked === true)}
                  />
                  <span className="text-sm">Bu ödeme yöntemini kaydet</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Sipariş Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between">
                <span className="text-sm truncate mr-2">{item.title}</span>
                <span className="text-sm font-medium">₺{item.price}</span>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>₺{calculateSubtotal().toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim:</span>
                  <span>-₺{calculateDiscount().toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam:</span>
                <span>₺{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleProcessPayment}
              disabled={!selectedPaymentMethod || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Güvenli Ödeme Yap
                </>
              )}
            </Button>

            <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
              <Shield className="w-4 h-4" />
              <span>SSL ile korumalı ödeme</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Success Step Component
  const SuccessStep = () => (
    <div className="text-center py-12">
      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">Ödeme Başarılı!</h2>
      <p className="text-gray-600 mb-6">
        Kurslarınıza erişim sağlandı. Öğrenmeye başlayabilirsiniz!
      </p>
      
      <div className="space-y-4 max-w-md mx-auto">
        <Button className="w-full" size="lg">
          Kurslarıma Git
        </Button>
        <Button variant="outline" className="w-full">
          Fatura İndir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'cart', label: 'Sepet', icon: ShoppingCart },
              { key: 'checkout', label: 'Ödeme Bilgileri', icon: CreditCard },
              { key: 'success', label: 'Tamamlandı', icon: CheckCircle2 }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === step.key 
                    ? 'bg-blue-600 text-white' 
                    : index < ['cart', 'checkout', 'success'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="ml-2 text-sm font-medium">{step.label}</span>
                {index < 2 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    index < ['cart', 'checkout', 'success'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 'cart' && <CartStep />}
          {currentStep === 'checkout' && <CheckoutStep />}
          {currentStep === 'success' && <SuccessStep />}
        </div>
      </div>
    </div>
  );
};

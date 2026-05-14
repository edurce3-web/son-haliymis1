import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cartAPI, coursesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ShoppingBag,
  Tag,
  X,
  ArrowLeft,
  Sparkles,
  Clock,
  Gift,
  CreditCard,
  Globe
} from 'lucide-react';
import axios from 'axios';
import { countries } from '@/data/countries';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const API_BASE_URL = '${API_BASE_URL}';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const couponFromUrl = searchParams.get('coupon');
  const isDirectBuy = !!courseId;

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'fail' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [country, setCountry] = useState('Türkiye');
  const [isProcessing, setIsProcessing] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState(couponFromUrl || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; price_level: number; discount_price: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch Cart Data
  const { data: cartData, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart,
    enabled: !isDirectBuy,
  });

  // Fetch Course Data
  const { data: courseResp, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesAPI.getCourse(parseInt(courseId!)),
    enabled: isDirectBuy,
  });

  const courseData = courseResp?.course;
  const isLoading = isDirectBuy ? isLoadingCourse : isLoadingCart;

  const items = useMemo(() => {
    if (isDirectBuy && courseData) {
      return [{
        title: courseData.title,
        price: typeof courseData.price === 'number' ? courseData.price : parseFloat(courseData.price),
        image_url: courseData.image,
        instructor_name: courseData.instructor || 'Neural Akademi Eğitmeni'
      }];
    }
    return cartData?.items || [];
  }, [isDirectBuy, courseData, cartData]);

  const originalTotalPrice = useMemo(() => {
    if (isDirectBuy && courseData) {
      return typeof courseData.price === 'number' ? courseData.price : parseFloat(courseData.price);
    }
    return cartData?.total || 0;
  }, [isDirectBuy, courseData, cartData]);

  // Calculate discounted price
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.max(0, originalTotalPrice - appliedCoupon.discount_price);
  }, [appliedCoupon, originalTotalPrice]);

  const totalPrice = useMemo(() => {
    return Math.max(0, originalTotalPrice - discountAmount);
  }, [originalTotalPrice, discountAmount]);

  // Auto-apply coupon from URL
  useEffect(() => {
    if (couponFromUrl && !appliedCoupon) {
      handleApplyCoupon(couponFromUrl);
    }
  }, [couponFromUrl]);

  const handleApplyCoupon = async (code: string) => {
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate/${code}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponCode(data.coupon.code);
        toast.success(`Kupon uygulandı: Yeni fiyat ₺${data.coupon.discount_price}`);
      } else {
        toast.error(data.error || 'Geçersiz kupon kodu');
      }
    } catch {
      toast.error('Kupon doğrulanamadı');
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') setPaymentStatus('success');
    else if (status === 'fail') setPaymentStatus('fail');
  }, [searchParams]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login?redirect=/checkout' + (courseId ? `?courseId=${courseId}` : ''));
        return;
      }

      const payload: any = {
        address: { country, city: 'Online', address: 'Digital Enrollment' },
        courseId
      };

      // Send coupon info to backend if applied
      if (appliedCoupon) {
        payload.couponCode = appliedCoupon.code;
      }

      const response = await axios.post(`${API_BASE_URL}/payment/get-token`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success' && response.data.iframe_url) {
        setIframeUrl(response.data.iframe_url);
        setIsProcessing(false);
      } else {
        setErrorMsg(response.data.message || 'Ödeme sistemi başlatılamadı.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Payment init error:', error);
      setErrorMsg(error.response?.data?.message || 'Bağlantı hatası. Lütfen tekrar deneyin.');
      setIsProcessing(false);
    }
  };

  // Verify Payment on Return
  useEffect(() => {
    const checkStatus = async () => {
      const status = searchParams.get('status');
      const oid = searchParams.get('oid');

      if (status === 'success' && oid) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await axios.post(`${API_BASE_URL}/payment/verify-success`, { oid }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          setPaymentStatus('success');
        } catch (err) {
          console.error('Verification failed but payment was likely successful on gateway', err);
          setPaymentStatus('success');
        }
      } else if (status === 'fail') {
        setPaymentStatus('fail');
        setErrorMsg('Ödeme işlemi tamamlanamadı veya iptal edildi.');
      }
    };

    checkStatus();
  }, [searchParams]);

  // ==================== RENDER ====================

  // Success State
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md w-full py-16 animate-in fade-in zoom-in duration-500">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="absolute -top-2 -right-8 w-12 h-12">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Ödeme Başarılı!</h1>
          <p className="text-slate-500 mb-10 text-base leading-relaxed">
            İşleminiz onaylandı ve kurslarınız hesabınıza tanımlandı.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/learning')}
              size="lg"
              className="w-full bg-slate-900 hover:bg-slate-800 h-13 text-base font-bold rounded-xl shadow-lg"
            >
              Kurslarıma Git
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              size="lg"
              className="w-full text-slate-500 h-12 font-medium rounded-xl"
            >
              Ana Sayfa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fail State
  if (paymentStatus === 'fail') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md w-full py-16 animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-red-50/50">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Ödeme Başarısız</h1>
          <p className="text-slate-500 mb-10 text-base">{errorMsg || 'İşlem sırasında bir hata oluştu.'}</p>
          <Button
            onClick={() => { setPaymentStatus(null); navigate('/checkout'); }}
            size="lg"
            className="w-full bg-slate-900 text-white h-13 text-base font-bold rounded-xl"
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base font-medium text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  // Main Checkout UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <nav className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 sticky top-0 z-50 flex items-center">
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to="/" className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">NA</span>
              </div>
              Neural Akademi
            </Link>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:block">Güvenli Ödeme</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-4 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

          {/* ============ SOL PANEL ============ */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Ödeme</h1>
              <p className="text-sm text-slate-400">Güvenli ödemenizi tamamlayın</p>
            </div>

            {/* Ülke Seçimi */}
            <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-700">Fatura Adresi</h2>
              </div>
              <div className="max-w-xs">
                <Label className="text-xs font-bold text-slate-400 mb-1.5 block">Ülke</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kupon */}
            <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-700">İndirim Kuponu</h2>
              </div>
              {appliedCoupon ? (
                <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-emerald-700">
                        <span className="font-mono">{appliedCoupon.code}</span> uygulandı
                      </p>
                      <p className="text-xs text-emerald-500">
                        {discountAmount}₺ indirim
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Kupon kodunuzu girin"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-mono font-bold tracking-wider text-sm flex-1"
                  />
                  <Button
                    className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    disabled={!couponCode || couponLoading}
                    onClick={() => handleApplyCoupon(couponCode)}
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uygula'}
                  </Button>
                </div>
              )}
            </div>

            {/* Ödeme Bölümü */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-700">Ödeme Yöntemi</h2>
                </div>
              </div>

              {iframeUrl ? (
                <div className="animate-in fade-in duration-500">
                  <iframe
                    src={iframeUrl}
                    style={{ width: '100%', border: 'none', height: '750px' }}
                    scrolling="yes"
                    title="Secure Payment"
                  />
                  <div className="p-4 border-t border-slate-50">
                    <Button
                      variant="ghost"
                      onClick={() => setIframeUrl(null)}
                      className="text-xs font-medium text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1.5" /> Geri Dön
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-700 mb-1">Güvenli Ödeme</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Ödemeyi tamamla butonuna tıkladığınızda PayTR'ın SSL korumalı ödeme ekranına yönlendirileceksiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============ SAĞ PANEL ============ */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm sticky top-24 overflow-hidden">
              {/* Sipariş Başlığı */}
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Sipariş Özeti
                </h2>
              </div>

              {/* Ürünler */}
              <div className="p-6 space-y-4 max-h-[300px] overflow-auto">
                {items.length > 0 ? items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start group">
                    <div className="w-16 h-11 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image_url || '/course-default.jpg'}
                        className="w-full h-full object-cover"
                        alt={item.title}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-700 line-clamp-2 leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.instructor_name}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{formatPrice(item.price)}</span>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-300 text-sm">Sepetiniz boş</div>
                )}
              </div>

              {/* Fiyat Özeti */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Ara Toplam</span>
                  <span className="font-medium text-slate-500">{formatPrice(originalTotalPrice)}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Kupon ({appliedCoupon.code})
                    </span>
                    <span className="font-bold text-emerald-500">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-800">Toplam</span>
                    <div className="text-right">
                      {appliedCoupon && discountAmount > 0 && (
                        <span className="text-xs text-slate-400 line-through block">{formatPrice(originalTotalPrice)}</span>
                      )}
                      <span className="text-2xl font-bold text-slate-900">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aksiyon Alanı */}
              <div className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 rounded-xl text-red-600 text-xs font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  className="w-full h-13 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200/50 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
                  onClick={handlePayment}
                  disabled={isLoading || isProcessing || items.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      Ödemeyi Tamamla
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                  Satın alarak{' '}
                  <Link to="/terms" className="underline text-indigo-500">Kullanım Şartları</Link> ve{' '}
                  <Link to="/privacy" className="underline text-indigo-500">Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                </p>

                {/* Güvenlik Bilgisi */}
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Lock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">256-bit SSL</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold">PCI-DSS</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">30 Gün İade</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

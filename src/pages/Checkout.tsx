import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cartAPI, coursesAPI, API_BASE_URL } from '@/lib/api';
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
        image: courseData.image,
        image_url: courseData.image,
        instructor_name: courseData.instructor || 'Eğitmen'
      }];
    }
    return cartData?.items || [];
  }, [isDirectBuy, courseData, cartData]);

  const originalTotalPrice = useMemo(() => {
    if (isDirectBuy && courseData) {
      return typeof courseData.price === 'number' ? courseData.price : parseFloat(courseData.price);
    }
    // Backend `totalPrice` döner; eskiden yalnızca `total` okunduğu için sepet
    // toplamı hep 0 kalıyor ve ödeme 0₺ ile başlatılmaya çalışılıyordu.
    return cartData?.totalPrice ?? cartData?.total ?? 0;
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
    <div className="min-h-screen bg-slate-50">

      {/* Üst bar */}
      <nav className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Güvenli ödeme</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Ödeme</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ============ SOL: SİPARİŞ + FATURA + ÖDEME ============ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Sipariş içeriği */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Siparişin
                </h2>
                <span className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'kurs' : 'kurs'}
                </span>
              </header>

              <div className="divide-y divide-slate-100">
                {items.length > 0 ? items.map((item: any, idx: number) => (
                  <div key={item.course_id ?? idx} className="flex gap-4 p-4">
                    <img
                      src={item.image || item.image_url || '/placeholder.svg'}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      className="w-28 h-[70px] rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 truncate">{item.instructor_name || 'Eğitmen'}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                )) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-400 mb-4">Sepetiniz boş</p>
                    <Link to="/courses">
                      <Button variant="outline" className="h-10 rounded-xl">Kursları keşfet</Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Fatura ülkesi */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-slate-400" />
                Fatura bilgisi
              </h2>
              <div className="max-w-xs">
                <Label className="text-xs text-slate-500 mb-1.5 block">Ülke</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Ödeme ekranı — iframe açıldığında burada gösterilir */}
            {iframeUrl && (
              <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    Kart bilgileri
                  </h2>
                  <button
                    onClick={() => setIframeUrl(null)}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Vazgeç
                  </button>
                </header>
                <iframe
                  src={iframeUrl}
                  style={{ width: '100%', border: 'none', height: '750px' }}
                  scrolling="yes"
                  title="Güvenli ödeme"
                />
              </section>
            )}
          </div>

          {/* ============ SAĞ: TOPLAM + ÖDEME + KUPON ============ */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 p-6">

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ara toplam</span>
                  <span className="text-slate-700">{formatPrice(originalTotalPrice)}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {appliedCoupon.code}
                    </span>
                    <span className="font-semibold text-emerald-600">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-baseline">
                <span className="font-semibold text-slate-900">Toplam</span>
                <div className="text-right">
                  {appliedCoupon && discountAmount > 0 && (
                    <span className="block text-xs text-slate-400 line-through">
                      {formatPrice(originalTotalPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl text-red-600 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                className="w-full h-12 mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-400"
                onClick={handlePayment}
                disabled={isLoading || isProcessing || items.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Hazırlanıyor...
                  </>
                ) : (
                  <>
                    Ödemeyi tamamla
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>

              {/* KUPON — satın alma butonunun altında */}
              <div className="mt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 bg-emerald-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-700 truncate">
                        <span className="font-mono font-semibold">{appliedCoupon.code}</span> uygulandı
                      </span>
                    </div>
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                      className="shrink-0 w-6 h-6 rounded-md hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
                      title="Kuponu kaldır"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter' && couponCode) handleApplyCoupon(couponCode); }}
                      className="h-10 rounded-xl border-slate-200 font-mono text-sm tracking-wider flex-1"
                    />
                    <Button
                      variant="outline"
                      className="h-10 px-4 rounded-xl border-slate-200 text-sm font-medium"
                      disabled={!couponCode || couponLoading}
                      onClick={() => handleApplyCoupon(couponCode)}
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uygula'}
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-slate-400 leading-relaxed mt-4">
                Satın alarak{' '}
                <Link to="/terms" className="underline hover:text-slate-600">Kullanım Şartları</Link> ve{' '}
                <Link to="/privacy" className="underline hover:text-slate-600">Gizlilik Politikası</Link>'nı
                kabul etmiş olursunuz.
              </p>

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100 text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> SSL korumalı
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> Ömür boyu erişim
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

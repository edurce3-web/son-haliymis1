import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import HLSVideoPlayer from '@/components/video/HLSVideoPlayer';
import { coursesAPI, cartAPI, enrollmentAPI, reviewsAPI, qaAPI, getCourseImageUrl, API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import CatalogCourseCard from '@/components/catalog/CatalogCourseCard';

/** Kanonik adreslerin tabanı. */
const SITE_URL = 'https://edurce.com';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn, formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Star,
  Clock,
  Users,
  Globe,
  Award,
  ShoppingCart,
  Play,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  ChevronRight,
  UserCircle,
  Check,
  PlayCircle,
  MonitorPlay,
  Download,
  Infinity as InfIcon,
  Smartphone,
  Trophy,
  Shield,
  Volume2,
  X as XIcon,
  Tag,
  ChevronDown,
  Zap,
  Sparkles,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; price_level: number; discount_price: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  // Kupon alani varsayilan olarak kapali; cubugu kalabaliklastirmasin
  const [showCoupon, setShowCoupon] = useState(false);
  // Uzun kurs aciklamasi kirpiliyor
  const [descExpanded, setDescExpanded] = useState(false);
  // Tum degerlendirmeler penceresi
  const [reviewsOpen, setReviewsOpen] = useState(false);
  // Uzun egitmen biyografisi kirpiliyor
  const [bioExpanded, setBioExpanded] = useState(false);
  /**
   * Müfredatta açık duran bölümler.
   *
   * İlk bölüm açık başlıyor: kullanıcı müfredatın neye benzediğini
   * tıklamadan görebilmeli. Kapalı bölümlerin dersleri DOM'da kalıyor,
   * yalnızca gizleniyor — arama motorları müfredatın tamamını görsün.
   */
  const [openSections, setOpenSections] = useState<number[]>([0]);
  const toggleSection = (idx: number) =>
    setOpenSections(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );

  /**
   * Mobil alt çubuğun görünürlüğü.
   *
   * Künyenin altındaki satın alma bloğu ekrandan çıktığında çubuk beliriyor.
   * Kaydırma dinlemek yerine gözlemci kullanılıyor.
   */
  const mobilePurchaseRef = useRef<HTMLDivElement>(null);
  const [showMobileBar, setShowMobileBar] = useState(false);


  /**
   * Sayfadaki bölümler ve okunan bölüm.
   *
   * Sekme yerine tek sayfa kullanıldığı için soldaki dizin, kaydırma sırasında
   * hangi bölümde olunduğunu işaretliyor.
   */
  const PAGE_SECTIONS = [
    { id: 'genel-bakis', label: 'Genel bakış' },
    { id: 'mufredat', label: 'Müfredat' },
    { id: 'egitmen', label: 'Eğitmen' },
    { id: 'degerlendirmeler', label: 'Değerlendirmeler' },
  ];
  const [activeSection, setActiveSection] = useState('genel-bakis');


  // Route is /course/:slug — param named 'slug' covers both numeric IDs and text slugs
  const courseIdentifier = slug || id || '';
  // If it's purely numeric, treat as course_id (not a slug)
  const isNumericId = /^\d+$/.test(courseIdentifier);

  // Fetch course details
  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', courseIdentifier],
    queryFn: async () => {
      if (isNumericId) {
        // Direct numeric ID lookup
        return coursesAPI.getCourse(Number(courseIdentifier));
      }
      // Two-step: resolve slug → course_id, then fetch full data
      const slugRes = await fetch(`${API_BASE_URL}/courses/slug/${encodeURIComponent(courseIdentifier)}`);
      if (!slugRes.ok) throw new Error('Kurs bulunamadı');
      const data = await slugRes.json();
      // Slug endpoint returns { course_id }, then fetch full course data
      if (data?.course_id) return coursesAPI.getCourse(data.course_id);
      // If full course response was returned directly
      if (data?.course) return data;
      throw new Error('Kurs verisi alınamadı');
    },
    enabled: !!courseIdentifier,
  });

  const courseId = courseData?.course?.id || courseData?.course?.course_id || Number(courseIdentifier) || 0;

  useEffect(() => {
    if (!courseData) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    );

    PAGE_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [courseData]);

  useEffect(() => {
    const el = mobilePurchaseRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [courseData]);

  /**
   * Kategori adresleri.
   *
   * Slug'lar kurs yanıtından değil, yerel kategori ağacından türetiliyor.
   * Ağaç zaten tek gerçek kaynak; sunucuya ek sütun eklemek hem gereksiz hem
   * de eski şemalarda sorguyu kırma riski taşıyordu.
   *
   * Hook oldukları için erken return'lerden ÖNCE duruyorlar.
   */
  const { data: navData } = useCategoryNav();

  // Ilgili kurs kartlarinin dogru butonu gostermesi icin
  const { ownedIds, cartIds, progressById } = useOwnedCourses();

  const categorySlug = useMemo(() => {
    const source = courseData?.course;
    const cats = navData?.categories || [];
    if (!source) return null;
    const byId = cats.find(c => c.id != null && Number(c.id) === Number(source.category_id));
    return byId?.slug || cats.find(c => c.name === source.category_name)?.slug || null;
  }, [navData, courseData]);

  const subcategorySlug = useMemo(() => {
    const source = courseData?.course;
    const cats = navData?.categories || [];
    if (!source) return null;
    for (const cat of cats) {
      const sub = cat.subcategories.find(
        s => (s.id != null && Number(s.id) === Number(source.subcategory_id))
          || s.name === source.subcategory_name
      );
      if (sub) return sub.slug;
    }
    return null;
  }, [navData, courseData]);


  /**
   * Önizlemede oynatılan ders.
   *
   * Kurs tanıtım videosu (preview_video) dışında, eğitmenin "ücretsiz
   * önizleme" işaretlediği dersler de burada oynatılır. Video adresi ayrı bir
   * uçtan çekiliyor çünkü detay yanıtında ders videoları yer almıyor —
   * yer alsaydı ücretli içerik herkese açık olurdu.
   */
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);

  const openLessonPreview = async (lesson: any) => {
    const lessonId = lesson.id ?? lesson.lesson_id;
    if (!lessonId || !courseId) return;

    setPreviewLoading(lessonId);
    try {
      // Kimlik isteğe bağlı: eğitmen kendi taslak kursunu da önizleyebilsin
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/preview-lesson/${lessonId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Önizleme açılamadı');

      setPreviewLesson(data.lesson);
      setIsVideoPlaying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast.error(error.message || 'Önizleme açılamadı');
    } finally {
      setPreviewLoading(null);
    }
  };

  // Eğitmenin diğer kursları ve benzer kurslar — tek istekte
  const { data: suggestions } = useQuery({
    queryKey: ['course-suggestions', courseId, categorySlug],
    queryFn: async () => {
      // Önce özel uç. Sunucuda henüz yoksa katalog ucundan aynı bilgiyi
      // toplayarak devam ediyoruz — şeritlerin boş kalmasındansa bir istek
      // fazladan atmak yeğ.
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/suggestions?limit=8`);
      if (res.ok) return res.json();
      if (res.status !== 404) throw new Error('Öneriler alınamadı');

      if (!categorySlug) return { instructorCourses: [], relatedCourses: [] };

      const fallback = await fetch(
        `${API_BASE_URL}/catalog?category=${encodeURIComponent(categorySlug)}&limit=12`
      );
      if (!fallback.ok) return { instructorCourses: [], relatedCourses: [] };

      const data = await fallback.json();
      const list = (data.courses || []).filter(
        (c: any) => Number(c.course_id ?? c.id) !== Number(courseId)
      );

      const instructorName = courseData?.course?.instructor_name;
      return {
        instructorCourses: instructorName
          ? list.filter((c: any) => c.instructor_name === instructorName).slice(0, 8)
          : [],
        relatedCourses: list.slice(0, 8),
      };
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    // Uc henuz yayinda degilse sayfayi mesgul etmesin
    retry: false,
  });

  // Fetch course reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: () => reviewsAPI.getReviews(courseId),
    enabled: !!courseId,
  });

  // Fetch course questions
  const { data: questionsData } = useQuery({
    queryKey: ['course-questions', courseId],
    queryFn: () => qaAPI.getQuestions(courseId),
    enabled: !!courseId,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: cartAPI.addToCart,
    onSuccess: () => {
      toast.success('Kurs sepete eklendi!');
      window.dispatchEvent(new Event('cartUpdated'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Sepete eklenirken bir hata oluştu!');
    },
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: enrollmentAPI.enrollInCourse,
    onSuccess: () => {
      toast.success('Kursa başarıyla kaydoldunuz!');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      navigate('/learning');
    },
    onError: (error: any) => {
      const msg = error?.message || error?.error || '';
      if (msg.toLowerCase().includes('already enrolled') || msg.toLowerCase().includes('zaten kayıtlı')) {
        toast.info('Bu kursa zaten kayıtlısınız!');
        navigate('/learning');
      } else {
        toast.error('Kayıt olurken bir hata oluştu!');
      }
    },
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      reviewsAPI.addReview(courseId, data),
    onSuccess: () => {
      toast.success('Değerlendirmeniz eklendi!');
      setReviewComment('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
    },
    onError: () => {
      toast.error('Değerlendirme eklenirken bir hata oluştu!');
    },
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      qaAPI.addQuestion(courseId, data),
    onSuccess: () => {
      toast.success('Sorunuz eklendi!');
      setQuestionTitle('');
      setQuestionContent('');
      queryClient.invalidateQueries({ queryKey: ['course-questions', courseId] });
    },
    onError: () => {
      toast.error('Soru eklenirken bir hata oluştu!');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Sepete eklemek için giriş yapmalısınız!');
      return;
    }
    addToCartMutation.mutate(courseId);
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Kursa kaydolmak için giriş yapmalısınız!');
      return;
    }
    // Ensure price is treated as number
    const coursePrice = parseFloat(courseData?.course?.price || '0');

    // Calculate final price after coupon
    let finalPrice = coursePrice;
    if (appliedCoupon) {
      finalPrice = appliedCoupon.discount_price;
    }

    if (finalPrice > 0) {
      // Direct Buy Flow - Navigate to checkout with coupon info
      const params = new URLSearchParams({ courseId: courseId.toString() });
      if (appliedCoupon) params.set('coupon', appliedCoupon.code);
      navigate(`/checkout?${params.toString()}`);
    } else {
      // Free course or fully discounted
      enrollMutation.mutate(courseId);
    }
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      toast.error('Değerlendirme yapmak için giriş yapmalısınız!');
      return;
    }
    addReviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
  };


  /** Kupon doğrulama — sağdaki satın alma kartından çağrılıyor. */
  const applyCoupon = async () => {
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate/${couponCode}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        toast.success(`Kupon uygulandı: ${formatPrice(data.coupon.discount_price)}`);
      } else {
        toast.error(data.error || 'Geçersiz kupon');
      }
    } catch {
      toast.error('Kupon doğrulanamadı');
    } finally {
      setCouponLoading(false);
    }
  };
  const handleSubmitQuestion = () => {
    if (!isAuthenticated) {
      toast.error('Soru sormak için giriş yapmalısınız!');
      return;
    }
    if (!questionTitle.trim() || !questionContent.trim()) {
      toast.error('Başlık ve içerik alanları zorunludur!');
      return;
    }
    addQuestionMutation.mutate({ title: questionTitle, content: questionContent });
  };

  // SEO — kurs sayfaları organik trafiğin asıl geldiği yer. Course yapısal
  // verisi Google'da puan, fiyat ve eğitmen bilgisiyle zengin sonuç üretir.
  // Hook olduğu için erken return'lerden ÖNCE çağrılmak zorunda.
  const seoCourse = courseData?.course;
  useSeo(
    seoCourse
      ? (() => {
        const url = `${SITE_URL}/course/${seoCourse.slug || seoCourse.course_id || seoCourse.id}`;
        const desc = String(seoCourse.short_description || seoCourse.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const description = desc.length > 158
          ? `${desc.slice(0, 158).replace(/\s+\S*$/, '')}…`
          : desc || `${seoCourse.title} kursu — Edurce'de online eğitim.`;
        const rating = Number(seoCourse.rating) || 0;
        const reviewCount = Number(seoCourse.review_count) || 0;
        const image = getCourseImageUrl(seoCourse);

        return {
          title: `${seoCourse.title} · ${seoCourse.instructor_name || 'Edurce'} | Edurce`,
          description,
          canonical: url,
          image,
          type: 'article',
          robots: 'index, follow',
          jsonLd: [{
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: seoCourse.title,
            description,
            url,
            image,
            inLanguage: seoCourse.language || 'tr',
            provider: {
              '@type': 'Organization',
              name: 'Edurce',
              sameAs: SITE_URL,
            },
            ...(seoCourse.instructor_name && {
              instructor: { '@type': 'Person', name: seoCourse.instructor_name },
            }),
            // Google, aggregateRating için gerçek yorum sayısı ister;
            // yorum yoksa alanı hiç göndermiyoruz (yoksa uyarı verir).
            ...(rating > 0 && reviewCount > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating.toFixed(1),
                reviewCount,
                bestRating: '5',
                worstRating: '1',
              },
            }),
            offers: {
              '@type': 'Offer',
              price: String(Number(seoCourse.price) || 0),
              priceCurrency: seoCourse.currency || 'TRY',
              availability: 'https://schema.org/InStock',
              url,
            },
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
              courseWorkload: seoCourse.duration_seconds
                ? `PT${Math.max(1, Math.round(seoCourse.duration_seconds / 3600))}H`
                : undefined,
            },
          }],
        };
      })()
      : null,
    [seoCourse?.course_id, seoCourse?.id, seoCourse?.title]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const course = courseData?.course;
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Kurs bulunamadı</h2>
        <Button onClick={() => window.history.back()}>Geri Dön</Button>
      </div>
    );
  }

  const instructorFullName = course.instructor_name || 'Eğitmen';
  const instructorAvatar = course.instructor_avatar || course.instructor_image || '/placeholder-avatar.jpg';
  const instructorSlug: string | null = course.instructor_slug || null;

  /**
   * Eğitmen bilgisini profiline bağlar.
   *
   * Slug yoksa (kayıt akışından önce açılmış eski hesaplar) bağlantı yerine
   * düz kapsayıcı döner — tıklanınca hiçbir yere gitmeyen bir link bırakmak
   * kullanıcıyı yanıltır.
   */
  const InstructorLink: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) =>
    instructorSlug ? (
      <Link to={`/user/${instructorSlug}`} className={cn(className, 'cursor-pointer')}>
        {children}
      </Link>
    ) : (
      <div className={className}>{children}</div>
    );
  const instructorBio = course.instructor_bio || "Alanında deneyimli eğitmen.";

  const instructorExpertiseRaw = course.expertise || course.instructor_expertise;
  let instructorExpertiseArray: string[] = [];
  if (Array.isArray(instructorExpertiseRaw)) {
    instructorExpertiseArray = instructorExpertiseRaw;
  } else if (typeof instructorExpertiseRaw === 'string') {
    try {
      const parsed = JSON.parse(instructorExpertiseRaw);
      instructorExpertiseArray = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      instructorExpertiseArray = instructorExpertiseRaw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const reviewsCount = reviewsData?.total || reviewsData?.items?.length || 0;
  const reviewsList = reviewsData?.items || [];

  // Satın alma kartındaki özet bilgiler
  const allLessons: any[] = (course.sections || []).flatMap((s: any) => s.lessons || []);
  const totalLessons = allLessons.length;

  const totalSeconds = Number(course.total_duration_seconds)
    || allLessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
  const totalDurationLabel = totalSeconds > 0
    ? (() => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.round((totalSeconds % 3600) / 60);
      return h > 0 ? `${h} sa ${m} dk` : `${m || 1} dk`;
    })()
    : 'Belirtilmedi';

  const levelLabel = ({
    beginner: 'Başlangıç',
    intermediate: 'Orta',
    advanced: 'İleri',
    all: 'Tüm seviyeler',
  } as Record<string, string>)[course.level] || 'Tüm seviyeler';


  /** Dil kodunu okunur ada çevir — tabloda "TR" yerine "Türkçe" yazsın. */
  const languageLabel = ({
    tr: 'Türkçe',
    en: 'İngilizce',
    de: 'Almanca',
    fr: 'Fransızca',
    es: 'İspanyolca',
    ar: 'Arapça',
    ru: 'Rusça',
  } as Record<string, string>)[String(course.language || 'tr').toLowerCase()]
    || String(course.language || 'Türkçe');
  /** Kursla birlikte gelen haklar — her biri kendi simgesiyle. */
  const courseBenefits: Array<{ text: string; icon: string }> = [
    ...(totalSeconds > 0
      ? [{ text: `${totalDurationLabel} video içeriği`, icon: 'duration' }]
      : []),
    { text: 'Ömür Boyu Erişim', icon: 'access' },
    { text: 'Bitirme Sertifikası', icon: 'certificate' },
    { text: 'Mobil & TV İzleme', icon: 'devices' },
    { text: 'Eğitmene Soru Sorma', icon: 'support' },
  ];

  /**
   * Satın alma kutusu.
   *
   * İki yerde basılıyor: geniş ekranda sağ rayda sabit, dar ekranda
   * künyenin hemen altında. Aynı JSX iki kez yazılmasın diye bileşen
   * hâline getirildi; bileşenin içinde durum yok, hepsi sayfadan geliyor.
   */
  const PurchaseBox = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 border-t-[3px] border-t-brand-700 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)]">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-montserrat text-[28px] font-extrabold text-slate-900 tracking-[-0.03em] leading-none">
          {appliedCoupon
            ? formatPrice(appliedCoupon.discount_price)
            : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
        </span>
        {(appliedCoupon || Number(course.original_price) > Number(course.price)) && (
          <span className="text-[15px] text-slate-400 line-through">
            {formatPrice(Number(appliedCoupon ? course.price : course.original_price))}
          </span>
        )}
      </div>
      <p className="text-[12px] text-slate-400 mt-1.5">KDV dahil · Ömür boyu erişim</p>

      <div className="space-y-2 mt-4">
        <Button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          className="w-full h-11 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[14.5px] font-semibold"
        >
          {addToCartMutation.isPending ? 'Ekleniyor…' : 'Sepete ekle'}
        </Button>
        <Button
          variant="outline"
          onClick={handleEnroll}
          disabled={enrollMutation.isPending}
          className="w-full h-11 rounded-md border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[14.5px] font-semibold"
        >
          Hemen satın al
        </Button>
      </div>

      {!showCoupon && !appliedCoupon ? (
        <button
          onClick={() => setShowCoupon(true)}
          className="text-[13px] font-medium text-slate-500 hover:text-brand-800 transition-colors mt-3"
        >
          Kuponum var
        </button>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <Input
            placeholder="Kupon kodu"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="h-9 rounded-md text-[13px] font-mono tracking-wider"
            disabled={!!appliedCoupon}
          />
          {appliedCoupon ? (
            <Button
              variant="ghost"
              className="h-9 px-3 rounded-md text-rose-600 hover:bg-rose-50 text-[13px] font-semibold shrink-0"
              onClick={() => { setAppliedCoupon(null); setCouponCode(''); setShowCoupon(false); }}
            >
              Kaldır
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-9 px-4 rounded-md text-[13px] font-semibold shrink-0"
              disabled={!couponCode || couponLoading}
              onClick={applyCoupon}
            >
              {couponLoading ? '…' : 'Uygula'}
            </Button>
          )}
        </div>
      )}

      {/*
        Kutuda artık yalnızca kursla birlikte gelen haklar var; her satır kendi
        simgesiyle. Seviye ve dil künyeye, ders sayısı müfredat başlığına
        taşındığı için burada onay işaretli ikinci bir liste kalmadı.
      */}
      <ul className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        {courseBenefits.map(item => (
          <li key={item.text} className="flex items-start gap-2.5 text-[13px] text-slate-700">
            <FeatureIcon kind={item.icon} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  /** Oynat düğmesi tanıtım videosu yoksa ilk ücretsiz dersi açar. */
  const firstPreviewLesson = allLessons.find((l: any) => l.preview || l.is_free) || null;
  const hasAnyPreview = Boolean(course.preview_video || firstPreviewLesson);

  /** Önizlemeye açık dersler — sol listede sırayla gösteriliyor. */
  const previewLessons = allLessons.filter((l: any) => l.preview || l.is_free);

  const learnItems: string[] = (Array.isArray(course.what_you_learn)
    ? course.what_you_learn
    : String(course.what_you_learn || '').split(';')
  ).filter((item: string) => item && item.trim());

  /** Uzun açıklamalar kırpılıyor; eşik kabaca 6-7 satıra denk geliyor. */
  const isLongDescription = String(course.description || '').length > 600;

  /** Egitmen biyografisi 320 karakteri asarsa kirpiliyor. */
  const isLongBio = String(instructorBio || '').length > 320;

  /**
   * En iyi üç değerlendirme.
   *
   * Önce puana, eşitlikte yorum uzunluğuna bakılıyor: tek satırlık "güzel"
   * yorumu, aynı puanı veren ayrıntılı bir yorumun önüne geçmesin.
   */
  const topReviews = [...reviewsList]
    .sort((a: any, b: any) => {
      const byRating = Number(b.rating || 0) - Number(a.rating || 0);
      if (byRating !== 0) return byRating;
      return String(b.comment || '').length - String(a.comment || '').length;
    })
    .slice(0, 3);

  /**
   * Puan dağılımı — 5'ten 1'e yüzdeler.
   *
   * Sunucu dağılımı ayrıca vermiyor; elimizdeki yorum listesinden
   * hesaplanıyor. Liste kırpılmış olabileceği için yüzdeler "gösterilen
   * yorumlar" üzerinden çıkıyor, bu da eğilimi görmek için yeterli.
   */
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => {
    const count = reviewsList.filter((r: any) => Math.round(Number(r.rating) || 0) === star).length;
    return {
      star,
      count,
      percent: reviewsList.length > 0 ? Math.round((count / reviewsList.length) * 100) : 0,
    };
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20 lg:pb-0">
      {/*
        Üst band — kursun koyu künyesi.

        Solda kursun kimliği (konum, etiketler, başlık, puan, eğitmen, künye),
        sağda tanıtım oynatıcısı. Zemin koyu çünkü hemen altından beyaz içerik
        ızgarası başlıyor; açık zeminde band ile içerik birbirine karışıyor ve
        sayfanın nerede başladığı belirsiz kalıyordu.
      */}
      <section className="relative overflow-hidden bg-[#0F172A] text-slate-100 border-b border-slate-800">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 left-1/4 w-[430px] h-[430px] bg-brand-600/20 rounded-full blur-[130px]" />
          <div className="absolute bottom-0 right-1/3 w-[370px] h-[370px] bg-brand-400/10 rounded-full blur-[120px]" />
        </div>

        <div className="container relative mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-9 lg:py-14">
          <div className="grid lg:grid-cols-12 gap-9 lg:gap-12 items-center">

            {/* ── Sol: kursun kimliği ──────────────────────────────────── */}
            <div className="lg:col-span-6 min-w-0">

              <nav aria-label="Konum" className="flex items-center gap-2 text-[13px] text-slate-400 overflow-hidden whitespace-nowrap">
                {categorySlug ? (
                  <Link to={`/courses/${categorySlug}`} className="hover:text-brand-300 transition-colors truncate max-w-[160px]">
                    {course.category_name}
                  </Link>
                ) : (
                  <span className="truncate max-w-[160px]">{course.category_name || 'Kategori'}</span>
                )}
                {course.subcategory_name && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    {categorySlug && subcategorySlug ? (
                      <Link
                        to={`/courses/${categorySlug}/${subcategorySlug}`}
                        className="text-brand-300 font-semibold hover:text-brand-200 transition-colors truncate max-w-[180px]"
                      >
                        {course.subcategory_name}
                      </Link>
                    ) : (
                      <span className="text-brand-300 font-semibold truncate max-w-[180px]">
                        {course.subcategory_name}
                      </span>
                    )}
                  </>
                )}
              </nav>

              {/* Etiketler — hepsi gerçek veriden; karşılığı yoksa basılmıyor */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {course.is_featured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-amber-300" />
                    Öne çıkan
                  </span>
                )}

                {course.updated_at && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-[11px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Güncel: {new Date(course.updated_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                )}

                {previewLessons.length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-medium">
                    {previewLessons.length} ders ücretsiz izlenebilir
                  </span>
                )}
              </div>

              <h1 className="font-montserrat text-[25px] sm:text-[31px] lg:text-[34px] font-extrabold text-white leading-[1.18] tracking-[-0.025em] break-words mt-4">
                {course.title}
              </h1>

              {course.short_description && (
                <p className="text-[14.5px] sm:text-[15.5px] text-slate-300 leading-[1.65] mt-3.5 break-words">
                  {course.short_description}
                </p>
              )}

              {/* Puan, öğrenci ve eğitmen */}
              <div className="flex flex-wrap items-center gap-y-3 gap-x-4 text-[13px] sm:text-[13.5px] text-slate-200 mt-5">
                {reviewsCount > 0 && (
                  <span className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="font-extrabold text-amber-400 tabular-nums">
                      {Number(course.rating || 0).toFixed(1).replace('.', ',')}
                    </span>
                    <StarRating rating={Number(course.rating || 0)} size={14} />
                    <a
                      href="#degerlendirmeler"
                      className="text-slate-300 hover:text-white underline decoration-slate-500 underline-offset-2 transition-colors"
                    >
                      ({reviewsCount} değerlendirme)
                    </a>
                  </span>
                )}

                {Number(course.student_count) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>
                      <strong className="text-white font-bold tabular-nums">
                        {Number(course.student_count).toLocaleString('tr-TR')}
                      </strong>{' '}
                      öğrenci
                    </span>
                  </span>
                )}

                <span className="flex items-center gap-2">
                  <span className="text-slate-400">Hazırlayan:</span>
                  <InstructorLink className="inline-flex items-center gap-1.5 group">
                    <Avatar className="w-6 h-6 ring-1 ring-slate-700 shrink-0">
                      <AvatarImage src={instructorAvatar} alt={instructorFullName} />
                      <AvatarFallback className="bg-brand-700 text-white text-[10px] font-bold">
                        {instructorFullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-white group-hover:text-brand-300 transition-colors">
                      {instructorFullName}
                    </span>
                  </InstructorLink>
                </span>
              </div>

              {/* Künye şeridi — dil, seviye, süre */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12.5px] text-slate-300 mt-5 pt-4 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-400 shrink-0" />
                  {languageLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-brand-400 shrink-0" />
                  {levelLabel}
                </span>
                {totalSeconds > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                    Toplam {totalDurationLabel}
                  </span>
                )}
                {totalLessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-brand-400 shrink-0" />
                    {totalLessons} ders
                  </span>
                )}
              </div>
            </div>

            {/* ── Sağ: tanıtım oynatıcısı ──────────────────────────────── */}
            <div className="lg:col-span-6 w-full">
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden group ring-1 ring-slate-700/70 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]">

              {isVideoPlaying && (previewLesson || course.preview_video) ? (
                <>
                  {previewLesson?.video_type === 'hls' ? (
                    <HLSVideoPlayer
                      key={previewLesson.lesson_id}
                      src={previewLesson.video_url}
                      videoType="hls"
                      autoPlay
                      poster={getCourseImageUrl(course.course_id || course.id, course.thumbnail || course.image_url || course.image_path)}
                      title={previewLesson.title}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={previewLesson?.video_url || course.preview_video}
                      className="w-full h-full object-contain bg-black"
                      controls
                      autoPlay
                      playsInline
                      onEnded={() => setIsVideoPlaying(false)}
                      onError={() => {
                        toast.error('Video yüklenemedi');
                        setIsVideoPlaying(false);
                      }}
                    />
                  )}

                  {previewLesson && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-2.5 pb-10 pointer-events-none">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                        Ücretsiz önizleme
                      </p>
                      <p className="text-[13.5px] font-medium text-white truncate pr-12">
                        {previewLesson.title}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoPlaying(false);
                      setPreviewLesson(null);
                      videoRef.current?.pause();
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (course.preview_video) setIsVideoPlaying(true);
                    else if (previewLessons[0]) openLessonPreview(previewLessons[0]);
                  }}
                  disabled={!hasAnyPreview}
                  className="absolute inset-0 w-full h-full disabled:cursor-default"
                >
                  <img
                    src={getCourseImageUrl(course.course_id || course.id, course.thumbnail || course.image_url || course.image_path)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-slate-950/40" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {hasAnyPreview ? (
                      <>
                        <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-brand-800 fill-brand-800 ml-0.5" />
                        </span>
                        <span className="text-white text-[12.5px] sm:text-[13.5px] font-semibold px-4 text-center">
                          {previewLessons.length > 0
                            ? `${previewLessons.length} ders ücretsiz izlenebilir`
                            : 'Bu kursu önizle'}
                        </span>
                      </>
                    ) : (
                      <span className="text-white/80 text-[13px]">Önizleme eklenmemiş</span>
                    )}
                  </span>
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        Sayfa içi sekmeler.

        Kurs sayfası uzun; kullanıcı müfredata ya da yorumlara inmek için
        tekerleği çevirmek zorunda kalıyordu. Çubuk ana başlığın altına
        yapışıyor (header 64px, bu yüzden top-16) ve kaydırma sırasında
        hangi bölümde olunduğunu işaretliyor — bu durum zaten hesaplanıyordu
        ama hiçbir yerde çizilmiyordu.

        Kazanımlar bölümü kursta madde yoksa basılmıyor; sekmesi de o zaman
        listeden düşüyor, hiçbir yere gitmeyen sekme bırakmamak için.
      */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px]">
          <nav
            aria-label="Kurs bölümleri"
            className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {PAGE_SECTIONS
              .filter(sec => sec.id !== 'genel-bakis' || learnItems.length > 0)
              .map(sec => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className={cn(
                    'shrink-0 px-4 py-3.5 text-[13.5px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
                    activeSection === sec.id
                      ? 'border-brand-700 text-brand-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  )}
                >
                  {sec.label}
                </a>
              ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px]">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 pt-8 pb-10">
          {/* ── Sol: kurs içeriği ──────────────────────────────────────── */}
          <div className="lg:col-span-8 min-w-0">

            {/*
              Kursla birlikte ne geldiğini söyleyen üç kart.

              Seviye, dil ve süre yukarıdaki koyu künyede zaten yazıyor;
              burada tekrar etmek yerine satın alanın eline ne geçtiği
              duruyor: belge, erişim süresi ve içerik hacmi.
            */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: 'certificate', label: 'Sertifika', value: 'Onaylı belge' },
                { icon: 'access', label: 'Erişim', value: 'Ömür boyu' },
                Number(course.downloadable_resources) > 0
                  ? { icon: 'resource', label: 'Kaynak', value: `${course.downloadable_resources} dosya` }
                  : { icon: 'duration', label: 'İçerik', value: totalSeconds > 0 ? totalDurationLabel : `${totalLessons} ders` },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <span className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <FeatureIcon kind={item.icon} bare />
                  </span>
                  <span className="text-center sm:text-left min-w-0">
                    <span className="block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                      {item.label}
                    </span>
                    <span className="block text-[13.5px] font-bold text-slate-800 mt-0.5 truncate">
                      {item.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/*
              Mobil satın alma bloğu.

              Sağ ray masaüstünde sabit duruyor ama dar ekranda içerik
              yığıldığı için en alta düşüyordu. Burada künyenin hemen altında;
              sağdaki kart yalnızca geniş ekranda görünüyor.
            */}
            <div ref={mobilePurchaseRef} className="lg:hidden mt-5">
              <PurchaseBox />
            </div>

            {/* ── Kazanımlar ──────────────────────────────────────────── */}
            {learnItems.length > 0 && (
              <section id="genel-bakis" className="scroll-mt-32 mt-8">
                <div className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-50/70 via-white to-brand-50/40 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
                        Kazanımlar
                      </span>
                      <h2 className="font-montserrat text-[21px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug mt-1">
                        Bu kursta neler öğreneceksiniz?
                      </h2>
                    </div>
                    <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {learnItems.map((item: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3.5 bg-white/85 p-3.5 rounded-xl border border-brand-100"
                      >
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <span className="text-[14px] font-semibold text-slate-800 leading-snug break-words">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Müfredat ────────────────────────────────────────────── */}
            <section id="mufredat" className="scroll-mt-32 mt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                    Ders planı
                  </span>
                  <h2 className="font-montserrat text-[21px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight mt-1">
                    Müfredat içeriği
                  </h2>
                </div>

                <p className="text-[12.5px] sm:text-[13px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0">
                  <span className="font-bold text-slate-900">{course.sections?.length || 0}</span> bölüm ·{' '}
                  <span className="font-bold text-slate-900">{totalLessons}</span> ders ·{' '}
                  <span className="font-bold text-slate-900">{totalDurationLabel}</span> toplam süre
                </p>
              </div>

              <div className="mt-5 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] divide-y divide-slate-100">
                {course.sections?.map((section: any, idx: number) => {
                  const lessons: any[] = section.lessons || [];
                  const isOpen = openSections.includes(idx);

                  const sectionSeconds = lessons.reduce(
                    (sum, l) => sum + (Number(l.duration || l.duration_seconds) || 0),
                    0
                  );
                  const sectionDuration = sectionSeconds > 0
                    ? (sectionSeconds >= 3600
                      ? `${Math.floor(sectionSeconds / 3600)} sa ${Math.round((sectionSeconds % 3600) / 60)} dk`
                      : `${Math.max(1, Math.round(sectionSeconds / 60))} dk`)
                    : null;

                  return (
                    <div key={section.id ?? section.section_id ?? idx}>
                      <button
                        type="button"
                        onClick={() => toggleSection(idx)}
                        aria-expanded={isOpen}
                        className="w-full px-4 sm:px-6 py-4 bg-slate-50/90 hover:bg-slate-100/80 flex items-center justify-between gap-3 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-900 font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-bold text-slate-900 text-[14px] sm:text-[15px] leading-snug">
                              Bölüm {idx + 1}: {section.title}
                            </span>
                            {section.description && (
                              <span className="block text-[12px] text-slate-500 font-medium truncate mt-0.5">
                                {section.description}
                              </span>
                            )}
                          </span>
                        </div>

                        <span className="flex items-center gap-3 text-[12px] sm:text-[13px] font-semibold text-slate-500 shrink-0">
                          <span className="hidden sm:inline whitespace-nowrap">
                            {lessons.length} ders{sectionDuration ? ` · ${sectionDuration}` : ''}
                          </span>
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 text-slate-500 transition-transform duration-200',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </span>
                      </button>

                      {/* Kapalı bölümün dersleri DOM'da kalıyor, yalnızca gizleniyor */}
                      <div className={cn('divide-y divide-slate-100 bg-white', !isOpen && 'hidden')}>
                        {lessons.map((lesson: any, lessonIdx: number) => {
                          const isPreview = Boolean(lesson.preview || lesson.is_free);
                          const lessonId = lesson.id ?? lesson.lesson_id ?? lessonIdx;
                          const seconds = Number(lesson.duration || lesson.duration_seconds) || 0;

                          return (
                            <div
                              key={lessonId}
                              onClick={() => isPreview && openLessonPreview(lesson)}
                              className={cn(
                                'px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 group transition-colors',
                                isPreview ? 'hover:bg-brand-50/60 cursor-pointer' : 'hover:bg-slate-50/80'
                              )}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <span
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                    isPreview
                                      ? 'bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white'
                                      : 'bg-slate-100 text-slate-400'
                                  )}
                                >
                                  <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                                </span>

                                <span
                                  className={cn(
                                    'text-[13.5px] sm:text-[14px] font-medium text-slate-800 truncate transition-colors',
                                    isPreview && 'group-hover:text-brand-800'
                                  )}
                                >
                                  <span className="text-slate-400 tabular-nums mr-1.5">
                                    {idx + 1}.{lessonIdx + 1}
                                  </span>
                                  {lesson.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                {isPreview && (
                                  <span className="hidden sm:inline px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-bold">
                                    Ücretsiz önizleme
                                  </span>
                                )}
                                <span className="text-[12px] text-slate-400 font-mono tabular-nums">
                                  {seconds
                                    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
                                    : '—'}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {lessons.length === 0 && (
                          <p className="px-4 sm:px-6 py-4 text-[13.5px] text-slate-400">
                            Bu bölüme henüz ders eklenmemiş.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(course.sections?.length || 0) === 0 && (
                  <p className="px-6 py-8 text-center text-[14px] text-slate-400">
                    Müfredat henüz yayınlanmadı.
                  </p>
                )}
              </div>
            </section>

            {/* ── Kurs hakkında ───────────────────────────────────────── */}
            {course.description && (
              <section id="hakkinda" className="scroll-mt-32 mt-10 pt-8 border-t border-slate-200">
                <SectionTitle hint="Eğitmenin kendi anlatımıyla kursun kapsamı">Kurs hakkında</SectionTitle>
                <div
                  className={cn(
                    'text-[15.5px] text-slate-600 leading-[1.8] break-words whitespace-pre-wrap relative',
                    !descExpanded && isLongDescription && 'max-h-[220px] overflow-hidden'
                  )}
                >
                  {course.description}
                  {/* Kısaltılmış metnin altına yumuşak geçiş */}
                  {!descExpanded && isLongDescription && (
                    <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                {isLongDescription && (
                  <button
                    onClick={() => setDescExpanded(v => !v)}
                    className="text-[14px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-3"
                  >
                    {descExpanded ? 'Daha az göster' : 'Devamını göster'}
                  </button>
                )}
              </section>
            )}

            {/* ── İlgili kurslar ──────────────────────────────────────── */}
            {suggestions?.relatedCourses?.length > 0 && (
              <section className="mt-10 pt-8 border-t border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <SectionTitle
                    className="mb-0"
                    hint="Aynı alanda öğrenenlerin birlikte aldığı kurslar"
                  >
                    Bu kursla ilgili kurslar
                  </SectionTitle>
                  <Link
                    to={categorySlug ? `/courses/${categorySlug}` : '/courses'}
                    className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    Tümünü gör
                  </Link>
                </div>

                {/*
                  Kategori sayfasındaki kartın aynısı kullanılıyor. İkinci bir
                  kart biçimi tutmak, biri değişince diğerinin geride kalması
                  demek; tek bileşen iki yerde de aynı görünüyor.
                */}
                <div className="mt-5 grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {suggestions.relatedCourses.slice(0, 6).map((c: any) => (
                    <CatalogCourseCard
                      key={c.course_id ?? c.id}
                      course={c}
                      owned={ownedIds.has(Number(c.course_id ?? c.id))}
                      inCart={cartIds.has(Number(c.course_id ?? c.id))}
                      progress={progressById.get(Number(c.course_id ?? c.id)) ?? 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Eğitmen ─────────────────────────────────────────────── */}
            <section id="egitmen" className="scroll-mt-32 mt-10 pt-8 border-t border-slate-200">
              <SectionTitle>Eğitmen</SectionTitle>

              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  <InstructorLink className="shrink-0">
                    <Avatar className="w-16 h-16 ring-2 ring-white shadow-sm">
                      <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                      <AvatarFallback className="bg-brand-100 text-brand-800 font-bold text-[20px]">
                        {instructorFullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </InstructorLink>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                      <div className="min-w-0">
                        <InstructorLink className="inline-block group">
                          <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-brand-800 transition-colors">
                            {instructorFullName}
                          </h3>
                        </InstructorLink>
                        <p className="text-[13.5px] text-slate-500">
                          {course.instructor_title || 'Eğitmen'}
                        </p>
                      </div>

                      {/*
                        Eğitmen ölçüleri — sağ üstte, küçük ve tek satır.

                        Ayrı hücrelerdeki iri rakamlar "1 öğrenci · 1 kurs"
                        gibi küçük değerlerde orantısız duruyordu. Burada
                        başlıkla aynı hizada, yardımcı bilgi ölçeğinde.
                      */}
                      <p className="text-[12.5px] text-slate-500 shrink-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {Number(course.instructor_avg_rating || 0) > 0 && (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-600 tabular-nums">
                                {Number(course.instructor_avg_rating).toFixed(1).replace('.', ',')}
                              </span>
                              <StarRating rating={Number(course.instructor_avg_rating)} size={12} />
                            </span>
                            <span className="text-slate-300">·</span>
                          </>
                        )}
                        <span>
                          <span className="font-semibold text-slate-800">
                            {Number(course.instructor_total_students || course.instructor_students || 0).toLocaleString('tr-TR')}
                          </span> öğrenci
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>
                          <span className="font-semibold text-slate-800">
                            {course.instructor_course_count || course.instructor_courses || 1}
                          </span> kurs
                        </span>
                      </p>
                    </div>

                    {/* Uzun biyografi kırpılıyor */}
                    <p
                      className={cn(
                        'text-[14px] text-slate-600 leading-[1.75] mt-3 whitespace-pre-wrap break-words',
                        !bioExpanded && isLongBio && 'line-clamp-4'
                      )}
                    >
                      {instructorBio}
                    </p>
                    {isLongBio && (
                      <button
                        onClick={() => setBioExpanded(v => !v)}
                        className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-2"
                      >
                        {bioExpanded ? 'Daha az göster' : 'Daha fazlasını gör'}
                      </button>
                    )}

                    {/*
                      Uzmanlık alanları — akan etiketler.

                      İki sütunlu işaretli liste, kısa etiketlerde bol boşluk
                      bırakıp düzensiz görünüyordu. Etiketler kendi
                      genişliklerinde ve satır sonunda kendiliğinden alta
                      geçiyor.
                    */}
                    {instructorExpertiseArray.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700/70 mb-2.5">
                          Uzmanlık alanları
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {instructorExpertiseArray.map((exp: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block text-[12.5px] font-medium text-brand-900 bg-white border border-brand-200 rounded-full px-3 py-1"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/*
                  Eğitmenin diğer kursları — sıkı satırlar.

                  Yan yana kart yerine liste: aynı eğitmenin kursları arasında
                  gezinirken kapak görselinden çok başlık ve fiyat karşılaştırılıyor.
                */}
                {suggestions?.instructorCourses?.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-brand-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700/70 mb-3">
                      Eğitmenin diğer kursları
                    </p>
                    <div className="space-y-2">
                      {suggestions.instructorCourses.slice(0, 5).map((c: any) => (
                        <CourseListRow key={c.course_id ?? c.id} course={c} />
                      ))}
                    </div>
                    {instructorSlug && (
                      <Link
                        to={`/user/${instructorSlug}`}
                        className="inline-block text-[13px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-3"
                      >
                        Eğitmenin tüm kursları
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── Değerlendirmeler ────────────────────────────────────── */}
            <section id="degerlendirmeler" className="scroll-mt-32 mt-10 pt-8 border-t border-slate-200">
              <SectionTitle>Değerlendirmeler</SectionTitle>

              {topReviews.length > 0 ? (
                <>
                  {/*
                    Özet paneli.

                    Solda ortalama puan iri rakamla, sağda puan dağılımı.
                    Dağılım tek başına "4,6" rakamının söylemediğini söylüyor:
                    puanın az sayıda uç yorumdan mı yoksa geneli memnun bir
                    kitleden mi geldiği görünüyor.
                  */}
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                    <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-1 shrink-0">
                      <span className="font-montserrat text-[44px] font-extrabold text-slate-900 tabular-nums leading-none">
                        {Number(course.rating || 0).toFixed(1).replace('.', ',')}
                      </span>
                      <span className="sm:mt-2">
                        <StarRating rating={Number(course.rating || 0)} size={18} />
                        <span className="block text-[13px] text-slate-500 mt-1.5">
                          {reviewsCount} değerlendirme
                        </span>
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {ratingBreakdown.map(row => (
                        <div key={row.star} className="flex items-center gap-3">
                          <span className="text-[12.5px] text-slate-500 tabular-nums w-8 shrink-0">
                            {row.star} ★
                          </span>
                          <span className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <span
                              className="block h-full rounded-full bg-amber-400"
                              style={{ width: `${row.percent}%` }}
                            />
                          </span>
                          <span className="text-[12.5px] text-slate-400 tabular-nums w-9 text-right shrink-0">
                            %{row.percent}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Öne çıkan yorumlar */}
                  <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    {topReviews.map((review: any) => (
                      <ReviewCard key={review.review_id} review={review} />
                    ))}
                  </div>

                  {reviewsList.length > topReviews.length && (
                    <button
                      onClick={() => setReviewsOpen(true)}
                      className="h-11 px-6 mt-4 rounded-lg border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[14px] font-semibold transition-colors"
                    >
                      {reviewsList.length} değerlendirmenin tümünü gör
                    </button>
                  )}
                </>
              ) : (
                <p className="text-[14.5px] text-slate-500">
                  Bu kurs için henüz değerlendirme yapılmamış.
                </p>
              )}
            </section>
          </div>

          {/* ── Sağ: satın alma ve kurs özellikleri (geniş ekran) ──────── */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <PurchaseBox />

            </div>
          </aside>
        </div>
      </div>


      {/*
        Mobil alt çubuk.

        Dar ekranda sağ ray yok ve içerik uzun; kullanıcı aşağı indiğinde
        fiyata ulaşamıyordu. Künyedeki satın alma bloğu ekrandan çıkınca bu
        çubuk beliriyor. Geniş ekranda hiç basılmıyor — orada ray zaten sabit.
      */}
      <div
        className={cn(
          'lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300',
          showMobileBar ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-montserrat text-[19px] font-extrabold text-slate-900 tracking-[-0.03em] leading-none">
              {appliedCoupon
                ? formatPrice(appliedCoupon.discount_price)
                : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 truncate">Ömür boyu erişim</p>
          </div>
          <Button
            variant="outline"
            onClick={handleEnroll}
            disabled={enrollMutation.isPending}
            className="h-10 px-4 rounded-md border-slate-300 text-slate-800 text-[13.5px] font-semibold shrink-0"
          >
            Hemen al
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="h-10 px-5 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[13.5px] font-semibold shrink-0"
          >
            Sepete ekle
          </Button>
        </div>
      </div>
      {/* Tüm değerlendirmeler penceresi */}
      <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-xl overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b border-slate-200 text-left">
            <DialogTitle className="font-montserrat text-[17px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Değerlendirmeler
            </DialogTitle>
            {reviewsCount > 0 && (
              <p className="text-[13.5px] text-slate-500">
                <span className="font-semibold text-slate-900">{Number(course.rating || 0).toFixed(1)}</span>
                {' '}ortalama · {reviewsCount} değerlendirme
              </p>
            )}
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 sm:px-6 divide-y divide-slate-200">
            {reviewsList.map((review: any) => (
              <ReviewItem key={review.review_id} review={review} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Bölüm başlığı — altında markanın kısa çizgisi. */
const SectionTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Basligin altina tek satirlik aciklama */
  hint?: string;
}> = ({ children, className, hint }) => (
  <div className={cn('mb-5', className)}>
    <h2 className="font-montserrat text-[19px] font-extrabold text-slate-900 tracking-[-0.02em]">
      {children}
    </h2>
    <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2" />
    {hint && <p className="text-[13.5px] text-slate-500 mt-2">{hint}</p>}
  </div>
);

/** 5 üzerinden puanı yıldızla gösterir; yarım yıldız desteklenir. */
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <span className="inline-flex items-center gap-[1px]" aria-label={`${rating.toFixed(1)} / 5`}>
    {[0, 1, 2, 3, 4].map(i => {
      const fill = Math.max(0, Math.min(1, rating - i));
      return (
        <span key={i} className="relative shrink-0" style={{ width: size, height: size }}>
          <Star className="absolute inset-0 text-slate-200 fill-slate-200" style={{ width: size, height: size }} />
          {fill > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
            </span>
          )}
        </span>
      );
    })}
  </span>
);

/** Tek değerlendirme — hem sayfada hem pencerede aynı görünüyor. */
const ReviewItem: React.FC<{ review: any }> = ({ review }) => (
  <article className="py-4">
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8 ring-1 ring-slate-200">
        <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-[13px]">
          {review.reviewer_name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-[14px] text-slate-900 truncate">{review.reviewer_name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={Number(review.rating || 0)} size={13} />
          <span className="text-[12.5px] text-slate-400">
            {new Date(review.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
    {review.comment && (
      <p className="text-slate-600 text-[14.5px] leading-[1.75] mt-2.5">{review.comment}</p>
    )}
  </article>
);

/**
 * Eğitmenin diğer kurslarında kullanılan sıkı liste satırı.
 *
 * Küçük kare kapak, başlık ve rozetler solda; fiyat sağda ayrı bir sütunda.
 * Kapak görselinden çok başlık/puan/fiyat karşılaştırıldığı için kart yerine
 * satır tercih edildi.
 */
const CourseListRow: React.FC<{ course: any }> = ({ course }) => {
  const id = course.course_id ?? course.id;
  const rating = Number(course.rating) || 0;
  const reviewCount = Number(course.review_count) || 0;
  const price = Number(course.price) || 0;

  const chips = [
    Number(course.student_count) > 0 && `${Number(course.student_count).toLocaleString('tr-TR')} öğrenci`,
    Number(course.duration_hours) > 0 && `${Math.round(Number(course.duration_hours))} saat`,
    course.level,
  ].filter(Boolean) as string[];

  return (
    <Link
      to={`/course/${course.slug || id}`}
      target="_blank"
      rel="noopener"
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-brand-400 hover:shadow-sm"
    >
      <span className="w-14 h-14 shrink-0 rounded-md bg-slate-100 overflow-hidden">
        <img
          src={getCourseImageUrl(id, course.image)}
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-brand-800 transition-colors">
          {course.title}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5">
              <span className="text-[11.5px] font-bold text-amber-700 tabular-nums">
                {rating.toFixed(1)}
              </span>
              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            </span>
          )}
          {chips.map(chip => (
            <span
              key={chip}
              className="text-[11.5px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.5"
            >
              {chip}
            </span>
          ))}
        </span>
      </span>

      <span className="shrink-0 pl-3 border-l border-slate-100 text-right">
        <span className="block text-[15px] font-bold text-slate-900 whitespace-nowrap">
          {price > 0 ? formatPrice(price) : 'Ücretsiz'}
        </span>
        {Number(course.original_price) > price && (
          <span className="block text-[12px] text-slate-400 line-through whitespace-nowrap">
            {formatPrice(Number(course.original_price))}
          </span>
        )}
      </span>
    </Link>
  );
};

/**
 * Özellik listesindeki simgeler.
 *
 * Ölçüler (seviye, dil, süre, ders, kaynak) onay işaretiyle; kursla birlikte
 * gelen haklar kendi çizimiyle gösteriliyor. Simgeler hazır ikon setinden
 * değil, doğrudan SVG olarak çiziliyor — böylece dördü de aynı kalınlıkta ve
 * aynı ızgarada duruyor.
 */
/**
 * Kurs özelliklerinin simgeleri.
 *
 * `bare` künye şeridinde kullanılıyor: orada simge kendi kutusunda ortalı
 * durduğu için listedeki hizalama payı (mt) ve küçük boyut yanlış görünüyor.
 */
const FeatureIcon: React.FC<{ kind: string; bare?: boolean }> = ({ kind, bare }) => {
  const common = bare
    ? 'w-[18px] h-[18px] shrink-0 text-brand-700'
    : 'w-4 h-4 shrink-0 mt-[2px] text-brand-700';
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (kind === 'level') {
    // Yükselen üç çubuk — seviye
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <path d="M5 19v-4M12 19V9M19 19V5" />
      </svg>
    );
  }

  if (kind === 'language') {
    // Küre + meridyen — ders dili
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
      </svg>
    );
  }

  if (kind === 'duration') {
    // Saat — toplam video süresi
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.2V12l3.2 1.9" />
      </svg>
    );
  }

  if (kind === 'resource') {
    // Aşağı oklu sayfa — indirilebilir kaynak
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7l-4-4Z" />
        <path d="M12 10.5v5m0 0 2-2m-2 2-2-2" />
      </svg>
    );
  }

  if (kind === 'check') {
    return <Check className="w-3.5 h-3.5 shrink-0 mt-[3px] text-brand-700 stroke-[3]" />;
  }

  if (kind === 'access') {
    // Sonsuzluk döngüsü — süresiz erişim
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <path d="M6.5 8.5c-2 0-3.5 1.6-3.5 3.5s1.5 3.5 3.5 3.5c3.5 0 5.5-7 9-7 2 0 3.5 1.6 3.5 3.5s-1.5 3.5-3.5 3.5c-3.5 0-5.5-7-9-7Z" />
      </svg>
    );
  }

  if (kind === 'certificate') {
    // Kurdeleli belge
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13.5 8 21l4-2 4 2-1-7.5" />
      </svg>
    );
  }

  if (kind === 'devices') {
    // Ekran + telefon
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <rect x="2" y="4" width="13" height="9" rx="1.5" />
        <path d="M6 17h5" />
        <rect x="17" y="9" width="5" height="11" rx="1.5" />
      </svg>
    );
  }

  if (kind === 'support') {
    // Konuşma balonu + soru
    return (
      <svg viewBox="0 0 24 24" className={common} {...stroke}>
        <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12Z" />
        <path d="M10.4 9.6a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.8.7-.8 1.2" />
        <path d="M12 15.4h.01" />
      </svg>
    );
  }

  return <Check className="w-3.5 h-3.5 shrink-0 mt-[3px] text-brand-700 stroke-[3]" />;
};

/**
 * Öne çıkan yorum kartı.
 *
 * Pencerede kullanılan liste satırından ayrı: sayfada iki sütuna dizildiği
 * için sabit yükseklikte durması ve uzun yorumların kırpılması gerekiyor.
 */
const ReviewCard: React.FC<{ review: any }> = ({ review }) => (
  <article className="rounded-xl border border-slate-200 p-4 flex flex-col transition-colors hover:border-brand-300">
    <div className="flex items-center gap-3">
      <Avatar className="w-9 h-9 ring-1 ring-slate-200">
        <AvatarFallback className="bg-brand-50 text-brand-800 font-bold text-[13px]">
          {review.reviewer_name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-[14px] text-slate-900 truncate">{review.reviewer_name}</h4>
        <span className="text-[12px] text-slate-400">
          {new Date(review.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </div>
      <StarRating rating={Number(review.rating || 0)} size={13} />
    </div>

    {review.comment && (
      <p className="text-slate-600 text-[14px] leading-[1.7] mt-3 line-clamp-5">
        {review.comment}
      </p>
    )}
  </article>
);

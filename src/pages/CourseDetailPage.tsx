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
  Tag
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


  /**
   * Sayfadaki bölümler ve okunan bölüm.
   *
   * Sekme yerine tek sayfa kullanıldığı için soldaki dizin, kaydırma sırasında
   * hangi bölümde olunduğunu işaretliyor.
   */
  const PAGE_SECTIONS = [
    { id: 'genel-bakis', label: 'Genel bakış' },
    { id: 'mufredat', label: 'Müfredat' },
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

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <nav className="flex items-center text-[13px] text-slate-500 gap-2 pt-5 pb-4 overflow-hidden whitespace-nowrap">
          {categorySlug ? (
            <Link to={`/courses/${categorySlug}`} className="hover:text-brand-800 transition-colors truncate max-w-[170px]">
              {course.category_name}
            </Link>
          ) : (
            <span className="truncate max-w-[170px]">{course.category_name || 'Kategori'}</span>
          )}
          {course.subcategory_name && (
            <>
              <span className="text-slate-300">/</span>
              {categorySlug && subcategorySlug ? (
                <Link
                  to={`/courses/${categorySlug}/${subcategorySlug}`}
                  className="hover:text-brand-800 transition-colors truncate max-w-[170px]"
                >
                  {course.subcategory_name}
                </Link>
              ) : (
                <span className="truncate max-w-[170px]">{course.subcategory_name}</span>
              )}
            </>
          )}
        </nav>

        <h1 className="font-montserrat text-[26px] sm:text-[31px] font-extrabold text-slate-900 leading-[1.15] tracking-[-0.025em] break-words max-w-4xl">
          {course.title}
        </h1>

        {course.short_description && (
          <p className="text-[16px] text-slate-600 leading-[1.6] mt-3 max-w-3xl break-words">
            {course.short_description}
          </p>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mt-6 pb-10">
          {/* ── Sol: oynatıcı + künye satırı + içerik ──────────────────── */}
          <div className="lg:col-span-8 min-w-0">
            {/*
              Oynatıcı sütunun tamamını kaplıyor. Önizlemeye açık dersler
              müfredat listesinde "Önizle" etiketiyle zaten işaretli; yanda
              ikinci bir liste tutmak videoyu daraltıyordu.
            */}
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group ring-1 ring-slate-900/5">
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
                        <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <Play className="w-6 h-6 text-brand-800 fill-brand-800 ml-0.5" />
                        </span>
                        <span className="text-white text-[13.5px] font-semibold">
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

            {/*
              Künye satırı — videonun altında.

              Ders sayısı, süre, seviye ve dil buradan çıkarıldı; hepsi sağdaki
              "Kurs özellikleri" tablosunda zaten var, iki kez yazmak satırı
              kalabalıklaştırıyordu.
            */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-4 rounded-xl border border-slate-200 bg-gradient-to-r from-brand-50/70 to-white px-4 py-3">
              {reviewsCount > 0 && (
                <span className="flex items-center gap-2">
                  <span className="font-montserrat text-[17px] font-extrabold text-amber-600 tabular-nums leading-none">
                    {Number(course.rating || 0).toFixed(1)}
                  </span>
                  <StarRating rating={Number(course.rating || 0)} />
                  <span className="text-[13px] text-slate-500">({reviewsCount})</span>
                </span>
              )}

              <span className="text-[13.5px] text-slate-600">
                <span className="font-semibold text-slate-900">
                  {Number(course.student_count || 0).toLocaleString('tr-TR')}
                </span>{' '}
                öğrenci
              </span>

              <span className="text-[13.5px] text-slate-600">
                <span className="font-semibold text-slate-900">
                  {new Date(course.updated_at || Date.now()).toLocaleDateString('tr-TR', {
                    month: 'long', year: 'numeric',
                  })}
                </span>{' '}
                güncellemesi
              </span>

              <InstructorLink className="flex items-center gap-2.5 group ml-auto">
                <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                  <AvatarImage src={instructorAvatar} alt={instructorFullName} />
                  <AvatarFallback className="bg-brand-100 text-brand-800 text-[11px] font-bold">
                    {instructorFullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Eğitmen
                  </span>
                  <span className="block text-[13.5px] font-semibold text-slate-900 group-hover:text-brand-800 transition-colors">
                    {instructorFullName}
                  </span>
                </span>
              </InstructorLink>
            </div>

            {/* ── Genel bakış ─────────────────────────────────────────── */}
            <section id="genel-bakis" className="scroll-mt-24 mt-8 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-6">
              <SectionTitle>Neler öğreneceksiniz</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {learnItems.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <Check className="w-3.5 h-3.5 text-brand-700 stroke-[3] mt-1.5 shrink-0" />
                    <span className="text-slate-700 leading-[1.65] break-words text-[14.5px]">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Müfredat ────────────────────────────────────────────── */}
            <section id="mufredat" className="scroll-mt-24 mt-10 pt-8 border-t border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionTitle className="mb-0">Müfredat</SectionTitle>
                <p className="text-[13.5px] text-slate-500">
                  {course.sections?.length || 0} bölüm · {totalLessons} ders · {totalDurationLabel}
                </p>
              </div>

              <div className="mt-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
                {course.sections?.map((section: any, idx: number) => (
                  <div key={section.id ?? section.section_id ?? idx}>
                    <div className="bg-brand-50/60 px-4 py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-montserrat text-[11px] font-extrabold text-brand-700 tabular-nums shrink-0">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[14.5px] font-semibold text-slate-900 leading-snug truncate">
                          {section.title}
                        </span>
                      </div>
                      <span className="text-[12.5px] text-slate-400 shrink-0 whitespace-nowrap">
                        {section.lessons?.length || 0} ders
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {section.lessons?.map((lesson: any, lessonIdx: number) => {
                        const isPreview = Boolean(lesson.preview || lesson.is_free);
                        const lessonId = lesson.id ?? lesson.lesson_id ?? lessonIdx;
                        const seconds = lesson.duration || lesson.duration_seconds || lesson.duration_minutes || 0;

                        return (
                          <div
                            key={lessonId}
                            onClick={() => isPreview && openLessonPreview(lesson)}
                            className={cn(
                              'flex items-center justify-between gap-3 px-4 py-2.5 transition-colors',
                              isPreview ? 'hover:bg-brand-50/50 cursor-pointer' : 'hover:bg-slate-50/60'
                            )}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Play
                                className={cn('w-3 h-3 shrink-0', isPreview ? 'text-brand-700' : 'text-slate-300')}
                                fill="currentColor"
                              />
                              <span className="text-[14.5px] text-slate-700 truncate">{lesson.title}</span>
                              {isPreview && (
                                <span className="shrink-0 text-[11.5px] font-semibold text-brand-800 bg-brand-50 border border-brand-200 rounded px-1.5 py-0.5">
                                  Önizle
                                </span>
                              )}
                            </div>
                            <span className="text-[12.5px] text-slate-400 tabular-nums shrink-0">
                              {seconds
                                ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
                                : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Kurs hakkında ───────────────────────────────────────── */}
            {course.description && (
              <section id="hakkinda" className="scroll-mt-24 mt-10 pt-8 border-t border-slate-200">
                <SectionTitle>Kurs hakkında</SectionTitle>
                <div
                  className={cn(
                    'text-[15.5px] text-slate-600 leading-[1.8] break-words whitespace-pre-wrap relative',
                    !descExpanded && isLongDescription && 'max-h-[220px] overflow-hidden'
                  )}
                >
                  {course.description}
                  {/* Kısaltılmış metnin altına yumuşak geçiş */}
                  {!descExpanded && isLongDescription && (
                    <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
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
                  <SectionTitle className="mb-0">Bu kursla ilgili kurslar</SectionTitle>
                  <Link
                    to={categorySlug ? `/courses/${categorySlug}` : '/courses'}
                    className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    Tümünü gör
                  </Link>
                </div>
                <div className="mt-5 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                  {suggestions.relatedCourses.slice(0, 8).map((c: any) => (
                    <MiniCourseCard key={c.course_id ?? c.id} course={c} className="w-[210px]" />
                  ))}
                </div>
              </section>
            )}

            {/* ── Eğitmenin diğer kursları ────────────────────────────── */}
            {suggestions?.instructorCourses?.length > 0 && (
              <section className="mt-10 pt-8 border-t border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <SectionTitle className="mb-0">
                    {instructorFullName} eğitmenin diğer kursları
                  </SectionTitle>
                  {instructorSlug && (
                    <Link
                      to={`/user/${instructorSlug}`}
                      className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                    >
                      Eğitmen profili
                    </Link>
                  )}
                </div>
                <div className="mt-5 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                  {suggestions.instructorCourses.slice(0, 8).map((c: any) => (
                    <MiniCourseCard key={c.course_id ?? c.id} course={c} className="w-[210px]" />
                  ))}
                </div>
              </section>
            )}

            {/* ── Değerlendirmeler ────────────────────────────────────── */}
            <section id="degerlendirmeler" className="scroll-mt-24 mt-10 pt-8 border-t border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionTitle className="mb-0">Değerlendirmeler</SectionTitle>
                {reviewsCount > 0 && (
                  <p className="text-[13.5px] text-slate-500">
                    <span className="font-semibold text-slate-900">{Number(course.rating || 0).toFixed(1)}</span>
                    {' '}ortalama · {reviewsCount} değerlendirme
                  </p>
                )}
              </div>

              {topReviews.length > 0 ? (
                <>
                  <div className="mt-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 px-4">
                    {topReviews.map((review: any) => (
                      <ReviewItem key={review.review_id} review={review} />
                    ))}
                  </div>

                  {reviewsList.length > topReviews.length && (
                    <button
                      onClick={() => setReviewsOpen(true)}
                      className="h-10 px-5 mt-4 rounded-md border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[14px] font-semibold transition-colors"
                    >
                      {reviewsList.length} değerlendirmenin tümünü gör
                    </button>
                  )}
                </>
              ) : (
                <p className="text-[14.5px] text-slate-500 mt-4">
                  Bu kurs için henüz değerlendirme yapılmamış.
                </p>
              )}
            </section>
          </div>

          {/* ── Sağ: satın alma, künye, eğitmen ────────────────────────── */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Satın alma */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 border-t-[3px] border-t-brand-700 shadow-sm">
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
              </div>

              {/* Kurs özellikleri */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <p className="font-montserrat text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-800 bg-brand-50 px-4 py-2.5 border-b border-brand-100">
                  Kurs özellikleri
                </p>
                <dl className="divide-y divide-slate-100">
                  {[
                    { label: 'Toplam süre', value: totalDurationLabel },
                    { label: 'Seviye', value: levelLabel },
                    { label: 'Dil', value: languageLabel },
                    { label: 'Erişim', value: 'Ömür boyu' },
                    { label: 'Sertifika', value: 'Var' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <dt className="text-[13px] text-slate-500">{row.label}</dt>
                      <dd className="text-[13px] font-semibold text-slate-900 text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Eğitmen */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <p className="font-montserrat text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-800 bg-brand-50 px-4 py-2.5 border-b border-brand-100">
                  Eğitmen
                </p>
                <div className="p-4">
                  <InstructorLink className="flex items-center gap-3 group">
                    <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                      <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                      <AvatarFallback className="bg-brand-100 text-brand-800 font-bold text-[16px]">
                        {instructorFullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-bold text-slate-900 group-hover:text-brand-800 transition-colors truncate">
                        {instructorFullName}
                      </span>
                      <span className="block text-[12.5px] text-slate-500 truncate">
                        {Number(course.instructor_total_students || course.instructor_students || 0).toLocaleString('tr-TR')} öğrenci
                        {' · '}
                        {course.instructor_course_count || course.instructor_courses || 1} kurs
                      </span>
                    </span>
                  </InstructorLink>

                  <p className="text-[13px] text-slate-600 leading-[1.7] mt-3 line-clamp-4 whitespace-pre-wrap break-words">
                    {instructorBio}
                  </p>

                  {instructorSlug && (
                    <Link
                      to={`/user/${instructorSlug}`}
                      className="inline-block text-[12.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-3"
                    >
                      Profili gör
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Tüm değerlendirmeler penceresi */}
      <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 rounded-xl overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-200">
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
          <div className="max-h-[70vh] overflow-y-auto px-6 divide-y divide-slate-200">
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
const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('mb-5', className)}>
    <h2 className="font-montserrat text-[19px] font-extrabold text-slate-900 tracking-[-0.02em]">
      {children}
    </h2>
    <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2" />
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

/** İlgili kurslar şeridindeki küçük dikey kart. */
const MiniCourseCard: React.FC<{ course: any; className?: string }> = ({ course, className }) => (
  <Link
    to={`/course/${course.slug || course.course_id || course.id}`}
    target="_blank"
    rel="noopener"
    className={cn(
      'group shrink-0 snap-start bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col transition-colors hover:border-brand-300',
      className
    )}
  >
    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
      <img
        src={getCourseImageUrl(course.course_id ?? course.id, course.image)}
        alt={course.title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="p-2.5 flex flex-col flex-1">
      <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-800 transition-colors">
        {course.title}
      </h3>
      <p className="text-[11.5px] text-slate-400 truncate mt-1">{course.instructor_name}</p>
      <p className="text-[14px] font-bold text-slate-900 mt-auto pt-2">
        {Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
      </p>
    </div>
  </Link>
);

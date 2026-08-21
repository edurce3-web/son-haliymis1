import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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

  /**
   * Eylem şeridi görünürlüğü.
   *
   * Şerit ekrandan çıktığında alttaki yapışkan satın alma çubuğu beliriyor.
   * Kaydırma dinlemek yerine gözlemci kullanılıyor; her karede hesap yapmıyor.
   */
  const actionBarRef = useRef<HTMLElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

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
    const el = actionBarRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [courseId]);

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

  const currentLesson = selectedLesson || course.sections?.[0]?.lessons?.[0];
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

  /** Oynat düğmesi tanıtım videosu yoksa ilk ücretsiz dersi açar. */
  const firstPreviewLesson = allLessons.find((l: any) => l.preview || l.is_free) || null;
  const hasAnyPreview = Boolean(course.preview_video || firstPreviewLesson);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24">
      {/*
        Üst şerit: oynatıcı ortada ve geniş.

        Yaygın "solda metin, sağda yapışkan satın alma kartı" düzeni yerine
        içerik yatay katmanlar hâlinde diziliyor: önce video, sonra başlık,
        sonra eylem şeridi. Satın alma, şerit ekrandan çıkınca alttaki
        yapışkan çubukta görünmeye devam ediyor.
      */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex items-center text-[13px] text-slate-500 gap-2 py-5 overflow-hidden whitespace-nowrap">
            {categorySlug ? (
              <Link to={`/courses/${categorySlug}`} className="hover:text-brand-800 transition-colors truncate max-w-[180px]">
                {course.category_name}
              </Link>
            ) : (
              <span className="truncate max-w-[180px]">{course.category_name || 'Kategori'}</span>
            )}
            {course.subcategory_name && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                {categorySlug && subcategorySlug ? (
                  <Link
                    to={`/courses/${categorySlug}/${subcategorySlug}`}
                    className="hover:text-brand-800 transition-colors truncate max-w-[180px]"
                  >
                    {course.subcategory_name}
                  </Link>
                ) : (
                  <span className="truncate max-w-[180px]">{course.subcategory_name}</span>
                )}
              </>
            )}
          </nav>
          <div className="pb-8 max-w-4xl">
          <h1 className="text-[28px] sm:text-[34px] lg:text-[38px] font-bold text-slate-900 leading-[1.15] tracking-[-0.02em] break-words max-w-4xl">
            {course.title}
          </h1>

          {course.short_description && (
            <p className="text-[17px] text-slate-600 leading-[1.65] mt-4 max-w-3xl break-words">
              {course.short_description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-[14px] text-slate-500">
            {Number(course.rating) > 0 && (
              <span className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-[15px]">
                  {Number(course.rating).toFixed(1)}
                </span>
                <span className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-3.5 h-3.5',
                        i < Math.round(Number(course.rating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'
                      )}
                    />
                  ))}
                </span>
                <span>({reviewsCount})</span>
              </span>
            )}

            <span>
              <span className="font-semibold text-slate-900">
                {Number(course.student_count || 0).toLocaleString('tr-TR')}
              </span>{' '}
              öğrenci
            </span>

            <span>{totalLessons} ders · {totalDurationLabel}</span>
            <span>{levelLabel}</span>

            <span>
              Son güncelleme{' '}
              {new Date(course.updated_at || Date.now()).toLocaleDateString('tr-TR', {
                month: 'long', year: 'numeric',
              })}
            </span>

            <InstructorLink className="flex items-center gap-2.5 group ml-auto">
              <Avatar className="w-8 h-8 ring-1 ring-slate-200">
                <AvatarImage src={instructorAvatar} alt={instructorFullName} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xs">
                  {instructorFullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-slate-800 group-hover:text-brand-800 transition-colors">
                {instructorFullName}
              </span>
            </InstructorLink>
          </div>
          </div>


          <div className="max-w-4xl pb-10">
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] group">
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
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/75 to-transparent px-4 pt-3 pb-10 pointer-events-none">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">
                        Ücretsiz önizleme
                      </p>
                      <p className="text-sm font-medium text-white truncate pr-12">{previewLesson.title}</p>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoPlaying(false);
                      setPreviewLesson(null);
                      videoRef.current?.pause();
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (course.preview_video) setIsVideoPlaying(true);
                    else if (firstPreviewLesson) openLessonPreview(firstPreviewLesson);
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
                  <span className="absolute inset-0 bg-black/40" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {hasAnyPreview ? (
                      <>
                        <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                          <Play className="w-6 h-6 text-brand-800 fill-brand-800 ml-0.5" />
                        </span>
                        <span className="text-white text-[14px] font-semibold">Bu kursu önizle</span>
                      </>
                    ) : (
                      <span className="text-white/80 text-[14px]">Bu kurs için önizleme eklenmemiş</span>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Eylem şeridi — fiyat, butonlar ve kupon tek satırda */}
      <section ref={actionBarRef} className="bg-gradient-to-b from-brand-50/60 to-white border-y border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl py-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="lg:w-56 shrink-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-montserrat text-[32px] font-extrabold text-slate-900 tracking-[-0.03em] leading-none">
                  {appliedCoupon
                    ? formatPrice(appliedCoupon.discount_price)
                    : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
                </span>
                {appliedCoupon ? (
                  <span className="text-[16px] text-slate-400 line-through">
                    {formatPrice(Number(course.price))}
                  </span>
                ) : Number(course.original_price) > Number(course.price) ? (
                  <span className="text-[16px] text-slate-400 line-through">
                    {formatPrice(Number(course.original_price))}
                  </span>
                ) : null}
              </div>
              <p className="text-[13px] text-slate-500 mt-1.5">KDV dahil · Tek ödeme</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 lg:flex-1">
              <Button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="h-12 px-8 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold"
              >
                {addToCartMutation.isPending ? 'Ekleniyor…' : 'Sepete ekle'}
              </Button>
              <Button
                variant="outline"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="h-12 px-8 rounded-lg border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[15px] font-semibold"
              >
                Hemen satın al
              </Button>
            </div>

            <div className="flex gap-2 lg:w-72 shrink-0">
              <Input
                placeholder="Kupon kodu"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="h-12 rounded-lg text-[14px] font-mono tracking-wider"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <Button
                  variant="ghost"
                  className="h-12 px-4 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[13px] font-semibold shrink-0"
                  onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                >
                  Kaldır
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-12 px-5 rounded-lg text-[13px] font-semibold shrink-0"
                  disabled={!couponCode || couponLoading}
                  onClick={async () => {
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
                  }}
                >
                  {couponLoading ? '…' : 'Uygula'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Künye şeridi — kurs özeti yatay bantta, ayrı bir kart gerekmiyor */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {[
              { label: 'Ders', value: `${totalLessons}` },
              { label: 'Toplam süre', value: totalDurationLabel },
              { label: 'Seviye', value: levelLabel },
              { label: 'Dil', value: (course.language || 'tr').toUpperCase() },
              { label: 'Erişim', value: 'Ömür boyu' },
              { label: 'Sertifika', value: 'Var' },
            ].map(item => (
              <div key={item.label} className="py-5 sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <dt className="font-montserrat text-[10px] uppercase tracking-[0.14em] text-slate-400 font-extrabold">
                  {item.label}
                </dt>
                <dd className="text-[17px] font-semibold text-slate-900 mt-2">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/*
        İçerik: solda yapışkan bölüm dizini, sağda uzun sayfa.

        Sekme kullanılmıyor. Sekmeler içeriği gizler ve arama motoru yalnızca
        ilk sekmeyi görür; burada tüm bölümler tek sayfada, soldaki dizin
        okunan bölümü işaretliyor.
      */}
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 py-12">
          <nav className="lg:w-56 shrink-0 order-2 lg:order-1" aria-label="Bu sayfada">
            <div className="lg:sticky lg:top-8">
              <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-4">
                Bu sayfada
              </p>
              <ol className="border-l border-slate-200">
                {PAGE_SECTIONS.map(section => {
                  const active = activeSection === section.id;
                  return (
                    <li key={section.id} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          'absolute -left-px top-1 bottom-1 w-[2px] rounded-full transition-opacity',
                          active ? 'bg-brand-700 opacity-100' : 'opacity-0'
                        )}
                      />
                      <a
                        href={`#${section.id}`}
                        className={cn(
                          'block pl-5 pr-2 py-2 text-[14px] transition-colors',
                          active ? 'text-brand-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
                        )}
                      >
                        {section.label}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>

          <div className="flex-1 min-w-0 max-w-3xl order-1 lg:order-2">
            <div>

              {/* OVERVIEW TAB */}
              <section id="genel-bakis" className="scroll-mt-24 space-y-12">

                {/* Neler öğreneceksiniz */}
                <div className="bg-white rounded-xl border border-slate-200 p-7 md:p-8">
                  <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
                    Neler öğreneceksiniz
                  </h2>
                  <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3 mb-6" />
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {(Array.isArray(course.what_you_learn) ? course.what_you_learn : (course.what_you_learn || "").split(';'))
                      .filter((item: string) => item && item.trim())
                      .map((item: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start">
                          <Check className="w-4 h-4 text-brand-700 stroke-[3] mt-1 shrink-0" />
                          <span className="text-slate-700 leading-[1.7] break-words text-[15px]">{item}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Kurs açıklaması */}
                <section>
                  <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">Kurs hakkında</h2>
                  <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3 mb-6" />
                  <div className="text-[16px] text-slate-600 leading-[1.85] break-words whitespace-pre-wrap">
                    {course.description}
                  </div>
                </section>
              </section>

              {/* CURRICULUM TAB */}
              <section id="mufredat" className="scroll-mt-24 space-y-6 pt-16 mt-16 border-t border-slate-200">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">Müfredat</h2>
                    <p className="text-[14px] text-slate-500">
                      {course.sections?.length || 0} bölüm · {totalLessons} ders · {totalDurationLabel}
                    </p>
                  </div>
                  <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3" />
                </div>

                <div className="space-y-3">
                  {course.sections?.map((section: any, idx: number) => (
                    <div key={section.id ?? section.section_id ?? idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors hover:border-brand-200">
                      <div className="bg-slate-50/70 px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-200">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="font-montserrat text-[12px] font-extrabold text-brand-700 tabular-nums shrink-0">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="text-[15px] font-semibold text-slate-900 leading-snug truncate">
                            {section.title}
                          </span>
                        </div>
                        <span className="text-[13px] text-slate-500 shrink-0 whitespace-nowrap">
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
                              className={cn(
                                'group/lesson flex items-center justify-between gap-4 px-5 py-3.5 transition-colors',
                                isPreview ? 'hover:bg-brand-50/60 cursor-pointer' : 'hover:bg-slate-50'
                              )}
                              onClick={() => isPreview ? openLessonPreview(lesson) : setSelectedLesson(lesson)}
                            >
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <Play
                                  className={cn(
                                    'w-3.5 h-3.5 shrink-0',
                                    isPreview ? 'text-brand-700' : 'text-slate-300'
                                  )}
                                  fill="currentColor"
                                />
                                <span className="text-[15px] text-slate-700 group-hover/lesson:text-slate-900 transition-colors truncate">
                                  {lesson.title}
                                </span>
                                {isPreview && (
                                  <span className="shrink-0 text-[12px] font-semibold text-brand-800 bg-brand-50 border border-brand-200 rounded px-2 py-0.5">
                                    {previewLoading === lessonId ? 'Açılıyor…' : 'Önizle'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[13px] text-slate-400 tabular-nums min-w-[46px] text-right shrink-0">
                                {seconds
                                  ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
                                  : '00:00'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="egitmen" className="scroll-mt-24 pt-16 mt-16 border-t border-slate-200">
                <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
                  Eğitmen
                </h2>
                <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3 mb-8" />

                <div className="flex flex-col sm:flex-row gap-6">
                  <InstructorLink className="shrink-0">
                    <Avatar className="w-24 h-24 ring-1 ring-slate-200">
                      <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-slate-100 text-slate-500 font-semibold">
                        {instructorFullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </InstructorLink>

                  <div className="min-w-0 flex-1">
                    <InstructorLink className="inline-block group">
                      <h3 className="text-[20px] font-bold text-slate-900 group-hover:text-brand-800 transition-colors">
                        {instructorFullName}
                      </h3>
                    </InstructorLink>
                    <p className="text-[14px] text-slate-500 mt-0.5">
                      {course.instructor_title || 'Eğitmen'}
                    </p>

                    <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-[14px]">
                      <span>
                        <span className="font-semibold text-slate-900">
                          {Number(course.instructor_total_students || course.instructor_students || 0).toLocaleString('tr-TR')}
                        </span>
                        <span className="text-slate-500"> öğrenci</span>
                      </span>
                      <span>
                        <span className="font-semibold text-slate-900">
                          {course.instructor_course_count || course.instructor_courses || 1}
                        </span>
                        <span className="text-slate-500"> kurs</span>
                      </span>
                      {Number(course.instructor_avg_rating || course.rating || 0) > 0 && (
                        <span>
                          <span className="font-semibold text-slate-900">
                            {Number(course.instructor_avg_rating || course.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-slate-500"> ortalama puan</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[15px] text-slate-600 leading-[1.8] mt-5 whitespace-pre-wrap break-words">
                      {instructorBio}
                    </p>

                    {instructorExpertiseArray.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        {instructorExpertiseArray.map((exp: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[13px] text-slate-600 border border-slate-200 rounded-full px-3 py-1"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {/* REVIEWS TAB */}
              <section id="degerlendirmeler" className="scroll-mt-24 pt-16 mt-16 border-t border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
                    Değerlendirmeler
                  </h2>
                  {reviewsCount > 0 && (
                    <p className="text-[14px] text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {Number(course.rating || 0).toFixed(1)}
                      </span>{' '}
                      ortalama · {reviewsCount} değerlendirme
                    </p>
                  )}
                </div>
                <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3 mb-8" />

                {reviewsList.length > 0 ? (
                  <div className="divide-y divide-slate-200 border-y border-slate-200">
                    {reviewsList.map((review: any) => (
                      <article key={review.review_id} className="py-6">
                        <div className="flex items-center gap-3.5">
                          <Avatar className="w-10 h-10 ring-1 ring-slate-200">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-[15px]">
                              {review.reviewer_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-[15px] text-slate-900 truncate">
                              {review.reviewer_name}
                            </h4>
                            <div className="flex items-center gap-2.5 mt-1">
                              <span className="flex gap-0.5">
                                {[...Array(5)].map((_, starIdx) => (
                                  <Star
                                    key={starIdx}
                                    className={cn(
                                      'w-3.5 h-3.5',
                                      starIdx < Number(review.rating || 0)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200 fill-slate-200'
                                    )}
                                  />
                                ))}
                              </span>
                              <span className="text-[13px] text-slate-400">
                                {new Date(review.created_at).toLocaleDateString('tr-TR', {
                                  day: 'numeric', month: 'long', year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-600 text-[15px] leading-[1.8] mt-4">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl py-14 px-6 text-center">
                    <p className="text-[16px] font-semibold text-slate-800">Henüz değerlendirme yok</p>
                    <p className="text-[15px] text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      Bu kursu tamamlayan ilk değerlendirmeyi siz bırakabilirsiniz.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>


      {/* Eğitmenin diğer kursları */}
      <CourseRail
        title={`${instructorFullName} eğitmenin diğer kursları`}
        subtitle="Aynı eğitmenden devam edebileceğin eğitimler"
        courses={suggestions?.instructorCourses}
        moreHref={instructorSlug ? `/user/${instructorSlug}` : undefined}
        moreLabel="Eğitmen profilini gör"
      />

      {/* Benzer kurslar */}
      <CourseRail
        title="Bu kursla ilgili diğer kurslar"
        subtitle={course.subcategory_name
          ? `${course.subcategory_name} alanındaki popüler eğitimler`
          : 'Aynı alandaki popüler eğitimler'}
        courses={suggestions?.relatedCourses}
        moreHref={categorySlug ? `/courses/${categorySlug}` : '/courses'}
        moreLabel="Tümünü gör"
        tinted
      />

      {/*
        Yapışkan satın alma çubuğu.

        Eylem şeridi ekrandan çıktığı anda beliriyor; kullanıcı müfredatı
        okurken fiyatı ve butonu kaybetmesin diye. Şerit görünürken
        gizleniyor, iki kez aynı şeyi göstermenin anlamı yok.
      */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300',
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-4">
          <div className="min-w-0 flex-1 hidden sm:block">
            <p className="text-[14px] font-semibold text-slate-900 truncate">{course.title}</p>
            <p className="text-[13px] text-slate-500 truncate">
              {totalLessons} ders · {totalDurationLabel}
            </p>
          </div>

          <span className="text-[20px] font-bold text-slate-900 whitespace-nowrap">
            {appliedCoupon
              ? formatPrice(appliedCoupon.discount_price)
              : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
          </span>

          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="h-11 px-6 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold shrink-0"
          >
            Sepete ekle
          </Button>
          <Button
            variant="outline"
            onClick={handleEnroll}
            disabled={enrollMutation.isPending}
            className="h-11 px-6 rounded-lg border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[15px] font-semibold shrink-0 hidden md:inline-flex"
          >
            Hemen satın al
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Kurs detay sayfasının altındaki yatay kurs şeridi.
 *
 * Mobilde kaydırılıyor, masaüstünde ızgaraya oturuyor. Liste boşsa hiç
 * basılmıyor — boş bir başlık sayfayı yarım gösteriyor.
 */
const CourseRail: React.FC<{
  title: string;
  subtitle?: string;
  courses?: any[];
  moreHref?: string;
  moreLabel?: string;
  tinted?: boolean;
}> = ({ title, subtitle, courses, moreHref, moreLabel, tinted }) => {
  if (!courses?.length) return null;

  return (
    <section className={cn('border-t border-slate-200', tinted ? 'bg-slate-50' : 'bg-white')}>
      <div className="container mx-auto px-4 py-14 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-montserrat text-[22px] lg:text-[26px] font-extrabold text-slate-900 tracking-[-0.02em]">
              {title}
            </h2>
            <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-3" />
            {subtitle && (
              <p className="text-[15px] text-slate-500 mt-3">{subtitle}</p>
            )}
          </div>
          {moreHref && (
            <Link
              to={moreHref}
              className="text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline shrink-0"
            >
              {moreLabel || 'Tümünü gör'}
            </Link>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
          {courses.map((c: any) => (
            <Link
              key={c.course_id ?? c.id}
              to={`/course/${c.slug || c.course_id || c.id}`}
              className="group w-[280px] shrink-0 md:w-auto snap-start bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-brand-300 hover:shadow-[0_14px_32px_-16px_rgba(23,93,93,0.4)] transition-all duration-200"
            >
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src={getCourseImageUrl(c.course_id ?? c.id, c.image)}
                  alt={c.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                {c.subcategory_name && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#175D5D] mb-2 truncate">
                    {c.subcategory_name}
                  </p>
                )}
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-800 transition-colors">
                  {c.title}
                </h3>
                <p className="text-[13px] text-slate-500 mt-1 truncate">{c.instructor_name}</p>

                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <span className="text-[16px] font-bold text-slate-900">
                    {Number(c.price) > 0 ? formatPrice(Number(c.price)) : 'Ücretsiz'}
                  </span>
                  {Number(c.review_count) > 0 && (
                    <span className="text-xs text-slate-500">
                      {Number(c.rating).toFixed(1)} · {c.review_count} yorum
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

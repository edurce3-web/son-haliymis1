import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  // Kupon alani varsayilan olarak kapali; cubugu kalabaliklastirmasin
  const [showCoupon, setShowCoupon] = useState(false);


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
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/*
        Sayfa tek sütun bir "künye" ile açılıyor: başlık, özet, teknik satır,
        ardından geniş oynatıcı. Hemen altındaki satın alma çubuğu üst menünün
        altına yapışıyor; böylece aşağı inildiğinde fiyat ve buton ekranda
        kalıyor, ayrı bir yüzen kart ya da alt çubuk gerekmiyor.
      */}
      <div className="container mx-auto px-4 max-w-5xl">
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

        <h1 className="font-montserrat text-[27px] sm:text-[33px] font-extrabold text-slate-900 leading-[1.15] tracking-[-0.025em] break-words">
          {course.title}
        </h1>

        {course.short_description && (
          <p className="text-[16px] text-slate-600 leading-[1.6] mt-3 max-w-3xl break-words">
            {course.short_description}
          </p>
        )}

        {/* Teknik satır — tek satırda tüm ölçüler */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[13.5px] text-slate-500">
          {reviewsCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-amber-600 tabular-nums">
                {Number(course.rating || 0).toFixed(1)}
              </span>
              <StarRating rating={Number(course.rating || 0)} />
              <span>({reviewsCount})</span>
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>{Number(course.student_count || 0).toLocaleString('tr-TR')} öğrenci</span>
          <span className="text-slate-300">·</span>
          <span>{totalLessons} ders</span>
          <span className="text-slate-300">·</span>
          <span>{totalDurationLabel}</span>
          <span className="text-slate-300">·</span>
          <span>{levelLabel}</span>
          <span className="text-slate-300">·</span>
          <span>{(course.language || 'tr').toUpperCase()}</span>
        </div>

        <InstructorLink className="inline-flex items-center gap-2.5 mt-4 group">
          <Avatar className="w-7 h-7 ring-1 ring-slate-200">
            <AvatarImage src={instructorAvatar} alt={instructorFullName} />
            <AvatarFallback className="bg-slate-100 text-slate-500 text-[11px] font-semibold">
              {instructorFullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[14px] text-slate-500">
            <span className="font-semibold text-slate-800 group-hover:text-brand-800 transition-colors">
              {instructorFullName}
            </span>
            {' · '}
            {new Date(course.updated_at || Date.now()).toLocaleDateString('tr-TR', {
              month: 'long', year: 'numeric',
            })} güncellemesi
          </span>
        </InstructorLink>

        {/* Oynatıcı */}
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mt-6 group">
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
                <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-2.5 pb-8 pointer-events-none">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                    Ücretsiz önizleme
                  </p>
                  <p className="text-[13px] font-medium text-white truncate pr-12">{previewLesson.title}</p>
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
              <span className="absolute inset-0 bg-slate-900/40" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                {hasAnyPreview ? (
                  <>
                    <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 text-brand-800 fill-brand-800 ml-0.5" />
                    </span>
                    <span className="text-white text-[13px] font-semibold">Bu kursu önizle</span>
                  </>
                ) : (
                  <span className="text-white/80 text-[13px]">Önizleme eklenmemiş</span>
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/*
        Satın alma çubuğu. Üst menü 64px, bu yüzden top-16'da yapışıyor —
        sayfayı aşağı kaydırırken fiyat ve butonlar hep görünür kalıyor.
      */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-y border-slate-200 mt-6">
        <div className="container mx-auto px-4 max-w-5xl py-3">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-montserrat text-[24px] sm:text-[27px] font-extrabold text-slate-900 tracking-[-0.03em] leading-none">
                  {appliedCoupon
                    ? formatPrice(appliedCoupon.discount_price)
                    : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
                </span>
                {(appliedCoupon || Number(course.original_price) > Number(course.price)) && (
                  <span className="text-[14px] text-slate-400 line-through">
                    {formatPrice(Number(appliedCoupon ? course.price : course.original_price))}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-slate-400 mt-1 hidden sm:block">
                KDV dahil · Ömür boyu erişim
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              {!showCoupon && !appliedCoupon && (
                <button
                  onClick={() => setShowCoupon(true)}
                  className="hidden sm:inline text-[13px] font-medium text-slate-500 hover:text-brand-800 transition-colors px-2"
                >
                  Kuponum var
                </button>
              )}
              <Button
                variant="outline"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="h-10 px-5 rounded-md border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[14px] font-semibold hidden sm:inline-flex"
              >
                Hemen al
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="h-10 px-6 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[14px] font-semibold"
              >
                {addToCartMutation.isPending ? 'Ekleniyor…' : 'Sepete ekle'}
              </Button>
            </div>
          </div>

          {(showCoupon || appliedCoupon) && (
            <div className="flex items-center gap-2 mt-3 max-w-sm">
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
          )}
        </div>
      </div>

      {/* Gövde: solda bölüm dizini, sağda içerik */}
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex gap-10 lg:gap-14 py-10">
          <nav className="hidden lg:block w-44 shrink-0" aria-label="Bu sayfada">
            <div className="sticky top-36">
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
                          'block pl-4 pr-2 py-1.5 text-[13.5px] transition-colors',
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

          <div className="flex-1 min-w-0">
            {/* ── Genel bakış ─────────────────────────────────────────── */}
            <section id="genel-bakis" className="scroll-mt-36">
              <SectionTitle>Neler öğreneceksiniz</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {(Array.isArray(course.what_you_learn) ? course.what_you_learn : (course.what_you_learn || '').split(';'))
                  .filter((item: string) => item && item.trim())
                  .map((item: string, i: number) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <Check className="w-3.5 h-3.5 text-brand-700 stroke-[3] mt-1.5 shrink-0" />
                      <span className="text-slate-700 leading-[1.65] break-words text-[14.5px]">{item}</span>
                    </div>
                  ))}
              </div>

              {course.description && (
                <>
                  <SectionTitle className="mt-10">Kurs hakkında</SectionTitle>
                  <div className="text-[15.5px] text-slate-600 leading-[1.8] break-words whitespace-pre-wrap">
                    {course.description}
                  </div>
                </>
              )}
            </section>

            {/* ── Müfredat ────────────────────────────────────────────── */}
            <section id="mufredat" className="scroll-mt-36 mt-12 pt-10 border-t border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionTitle className="mb-0">Müfredat</SectionTitle>
                <p className="text-[13.5px] text-slate-500">
                  {course.sections?.length || 0} bölüm · {totalLessons} ders · {totalDurationLabel}
                </p>
              </div>

              <div className="mt-5 border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
                {course.sections?.map((section: any, idx: number) => (
                  <div key={section.id ?? section.section_id ?? idx}>
                    <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-between gap-4">
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
                              'group/lesson flex items-center justify-between gap-3 px-4 py-2.5 transition-colors',
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
                                  {previewLoading === lessonId ? 'Açılıyor…' : 'Önizle'}
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

            {/* ── Eğitmen ─────────────────────────────────────────────── */}
            <section id="egitmen" className="scroll-mt-36 mt-12 pt-10 border-t border-slate-200">
              <SectionTitle>Eğitmen</SectionTitle>

              <div className="flex gap-5">
                <InstructorLink className="shrink-0">
                  <Avatar className="w-16 h-16 ring-1 ring-slate-200">
                    <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                    <AvatarFallback className="text-xl bg-slate-100 text-slate-500 font-semibold">
                      {instructorFullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </InstructorLink>

                <div className="min-w-0 flex-1">
                  <InstructorLink className="inline-block group">
                    <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-brand-800 transition-colors">
                      {instructorFullName}
                    </h3>
                  </InstructorLink>
                  <p className="text-[13.5px] text-slate-500">
                    {course.instructor_title || 'Eğitmen'}
                  </p>

                  <p className="text-[13.5px] text-slate-500 mt-2">
                    {Number(course.instructor_total_students || course.instructor_students || 0).toLocaleString('tr-TR')} öğrenci
                    {' · '}
                    {course.instructor_course_count || course.instructor_courses || 1} kurs
                  </p>

                  <p className="text-[14.5px] text-slate-600 leading-[1.75] mt-3 whitespace-pre-wrap break-words">
                    {instructorBio}
                  </p>

                  {instructorExpertiseArray.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {instructorExpertiseArray.map((exp: string, idx: number) => (
                        <span key={idx} className="text-[12.5px] text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
                          {exp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Değerlendirmeler ────────────────────────────────────── */}
            <section id="degerlendirmeler" className="scroll-mt-36 mt-12 pt-10 border-t border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionTitle className="mb-0">Değerlendirmeler</SectionTitle>
                {reviewsCount > 0 && (
                  <p className="text-[13.5px] text-slate-500">
                    <span className="font-semibold text-slate-900">{Number(course.rating || 0).toFixed(1)}</span>
                    {' '}ortalama · {reviewsCount} değerlendirme
                  </p>
                )}
              </div>

              {reviewsList.length > 0 ? (
                <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {reviewsList.map((review: any) => (
                    <article key={review.review_id} className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 ring-1 ring-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-[13px]">
                            {review.reviewer_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-[14px] text-slate-900 truncate">
                            {review.reviewer_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StarRating rating={Number(review.rating || 0)} />
                            <span className="text-[12.5px] text-slate-400">
                              {new Date(review.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-slate-600 text-[14.5px] leading-[1.75] mt-2.5">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-[14.5px] text-slate-500 mt-4">
                  Bu kurs için henüz değerlendirme yapılmamış.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Eğitmenin diğer kursları */}
      <CourseRail
        title={`${instructorFullName} eğitmenin diğer kursları`}
        courses={suggestions?.instructorCourses}
        moreHref={instructorSlug ? `/user/${instructorSlug}` : undefined}
        moreLabel="Eğitmen profili"
      />

      {/* Benzer kurslar */}
      <CourseRail
        title="Bu kursla ilgili diğer kurslar"
        courses={suggestions?.relatedCourses}
        moreHref={categorySlug ? `/courses/${categorySlug}` : '/courses'}
        moreLabel="Tümünü gör"
        tinted
      />
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
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="inline-flex items-center gap-[1px]" aria-label={`${rating.toFixed(1)} / 5`}>
    {[0, 1, 2, 3, 4].map(i => {
      const fill = Math.max(0, Math.min(1, rating - i));
      return (
        <span key={i} className="relative w-3.5 h-3.5 shrink-0">
          <Star className="absolute inset-0 w-3.5 h-3.5 text-slate-200 fill-slate-200" />
          {fill > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </span>
          )}
        </span>
      );
    })}
  </span>
);

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
              target="_blank"
              rel="noopener"
              className="group w-[250px] shrink-0 md:w-auto snap-start bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col hover:border-brand-300 transition-colors"
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

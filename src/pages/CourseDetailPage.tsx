import React, { useState, useRef } from 'react';
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
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/preview-lesson/${lessonId}`);
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
    queryKey: ['course-suggestions', courseId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/suggestions?limit=8`);
      if (!res.ok) throw new Error('Öneriler alınamadı');
      return res.json();
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
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

  /** Kart üzerindeki oynat düğmesi tanıtım videosu yoksa bunu açar. */
  const firstPreviewLesson = allLessons.find((l: any) => l.preview || l.is_free) || null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/*
        Kahraman bölümü.

        Düzen bilinçli olarak "bilgi solda, satın alma kartı sağda": kullanıcı
        okurken fiyat ve buton ekranda kalıyor. Kart yapışkan olduğu için
        müfredata inildiğinde de kaybolmuyor.
      */}
      <div className="bg-brand-950 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex items-center text-[13px] text-brand-300 gap-2 py-4 overflow-hidden whitespace-nowrap">
            {course.category_slug ? (
              <Link to={`/courses/${course.category_slug}`} className="hover:text-white transition-colors truncate max-w-[160px]">
                {course.category_name}
              </Link>
            ) : (
              <span className="truncate max-w-[160px]">{course.category_name || 'Kategori'}</span>
            )}
            {course.subcategory_name && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                {course.category_slug && course.subcategory_slug ? (
                  <Link
                    to={`/courses/${course.category_slug}/${course.subcategory_slug}`}
                    className="hover:text-white transition-colors truncate max-w-[160px]"
                  >
                    {course.subcategory_name}
                  </Link>
                ) : (
                  <span className="truncate max-w-[160px]">{course.subcategory_name}</span>
                )}
              </>
            )}
          </nav>

          <div className="grid lg:grid-cols-12 gap-10 pb-14 lg:pb-40 pt-4">
            {/* Sol: kurs bilgisi */}
            <div className="lg:col-span-7 xl:col-span-8">
              <h1 className="text-[30px] sm:text-[38px] lg:text-[42px] font-bold leading-[1.15] tracking-[-0.02em] break-words">
                {course.title}
              </h1>

              {course.short_description && (
                <p className="text-[17px] lg:text-[18px] text-brand-100 leading-[1.65] mt-5 max-w-2xl break-words">
                  {course.short_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7 text-[14px]">
                {Number(course.rating) > 0 && (
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 text-[15px]">
                      {Number(course.rating).toFixed(1)}
                    </span>
                    <span className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < Math.round(Number(course.rating)) ? 'fill-amber-400 text-amber-400' : 'text-brand-700 fill-brand-800'
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-brand-200">({reviewsCount} değerlendirme)</span>
                  </span>
                )}

                <span className="text-brand-200">
                  <span className="font-semibold text-white">
                    {Number(course.student_count || 0).toLocaleString('tr-TR')}
                  </span>{' '}
                  öğrenci
                </span>

                <span className="text-brand-200">
                  Son güncelleme{' '}
                  {new Date(course.updated_at || Date.now()).toLocaleDateString('tr-TR', {
                    month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              <InstructorLink className="inline-flex items-center gap-3 mt-7 group">
                <Avatar className="w-10 h-10 ring-2 ring-brand-800">
                  <AvatarImage src={instructorAvatar} alt={instructorFullName} />
                  <AvatarFallback className="bg-brand-800 text-brand-100 font-semibold text-xs">
                    {instructorFullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-left">
                  <span className="block text-[11px] uppercase tracking-wider text-brand-300">Eğitmen</span>
                  <span className="block font-semibold group-hover:text-brand-200 transition-colors">
                    {instructorFullName}
                  </span>
                </span>
              </InstructorLink>
            </div>
          </div>
        </div>
      </div>

      {/* Satın alma kartı — masaüstünde kahraman bölümüne biniyor */}
      <div className="container mx-auto px-4 max-w-6xl relative z-30">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1 min-w-0 pb-4">
          <Tabs defaultValue="overview" className="w-full">
            {/* Sekme çubuğu sütunun içinde yapışıyor; sayfa boyunca üstte kalır */}
            <TabsList className="sticky top-0 z-20 h-14 w-full justify-start gap-7 bg-[#F8FAFC] p-0 rounded-none border-b border-slate-200 overflow-x-auto no-scrollbar">
              {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-full rounded-none border-b-2 border-transparent px-1 data-[state=active]:border-brand-700 data-[state=active]:bg-transparent data-[state=active]:text-brand-800 data-[state=active]:shadow-none font-semibold text-slate-500 hover:text-slate-900 transition-colors text-[15px] whitespace-nowrap"
                >
                  {{
                    'overview': 'Genel bakış',
                    'curriculum': 'Müfredat',
                    'instructor': 'Eğitmen',
                    'reviews': 'Değerlendirmeler'
                  }[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 4. Tab Contents Container */}
            <div className="py-10">

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-12 animate-in fade-in duration-500 outline-none">

                {/* Neler öğreneceksiniz */}
                <div className="bg-white rounded-xl border border-slate-200 p-7 md:p-8">
                  <h2 className="text-[20px] font-bold text-slate-900 mb-6">
                    Neler öğreneceksiniz
                  </h2>
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
                  <h2 className="text-[20px] font-bold text-slate-900 mb-4">Kurs hakkında</h2>
                  <div className="text-[16px] text-slate-600 leading-[1.85] break-words whitespace-pre-wrap">
                    {course.description}
                  </div>
                </section>
              </TabsContent>

              {/* CURRICULUM TAB */}
              <TabsContent value="curriculum" className="space-y-6 animate-in fade-in duration-500 outline-none">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-[20px] font-bold text-slate-900">Müfredat</h2>
                  <p className="text-[14px] text-slate-500">
                    {course.sections?.length || 0} bölüm · {totalLessons} ders · {totalDurationLabel}
                  </p>
                </div>

                <div className="space-y-3">
                  {course.sections?.map((section: any, idx: number) => (
                    <div key={section.id ?? section.section_id ?? idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[13px] font-semibold text-slate-400 tabular-nums shrink-0">
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
              </TabsContent>

              {/* INSTRUCTOR TAB */}
              <TabsContent value="instructor" className="animate-in fade-in duration-700 outline-none">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-1 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                  <div className="bg-slate-50/30 rounded-xl p-8 md:p-12 relative overflow-hidden">

                    <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start relative z-10">
                      <div className="md:col-span-4 flex flex-col items-center">
                        <div className="relative">
                          <InstructorLink className="block">
                            <Avatar className="w-40 h-40 md:w-48 md:h-48 border-8 border-white shadow-xl">
                              <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                              <AvatarFallback className="text-6xl bg-gradient-to-br from-brand-50 to-[#175D5D]/10 text-[#175D5D] font-bold">
                                {instructorFullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </InstructorLink>
                          <div className="absolute -bottom-4 -right-4 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
                            <div className="bg-amber-50 text-amber-600 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              {Number(course.instructor_avg_rating || course.rating || 0).toFixed(1)}
                            </div>
                          </div>
                        </div>

                        <div className="text-center mt-8 w-full space-y-3">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex justify-between items-center text-center">
                            <div className="flex-1 border-r border-slate-100 last:border-0 px-2">
                              <div className="text-2xl font-bold text-slate-800">{(course.instructor_total_students || course.instructor_students || 0).toLocaleString()}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Öğrenci</div>
                            </div>
                            <div className="flex-1 px-2">
                              <div className="text-2xl font-bold text-slate-800">{course.instructor_course_count || course.instructor_courses || '1'}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Kurs</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-8">
                        <div>
                          <p className="text-[#175D5D] font-bold text-sm tracking-widest uppercase mb-2">{course.instructor_title || 'Uzman Eğitmen'}</p>
                          <InstructorLink className="inline-block">
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight hover:text-[#175D5D] transition-colors">
                              {instructorFullName}
                            </h3>
                          </InstructorLink>
                          {instructorSlug && (
                            <Link
                              to={`/user/${instructorSlug}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[#175D5D] hover:gap-2 transition-all mt-3"
                            >
                              Profili ve tüm kursları
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-[#175D5D]" />
                            Eğitmen Hakkında
                          </h4>
                          <div className="prose prose-slate prose-lg text-slate-600 leading-[1.8] font-medium max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
                            {instructorBio}
                          </div>
                        </div>

                        {instructorExpertiseArray.length > 0 && (
                          <div className="pt-6 border-t border-slate-200/60">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Uzmanlık & Yetkinlikler</h4>
                            <div className="flex flex-wrap gap-2.5">
                              {instructorExpertiseArray.map((exp: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="bg-white border hover:bg-slate-50 border-slate-200 text-slate-600 py-1.5 px-4 text-[13px] font-bold rounded-xl shadow-sm">
                                  {exp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* REVIEWS TAB */}
              <TabsContent value="reviews" className="animate-in fade-in duration-700 outline-none max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900">Öğrenci Değerlendirmeleri</h3>
                    <p className="text-slate-500 font-medium mt-2">Bu kurs hakkında öğrenciler ne düşünüyor?</p>
                  </div>
                  <div className="text-sm font-bold bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl flex items-center gap-2 border border-amber-100 shadow-sm">
                    <Star className="w-5 h-5 fill-current" />
                    {reviewsCount} Değerlendirme
                  </div>
                </div>

                {reviewsList.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {reviewsList.map((review: any) => (
                      <div key={review.review_id} className="bg-white p-8 rounded-2xl border border-slate-200/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4 items-center">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-md ring-1 ring-slate-100">
                              <AvatarFallback className="bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 font-bold text-lg">
                                {review.reviewer_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-bold text-[16px] text-slate-900">{review.reviewer_name}</h4>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, starIdx) => (
                                  <Star key={starIdx} className={cn("w-4 h-4", starIdx < Number(review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200")} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-slate-600 text-[15px] leading-[1.8] font-medium relative z-10">
                          "{review.comment}"
                        </p>
                      </div>
                    ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Henüz değerlendirme yok</h3>
                    <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">Bu kurs için henüz bir değerlendirme yapılmamış. İlk değerlendiren siz olun!</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 lg:-mt-[21rem] -mt-8 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)]">
              {/* Önizleme alanı */}
              <div className="relative aspect-video bg-slate-900 group">
                {isVideoPlaying && (previewLesson || course.preview_video) ? (
                  <>
                    {previewLesson?.video_type === 'hls' ? (
                      <HLSVideoPlayer
                        key={previewLesson.lesson_id}
                        src={previewLesson.video_url}
                        videoType="hls"
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
                      else toast.info('Bu kurs için önizleme bulunmuyor');
                    }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={getCourseImageUrl(course.course_id || course.id, course.thumbnail || course.image_url || course.image_path)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                    />
                    {(course.preview_video || firstPreviewLesson) && (
                      <>
                        <span className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors" />
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Play className="w-6 h-6 text-brand-800 fill-brand-800 ml-0.5" />
                          </span>
                          <span className="text-white text-[13px] font-semibold">
                            Bu kursu önizle
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* Fiyat */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[32px] font-bold text-slate-900 tracking-tight">
                    {appliedCoupon
                      ? formatPrice(appliedCoupon.discount_price)
                      : Number(course.price) > 0 ? formatPrice(Number(course.price)) : 'Ücretsiz'}
                  </span>
                  {appliedCoupon ? (
                    <span className="text-[17px] text-slate-400 line-through">
                      {formatPrice(Number(course.price))}
                    </span>
                  ) : Number(course.original_price) > Number(course.price) ? (
                    <>
                      <span className="text-[17px] text-slate-400 line-through">
                        {formatPrice(Number(course.original_price))}
                      </span>
                      <span className="text-[13px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5">
                        %{course.discount_percentage
                          || Math.round((1 - Number(course.price) / Number(course.original_price)) * 100)} indirim
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="text-[13px] text-slate-500 mt-1.5">
                  KDV dahil · Tek seferlik ödeme
                </p>

                {/* Eylemler */}
                <div className="mt-5 space-y-2.5">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                    className="w-full h-12 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold"
                  >
                    {addToCartMutation.isPending ? 'Ekleniyor…' : 'Sepete ekle'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="w-full h-12 rounded-lg border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[15px] font-semibold"
                  >
                    Hemen satın al
                  </Button>
                </div>

                {/* Kupon */}
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Kupon kodu"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-10 rounded-lg text-[14px] font-mono tracking-wider"
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="ghost"
                      className="h-10 px-4 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[13px] font-semibold shrink-0"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    >
                      Kaldır
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-10 px-5 rounded-lg text-[13px] font-semibold shrink-0"
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

                {/* Kursun içeriği */}
                <dl className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-[14px]">
                  {[
                    { label: 'Ders sayısı', value: `${totalLessons} ders` },
                    { label: 'Toplam süre', value: totalDurationLabel },
                    { label: 'Seviye', value: levelLabel },
                    { label: 'Dil', value: (course.language || 'tr').toUpperCase() },
                    { label: 'Erişim', value: 'Ömür boyu' },
                    { label: 'Sertifika', value: 'Bitirme sertifikası' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">{row.label}</dt>
                      <dd className="font-semibold text-slate-900 text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
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
        moreHref={course.category_slug ? `/courses/${course.category_slug}` : '/courses'}
        moreLabel="Tümünü gör"
        tinted
      />
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
            <h2 className="text-[22px] lg:text-[26px] font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[15px] text-slate-500 mt-1.5">{subtitle}</p>
            )}
          </div>
          {moreHref && (
            <Link
              to={moreHref}
              className="text-sm font-semibold text-[#175D5D] hover:text-brand-800 hover:underline shrink-0"
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
              className="group w-[280px] shrink-0 md:w-auto snap-start bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-brand-300 hover:shadow-[0_12px_28px_-14px_rgba(13,148,136,0.35)] transition-all duration-200"
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

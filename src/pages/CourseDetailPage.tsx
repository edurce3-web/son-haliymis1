import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { coursesAPI, cartAPI, enrollmentAPI, reviewsAPI, qaAPI, getCourseImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
      const slugRes = await fetch(`/api/courses/slug/${encodeURIComponent(courseIdentifier)}`);
      if (!slugRes.ok) throw new Error('Kurs bulunamadı');
      // The slug endpoint redirects to /api/courses/:id which returns {course: {...}}
      const data = await slugRes.json();
      // If redirect was followed and we got a full course response
      if (data?.course) return data;
      // If for some reason we only got course_id, fetch by ID
      if (data?.course_id) return coursesAPI.getCourse(data.course_id);
      throw new Error('Kurs verisi alınamadı');
    },
    enabled: !!courseIdentifier,
  });

  const courseId = courseData?.course?.id || courseData?.course?.course_id || Number(courseIdentifier) || 0;


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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/* 1. Navbar Area (Breadcrumbs) */}
      <div className="bg-[#111827] border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-gray-400 gap-2 overflow-hidden whitespace-nowrap">
            <span className="hover:text-white cursor-pointer transition-colors max-w-[150px] truncate">{course.category_name || 'Kategori'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span className="hover:text-white cursor-pointer transition-colors max-w-[150px] truncate">{course.subcategory_name || 'Alt Kategori'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span className="text-gray-200 font-bold truncate max-w-[300px]">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* 2. Modern Split Hero Section */}
      <div className="bg-gradient-to-b from-[#111827] to-gray-900 border-b border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-32 w-[500px] h-[500px] bg-teal-900/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -m-32 w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 py-10 lg:py-16 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left Col (5 cols): Media & Preview */}
            <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-900 aspect-video group">

                {/* Video Oynatıcı veya Poster */}
                {isVideoPlaying && course.preview_video ? (
                  <>
                    <video
                      ref={videoRef}
                      src={course.preview_video}
                      className="w-full h-full object-contain bg-black"
                      controls
                      autoPlay
                      playsInline
                      poster={getCourseImageUrl(course.course_id || course.id, course.thumbnail || course.image_url || course.image_path)}
                      onEnded={() => setIsVideoPlaying(false)}
                      onError={(e) => {
                        console.error('Video yükleme hatası:', e);
                        toast.error('Video yüklenemedi');
                        setIsVideoPlaying(false);
                      }}
                    />
                    {/* Video Kapat Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoPlaying(false);
                        if (videoRef.current) {
                          videoRef.current.pause();
                        }
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10 border border-white/10"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Poster Görseli */}
                    <img
                      src={getCourseImageUrl(course.course_id || course.id, course.thumbnail || course.image_url || course.image_path)}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-75"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-course.jpg';
                      }}
                    />

                    {/* Play Butonu - Ortada */}
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (course.preview_video) {
                          setIsVideoPlaying(true);
                        } else {
                          toast.info('Bu kurs için önizleme videosu bulunmuyor');
                        }
                      }}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110 shadow-xl border border-white/30",
                        course.preview_video && "hover:bg-white/30"
                      )}>
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>

                    {/* Önizlemeyi Başlat Butonu - Sol Alt */}
                    <div className="absolute bottom-4 left-4">
                      <button
                        onClick={() => {
                          if (course.preview_video) {
                            setIsVideoPlaying(true);
                          } else {
                            toast.info('Bu kurs için önizleme videosu bulunmuyor');
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/10 transition-colors",
                          course.preview_video ? "hover:bg-black/80 cursor-pointer" : "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {course.preview_video ? 'Önizlemeyi Başlat' : 'Önizleme Yok'}
                      </button>
                    </div>

                    {/* Video varsa ses ikonu göster */}
                    {course.preview_video && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                          <Volume2 className="w-3 h-3 text-white/80" />
                          <span className="text-[10px] font-bold text-white/80">Video</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between px-2 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>30 Gün İade Garantisi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <InfIcon className="w-4 h-4 text-indigo-500" />
                  <span>Ömür Boyu Tam Erişim</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>Mobil ve TV</span>
                </div>
              </div>
            </div>

            {/* Right Col (7 cols): Course Info & Actions */}
            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-teal-500/20 px-3 py-1 rounded-full font-semibold">
                    {course.subcategory_name || 'Geliştirme'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Son güncelleme: {new Date(course.updated_at || Date.now()).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                <h1 className="text-4xl lg:text-[2.75rem] font-black text-white leading-[1.1] tracking-tight break-words overflow-hidden">
                  {course.title}
                </h1>

                {course.short_description && (
                  <div className="relative mt-6 mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-900/40 to-gray-800/40 rounded-2xl blur-lg opacity-80 pointer-events-none"></div>
                    <p className="relative text-[1.15rem] lg:text-xl text-gray-300 font-medium leading-[1.6] break-words overflow-hidden border-l-4 border-teal-500 pl-5 py-1">
                      {course.short_description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-yellow-400">{parseFloat(course.rating || 0).toFixed(1)}</span>
                    <div className="flex flex-col text-xs font-medium">
                      <div className="flex gap-0.5 mb-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(Number(course.rating || 0)) ? "fill-yellow-400 text-yellow-400" : "text-gray-600 fill-gray-700")} />
                        ))}
                      </div>
                      <span className="text-gray-400 underline decoration-gray-600">({reviewsCount} değerlendirme)</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-700 hidden sm:block"></div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-lg">{course.student_count?.toLocaleString() || 0}</span>
                    <span className="text-sm text-gray-400">Öğrenci</span>
                  </div>

                  <div className="h-8 w-px bg-gray-700 hidden sm:block"></div>

                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Avatar className="w-9 h-9 border-2 border-gray-700 shadow-sm">
                      <AvatarImage src={instructorAvatar} alt={instructorFullName} />
                      <AvatarFallback className="bg-gray-800 text-gray-300 font-bold text-xs">
                        {instructorFullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Eğitmen</div>
                      <div className="font-bold text-white group-hover:text-teal-400 transition-colors">{instructorFullName}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card (Inline Style) */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -z-10"></div>

                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    {appliedCoupon ? (
                      <>
                        <span className="text-4xl font-black text-white tracking-tighter">
                          ₺{appliedCoupon.discount_price.toFixed(2)}
                        </span>
                        <div className="flex flex-col leading-none">
                          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {Math.max(0, parseFloat(course.price) - appliedCoupon.discount_price).toFixed(2)}₺ kupon indirimi
                          </span>
                          <span className="text-gray-500 line-through text-lg font-medium">₺{course.price}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-white tracking-tighter">₺{course.price}</span>
                        {Number(course.original_price) > 0 && Number(course.original_price) > Number(course.price) && (
                          <div className="flex flex-col leading-none">
                            <span className="text-xs text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              %{course.discount_percentage || Math.round((1 - parseFloat(course.price) / parseFloat(course.original_price)) * 100) || '0'} İndirim
                            </span>
                            <span className="text-gray-500 line-through text-lg font-medium">₺{course.original_price}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium ml-1">KDV Dahil. Tek seferlik ödeme.</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                    className="flex-1 sm:flex-none h-12 px-8 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_rgba(13,148,136,0.2)] font-bold transition-all hover:-translate-y-0.5"
                  >
                    {addToCartMutation.isPending ? '...' : 'Sepete Ekle'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="flex-1 sm:flex-none h-12 px-8 border-2 border-white/20 hover:border-white/40 bg-transparent text-white rounded-xl font-bold transition-all hover:bg-white/5"
                  >
                    Hemen Al
                  </Button>
                </div>
              </div>

              {/* Kupon Girişi */}
              <div className="mt-4 flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Kupon kodunuzu girin"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-10 pl-9 rounded-xl text-sm font-mono font-bold tracking-wider text-white bg-white/5 border-white/10 placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500"
                    disabled={!!appliedCoupon}
                  />
                </div>
                {appliedCoupon ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 px-4 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                  >
                    Kaldır
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(13,148,136,0.2)]"
                    disabled={!couponCode || couponLoading}
                    onClick={async () => {
                      setCouponLoading(true);
                      try {
                        const res = await fetch(`/api/coupons/validate/${couponCode}`);
                        const data = await res.json();
                        if (res.ok && data.valid) {
                          setAppliedCoupon(data.coupon);
                          toast.success(`Kupon uygulandı: Yeni fiyat ₺${data.coupon.discount_price}`);
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
                    {couponLoading ? '...' : 'Uygula'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 max-w-6xl">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-[72px] w-full justify-start gap-8 md:gap-14 bg-transparent p-0 rounded-none overflow-x-auto no-scrollbar">
              {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-full rounded-none border-b-[3px] border-transparent px-2 data-[state=active]:border-[#0D9488] data-[state=active]:bg-transparent data-[state=active]:text-[#0D9488] data-[state=active]:shadow-none font-bold text-slate-500 hover:text-slate-800 transition-all uppercase text-[13px] tracking-widest whitespace-nowrap"
                >
                  {{
                    'overview': 'Genel Bakış',
                    'curriculum': 'Müfredat',
                    'instructor': 'Eğitmen',
                    'reviews': 'Değerlendirmeler'
                  }[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 4. Tab Contents Container */}
            <div className="py-12 md:py-16">

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-16 animate-in fade-in duration-700 outline-none">

                {/* What You'll Learn */}
                <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-50/50 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>

                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-10 flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    Neler Öğreneceksiniz?
                  </h2>
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                    {(Array.isArray(course.what_you_learn) ? course.what_you_learn : (course.what_you_learn || "").split(';')).map((item: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start group/item">
                        <div className="mt-1 w-6 h-6 rounded-full bg-teal-50 shrink-0 flex items-center justify-center group-hover/item:bg-teal-100 transition-colors border border-teal-100 group-hover/item:scale-110 duration-300">
                          <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />
                        </div>
                        <span className="text-slate-700 font-medium leading-[1.7] break-words overflow-hidden text-[15px] group-hover/item:text-slate-900 transition-colors">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description & Details */}
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                  <div className="lg:col-span-8 space-y-16">
                    <section>
                      <h3 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                        Kurs Hakkında
                      </h3>
                      <div className="text-[16px] text-slate-600 leading-[1.9] break-words whitespace-pre-wrap overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                        {course.description}
                      </div>
                    </section>

                    <section className="bg-gradient-to-br from-indigo-50/50 to-white rounded-[2rem] border border-indigo-100/60 p-8 md:p-10 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200">
                          <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900">Kimin İçin Uygun?</h3>
                      </div>
                      <ul className="space-y-4 pl-2 relative z-10">
                        {(Array.isArray(course.target_audience) ? course.target_audience : (course.target_audience || "").split(';')).map((item: string, i: number) => (
                          <li key={i} className="flex gap-4 items-start text-slate-700">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0 ring-4 ring-indigo-50" />
                            <span className="break-words overflow-hidden leading-[1.7] text-[15px] font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-32 space-y-8">
                      {/* Requirements Card */}
                      <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                          <Trophy className="w-6 h-6 text-amber-500" />
                          Gereksinimler
                        </h3>
                        <ul className="space-y-4">
                          {(Array.isArray(course.requirements) ? course.requirements : (course.requirements || "").split(';')).map((item: string, i: number) => (
                            <li key={i} className="text-[15px] text-slate-600 leading-[1.6] pl-4 border-l-[3px] border-amber-200 break-words overflow-hidden relative">
                              <span className="absolute left-[-2.5px] top-2 w-[2px] h-2 bg-amber-400 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Course Features Card */}
                      <div className="bg-white rounded-[2rem] border border-slate-200/60 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                        <div className="bg-slate-50/50 rounded-[1.75rem] p-7">
                          <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                            <Tag className="w-5 h-5 text-slate-500" />
                            Kurs Özellikleri
                          </h3>
                          <div className="space-y-1">
                            {[
                              { icon: <MonitorPlay className="w-[18px] h-[18px]" />, label: 'Toplam Süre', value: course.duration ? `${Math.floor(course.duration / 60)} saat ${course.duration % 60} dk` : 'Belirtilmedi' },
                              { icon: <BookOpen className="w-[18px] h-[18px]" />, label: 'Ders Sayısı', value: `${course.sections?.reduce((a: number, s: any) => a + (s.lessons?.length || 0), 0) || 0} Ders` },
                              { icon: <Download className="w-[18px] h-[18px]" />, label: 'Kaynaklar', value: `${course.downloadable_resources || 0} indirilebilir` },
                              { icon: <Globe className="w-[18px] h-[18px]" />, label: 'Dil', value: <span className="uppercase">{course.language}</span> },
                              { icon: <Award className="w-[18px] h-[18px]" />, label: 'Sertifika', value: <span className="text-[#0D9488] font-bold">Bitirme Sertifikası</span> }
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-center justify-between py-3.5 border-b border-slate-200/60 last:border-0 group">
                                <span className="text-slate-500 flex items-center gap-3 text-[14px] font-medium group-hover:text-slate-700 transition-colors">
                                  {feature.icon} {feature.label}
                                </span>
                                <span className="font-semibold text-slate-900 text-[14px] text-right">
                                  {feature.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* CURRICULUM TAB */}
              <TabsContent value="curriculum" className="space-y-8 animate-in fade-in duration-700 outline-none max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Müfredat</h2>
                    <p className="text-slate-500 text-[15px] mt-2 font-medium">Uzmanlık yolculuğunuzda adım adım ilerleyin.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/50">
                    <div className="text-center px-4 border-r border-slate-200 max-w-[120px]">
                      <div className="text-xl font-black text-[#0D9488] truncate">{course.sections?.length || 0}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Bölüm</div>
                    </div>
                    <div className="text-center px-4 max-w-[150px]">
                      <div className="text-xl font-black text-slate-700 truncate">{course.sections?.reduce((a: number, s: any) => a + (s.lessons?.length || 0), 0) || 0}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Ders</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {course.sections?.map((section: any, idx: number) => (
                    <div key={section.section_id} className="bg-white border border-slate-200/60 rounded-[1.5rem] overflow-hidden hover:border-slate-300 transition-colors shadow-sm group">
                      <div className="bg-slate-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#0D9488] transition-colors"></div>
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[15px] font-black text-slate-400 shadow-sm">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          <span className="text-[17px] font-bold text-slate-800 leading-tight">{section.title}</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0 whitespace-nowrap">
                          {section.lessons?.length || 0} ders
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {section.lessons?.map((lesson: any, lessonIdx: number) => (
                          <div
                            key={lesson.lesson_id || lessonIdx}
                            className="group/lesson flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all cursor-pointer pl-6 md:pl-20 relative"
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>

                            <div className="flex items-center gap-5 flex-1 relative z-10">
                              <div className="w-10 h-10 rounded-full bg-white text-slate-400 group-hover/lesson:bg-[#0D9488] group-hover/lesson:text-white flex items-center justify-center transition-all shadow-sm border border-slate-200 group-hover/lesson:border-[#0D9488]">
                                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                              </div>
                              <span className="text-[15px] text-slate-600 group-hover/lesson:text-slate-900 font-semibold transition-colors">{lesson.title}</span>
                            </div>
                            <div className="text-[13px] text-slate-400 font-medium font-mono min-w-[50px] text-right">
                              {lesson.duration || lesson.duration_seconds || lesson.duration_minutes ?
                                `${Math.floor((lesson.duration || lesson.duration_seconds || lesson.duration_minutes || 0) / 60)}:${((lesson.duration || lesson.duration_seconds || lesson.duration_minutes || 0) % 60).toString().padStart(2, '0')}`
                                : '00:00'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* INSTRUCTOR TAB */}
              <TabsContent value="instructor" className="animate-in fade-in duration-700 outline-none max-w-4xl mx-auto">
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-1 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                  <div className="bg-slate-50/30 rounded-[2.25rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start relative z-10">
                      <div className="md:col-span-4 flex flex-col items-center">
                        <div className="relative">
                          <Avatar className="w-40 h-40 md:w-48 md:h-48 border-8 border-white shadow-xl">
                            <AvatarImage src={instructorAvatar} alt={instructorFullName} className="object-cover" />
                            <AvatarFallback className="text-6xl bg-gradient-to-br from-teal-50 to-[#0D9488]/10 text-[#0D9488] font-black">
                              {instructorFullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
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
                              <div className="text-2xl font-black text-slate-800">{(course.instructor_total_students || course.instructor_students || 0).toLocaleString()}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Öğrenci</div>
                            </div>
                            <div className="flex-1 px-2">
                              <div className="text-2xl font-black text-slate-800">{course.instructor_course_count || course.instructor_courses || '1'}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Kurs</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-8">
                        <div>
                          <p className="text-[#0D9488] font-bold text-sm tracking-widest uppercase mb-2">{course.instructor_title || 'Uzman Eğitmen'}</p>
                          <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{instructorFullName}</h3>
                        </div>

                        <div>
                          <h4 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-[#0D9488]" />
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
                    <h3 className="text-3xl font-extrabold text-slate-900">Öğrenci Değerlendirmeleri</h3>
                    <p className="text-slate-500 font-medium mt-2">Bu kurs hakkında öğrenciler ne düşünüyor?</p>
                  </div>
                  <div className="text-sm font-black bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl flex items-center gap-2 border border-amber-100 shadow-sm">
                    <Star className="w-5 h-5 fill-current" />
                    {reviewsCount} Değerlendirme
                  </div>
                </div>

                {reviewsList.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {reviewsList.map((review: any) => (
                      <div key={review.review_id} className="bg-white p-8 rounded-[2rem] border border-slate-200/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4 items-center">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-md ring-1 ring-slate-100">
                              <AvatarFallback className="bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 font-black text-lg">
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
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200/60 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Henüz değerlendirme yok</h3>
                    <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">Bu kurs için henüz bir değerlendirme yapılmamış. İlk değerlendiren siz olun!</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

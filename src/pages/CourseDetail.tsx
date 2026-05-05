import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Download,
  Play,
  CheckCircle,
  ShoppingCart,
  Gift,
  Globe,
  Award,
  Heart
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useApiData, useApiSubmit } from "@/hooks/useApi";
import api from "@/services/api";

const CourseDetail = () => {
  const { id } = useParams();
  const [favorited, setFavorited] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Backend API calls
  const { data: course, loading: courseLoading, error: courseError } = useApiData(
    () => api.courses.getById(Number(id)),
    [id],
    { immediate: true }
  );

  // Enrollment mutation
  const { submit: enrollCourse, loading: enrollLoading } = useApiSubmit(
    (courseId: number) => api.courses.enroll(courseId),
    {
      onSuccess: () => {
        toast.success('Kursa başarıyla kaydoldunuz!');
        navigate(`/learning/course/${id}`);
      },
      onError: (error) => {
        toast.error('Kayıt sırasında bir hata oluştu!');
      },
      successMessage: 'Kursa kaydolundu!'
    }
  );

  // Bookmark toggle mutation
  const { submit: toggleBookmark, loading: bookmarkLoading } = useApiSubmit(
    (courseId: number) => favorited ? api.bookmarks.remove(courseId) : api.bookmarks.add(courseId),
    {
      onSuccess: () => {
        setFavorited(!favorited);
        toast.success(favorited ? 'Favorilerden çıkarıldı!' : 'Favorilere eklendi!');
      },
      onError: () => {
        toast.error('Favori işlemi sırasında bir hata oluştu!');
      }
    }
  );

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Favorilere eklemek için giriş yapmalısınız!");
      navigate('/login');
      return;
    }
    if (!course?.id) return;
    toggleFavoriteMutation.mutate(course.id);
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const courseId = parseInt(id || "0");
      if (!courseId) return;
      try {
        const res = await fetch(`/api/courses/${courseId}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          // normalize keys to UI expectations
          setCourse({
            id: data.id,
            title: data.title,
            description: data.description,
            instructor: data.instructor,
            rating: data.rating,
            reviews: data.reviews_count || 0,
            duration: data.duration || "",
            image: data.image_url,
            price: data.price,
            originalPrice: data.original_price || data.price,
            category: data.category,
            language: data.language || "Türkçe",
            curriculum: data.curriculum || [],
            books: data.books || [],
          });
        }
      } catch { }
    };
    load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    const courseId = parseInt(id || "0");
    if (!courseId) return;
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`/api/courses/${courseId}/similar`, { signal: controller.signal }),
          fetch(`/api/courses/${courseId}/also-bought`, { signal: controller.signal }),
        ]);
        if (r1.ok) {
          const d1 = await r1.json();
          setSimilar(d1.items || []);
        }
        if (r2.ok) {
          const d2 = await r2.json();
          setAlsoBought(d2.items || []);
        }
      } catch { }
    })();
    return () => controller.abort();
  }, [id]);

  const handleAddToCart = () => {
    toast.success(`"${course?.title}" sepete eklendi!`, {
      description: "Sepetinizi görüntülemek için sağ üst köşedeki sepet ikonuna tıklayın.",
    });
  };

  const handleBuyNow = () => {
    setIsPurchased(true);
    toast.success("Kurs satın alındı!", {
      description: "Artık kursa ve dijital kitaplara erişebilirsiniz.",
    });
  };

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Kurs bulunamadı</h1>
      </div>
    );
  }

  const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  {course.category}
                </Badge>

                <h1 className="text-4xl font-bold leading-tight">
                  {course.title}
                </h1>

                <p className="text-xl text-white/90">
                  {course.description}
                </p>

                <div className="flex items-center space-x-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{course.rating}</span>
                    <span>({course.reviews.toLocaleString()} değerlendirme)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{course.reviews.toLocaleString()} öğrenci</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <img
                    src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                    alt={course.instructor}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{course.instructor}</div>
                    <div className="text-sm text-white/80">Uzman Eğitmen</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop`;
                      }}
                    />
                    {/* Preview overlay */}
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <Button size="lg" className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30">
                        <Play className="w-5 h-5 mr-2" />
                        Önizleme
                      </Button>
                    </div>
                    {/* Favorite icon overlay */}
                    <button
                      aria-label="Favori"
                      onClick={handleToggleFavorite}
                      className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors ${favorited ? 'text-red-500' : 'text-foreground'}`}
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-primary">₺{course.price}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground line-through">₺{course.originalPrice}</span>
                          <Badge className="bg-destructive text-destructive-foreground">
                            {discount}% İndirim
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {!isPurchased ? (
                      <div className="space-y-3">
                        <Button
                          onClick={handleBuyNow}
                          size="lg"
                          className="w-full bg-gradient-primary hover:shadow-course-hover"
                        >
                          Hemen Satın Al
                        </Button>

                        <Button
                          onClick={handleAddToCart}
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Sepete Ekle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button size="lg" className="w-full bg-success hover:bg-success/90">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Kursa Başla
                        </Button>

                        <div className="text-center text-sm text-success font-medium">
                          ✅ Kurs satın alındı
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Yaşam boyu erişim</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Mobil ve TV'den erişim</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Tamamlama sertifikası</span>
                      </div>
                      {course.books && course.books.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>{course.books.length} dijital kitap dahil</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="curriculum" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="curriculum">Müfredat</TabsTrigger>
                  <TabsTrigger value="books">Dijital Kitaplar</TabsTrigger>
                  <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
                </TabsList>

                <TabsContent value="curriculum" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kurs İçeriği</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {course.curriculum.map((item: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="books" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Dijital Kitaplar</span>
                        {isPurchased && (
                          <Badge className="bg-success text-success-foreground">
                            Erişime Açık
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {course.books && course.books.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {course.books.map((book: any) => (
                            <div key={book.id} className="border rounded-lg p-4 hover:shadow-course transition-all duration-300">
                              <div className="flex space-x-4">
                                <div className="relative">
                                  <img
                                    src={book.cover}
                                    alt={book.title}
                                    className="w-16 h-20 object-cover rounded shadow-md"
                                  />
                                  {!isPurchased && (
                                    <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                        <span className="text-xs">🔒</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <h4 className="font-semibold text-sm">{book.title}</h4>
                                  <p className="text-xs text-muted-foreground">{book.author}</p>
                                  <p className="text-xs text-muted-foreground">{book.pages} sayfa</p>
                                  <p className="text-xs">{book.description}</p>
                                  {isPurchased && (
                                    <Button size="sm" variant="outline" className="text-xs">
                                      <Download className="w-3 h-3 mr-1" />
                                      İndir
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Bu kursta dijital kitap bulunmamaktadır.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Öğrenci Değerlendirmeleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Rating Summary */}
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{course.rating}</div>
                            <div className="flex items-center justify-center space-x-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(course.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {course.reviews.toLocaleString()} değerlendirme
                            </div>
                          </div>
                        </div>

                        {/* Sample Reviews */}
                        <div className="space-y-4">
                          {[
                            {
                              name: "Mehmet K.",
                              rating: 5,
                              comment: "Harika bir kurs! Eğitmen çok net anlatıyor ve projeler çok faydalı.",
                              date: "2 gün önce"
                            },
                            {
                              name: "Ayşe D.",
                              rating: 4,
                              comment: "İçerik kaliteli ama biraz daha pratik örnek olabilirdi.",
                              date: "1 hafta önce"
                            }
                          ].map((review, index) => (
                            <div key={index} className="border-b pb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {review.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{review.name}</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                            }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{review.date}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Similar courses */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4">Benzer Kurslar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similar.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="font-semibold line-clamp-2 mb-1">
                        <a href={`/course/${c.id}`}>{c.title}</a>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{c.instructor}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span>⭐ {Number(c.rating || 0).toFixed(1)}</span>
                        <span className="font-semibold">₺{c.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Also bought */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4">Bu kursu alanlar bunları da aldı</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alsoBought.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="font-semibold line-clamp-2 mb-1">
                        <a href={`/course/${c.id}`}>{c.title}</a>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{c.instructor}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span>⭐ {Number(c.rating || 0).toFixed(1)}</span>
                        <span className="font-semibold">₺{c.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Course Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Bu Kursta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm">{course.duration} video içerik</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-sm">İndirilebilir kaynaklar</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="text-sm">{course.language} dil desteği</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm">Tamamlama sertifikası</span>
                  </div>
                  {course.books && course.books.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-sm">{course.books.length} dijital kitap</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructor */}
              <Card>
                <CardHeader>
                  <CardTitle>Eğitmen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face`}
                      alt={course.instructor}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{course.instructor}</div>
                      <div className="text-sm text-muted-foreground">Uzman Eğitmen</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    10+ yıl sektör deneyimi ile öğrencilerine en güncel bilgileri aktarmaktadır.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
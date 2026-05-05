import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  Heart, 
  Share2, 
  Download,
  BookOpen,
  Award,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle,
  PlayCircle,
  FileText,
  Globe,
  Calendar,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  course_id: number;
  title: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url: string;
  level: string;
  language: string;
  instructor_name: string;
  instructor_id: number;
  instructor_avatar?: string;
  instructor_bio?: string;
  average_rating: number;
  total_reviews: number;
  total_students: number;
  duration: string;
  last_updated: string;
  what_you_learn: string[];
  requirements: string[];
  target_audience: string[];
  is_enrolled: boolean;
  is_favorite: boolean;
  progress?: number;
}

interface Section {
  section_id: number;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  lesson_id: number;
  title: string;
  duration: string;
  is_free: boolean;
  is_completed: boolean;
  video_url?: string;
  resources: Resource[];
}

interface Resource {
  resource_id: number;
  name: string;
  url: string;
  type: string;
}

interface Review {
  review_id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const EnhancedCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string>('');

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}`, {
        headers: isAuthenticated ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {}
      });
      if (!response.ok) throw new Error('Course not found');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch course sections and lessons
  const { data: sections } = useQuery({
    queryKey: ['course-sections', id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/sections`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch course reviews
  const { data: reviews } = useQuery({
    queryKey: ['course-reviews', id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/reviews`);
      return response.json();
    },
    enabled: !!id,
  });

  // Add to favorites mutation
  const favoritesMutation = useMutation({
    mutationFn: async () => {
      const method = course?.is_favorite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to update favorites');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success(course?.is_favorite ? 'Favorilerden kaldırıldı' : 'Favorilere eklendi');
    },
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to enroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Kursa başarıyla kaydoldunuz!');
      navigate(`/course/${id}/learn`);
    },
  });

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePreview = (videoUrl: string) => {
    setPreviewVideo(videoUrl);
    setShowPreview(true);
  };

  const formatDuration = (duration: string) => {
    const parts = duration.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) {
        return `${hours}s ${minutes}dk`;
      }
      return `${minutes}dk`;
    }
    return duration;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Kurs bulunamadı</h1>
        <Button onClick={() => navigate('/courses')} className="mt-4">
          Kurslara Dön
        </Button>
      </div>
    );
  }

  const totalLessons = sections?.reduce((acc: number, section: Section) => acc + section.lessons.length, 0) || 0;
  const completedLessons = sections?.reduce((acc: number, section: Section) => 
    acc + section.lessons.filter((lesson: Lesson) => lesson.is_completed).length, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="bg-blue-600">
                  {course.level}
                </Badge>
                <Badge variant="secondary" className="bg-green-600">
                  {course.language}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-1">
                  {renderStars(course.average_rating)}
                  <span className="ml-2 font-semibold">{course.average_rating.toFixed(1)}</span>
                  <span className="text-blue-200">({course.total_reviews} değerlendirme)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-5 h-5" />
                  <span>{course.total_students.toLocaleString()} öğrenci</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={course.instructor_avatar} />
                  <AvatarFallback>{course.instructor_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{course.instructor_name}</p>
                  <p className="text-blue-200">Eğitmen</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-blue-200">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Son güncelleme: {new Date(course.last_updated).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{course.language}</span>
                </div>
              </div>
            </div>

            {/* Course Preview Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <div className="relative">
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 hover:bg-white"
                    onClick={() => handlePreview(course.image_url)}
                  >
                    <PlayCircle className="w-8 h-8 text-blue-600" />
                  </Button>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {course.discount_price ? (
                        <div>
                          <span className="text-2xl font-bold text-green-600">
                            ₺{course.discount_price}
                          </span>
                          <span className="text-lg text-gray-500 line-through ml-2">
                            ₺{course.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold">₺{course.price}</span>
                      )}
                    </div>
                    {course.discount_price && (
                      <Badge variant="destructive">
                        %{Math.round((1 - course.discount_price / course.price) * 100)} İndirim
                      </Badge>
                    )}
                  </div>

                  {course.is_enrolled ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>İlerleme</span>
                          <span>{Math.round((course.progress || 0))}%</span>
                        </div>
                        <Progress value={course.progress || 0} className="h-2" />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/course/${id}/learn`)}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Öğrenmeye Devam Et
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        className="w-full" 
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? 'Kaydediliyor...' : 'Kursa Kaydol'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/cart')}
                      >
                        Sepete Ekle
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-between mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => favoritesMutation.mutate()}
                      disabled={!isAuthenticated}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${course.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      Favori
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      Paylaş
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Ders Sayısı
                      </span>
                      <span className="font-semibold">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Toplam Süre
                      </span>
                      <span className="font-semibold">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        Sertifika
                      </span>
                      <span className="font-semibold">Evet</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        İndirilebilir
                      </span>
                      <span className="font-semibold">Evet</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="curriculum">Müfredat</TabsTrigger>
                <TabsTrigger value="instructor">Eğitmen</TabsTrigger>
                <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-8">
                  {/* What You'll Learn */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Bu Kursta Neler Öğreneceksiniz
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.what_you_learn?.map((item: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Gereksinimler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.requirements?.map((req: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Target Audience */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Bu Kurs Kimin İçin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.target_audience?.map((audience: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{audience}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="curriculum" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kurs İçeriği</CardTitle>
                    <p className="text-sm text-gray-600">
                      {sections?.length} bölüm • {totalLessons} ders • {course.duration} toplam süre
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sections?.map((section: Section) => (
                        <div key={section.section_id} className="border rounded-lg">
                          <button
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                            onClick={() => toggleSection(section.section_id)}
                          >
                            <div className="flex items-center space-x-3">
                              {expandedSections.has(section.section_id) ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                              <span className="font-semibold">{section.title}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {section.lessons.length} ders
                            </span>
                          </button>
                          
                          {expandedSections.has(section.section_id) && (
                            <div className="border-t">
                              {section.lessons.map((lesson: Lesson) => (
                                <div key={lesson.lesson_id} className="p-4 border-b last:border-b-0 flex items-center justify-between hover:bg-gray-50">
                                  <div className="flex items-center space-x-3">
                                    {lesson.is_completed ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : lesson.is_free ? (
                                      <PlayCircle className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <Lock className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.is_free && (
                                      <Badge variant="secondary" className="text-xs">
                                        Ücretsiz
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {lesson.resources.length > 0 && (
                                      <FileText className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm text-gray-500">
                                      {formatDuration(lesson.duration)}
                                    </span>
                                    {(lesson.is_free || course.is_enrolled) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => lesson.video_url && handlePreview(lesson.video_url)}
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={course.instructor_avatar} />
                        <AvatarFallback className="text-2xl">
                          {course.instructor_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{course.instructor_name}</h3>
                        <p className="text-gray-600 mb-4">{course.instructor_bio}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{course.average_rating}</div>
                            <div className="text-sm text-gray-500">Eğitmen Puanı</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{course.total_reviews}</div>
                            <div className="text-sm text-gray-500">Değerlendirme</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{course.total_students}</div>
                            <div className="text-sm text-gray-500">Öğrenci</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">1</div>
                            <div className="text-sm text-gray-500">Kurs</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Öğrenci Değerlendirmeleri</CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {renderStars(course.average_rating)}
                        <span className="text-2xl font-bold">{course.average_rating}</span>
                      </div>
                      <span className="text-gray-500">({course.total_reviews} değerlendirme)</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-6">
                        {reviews?.items?.map((review: Review) => (
                          <div key={review.review_id} className="flex space-x-4">
                            <Avatar>
                              <AvatarImage src={review.user_avatar} />
                              <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold">{review.user_name}</span>
                                <div className="flex items-center space-x-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Related Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    İlgili Kurslar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mock related courses */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <img 
                          src={`https://via.placeholder.com/80x60?text=Course${i}`}
                          alt={`Related Course ${i}`}
                          className="w-20 h-15 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2">
                            İlgili Kurs Başlığı {i}
                          </h4>
                          <p className="text-xs text-gray-500">Eğitmen Adı</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="flex">
                              {renderStars(4.5)}
                            </div>
                            <span className="text-xs text-gray-500">(120)</span>
                          </div>
                          <p className="text-sm font-bold text-green-600">₺99</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Kurs Önizlemesi</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <video
              src={previewVideo}
              controls
              className="w-full h-full rounded-lg"
              autoPlay
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
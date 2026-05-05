import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from '@/components/ui/slider';
import Cropper from 'react-easy-crop';
import { useCategories, useCourseCreate, useCourseUpdate } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { COURSE_CATEGORIES } from '@/constants/categories';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCY_PRICING, getPriceOptionsForCurrency, getCurrencyInfo, formatCoursePrice, isValidCoursePrice, DEFAULT_CURRENCY } from '@/utils/pricing';
import {
  Plus,
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  Mic,
  Settings,
  Save,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Edit3,
  Brain,
  Wand2,
  Sparkles,
  Target,
  Users,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Globe,
  Zap,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Copy,
  AlertCircle,
  Info,
  BookOpen,
  DollarSign,
  Award,
  Download,
  Palette,
  Type,
  Lightbulb,
  Shield,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
  X,
  Presentation,
  FileVideo,
  BarChart,
  Heart,
  Rocket,
  Check,
  Tag,
  Percent,
  ShieldCheck,
  PlayCircle,
  UserCircle
} from 'lucide-react';
import CourseCard from '@/components/instructor/CourseCard';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Helper: Generate URL-friendly slug from title
function generateSlug(title: string) {
  return (title || '').toString()
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Helper: Create image from URL for cropping
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper: Get cropped image as Blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to desired output (1280x720 for 16:9)
  canvas.width = 1280;
  canvas.height = 720;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    1280,
    720
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

interface CourseLesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'presentation' | 'document' | 'quiz';
  duration?: number;
  isFree: boolean;
  videoFile?: File;
  presentationFile?: File;
  documentFile?: File;
  textContent?: string;
  filePath?: string;
  publicUrl?: string;
  processingStatus?: 'idle' | 'uploading' | 'pending' | 'processing' | 'processed' | 'completed' | 'error';
  uploadProgress?: number;
  titleSaved?: boolean;
  dbLessonId?: number;
  slug?: string;
  hlsManifestPath?: string;
  sourceBucketPath?: string;
  durationSeconds?: number;
  isPreview?: boolean;
  resources?: CourseResource[];
  fileName?: string;
  uploadDate?: string;
  errorMessage?: string;
}

interface CourseSection {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  isExpanded: boolean;
  titleSaved?: boolean;
  dbSectionId?: number;
}
interface CourseResource {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'link' | 'code';
  file?: File;
  url?: string;
  size?: number;
}

interface CourseData {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  subcategory: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  price: number;
  currency: string;
  courseId?: number | null;
  discountPrice?: number;
  thumbnail?: File;
  tags: string[];
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  sections: CourseSection[];
  settings: {
    enableCaptions: boolean;
    enableDownloads: boolean;
    enableCertificate: boolean;
    enableDiscussions: boolean;
    enableAnnouncements: boolean;
    maxStudents?: number;
    courseDuration: number;
  };
  coverImage?: { cdnPath?: string; file?: File };
  previewVideo?: { cdnPath?: string; file?: File };
}

export default function AdvancedCourseCreator() {
  const { id: creatorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const courseUrlId = creatorId ? Number(creatorId) : null;

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseUrlId) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';
      try {
        const res = await fetch(`${apiBase}/api/courses/full/${courseUrlId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();

          // Map backend response to ensure lesson state is correct for persistence
          if (data.sections) {
            data.sections = data.sections.map((section: any) => ({
              ...section,
              dbSectionId: section.id, // Map backend ID to dbSectionId to allow updates
              lessons: section.lessons.map((lesson: any) => {
                let mappedLesson = {
                  ...lesson,
                  dbLessonId: lesson.id // Map backend ID to dbLessonId to allow updates
                };

                // If lesson has media paths or videoStatus, set appropriate UI state
                const videoStatus = lesson.videoStatus || 'pending';
                if ((lesson.hlsManifestPath || lesson.sourceBucketPath || lesson.fileName || videoStatus !== 'pending') && !lesson.fileName) {
                  const statusMap: Record<string, string> = {
                    'uploading': 'processing',
                    'processing': 'pending',
                    'processed': 'completed',
                    'completed': 'completed',
                    'error': 'error',
                    'pending': 'pending'
                  };
                  mappedLesson = {
                    ...mappedLesson,
                    type: 'video',
                    fileName: 'Mevcut Video',
                    uploadProgress: 1,
                    processingStatus: statusMap[videoStatus] || 'pending'
                  };
                } else if (lesson.fileName) {
                  const statusMap: Record<string, string> = {
                    'uploading': 'processing',
                    'processing': 'pending',
                    'processed': 'completed',
                    'completed': 'completed',
                    'error': 'error',
                    'pending': 'pending'
                  };
                  mappedLesson = {
                    ...mappedLesson,
                    type: lesson.type || 'video',
                    uploadProgress: 1,
                    processingStatus: statusMap[videoStatus] || 'pending'
                  };
                }
                return mappedLesson;
              })
            }));
          }

          setCourseData(prev => ({
            ...prev,
            ...data,
            category: data.category_id ? String(data.category_id) : (data.category || ''),
            subcategory: data.subcategory_id ? String(data.subcategory_id) : (data.subcategory || ''),
          }));

          if (data.category_id) setSelectedCategory(String(data.category_id));

          if (data.targetAudience) setAudiences(Array.isArray(data.targetAudience) ? data.targetAudience : []);
          if (data.learningObjectives) setLearningObjectives(Array.isArray(data.learningObjectives) ? data.learningObjectives : []);
          if (data.requirements) setPrerequisites(Array.isArray(data.requirements) ? data.requirements : []);

          // Initialize media states from loaded data
          if (data.coverImage?.cdnPath) {
            setCourseImage({
              name: 'cover-image.jpg',
              cdnPath: data.coverImage.cdnPath
            } as any);
          }
          if (data.previewVideo?.cdnPath) {
            setPromoVideo({
              name: 'preview-video.mp4',
              cdnPath: data.previewVideo.cdnPath
            } as any);
          }

          console.log('Course data loaded:', data);
        } else {
          console.error('Failed to load course data');
          toast.error('Kurs verileri yüklenemedi');
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Kurs yüklenirken hata oluştu');
      }
    };

    fetchCourseData();
  }, [courseUrlId]);

  const createInitialCourse = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    try {
      const res = await fetch('https://api.edurce.com/api/courses/create-initial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: parseInt(creatorId)
        })
      });

      const result = await res.json();

      if (res.ok) {
        setCourseData(prev => ({
          ...prev,
          courseId: result.courseId
        }));
        console.log('Initial course created with ID:', result.courseId);
      } else {
        console.error('Create initial course error:', result);
      }
    } catch (err) {
      console.error('Create initial course error:', err);
    }
  };
  const [currentStep, setCurrentStep] = useState(1);
  const [mediaProgress, setMediaProgress] = useState({
    cover: 0,
    promo: 0
  });
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    subcategory: '',
    level: '' as any,
    language: '',
    price: '' as any,
    currency: '',
    courseId: null,
    tags: [],
    learningObjectives: [],
    requirements: [],
    targetAudience: [],
    sections: [],

    settings: {
      enableCaptions: true,
      enableDownloads: true,
      enableCertificate: true,
      enableDiscussions: true,
      enableAnnouncements: true,
      courseDuration: 0
    },
    coverImage: undefined,
    previewVideo: undefined
  });

  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<{ sectionId: string; lessonId: string; dbLessonId?: number } | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [uploadType, setUploadType] = useState<'video' | 'presentation' | 'document'>('video');
  const [articleContent, setArticleContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [courseImage, setCourseImage] = useState<File | null>(null);
  const [promoVideo, setPromoVideo] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Video işlenirken sayfa yenileme uyarısı
  useEffect(() => {
    const hasProcessingVideo = courseData.sections.some(s =>
      s.lessons.some(l => l.type === 'video' && (l.processingStatus === 'processing' || l.processingStatus === 'pending'))
    );

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasProcessingVideo) {
        const msg = 'Video işlenmeye devam ediyor. Sayfayı yenilerseniz bazı veriler kaydedilmeyebilir.';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [courseData.sections]);

  // Compute cover image preview URL
  const coverPreviewUrl = useMemo(() => {
    if (courseImage instanceof File) {
      return URL.createObjectURL(courseImage);
    }
    if ((courseImage as any)?.cdnPath) {
      return (courseImage as any).cdnPath;
    }
    return courseData.coverImage?.cdnPath;
  }, [courseImage, courseData.coverImage]);

  // Cropping State for Course Cover Image
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'section' | 'lesson' | 'video' | 'resource';
    sectionId: string;
    lessonId?: string;
    dbId?: number;
    resourceId?: string | number;
    resourceName?: string;
    callback?: () => Promise<void>;
  }>({
    isOpen: false,
    type: 'section',
    sectionId: '',
  });

  const handleDeleteConfirm = async () => {
    const { type, sectionId, lessonId, dbId, resourceId, callback } = deleteConfirmation;
    const token = localStorage.getItem('token');

    try {
      if (type === 'video' && dbId && token) {
        // Ders videosunu sil
        const dRes = await fetch(`https://api.edurce.com/api/courses/lessons/${dbId}/video`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!dRes.ok) throw new Error('Video silinemedi');
        // local state güncelle
        setCourseData(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === sectionId ? {
            ...s, lessons: s.lessons.map(l => (lessonId && l.id === lessonId) ? {
              ...l, fileName: undefined, processingStatus: 'idle' as const, hlsManifestPath: undefined, sourceBucketPath: undefined, durationSeconds: undefined
            } : l)
          } : s)
        }));

        // "Videoyu Değiştir" modunda ise yeni yükleme dialogunu aç
        if (deleteConfirmation.resourceName === 'video_replace' && sectionId && lessonId) {
          toast.success('Eski video silindi. Şimdi yeni video yükleyebilirsiniz.');
          // Kısa bir gecikme ile yükleme dialogunu aç
          setTimeout(() => {
            handleFileUpload(sectionId, lessonId, 'video', dbId);
          }, 300);
        } else {
          toast.success('Video silindi');
        }
      } else if (type === 'resource' && resourceId && token) {
        // Kaynağı sil
        const dRes = await fetch(`https://api.edurce.com/api/lessons/resources/${resourceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!dRes.ok) throw new Error('Kaynak silinemedi');
        // local state güncelle
        setCourseData(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === sectionId ? {
            ...s, lessons: s.lessons.map(l => (lessonId && l.id === lessonId) ? {
              ...l,
              resources: (l.resources || []).filter(r => r.id !== resourceId)
            } : l)
          } : s)
        }));
        toast.success('Kaynak silindi');
      } else {
        // Bölüm veya ders silme
        if (dbId && token) {
          const endpoint = type === 'section'
            ? `https://api.edurce.com/api/courses/sections/${dbId}`
            : `https://api.edurce.com/api/courses/lessons/${dbId}`;

          const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Silme işlemi başarısız');
          }
        }

        // Local State Update
        if (type === 'section') {
          setCourseData(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
          }));
          toast.success('Bölüm ve tüm içerikleri silindi');
        } else if (type === 'lesson' && lessonId) {
          setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
              s.id === sectionId
                ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) }
                : s
            )
          }));
          toast.success('Ders ve tüm dosyaları silindi');
        }
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Silme sırasında hata oluştu');
    } finally {
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
    }
  };

  const saveDraft = () => {
    const draftData = {
      ...courseData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('courseDraft', JSON.stringify(draftData));
    toast.success('Taslak kaydedildi');
  };

  // Full save to backend
  const saveCourseToServer = async (publish = false, silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    // Validate required fields
    if (!courseData.title?.trim()) {
      if (!silent) toast.error('Kurs başlığı zorunludur');
      return;
    }
    // No longer requiring description or subtitle for drafts as requested
    if (!courseData.category) {
      if (!silent) toast.error('Kategori seçimi zorunludur');
      return;
    }

    try {
      // Map frontend level to DB ENUM values
      const levelMap: Record<string, string> = {
        beginner: 'Başlangıç',
        intermediate: 'Orta',
        advanced: 'İleri',
        all: 'Tüm Seviyeler'
      };

      const dbLevel = levelMap[courseData.level] || 'Başlangıç';

      const payload = {
        courseId: courseData.courseId || (courseUrlId ? Number(courseUrlId) : null),
        course: {
          title: courseData.title.trim(),
          slug: generateSlug(courseData.title),
          subtitle: courseData.subtitle.trim(),
          description: courseData.description.trim(),
          categoryId: courseData.category ? Number(courseData.category) : null,
          subcategoryId: courseData.subcategory ? Number(courseData.subcategory) : null,
          price: courseData.price ? Number(courseData.price) : 0,
          currency: courseData.currency || null,
          price_level: (courseData as any).price_level || 1,
          language: courseData.language || null,
          level: courseData.level ? levelMap[courseData.level] : null,
          imagePath: courseData.coverImage?.cdnPath || null,
          videoPreviewPath: courseData.previewVideo?.cdnPath || null,
          status: publish ? 'published' : (courseData as any).status === 'published' ? 'published' : 'draft'
        },
        // Sections and lessons are managed independently via their own save buttons
        // So we don't include them in the full-save payload
        sections: [],
        audience: {
          learningGoals: learningObjectives.filter(o => o.trim()),
          requirements: prerequisites.filter(r => r.trim()),
          targetStudents: targetAudience.filter(a => a.trim())
        }
      };

      console.log('Sending payload:', payload);

      const res = await fetch('https://api.edurce.com/api/courses/full-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Check if response is actually JSON
      const text = await res.text();
      console.log('Raw response:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Response is not JSON:', text);
        throw new Error('Sunucu geçersiz yanıt döndürdü. Backend çalışıyor mu?');
      }

      if (!res.ok) {
        console.error('Backend error response:', result);
        throw new Error(result.error || 'Kayıt başarısız');
      }

      // Update state with returned courseId so subsequent saves are updates
      if (result.courseId) {
        setCourseData(prev => ({
          ...prev,
          courseId: result.courseId
        }));

        // Update URL if it's a new course
        if (!courseUrlId) {
          navigate(`/instructor/courses/edit/${result.courseId}`, { replace: true });
        }
      }

      if (!silent) {
        toast.success(publish ? 'Kurs yayınlandı!' : 'Kurs taslağı kaydedildi!');
      }
      console.log('Saved course:', result);

      if (publish) {
        // Optionally redirect or refresh
        window.location.href = `/instructor/dashboard`;
      }

      return result;

    } catch (err: any) {
      console.error('Save error:', err);
      if (!silent) toast.error(err.message || 'Kurs kaydedilemedi');
      throw err;
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Öğrenci Kitlesi State'leri
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [prerequisites, setPrerequisites] = useState<string[]>(['']);
  const [audiences, setAudiences] = useState<string[]>(['']);
  const addAudience = () => setAudiences(prev => [...prev, '']);
  const updateAudience = (index: number, value: string) => {
    setAudiences(prev => prev.map((v, i) => (i === index ? value : v)));
  };
  const removeAudience = (index: number) => {
    setAudiences(prev => prev.filter((_, i) => i !== index));
  };

  // Alias for targetAudience
  const targetAudience = audiences;

  // Senkronizasyon: courseData.targetAudience <-> audiences
  useEffect(() => {
    if (Array.isArray(courseData.targetAudience) && courseData.targetAudience.length > 0) {
      setAudiences(courseData.targetAudience);
    }
  }, []);

  useEffect(() => {
    setCourseData(prev => ({
      ...prev,
      targetAudience: audiences
    }));
  }, [audiences]);

  // Fiyatlandırma State'leri - Sadece önceden tanımlı fiyatlar

  // Kupon & Kampanya State'leri
  const [couponData, setCouponData] = useState({
    code: '',
    priceLevel: 0,
    discountPrice: 0,
    validUntil: '',
    usageLimit: 100,
    isActive: true
  });

  // Sertifika & Belge State'leri
  const [certificateData, setCertificateData] = useState({
    enableCertificate: true,
    enableParticipationCertificate: true,
    certificateTemplate: 'modern',
    certificateTitle: '',
    certificateDescription: '',
    completionRequirement: 80,
    certificateLanguage: 'tr',
    includeGrade: true,
    includeDate: true,
    includeInstructorSignature: true,
    customMessage: '',
    certificateDesign: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter',
      logoPosition: 'top-left'
    }
  });

  const steps = [
    { id: 1, title: 'Temel Bilgiler', icon: BookOpen },
    { id: 2, title: 'Kurs İçeriği', icon: Video },
    { id: 3, title: 'Fiyatlandırma', icon: Target },
    { id: 4, title: 'Öğrenci Kitlesi', icon: Users },
    { id: 5, title: 'Pazarlama', icon: Tag },
    { id: 6, title: 'Sertifika', icon: Award },
    { id: 7, title: 'Önizleme', icon: Eye }
  ];


  const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ar', label: 'عربي' },
    { value: 'ru', label: 'Русский' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' }
  ];

  const generateAIContent = async (type: 'title' | 'description' | 'objectives' | 'curriculum') => {
    setIsAIGenerating(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (type) {
      case 'title':
        setCourseData(prev => ({
          ...prev,
          title: 'Modern Web Development ile React ve TypeScript',
          subtitle: 'Sıfırdan ileri seviyeye kadar kapsamlı web geliştirme eğitimi'
        }));
        break;
      case 'description':
        setCourseData(prev => ({
          ...prev,
          description: 'Bu kapsamlı kursta modern web geliştirme tekniklerini öğrenecek, React ve TypeScript kullanarak profesyonel web uygulamaları geliştirebileceksiniz. Kurs boyunca gerçek projeler üzerinde çalışarak pratik deneyim kazanacaksınız.'
        }));
        break;
      case 'objectives':
        setCourseData(prev => ({
          ...prev,
          learningObjectives: [
            'React ile modern web uygulamaları geliştirebilme',
            'TypeScript kullanarak tip güvenli kod yazabilme',
            'State management ve hooks kullanımı',
            'API entegrasyonu ve veri yönetimi',
            'Responsive tasarım ve modern CSS teknikleri'
          ]
        }));
        break;
      case 'curriculum':
        const aiSections: CourseSection[] = [
          {
            id: '1',
            title: 'Giriş ve Temel Kavramlar',
            description: 'Web geliştirme temelleri ve React\'a giriş',
            isExpanded: true,
            lessons: [
              {
                id: '1-1',
                title: 'Kursa Hoş Geldiniz',
                description: 'Kurs tanıtımı ve öğrenme hedefleri',
                type: 'video',
                isPreview: true,
                isFree: true,
                resources: []
              },
              {
                id: '1-2',
                title: 'Geliştirme Ortamının Kurulumu',
                description: 'Node.js, VS Code ve gerekli araçların kurulumu',
                type: 'video',
                isPreview: false,
                isFree: false,
                resources: []
              }
            ]
          },
          {
            id: '2',
            title: 'React Temelleri',
            description: 'React bileşenleri, props ve state yönetimi',
            isExpanded: false,
            lessons: [
              {
                id: '2-1',
                title: 'React Bileşenleri',
                description: 'Fonksiyonel ve sınıf bileşenleri',
                type: 'video',
                isPreview: false,
                isFree: false,
                resources: []
              }
            ]
          }
        ];
        setCourseData(prev => ({ ...prev, sections: aiSections }));
        break;
    }

    setIsAIGenerating(false);
    toast.success('AI içerik başarıyla oluşturuldu!');
  };

  const addSection = () => {
    const newSection: CourseSection = {
      id: Date.now().toString(),
      title: '',
      description: '',
      lessons: [],
      isExpanded: true
    };
    setCourseData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    // Yeni eklenen bölüme scroll yap
    setTimeout(() => {
      const newSectionElement = document.querySelector(`[data-section-id="${newSection.id}"]`);
      if (newSectionElement) {
        newSectionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const addLesson = (sectionId: string) => {
    const newLesson: CourseLesson = {
      id: `lesson-${Date.now()}`,
      title: '',
      description: '',
      type: 'video',
      resources: [],
      isPreview: false,
      isFree: false,
    };

    setCourseData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, lessons: [...section.lessons, newLesson] }
          : section
      )
    }));

    // Yeni eklenen derse scroll yap
    setTimeout(() => {
      const newLessonElement = document.querySelector(`[data-lesson-id="${newLesson.id}"]`);
      if (newLessonElement) {
        newLessonElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const removeSection = (sectionId: string, dbSectionId?: number) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'section',
      sectionId,
      dbId: dbSectionId
    });
  };

  const removeLesson = (sectionId: string, lessonId: string, dbLessonId?: number) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'lesson',
      sectionId,
      lessonId,
      dbId: dbLessonId
    });
  };

  const handleFileUpload = (sectionId: string, lessonId: string, type: 'video' | 'presentation' | 'document', dbLessonId?: number) => {
    setSelectedLesson({ sectionId, lessonId, dbLessonId });
    setUploadType(type);
    setShowFileUpload(true);
  };

  const handleSlideUpload = (sectionId: string, lessonId: string, dbLessonId?: number) => {
    setSelectedLesson({ sectionId, lessonId, dbLessonId });
    setUploadType('presentation');
    setShowFileUpload(true);
  };

  const handleDocumentUpload = (sectionId: string, lessonId: string, dbLessonId?: number) => {
    setSelectedLesson({ sectionId, lessonId, dbLessonId });
    setUploadType('document');
    setShowFileUpload(true);
  };


  const handleArticleCreate = (sectionId: string, lessonId: string, dbLessonId?: number) => {
    setSelectedLesson({ sectionId, lessonId, dbLessonId });
    setShowArticleEditor(true);
  };

  const saveArticle = () => {
    if (!selectedLesson || !articleContent.trim()) {
      toast.error('Makale içeriği boş olamaz');
      return;
    }

    setCourseData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === selectedLesson.sectionId
          ? {
            ...s,
            lessons: s.lessons.map(l =>
              l.id === selectedLesson.lessonId
                ? {
                  ...l,
                  type: 'text',
                  fileName: 'article_content.md',
                  uploadProgress: 1,
                  uploadDate: new Date().toLocaleDateString('tr-TR'),
                  content: articleContent
                }
                : l
            )
          }
          : s
      )
    }));

    setShowArticleEditor(false);
    setArticleContent('');
    setSelectedLesson(null);
    toast.success('Makale kaydedildi');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLesson) return;

    await processFileUpload(file);

    setShowFileUpload(false);
    setSelectedLesson(null);
    document.body.style.overflow = 'auto';
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && selectedLesson) {
      const file = files[0];

      // Process the dropped file directly
      await processFileUpload(file);
    }
  };

  // File validation function
  const validateFile = (file: File, type: string): { isValid: boolean; error?: string } => {
    const maxSizes = {
      video: 500 * 1024 * 1024, // 500MB
      presentation: 100 * 1024 * 1024, // 100MB
      document: 50 * 1024 * 1024 // 50MB
    };

    const allowedTypes = {
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'],
      presentation: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/pdf',
        'application/vnd.oasis.opendocument.presentation'
      ],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
        'application/vnd.oasis.opendocument.text'
      ]
    };

    // Check file size
    if (file.size > maxSizes[type as keyof typeof maxSizes]) {
      const maxSizeMB = Math.round(maxSizes[type as keyof typeof maxSizes] / (1024 * 1024));
      return { isValid: false, error: `Dosya boyutu ${maxSizeMB}MB'ı aşmamalıdır` };
    }

    // Check file type
    const typeList = allowedTypes[type as keyof typeof allowedTypes];
    if (!typeList.includes(file.type) && !file.type.startsWith(type === 'video' ? 'video/' : '')) {
      return { isValid: false, error: 'Desteklenmeyen dosya formatı' };
    }

    return { isValid: true };
  };

  // Extract file processing logic
  const processFileUpload = async (file: File) => {
    if (!selectedLesson) return;

    const fileName = file.name;
    const fileType = uploadType;

    // Validate file before upload
    const validation = validateFile(file, fileType);
    if (!validation.isValid) {
      toast.error(validation.error || 'Geçersiz dosya');
      return;
    }

    // Update UI immediately to show upload progress
    setCourseData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === selectedLesson.sectionId
          ? {
            ...s,
            lessons: s.lessons.map(l =>
              l.id === selectedLesson.lessonId
                ? {
                  ...l,
                  type: fileType,
                  fileName: fileName,
                  uploadProgress: 0.1,
                  uploadDate: new Date().toLocaleDateString('tr-TR')
                }
                : l
            )
          }
          : s
      )
    }));

    // Video veya diğer işlemler için ID'yi belirle
    const lessonIdToSend = selectedLesson.dbLessonId?.toString() || selectedLesson.lessonId;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      const fieldName = fileType === 'video' ? 'video' : 'file';
      formData.append(fieldName, file);

      // Add course and lesson info for CDN organization
      const courseSlug = courseData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'untitled-course';

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let result;

      // Helper for XHR upload with progress
      const uploadWithProgress = (url: string, body: FormData): Promise<any> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = event.loaded / event.total;
              // Update state with progress
              setCourseData(prev => ({
                ...prev,
                sections: prev.sections.map(s =>
                  s.id === selectedLesson.sectionId
                    ? {
                      ...s,
                      lessons: s.lessons.map(l =>
                        l.id === selectedLesson.lessonId
                          ? { ...l, uploadProgress: progress }
                          : l
                      )
                    }
                    : s
                )
              }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || 'Upload failed'));
              } catch (e) {
                reject(new Error('Upload failed'));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(body);
        });
      };

      if (fileType === 'video') {
        console.log('Uploading video with Lesson ID:', lessonIdToSend, 'Original lessonId:', selectedLesson.lessonId);

        // Video için ayrı endpoint kullan
        formData.append('courseSlug', courseSlug);
        formData.append('lessonId', lessonIdToSend);

        result = await uploadWithProgress(`/api/upload/video`, formData);
      } else {
        // Slayt ve belge için birleştirilmiş endpoint kullan
        formData.append('resourceType', fileType);

        result = await uploadWithProgress(`/api/courses/${courseSlug}/lessons/${selectedLesson.lessonId}/upload-resource`, formData);
      }

      // Update UI with successful upload
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === selectedLesson.sectionId
            ? {
              ...s,
              lessons: s.lessons.map(l =>
                l.id === selectedLesson.lessonId
                  ? {
                    ...l,
                    type: fileType,
                    fileName: result.file?.originalName || l.fileName,
                    uploadProgress: 1, // Complete
                    uploadDate: new Date().toLocaleDateString('tr-TR'),
                    fileId: result.file?.id || result.resource?.name,
                    filePath: result.file?.cdnPath || result.resource?.cdnPath || result.file?.path,
                    publicUrl: result.file?.publicUrl || result.resource?.url,
                    processingStatus: fileType === 'video' ? 'processing' : 'completed',
                    durationSeconds: result.file?.durationSeconds || l.durationSeconds
                  }
                  : l
              )
            }
            : s
        )
      }));

      const successMessage =
        fileType === 'video' ? 'Video yüklendi ve işleniyor' :
          fileType === 'presentation' ? 'Slayt başarıyla yüklendi' :
            'Belge başarıyla yüklendi';
      toast.success(result.message || successMessage);

      // Eğer video ise, işleme durumunu kontrol et
      if (fileType === 'video') {
        pollVideoStatus(lessonIdToSend, selectedLesson.lessonId);
      }

    } catch (error) {
      console.error('File upload error:', error);

      // Reset upload progress on error
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === selectedLesson.sectionId
            ? {
              ...s,
              lessons: s.lessons.map(l =>
                l.id === selectedLesson.lessonId
                  ? {
                    ...l,
                    fileName: undefined,
                    uploadProgress: undefined,
                    uploadDate: undefined
                  }
                  : l
              )
            }
            : s
        )
      }));

      toast.error(`Dosya yükleme hatası: ${error.message}`);
    }
  };

  // Video işleme durumunu kontrol etme fonksiyonu
  const pollVideoStatus = async (dbLessonId: string, uiLessonId: string) => {
    const maxAttempts = 270; // 45 dakika (10 saniye * 270)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/video/status/${dbLessonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const lesson = result.lesson;

          // UI'yi güncelle — uiLessonId ile eşleştir
          setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s => ({
              ...s,
              lessons: s.lessons.map(l =>
                l.id === uiLessonId
                  ? {
                    ...l,
                    processingStatus: lesson.status,
                    videoUrl: lesson.videoUrl,
                    errorMessage: lesson.errorMessage,
                    ...(lesson.durationSeconds ? { durationSeconds: lesson.durationSeconds } : {})
                  }
                  : l
              )
            }))
          }));

          if (lesson.status === 'processed') {
            toast.success('Video işleme tamamlandı! 🎬');
            return true; // İşlem tamamlandı
          } else if (lesson.status === 'error') {
            toast.error(`Video işleme hatası: ${lesson.errorMessage}`);
            return true; // Hata ile tamamlandı
          }
        }

        attempts++;

        // Her 2 dakikada bir progress bildirimi göster
        if (attempts % 12 === 0) {
          const minutesPassed = Math.round(attempts * 10 / 60);
          toast.info(`⏳ Video hâlâ işleniyor... (${minutesPassed} dk)`, { duration: 4000 });
        }

        if (attempts >= maxAttempts) {
          toast.warning('Video işleme süresi aşıldı (45 dk). Sayfayı yenileyerek durumu kontrol edin.');
          return true; // Zaman aşımı
        }

        // 10 saniye sonra tekrar kontrol et
        setTimeout(checkStatus, 10000);
        return false;

      } catch (error) {
        console.error('Video status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
        return false;
      }
    };

    // İlk kontrolü 15 saniye sonra başlat (FFmpeg başlayana kadar bekle)
    setTimeout(checkStatus, 15000);
  };

  // Form validasyon fonksiyonu
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};

    if (!courseData.title.trim()) {
      errors.title = 'Kurs başlığı zorunludur';
    }

    if (!selectedCategory) {
      errors.category = 'Kategori seçimi zorunludur';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return false;
    }

    return true;
  };

  // Görsel yükleme fonksiyonu
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya validasyonu
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('Dosya boyutu 10MB\'dan büyük olamaz');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPEG, PNG ve WebP formatları desteklenir');
      return;
    }

    // Create object URL and open crop modal
    const imageUrl = URL.createObjectURL(file);
    setCropImage(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(true);
  };

  // Handle cropped image confirmation and upload
  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) {
      toast.error('Lütfen bir alan seçin');
      return;
    }

    setIsCropping(false);
    toast.info('Görsel kırpılıyor ve yükleniyor...');

    try {
      // Get cropped blob
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      if (!croppedBlob) {
        throw new Error('Görsel kırpılamadı');
      }

      // Create File from blob
      const croppedFile = new File([croppedBlob], 'course-cover.jpg', { type: 'image/jpeg' });
      setCourseImage(croppedFile);

      // Auto-save course before upload to ensure DB record exists
      const saveResult = await saveCourseToServer(false, true);

      // Use slug from backend response or fallback to frontend generation
      const activeSlug = saveResult?.slug ||
        courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
        'untitled-course';

      // FormData oluştur
      const formData = new FormData();
      formData.append('image', croppedFile);
      formData.append('courseSlug', activeSlug);

      // Auth token al
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Backend'e yükle
      // Backend'e yükle (XHR ile progress tracking)
      const uploadCoverImage = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://api.edurce.com/api/upload/course-cover');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setMediaProgress(prev => ({ ...prev, cover: event.loaded / event.total }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || 'Upload failed'));
              } catch (e) {
                reject(new Error('Upload failed'));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });
      };

      const result = await uploadCoverImage();
      // Reset progress so the overlay disappears and shows the uploaded image
      setTimeout(() => setMediaProgress(prev => ({ ...prev, cover: 0 })), 500);

      setCourseData(prev => ({
        ...prev,
        coverImage: { cdnPath: result.file.publicUrl }
      }));

      // Cleanup
      if (cropImage) {
        URL.revokeObjectURL(cropImage);
        setCropImage(null);
      }

      toast.success('Kurs kapak görseli başarıyla yüklendi!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Görsel yükleme hatası: ' + (error as Error).message);
    }
  };

  // Video yükleme fonksiyonu
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Video validasyonu
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('Video boyutu 100MB\'dan büyük olamaz');
      return;
    }

    setPromoVideo(file);
    toast.success('Video seçildi, kurs kaydediliyor ve yükleniyor...');

    try {
      // Auto-save course before upload
      const saveResult = await saveCourseToServer(false, true);

      // Use slug from backend response
      const activeSlug = saveResult?.slug ||
        courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
        'untitled-course';

      const formData = new FormData();
      formData.append('video', file);
      formData.append('courseSlug', activeSlug);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      // XHR ile progress tracking
      const uploadPromoVideo = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://api.edurce.com/api/upload/course-preview');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setMediaProgress(prev => ({ ...prev, promo: event.loaded / event.total }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || 'Upload failed'));
              } catch (e) {
                reject(new Error('Upload failed'));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });
      };

      const result = await uploadPromoVideo();
      // Reset progress so the overlay disappears and shows the uploaded video state
      setTimeout(() => setMediaProgress(prev => ({ ...prev, promo: 0 })), 500);

      setCourseData(prev => ({
        ...prev,
        previewVideo: { cdnPath: result.file.publicUrl }
      }));

      toast.success('Tanıtım videosu başarıyla yüklendi!');
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast.error('Video yükleme hatası: ' + error.message);
    }
  };

  // Öğrenme hedefleri yönetimi
  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const updateLearningObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const removeLearningObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
    }
  };

  // Ön koşullar yönetimi
  const addPrerequisite = () => {
    setPrerequisites([...prerequisites, '']);
  };

  const updatePrerequisite = (index: number, value: string) => {
    const updated = [...prerequisites];
    updated[index] = value;
    setPrerequisites(updated);
  };

  const removePrerequisite = (index: number) => {
    if (prerequisites.length > 1) {
      setPrerequisites(prerequisites.filter((_, i) => i !== index));
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'section') {
      const newSections = Array.from(courseData.sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);

      setCourseData(prev => ({
        ...prev,
        sections: newSections
      }));
      return;
    }

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same section
      const sectionId = source.droppableId;
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
          if (section.id === sectionId) {
            const newLessons = Array.from(section.lessons);
            const [reorderedItem] = newLessons.splice(source.index, 1);
            newLessons.splice(destination.index, 0, reorderedItem);
            return { ...section, lessons: newLessons };
          }
          return section;
        })
      }));
    }
  };

  const calculateTotalLessons = () => {
    return courseData.sections.reduce((total, section) => {
      return total + section.lessons.length;
    }, 0);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Main Info & Media Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Left Side: Core Details */}
              <div className="space-y-8">
                <div className="relative group">
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="title" className="text-base font-bold text-slate-700 dark:text-slate-300">Kurs Başlığı</Label>
                  </div>
                  <Input
                    id="title"
                    placeholder="Örn: Modern Web Geliştirme Masterclass"
                    className={`h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg font-medium ${validationErrors.title ? 'border-red-500 bg-red-50/30' : ''}`}
                    value={courseData.title}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, title: e.target.value }));
                      if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: '' }));
                    }}
                    required
                    maxLength={75}
                  />
                  {validationErrors.title && <p className="text-red-500 text-xs mt-2 ml-1 font-medium italic">{validationErrors.title}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="subtitle" className="text-base font-bold text-slate-700 dark:text-slate-300">Kurs Alt Başlığı</Label>
                  <Input
                    id="subtitle"
                    placeholder="Sıfırdan başlayarak profesyonel seviyeye ulaşın"
                    className={`h-12 px-5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${validationErrors.subtitle ? 'border-red-500 bg-red-50/30' : ''}`}
                    value={courseData.subtitle}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, subtitle: e.target.value }));
                      if (validationErrors.subtitle) setValidationErrors(prev => ({ ...prev, subtitle: '' }));
                    }}
                  />
                  {validationErrors.subtitle && <p className="text-red-500 text-xs mt-1 ml-1 font-medium italic">{validationErrors.subtitle}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-base font-bold text-slate-700 dark:text-slate-300">Kurs Açıklaması</Label>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Öğrencileriniz bu kursta ne öğrenecek? Onları heyecanlandırın!"
                    rows={8}
                    className={`px-5 py-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all leading-relaxed resize-none ${validationErrors.description ? 'border-red-500 bg-red-50/30' : ''}`}
                    value={courseData.description}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, description: e.target.value }));
                      if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
                    }}
                  />
                  {validationErrors.description && <p className="text-red-500 text-xs mt-1 ml-1 font-medium italic">{validationErrors.description}</p>}
                </div>
              </div>

              {/* Right Side: Media Assets */}
              <div className="space-y-8">
                {/* Thumbnail Upload */}
                <div className="space-y-4">
                  <Label className="text-base font-bold text-slate-700 dark:text-slate-300">İlgi Çekici Bir Kapak Görseli</Label>
                  <div
                    className="group relative h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-500 cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                    {coverPreviewUrl ? (
                      <div className="w-full h-full relative">
                        <img src={coverPreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <Button variant="secondary" className="rounded-full shadow-lg bg-white/90 text-slate-900 hover:bg-white">
                            <ImageIcon className="w-4 h-4 mr-2" /> Görseli Değiştir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-slate-700 dark:text-slate-300">Görsel Yüklemek İçin Tıklayın</p>
                          <p className="text-sm text-slate-400">1280x720 (16:9) önerilir • JPG, PNG</p>
                        </div>
                      </div>
                    )}

                    {/* Yükleniyor overlay */}
                    {mediaProgress.cover > 0 && mediaProgress.cover < 1 && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <svg className="w-7 h-7 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 animate-pulse">Görsel Yükleniyor...</p>
                          <p className="text-xs text-slate-400 mt-1">{Math.round(mediaProgress.cover * 100)}% tamamlandı</p>
                        </div>
                        <div className="w-48">
                          <div className="h-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round(mediaProgress.cover * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Promo Video Upload */}
                <div className="space-y-4">
                  <Label className="text-base font-bold text-slate-700 dark:text-slate-300">Tanıtım Videosu</Label>
                  <div
                    className="group relative h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-500 cursor-pointer overflow-hidden"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

                    {/* Yükleniyor durumu */}
                    {mediaProgress.promo > 0 && mediaProgress.promo < 1 && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                        <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <svg className="w-7 h-7 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300 animate-pulse">Video Yükleniyor...</p>
                          <p className="text-xs text-slate-400 mt-1">{Math.round(mediaProgress.promo * 100)}% tamamlandı</p>
                        </div>
                        <div className="w-48">
                          <div className="h-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round(mediaProgress.promo * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {promoVideo && mediaProgress.promo === 0 ? (
                      <div className="w-full h-full flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto shadow-lg">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-400 truncate max-w-[200px]">{(promoVideo as any).name || 'Tanıtım Videosu'}</p>
                          <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:bg-purple-100 rounded-lg">Farklı Video Seç</Button>
                        </div>
                      </div>
                    ) : courseData.previewVideo?.cdnPath && mediaProgress.promo === 0 ? (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                            <Check className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Tanıtım Videosu Yüklendi</p>
                          <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:bg-emerald-100 rounded-lg">Değiştir</Button>
                        </div>
                      </div>
                    ) : mediaProgress.promo === 0 ? (
                      <div className="w-full h-full flex items-center gap-6 p-8">
                        <div className="w-16 h-16 rounded-[22px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:rotate-6 transition-all duration-300">
                          <Video className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-slate-700 dark:text-slate-300">Önizleme Videosu Ekleyin</p>
                          <p className="text-sm text-slate-400">Öğrencilerin kursun kalitesini görmesini sağlayın.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kategori</Label>
                  <Select value={courseData.category} onValueChange={(val) => {
                    setSelectedCategory(val);
                    setCourseData(prev => ({ ...prev, category: val, subcategory: '' }));
                    if (validationErrors.category) setValidationErrors(prev => ({ ...prev, category: '' }));
                  }}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500">
                      <SelectValue placeholder="Seçim yapın" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl border-none ring-1 ring-slate-100 dark:ring-slate-800">
                      {COURSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)} className="rounded-lg">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alt Kategori</Label>
                  <Select value={courseData.subcategory} onValueChange={(val) => setCourseData(prev => ({ ...prev, subcategory: val }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 disabled:opacity-50" disabled={!courseData.category}>
                      <SelectValue placeholder="Seçim yapın" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                      {courseData.category && COURSE_CATEGORIES.find(cat => String(cat.id) === String(courseData.category))?.subcategories.map(sub => (
                        <SelectItem key={sub.id} value={String(sub.id)} className="rounded-lg">{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Eğitim Dili</Label>
                  <Select value={courseData.language || ''} onValueChange={(val) => setCourseData(prev => ({ ...prev, language: val }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500">
                      <SelectValue placeholder="Dil Ekleyiniz" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="rounded-lg">{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Zorluk Seviyesi</Label>
                  <Select value={courseData.level || ''} onValueChange={(val) => setCourseData(prev => ({ ...prev, level: val as any }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500">
                      <SelectValue placeholder="Seviye Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 shadow-2xl">
                      <SelectItem value="beginner" className="rounded-lg">Başlangıç</SelectItem>
                      <SelectItem value="intermediate" className="rounded-lg">Orta Seviye</SelectItem>
                      <SelectItem value="advanced" className="rounded-lg">İleri Seviye</SelectItem>
                      <SelectItem value="all" className="rounded-lg">Tüm Seviyeler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div >
        );

      case 2:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Kurs Müfredatı</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Öğrencilerinizin takip edeceği planı oluşturun, derslerinizi organize edin ve içeriklerinizi yükleyin.</p>
              </div>
              <div className="flex items-center gap-4 text-sm px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col items-center">
                  <span className="font-black text-indigo-600 text-lg">{courseData.sections.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bölüm</span>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-emerald-600 text-lg">{courseData.sections.reduce((total, section) => total + section.lessons.length, 0)}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Ders</span>
                </div>
              </div>
            </div>

            {/* Drag Drop Area */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                    {courseData.sections.map((section, sectionIndex) => (
                      <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="group/section">
                            <Card className={cn(
                              "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
                              section.isExpanded 
                                ? 'bg-white dark:bg-slate-900 ring-4 ring-indigo-50/50 dark:ring-indigo-900/20' 
                                : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-white border border-slate-100 dark:border-slate-800'
                            )}>
                              {/* Section Header */}
                              <div className={cn(
                                "p-5 flex items-center gap-4 transition-colors",
                                section.isExpanded ? "border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" : ""
                              )}>
                                <div {...provided.dragHandleProps} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing shadow-sm">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                  <div className="flex flex-col flex-1">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-1 ml-1">Bölüm {sectionIndex + 1}</span>
                                    <Input
                                      placeholder="Bu bölümün başlığını girin (Örn: Giriş ve Kurulum)"
                                      value={section.title}
                                      onChange={(e) => setCourseData(prev => ({
                                        ...prev,
                                        sections: prev.sections.map(s => s.id === section.id ? { ...s, title: e.target.value, titleSaved: false } : s)
                                      }))}
                                      className="h-12 w-full bg-transparent border-none focus-visible:ring-0 text-xl font-bold px-1 rounded-none shadow-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {!section.titleSaved && section.title.trim() && (
                                      <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                                        onClick={async () => {
                                          const token = localStorage.getItem('token');
                                          if (!token) return toast.error('Oturum açmanız gerekiyor');
                                          try {
                                            const response = await fetch('https://api.edurce.com/api/courses/sections', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                              body: JSON.stringify({
                                                courseId: courseData.courseId || courseUrlId,
                                                sectionId: section.dbSectionId || null,
                                                title: section.title,
                                                sortOrder: sectionIndex
                                              })
                                            });
                                            if (!response.ok) throw new Error('Kayıt başarısız');
                                            const result = await response.json();
                                            setCourseData(prev => ({
                                              ...prev,
                                              sections: prev.sections.map(s => s.id === section.id ? { ...s, titleSaved: true, isExpanded: true, dbSectionId: result.sectionId } : s)
                                            }));
                                            toast.success('Bölüm kaydedildi');
                                          } catch (e: any) { toast.error(e.message); }
                                        }}
                                      >
                                        <Save className="w-4 h-4 mr-2" /> Bölümü Kaydet
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl w-10 h-10 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                      onClick={() => setCourseData(prev => ({
                                        ...prev,
                                        sections: prev.sections.map(s => s.id === section.id ? { ...s, isExpanded: !s.isExpanded } : s)
                                      }))}
                                    >
                                      {section.isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl w-10 h-10 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                                      onClick={() => removeSection(section.id, section.dbSectionId)}
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Lessons Area */}
                              {section.isExpanded && section.titleSaved && (
                                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
                                  <Droppable droppableId={section.id} type="lesson">
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                        {section.lessons.map((lesson, lessonIndex) => (
                                          <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                            {(provided) => (
                                              <div ref={provided.innerRef} {...provided.draggableProps} className="group/lesson relative pl-6">
                                                {/* Connecting Line */}
                                                <div className="absolute left-2.5 top-0 bottom-[-16px] w-[2px] bg-slate-100 dark:bg-slate-800 group-last/lesson:bottom-0"></div>
                                                <div className="absolute left-[3px] top-6 w-[7px] h-[7px] rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900 transition-colors group-hover/lesson:bg-indigo-400"></div>

                                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 overflow-hidden">
                                                  
                                                  {/* Lesson Header */}
                                                  <div className="p-3 pl-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                                                    <div {...provided.dragHandleProps} className="text-slate-300 hover:text-indigo-500 transition-colors cursor-grab active:cursor-grabbing p-1">
                                                      <GripVertical className="w-4 h-4" />
                                                    </div>
                                                    
                                                    <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-xl px-3 py-1 ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                                      <span className="text-[11px] font-black text-slate-400 mr-2 border-r border-slate-100 pr-2">Ders {lessonIndex + 1}</span>
                                                      <Input
                                                        value={lesson.title}
                                                        placeholder="Ders başlığını girin..."
                                                        onChange={(e) => setCourseData(prev => ({
                                                          ...prev,
                                                          sections: prev.sections.map(s => s.id === section.id ? {
                                                            ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, title: e.target.value, titleSaved: false } : l)
                                                          } : s)
                                                        }))}
                                                        className="h-9 border-none bg-transparent focus-visible:ring-0 font-medium text-sm p-0 flex-1"
                                                      />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {!lesson.titleSaved && lesson.title.trim() && (
                                                        <Button
                                                          size="sm"
                                                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm"
                                                          onClick={async () => {
                                                            const token = localStorage.getItem('token');
                                                            if (!token) return toast.error('Oturum açmanız gerekiyor');
                                                            try {
                                                              const response = await fetch('https://api.edurce.com/api/courses/lessons', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({
                                                                  courseId: courseData.courseId || courseUrlId,
                                                                  sectionId: section.dbSectionId,
                                                                  lessonId: lesson.dbLessonId || null,
                                                                  title: lesson.title,
                                                                  sortOrder: lessonIndex,
                                                                  isFree: lesson.isFree || false
                                                                })
                                                              });
                                                              if (!response.ok) throw new Error('Kayıt başarısız');
                                                              const result = await response.json();
                                                              setCourseData(prev => ({
                                                                ...prev,
                                                                sections: prev.sections.map(s => s.id === section.id ? {
                                                                  ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, titleSaved: true, dbLessonId: result.lessonId } : l)
                                                                } : s)
                                                              }));
                                                              toast.success('Ders kaydedildi');
                                                            } catch (e: any) { toast.error(e.message); }
                                                          }}
                                                        >
                                                          Kaydet
                                                        </Button>
                                                      )}
                                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => removeLesson(section.id, lesson.id, lesson.dbLessonId)}>
                                                        <Trash2 className="w-4 h-4" />
                                                      </Button>
                                                    </div>
                                                  </div>

                                                  {/* Lesson Body (Video & Resources) */}
                                                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                                    {!lesson.fileName ? (
                                                      <div className="flex flex-col items-start gap-2">
                                                        <Button 
                                                          variant="outline" 
                                                          className="h-10 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-600 rounded-xl px-4 text-sm font-semibold gap-2 disabled:opacity-50 transition-all shadow-sm" 
                                                          onClick={() => handleFileUpload(section.id, lesson.id, 'video', lesson.dbLessonId)} 
                                                          disabled={!lesson.titleSaved}
                                                        >
                                                          <Video className="w-4 h-4" /> Video İçeriği Yükle
                                                        </Button>
                                                        {!lesson.titleSaved && (
                                                          <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Video yüklemek için önce dersi kaydetmelisiniz.</span>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-4">
                                                        {/* Video Status Row */}
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                                                              <PlayCircle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">{lesson.fileName}</h4>
                                                              <div className="flex items-center gap-3 mt-1">
                                                                {lesson.durationSeconds != null && lesson.durationSeconds > 0 && (
                                                                  <div className="flex items-center text-[11px] font-bold text-slate-500">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {Math.floor(lesson.durationSeconds / 60) > 0 ? `${Math.floor(lesson.durationSeconds / 60)} dk ` : ''}{lesson.durationSeconds % 60} sn
                                                                  </div>
                                                                )}

                                                                {lesson.processingStatus === 'processing' && (
                                                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full flex items-center gap-1.5 px-2 py-0.5">
                                                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Yükleniyor...
                                                                  </span>
                                                                )}
                                                                {lesson.processingStatus === 'pending' && (
                                                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full flex items-center gap-1.5 px-2 py-0.5">
                                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> İşleniyor
                                                                  </span>
                                                                )}
                                                                {(lesson.processingStatus === 'completed' || lesson.processingStatus === 'processed') && (
                                                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full flex items-center gap-1.5 px-2 py-0.5">
                                                                    <Check className="w-3 h-3" /> Hazır
                                                                  </span>
                                                                )}
                                                                {lesson.processingStatus === 'error' && (
                                                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">Hata!</span>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" onClick={() => {
                                                              setDeleteConfirmation({
                                                                isOpen: true,
                                                                type: 'video',
                                                                sectionId: section.id,
                                                                lessonId: lesson.id,
                                                                dbId: lesson.dbLessonId
                                                              });
                                                            }}>
                                                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Videoyu Sil
                                                            </Button>
                                                          </div>
                                                        </div>

                                                        {/* Resources Section */}
                                                        {lesson.titleSaved && lesson.dbLessonId && (
                                                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center justify-between mb-2">
                                                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ek Kaynaklar</span>
                                                              <label className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors">
                                                                <Plus className="w-3 h-3" /> Kaynak Ekle
                                                                <input
                                                                  type="file"
                                                                  className="hidden"
                                                                  accept=".pdf,.doc,.docx,.zip,.rar,.pptx,.xlsx,.txt,.png,.jpg"
                                                                  onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    
                                                                    // Optimistic UI upload simulation / real backend call
                                                                    const formData = new FormData();
                                                                    formData.append('file', file);
                                                                    formData.append('lessonId', lesson.dbLessonId!.toString());
                                                                    formData.append('courseSlug', courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled');
                                                                    const token = localStorage.getItem('token');
                                                                    
                                                                    const loadingToast = toast.loading(`${file.name} yükleniyor...`);
                                                                    
                                                                    try {
                                                                      const res = await fetch('https://api.edurce.com/api/lessons/resource/upload', {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                                        body: formData
                                                                      });
                                                                      if (!res.ok) throw new Error('Yükleme başarısız');
                                                                      const result = await res.json();
                                                                      
                                                                      toast.success(`Kaynak başarıyla eklendi!`, { id: loadingToast });
                                                                      
                                                                      // Local State Update
                                                                      setCourseData(prev => ({
                                                                        ...prev,
                                                                        sections: prev.sections.map(s => s.id === section.id ? {
                                                                          ...s, lessons: s.lessons.map(l => l.id === lesson.id ? {
                                                                            ...l,
                                                                            resources: [...(l.resources || []), {
                                                                              id: result.resource?.resource_id || Math.random().toString(),
                                                                              name: file.name,
                                                                              url: result.resource?.url || '',
                                                                              type: file.name.endsWith('pdf') ? 'pdf' : 'doc',
                                                                              size: file.size
                                                                            }]
                                                                          } : l)
                                                                        } : s)
                                                                      }));
                                                                    } catch (err: any) {
                                                                      toast.error(`Kaynak yükleme hatası: ${err.message}`, { id: loadingToast });
                                                                    }
                                                                  }}
                                                                />
                                                              </label>
                                                            </div>

                                                            {lesson.resources && lesson.resources.length > 0 ? (
                                                              <ul className="space-y-2">
                                                                {lesson.resources.map((resource, idx) => (
                                                                  <li key={idx} className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                                                    <div className={cn(
                                                                      "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                      resource.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                                                                    )}>
                                                                      <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{resource.name}</p>
                                                                      <p className="text-[10px] text-slate-400">{(resource.size && resource.size > 0) ? (resource.size / 1024 / 1024).toFixed(2) + ' MB' : 'Döküman'}</p>
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => {
                                                                      setDeleteConfirmation({
                                                                        isOpen: true,
                                                                        type: 'resource',
                                                                        sectionId: section.id,
                                                                        lessonId: lesson.id,
                                                                        resourceId: resource.id,
                                                                        resourceName: resource.name
                                                                      });
                                                                    }}>
                                                                      <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            ) : (
                                                              <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                                                                Henüz kaynak eklenmemiş. Öğrenciler için faydalı olabilecek dökümanlar yükleyin.
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        
                                        <div className="pl-6 pt-2">
                                          <Button
                                            variant="outline"
                                            className="w-full h-12 border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-500 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                                            onClick={() => addLesson(section.id)}
                                          >
                                            <Plus className="w-5 h-5" /> Bu Bölüme Yeni Ders Ekle
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>


            {/* Bölüm Ekle Butonu - Altta */}
            <Button
              onClick={addSection}
              variant="ghost"
              className="w-full h-12 border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-slate-400 hover:text-indigo-600 font-medium transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Bölüm Ekle
            </Button>

            <div className="flex items-center gap-6 px-2 text-sm text-slate-500">
              <span><span className="font-bold text-slate-700 dark:text-white">{courseData.sections.length}</span> Bölüm</span>
              <span><span className="font-bold text-slate-700 dark:text-white">{courseData.sections.reduce((total, section) => total + section.lessons.length, 0)}</span> Ders</span>
            </div>
          </div >
        );

      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-6">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Kurs Fiyatlandırma</h2>
              <p className="text-slate-500">Kursunuzun satış fiyatını ve para birimini belirleyin.</p>
            </div>

            <Card className="max-w-3xl mx-auto border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Para Birimi</Label>
                    <Select
                      value={courseData.currency || ''}
                      onValueChange={(value) => {
                        const newPrices = getPriceOptionsForCurrency(value);
                        setCourseData(prev => ({
                          ...prev,
                          currency: value,
                          price: '' as any // Reset price when currency changes
                        }));
                      }}
                    >
                      <SelectTrigger className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                        <SelectValue placeholder="Para birimi seçin" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-slate-200 shadow-2xl">
                        {CURRENCY_PRICING.map((curr) => (
                          <SelectItem key={curr.currency} value={curr.currency} className="rounded-lg font-medium">
                            {curr.name} ({curr.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Satış Fiyatı</Label>
                      <Select
                        value={courseData.price?.toString() || ''}
                        onValueChange={(value) => {
                          const opts = getPriceOptionsForCurrency(courseData.currency);
                          const chosen = opts.find(o => o.value.toString() === value);
                          setCourseData(prev => ({
                            ...prev,
                            price: parseFloat(value),
                            ...(chosen ? { price_level: chosen.level } : {})
                          } as any));
                        }}
                        disabled={!courseData.currency}
                      >
                      <SelectTrigger className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all font-bold">
                        <SelectValue placeholder={!courseData.currency ? "Önce para birimi seçin" : "Fiyat seçin"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-slate-200 shadow-2xl max-h-[300px]">
                        {courseData.currency && getPriceOptionsForCurrency(courseData.currency).map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()} className="rounded-lg font-medium text-emerald-600">
                            {option.displayPrice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!courseData.price || !courseData.currency) {
                        toast.error('Lütfen fiyat ve para birimi seçin');
                        return;
                      }
                      saveCourseToServer(false);
                      toast.success('Fiyat başarıyla kaydedildi');
                    }}
                    disabled={!courseData.price || !courseData.currency}
                    className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-6">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Hedef Kitle ve Kazanımlar</h2>
              <p className="text-slate-500">Öğrencilerinize ne öğreteceğinizi ve kimler için uygun olduğunu tanımlayın.</p>
            </div>

            <div className="space-y-8">
              {/* Öğrenme Hedefleri Kartı */}
              <Card className="border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="p-8 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Öğrenme Hedefleri</CardTitle>
                    <p className="text-xs text-slate-500">Öğrencilerin kurs sonunda kazanacağı beceriler</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-4">
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Örn: React ile modern web uygulamaları geliştirebileceksiniz"
                          value={objective}
                          onChange={(e) => updateLearningObjective(index, e.target.value)}
                          className="h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium"
                          maxLength={160}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
                          {objective.length}/160
                        </span>
                      </div>
                      {learningObjectives.length > 1 && (
                        <Button
                          variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 rounded-xl"
                          onClick={() => removeLearningObjective(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addLearningObjective}
                    variant="ghost"
                    className="w-full h-12 border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-slate-400 hover:text-indigo-600 font-bold transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Hedef Ekle
                  </Button>
                </CardContent>
              </Card>

              {/* Ön Koşullar Kartı */}
              <Card className="border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="p-8 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Ön Koşullar</CardTitle>
                    <p className="text-xs text-slate-500">Öğrencilerin kursa başlamadan önce bilmesi gerekenler</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-4">
                  {prerequisites.map((prerequisite, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Örn: Temel HTML ve CSS bilgisi"
                          value={prerequisite}
                          onChange={(e) => updatePrerequisite(index, e.target.value)}
                          className="h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium"
                          maxLength={160}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
                          {prerequisite.length}/160
                        </span>
                      </div>
                      {prerequisites.length > 1 && (
                        <Button
                          variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 rounded-xl"
                          onClick={() => removePrerequisite(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addPrerequisite}
                    variant="ghost"
                    className="w-full h-12 border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-slate-400 hover:text-blue-600 font-bold transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Gereksinim Ekle
                  </Button>
                </CardContent>
              </Card>

              {/* Hedef Kitle Kartı */}
              <Card className="border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="p-8 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Hedef Kitle</CardTitle>
                    <p className="text-xs text-slate-500">Bu kurs kimler için tasarlanmıştır?</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-4">
                  {audiences.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Örn: Web geliştirme dünyasına yeni girmek isteyen öğrenciler"
                          value={item}
                          onChange={(e) => updateAudience(index, e.target.value)}
                          className="h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all font-medium"
                          maxLength={160}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
                          {item.length}/160
                        </span>
                      </div>
                      {audiences.length > 1 && (
                        <Button
                          variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 rounded-xl"
                          onClick={() => removeAudience(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addAudience}
                    variant="ghost"
                    className="w-full h-12 border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-purple-400 hover:bg-purple-50/50 rounded-xl text-slate-400 hover:text-purple-600 font-bold transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Kitle Ekle
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="pt-6 flex justify-center">
              <Button
                onClick={() => {
                  saveCourseToServer(false);
                  toast.success('Ayarlar başarıyla kaydedildi');
                }}
                className="h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
              >
                <Save className="w-5 h-5 mr-3" />
                Bilgileri Kaydet
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {(!courseData.price || !(courseData as any).price_level) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <Tag className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Önce Kurs Fiyatını Belirleyin</h3>
                <p className="text-slate-500 max-w-sm">Kupon oluşturabilmek için öncelikle Fiyatlandırma sekmesinden kursunuzun fiyatını seçmelisiniz.</p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kupon Oluştur</h2>
                  <p className="text-sm text-slate-500 mt-1">Kursunuz için özel fiyatlı indirim kuponu oluşturun ve kaydedin.</p>
                </div>

                <Card className="border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Kupon Kodu</Label>
                        <Input
                          placeholder="INDIRIM20"
                          value={couponData.code}
                          onChange={(e) => setCouponData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          className="h-11 rounded-xl font-mono font-bold tracking-widest"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Kupon Fiyatı</Label>
                        <Select
                          value={couponData.priceLevel?.toString() || ''}
                          onValueChange={(value) => {
                            const option = getPriceOptionsForCurrency(courseData.currency).find(o => o.level.toString() === value);
                            if (option) {
                              setCouponData(prev => ({ ...prev, priceLevel: option.level, discountPrice: option.value }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-xl font-bold text-emerald-600">
                            <SelectValue placeholder="İndirimli fiyat seçin" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {getPriceOptionsForCurrency(courseData.currency).filter(opt => opt.level < (courseData as any).price_level).length > 0 ? (
                                getPriceOptionsForCurrency(courseData.currency)
                                  .filter(opt => opt.level < (courseData as any).price_level)
                                  .map((option) => (
                                    <SelectItem key={option.level} value={option.level.toString()}>
                                      {option.displayPrice}
                                    </SelectItem>
                                  ))
                              ) : (
                                <div className="p-2 text-sm text-slate-500 font-medium text-center">Daha düşük bir fiyat seviyesi yok</div>
                              )
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Kullanım Limiti</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={couponData.usageLimit || ''}
                          onChange={(e) => setCouponData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                          className="h-11 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Son Geçerlilik</Label>
                        <Input
                          type="date"
                          value={couponData.validUntil}
                          onChange={(e) => setCouponData(prev => ({ ...prev, validUntil: e.target.value }))}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{couponData.isActive ? 'Kupon Aktif' : 'Kupon Pasif'}</span>
                      <Switch
                        checked={couponData.isActive}
                        onCheckedChange={(checked) => setCouponData(prev => ({ ...prev, isActive: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Önizleme */}
                {couponData.code && couponData.priceLevel > 0 && (
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Tag className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">
                          Yeni Fiyat: {couponData.discountPrice} {courseData.currency}
                        </p>
                        <p className="text-slate-400 text-xs">Kod: <span className="font-mono font-bold text-orange-400">{couponData.code}</span></p>
                      </div>
                    </div>
                    <div className="text-right text-slate-400 text-xs">
                      <p>Limit: {couponData.usageLimit} kullanım</p>
                      {couponData.validUntil && <p>Son: {couponData.validUntil}</p>}
                    </div>
                  </div>
                )}

                <Button
                  onClick={async () => {
                    // Check if course is created yet (has courseId)
                    if (!creatorId || creatorId === 'new') {
                      toast.error('Lütfen önce kursu taslak olarak kaydedin!');
                      return;
                    }
                    if (!couponData.code || couponData.priceLevel <= 0) {
                      toast.error('Kupon kodu ve indirim fiyatı zorunludur');
                      return;
                    }
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/coupons', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                          course_id: creatorId,
                          code: couponData.code,
                          price_level: couponData.priceLevel,
                          discount_price: couponData.discountPrice,
                          usage_limit: couponData.usageLimit,
                          expires_at: couponData.validUntil || null,
                          is_active: couponData.isActive
                        })
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Kayıt başarısız');
                      }
                      toast.success('Kupon başarıyla kaydedildi!');
                      setCouponData({ code: '', priceLevel: 0, discountPrice: 0, validUntil: '', usageLimit: 100, isActive: true });
                    } catch (err: any) {
                      toast.error(`Kupon kayıt hatası: ${err.message}`);
                    }
                  }}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all"
                >
                  <Save className="w-4 h-4 mr-2" /> Kuponu Kaydet
                </Button>
              </>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-6">
                <Award className="w-12 h-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Sertifika Sistemi</h2>
              <p className="text-slate-500 text-base max-w-md">Bu özellik şu anda geliştirme aşamasındadır. Çok yakında kursunuzu tamamlayan öğrencilere otomatik sertifika verebileceksiniz.</p>
              <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-sm font-bold">
                <Rocket className="w-4 h-4" />
                Yakında Geliyor
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col w-full h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-inner">
              {/* Kurs Detay Sayfası Taslağı (CourseDetailPage Önizlemesi) */}
              <div className="w-full text-left">
                {/* 1. Breadcrumb / Kategori */}
                <div className="bg-[#111827] px-6 py-4 flex items-center text-sm text-gray-400 gap-2 border-b border-gray-800 sticky top-0 z-20">
                  <span>{COURSE_CATEGORIES.find(c => String(c.id) === courseData.category)?.name || 'Kategori'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <span>{COURSE_CATEGORIES.find(c => String(c.id) === courseData.category)?.subcategories?.find(s => String(s.id) === courseData.subcategory)?.name || 'Alt Kategori'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-200 font-bold truncate">{courseData.title || 'Kurs Başlığı'}</span>
                </div>

                {/* 2. Hero Section */}
                <div className="bg-gradient-to-b from-[#111827] to-gray-900 p-6 lg:p-10 relative overflow-hidden">
                  <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">

                    {/* Media / Video Placeholder */}
                    <div className="lg:col-span-6 relative rounded-2xl overflow-hidden ring-1 ring-white/10 aspect-video bg-black flex items-center justify-center">
                      {(coverPreviewUrl || (courseData as any).image) ? (
                        <div className="w-full h-full relative group">
                          <img src={coverPreviewUrl || (courseData as any).image || ''} alt="Kapak" className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-xl" />
                            <span className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full text-sm font-medium">Önizleme Videosu</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <PlayCircle className="w-16 h-16 mb-2 opacity-50" />
                          <span>Video veya Kapak Görseli</span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="lg:col-span-6 flex flex-col items-start text-white space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20">Yeni</Badge>
                        <Badge className="bg-white/10 text-gray-300 border-white/20">{courseData.level || 'Tüm Seviyeler'}</Badge>
                      </div>

                      <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
                        {courseData.title || 'Kurs Başlığınız'}
                      </h1>

                      <p className="text-lg text-gray-400 font-medium line-clamp-2">
                        {courseData.subtitle || 'Kurs alt başlığı...'}
                      </p>

                      {/* Eğitmen Kısmı */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-10 h-10 rounded-full bg-[#0D9488]/20 flex items-center justify-center overflow-hidden border border-white/10">
                          <UserCircle className="w-6 h-6 text-[#0D9488]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Eğitmen</p>
                          <p className="text-base font-bold text-white">{user?.first_name} {user?.last_name || 'Eğitmen Adı'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Sections */}
                <div className="p-8 lg:p-12 space-y-12">
                  {/* Neler Öğreneceksiniz? */}
                  {courseData.learningObjectives?.length > 0 && (
                    <div className="bg-teal-50/30 dark:bg-slate-800/50 rounded-3xl p-8 border border-teal-100/50 dark:border-slate-800 shadow-sm">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-[#0D9488]">
                        <ShieldCheck className="w-6 h-6" />
                        Neler Öğreneceksiniz?
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {courseData.learningObjectives.map((item, i) => (
                          <div key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 group">
                            <Check className="w-4 h-4 text-[#0D9488] shrink-0 mt-1" />
                            <span className="text-sm font-medium leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kurs Açıklaması */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-slate-400" />
                      Kurs Hakkında
                    </h3>
                    <div className="text-[16px] text-slate-600 dark:text-slate-400 leading-[1.8] break-words whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                      {courseData.description || 'Kurs açıklaması içeriği buraya gelecek...'}
                    </div>
                  </div>

                  {/* Kimin İçin Uygun? */}
                  {courseData.targetAudience?.length > 0 && (
                    <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/20 shadow-sm">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-indigo-600">
                        <Users className="w-6 h-6" />
                        Kimin İçin Uygun?
                      </h3>
                      <div className="space-y-3">
                        {courseData.targetAudience.map((audience, i) => (
                          <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm ring-4 ring-indigo-50 dark:ring-indigo-900/20" />
                            <span className="text-sm font-medium leading-relaxed">{audience}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Bottom Bar (Pricing & Action) */}
                <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#0D9488]" />
                      <span className="font-semibold">0 Saat İçerik</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#0D9488]" />
                      <span className="font-semibold">{(courseData.sections || []).reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0)} Ders</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 text-slate-400">Kurs Ücreti</p>
                      <p className="text-3xl font-black text-[#0D9488]">
                        {courseData.price > 0 ? `₺${courseData.price}` : 'Ücretsiz'}
                      </p>
                    </div>
                    <Button className="h-14 px-8 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold text-lg shadow-xl shadow-teal-100 dark:shadow-none whitespace-nowrap pointer-events-none">
                      Hemen Kaydol
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step {currentStep} content</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-500">
      {/* Background Ornaments */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Kurs Oluşturma Stüdyosu
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Kursunuzu profesyonel bir eğitim deneyimine dönüştürmek için ihtiyacınız olan tüm araçlar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Floating Sticky Steps Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden ring-1 ring-white/50 dark:ring-slate-800">
                <CardContent className="p-3 space-y-1">
                  {steps.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = steps.indexOf(steps.find(s => s.id === currentStep)!) > index;
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`group w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 relative ${isActive
                          ? 'bg-gradient-to-r from-indigo-600/10 to-transparent text-indigo-700 dark:text-indigo-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full" />
                        )}
                        <div className="text-left">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Adım {index + 1}</p>
                          <p className="text-base leading-none">{step.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[40px] overflow-hidden min-h-[600px] flex flex-col transition-all duration-500">
              <CardHeader className="px-10 pt-12 pb-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-50 px-3 py-1 rounded-full mb-2">
                      Adım {steps.indexOf(steps.find(s => s.id === currentStep)!) + 1} / {steps.length}
                    </Badge>
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                      {steps.find(s => s.id === currentStep)?.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-10 pb-10 flex-grow">
                <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-[32px] p-8 min-h-[400px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    className="rounded-xl px-8 h-12 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 font-semibold transition-all"
                    onClick={() => {
                      const idx = steps.findIndex(s => s.id === currentStep);
                      if (idx > 0) {
                        setCurrentStep(steps[idx - 1].id);
                      }
                    }}
                    disabled={steps.findIndex(s => s.id === currentStep) === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Önceki Adım
                  </Button>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {(courseData as any).status === 'published' ? (
                      /* Kurs zaten yayınlanda → sadece Güncelle butonu */
                      <>
                        {steps.findIndex(s => s.id === currentStep) < steps.length - 1 && (
                          <Button
                            variant="outline"
                            className="flex-1 sm:flex-none rounded-xl px-8 h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-medium transition-all"
                            onClick={async () => {
                              const idx = steps.findIndex(s => s.id === currentStep);
                              await saveCourseToServer(false);
                              setCurrentStep(steps[idx + 1].id);
                            }}
                          >
                            Sonraki Adım
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                        <Button
                          className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none rounded-xl px-10 h-12 font-bold transition-all hover:scale-[1.02] active:scale-95"
                          onClick={() => saveCourseToServer(false)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Kursu Güncelle
                        </Button>
                      </>
                    ) : (
                      /* Kurs taslak → normal akış */
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none rounded-xl px-8 h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-all"
                          onClick={() => saveCourseToServer(false)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Taslağı Kaydet
                        </Button>
                        <Button
                          className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl px-10 h-12 font-bold transition-all hover:scale-[1.02] active:scale-95"
                          onClick={async () => {
                            const idx = steps.findIndex(s => s.id === currentStep);
                            const isLast = idx === steps.length - 1;
                            await saveCourseToServer(isLast);
                            if (isLast) return;
                            setCurrentStep(steps[idx + 1].id);
                          }}
                        >
                          {steps.findIndex(s => s.id === currentStep) === steps.length - 1 ? 'Kursu Yayınla' : 'Sonraki Adım'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats / Info Footer */}
            <div className="px-6 py-4 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/50 dark:border-slate-800 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Verileriniz güvende</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Otomatik kayıt aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Global içerik standartları</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOSYA YÜKLEME MODALI - Profesyonel Tasarım */}
        {showFileUpload && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
            onClick={() => {
              setShowFileUpload(false);
              document.body.style.overflow = 'auto';
            }}
          >
            <div
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-8 pt-8 pb-6 ${uploadType === 'video' ? 'bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20' :
                uploadType === 'presentation' ? 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20' :
                  'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${uploadType === 'video' ? 'bg-violet-600' :
                      uploadType === 'presentation' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                      {uploadType === 'video' && <Video className="w-7 h-7 text-white" />}
                      {uploadType === 'presentation' && <Presentation className="w-7 h-7 text-white" />}
                      {uploadType === 'document' && <FileText className="w-7 h-7 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white">
                        {uploadType === 'video' ? 'Video Yükle' :
                          uploadType === 'presentation' ? 'Slayt Yükle' : 'Belge Yükle'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {uploadType === 'video' ? 'MP4, AVI, MOV, MKV • Maks. 500MB' :
                          uploadType === 'presentation' ? 'PPT, PPTX, PDF • Maks. 100MB' :
                            'PDF, DOC, DOCX, TXT • Maks. 50MB'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowFileUpload(false); document.body.style.overflow = 'auto'; }}
                    className="w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <div className="px-8 py-6">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${isDragOver
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.01]'
                    : uploadType === 'video'
                      ? 'border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      : uploadType === 'presentation'
                        ? 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      uploadType === 'video' ? 'video/*' :
                        uploadType === 'presentation' ? '.ppt,.pptx,.pdf,.odp' :
                          '.pdf,.doc,.docx,.txt,.rtf,.odt'
                    }
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDragOver ? 'bg-violet-600 scale-110' :
                      uploadType === 'video' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' :
                        uploadType === 'presentation' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      } transition-all duration-200`}>
                      {isDragOver
                        ? <Upload className="w-7 h-7 text-white" />
                        : uploadType === 'video'
                          ? <Video className="w-7 h-7" />
                          : uploadType === 'presentation'
                            ? <Presentation className="w-7 h-7" />
                            : <FileText className="w-7 h-7" />}
                    </div>

                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isDragOver ? 'Bırakın!' : 'Sürükleyin veya tıklayın'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {uploadType === 'video' && 'Ders videosunu buraya yükleyin'}
                        {uploadType === 'presentation' && 'Slayt dosyanızı buraya yükleyin'}
                        {uploadType === 'document' && 'Belge dosyanızı buraya yükleyin'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning for video */}
                {uploadType === 'video' && (
                  <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Video yüklendikten sonra HLS formatına dönüştürme başlar. Bu işlem sırasında <strong>sayfayı yenilemek bazı verilerin kaybolmasına neden olabilir.</strong>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    onClick={() => { setShowFileUpload(false); document.body.style.overflow = 'auto'; }}
                    className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-700 font-medium"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className={`flex-1 h-11 rounded-xl font-bold text-white shadow-sm ${uploadType === 'video' ? 'bg-violet-600 hover:bg-violet-700' :
                      uploadType === 'presentation' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Dosya Seç
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Makale Editörü Modalı */}
        {showArticleEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Makale İçeriği Oluştur</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="article-content">Makale İçeriği</Label>
                  <textarea
                    id="article-content"
                    value={articleContent}
                    onChange={(e) => setArticleContent(e.target.value)}
                    placeholder="Makale içeriğinizi buraya yazın..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {articleContent.length} karakter
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowArticleEditor(false);
                    setArticleContent('');
                  }}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={saveArticle}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!articleContent.trim()}
                >
                  Makaleyi Kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Crop Dialog */}
        <Dialog open={isCropping} onOpenChange={(open) => {
          if (!open) {
            setIsCropping(false);
            if (cropImage) {
              URL.revokeObjectURL(cropImage);
              setCropImage(null);
            }
          }
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Kurs Kapak Görselini Kırp</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden">
              {cropImage && (
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Yakınlaştır:</span>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(vals) => setZoom(vals[0])}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Görsel 16:9 oranında (1280x720 piksel) kırpılacaktır. En boy oranı kurs kartlarında en iyi görünümü sağlar.
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => {
                setIsCropping(false);
                if (cropImage) {
                  URL.revokeObjectURL(cropImage);
                  setCropImage(null);
                }
              }}>
                İptal
              </Button>
              <Button onClick={handleCropConfirm} className="bg-purple-600 hover:bg-purple-700">
                Kırp ve Yükle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black">
              {deleteConfirmation.type === 'section' && '⚠️ Bölümü Sil'}
              {deleteConfirmation.type === 'lesson' && '⚠️ Dersi Sil'}
              {deleteConfirmation.type === 'video' && '🗑️ Videoyu Sil'}
              {deleteConfirmation.type === 'resource' && '🗑️ Kaynağı Sil'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {deleteConfirmation.type === 'section' && (
                <>Bu bölümü silmek istediğinize emin misiniz? <strong>Altındaki tüm dersler, videolar ve kaynaklar</strong> hem veritabanından hem de bulut depolamadan (IDrive E2) kalıcı olarak silinecektir.</>
              )}
              {deleteConfirmation.type === 'lesson' && (
                <>Bu dersi silmek istediğinize emin misiniz? <strong>Derse ait video, HLS segmentleri ve tüm kaynak dosyalar</strong> kalıcı olarak silinecektir.</>
              )}
              {deleteConfirmation.type === 'video' && (
                <>Bu videoyu silmek istediğinize emin misiniz? <strong>Ham video dosyası ve tüm HLS segmentleri</strong> kalıcı olarak silinecektir.</>
              )}
              {deleteConfirmation.type === 'resource' && (
                <><strong>"{deleteConfirmation.resourceName}"</strong> dosyasını silmek istediğinize emin misiniz? Dosya hem veritabanından hem de bulut depolamadan kalıcı olarak silinecektir.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

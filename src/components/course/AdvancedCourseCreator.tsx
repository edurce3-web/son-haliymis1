import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EditorFrame } from '@/components/instructor/shell/EditorFrame';
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
import { API_BASE_URL } from '@/lib/api';
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
import { useCourseCreate, useCourseUpdate } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoryNav } from '@/hooks/useCategoryNav';
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
  Banknote,
  Tag,
  Percent,
  ShieldCheck,
  PlayCircle,
  UserCircle
} from 'lucide-react';
import CourseCard from '@/components/instructor/CourseCard';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/** Kurs yayınlanmadan önce girilmesi zorunlu öğrenme hedefi sayısı. */
const MIN_LEARNING_OBJECTIVES = 6;

/** Her adımın başlığının altında görünen kısa açıklama. */
const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Kursun adı, tanıtımı, kapağı ve katalogdaki yeri.',
  2: 'Bölümleri ve dersleri kur; videoları ve ek dosyaları yükle. Burada her şey anında kaydedilir.',
  3: 'Para birimini ve satış fiyatını seç.',
  4: 'Öğrencinin kursun sonunda neler yapabileceğini yaz.',
  5: 'İndirimli satış için kupon kodu tanımla.',
  6: 'Kursun öğrenciye nasıl görüneceğine bak.',
};

/** Sunucudan gelen listeyi en az `min` uzunluğa boş satırlarla tamamlar. */
const padToMin = (items: string[], min: number) => {
  const list = Array.isArray(items) ? [...items] : [];
  while (list.length < min) list.push('');
  return list;
};

// Frontend seviye değerlerini veritabanı ENUM değerlerine eşler.
// Hem tam kaydetme hem adım bazlı kaydetme kullandığı için bileşen dışında.
const levelMap: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  all: 'Tüm Seviyeler',
};

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
  /** Sunucudaki işleme kuyruğundan gelen ilerleme (0-100) */
  processingProgress?: number;
  /** İşlemenin hangi aşamada olduğu ("480p hazır", "12/60 parça yüklendi" ...) */
  processingStage?: string;
}

/**
 * Sunucudaki video_status değerinin arayüzdeki karşılığı.
 *
 * Sayfa yenilendiğinde işlemenin nerede kaldığı yalnızca buradan anlaşılıyor;
 * eşleme yanlış olursa biten video "işleniyor" gibi ya da süren iş "hazır"
 * gibi görünür.
 */
const VIDEO_STATUS_MAP: Record<string, CourseLesson['processingStatus']> = {
  pending: 'pending',
  queued: 'pending',
  uploading: 'uploading',
  processing: 'processing',
  processed: 'completed',
  completed: 'completed',
  error: 'error',
};

/** İşin hâlâ sürdüğü, dolayısıyla takip edilmesi gereken durumlar. */
const IN_FLIGHT_STATUSES: Array<CourseLesson['processingStatus']> = [
  'uploading', 'pending', 'processing',
];

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

                // Sunucudaki video durumunu arayüzün durumuna çevir. Sayfa
                // yenilendiğinde bu değer, işlemenin takibini yeniden
                // başlatan effect'i tetikler.
                const videoStatus = lesson.videoStatus || 'pending';
                if ((lesson.hlsManifestPath || lesson.sourceBucketPath || lesson.fileName || videoStatus !== 'pending') && !lesson.fileName) {
                  mappedLesson = {
                    ...mappedLesson,
                    type: 'video',
                    fileName: 'Mevcut Video',
                    uploadProgress: 1,
                    processingStatus: VIDEO_STATUS_MAP[videoStatus] || 'pending'
                  };
                } else if (lesson.fileName) {
                  mappedLesson = {
                    ...mappedLesson,
                    type: lesson.type || 'video',
                    uploadProgress: 1,
                    processingStatus: VIDEO_STATUS_MAP[videoStatus] || 'pending'
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
          // Kayıtlı hedef sayısı 6'dan azsa kalanı boş satır olarak açılır
          if (data.learningObjectives) {
            setLearningObjectives(padToMin(data.learningObjectives, MIN_LEARNING_OBJECTIVES));
          }
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
      const res = await fetch(`${API_BASE_URL}/courses/create-initial`, {
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

  // Kategoriler veritabanından. Eskiden sabit bir listeden okunuyordu ve
  // oradaki id'ler gerçek category_id değerleriyle ilgisizdi; kurslar yanlış
  // kategoriye kaydediliyordu.
  const { data: categoryNav } = useCategoryNav();
  const COURSE_CATEGORIES = categoryNav?.categories || [];
  const [courseImage, setCourseImage] = useState<File | null>(null);
  const [promoVideo, setPromoVideo] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  /** Süren işleri takip eden zamanlayıcıların ders kimlikleri. */
  const activePollsRef = useRef<Set<string>>(new Set());

  // Yalnızca tarayıcıdan sunucuya yükleme sürerken uyar. İşleme aşamasında
  // uyarmıyoruz: iş sunucuda devam ediyor ve sayfa yenilenince takip
  // kaldığı yerden sürüyor.
  useEffect(() => {
    const isUploading = courseData.sections.some(s =>
      s.lessons.some(l => l.processingStatus === 'uploading')
    );

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        const msg = 'Video yükleniyor. Sayfadan çıkarsanız yükleme yarıda kalır.';
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
        const dRes = await fetch(`${API_BASE_URL}/courses/lessons/${dbId}/video`, {
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
        const dRes = await fetch(`${API_BASE_URL}/lessons/resources/${resourceId}`, {
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
            ? `${API_BASE_URL}/courses/sections/${dbId}`
            : `${API_BASE_URL}/courses/lessons/${dbId}`;

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

      const res = await fetch(`${API_BASE_URL}/courses/full-save`, {
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
  // Öğrenme hedefleri: en az 6 tanesi zorunlu, form 6 boş satırla açılır.
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    Array.from({ length: MIN_LEARNING_OBJECTIVES }, () => '')
  );
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

  // ---------------------------------------------------------------------------
  // ADIM BAZLI KAYDETME
  // Her adımın kendi "Kaydet" butonu var ve yalnızca o adımın alanlarını gönderir.
  // Daha önce her buton tüm kursu (full-save) gönderiyordu; bir adımdaki eksik
  // alan başka adımın verisini eziyor ve kaydetme öngörülemez hale geliyordu.
  // ---------------------------------------------------------------------------
  const [savingStep, setSavingStep] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  /** Verilen adımın sunucuya gönderilecek verisini üretir. */
  const buildStepPayload = (stepId: number) => {
    switch (stepId) {
      case 1: // Temel Bilgiler
        return {
          course: {
            title: courseData.title.trim(),
            subtitle: courseData.subtitle.trim(),
            description: courseData.description.trim(),
            categoryId: courseData.category ? Number(courseData.category) : null,
            subcategoryId: courseData.subcategory ? Number(courseData.subcategory) : null,
            language: courseData.language || null,
            level: courseData.level ? levelMap[courseData.level] : null,
            imagePath: courseData.coverImage?.cdnPath || undefined,
            videoPreviewPath: courseData.previewVideo?.cdnPath || undefined,
          },
        };
      case 3: // Fiyatlandırma
        return {
          course: {
            price: courseData.price ? Number(courseData.price) : 0,
            currency: courseData.currency || null,
            price_level: (courseData as any).price_level || 1,
          },
        };
      case 4: // Öğrenci Kitlesi
        return {
          audience: {
            learningGoals: learningObjectives.filter(o => o.trim()),
            requirements: prerequisites.filter(r => r.trim()),
            targetStudents: targetAudience.filter(a => a.trim()),
          },
        };
      default:
        // 2 (Kurs İçeriği), 5, 6, 7 — bölüm/ders ve diğerleri kendi uçlarıyla anında kaydediliyor
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // YAYINLAMA ÖN KOŞULLARI
  // "Kursu Yayınla" basıldığında eksikler tek tek listelenir; hepsi tamamlanmadan
  // yayınlama yapılmaz.
  // ---------------------------------------------------------------------------
  const MIN_TOTAL_VIDEO_MINUTES = 30;
  const [publishIssuesOpen, setPublishIssuesOpen] = useState(false);

  /** Kurstaki tüm derslerin toplam video süresi (saniye). */
  const totalVideoSeconds = courseData.sections.reduce(
    (sum, section) => sum + section.lessons.reduce((s, l) => s + (l.durationSeconds || 0), 0),
    0
  );

  /** Yayın kontrol listesi — her madde için sağlandı/sağlanmadı bilgisi. */
  const publishChecklist = [
    { key: 'title', label: 'Kurs başlığı', hint: 'Temel bilgiler', step: 1, ok: Boolean(courseData.title?.trim()) },
    { key: 'subtitle', label: 'Alt başlık', hint: 'Temel bilgiler', step: 1, ok: Boolean(courseData.subtitle?.trim()) },
    { key: 'cover', label: 'Kapak görseli', hint: 'Temel bilgiler', step: 1, ok: Boolean(courseData.coverImage?.cdnPath) },
    { key: 'preview', label: 'Kurs tanıtım videosu', hint: 'Temel bilgiler', step: 1, ok: Boolean(courseData.previewVideo?.cdnPath) },
    {
      key: 'duration',
      label: `En az ${MIN_TOTAL_VIDEO_MINUTES} dakika ders videosu`,
      hint: `Şu an ${Math.floor(totalVideoSeconds / 60)} dk`,
      step: 2,
      ok: totalVideoSeconds >= MIN_TOTAL_VIDEO_MINUTES * 60,
    },
    { key: 'price', label: 'Kurs fiyatı', hint: 'Fiyat', step: 3, ok: Number(courseData.price) > 0 },
    {
      key: 'objectives',
      label: `${MIN_LEARNING_OBJECTIVES} öğrenme hedefi`,
      hint: `Şu an ${learningObjectives.filter(o => o.trim()).length}/${MIN_LEARNING_OBJECTIVES}`,
      step: 4,
      ok: learningObjectives.filter(o => o.trim()).length >= MIN_LEARNING_OBJECTIVES,
    },
  ];

  const missingPublishItems = publishChecklist.filter(item => !item.ok);

  /** Yayınla butonuna basıldığında: eksik varsa listeyi göster, yoksa yayınla. */
  const handlePublishClick = async () => {
    if (missingPublishItems.length > 0) {
      setPublishIssuesOpen(true);
      return;
    }
    await saveCourseToServer(true);
  };

  /**
   * Adımın kaydedilebilmesi için gereken kontroller.
   * Hata varsa mesaj, sorun yoksa null döner.
   */
  const validateStep = (stepId: number): string | null => {
    if (stepId === 1 && !courseData.title.trim()) {
      return 'Kurs başlığı zorunludur';
    }
    if (stepId === 4) {
      const filled = learningObjectives.filter(o => o.trim()).length;
      if (filled < MIN_LEARNING_OBJECTIVES) {
        return `En az ${MIN_LEARNING_OBJECTIVES} öğrenme hedefi girmelisiniz (şu an ${filled})`;
      }
    }
    return null;
  };

  /** Sadece bulunduğun adımı kaydeder. */
  const saveCurrentStep = async (opts: { silent?: boolean } = {}) => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      toast.error('Eksik bilgi', { description: validationError });
      return false;
    }

    const payload = buildStepPayload(currentStep);

    // Bu adımın kaydedilecek kendi verisi yoksa (içerik adımı gibi) sessizce geç
    if (!payload) {
      if (!opts.silent) toast.info('Bu adımdaki değişiklikler anında kaydediliyor.');
      return true;
    }

    // Kurs henüz oluşturulmadıysa önce oluşturulmalı (slug ve kayıt burada üretilir)
    if (!courseData.courseId && !courseUrlId) {
      return await saveCourseToServer(false);
    }

    setSavingStep(true);
    try {
      const token = localStorage.getItem('token');
      const id = courseData.courseId || Number(courseUrlId);

      const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi');

      setLastSavedAt(new Date());
      if (!opts.silent) {
        const stepTitle = steps.find(s => s.id === currentStep)?.title || 'Adım';
        toast.success(`${stepTitle} kaydedildi`);
      }
      return true;
    } catch (error: any) {
      toast.error('Kaydedilemedi', { description: error.message });
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  const steps = [
    { id: 1, title: 'Temel bilgiler', icon: BookOpen },
    { id: 2, title: 'Müfredat', icon: Video },
    { id: 3, title: 'Fiyat', icon: Banknote },
    { id: 4, title: 'Kazanımlar', icon: Target },
    { id: 5, title: 'Kupon', icon: Tag },
    { id: 6, title: 'Önizleme', icon: Eye }
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

  /**
   * Dersi ücretsiz önizlemeye açar/kapatır.
   *
   * Sunucuya hemen yazılıyor — "kaydet" beklemek, eğitmenin işaretleyip
   * sayfadan çıkması durumunda seçimi kaybettiriyordu. Hata olursa arayüzdeki
   * durum geri alınıyor.
   */
  const togglePreviewLesson = async (sectionId: string, lessonId: string) => {
    const section = courseData.sections.find(s => s.id === sectionId);
    const lesson = section?.lessons.find(l => l.id === lessonId);
    if (!section || !lesson?.dbLessonId) return;

    const next = !lesson.isFree;
    const apply = (value: boolean) => setCourseData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        lessons: s.lessons.map(l => l.id === lessonId ? { ...l, isFree: value } : l),
      } : s),
    }));

    apply(next);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/courses/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          courseId: courseData.courseId || courseUrlId,
          sectionId: section.dbSectionId,
          lessonId: lesson.dbLessonId,
          title: lesson.title,
          sortOrder: section.lessons.findIndex(l => l.id === lessonId),
          isFree: next,
        }),
      });
      if (!response.ok) throw new Error('Kaydedilemedi');
      toast.success(next
        ? 'Ders ücretsiz önizlemeye açıldı'
        : 'Ders önizlemeden kaldırıldı');
    } catch {
      apply(!next);
      toast.error('Önizleme durumu kaydedilemedi');
    }
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

    // Pencereyi ÖNCE kapat, yüklemeyi sonra başlat.
    // Aksi halde modal yükleme boyunca (büyük videoda dakikalarca) ekranı kaplı
    // tutuyordu. İlerleme zaten ders satırında görünüyor.
    const lesson = selectedLesson;
    setShowFileUpload(false);
    document.body.style.overflow = 'auto';
    event.target.value = ''; // aynı dosya tekrar seçilebilsin

    await processFileUpload(file, lesson);
    setSelectedLesson(null);
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
      const lesson = selectedLesson;

      // Sürükle-bırakta da pencere önce kapanır
      setShowFileUpload(false);
      document.body.style.overflow = 'auto';

      await processFileUpload(file, lesson);
      setSelectedLesson(null);
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
  const processFileUpload = async (file: File, targetLesson?: { sectionId: string; lessonId: string; dbLessonId?: number }) => {
    // Pencere kapandıktan sonra state temizlenebildiği için hedef ders parametreyle geçilir
    const activeLesson = targetLesson || selectedLesson;
    if (!activeLesson) return;

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
        s.id === activeLesson.sectionId
          ? {
            ...s,
            lessons: s.lessons.map(l =>
              l.id === activeLesson.lessonId
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
    const lessonIdToSend = activeLesson.dbLessonId?.toString() || activeLesson.lessonId;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      const fieldName = fileType === 'video' ? 'video' : 'file';
      formData.append(fieldName, file);

      // Add course and lesson info for CDN organization
      const courseSlug = generateSlug(courseData.title) || 'untitled-course';

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
                  s.id === activeLesson.sectionId
                    ? {
                      ...s,
                      lessons: s.lessons.map(l =>
                        l.id === activeLesson.lessonId
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
        console.log('Uploading video with Lesson ID:', lessonIdToSend, 'Original lessonId:', activeLesson.lessonId);

        // Video için ayrı endpoint kullan
        formData.append('courseSlug', courseSlug);
        formData.append('lessonId', lessonIdToSend);

        result = await uploadWithProgress(`${API_BASE_URL}/upload/video`, formData);
      } else {
        // Slayt ve belge için birleştirilmiş endpoint kullan
        formData.append('resourceType', fileType);

        result = await uploadWithProgress(`${API_BASE_URL}/courses/${courseSlug}/lessons/${activeLesson.lessonId}/upload-resource`, formData);
      }

      // Update UI with successful upload
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === activeLesson.sectionId
            ? {
              ...s,
              lessons: s.lessons.map(l =>
                l.id === activeLesson.lessonId
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

      if (fileType === 'video') {
        toast.success('Video yüklendi ve işleme alındı', {
          description: 'Bu sırada sayfadan çıkabilirsiniz — işlem sunucuda devam eder ve tamamlandığında e-posta ile bilgilendirileceksiniz.',
          duration: 8000,
        });
      } else {
        toast.success(result.message || (fileType === 'presentation' ? 'Slayt başarıyla yüklendi' : 'Belge başarıyla yüklendi'));
      }

      // Eğer video ise, işleme durumunu kontrol et
      if (fileType === 'video') {
        pollVideoStatus(lessonIdToSend, activeLesson.lessonId);
      }

    } catch (error) {
      console.error('File upload error:', error);

      // Reset upload progress on error
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === activeLesson.sectionId
            ? {
              ...s,
              lessons: s.lessons.map(l =>
                l.id === activeLesson.lessonId
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
  // Video işleme durumunu izler.
  // Not: İşleme sunucudaki kalıcı kuyrukta yürür. Bu yoklama sadece ekranı canlı
  // tutmak içindir — sayfayı kapatmak işlemi durdurmaz, bittiğinde e-posta gelir.
  const pollVideoStatus = async (dbLessonId: string, uiLessonId: string) => {
    // Aynı ders için ikinci bir takip başlatma. Sayfa yenilendiğinde takibi
    // yeniden kuran effect her durum değişiminde çalışıyor; bu koruma
    // olmadan her tur yeni bir zamanlayıcı doğuruyor.
    if (activePollsRef.current.has(dbLessonId)) return;
    activePollsRef.current.add(dbLessonId);

    const maxAttempts = 360; // 60 dakika (10 saniye * 360)
    let attempts = 0;

    const applyToUi = (patch: Record<string, unknown>) => {
      setCourseData(prev => ({
        ...prev,
        sections: prev.sections.map(s => ({
          ...s,
          lessons: s.lessons.map(l => (l.id === uiLessonId ? { ...l, ...patch } : l)),
        })),
      }));
    };

    const checkStatus = async (): Promise<boolean> => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/lessons/${dbLessonId}/video-job`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          const job = result.job;

          applyToUi({
            processingStatus: result.video_status === 'processed' ? 'processed'
              : result.video_status === 'error' ? 'error'
                : 'processing',
            videoUrl: result.video_url || undefined,
            errorMessage: job?.error || undefined,
            processingProgress: job?.progress ?? undefined,
            processingStage: job?.stage ?? undefined,
          });

          if (result.ready || result.video_status === 'processed') {
            toast.success('Video işleme tamamlandı 🎬', {
              description: 'Ders artık izlenebilir. Bilgilendirme e-postası da gönderildi.',
            });
            return true;
          }

          if (result.video_status === 'error' || job?.status === 'failed') {
            toast.error('Video işlenemedi', {
              description: job?.error || 'Videoyu tekrar yüklemeyi deneyin.',
            });
            return true;
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          // Zaman aşımı yalnızca bu ekran içindir; iş sunucuda devam eder.
          toast.info('İşleme devam ediyor', {
            description: 'Tamamlandığında e-posta ile bilgilendirileceksiniz.',
          });
          return true;
        }

        setTimeout(run, 10000);
        return false;
      } catch (error) {
        console.error('Video status check error:', error);
        attempts++;
        if (attempts < maxAttempts) setTimeout(run, 10000);
        return false;
      }
    };

    /** Takip bittiğinde kaydı bırak ki gerekirse yeniden başlatılabilsin. */
    const run = async () => {
      const finished = await checkStatus();
      if (finished) activePollsRef.current.delete(dbLessonId);
    };

    setTimeout(run, 3000);
  };

  /**
   * Sayfa yenilendikten sonra süren işleri yeniden takip et.
   *
   * Eğitmen video yükleyip sayfayı yenilediğinde daha önce ilerleme donuyordu;
   * takip yalnızca yükleme anında kurulduğu için. Artık durumu "süren" olan
   * her ders için takip kendiliğinden kuruluyor.
   */
  useEffect(() => {
    for (const section of courseData.sections) {
      for (const lesson of section.lessons) {
        if (!lesson.dbLessonId) continue;
        if (!IN_FLIGHT_STATUSES.includes(lesson.processingStatus)) continue;
        pollVideoStatus(String(lesson.dbLessonId), lesson.id);
      }
    }
  }, [courseData.sections]);

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
        generateSlug(courseData.title) ||
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
          xhr.open('POST', `${API_BASE_URL}/upload/course-cover`);
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
        generateSlug(courseData.title) ||
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
          xhr.open('POST', `${API_BASE_URL}/upload/course-preview`);
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
    // İlk 6 satır zorunlu olduğu için silinemez, sadece temizlenir
    if (learningObjectives.length > MIN_LEARNING_OBJECTIVES) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
    }
  };

  /** Doldurulmuş (boş olmayan) hedef sayısı */
  const filledObjectiveCount = learningObjectives.filter(o => o.trim()).length;

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
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-10">
              {/* Metin */}
              <div className="space-y-7 min-w-0">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Label htmlFor="title" className="text-[14px] font-bold text-[#00201d]">Kursun adı</Label>
                    <span className="text-[12px] tabular-nums text-[#6b827f]">{courseData.title.length}/75</span>
                  </div>
                  <Input
                    id="title"
                    placeholder="Örnek: Modern web geliştirme"
                    className={`h-14 px-4 rounded-xl border-0 ring-1 ring-inset ring-[#dadfdd] hover:ring-[#c3cbc8] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 bg-white text-[18px] font-bold text-[#00201d] placeholder:font-semibold placeholder:text-[#9bb0ad] ${validationErrors.title ? 'ring-red-400 bg-red-50/40' : ''}`}
                    value={courseData.title}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, title: e.target.value }));
                      if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: '' }));
                    }}
                    required
                    maxLength={75}
                  />
                  {validationErrors.title && <p className="text-red-600 text-[12.5px] mt-1.5 font-semibold">{validationErrors.title}</p>}
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Label htmlFor="subtitle" className="text-[14px] font-bold text-[#00201d]">Kısa tanıtım</Label>
                    <span className="text-[12px] text-[#6b827f]">Kartta adın altında görünür</span>
                  </div>
                  <Input
                    id="subtitle"
                    placeholder="Örnek: Sıfırdan başlayıp gerçek bir proje yayınla"
                    className={`h-12 px-4 rounded-xl border-0 ring-1 ring-inset ring-[#dadfdd] hover:ring-[#c3cbc8] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 bg-white text-[15px] ${validationErrors.subtitle ? 'ring-red-400 bg-red-50/40' : ''}`}
                    value={courseData.subtitle}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, subtitle: e.target.value }));
                      if (validationErrors.subtitle) setValidationErrors(prev => ({ ...prev, subtitle: '' }));
                    }}
                  />
                  {validationErrors.subtitle && <p className="text-red-600 text-[12.5px] mt-1.5 font-semibold">{validationErrors.subtitle}</p>}
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Label htmlFor="description" className="text-[14px] font-bold text-[#00201d]">Açıklama</Label>
                    <span className="text-[12px] tabular-nums text-[#6b827f]">{(courseData.description || '').length} karakter</span>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Bu kurs kimin için, sonunda ne yapabilecekler, neden seninle öğrenmeliler?"
                    rows={9}
                    className={`px-4 py-3.5 rounded-xl border-0 ring-1 ring-inset ring-[#dadfdd] hover:ring-[#c3cbc8] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 bg-white text-[15px] leading-relaxed resize-y ${validationErrors.description ? 'ring-red-400 bg-red-50/40' : ''}`}
                    value={courseData.description}
                    onChange={(e) => {
                      setCourseData(prev => ({ ...prev, description: e.target.value }));
                      if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
                    }}
                  />
                  {validationErrors.description && <p className="text-red-600 text-[12.5px] mt-1.5 font-semibold">{validationErrors.description}</p>}
                </div>
              </div>

              {/* Görsel ve video */}
              <div className="space-y-7">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Label className="text-[14px] font-bold text-[#00201d]">Kapak görseli</Label>
                    <span className="text-[12px] text-[#6b827f]">1280×720 · JPG, PNG</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageInputRef.current?.click(); } }}
                    className="group relative aspect-video rounded-2xl overflow-hidden bg-[linear-gradient(135deg,#ecfbf8,#d9f3ee)] ring-1 ring-inset ring-[#d3d9d7] hover:ring-[#5fb8ac] transition-[box-shadow] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                    {coverPreviewUrl ? (
                      <>
                        <img src={coverPreviewUrl} alt="Kapak önizlemesi" className="w-full h-full object-cover" />
                        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/95 text-[12.5px] font-bold text-[#00201d] shadow-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                          <ImageIcon className="w-3.5 h-3.5" /> Değiştir
                        </span>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                        <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#005c55] shadow-[0_2px_6px_rgba(0,32,29,0.08)] group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </span>
                        <p className="mt-3 text-[14px] font-bold text-[#00201d]">Kapak görseli seç</p>
                        <p className="text-[12.5px] text-[#4a6360] mt-0.5">Katalogda ilk göze çarpan şey</p>
                      </div>
                    )}

                    {mediaProgress.cover > 0 && mediaProgress.cover < 1 && (
                      <div className="absolute inset-0 bg-white/92 flex flex-col items-center justify-center gap-3 z-10">
                        <p className="text-[13.5px] font-bold text-[#00201d]">Görsel yükleniyor · %{Math.round(mediaProgress.cover * 100)}</p>
                        <div className="w-44 h-1.5 bg-[#d9f3ee] rounded-full overflow-hidden">
                          <div className="h-full bg-[#005c55] rounded-full transition-all duration-300" style={{ width: `${Math.round(mediaProgress.cover * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Label className="text-[14px] font-bold text-[#00201d]">Tanıtım videosu</Label>
                    <span className="text-[12px] text-[#6b827f]">1–2 dakika yeterli</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); videoInputRef.current?.click(); } }}
                    className="group relative rounded-2xl bg-white ring-1 ring-inset ring-[#d3d9d7] hover:ring-[#5fb8ac] transition-[box-shadow] duration-200 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

                    <div className="flex items-center gap-4 p-4">
                      <span className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${(promoVideo || courseData.previewVideo?.cdnPath) ? 'bg-[#00201d] text-[#9cf2e8]' : 'bg-[#ecfbf8] text-[#005c55]'}`}>
                        {(promoVideo || courseData.previewVideo?.cdnPath) ? <Play className="w-5 h-5 fill-current" /> : <Video className="w-5 h-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-[#00201d] truncate">
                          {promoVideo
                            ? ((promoVideo as any).name || 'Tanıtım videosu')
                            : courseData.previewVideo?.cdnPath
                              ? 'Tanıtım videosu yüklü'
                              : 'Tanıtım videosu ekle'}
                        </p>
                        <p className="text-[12.5px] text-[#4a6360] mt-0.5">
                          {(promoVideo || courseData.previewVideo?.cdnPath)
                            ? 'Değiştirmek için tıkla'
                            : 'Öğrenci satın almadan önce seni dinlesin'}
                        </p>
                      </div>
                    </div>

                    {mediaProgress.promo > 0 && mediaProgress.promo < 1 && (
                      <div className="px-4 pb-4 -mt-1">
                        <div className="flex justify-between text-[12px] font-semibold text-[#005c55] mb-1">
                          <span>Yükleniyor</span><span className="tabular-nums">%{Math.round(mediaProgress.promo * 100)}</span>
                        </div>
                        <div className="h-1.5 bg-[#d9f3ee] rounded-full overflow-hidden">
                          <div className="h-full bg-[#005c55] rounded-full transition-all duration-300" style={{ width: `${Math.round(mediaProgress.promo * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Katalogdaki yeri */}
            <div className="pt-8 border-t border-[#eceeed]">
              <h3 className="text-[16px] font-extrabold tracking-tight text-[#00201d]">Katalogdaki yeri</h3>
              <p className="text-[13px] text-[#4a6360] mt-0.5">Öğrenciler kursunu bu bilgilerle süzerek bulur.</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Kategori</Label>
                  <Select value={courseData.category} onValueChange={(val) => {
                    setSelectedCategory(val);
                    setCourseData(prev => ({ ...prev, category: val, subcategory: '' }));
                    if (validationErrors.category) setValidationErrors(prev => ({ ...prev, category: '' }));
                  }}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0">
                      <SelectValue placeholder="Seç" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COURSE_CATEGORIES.filter(cat => cat.id != null).map((cat) => (
                        <SelectItem key={cat.slug} value={String(cat.id)} className="rounded-lg">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Alt kategori</Label>
                  <Select value={courseData.subcategory} onValueChange={(val) => setCourseData(prev => ({ ...prev, subcategory: val }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0 disabled:opacity-50" disabled={!courseData.category}>
                      <SelectValue placeholder={courseData.category ? 'Seç' : 'Önce kategori'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {courseData.category && COURSE_CATEGORIES.find(cat => String(cat.id) === String(courseData.category))?.subcategories.filter(sub => sub.id != null).map(sub => (
                        <SelectItem key={sub.slug} value={String(sub.id)} className="rounded-lg">{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Anlatım dili</Label>
                  <Select value={courseData.language || ''} onValueChange={(val) => setCourseData(prev => ({ ...prev, language: val }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0">
                      <SelectValue placeholder="Seç" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="rounded-lg">{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Seviye</Label>
                  <Select value={courseData.level || ''} onValueChange={(val) => setCourseData(prev => ({ ...prev, level: val as any }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0">
                      <SelectValue placeholder="Seç" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="beginner" className="rounded-lg">Başlangıç</SelectItem>
                      <SelectItem value="intermediate" className="rounded-lg">Orta seviye</SelectItem>
                      <SelectItem value="advanced" className="rounded-lg">İleri seviye</SelectItem>
                      <SelectItem value="all" className="rounded-lg">Her seviye</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Müfredat özeti */}
            <p className="text-[14px] text-[#4a6360]">
              <b className="font-bold tabular-nums text-[#00201d]">{courseData.sections.length}</b> bölüm ·{' '}
              <b className="font-bold tabular-nums text-[#00201d]">{courseData.sections.reduce((total, section) => total + section.lessons.length, 0)}</b> ders
            </p>

            {/* Drag Drop Area */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {courseData.sections.map((section, sectionIndex) => (
                      <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="group/section">
                            <Card className="border-0 shadow-none rounded-2xl overflow-hidden bg-white ring-1 ring-[#e3e6e5]">
                              {/* Section Header */}
                              <div className={cn(
                                "px-3 sm:px-4 py-3.5 flex items-center gap-3 transition-colors",
                                section.isExpanded ? "border-b border-[#eceeed] dark:border-slate-800 bg-[#f3f4f4]" : ""
                              )}>
                                <div {...provided.dragHandleProps} className="w-8 h-10 rounded-lg flex items-center justify-center text-[#9bb0ad] hover:text-[#005c55] hover:bg-white transition-colors cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                  <div className="flex flex-col flex-1">
                                    <span className="text-[12px] font-bold text-[#5f7774] ml-1">Bölüm {sectionIndex + 1}</span>
                                    <Input
                                      placeholder="Bölümün adı, örnek: Giriş ve kurulum"
                                      value={section.title}
                                      onChange={(e) => setCourseData(prev => ({
                                        ...prev,
                                        sections: prev.sections.map(s => s.id === section.id ? { ...s, title: e.target.value, titleSaved: false } : s)
                                      }))}
                                      className="h-10 w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[18px] font-extrabold px-1 rounded-none shadow-none text-[#00201d] placeholder:font-semibold placeholder:text-[#9bb0ad]"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {!section.titleSaved && section.title.trim() && (
                                      <Button
                                        className="h-10 bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] font-bold rounded-xl shadow-none transition-colors"
                                        onClick={async () => {
                                          const token = localStorage.getItem('token');
                                          if (!token) return toast.error('Oturum açmanız gerekiyor');
                                          try {
                                            const response = await fetch(`${API_BASE_URL}/courses/sections`, {
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
                                        <Save className="w-4 h-4 mr-2" /> Bölümü kaydet
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl w-10 h-10 text-[#4a6360] hover:text-[#00201d] hover:bg-white"
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
                                      className="rounded-xl w-10 h-10 text-[#6b827f] hover:text-[#b42318] hover:bg-[#fff3f1]"
                                      onClick={() => removeSection(section.id, section.dbSectionId)}
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Lessons Area */}
                              {section.isExpanded && section.titleSaved && (
                                <div className="px-3 sm:px-4 py-4 bg-white border-t border-[#f0f1f1]">
                                  <Droppable droppableId={section.id} type="lesson">
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2.5">
                                        {section.lessons.map((lesson, lessonIndex) => (
                                          <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                            {(provided) => (
                                              <div ref={provided.innerRef} {...provided.draggableProps} className="group/lesson relative">

                                                <div className="bg-white rounded-xl ring-1 ring-[#e6e8e8] hover:ring-[#d3d9d7] transition-shadow overflow-hidden">
                                                  
                                                  {/* Lesson Header */}
                                                  <div className="p-2 pl-2.5 flex items-center gap-2">
                                                    <div {...provided.dragHandleProps} className="text-[#9bb0ad] hover:text-[#005c55] transition-colors cursor-grab active:cursor-grabbing p-1">
                                                      <GripVertical className="w-4 h-4" />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 flex items-center rounded-lg px-2.5 py-0.5 hover:bg-[#f3f4f4] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#005c55]/45 transition-all">
                                                      <span className="text-[12px] font-bold tabular-nums text-[#6b827f] mr-2.5 shrink-0">Ders {lessonIndex + 1}</span>
                                                      <Input
                                                        value={lesson.title}
                                                        placeholder="Dersin adı"
                                                        onChange={(e) => setCourseData(prev => ({
                                                          ...prev,
                                                          sections: prev.sections.map(s => s.id === section.id ? {
                                                            ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, title: e.target.value, titleSaved: false } : l)
                                                          } : s)
                                                        }))}
                                                        className="h-9 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold text-[14.5px] text-[#00201d] p-0 flex-1 shadow-none"
                                                      />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {/* Ücretsiz önizleme: bu ders kurs detay sayfasında
                                                          herkese açık oynatılır. Ders kaydedilmeden
                                                          işaretlenemez, çünkü sunucuda karşılığı yok. */}
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={!lesson.dbLessonId}
                                                        title={lesson.dbLessonId
                                                          ? 'Bu dersi kurs detay sayfasında ücretsiz önizleme olarak göster'
                                                          : 'Önce dersi kaydedin'}
                                                        onClick={() => togglePreviewLesson(section.id, lesson.id)}
                                                        className={cn(
                                                          'h-9 px-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-40',
                                                          lesson.isFree
                                                            ? 'bg-[#9cf2e8]/55 text-[#00201d] hover:bg-[#9cf2e8]/75'
                                                            : 'text-[#4a6360] hover:text-[#00201d] hover:bg-[#ecfbf8]'
                                                        )}
                                                      >
                                                        {lesson.isFree ? 'Ücretsiz izlenebilir' : 'Ücretsiz izlet'}
                                                      </Button>

                                                      {!lesson.titleSaved && lesson.title.trim() && (
                                                        <Button
                                                          size="sm"
                                                          className="bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] rounded-lg h-9 px-4 text-xs font-bold shadow-none"
                                                          onClick={async () => {
                                                            const token = localStorage.getItem('token');
                                                            if (!token) return toast.error('Oturum açmanız gerekiyor');
                                                            try {
                                                              const response = await fetch(`${API_BASE_URL}/courses/lessons`, {
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
                                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-[#6b827f] hover:text-[#b42318] hover:bg-[#fff3f1] rounded-lg" onClick={() => removeLesson(section.id, lesson.id, lesson.dbLessonId)}>
                                                        <Trash2 className="w-4 h-4" />
                                                      </Button>
                                                    </div>
                                                  </div>

                                                  {/* Lesson Body (Video & Resources) */}
                                                  <div className="px-3 pb-3 pt-1 bg-white">
                                                    {!lesson.fileName ? (
                                                      <div className="flex flex-col items-start gap-2">
                                                        <Button 
                                                          variant="outline" 
                                                          className="h-9 hover:bg-[#ecfbf8] border-[#d3d9d7] hover:border-[#9cdcd3] text-[#005c55] rounded-lg px-3.5 text-[13px] font-bold gap-2 disabled:opacity-50 transition-colors shadow-none" 
                                                          onClick={() => handleFileUpload(section.id, lesson.id, 'video', lesson.dbLessonId)} 
                                                          disabled={!lesson.titleSaved}
                                                        >
                                                          <Video className="w-4 h-4" /> Video yükle
                                                        </Button>
                                                        {!lesson.titleSaved && (
                                                          <span className="text-[12px] text-[#8a5a0b] font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Video yüklemek için önce dersin adını kaydet.</span>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div className="bg-[#f3f4f4] rounded-xl p-3.5 space-y-3.5">
                                                        {/* Video Status Row */}
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-[#d9f3ee] dark:bg-indigo-900/50 flex items-center justify-center text-[#005c55]">
                                                              <PlayCircle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                              <h4 title={lesson.fileName} className="text-sm font-bold text-[#00201d] dark:text-slate-200 max-w-[340px] truncate">{lesson.fileName}</h4>
                                                              <div className="flex items-center gap-3 mt-1">
                                                                {lesson.durationSeconds != null && lesson.durationSeconds > 0 && (
                                                                  <div className="flex items-center text-[11px] font-bold text-[#4a6360]">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {Math.floor(lesson.durationSeconds / 60) > 0 ? `${Math.floor(lesson.durationSeconds / 60)} dk ` : ''}{lesson.durationSeconds % 60} sn
                                                                  </div>
                                                                )}

                                                                {(lesson.processingStatus === 'processing'
                                                                  || lesson.processingStatus === 'pending'
                                                                  || lesson.processingStatus === 'uploading') && (
                                                                  <span className="text-[10px] font-bold text-[#005c55] bg-[#ecfbf8] dark:bg-blue-500/10 rounded-full flex items-center gap-1.5 px-2 py-0.5">
                                                                    <span className="w-1.5 h-1.5 bg-[#005c55] rounded-full animate-pulse" />
                                                                    {lesson.processingStatus === 'uploading'
                                                                      ? 'Sunucuya aktarılıyor'
                                                                      : lesson.processingStatus === 'pending'
                                                                        ? 'Kuyrukta'
                                                                        : lesson.processingProgress
                                                                          ? `İşleniyor %${lesson.processingProgress}`
                                                                          : 'İşleniyor'}
                                                                  </span>
                                                                )}
                                                                {(lesson.processingStatus === 'completed' || lesson.processingStatus === 'processed') && (
                                                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center gap-1.5 px-2 py-0.5">
                                                                    <Check className="w-3 h-3" /> Hazır
                                                                  </span>
                                                                )}
                                                                {lesson.processingStatus === 'error' && (
                                                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-full px-2 py-0.5">Hata</span>
                                                                )}
                                                              </div>

                                                              {/* Yükleme sürerken: dosyanın sunucuya aktarım yüzdesi */}
                                                              {lesson.uploadProgress != null && lesson.uploadProgress < 1 && (
                                                                <div className="mt-2 max-w-[260px]">
                                                                  <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-semibold text-[#005c55]">Yükleniyor</span>
                                                                    <span className="text-[10px] font-semibold text-[#005c55]">
                                                                      %{Math.round(lesson.uploadProgress * 100)}
                                                                    </span>
                                                                  </div>
                                                                  <div className="h-1.5 w-full bg-[#dadfdd] dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                      className="h-full bg-[#005c55] rounded-full transition-all duration-200"
                                                                      style={{ width: `${Math.max(2, lesson.uploadProgress * 100)}%` }}
                                                                    />
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* İşleme sürerken: aşama bilgisi + sayfadan çıkılabileceği bilgisi */}
                                                              {(lesson.processingStatus === 'processing' || lesson.processingStatus === 'pending') && (
                                                                <div className="mt-2 max-w-[260px]">
                                                                  <div className="h-1 w-full bg-[#dadfdd] dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                      className="h-full bg-[#005c55] rounded-full transition-all duration-500"
                                                                      style={{ width: `${lesson.processingProgress || 5}%` }}
                                                                    />
                                                                  </div>
                                                                  <p className="text-[10px] text-[#4a6360] mt-1 leading-snug">
                                                                    {lesson.processingStage || 'Kuyrukta bekliyor'} · Sayfadan çıkabilirsiniz, bitince e-posta gelecek.
                                                                  </p>
                                                                </div>
                                                              )}
                                                              {lesson.processingStatus === 'error' && lesson.errorMessage && (
                                                                <p className="text-[10px] text-red-500 mt-1 max-w-[260px] leading-snug">
                                                                  {lesson.errorMessage}
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-[#6b827f] hover:text-red-600 rounded-lg hover:bg-red-50" onClick={() => {
                                                              setDeleteConfirmation({
                                                                isOpen: true,
                                                                type: 'video',
                                                                sectionId: section.id,
                                                                lessonId: lesson.id,
                                                                dbId: lesson.dbLessonId
                                                              });
                                                            }}>
                                                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Videoyu sil
                                                            </Button>
                                                          </div>
                                                        </div>

                                                        {/* Resources Section */}
                                                        {lesson.titleSaved && lesson.dbLessonId && (
                                                          <div className="pt-3 border-t border-[#e3e6e5] dark:border-slate-700">
                                                            <div className="flex items-center justify-between mb-2">
                                                              <span className="text-[12.5px] font-bold text-[#1d3a37]">Ek dosyalar</span>
                                                              <label className="text-[11px] font-bold text-[#005c55] hover:text-[#00483f] cursor-pointer flex items-center gap-1 bg-[#ecfbf8] hover:bg-[#d9f3ee] px-2.5 py-1 rounded-lg transition-colors">
                                                                <Plus className="w-3 h-3" /> Dosya ekle
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
                                                                    formData.append('courseSlug', generateSlug(courseData.title) || 'untitled');
                                                                    const token = localStorage.getItem('token');
                                                                    
                                                                    const loadingToast = toast.loading(`${file.name} yükleniyor...`);
                                                                    
                                                                    try {
                                                                      const res = await fetch(`${API_BASE_URL}/lessons/resource/upload`, {
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
                                                                  <li key={idx} className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 border border-[#eceeed] dark:border-slate-700 rounded-xl">
                                                                    <div className={cn(
                                                                      "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                      resource.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-[#ecfbf8] text-[#005c55]"
                                                                    )}>
                                                                      <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                      <p className="text-xs font-semibold text-[#1d3a37] dark:text-slate-300 truncate">{resource.name}</p>
                                                                      <p className="text-[10px] text-[#6b827f]">{(resource.size && resource.size > 0) ? (resource.size / 1024 / 1024).toFixed(2) + ' MB' : 'Döküman'}</p>
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-[#6b827f] hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => {
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
                                                              <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-[#e3e6e5] text-[#6b827f] text-xs">
                                                                Ders notu, kod dosyası gibi indirilebilir dosyalar ekleyebilirsin.
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
                                        
                                        <div className="pt-1">
                                          <Button
                                            variant="outline"
                                            className="w-full h-11 border border-dashed border-[#d3d9d7] hover:border-[#5fb8ac] hover:bg-[#ecfbf8] text-[#005c55] font-bold rounded-xl transition-colors shadow-none flex items-center justify-center gap-2"
                                            onClick={() => addLesson(section.id)}
                                          >
                                            <Plus className="w-4 h-4" /> Ders ekle
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
              className="w-full h-12 rounded-xl bg-[#ecfbf8] hover:bg-[#d9f3ee] text-[#005c55] font-bold transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni bölüm ekle
            </Button>
          </div >
        );

      case 3: {
        const priceOptions = courseData.currency ? getPriceOptionsForCurrency(courseData.currency) : [];
        const chosenPrice = priceOptions.find(o => o.value.toString() === courseData.price?.toString());
        return (
          <div className="animate-in fade-in duration-300 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
            <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
              <div>
                <Label className="block text-[14px] font-bold text-[#00201d] mb-2">Para birimi</Label>
                <Select
                  value={courseData.currency || ''}
                  onValueChange={(value) => setCourseData(prev => ({ ...prev, currency: value, price: '' as any }))}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0 text-[15px] font-semibold">
                    <SelectValue placeholder="Para birimi seç" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {CURRENCY_PRICING.map((curr) => (
                      <SelectItem key={curr.currency} value={curr.currency} className="rounded-lg">
                        {curr.symbol} · {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-[14px] font-bold text-[#00201d] mb-2">Satış fiyatı</Label>
                <Select
                  value={courseData.price?.toString() || ''}
                  onValueChange={(value) => {
                    const chosen = priceOptions.find(o => o.value.toString() === value);
                    setCourseData(prev => ({
                      ...prev,
                      price: parseFloat(value),
                      ...(chosen ? { price_level: chosen.level } : {})
                    } as any));
                  }}
                  disabled={!courseData.currency}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0 text-[16px] font-bold">
                    <SelectValue placeholder={!courseData.currency ? 'Önce para birimini seç' : 'Fiyat seç'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {priceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} className="rounded-lg font-semibold">
                        {option.displayPrice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              <p className="sm:col-span-2 text-[12.5px] text-[#5f7774] -mt-1">Fiyatlar sabit basamaklardan seçiliyor; kuponlar da bu basamaklara göre çalışır.</p>
            </div>

            <aside className="rounded-2xl bg-[#ecfbf8] p-5">
              <p className="text-[13px] font-bold text-[#4a6360]">Öğrencinin gördüğü fiyat</p>
              <p className="mt-2 text-[34px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-[#00201d]">
                {chosenPrice ? chosenPrice.displayPrice : '—'}
              </p>
              <p className="mt-3 text-[13px] text-[#4a6360] leading-relaxed">
                Kazancının dökümü (vergi ve payın) Kazanç → Gelir raporu sayfasında.
              </p>
            </aside>
          </div>
        );
      }

      case 4:
        return (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            <p className="text-[14px] text-[#4a6360]">
              Öğrenci kursu bitirdiğinde neler yapabilecek? Her satıra bir beceri yaz. Yayınlamak için en az{' '}
              <b className="font-bold text-[#00201d]">{MIN_LEARNING_OBJECTIVES}</b> tane gerekiyor; şu an{' '}
              <b className="font-bold text-[#00201d] tabular-nums">{filledObjectiveCount}</b> tane var.
            </p>

            <ol className="mt-6 space-y-2.5">
              {learningObjectives.map((objective, index) => {
                const required = index < MIN_LEARNING_OBJECTIVES;
                return (
                  <li key={index} className="flex items-center gap-3">
                    <span className="shrink-0 w-7 text-right text-[13px] font-bold tabular-nums text-[#6b827f]">{index + 1}.</span>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={index === 0
                          ? 'Örnek: React ile baştan sona bir web uygulaması kurabilecek'
                          : required ? 'Bir beceri daha' : 'Ek beceri (isteğe bağlı)'}
                        value={objective}
                        onChange={(e) => updateLearningObjective(index, e.target.value)}
                        className="h-11 pl-4 pr-16 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] hover:ring-[#c3cbc8] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 text-[14.5px]"
                        maxLength={160}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-[#9bb0ad]">
                        {objective.length}/160
                      </span>
                    </div>
                    {required ? <span className="shrink-0 w-9" /> : (
                      <Button
                        variant="ghost" size="icon"
                        aria-label="Bu satırı kaldır"
                        className="shrink-0 w-9 h-9 text-[#6b827f] hover:text-[#b42318] hover:bg-[#fff3f1] rounded-lg"
                        onClick={() => removeLearningObjective(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={addLearningObjective}
              className="mt-3 ml-10 inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-[13.5px] font-bold text-[#005c55] hover:bg-[#ecfbf8] transition-colors"
            >
              <Plus className="w-4 h-4" /> Satır ekle
            </button>
          </div>
        );

      case 5:
        return (
          <div className="animate-in fade-in duration-300">
            {(!courseData.price || !(courseData as any).price_level) ? (
              <div className="rounded-2xl bg-[#ecfbf8] px-6 py-10 text-center max-w-xl">
                <p className="text-[16px] font-extrabold text-[#00201d]">Önce fiyatı belirle</p>
                <p className="text-[14px] text-[#4a6360] mt-1.5">Kupon, kursun fiyatından daha düşük bir basamak seçerek çalışıyor.</p>
                <button
                  type="button"
                  onClick={() => goToSection(3)}
                  className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] text-[13.5px] font-bold transition-colors"
                >
                  Fiyata git <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
                <div className="space-y-5 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Kupon kodu</Label>
                      <Input
                        placeholder="INDIRIM20"
                        value={couponData.code}
                        onChange={(e) => setCouponData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                        className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 font-bold tracking-[0.12em]"
                      />
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold text-[#00201d] mb-2">İndirimli fiyat</Label>
                      <Select
                        value={couponData.priceLevel > 0 ? String(couponData.priceLevel) : ''}
                        onValueChange={(value) => {
                          const option = getPriceOptionsForCurrency(courseData.currency).find(o => o.level.toString() === value);
                          if (option) setCouponData(prev => ({ ...prev, priceLevel: option.level, discountPrice: option.value }));
                        }}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus:ring-2 focus:ring-[#005c55]/55 focus:ring-offset-0">
                          <SelectValue placeholder="Fiyat seç" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {getPriceOptionsForCurrency(courseData.currency).filter(opt => opt.level < (courseData as any).price_level).length > 0 ? (
                            getPriceOptionsForCurrency(courseData.currency)
                              .filter(opt => opt.level < (courseData as any).price_level)
                              .map((option) => (
                                <SelectItem key={option.level} value={option.level.toString()}>{option.displayPrice}</SelectItem>
                              ))
                          ) : (
                            <div className="p-2 text-sm text-[#4a6360] text-center">Daha düşük bir fiyat basamağı yok</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Kaç kez kullanılabilir</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        value={couponData.usageLimit || ''}
                        onChange={(e) => setCouponData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                        className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0 tabular-nums"
                      />
                    </div>
                    <div>
                      <Label className="block text-[13px] font-bold text-[#00201d] mb-2">Son gün</Label>
                      <Input
                        type="date"
                        value={couponData.validUntil}
                        onChange={(e) => setCouponData(prev => ({ ...prev, validUntil: e.target.value }))}
                        className="h-11 rounded-xl bg-white border-0 ring-1 ring-inset ring-[#dadfdd] focus-visible:ring-2 focus-visible:ring-[#005c55]/55 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl bg-white ring-1 ring-inset ring-[#e6e8e8] px-4 py-3.5">
                    <div>
                      <p className="text-[14px] font-bold text-[#00201d]">Kupon açık</p>
                      <p className="text-[12.5px] text-[#4a6360] mt-0.5">Kapatırsan kod çalışmaz ama silinmez.</p>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-[#005c55] data-[state=unchecked]:bg-[#d3d9d7]"
                      checked={couponData.isActive}
                      onCheckedChange={(checked) => setCouponData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!creatorId || creatorId === 'new') {
                        toast.error('Önce kursu taslak olarak kaydet.');
                        return;
                      }
                      if (!couponData.code || couponData.priceLevel <= 0) {
                        toast.error('Kupon kodunu ve indirimli fiyatı seç.');
                        return;
                      }
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_BASE_URL}/coupons`, {
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
                        toast.success('Kupon kaydedildi');
                        setCouponData({ code: '', priceLevel: 0, discountPrice: 0, validUntil: '', usageLimit: 100, isActive: true });
                      } catch (err: any) {
                        toast.error('Kupon kaydedilemedi', { description: err.message });
                      }
                    }}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] text-[14px] font-bold transition-colors"
                  >
                    Kuponu kaydet
                  </button>
                </div>

                {/* Kupon önizlemesi: bilet görünümü */}
                <aside className="relative rounded-2xl bg-[#00201d] text-white p-5 overflow-hidden">
                  <span aria-hidden className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white" />
                  <span aria-hidden className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white" />
                  <p className="text-[12.5px] text-[#a9cfc9]">Kupon kodu</p>
                  <p className="mt-1 text-[24px] font-extrabold tracking-[0.12em] text-[#9cf2e8] break-all">{couponData.code || 'KODUN'}</p>
                  <div className="mt-4 pt-4 border-t border-dashed border-white/20 text-[13px] text-[#cfe7e3] leading-relaxed">
                    {couponData.priceLevel > 0
                      ? <>Bu kodla kurs <b className="text-white">{couponData.discountPrice} {courseData.currency}</b> olur.</>
                      : 'İndirimli fiyatı seçince burada görünür.'}
                    {couponData.validUntil && <> Son gün: <b className="text-white">{new Date(couponData.validUntil).toLocaleDateString('tr-TR')}</b>.</>}
                  </div>
                </aside>
              </div>
            )}
          </div>
        );

      case 6: {
        /**
         * Önizleme: kursu öğrencinin göreceği gerçek sayfada açar.
         * Eksikler burada liste olarak durmuyor; yayınla'ya basılınca
         * eksik bir şey varsa o zaman söyleniyor.
         */
        const lessonCount = courseData.sections.reduce((n, s) => n + s.lessons.length, 0);
        const videoCount = courseData.sections.reduce(
          (n, s) => n + s.lessons.filter(l => l.processingStatus === 'completed').length, 0);
        const canPreview = Boolean(creatorId && creatorId !== 'new');

        return (
          <div className="animate-in fade-in duration-300 grid md:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
            <div className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] overflow-hidden shadow-[0_18px_36px_-22px_rgba(0,32,29,0.45)]">
              <div className="aspect-video bg-[linear-gradient(135deg,#e3f6f2,#9cf2e8)]">
                {coverPreviewUrl && <img src={coverPreviewUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <p className="text-[15.5px] font-extrabold leading-snug text-[#00201d] line-clamp-2">{courseData.title || 'Adsız kurs'}</p>
                {courseData.subtitle && <p className="text-[13px] text-[#4a6360] mt-1 line-clamp-2">{courseData.subtitle}</p>}
                <p className="mt-3 text-[14px] font-extrabold tabular-nums text-[#00201d]">
                  {courseData.price ? `${courseData.price} ${courseData.currency || ''}` : 'Fiyat yok'}
                </p>
              </div>
            </div>

            <div>
              <dl className="grid grid-cols-3 gap-6 max-w-md">
                {[
                  { value: courseData.sections.length, label: 'bölüm' },
                  { value: lessonCount, label: 'ders' },
                  { value: videoCount, label: 'hazır video' },
                ].map(item => (
                  <div key={item.label}>
                    <dd className="text-[28px] font-extrabold tracking-[-0.02em] tabular-nums text-[#00201d] leading-none">{item.value}</dd>
                    <dt className="text-[13px] text-[#4a6360] mt-1.5">{item.label}</dt>
                  </div>
                ))}
              </dl>

              <p className="mt-7 text-[14.5px] text-[#1d3a37] leading-relaxed max-w-[56ch]">
                Kursu öğrencilerin göreceği gerçek sayfada aç. Taslakken bu sayfayı yalnızca sen görürsün.
              </p>
              <button
                type="button"
                onClick={() => window.open(`/course/${creatorId}`, '_blank', 'noopener')}
                disabled={!canPreview}
                className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white ring-1 ring-inset ring-[#d3d9d7] hover:bg-[#ecfbf8] hover:ring-[#9cdcd3] text-[14px] font-bold text-[#00201d] disabled:opacity-50 transition-colors"
              >
                <Eye className="w-4 h-4" /> Kurs sayfasını aç
              </button>
              {!canPreview && <p className="text-[13px] text-[#6b827f] mt-2">Önce kursu taslak olarak kaydet.</p>}
            </div>
          </div>
        );
      }

      default:
        return <div>Step {currentStep} content</div>;
    }
  };

  const courseStatus = (courseData as any).status;
  const current = steps.find(s => s.id === currentStep) || steps[0];
  // Sunucuya ayrıca kaydedilen bölümler; müfredat ve kupon kendi düğmeleriyle kaydoluyor.
  const hasSave = [1, 3, 4].includes(currentStep);

  /** Bölüm değiştirirken bulunduğun bölümü sessizce kaydeder; sıra yok, istediğin yere geç. */
  const goToSection = async (id: number) => {
    if (id === currentStep) return;
    if (hasSave) await saveCurrentStep({ silent: true });
    setCurrentStep(id);
  };

  return (
    <EditorFrame
      back={{ to: '/instructor/courses/list', label: 'Kurslarım' }}
      title={courseData.title?.trim() || 'Yeni kurs'}
      status={courseStatus === 'published'
        ? { label: 'Yayında', tone: 'live' }
        : courseStatus === 'draft' || !courseStatus
          ? { label: 'Taslak', tone: 'draft' }
          : { label: 'İncelemede', tone: 'review' }}
      meta={<>
        {savingStep && <span className="w-3.5 h-3.5 border-2 border-[#d3d9d7] border-t-[#005c55] rounded-full animate-spin" />}
        {savingStep
          ? 'Kaydediliyor'
          : lastSavedAt
            ? `Son kayıt ${lastSavedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Bölüm değiştirince kendiliğinden kaydedilir'}
      </>}
      actions={<>
        {hasSave && (
          <button
            type="button"
            disabled={savingStep}
            onClick={() => saveCurrentStep()}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white text-[13.5px] font-bold text-[#00201d] ring-1 ring-inset ring-[#d3d9d7] hover:bg-[#ecfbf8] hover:ring-[#9cdcd3] disabled:opacity-50 transition-colors"
          >
            {savingStep ? <span className="w-4 h-4 border-2 border-[#d3d9d7] border-t-[#005c55] rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Kaydet</span>
          </button>
        )}
        {courseStatus !== 'published' && (
          <button
            type="button"
            onClick={handlePublishClick}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#00201d] text-[#9cf2e8] text-[13.5px] font-bold hover:bg-[#03302b] active:scale-[0.98] transition-[background-color,transform]"
          >
            Yayınla
          </button>
        )}
      </>}
    >
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-8 items-start">

          {/* Bölümler: sırası yok, istediğinden başla */}
          <div className="lg:sticky lg:top-24 min-w-0">
            <nav aria-label="Kurs bölümleri" className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              {steps.map(step => {
                const isActive = currentStep === step.id;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToSection(step.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`shrink-0 lg:w-full flex items-center gap-3 px-3.5 h-11 rounded-xl text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40 ${isActive
                      ? 'bg-[#9cf2e8] text-[#00201d]'
                      : 'text-[#3d5754] hover:bg-white hover:text-[#00201d]'
                      }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#00201d]' : 'text-[#5f8a84]'}`} strokeWidth={isActive ? 2.2 : 1.9} />
                    <span className={`text-[14.5px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* İçerik */}
          <section className="min-w-0 rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)]">
            <div className="px-5 sm:px-8 pt-7 pb-6 border-b border-[#f0f1f1]">
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#00201d]">{current.title}</h2>
              <p className="text-[14.5px] text-[#4a6360] mt-1">
                {STEP_DESCRIPTIONS[currentStep] || ''}
              </p>
            </div>

            <div className="px-5 sm:px-8 py-7">
              <div className="min-h-[320px]">
                {renderStepContent()}
              </div>

              {hasSave && (
                <div className="flex justify-end mt-10 pt-6 border-t border-[#f0f1f1]">
                  <button
                    type="button"
                    disabled={savingStep}
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#9cf2e8] text-[#00201d] text-[14px] font-bold hover:bg-[#86e9dd] active:scale-[0.98] shadow-[0_1px_2px_rgba(0,64,58,0.18)] disabled:opacity-50 transition-[background-color,transform]"
                    onClick={() => saveCurrentStep()}
                  >
                    {savingStep
                      ? <><span className="w-4 h-4 border-2 border-[#00201d]/20 border-t-[#00201d] rounded-full animate-spin" /> Kaydediliyor</>
                      : <><Save className="w-4 h-4" /> Değişiklikleri kaydet</>}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* YAYINLAMA KONTROL LİSTESİ — eksikler tamamlanmadan yayınlanamaz */}
        {publishIssuesOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#00201d]/60 backdrop-blur-sm p-4"
            onClick={() => setPublishIssuesOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 border-b border-[#eceeed] dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#00201d] dark:text-white">
                      Kurs yayınlanamaz
                    </h3>
                    <p className="text-sm text-[#4a6360] mt-0.5">
                      {missingPublishItems.length} madde eksik. Tamamladıktan sonra tekrar deneyin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-1 max-h-[50vh] overflow-y-auto">
                {publishChecklist.map(item => (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.ok) return;
                      setPublishIssuesOpen(false);
                      setCurrentStep(item.step);
                    }}
                    disabled={item.ok}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${item.ok
                      ? 'cursor-default'
                      : 'hover:bg-[#f5f6f6] dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${item.ok
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15'
                      : 'bg-red-100 text-red-600 dark:bg-red-500/15'
                      }`}>
                      {item.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm ${item.ok
                        ? 'text-[#6b827f] line-through'
                        : 'text-[#00201d] dark:text-slate-200 font-medium'
                        }`}>
                        {item.label}
                      </span>
                      {!item.ok && (
                        <span className="block text-xs text-[#6b827f]">{item.hint}</span>
                      )}
                    </span>
                    {!item.ok && <ArrowRight className="w-4 h-4 text-[#9bb0ad] shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-[#eceeed] dark:border-slate-800">
                <Button
                  onClick={() => setPublishIssuesOpen(false)}
                  className="w-full h-11 rounded-xl bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] font-bold"
                >
                  Tamam
                </Button>
              </div>
            </div>
          </div>
        )}

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
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-8 pt-8 pb-6 ${uploadType === 'video' ? 'bg-gradient-to-br from-[#ecfbf8] to-[#ecfbf8] dark:from-violet-900/20 dark:to-indigo-900/20' :
                uploadType === 'presentation' ? 'bg-gradient-to-br from-[#ecfbf8] to-[#ecfbf8] dark:from-blue-900/20 dark:to-sky-900/20' :
                  'bg-gradient-to-br from-[#ecfbf8] to-[#ecfbf8] dark:from-emerald-900/20 dark:to-teal-900/20'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${uploadType === 'video' ? 'bg-[#005c55]' :
                      uploadType === 'presentation' ? 'bg-[#005c55]' : 'bg-[#005c55]'
                      }`}>
                      {uploadType === 'video' && <Video className="w-7 h-7 text-white" />}
                      {uploadType === 'presentation' && <Presentation className="w-7 h-7 text-white" />}
                      {uploadType === 'document' && <FileText className="w-7 h-7 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#00201d] dark:text-white">
                        {uploadType === 'video' ? 'Video Yükle' :
                          uploadType === 'presentation' ? 'Slayt Yükle' : 'Belge Yükle'}
                      </h3>
                      <p className="text-sm text-[#4a6360] dark:text-slate-400 mt-0.5">
                        {uploadType === 'video' ? 'MP4, AVI, MOV, MKV • Maks. 500MB' :
                          uploadType === 'presentation' ? 'PPT, PPTX, PDF • Maks. 100MB' :
                            'PDF, DOC, DOCX, TXT • Maks. 50MB'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowFileUpload(false); document.body.style.overflow = 'auto'; }}
                    className="w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-[#6b827f] hover:text-[#3d5754] transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <div className="px-8 py-6">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${isDragOver
                    ? 'border-[#005c55] bg-[#ecfbf8] dark:bg-violet-900/20 scale-[1.01]'
                    : uploadType === 'video'
                      ? 'border-[#e3e6e5] dark:border-slate-700 hover:border-[#5fb8ac] hover:bg-[#ecfbf8]/50 dark:hover:bg-violet-900/10'
                      : uploadType === 'presentation'
                        ? 'border-[#e3e6e5] dark:border-slate-700 hover:border-[#5fb8ac] hover:bg-[#ecfbf8]/50 dark:hover:bg-blue-900/10'
                        : 'border-[#e3e6e5] dark:border-slate-700 hover:border-[#5fb8ac] hover:bg-[#ecfbf8]/50 dark:hover:bg-emerald-900/10'
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
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDragOver ? 'bg-[#005c55] scale-110' :
                      uploadType === 'video' ? 'bg-[#d9f3ee] dark:bg-violet-900/30 text-[#005c55]' :
                        uploadType === 'presentation' ? 'bg-[#d9f3ee] dark:bg-blue-900/30 text-[#005c55]' :
                          'bg-[#d9f3ee] dark:bg-emerald-900/30 text-[#005c55]'
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
                      <p className="font-bold text-[#1d3a37] dark:text-slate-200 mb-1">
                        {isDragOver ? 'Bırakın!' : 'Sürükleyin veya tıklayın'}
                      </p>
                      <p className="text-sm text-[#6b827f]">
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
                    className="flex-1 h-11 rounded-xl border-[#e3e6e5] dark:border-slate-700 font-medium"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className={`flex-1 h-11 rounded-xl font-bold text-white shadow-sm ${uploadType === 'video' ? 'bg-[#005c55] hover:bg-[#00483f]' :
                      uploadType === 'presentation' ? 'bg-[#005c55] hover:bg-[#00483f]' :
                        'bg-[#005c55] hover:bg-[#00483f]'
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
                    className="w-full h-96 p-4 border border-[#d3d9d7] rounded-lg resize-none focus:ring-2 focus:ring-[#005c55] focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-[#4a6360] mt-1">
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
                  className="flex-1 bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] font-bold"
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
            <div className="relative w-full h-[400px] bg-[#00201d] rounded-lg overflow-hidden">
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
              <Button onClick={handleCropConfirm} className="bg-[#9cf2e8] hover:bg-[#86e9dd] text-[#00201d] font-bold">
                Kırp ve Yükle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-semibold">
              {deleteConfirmation.type === 'section' && 'Bölümü silmek istediğinize emin misiniz?'}
              {deleteConfirmation.type === 'lesson' && 'Dersi silmek istediğinize emin misiniz?'}
              {deleteConfirmation.type === 'video' && 'Videoyu silmek istediğinize emin misiniz?'}
              {deleteConfirmation.type === 'resource' && 'Kaynağı silmek istediğinize emin misiniz?'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EditorFrame>
  );
}

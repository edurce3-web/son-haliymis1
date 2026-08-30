import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, User, Mail, Globe, BookOpen, Award, Briefcase, Upload, CheckCircle, AlertCircle, ChevronDown, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

// Helper function to create image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Helper function to get cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

interface InstructorApplicationData {
  // Personal Information
  fullName: string;
  email: string;
  language: string;
  profileImage?: string;

  // Professional Information
  title: string;
  bio: string;
  expertise: string[];

  /**
   * Bağlantılar.
   *
   * Yalnızca web sitesi soruluyor. YouTube/Instagram/TikTok alanları profilde
   * hiçbir yerde gösterilmiyordu; doldurulan veri hiçbir işe yaramıyor,
   * form ise iki kat uzuyordu.
   */
  website?: string;
}

const InstructorApplication = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  /** İlerleme çubuğundaki adım adları — kart içindeki ikinci başlığın yerini aldı. */
  const STEP_LABELS = ['Kişisel bilgiler', 'Profil fotoğrafı', 'Profesyonel bilgiler', 'Bağlantılar'];

  // If user is already an instructor, redirect immediately
  useEffect(() => {
    if (user && (user.role === 'instructor' || user.is_instructor)) {
      navigate('/instructor', { replace: true });
    }
  }, [user, navigate]);


  const [formData, setFormData] = useState<InstructorApplicationData>({
    fullName: '',
    email: '',
    language: 'tr',
    profileImage: '',
    title: '',
    bio: '',
    expertise: [],
    website: ''
  });

  const [expertiseInput, setExpertiseInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Cropping State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // Kullanıcı verilerini yükle
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }

      // Önce context'ten gelen verileri ayarla (hızlı yükleme için)
      setFormData(prev => ({
        ...prev,
        fullName: user ? `${user.first_name} ${user.last_name}` : '',
        email: user?.email || '',
      }));

      // Sonra veritabanından detaylı bilgileri çekmeye çalış
      try {
        const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const userData = result.user;

          console.log('✅ User data received from database:', userData);

          // Veritabanından gelen verilerle güncelle
          setFormData(prev => ({
            ...prev,
            fullName: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            language: userData.language || 'tr',
            profileImage: userData.profile_image || '',
            title: userData.title || '',
            bio: userData.bio || '',
          }));

          // Profil resmi varsa preview'ı da ayarla
          if (userData.profile_image) {
            setImagePreview(userData.profile_image);
          }
        } else {
          console.log('⚠️ API call failed, using context data');
        }
      } catch (error) {
        console.log('⚠️ Database fetch failed, using context data:', error.message);
      } finally {
        setDataLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertiseInput.trim()]
      }));
      setExpertiseInput('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setIsCropping(true);
      // Reset crop/zoom
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again if cancelled
    e.target.value = '';
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (!originalImage || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(originalImage, croppedAreaPixels);
      if (!croppedBlob) return;

      // Create a URL for preview
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setImagePreview(croppedUrl);
      setIsCropping(false);

      // Now upload the cropped file
      await uploadCroppedImage(croppedBlob);

    } catch (e) {
      console.error(e);
      toast.error('Görsel kırpılırken bir hata oluştu');
    }
  };

  const uploadCroppedImage = async (blob: Blob) => {
    try {
      toast.loading('Profil fotoğrafı yükleniyor...');

      const formData = new FormData();
      // Append blob as file, give it a name 'profile.jpg'
      formData.append('profileImage', blob, 'profile.jpg');

      const response = await fetch(`${API_BASE_URL}/instructor/upload-profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Store the CDN URL
        setFormData(prev => ({
          ...prev,
          profileImage: data.url
        }));

        toast.dismiss();
        toast.success('Profil fotoğrafı başarıyla yüklendi!');
        console.log('✅ Profile image uploaded to CDN:', data.url);
      } else {
        toast.dismiss();
        toast.error(`Yükleme başarısız: ${data.error || response.statusText}`, {
          description: data.details || 'Lütfen tekrar deneyin'
        });
        setImagePreview(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error(`Bağlantı hatası: ${error.message || 'Sunucuya ulaşılamadı'}`);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before submit - artık expertise zorunlu değil
    const newErrors: { [key: string]: string } = {};

    setErrors(newErrors);

    setLoading(true);

    console.log('🚀 Sending application data:', formData);
    console.log('📊 Expertise array:', formData.expertise);
    console.log('📊 Expertise length:', formData.expertise.length);

    try {
      const response = await fetch(`${API_BASE_URL}/instructor/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setApplicationId(data.applicationId);
        setIsSubmitted(true);

        // Refresh user data to get updated role
        await refreshUser();

        toast.success('Başvuru başarıyla gönderildi!', {
          description: 'Eğitmen olarak onaylandınız!'
        });
      } else {
        toast.error('Başvuru gönderilemedi', {
          description: data.error || 'Bir hata oluştu'
        });
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Sunucu hatası', {
        description: 'Lütfen daha sonra tekrar deneyin'
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    console.log('🔄 NextStep called. Current step:', currentStep);
    console.log('📋 Form data check:', { title: formData.title, bio: formData.bio });

    const newErrors: { [key: string]: string } = {};

    // Validation for each step
    if (currentStep === 1) {
      if (!formData.fullName) {
        newErrors.fullName = 'Ad soyad gerekli';
      }
      if (!formData.email) {
        newErrors.email = 'E-posta gerekli';
      }
    } else if (currentStep === 3) {
      if (!formData.title) {
        newErrors.title = 'Unvan gerekli';
      }
      if (!formData.bio) {
        newErrors.bio = 'Kendini tanıtan bir metin gerekli';
      }
      // Expertise artık zorunlu değil - kullanıcı isterse boş bırakabilir
    }

    console.log('❌ Validation errors:', newErrors);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && currentStep < totalSteps) {
      console.log('✅ Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('🚫 Cannot proceed. Errors:', Object.keys(newErrors).length, 'Current step:', currentStep, 'Total steps:', totalSteps);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Adın, e-posta adresin ve ders vereceğin dil. Bu bilgiler hesabında
              kayıtlıysa otomatik dolduruldu.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName" className="text-[14px] font-semibold text-slate-800">Ad soyad</Label>
                {errors.fullName && (
                  <p className="text-sm text-red-600 mb-2">{errors.fullName}</p>
                )}
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Adınız ve soyadınız"
                  required
                  className={errors.fullName ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-[14px] font-semibold text-slate-800">E-posta</Label>
                {errors.email && (
                  <p className="text-sm text-red-600 mb-2">{errors.email}</p>
                )}
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ornek@email.com"
                  required
                  className={errors.email ? 'border-red-500' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="language" className="text-[14px] font-semibold text-slate-800">Ders dili</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dil seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="pt">🇵🇹 Português</SelectItem>
                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Fotoğrafın kurs sayfalarında ve profilinde görünür. Yüzünün net
              göründüğü bir kare seç; öğrenciler eğitmeni tanımak istiyor.
            </p>
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profil önizleme"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="text-center">
                <Label htmlFor="profileImage" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Upload className="w-4 h-4" />
                    {imagePreview ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                  </div>
                </Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG veya GIF formatında, maksimum 5MB
                </p>
              </div>

              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData(prev => ({ ...prev, profileImage: '' }));
                  }}
                >
                  Fotoğrafı Kaldır
                </Button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Bu iki alan profilinde adının hemen altında görünür; öğrencilerin
              seni tanıdığı ilk yer burası.
            </p>
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="title" className="text-[14px] font-semibold text-slate-800">
                    Unvan
                  </Label>
                  <span className="text-[12px] text-slate-400 tabular-nums">
                    {formData.title.length}/40
                  </span>
                </div>
                {errors.title && (
                  <p className="text-sm text-red-600 mb-2">{errors.title}</p>
                )}
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn: Yazılım Mühendisi · Grafik Tasarımcı · Matematik Öğretmeni"
                  maxLength={40}
                  required
                  className={errors.title ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-[14px] font-semibold text-slate-800">
                  Kendini tanıt
                </Label>
                {errors.bio && (
                  <p className="text-sm text-red-600 mb-2">{errors.bio}</p>
                )}
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Kendinizi kısaca tanıtın: ne iş yapıyorsunuz, kaç yıldır bu alandasınız, hangi konuları anlatacaksınız?"
                  rows={6}
                  required
                  className={errors.bio ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="expertise" className="text-[14px] font-semibold text-slate-800">
                  Uzmanlık alanları
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="Örn: JavaScript — yazıp Ekle'ye basın"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      addExpertise();
                    }}
                    variant="outline"
                  >
                    Ekle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.expertise.map((exp, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeExpertise(exp)}>
                      {exp} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-[15px] text-slate-600 leading-relaxed">
              İstersen kendi sitenin adresini ekle; profilinde bağlantı olarak
              görünür. Boş bırakabilirsin.
            </p>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-[14px] font-semibold text-slate-800">
                Web sitesi
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://siteniz.com"
              />
              <p className="text-[12.5px] text-slate-500">İsteğe bağlı.</p>
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  // Loading state
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-[15px] text-slate-500">Bilgilerin yükleniyor…</p>
        </div>
      </div>
    );
  }

  // Success page after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-700 text-white">
            <CheckCircle className="w-7 h-7" />
          </span>
          <h1 className="font-montserrat text-[26px] font-extrabold text-slate-900 tracking-[-0.02em] mt-5">
            Eğitmen hesabın hazır
          </h1>
          <p className="text-[15.5px] text-slate-600 leading-[1.7] mt-3">
            Artık kurs ve e-kitap oluşturabilirsin. İlk kursunu yayınlamadan
            önce panelden fiyat ve ödeme bilgilerini tamamlamayı unutma.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-8">
            <button
              onClick={() => navigate('/instructor')}
              className="flex-1 h-11 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold transition-colors"
            >
              Eğitmen paneline git
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 h-11 rounded-lg border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[15px] font-semibold transition-colors"
            >
              Ana sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Üst bant — platformun diğer sayfalarındaki açık yeşil zemin */}
      <div className="relative border-b border-brand-100 bg-gradient-to-br from-brand-50 via-brand-100/60 to-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(23,93,93,0.06) 1px, transparent 1px),'
              + 'linear-gradient(to bottom, rgba(23,93,93,0.06) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />
        <div className="container relative mx-auto px-5 sm:px-8 max-w-3xl py-8 lg:py-10">
          {/*
            Çıkış yolu. Başvuru yarıda bırakılabilmeli; bu ekrana girip
            vazgeçen kullanıcının geri dönebileceği tek yer tarayıcının geri
            düğmesiydi.
          */}
          <button
            onClick={() => navigate('/become-instructor')}
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-slate-500 hover:text-brand-800 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Eğitmenlik sayfasına dön
          </button>

          {/*
            Tek başlık. Önceden hem sayfa başında hem kart içinde aynı şey
            iki kez yazıyordu; adım adı artık ilerleme çubuğunda duruyor.
          */}
          <h1 className="font-montserrat text-[28px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.025em] leading-tight">
            Eğitmen başvurusu
          </h1>
          <p className="text-[15px] text-slate-600 mt-2.5 max-w-xl leading-relaxed">
            Dört kısa adım. Bilgilerini tamamladığında eğitmen hesabın anında
            açılır, kurs oluşturmaya başlayabilirsin.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-8 max-w-3xl py-10">

        {/* İlerleme */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => {
              const done = i + 1 < currentStep;
              const active = i + 1 === currentStep;
              return (
                <div key={label} className="flex items-center gap-2 min-w-0">
                  <span
                    className={
                      'flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold shrink-0 transition-colors '
                      + (done || active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400')
                    }
                  >
                    {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </span>
                  <span
                    className={
                      'text-[13px] font-medium whitespace-nowrap hidden sm:inline '
                      + (active ? 'text-slate-900' : 'text-slate-400')
                    }
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <span className={'h-px w-6 sm:w-10 ' + (done ? 'bg-brand-300' : 'bg-slate-200')} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[12.5px] text-slate-400 mt-3 sm:hidden">
            Adım {currentStep} / {totalSteps} · {STEP_LABELS[currentStep - 1]}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-6 rounded-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  disabled={currentStep === 1}
                >
                  Geri
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    className="h-11 px-7 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      nextStep();
                    }}
                  >
                    Devam et
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-7 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Gönderiliyor
                      </span>
                    ) : 'Başvuruyu tamamla'}
                  </Button>
                )}
              </div>
            </form>
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profil Fotoğrafını Düzenle</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-80 bg-black rounded-md overflow-hidden my-4">
            {originalImage && (
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Zoom:</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropping(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveCrop}>
              Kırp ve Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorApplication;

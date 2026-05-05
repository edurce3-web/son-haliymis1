import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GraduationCap,
  User,
  Mail,
  Globe,
  BookOpen,
  Award,
  Briefcase,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
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

  // Additional Information (Social Media Links)
  youtube?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
  tiktok?: string;
}

const InstructorApplication = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<InstructorApplicationData>({
    fullName: '',
    email: '',
    language: 'tr',
    profileImage: '',
    title: '',
    bio: '',
    expertise: [],
    youtube: '',
    instagram: '',
    facebook: '',
    twitter: '',
    website: '',
    tiktok: ''
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
        const response = await fetch(`https://api.edurce.com/api/users/${user.user_id}`, {
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

      const response = await fetch('https://api.edurce.com/api/instructor/upload-profile-image', {
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
      const response = await fetch('https://api.edurce.com/api/instructor/apply', {
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
        newErrors.fullName = 'Ad soyad gereklidir';
      }
      if (!formData.email) {
        newErrors.email = 'E-posta gereklidir';
      }
    } else if (currentStep === 3) {
      if (!formData.title) {
        newErrors.title = 'Unvan gereklidir';
      }
      if (!formData.bio) {
        newErrors.bio = 'Kendinizi tanıtın alanı gereklidir';
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
            <div className="text-center mb-8">
              <User className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Kişisel Bilgiler</h3>
              <p className="text-muted-foreground">Temel bilgilerinizi paylaşın</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Ad Soyad *</Label>
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
                <Label htmlFor="email">E-posta *</Label>
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
                <Label htmlFor="language">Dil *</Label>
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
            <div className="text-center mb-8">
              <User className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Profil Fotoğrafı</h3>
              <p className="text-muted-foreground">Profilinizi kişiselleştirin</p>
            </div>

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
            <div className="text-center mb-8">
              <Briefcase className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Profesyonel Bilgiler</h3>
              <p className="text-muted-foreground">Mesleki deneyiminizi anlatın</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Unvan/Pozisyon *</Label>
                {errors.title && (
                  <p className="text-sm text-red-600 mb-2">{errors.title}</p>
                )}
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="ör. Senior Software Developer, Marketing Uzmanı"
                  required
                  className={errors.title ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="bio">Kendinizi Tanıtın *</Label>
                {errors.bio && (
                  <p className="text-sm text-red-600 mb-2">{errors.bio}</p>
                )}
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Kendinizi kısaca tanıtın..."
                  rows={6}
                  required
                  className={errors.bio ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="expertise">Uzmanlık Alanları (İsteğe bağlı)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="ör. JavaScript, Marketing, Tasarım (isteğe bağlı)"
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
            <div className="text-center mb-8">
              <Award className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Son Adım - Eğitmen Hesabı Oluştur</h3>
              <p className="text-muted-foreground">Sosyal medya hesaplarınızı paylaşın ve eğitmen hesabınızı oluşturun</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="youtube">YouTube Kanalı</Label>
                  <Input
                    id="youtube"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/@kanal"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/kullanici"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/sayfa"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter">X (Twitter)</Label>
                  <Input
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="https://x.com/kullanici"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Web Sitesi</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://websitesi.com"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleInputChange}
                    placeholder="https://tiktok.com/@kullanici"
                  />
                </div>
              </div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Bilgileriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Success page after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Başvurunuz Onaylandı!</h2>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/instructor')}
                className="w-full"
                size="lg"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Eğitmen Paneline Git
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Ana Sayfaya Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eğitmen Başvurusu
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bilginizi paylaşın, öğrencilerin hayatına dokunun. EduPlatform ailesine katılmak için başvurunuzu tamamlayın.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${i + 1 <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {i + 1 <= currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`
                    h-1 w-full mx-4
                    ${i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Adım {currentStep} / {totalSteps}
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {currentStep === 1 && "Kişisel Bilgileriniz"}
              {currentStep === 2 && "Profil Fotoğrafınız"}
              {currentStep === 3 && "Profesyonel Deneyiminiz"}
              {currentStep === 4 && "Ek Bilgiler (Opsiyonel)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  disabled={currentStep === 1}
                >
                  Önceki
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      nextStep();
                    }}
                  >
                    Sonraki
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Eğitmen Hesabı Oluştur
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

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

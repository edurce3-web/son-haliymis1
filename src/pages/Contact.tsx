import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  HelpCircle,
  Users,
  Headphones,
  Globe,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefon",
      content: "+90 (212) 555 0123",
      description: "Pazartesi - Cuma: 09:00 - 18:00"
    },
    {
      icon: Mail,
      title: "E-posta",
      content: "info@eduplatform.com",
      description: "24 saat içinde yanıtlıyoruz"
    },
    {
      icon: MapPin,
      title: "Adres",
      content: "Maslak Mahallesi, Teknoloji Caddesi No:1",
      description: "İstanbul, Türkiye"
    },
    {
      icon: Clock,
      title: "Çalışma Saatleri",
      content: "Pazartesi - Cuma: 09:00 - 18:00",
      description: "Hafta sonu: 10:00 - 16:00"
    }
  ];

  const supportCategories = [
    {
      icon: HelpCircle,
      title: "Genel Destek",
      description: "Platform kullanımı ve genel sorular",
      responseTime: "2-4 saat"
    },
    {
      icon: Users,
      title: "Öğrenci Desteği",
      description: "Kurs kayıtları ve öğrenme süreçleri",
      responseTime: "1-2 saat"
    },
    {
      icon: Headphones,
      title: "Teknik Destek",
      description: "Teknik sorunlar ve platform hataları",
      responseTime: "30 dakika"
    },
    {
      icon: Globe,
      title: "Eğitmen Desteği",
      description: "Kurs oluşturma ve eğitmen paneli",
      responseTime: "1 saat"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general"
      });
    } catch (error) {
      toast.error("Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              İletişim
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Size Nasıl Yardımcı Olabiliriz?
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin. 
              Uzman ekibimiz size yardımcı olmak için burada.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                  <p className="text-gray-900 font-medium mb-1">{info.content}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Destek Kategorileri</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              İhtiyacınıza uygun destek kategorisini seçin ve hızlı çözüm alın
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {category.responseTime}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Bize Mesaj Gönderin</h2>
              <p className="text-lg text-muted-foreground">
                Aşağıdaki formu doldurarak bizimle iletişime geçebilirsiniz
              </p>
            </div>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Adınızı ve soyadınızı girin"
                        className="h-12"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        E-posta <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="E-posta adresinizi girin"
                        className="h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Kategori
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full h-12 px-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="general">Genel Destek</option>
                        <option value="student">Öğrenci Desteği</option>
                        <option value="technical">Teknik Destek</option>
                        <option value="instructor">Eğitmen Desteği</option>
                        <option value="billing">Faturalandırma</option>
                        <option value="partnership">Ortaklık</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Konu
                      </label>
                      <Input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Mesajınızın konusunu girin"
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mesaj <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Mesajınızı detaylı olarak yazın..."
                      className="min-h-32"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Mesajınızı göndererek <a href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikamızı</a> kabul etmiş olursunuz.
                    </span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Mesajı Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Sık Sorulan Sorular</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              En çok merak edilen konular hakkında hızlı yanıtlar
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Kurs kayıtları nasıl yapılır?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kurs sayfasında "Kayıt Ol" butonuna tıklayarak kolayca kayıt olabilirsiniz. 
                  Ödeme işlemini tamamladıktan sonra kursa anında erişim sağlayabilirsiniz.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Sertifika nasıl alınır?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kursu %80 oranında tamamladıktan sonra otomatik olarak dijital sertifikanız 
                  oluşturulur ve profil sayfanızdan indirebilirsiniz.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-purple-500" />
                  Mobil uygulamada sorun yaşıyorum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Mobil uygulama ile ilgili sorunlar için uygulamayı güncelleyin. 
                  Sorun devam ederse teknik destek ekibimizle iletişime geçin.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  Eğitmen olmak istiyorum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Eğitmen başvurusu için "Eğitmen Ol" sayfasından başvuru formunu doldurun. 
                  Başvurunuz değerlendirildikten sonra size dönüş yapılacaktır.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              <HelpCircle className="w-5 h-5 mr-2" />
              Tüm SSS'leri Görüntüle
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

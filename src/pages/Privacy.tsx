import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Lock, 
  Eye, 
  Users, 
  Database, 
  Globe,
  AlertCircle,
  CheckCircle,
  FileText,
  Mail,
  Clock
} from "lucide-react";

const Privacy = () => {
  const lastUpdated = "15 Eylül 2024";

  const privacyPrinciples = [
    {
      icon: Shield,
      title: "Veri Güvenliği",
      description: "Kişisel verilerinizi en yüksek güvenlik standartlarıyla koruyoruz."
    },
    {
      icon: Eye,
      title: "Şeffaflık",
      description: "Verilerinizi nasıl kullandığımız konusunda tamamen şeffafız."
    },
    {
      icon: Lock,
      title: "Kontrol",
      description: "Verileriniz üzerinde tam kontrol sahibi olmanızı sağlıyoruz."
    },
    {
      icon: Users,
      title: "Gizlilik",
      description: "Kişisel bilgilerinizi üçüncü taraflarla paylaşmayız."
    }
  ];

  const dataTypes = [
    {
      category: "Hesap Bilgileri",
      items: ["Ad, soyad", "E-posta adresi", "Şifre (şifrelenmiş)", "Profil fotoğrafı"],
      purpose: "Hesap oluşturma ve kimlik doğrulama"
    },
    {
      category: "Öğrenme Verileri",
      items: ["Kurs ilerleme durumu", "Quiz sonuçları", "Ödevler", "Sertifikalar"],
      purpose: "Öğrenme deneyimini kişiselleştirme"
    },
    {
      category: "Teknik Veriler",
      items: ["IP adresi", "Tarayıcı bilgileri", "Cihaz bilgileri", "Kullanım istatistikleri"],
      purpose: "Platform performansını iyileştirme"
    },
    {
      category: "İletişim Verileri",
      items: ["Destek talepleri", "Geri bildirimler", "Mesajlar", "Bildirim tercihleri"],
      purpose: "Müşteri desteği ve iletişim"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Gizlilik Politikası
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gizliliğiniz Bizim Önceliğimiz
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında 
              detaylı bilgiler bu sayfada yer almaktadır.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Son güncelleme: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Gizlilik İlkelerimiz</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Veri koruma yaklaşımımızın temelini oluşturan ilkeler
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {privacyPrinciples.map((principle, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <principle.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{principle.title}</h3>
                  <p className="text-muted-foreground text-sm">{principle.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Collection */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Topladığımız Veriler</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Size daha iyi hizmet verebilmek için topladığımız veri türleri ve kullanım amaçları
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dataTypes.map((dataType, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-500" />
                    {dataType.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Toplanan Veriler:</h4>
                    <ul className="space-y-1">
                      {dataType.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Kullanım Amacı:</strong> {dataType.purpose}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rights and Controls */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Haklarınız ve Kontrolleriniz</h2>
              <p className="text-lg text-muted-foreground">
                KVKK kapsamında sahip olduğunuz haklar ve bu hakları nasıl kullanabileceğiniz
              </p>
            </div>
            
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-blue-500" />
                    Bilgi Alma Hakkı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işleniyorsa buna ilişkin 
                    bilgi talep etme hakkınız bulunmaktadır.
                  </p>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Veri Raporu Talep Et
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-green-500" />
                    Düzeltme ve Silme Hakkı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Yanlış veya eksik işlenen kişisel verilerinizin düzeltilmesini veya 
                    silinmesini talep edebilirsiniz.
                  </p>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Düzeltme Talep Et
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-500" />
                    İtiraz Etme Hakkı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Kişisel verilerinizin işlenmesine itiraz etme ve işlemenin durdurulmasını 
                    talep etme hakkınız bulunmaktadır.
                  </p>
                  <Button variant="outline" size="sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    İtiraz Et
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Güvenlik Önlemleri</h2>
              <p className="text-lg text-muted-foreground">
                Verilerinizi korumak için aldığımız teknik ve idari güvenlik önlemleri
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Teknik Güvenlik</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">SSL/TLS şifreleme</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Güvenlik duvarı koruması</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Düzenli güvenlik taramaları</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Veri yedekleme sistemleri</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>İdari Güvenlik</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Erişim kontrolü ve yetkilendirme</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Çalışan eğitim programları</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Gizlilik sözleşmeleri</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                      <span className="text-sm">Düzenli denetim süreçleri</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Privacy */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Gizlilik Konularında İletişim</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Gizlilik politikamız hakkında sorularınız varsa veya haklarınızı kullanmak 
              istiyorsanız bizimle iletişime geçin.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center">
                <Mail className="w-5 h-5 mr-3 text-blue-500" />
                <span>privacy@eduplatform.com</span>
              </div>
              <div className="flex items-center justify-center">
                <Globe className="w-5 h-5 mr-3 text-blue-500" />
                <span>Veri Koruma Sorumlusu</span>
              </div>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Mail className="w-5 h-5 mr-2" />
              İletişime Geç
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;

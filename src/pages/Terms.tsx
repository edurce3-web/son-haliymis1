import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Scale, 
  Shield, 
  Users, 
  CreditCard, 
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  BookOpen
} from "lucide-react";

const Terms = () => {
  const lastUpdated = "15 Eylül 2024";

  const sections = [
    {
      icon: Users,
      title: "Hesap ve Kullanıcı Sorumlulukları",
      items: [
        "Hesap oluştururken doğru bilgiler vermelisiniz",
        "Hesap güvenliğinden siz sorumlusunuz",
        "Bir hesap sadece bir kişi tarafından kullanılabilir",
        "Yasadışı faaliyetlerde hesabınızı kullanamazsınız"
      ]
    },
    {
      icon: BookOpen,
      title: "Kurs ve İçerik Kullanımı",
      items: [
        "Kurslar sadece kişisel öğrenme amaçlı kullanılabilir",
        "İçerikleri üçüncü taraflarla paylaşamazsınız",
        "Telif hakkı korumalı materyalleri izinsiz kullanamazsınız",
        "Kurs içeriklerini indirme hakları sınırlıdır"
      ]
    },
    {
      icon: CreditCard,
      title: "Ödeme ve İade Koşulları",
      items: [
        "Ödemeler güvenli ödeme sistemleri üzerinden yapılır",
        "İade talepleri 14 gün içinde yapılmalıdır",
        "Kursun %20'sinden fazlası tamamlanmışsa iade yapılmaz",
        "İade işlemleri 5-10 iş günü sürebilir"
      ]
    },
    {
      icon: Shield,
      title: "Fikri Mülkiyet Hakları",
      items: [
        "Tüm içerikler telif hakkı ile korunmaktadır",
        "Platform logosu ve markası kullanılamaz",
        "Kullanıcı içerikleri için lisans verilir",
        "İhlal durumunda yasal işlem başlatılabilir"
      ]
    }
  ];

  const prohibitedActivities = [
    "Platform güvenliğini tehdit edici faaliyetler",
    "Diğer kullanıcıları rahatsız edici davranışlar",
    "Spam, reklam veya istenmeyen içerik paylaşımı",
    "Sahte hesap oluşturma veya kimlik hırsızlığı",
    "Teknik sistemleri manipüle etme girişimleri",
    "Telif hakkı ihlali yapıcı içerik paylaşımı"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Kullanım Koşulları
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Kullanım Koşulları ve Şartları
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              EduPlatform hizmetlerini kullanarak aşağıdaki koşul ve şartları kabul etmiş olursunuz. 
              Lütfen dikkatlice okuyunuz.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Son güncelleme: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Scale className="w-6 h-6 mr-3 text-blue-500" />
                  Giriş ve Genel Hükümler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Bu kullanım koşulları ("Koşullar"), EduPlatform ("Platform", "Biz", "Bizim") 
                  tarafından sunulan online eğitim hizmetlerinin kullanımını düzenler.
                </p>
                <p>
                  Platformumuzu kullanarak, bu koşulları tamamen okuduğunuzu, anladığınızı ve 
                  kabul ettiğinizi beyan edersiniz. Bu koşulları kabul etmiyorsanız, 
                  lütfen platformumuzu kullanmayınız.
                </p>
                <p>
                  Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler hakkında 
                  kullanıcılarımızı bilgilendireceğiz.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Temel Koşullar ve Sorumluluklar</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Platform kullanımında uyulması gereken temel kurallar ve sorumluluklar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Activities */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">Yasaklı Faaliyetler</h2>
              <p className="text-lg text-muted-foreground">
                Aşağıdaki faaliyetler kesinlikle yasaktır ve hesap kapatılmasına neden olabilir
              </p>
            </div>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  Yasak Davranışlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prohibitedActivities.map((activity, index) => (
                    <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{activity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Önemli Uyarı</h4>
                      <p className="text-sm text-yellow-700">
                        Bu kurallara uymayan kullanıcıların hesapları uyarı verilmeksizin 
                        askıya alınabilir veya tamamen kapatılabilir.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Liability and Disclaimers */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">Sorumluluk Reddi ve Sınırlamalar</h2>
              <p className="text-lg text-muted-foreground">
                Platform kullanımında sorumluluk sınırları ve yasal uyarılar
              </p>
            </div>
            
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-500" />
                    Hizmet Garantisi
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Platform hizmetleri "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz, 
                    hatasız veya güvenli olacağına dair garanti verilmemektedir.
                  </p>
                  <p>
                    Teknik sorunlar, bakım çalışmaları veya üçüncü taraf kaynaklı problemler 
                    nedeniyle hizmet kesintileri yaşanabilir.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scale className="w-5 h-5 mr-2 text-purple-500" />
                    Sorumluluk Sınırları
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    EduPlatform, platform kullanımından kaynaklanan dolaylı, özel veya 
                    sonuçsal zararlardan sorumlu değildir.
                  </p>
                  <p>
                    Toplam sorumluluk miktarı, kullanıcının son 12 ayda platforma ödediği 
                    toplam tutarla sınırlıdır.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-green-500" />
                    Geçerli Hukuk
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir ve Türk mahkemeleri 
                    yetkilidir.
                  </p>
                  <p>
                    Uyuşmazlıklar öncelikle dostane çözüm yolları ile çözülmeye çalışılacaktır.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Sorularınız mı Var?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Kullanım koşulları hakkında sorularınız varsa bizimle iletişime geçebilirsiniz
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center">
                <Mail className="w-5 h-5 mr-3 text-blue-500" />
                <span>legal@eduplatform.com</span>
              </div>
              <div className="flex items-center justify-center">
                <FileText className="w-5 h-5 mr-3 text-blue-500" />
                <span>Hukuk İşleri Departmanı</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Mail className="w-5 h-5 mr-2" />
                İletişime Geç
              </Button>
              <Button variant="outline" size="lg">
                <FileText className="w-5 h-5 mr-2" />
                PDF İndir
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;

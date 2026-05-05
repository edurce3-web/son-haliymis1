import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  HelpCircle, 
  BookOpen, 
  Users, 
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Star,
  ThumbsUp,
  Video,
  FileText,
  Headphones,
  Globe,
  Smartphone,
  CreditCard,
  Settings,
  Shield
} from "lucide-react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Kurslar ve Öğrenme",
      description: "Kurs kayıtları, ilerleme takibi ve sertifikalar",
      articleCount: 25,
      color: "bg-blue-500"
    },
    {
      icon: CreditCard,
      title: "Ödeme ve Faturalandırma",
      description: "Ödeme yöntemleri, iadeler ve fatura işlemleri",
      articleCount: 18,
      color: "bg-green-500"
    },
    {
      icon: Users,
      title: "Hesap Yönetimi",
      description: "Profil ayarları, şifre değişikliği ve hesap güvenliği",
      articleCount: 15,
      color: "bg-purple-500"
    },
    {
      icon: Smartphone,
      title: "Mobil Uygulama",
      description: "Mobil uygulama kullanımı ve sorun giderme",
      articleCount: 12,
      color: "bg-orange-500"
    },
    {
      icon: Video,
      title: "Teknik Sorunlar",
      description: "Video oynatma, bağlantı ve performans sorunları",
      articleCount: 20,
      color: "bg-red-500"
    },
    {
      icon: Shield,
      title: "Güvenlik ve Gizlilik",
      description: "Veri güvenliği, gizlilik ayarları ve KVKK",
      articleCount: 10,
      color: "bg-indigo-500"
    }
  ];

  const popularArticles = [
    {
      title: "Kursa nasıl kayıt olabilirim?",
      category: "Kurslar",
      views: 15420,
      helpful: 98
    },
    {
      title: "Sertifikamı nasıl indirebilirim?",
      category: "Sertifikalar",
      views: 12350,
      helpful: 95
    },
    {
      title: "Ödeme yaparken sorun yaşıyorum",
      category: "Ödeme",
      views: 8970,
      helpful: 92
    },
    {
      title: "Mobil uygulamada video açılmıyor",
      category: "Teknik",
      views: 7650,
      helpful: 89
    },
    {
      title: "Şifremi unuttum, nasıl sıfırlayabilirim?",
      category: "Hesap",
      views: 6540,
      helpful: 96
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Canlı Destek",
      description: "Anında yardım alın",
      availability: "7/24 Aktif",
      responseTime: "Ortalama 2 dakika",
      color: "bg-green-500"
    },
    {
      icon: Mail,
      title: "E-posta Desteği",
      description: "Detaylı sorularınız için",
      availability: "24 saat içinde yanıt",
      responseTime: "Ortalama 4 saat",
      color: "bg-blue-500"
    },
    {
      icon: Phone,
      title: "Telefon Desteği",
      description: "Acil durumlar için",
      availability: "09:00 - 18:00",
      responseTime: "Anında bağlantı",
      color: "bg-purple-500"
    }
  ];

  const quickActions = [
    { icon: BookOpen, title: "Kurslarım", description: "Kayıtlı kurslarınızı görüntüleyin" },
    { icon: FileText, title: "Sertifikalarım", description: "Aldığınız sertifikaları indirin" },
    { icon: Settings, title: "Hesap Ayarları", description: "Profil ve güvenlik ayarları" },
    { icon: CreditCard, title: "Ödeme Geçmişi", description: "Satın alma geçmişinizi görün" }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Yardım Merkezi
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Size Nasıl Yardımcı Olabiliriz?
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Aradığınız yanıtları bulun veya destek ekibimizle iletişime geçin
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Sorunuzu veya konuyu arayın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-0 shadow-lg focus:shadow-xl transition-shadow duration-300"
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
                kurs kayıt
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
                sertifika
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
                ödeme
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
                mobil uygulama
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Hızlı İşlemler</h2>
            <p className="text-muted-foreground">
              En sık kullanılan işlemlere hızlı erişim
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Yardım Kategorileri</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Konuya göre organize edilmiş yardım makalelerimize göz atın
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary">{category.articleCount} makale</Badge>
                  </div>
                  <CardTitle className="group-hover:text-blue-600 transition-colors duration-300">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-blue-50 transition-colors duration-300">
                    Makaleleri Görüntüle
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Popüler Makaleler</h2>
            <p className="text-lg text-muted-foreground">
              En çok okunan ve faydalı bulunan yardım makalelerimiz
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                          <span>{article.helpful}% faydalı</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          <span>{article.views.toLocaleString()} görüntüleme</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">
                        {article.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              <FileText className="w-5 h-5 mr-2" />
              Tüm Makaleleri Görüntüle
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Hala Yardıma İhtiyacınız Var mı?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Aradığınız yanıtı bulamadıysanız, destek ekibimiz size yardımcı olmaktan mutluluk duyar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactOptions.map((option, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <CardHeader>
                  <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <option.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{option.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-green-500" />
                      <span>{option.availability}</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <span>{option.responseTime}</span>
                    </div>
                  </div>
                  <Button className="w-full">
                    <option.icon className="w-4 h-4 mr-2" />
                    İletişime Geç
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Topluluk Desteği</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Diğer öğrenciler ve eğitmenlerle etkileşime geçin, sorularınızı sorun ve deneyimlerinizi paylaşın
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Users className="w-5 h-5 mr-2" />
                Topluluğa Katıl
              </Button>
              <Button variant="outline" size="lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Forum'u Ziyaret Et
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;

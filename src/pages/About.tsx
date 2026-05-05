import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Award, 
  Globe, 
  Heart, 
  Target, 
  Lightbulb,
  BookOpen,
  Star,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle
} from "lucide-react";

const About = () => {
  const stats = [
    { number: "150,000+", label: "Aktif Öğrenci", icon: Users },
    { number: "2,500+", label: "Online Kurs", icon: BookOpen },
    { number: "800+", label: "Uzman Eğitmen", icon: Award },
    { number: "4.9/5", label: "Ortalama Puan", icon: Star }
  ];

  const values = [
    {
      icon: Heart,
      title: "Öğrenci Odaklılık",
      description: "Her kararımızda öğrencilerimizin başarısını ve memnuniyetini önceliğimiz olarak görüyoruz."
    },
    {
      icon: Award,
      title: "Kalite",
      description: "Yüksek standartlarda eğitim içerikleri ve sürekli gelişim odaklı yaklaşımımızla fark yaratıyoruz."
    },
    {
      icon: Globe,
      title: "Erişilebilirlik",
      description: "Eğitimi herkese ulaştırma misyonumuzla teknoloji ve içeriği demokratikleştiriyoruz."
    },
    {
      icon: Lightbulb,
      title: "İnovasyon",
      description: "Sürekli yenilik arayışında olarak öğrenme deneyimini geliştiren teknolojiler kullanıyoruz."
    }
  ];

  const milestones = [
    { year: "2020", title: "Kuruluş", description: "EduPlatform'un temelleri atıldı" },
    { year: "2021", title: "İlk 10,000 Öğrenci", description: "Hızlı büyüme ve topluluk oluşumu" },
    { year: "2022", title: "Mobil Uygulama", description: "iOS ve Android uygulamaları yayınlandı" },
    { year: "2023", title: "AI Entegrasyonu", description: "Yapay zeka destekli öğrenme sistemleri" },
    { year: "2024", title: "Global Genişleme", description: "Uluslararası pazara açılım" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Hakkımızda
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Eğitimin Geleceğini Şekillendiriyoruz
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              EduPlatform olarak, herkesin kaliteli eğitime erişebileceği bir dünya yaratma vizyonuyla 
              Türkiye'nin en kapsamlı online eğitim platformunu geliştiriyoruz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Users className="w-5 h-5 mr-2" />
                Ekibimizle Tanışın
              </Button>
              <Button variant="outline" size="lg">
                <Target className="w-5 h-5 mr-2" />
                Misyonumuz
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Misyonumuz</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Teknoloji ve eğitimi bir araya getirerek, her yaştan ve her seviyeden öğrencinin 
                potansiyelini keşfetmesine yardımcı olmak. Kaliteli eğitimi demokratikleştirerek, 
                öğrenmenin coğrafi ve ekonomik sınırlarını ortadan kaldırmak.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Herkes için erişilebilir eğitim</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Uzman eğitmenlerle kaliteli içerik</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>İnteraktif öğrenme deneyimi</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">Vizyonumuz</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Dünya çapında tanınan, öğrenme deneyimini dönüştüren ve bireylerin kariyerlerini 
                şekillendiren lider eğitim platformu olmak. Yapay zeka ve modern teknolojilerle 
                desteklenen, kişiselleştirilmiş öğrenme çözümleri sunmak.
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                Geleceğe Bakış
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Değerlerimiz</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Her adımımızda bizi yönlendiren temel değerler ve ilkelerimiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Yolculuğumuz</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Kuruluşumuzdan bugüne kadar geçirdiğimiz önemli dönüm noktaları
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-100 text-blue-800">
                              {milestone.year}
                            </Badge>
                            <Clock className="w-5 h-5 text-blue-500" />
                          </div>
                          <CardTitle className="text-xl">{milestone.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{milestone.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                    <div className="w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Bizimle Öğrenme Yolculuğuna Başlayın
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Binlerce kurs ve uzman eğitmenle kariyerinizi ileriye taşıyın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <BookOpen className="w-5 h-5 mr-2" />
              Kursları İncele
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Users className="w-5 h-5 mr-2" />
              Topluluğa Katıl
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

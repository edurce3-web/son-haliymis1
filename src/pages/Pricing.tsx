import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  Star, 
  Users, 
  BookOpen, 
  Award, 
  Download,
  MessageSquare,
  Zap,
  Crown
} from "lucide-react";
import { toast } from "sonner";

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const plans = {
    monthly: [
      {
        name: "Temel",
        price: 49.99,
        originalPrice: 69.99,
        description: "Bireysel öğrenciler için ideal başlangıç planı",
        icon: BookOpen,
        color: "bg-muted",
        textColor: "text-muted-foreground",
        features: [
          "1,000+ kursa erişim",
          "Mobil uygulama",
          "Temel sertifikalar",
          "Email desteği",
          "İndirilebilir kaynaklar"
        ],
        limitations: [
          "Premium kurslar hariç",
          "Canlı derslere katılım yok"
        ]
      },
      {
        name: "Pro",
        price: 99.99,
        originalPrice: 149.99,
        description: "Profesyoneller için gelişmiş öğrenme deneyimi",
        icon: Star,
        color: "bg-gradient-primary",
        textColor: "text-white",
        popular: true,
        features: [
          "Tüm kurslara sınırsız erişim",
          "Premium kurslar dahil",
          "Canlı dersler",
          "1:1 mentorluk (2 saat/ay)",
          "Öncelikli destek",
          "İleri seviye sertifikalar",
          "Offline izleme",
          "Proje tabanlı öğrenme"
        ]
      },
      {
        name: "Kurumsal",
        price: 199.99,
        originalPrice: 299.99,
        description: "Takımlar ve şirketler için kapsamlı çözüm",
        icon: Crown,
        color: "bg-gradient-hero",
        textColor: "text-white",
        features: [
          "Pro planın tüm özellikleri",
          "50 kullanıcıya kadar",
          "Takım yönetim paneli",
          "Özelleştirilmiş learning path'ler",
          "Analitik ve raporlar",
          "SSO entegrasyonu",
          "Dedike hesap yöneticisi",
          "Özel kurs talepleri"
        ]
      }
    ],
    yearly: [
      {
        name: "Temel",
        price: 39.99,
        originalPrice: 69.99,
        description: "Bireysel öğrenciler için ideal başlangıç planı",
        icon: BookOpen,
        color: "bg-muted",
        textColor: "text-muted-foreground",
        yearlyDiscount: "2 ay bedava!",
        features: [
          "1,000+ kursa erişim",
          "Mobil uygulama",
          "Temel sertifikalar",
          "Email desteği",
          "İndirilebilir kaynaklar"
        ],
        limitations: [
          "Premium kurslar hariç",
          "Canlı derslere katılım yok"
        ]
      },
      {
        name: "Pro",
        price: 79.99,
        originalPrice: 149.99,
        description: "Profesyoneller için gelişmiş öğrenme deneyimi",
        icon: Star,
        color: "bg-gradient-primary",
        textColor: "text-white",
        popular: true,
        yearlyDiscount: "3 ay bedava!",
        features: [
          "Tüm kurslara sınırsız erişim",
          "Premium kurslar dahil",
          "Canlı dersler",
          "1:1 mentorluk (2 saat/ay)",
          "Öncelikli destek",
          "İleri seviye sertifikalar",
          "Offline izleme",
          "Proje tabanlı öğrenme"
        ]
      },
      {
        name: "Kurumsal",
        price: 159.99,
        originalPrice: 299.99,
        description: "Takımlar ve şirketler için kapsamlı çözüm",
        icon: Crown,
        color: "bg-gradient-hero",
        textColor: "text-white",
        yearlyDiscount: "4 ay bedava!",
        features: [
          "Pro planın tüm özellikleri",
          "50 kullanıcıya kadar",
          "Takım yönetim paneli",
          "Özelleştirilmiş learning path'ler",
          "Analitik ve raporlar",
          "SSO entegrasyonu",
          "Dedike hesap yöneticisi",
          "Özel kurs talepleri"
        ]
      }
    ]
  };

  const handleSelectPlan = (planName: string) => {
    toast.success(`${planName} planı seçildi!`, {
      description: "Ödeme sayfasına yönlendiriliyorsunuz...",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Öğrenme Hedeflerinize Uygun Plan Seçin
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Her seviyeden öğrenci için tasarlanmış esnek planlarımızla 
            kariyerinizi ileriye taşıyın
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white text-primary font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === "yearly"
                  ? "bg-white text-primary font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Yıllık
              <Badge className="ml-2 bg-yellow-400 text-yellow-900 text-xs">
                %47'ye kadar tasarruf
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 -mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans[billingPeriod].map((plan, index) => (
              <Card
                key={plan.name}
                className={`relative border-0 shadow-elegant hover:shadow-2xl transition-all duration-300 ${
                  plan.popular ? "ring-2 ring-primary scale-105" : ""
                } ${index === 1 ? "z-10" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      En Popüler
                    </Badge>
                  </div>
                )}
                
                {plan.yearlyDiscount && (
                  <div className="absolute -top-3 -right-3">
                    <Badge className="bg-success text-success-foreground px-3 py-1 rotate-12">
                      {plan.yearlyDiscount}
                    </Badge>
                  </div>
                )}

                <CardHeader className={`text-center ${plan.color} rounded-t-lg ${plan.textColor} p-8`}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    <plan.icon className="w-8 h-8" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <p className={`text-sm ${plan.textColor === 'text-white' ? 'text-white/80' : 'text-muted-foreground'} mb-4`}>
                    {plan.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-4xl font-bold">₺{plan.price}</span>
                      <span className={`text-sm ${plan.textColor === 'text-white' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        /{billingPeriod === "monthly" ? "ay" : "yıl"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className={`text-sm line-through ${plan.textColor === 'text-white' ? 'text-white/60' : 'text-muted-foreground'}`}>
                        ₺{plan.originalPrice}
                      </span>
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        %{Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)} İndirim
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    size="lg"
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-gradient-primary hover:shadow-course-hover"
                        : "bg-gradient-primary hover:shadow-course-hover"
                    }`}
                  >
                    {plan.name} Planını Seç
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Dahil Olan Özellikler
                    </h4>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations && (
                      <div className="pt-4 border-t">
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">
                          Sınırlamalar
                        </h5>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start space-x-3">
                              <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                              </div>
                              <span className="text-sm text-muted-foreground">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tüm Planları Karşılaştırın</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hangi planın size en uygun olduğunu görmek için detaylı karşılaştırmayı inceleyin
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-course">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Özellik</th>
                  <th className="text-center p-4 font-semibold">Temel</th>
                  <th className="text-center p-4 font-semibold text-primary">Pro</th>
                  <th className="text-center p-4 font-semibold">Kurumsal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Kurs Sayısı", basic: "1,000+", pro: "Sınırsız", enterprise: "Sınırsız" },
                  { feature: "Premium Kurslar", basic: "❌", pro: "✅", enterprise: "✅" },
                  { feature: "Canlı Dersler", basic: "❌", pro: "✅", enterprise: "✅" },
                  { feature: "Mentorluk", basic: "❌", pro: "2 saat/ay", enterprise: "Sınırsız" },
                  { feature: "Sertifikalar", basic: "Temel", pro: "İleri", enterprise: "Özel" },
                  { feature: "Offline İzleme", basic: "❌", pro: "✅", enterprise: "✅" },
                  { feature: "Takım Yönetimi", basic: "❌", pro: "❌", enterprise: "✅" },
                  { feature: "API Erişimi", basic: "❌", pro: "❌", enterprise: "✅" },
                ].map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">{row.basic}</td>
                    <td className="p-4 text-center text-primary font-semibold">{row.pro}</td>
                    <td className="p-4 text-center">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-muted-foreground">
              Planlarımız hakkında merak ettikleriniz
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Plan değişikliği yapabilir miyim?",
                answer: "Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Değişiklik hemen geçerli olur."
              },
              {
                question: "Para iade garantisi var mı?",
                answer: "Tüm planlarımızda 30 gün para iade garantisi bulunmaktadır. Memnun kalmazsanız tam iade alabilirsiniz."
              },
              {
                question: "Yıllık plan avantajları nelerdir?",
                answer: "Yıllık planlarımızda %47'ye varan indirim ve ek aylar bedava. Ayrıca özel bonuslar ve öncelikli destek."
              },
              {
                question: "Kurumsal plan kaç kullanıcıyı kapsar?",
                answer: "Kurumsal planımız 50 kullanıcıya kadar destekler. Daha fazla kullanıcı için özel fiyatlandırma yapıyoruz."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-0 shadow-course">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Hemen Başlayın ve Farkı Görün
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Seçtiğiniz planla öğrenme yolculuğunuza bugün başlayın. 
            İlk 7 gün ücretsiz deneme fırsatı!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button variant="premium" size="lg">
              Ücretsiz Deneme Başlat
            </Button>
            <Button variant="ghost" size="lg" className="border border-white/30 text-white hover:bg-white/10">
              Satış Ekibiyle Konuş
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock, Award, Rocket, CheckCircle2 } from "lucide-react";
import HeroPerson from "@/components/instructor/HeroPerson";

const BecomeInstructor = () => {
  const benefits = [
    { icon: Users, title: "Geniş Öğrenci Kitlesi", description: "Binlerce öğrenciye ulaşın ve bilginizi paylaşın" },
    { icon: Clock, title: "Esnek Çalışma Saatleri", description: "İstediğiniz zaman, istediğiniz yerden ders verin" },
    { icon: TrendingUp, title: "Gelir Artışı", description: "Dersinizin her satışından kazanç elde edin" },
    { icon: Award, title: "Profesyonel Destek", description: "Her adımda yanınızdayız, başarınız için destek alın" },
    { icon: BookOpen, title: "Kolay İçerik Yönetimi", description: "Kullanıcı dostu araçlarla kurslarınızı kolayca oluşturun" },
    { icon: Rocket, title: "Hızlı Başlangıç", description: "Dakikalar içinde ilk dersinizi yayınlayın" }
  ];

  const steps = [
    { number: "01", title: "Formu Tamamlayın", description: "Başvuru formunu doldurun ve eğitmenlik başvurunuzu gönderin" },
    { number: "02", title: "Kursunuzu Oluşturun", description: "Video, metin ve quiz'lerle zengin içerik hazırlayın" },
    { number: "03", title: "Yayınlayın", description: "Kursunuzu onaya gönderin ve öğrencilere ulaşın" },
    { number: "04", title: "Kazanmaya Başlayın", description: "Her satıştan gelir elde edin ve topluluğunuzu büyütün" }
  ];

  const stats = [
    { number: "10,000+", label: "Aktif Öğrenci" },
    { number: "500+", label: "Eğitimci" },
    { number: "₺2M+", label: "Ödenen Gelir" },
    { number: "4.8/5", label: "Ortalama Puan" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/*
        Kahraman bölümü. Figür çerçevesiz: sağ kenara ve zemine oturuyor,
        arkasında kutu ya da kart yok — bölümün zeminiyle kaynaşıyor.
      */}
      <section className="relative overflow-hidden bg-brand-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative grid lg:grid-cols-[1fr_auto] items-end gap-8 min-h-[520px] lg:min-h-[600px]">

            <div className="space-y-7 py-16 lg:py-28 animate-in fade-in slide-in-from-left duration-1000">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight max-w-xl">
                Platformumuzda
                <span className="block text-brand-700">eğitim verin</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Eğitmen olun, bilginizi paylaşın ve kendi hayatınız başta olmak
                üzere hayatları değiştirin.
              </p>

              <div>
                <Button
                  size="lg"
                  className="bg-brand-700 hover:bg-brand-800 text-white font-semibold shadow-sm transition-colors text-base px-10 py-6 h-auto"
                  onClick={() => window.location.assign('/instructor-application')}
                >
                  Başlayın
                </Button>
              </div>
            </div>

            {/* Figür: masaüstünde sağda ve zemine oturur, mobilde gizlenir */}
            <div className="hidden lg:block relative self-end w-[420px] xl:w-[500px] animate-in fade-in slide-in-from-right duration-1000 delay-200">
              <HeroPerson className="w-full h-auto block" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2 animate-in fade-in zoom-in duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Neden <span className="text-brand-700">Edurce</span>?
            </h2>
            <p className="text-xl text-muted-foreground">
              Binlerce eğitimcinin tercih ettiği platform ile kariyerinizi bir üst seviyeye taşıyın
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 animate-in fade-in slide-in-from-bottom duration-700"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Nasıl <span className="text-brand-700">Çalışır</span>?
            </h2>
            <p className="text-xl text-muted-foreground">
              4 basit adımda eğitimci olun ve kazanmaya başlayın
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-brand-400 to-brand-600 -translate-x-1/2 opacity-30" />
                )}
                <div className="relative bg-background rounded-2xl p-8 border border-border/50 hover:border-brand-400 transition-all duration-300 hover:shadow-lg">
                  <div className="text-7xl font-bold text-brand-700/10 absolute top-4 right-4">
                    {step.number}
                  </div>
                  <div className="relative space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-lg">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden border-2 border-brand-200">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100/60" />
            <div className="relative p-12 lg:p-16 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Hayalinizdeki Kariyere
                  <span className="block text-brand-700 mt-2">Bugün Başlayın</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Ücretsiz hesap oluşturun ve eğitmen topluluğumuza katılın. 
                  Hemen ilk kursu oluşturmaya başlayabilirsiniz!
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="bg-brand-700 hover:bg-brand-800 text-white font-semibold shadow-sm transition-colors text-lg px-10 py-6 h-auto group" onClick={() => window.location.assign('/instructor-application')}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Ücretsiz Başlayın
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto border-brand-300 text-brand-800 hover:bg-brand-50 hover:text-brand-900" onClick={() => window.location.assign('/help')}>
                  Daha Fazla Bilgi
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ✓ Kredi kartı gerektirmez  ✓ 7/24 destek  ✓ Anında başlayın
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-brand-700">Edurce</h3>
              <p className="text-sm text-muted-foreground">
                Bilginizi paylaşın, gelir elde edin. Türkiye'nin öncü online eğitim platformu.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-brand-700 transition-colors">Nasıl Çalışır</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Fiyatlandırma</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-brand-700 transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">SSS</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Topluluk</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-brand-700 transition-colors">Kullanım Koşulları</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">Çerez Politikası</a></li>
                <li><a href="#" className="hover:text-brand-700 transition-colors">KVKK</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 Edurce. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BecomeInstructor;

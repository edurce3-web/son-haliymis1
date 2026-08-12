import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock, Award, Rocket, CheckCircle2 } from "lucide-react";

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
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                Bilginizi Paylaşın,
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Gelir Elde Edin</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Edurce ile tutkularınızı kariyere dönüştürün. Binlerce öğrenciye ulaşın, 
                kendi çalışma saatlerinizi belirleyin ve her derste kazanın.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="hero" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.assign('/instructor-application')}>
                  Hemen Başlayın
                </Button>
              </div>
              
              <div className="flex gap-8 pt-4">
                {stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-3xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              {/* Görsel yerine dekoratif kutu (asset gerektirmez) */}
              <div className="relative rounded-3xl shadow-2xl w-full aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 border border-border" />
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
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
              Neden <span className="text-primary">Edurce</span>?
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
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
              Nasıl <span className="text-secondary">Çalışır</span>?
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
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-accent -translate-x-1/2 opacity-30" />
                )}
                <div className="relative bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="text-7xl font-bold text-primary/10 absolute top-4 right-4">
                    {step.number}
                  </div>
                  <div className="relative space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-white font-bold text-lg">
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
          <Card className="relative overflow-hidden border-2 border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
            <div className="relative p-12 lg:p-16 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Hayalinizdeki Kariyere
                  <span className="block text-primary mt-2">Bugün Başlayın</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Ücretsiz hesap oluşturun ve eğitmen topluluğumuza katılın. 
                  Hemen ilk kursu oluşturmaya başlayabilirsiniz!
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="hero" className="text-lg px-10 py-6 h-auto group" onClick={() => window.location.assign('/instructor-application')}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Ücretsiz Başlayın
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto" onClick={() => window.location.assign('/help')}>
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
              <h3 className="text-2xl font-bold text-primary">Edurce</h3>
              <p className="text-sm text-muted-foreground">
                Bilginizi paylaşın, gelir elde edin. Türkiye'nin öncü online eğitim platformu.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Nasıl Çalışır</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Fiyatlandırma</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">SSS</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Topluluk</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Kullanım Koşulları</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Çerez Politikası</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">KVKK</a></li>
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

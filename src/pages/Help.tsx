import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { PageHeader, ContactBand } from '@/components/content/PageLayout';
import { cn } from '@/lib/utils';
import { UserRound, CreditCard, PlayCircle, Coins, GraduationCap, Search } from 'lucide-react';

interface Entry {
    q: string;
    a: React.ReactNode;
    /** Aramada eşleşmesi için düz metin karşılığı */
    text: string;
}

interface Group {
    id: string;
    title: string;
    entries: Entry[];
}

const L: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="text-brand-700 hover:underline">{children}</Link>
);

/**
 * Yardım merkezi.
 *
 * Sorular platformun gerçek davranışına göre yazıldı; genel geçer "nasıl kayıt
 * olurum" doldurması değil. Arama, hem soruda hem cevapta eşleşir.
 */
const GROUPS: Group[] = [
    {
        id: 'hesap',
        title: 'Hesap ve giriş',
        entries: [
            {
                q: 'Nasıl hesap açarım?',
                text: 'kayıt hesap açma doğrulama kodu e-posta google facebook apple',
                a: (
                    <>
                        Kayıt üç adımdan oluşur: ad-soyad ve e-posta girersiniz, adresinize gelen
                        6 haneli kodu doğrularsınız, sonra parolanızı belirlersiniz. Google, Facebook
                        veya Apple hesabıyla da tek adımda giriş yapabilirsiniz.
                    </>
                ),
            },
            {
                q: 'Doğrulama kodu gelmedi, ne yapmalıyım?',
                text: 'doğrulama kodu gelmedi spam yeniden gönder',
                a: (
                    <>
                        Önce spam ve tanıtımlar klasörünü kontrol edin. Kod 10 dakika geçerlidir;
                        süresi dolduysa kayıt ekranındaki "Kodu tekrar gönder" bağlantısını
                        kullanın. Tekrar gönderme arasında 60 saniye beklemeniz gerekir. Hâlâ
                        gelmiyorsa <L to="/contact">bize yazın</L>.
                    </>
                ),
            },
            {
                q: 'Parolamı unuttum',
                text: 'parola şifre unuttum sıfırlama',
                a: (
                    <>
                        Giriş ekranındaki <L to="/forgot-password">Şifremi unuttum</L>
                        bağlantısını kullanın. E-postanıza 6 haneli bir kod gönderilir; kodu
                        girdikten sonra yeni şifrenizi belirlersiniz. Kod 10 dakika geçerlidir.
                        Google veya Facebook ile giriş yaptıysanız parolaya ihtiyacınız yoktur.
                    </>
                ),
            },
            {
                q: 'Parolamı nasıl değiştiririm?',
                text: 'parola değiştirme güvenlik ayarlar',
                a: (
                    <>
                        <L to="/home/settings/security">Güvenlik ayarlarından</L> değiştirebilirsiniz.
                        Güvenlik için e-postanıza 6 haneli bir kod gönderilir; parola ancak kodu
                        girdikten sonra değişir.
                    </>
                ),
            },
            {
                q: 'Hesabımı nasıl kapatırım?',
                text: 'hesap kapatma silme',
                a: (
                    <>
                        <L to="/home/settings/close">Hesap ayarlarından</L> kapatabilirsiniz.
                        Hesap kapatıldığında satın aldığınız kurslara erişiminiz sona erer ve
                        birikmiş Edurce Kredileriniz silinir. Bu işlem geri alınamaz.
                    </>
                ),
            },
        ],
    },
    {
        id: 'satin-alma',
        title: 'Satın alma ve ödeme',
        entries: [
            {
                q: 'Kurslar abonelik mi, tek seferlik mi?',
                text: 'abonelik tek seferlik ödeme süresiz erişim',
                a: (
                    <>
                        Tek seferliktir. Abonelik yoktur, otomatik yenileme yoktur. Satın aldığınız
                        kursa süresiz erişirsiniz ve eğitmen kursu güncellerse güncellemelere ek
                        ücret ödemeden ulaşırsınız.
                    </>
                ),
            },
            {
                q: 'Hangi ödeme yöntemlerini kullanabilirim?',
                text: 'ödeme kredi kartı banka kartı 3d secure taksit',
                a: (
                    <>
                        Kredi ve banka kartıyla ödeme yapabilirsiniz. Ödeme adımı 3D Secure ile
                        korunur; kart bilgileriniz Edurce sistemlerinde saklanmaz.
                    </>
                ),
            },
            {
                q: 'Ödeme yaptım ama kurs Eğitimlerim sayfasında görünmüyor',
                text: 'ödeme yaptım kurs görünmüyor eğitimlerim erişim açılmadı',
                a: (
                    <>
                        Erişim, ödeme onaylandığı anda açılır. Bankanızdan provizyon mesajı gelmiş
                        olsa bile ödeme tamamlanmamış olabilir; bu durumda tutar tahsil edilmez ve
                        birkaç gün içinde iade edilir. Ödemenin başarılı olduğundan eminseniz{' '}
                        <L to="/contact">bize yazın</L>, sipariş numaranızla birlikte kontrol edelim.
                    </>
                ),
            },
            {
                q: 'Sepetteki kursların fiyatı değişti',
                text: 'fiyat değişti sepet indirim',
                a: (
                    <>
                        Kursun fiyatını eğitmen belirler ve değiştirebilir. Sizin için geçerli olan
                        fiyat, ödeme ekranında gördüğünüz tutardır. Sonradan yapılan fiyat
                        değişiklikleri geçmiş satın almalarınızı etkilemez.
                    </>
                ),
            },
            {
                q: 'İade alabilir miyim?',
                text: 'iade para geri ödeme cayma hakkı',
                a: (
                    <>
                        Dijital içerikte cayma hakkı sınırlı olmakla birlikte; satın almadan sonraki
                        14 gün içinde ve kursun %20'sinden azını izlediyseniz iade talebinizi
                        değerlendiriyoruz. Kursun tanıtımıyla içeriğinin uyuşmaması, teknik bir
                        arıza nedeniyle erişememeniz veya aynı kursu iki kez almanız durumunda da
                        iade yapıyoruz. Ayrıntılar <L to="/terms">kullanım şartlarında</L>.
                    </>
                ),
            },
        ],
    },
    {
        id: 'kurslar',
        title: 'Kurslar ve izleme',
        entries: [
            {
                q: 'Video oynatılmıyor veya sık sık duruyor',
                text: 'video açılmıyor donuyor takılıyor oynatma sorunu',
                a: (
                    <>
                        Önce sayfayı yenileyin ve farklı bir tarayıcıda deneyin. Sorun sürüyorsa
                        genellikle ağ kaynaklıdır: VPN veya kurumsal ağ kullanıyorsanız kapatıp
                        deneyin. Devam ederse <L to="/contact">bize yazın</L>; kursun adını ve
                        hangi derste olduğunu belirtin.
                    </>
                ),
            },
            {
                q: 'İlerlemem kaydediliyor mu?',
                text: 'ilerleme kaydediliyor kaldığım yerden devam',
                a: (
                    <>
                        Evet. Tamamladığınız dersler otomatik işaretlenir ve kaldığınız yerden devam
                        edebilirsiniz. İlerlemenizi <L to="/home/learning">Eğitimlerim</L> sayfasından
                        takip edebilirsiniz.
                    </>
                ),
            },
            {
                q: 'Kursu indirebilir miyim?',
                text: 'indirme offline izleme çevrimdışı',
                a: (
                    <>
                        Ders videoları indirilemez. Eğitmenin eklediği ders kaynakları (dosya,
                        sunum, doküman) indirilebilir. İçeriği kaydetmek, çoğaltmak veya paylaşmak
                        kullanım şartlarına aykırıdır.
                    </>
                ),
            },
            {
                q: 'Eğitmene nasıl soru sorarım?',
                text: 'soru sorma eğitmen iletişim mesaj',
                a: (
                    <>
                        Kurs sayfasındaki Soru-Cevap bölümünden soru sorabilirsiniz; eğitmen
                        yanıtladığında bildirim alırsınız. Doğrudan yazışmak için{' '}
                        <L to="/messages">Mesajlar</L> sayfasını kullanabilirsiniz.
                    </>
                ),
            },
            {
                q: 'Sertifikamı nasıl alırım?',
                text: 'sertifika alma indirme pdf png tamamlama',
                a: (
                    <>
                        Bir kursu %100 tamamladığınızda sertifikanız otomatik hazırlanır ve{' '}
                        <L to="/home/certificates">Sertifikalarım</L> sayfasında görünür. PNG veya
                        PDF olarak indirebilirsiniz.
                    </>
                ),
            },
        ],
    },
    {
        id: 'kredi',
        title: 'Edurce Kredi',
        entries: [
            {
                q: 'Edurce Kredi nedir?',
                text: 'kredi nedir sadakat puan kazanma',
                a: (
                    <>
                        Platformda geçirdiğiniz zamanın karşılığı olarak kazandığınız ve kurs
                        alırken indirim olarak kullandığınız bir programdır. Ders tamamlayarak,
                        kurs bitirerek, değerlendirme yazarak, soru sorarak, günlük giriş yaparak
                        ve alışveriş yaparak kredi kazanırsınız. Ayrıntılar{' '}
                        <L to="/home/gamification">kredi sayfasında</L>.
                    </>
                ),
            },
            {
                q: 'Kredimi nasıl kullanırım?',
                text: 'kredi kullanma indirim ödeme',
                a: (
                    <>
                        Ödeme sayfasında kredinizi indirim olarak uygulayabilirsiniz. Bir siparişin
                        en fazla %50'si krediyle ödenebilir. Kredinin lira karşılığı seviyenize
                        göre değişir: seviye yükseldikçe krediniz daha çok değer eder.
                    </>
                ),
            },
            {
                q: 'Kredi harcayınca seviyem düşer mi?',
                text: 'seviye düşme kredi harcama bronz gümüş altın',
                a: (
                    <>
                        Hayır. Seviye, hayat boyu kazandığınız toplam krediye bakar; harcanabilir
                        bakiyenize değil. Kredi harcamanız seviyenizi etkilemez.
                    </>
                ),
            },
            {
                q: 'Kredimi paraya çevirebilir miyim?',
                text: 'kredi para çekme nakit transfer',
                a: (
                    <>
                        Hayır. Kredinin nakit karşılığı yoktur, banka hesabına aktarılamaz ve başka
                        bir kullanıcıya devredilemez. Yalnızca kurs alırken indirim olarak
                        kullanılabilir.
                    </>
                ),
            },
        ],
    },
    {
        id: 'egitmen',
        title: 'Eğitmenler için',
        entries: [
            {
                q: 'Nasıl eğitmen olurum?',
                text: 'eğitmen olma başvuru kurs açma',
                a: (
                    <>
                        <L to="/become-instructor">Eğitmen sayfasından</L> başvurun. Başvurunuz
                        onaylandığında eğitmen paneline erişiminiz açılır ve kurs oluşturmaya
                        başlayabilirsiniz. Kurs açmak ve yayınlamak ücretsizdir.
                    </>
                ),
            },
            {
                q: 'Ne kadar kazanırım?',
                text: 'kazanç gelir paylaşımı komisyon yüzde',
                a: (
                    <>
                        Brüt satış tutarından %20 yasal vergi düşülür, kalan tutarın %55'i size
                        aittir. 1.000 ₺'lik bir satışta 440 ₺ kazanırsınız. Her satışın dökümünü
                        eğitmen panelindeki satış raporunda görebilirsiniz.
                    </>
                ),
            },
            {
                q: 'Ödemem ne zaman yapılır?',
                text: 'ödeme günü hakediş iban ne zaman',
                a: (
                    <>
                        Ödeme gününü eğitmen panelindeki ödeme ayarlarından siz seçersiniz. Ödeme
                        yapılabilmesi için IBAN ve kimlik bilgilerinizin eksiksiz olması gerekir.
                        Biriken bakiyenizi ve geçmiş ödemelerinizi aynı ekrandan görürsünüz.
                    </>
                ),
            },
            {
                q: 'Video yükledim ama ders görünmüyor',
                text: 'video yükleme işleme süre bekleme',
                a: (
                    <>
                        Yüklenen video arka planda farklı kalitelerde hazırlanır; bu işlem videonun
                        uzunluğuna göre birkaç dakika sürebilir. Bu sırada siteden çıkabilirsiniz,
                        işlem sunucuda devam eder. Hazır olduğunda e-posta ile bilgilendirilirsiniz.
                        Bir saatten uzun sürerse <L to="/contact">bize bildirin</L>.
                    </>
                ),
            },
            {
                q: 'Kursumu yayından kaldırırsam ne olur?',
                text: 'kurs yayından kaldırma silme öğrenciler',
                a: (
                    <>
                        Kurs yeni satışa kapanır, ancak daha önce satın almış öğrencilerin erişimi
                        devam eder. Bu, satın alma sırasında verilen süresiz erişim taahhüdünün
                        gereğidir.
                    </>
                ),
            },
            {
                q: 'Telif hakkımı ihlal eden bir kurs var',
                text: 'telif hakkı ihlal şikayet içerik kaldırma',
                a: (
                    <>
                        <L to="/contact">İletişim formundan</L> "Telif hakkı bildirimi" konusuyla
                        yazın. İçeriğin bağlantısını ve hak sahipliğinizi gösteren belgeyi ekleyin.
                        Bildirimi aldığımızda içeriği geçici olarak yayından kaldırır ve eğitmene
                        bildiririz.
                    </>
                ),
            },
        ],
    },
];

/**
 * Bölüm renkleri ve simgeleri.
 *
 * Sayfa tek renk gri metin yığınıyken hangi bölümde olunduğu ancak başlık
 * okunarak anlaşılıyordu. Her bölüm kendi rengini taşıyınca, kart ızgarasından
 * seçilen bölüm aşağıda da aynı renkle karşılıyor.
 */
const GROUP_THEME: Record<string, { icon: React.ElementType; card: string; chip: string; text: string }> = {
    hesap: { icon: UserRound, card: 'border-brand-200 bg-brand-50/70 hover:bg-brand-50', chip: 'bg-brand-700', text: 'text-brand-800' },
    'satin-alma': { icon: CreditCard, card: 'border-amber-200 bg-amber-50/70 hover:bg-amber-50', chip: 'bg-amber-500', text: 'text-amber-700' },
    kurslar: { icon: PlayCircle, card: 'border-sky-200 bg-sky-50/70 hover:bg-sky-50', chip: 'bg-sky-600', text: 'text-sky-700' },
    kredi: { icon: Coins, card: 'border-violet-200 bg-violet-50/70 hover:bg-violet-50', chip: 'bg-violet-600', text: 'text-violet-700' },
    egitmen: { icon: GraduationCap, card: 'border-rose-200 bg-rose-50/70 hover:bg-rose-50', chip: 'bg-rose-500', text: 'text-rose-700' },
};

const Help: React.FC = () => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<string | null>(null);

    useSeo({
        title: 'Yardım Merkezi | Edurce',
        description: 'Hesap, satın alma, iade, kurs izleme, sertifika, Edurce Kredi ve eğitmenlik hakkında sık sorulan sorular.',
        canonical: 'https://edurce.com/help',
        robots: 'index, follow',
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase('tr-TR');
        if (!q) return GROUPS;

        return GROUPS
            .map(g => ({
                ...g,
                entries: g.entries.filter(e =>
                    `${e.q} ${e.text}`.toLocaleLowerCase('tr-TR').includes(q)
                ),
            }))
            .filter(g => g.entries.length > 0);
    }, [query]);

    const totalHits = filtered.reduce((n, g) => n + g.entries.length, 0);

    return (
        <div className="min-h-screen bg-white">
            <PageHeader
                title="Yardım merkezi"
                lead="Hesap, satın alma, kurslar, Edurce Kredi ve eğitmenlik hakkında en sık sorulan soruların yanıtları. Aramak için yazmaya başlayın."
            >
                <div className="mt-8 max-w-xl mx-auto">
                    <label htmlFor="help-search" className="sr-only">Yardım konularında ara</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                        <input
                            id="help-search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Konu ara — iade, sertifika, video, kredi…"
                            className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-brand-200 bg-white text-[15.5px] placeholder:text-slate-400 shadow-[0_2px_10px_-4px_rgba(23,93,93,0.18)] focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 transition-all"
                        />
                    </div>
                    {query && (
                        <p className="text-[13.5px] text-slate-500 mt-3">
                            {totalHits > 0 ? `${totalHits} sonuç bulundu` : 'Sonuç bulunamadı'}
                        </p>
                    )}
                </div>
            </PageHeader>

            <div className="container px-5 sm:px-8 py-12 lg:py-16">
                <div className="max-w-3xl mx-auto">

                    {/*
                        Bölüm kartları.

                        Eskiden solda ince, gri, yapışkan bir bağlantı listesi vardı; içeriği
                        ekranın kenarına itiyor ve hiçbir şey anlatmıyordu. Kartlar hem
                        bölümlere atlıyor hem de sayfada ne bulunacağını tek bakışta gösteriyor.
                    */}
                    {!query && (
                        <nav aria-label="Bölümler" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {GROUPS.map(g => {
                                const theme = GROUP_THEME[g.id];
                                const Icon = theme?.icon;
                                return (
                                    <a
                                        key={g.id}
                                        href={`#${g.id}`}
                                        className={cn(
                                            'rounded-2xl border p-5 transition-colors',
                                            theme?.card || 'border-slate-200 bg-slate-50'
                                        )}
                                    >
                                        <span className={cn(
                                            'flex items-center justify-center w-9 h-9 rounded-lg text-white',
                                            theme?.chip || 'bg-slate-500'
                                        )}>
                                            {Icon && <Icon className="w-[18px] h-[18px]" />}
                                        </span>
                                        <span className="block mt-3.5 text-[14.5px] font-bold text-slate-900 leading-snug">
                                            {g.title}
                                        </span>
                                        <span className={cn('block mt-1 text-[13px] font-medium', theme?.text || 'text-slate-500')}>
                                            {g.entries.length} başlık
                                        </span>
                                    </a>
                                );
                            })}
                        </nav>
                    )}

                    <div className={cn(!query && 'mt-14')}>
                        {totalHits === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 py-16 px-6 text-center">
                                <p className="font-montserrat text-[18px] font-extrabold text-slate-900 tracking-tight">
                                    "{query}" için sonuç bulunamadı
                                </p>
                                <p className="text-[15.5px] text-slate-600 mt-3 max-w-md mx-auto leading-[1.75]">
                                    Farklı bir kelime deneyin ya da{' '}
                                    <Link to="/contact" className="text-brand-700 font-medium hover:underline">
                                        doğrudan bize yazın
                                    </Link>
                                    .
                                </p>
                            </div>
                        ) : (
                            filtered.map((group, gi) => {
                                const theme = GROUP_THEME[group.id];
                                const Icon = theme?.icon;
                                return (
                                    <section
                                        key={group.id}
                                        id={group.id}
                                        className={cn('scroll-mt-28', gi > 0 && 'mt-14')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                'flex items-center justify-center w-10 h-10 rounded-xl text-white shrink-0',
                                                theme?.chip || 'bg-slate-500'
                                            )}>
                                                {Icon && <Icon className="w-5 h-5" />}
                                            </span>
                                            <h2 className="font-montserrat text-[22px] lg:text-[25px] font-extrabold text-slate-900 tracking-[-0.02em] leading-tight">
                                                {group.title}
                                            </h2>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                            {group.entries.map(entry => {
                                                const key = `${group.id}-${entry.q}`;
                                                const isOpen = open === key || Boolean(query);
                                                return (
                                                    <div key={key} className={cn(isOpen && 'bg-slate-50/60')}>
                                                        <button
                                                            onClick={() => setOpen(isOpen && !query ? null : key)}
                                                            aria-expanded={isOpen}
                                                            className="w-full flex items-start justify-between gap-6 px-5 sm:px-6 py-4 text-left group"
                                                        >
                                                            <span className={cn(
                                                                'text-[15.5px] leading-snug transition-colors py-0.5',
                                                                isOpen
                                                                    ? cn('font-semibold', theme?.text || 'text-slate-900')
                                                                    : 'text-slate-800 font-medium group-hover:text-slate-950'
                                                            )}>
                                                                {entry.q}
                                                            </span>
                                                            {!query && (
                                                                <span
                                                                    aria-hidden
                                                                    className={cn(
                                                                        'shrink-0 mt-1.5 w-4 h-4 relative transition-transform duration-300',
                                                                        isOpen && 'rotate-90'
                                                                    )}
                                                                >
                                                                    {/* İki çizgiden artı — açılınca eksiye döner */}
                                                                    <span className={cn(
                                                                        'absolute left-0 top-1/2 w-4 h-[2px] -translate-y-1/2 rounded-full transition-colors',
                                                                        isOpen ? (theme?.chip || 'bg-slate-500') : 'bg-slate-400 group-hover:bg-slate-600'
                                                                    )} />
                                                                    <span className={cn(
                                                                        'absolute left-1/2 top-0 h-4 w-[2px] -translate-x-1/2 rounded-full transition-all duration-300',
                                                                        isOpen ? 'opacity-0' : 'bg-slate-400 group-hover:bg-slate-600'
                                                                    )} />
                                                                </span>
                                                            )}
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-5 sm:px-6 pb-5 -mt-1">
                                                                <p className="text-[15px] text-slate-600 leading-[1.8]">
                                                                    {entry.a}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <ContactBand />
        </div>
    );
};

export default Help;

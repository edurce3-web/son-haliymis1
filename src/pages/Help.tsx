import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

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
                        Şu anda kendi kendine parola sıfırlama akışı bulunmuyor.{' '}
                        <L to="/contact">İletişim formundan</L> "Teknik arıza" konusuyla yazarsanız
                        hesabınızı doğrulayıp sıfırlama işlemini biz başlatıyoruz. Google veya
                        Facebook ile giriş yaptıysanız parolaya ihtiyacınız yoktur.
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
            <header className="border-b border-slate-200 bg-slate-50/70">
                <div className="container px-4 py-12 lg:py-16">
                    <nav className="text-xs text-slate-500 mb-4">
                        <Link to="/" className="hover:text-brand-700">Ana sayfa</Link>
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="text-slate-700">Yardım merkezi</span>
                    </nav>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                        Yardım merkezi
                    </h1>
                    <p className="text-[17px] text-slate-600 mt-4 max-w-2xl leading-relaxed">
                        Sık sorulan soruların yanıtları burada. Aradığınızı bulamazsanız{' '}
                        <Link to="/contact" className="text-brand-700 hover:underline">bize yazın</Link>.
                    </p>

                    <div className="mt-7 max-w-lg">
                        <label htmlFor="help-search" className="sr-only">Yardım konularında ara</label>
                        <input
                            id="help-search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Konu ara — iade, sertifika, video, kredi…"
                            className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 transition-colors"
                        />
                        {query && (
                            <p className="text-sm text-slate-500 mt-2">
                                {totalHits > 0 ? `${totalHits} sonuç` : 'Sonuç bulunamadı'}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <div className="container px-4 py-12 lg:py-16">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Bölüm listesi */}
                    {!query && (
                        <nav className="lg:w-56 shrink-0" aria-label="Bölümler">
                            <div className="lg:sticky lg:top-24">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                                    Bölümler
                                </p>
                                <ol className="space-y-1 border-l border-slate-200">
                                    {GROUPS.map(g => (
                                        <li key={g.id}>
                                            <a
                                                href={`#${g.id}`}
                                                className="-ml-px block border-l-2 border-transparent pl-3 py-1 text-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
                                            >
                                                {g.title}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </nav>
                    )}

                    <div className="flex-1 min-w-0 max-w-3xl">
                        {totalHits === 0 ? (
                            <div className="border border-slate-200 rounded-xl py-14 px-6 text-center">
                                <p className="text-[15px] font-medium text-slate-800">
                                    "{query}" için sonuç bulunamadı
                                </p>
                                <p className="text-[15px] text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                                    Farklı bir kelime deneyin ya da{' '}
                                    <Link to="/contact" className="text-brand-700 hover:underline">
                                        doğrudan bize yazın
                                    </Link>
                                    .
                                </p>
                            </div>
                        ) : (
                            filtered.map(group => (
                                <section key={group.id} id={group.id} className="scroll-mt-24 mb-12 last:mb-0">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">{group.title}</h2>

                                    <div className="border-y border-slate-200 divide-y divide-slate-200">
                                        {group.entries.map(entry => {
                                            const key = `${group.id}-${entry.q}`;
                                            const isOpen = open === key || Boolean(query);
                                            return (
                                                <div key={key}>
                                                    <button
                                                        onClick={() => setOpen(isOpen && !query ? null : key)}
                                                        aria-expanded={isOpen}
                                                        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
                                                    >
                                                        <span className="text-[15px] font-medium text-slate-800 group-hover:text-brand-800 transition-colors">
                                                            {entry.q}
                                                        </span>
                                                        {!query && (
                                                            <span className={cn(
                                                                'text-slate-400 text-xl leading-none shrink-0 transition-transform mt-0.5',
                                                                isOpen && 'rotate-45'
                                                            )}>
                                                                +
                                                            </span>
                                                        )}
                                                    </button>
                                                    {isOpen && (
                                                        <div className="pb-5 pr-8 -mt-1">
                                                            <p className="text-[15px] text-slate-600 leading-[1.75]">
                                                                {entry.a}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))
                        )}

                        <div className="mt-14 border-t border-slate-200 pt-8">
                            <h2 className="text-lg font-bold text-slate-900">Aradığınızı bulamadınız mı?</h2>
                            <p className="text-[15px] text-slate-600 mt-2 leading-relaxed max-w-xl">
                                İletişim formundan yazın. Mesajınıza bir talep numarası verilir ve
                                en geç iki iş günü içinde dönüş yapılır.
                            </p>
                            <Link
                                to="/contact"
                                className="inline-block mt-4 h-11 px-6 leading-[44px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                            >
                                İletişime geç
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;

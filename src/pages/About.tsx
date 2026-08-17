import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout, { P, UL, H3, Note, Stats } from '@/components/content/PageLayout';

/**
 * Hakkımızda.
 *
 * Metin bilinçli olarak sayılardan uzak tutuldu: doğrulanamayan "10.000+
 * öğrenci" gibi ifadeler yerine platformun gerçekten ne yaptığı ve nasıl
 * çalıştığı anlatılıyor.
 */
const About: React.FC = () => (
    <PageLayout
        title="Hakkımızda"
        lead="Edurce, Türkçe online kurs platformudur. Bilgisini paylaşmak isteyen eğitmenlerle öğrenmek isteyenleri aynı yerde buluşturur."
        seo={{
            title: 'Hakkımızda | Edurce',
            description: 'Edurce nedir, nasıl çalışır, eğitmen ve öğrenciler için ne sunar? Platformun işleyişi ve ilkeleri.',
            canonical: 'https://edurce.com/about',
        }}
        sections={[
            {
                id: 'ne-yapiyoruz',
                title: 'Ne yapıyoruz',
                body: (
                    <>
                        <P lead>
                            Edurce, alanında bilgi sahibi kişilerin kurs hazırlayıp yayınlayabildiği,
                            öğrenmek isteyenlerin de bu kurslara erişebildiği bir platformdur.
                            Kurslar videolu derslerden oluşur; eğitmen bölüm ve ders yapısını kendi
                            kurar, öğrenci kendi hızında ilerler.
                        </P>
                        <P>
                            Canlı ders ya da sabit takvim yoktur. Bir kursu satın alan öğrenci ona
                            süresiz erişir; istediği zaman başlar, bırakır ve kaldığı yerden devam eder.
                            İlerleme otomatik kaydedilir, kursu tamamlayanlara sertifika üretilir.
                        </P>
                    </>
                ),
            },
            {
                id: 'nasil-calisiyor',
                title: 'Nasıl çalışıyor',
                body: (
                    <>
                        <H3>Öğrenci tarafı</H3>
                        <P>
                            Kurslara kategori sayfalarından veya aramadan ulaşılır. Satın alma tek
                            seferliktir; abonelik yoktur. Satın alınan kurslar Eğitimlerim sayfasında
                            toplanır.
                        </P>
                        <P>
                            Ders sırasında eğitmene soru sorulabilir, doğrudan mesaj gönderilebilir.
                            Eğitmen kursa duyuru yaptığında kayıtlı olan herkese bildirim ve e-posta
                            gider.
                        </P>

                        <H3>Eğitmen tarafı</H3>
                        <P>
                            Eğitmenlik başvurusu onaylandıktan sonra eğitmen paneline erişim açılır.
                            Kurs oluşturmak, video yüklemek ve yayınlamak ücretsizdir; platform
                            yalnızca satış gerçekleştiğinde pay alır.
                        </P>
                        <P>
                            Yüklenen videolar arka planda farklı kalitelerde hazırlanır ve dağıtım
                            ağı üzerinden yayınlanır. İşlem sürerken eğitmen siteden çıkabilir;
                            hazır olduğunda e-posta ile bilgilendirilir.
                        </P>
                    </>
                ),
            },
            {
                id: 'gelir-paylasimi',
                title: 'Gelir paylaşımı',
                body: (
                    <>
                        <P lead>
                            Eğitmenin kazancı şeffaf ve tek bir kurala bağlıdır: brüt satış tutarından
                            önce yasal vergi düşülür, kalan tutarın %55'i eğitmene aittir.
                        </P>
                        <Stats
                            items={[
                                { value: '%20', label: 'Brüt tutardan düşülen yasal vergi' },
                                { value: '%55', label: 'Kalan tutardan eğitmenin payı' },
                                { value: '440 ₺', label: '1.000 ₺\'lik satışta eğitmene kalan' },
                            ]}
                        />
                        <P>
                            Örnek olarak 1.000 ₺'lik bir satışta 200 ₺ vergi kesilir, kalan 800 ₺'nin
                            440 ₺'si eğitmene, 360 ₺'si platforma kalır. Her satışın dökümü eğitmen
                            panelindeki satış raporunda kalem kalem görülebilir.
                        </P>
                        <P>
                            Platform payı; barındırma, video işleme, dağıtım, ödeme altyapısı ve
                            destek maliyetlerini karşılar. Ayrıca aylık ücret, listeleme ücreti veya
                            gizli kesinti yoktur.
                        </P>
                    </>
                ),
            },
            {
                id: 'ilkelerimiz',
                title: 'İlkelerimiz',
                body: (
                    <>
                        <UL
                            items={[
                                <><strong>Şeffaf fiyat.</strong> Kursun fiyatını eğitmen belirler. Gösterilen tutar ödenen tutardır; ödeme adımında sürpriz kalem çıkmaz.</>,
                                <><strong>Kalıcı erişim.</strong> Satın alınan kurs süreli değildir. Eğitmen kursu güncellerse öğrenci güncellemelere ek ücret ödemeden erişir.</>,
                                <><strong>İçerik eğitmene aittir.</strong> Eğitmen içeriğinin haklarını korur; platform içeriği yalnızca yayınlamak ve tanıtmak için kullanır.</>,
                                <><strong>Ölçülü iletişim.</strong> Pazarlama e-postası göndermiyoruz. Gönderdiğimiz e-postalar satın alma, doğrulama, mesaj ve duyurudan ibarettir; hesap ayarlarından kapatılabilir.</>,
                                <><strong>Veri en azı.</strong> Yalnızca hizmeti sunmak için gereken veriyi topluyoruz. Ayrıntılar <Link to="/privacy" className="text-brand-700 hover:underline">gizlilik politikasında</Link>.</>,
                            ]}
                        />
                    </>
                ),
            },
            {
                id: 'teknik',
                title: 'Altyapı',
                body: (
                    <>
                        <P>
                            Ders videoları ve dosyalar, herkese kapalı depolama alanlarında tutulur.
                            İçeriğe yalnızca erişim hakkı olan kullanıcılar, süreli imzalı bağlantılar
                            üzerinden ulaşır; dosya adresleri paylaşılabilir sabit bağlantılar değildir.
                        </P>
                        <P>
                            Video dağıtımı içerik dağıtım ağı üzerinden yapılır, böylece izleme
                            deneyimi bağlantı hızına göre uyum sağlar. Ödemeler 3D Secure destekli
                            ödeme altyapısı üzerinden alınır; kart bilgileri sistemimizde saklanmaz.
                        </P>
                        <Note>
                            Güvenlikle ilgili bir açık fark ederseniz{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasından</Link>{' '}
                            bize bildirin. Bildirimleri ciddiye alıyor ve en kısa sürede dönüş yapıyoruz.
                        </Note>
                    </>
                ),
            },
            {
                id: 'iletisim',
                title: 'Bize ulaşın',
                body: (
                    <>
                        <P>
                            Soru, öneri, iş birliği veya şikâyet için{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasını</Link>{' '}
                            kullanabilirsiniz. Sık sorulan konular için önce{' '}
                            <Link to="/help" className="text-brand-700 hover:underline">yardım merkezine</Link>{' '}
                            bakmanız daha hızlı sonuç verir.
                        </P>
                        <P>
                            Eğitmen olmakla ilgileniyorsanız{' '}
                            <Link to="/become-instructor" className="text-brand-700 hover:underline">eğitmen sayfasında</Link>{' '}
                            sürecin tamamı ve kazanç modeli anlatılıyor.
                        </P>
                    </>
                ),
            },
        ]}
    />
);

export default About;

import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout, { P, UL, H3, Note, Table, Stats } from '@/components/content/PageLayout';

/**
 * Fiyatlandırma.
 *
 * Önemli: Edurce'de abonelik yok. Bu sayfa daha önce var olmayan aylık/yıllık
 * paketleri anlatıyordu; platformun gerçek modeli olan tek seferlik satın alma,
 * gelir paylaşımı ve Edurce Kredi'ye göre yeniden yazıldı.
 */
const Pricing: React.FC = () => (
    <PageLayout
        title="Fiyatlandırma"
        lead="Edurce'de abonelik yoktur. Her kurs ayrı satılır, bir kez ödenir ve süresiz erişilir."
        seo={{
            title: 'Fiyatlandırma | Edurce',
            description: 'Edurce kurs fiyatları nasıl belirlenir, ne ödenir, iade nasıl işler, Edurce Kredi ile ne kadar indirim alınır ve eğitmen ne kazanır?',
            canonical: 'https://edurce.com/pricing',
        }}
        sections={[
            {
                id: 'model',
                title: 'Ödeme modeli',
                body: (
                    <>
                        <P lead>
                            Edurce'de aylık ya da yıllık paket yoktur. İlgilendiğiniz kursu satın
                            alırsınız, o kursa süresiz erişirsiniz. Otomatik yenilenen bir ödeme,
                            iptal edilmesi gereken bir üyelik veya kullanılmadığında boşa giden bir
                            aidat söz konusu değildir.
                        </P>
                        <Stats
                            items={[
                                { value: 'Tek ödeme', label: 'Abonelik ve otomatik yenileme yok' },
                                { value: 'Süresiz', label: 'Erişim hesabınız açık olduğu sürece' },
                                { value: '0 ₺', label: 'Sertifika ve ders kaynakları için ek ücret' },
                            ]}
                        />
                        <UL
                            items={[
                                <><strong>Tek seferlik ödeme.</strong> Kursun fiyatını bir kez ödersiniz.</>,
                                <><strong>Süresiz erişim.</strong> Erişiminiz sona ermez; hesabınız açık olduğu sürece kurs Eğitimlerim sayfanızda kalır.</>,
                                <><strong>Ücretsiz güncellemeler.</strong> Eğitmen kursa yeni ders eklerse veya içeriği yenilerse ek ücret ödemezsiniz.</>,
                                <><strong>Ek ücret yok.</strong> Sertifika, ders kaynakları, soru-cevap ve eğitmene mesaj kurs fiyatına dahildir.</>,
                            ]}
                        />
                        <P>
                            Ödemeyi kredi veya banka kartıyla yaparsınız. Ödeme adımı 3D Secure ile
                            korunur ve kart bilgileriniz Edurce sistemlerinde saklanmaz.
                        </P>
                    </>
                ),
            },
            {
                id: 'fiyat-nasil-belirlenir',
                title: 'Fiyat nasıl belirlenir',
                body: (
                    <>
                        <P>
                            Bir kursun fiyatını o kursun eğitmeni belirler. Platform eğitmene fiyat
                            dayatmaz. Bu nedenle aynı konuda farklı fiyatlarda kurslar bulabilir,
                            karşılaştırarak seçim yapabilirsiniz.
                        </P>
                        <P>
                            Eğitmen fiyatı sonradan değiştirebilir veya kursu indirime alabilir.
                            Sizin için geçerli olan fiyat, ödeme ekranında onayladığınız tutardır.
                            Sonraki fiyat değişiklikleri geçmiş satın almalarınızı etkilemez; kursu
                            aldıktan sonra fiyat düşerse fark iadesi yapılmaz, fiyat artarsa sizden
                            ek ödeme istenmez.
                        </P>
                        <P>
                            Kurs kartında ve kurs sayfasında gördüğünüz tutar, ödeyeceğiniz toplam
                            tutardır. Ödeme adımında hizmet bedeli, işlem ücreti gibi ek kalemler
                            eklenmez.
                        </P>
                    </>
                ),
            },
            {
                id: 'edurce-kredi',
                title: 'Edurce Kredi ile indirim',
                body: (
                    <>
                        <P>
                            Platformda geçirdiğiniz zaman karşılığında Edurce Kredi kazanırsınız.
                            Ders tamamlamak, kurs bitirmek, değerlendirme yazmak, soru sormak,
                            günlük giriş yapmak ve alışveriş yapmak kredi kazandırır. Krediyi kurs
                            alırken indirim olarak kullanırsınız.
                        </P>
                        <P>
                            Kredinin lira karşılığı seviyenize göre değişir. Seviye, hayat boyu
                            kazandığınız toplam krediye göre belirlenir ve kredi harcadığınızda
                            düşmez. Seviye yükseldikçe hem daha hızlı kredi kazanır hem de aynı
                            kredi daha çok değer eder:
                        </P>
                        <Table
                            head={['Seviye', 'Toplam kazanç', 'Kazanç katsayısı', '1.000 kredinin değeri']}
                            rows={[
                                ['Bronz', '0+', '×1,00', '10,00 ₺'],
                                ['Gümüş', '2.000+', '×1,15', '11,11 ₺'],
                                ['Altın', '6.000+', '×1,30', '12,50 ₺'],
                                ['Platin', '15.000+', '×1,50', '14,29 ₺'],
                                ['Elmas', '40.000+', '×1,75', '16,67 ₺'],
                            ]}
                            emphasizeLast
                        />
                        <P>
                            Bir siparişin en fazla yarısı krediyle ödenebilir; kalan tutarı kartla
                            ödersiniz. Kredinin nakit karşılığı yoktur, banka hesabına aktarılamaz
                            ve başka bir kullanıcıya devredilemez.
                        </P>
                        <Note>
                            Güncel bakiyenizi, seviyenizi ve bir sonraki seviyeye ne kadar
                            kaldığını{' '}
                            <Link to="/home/gamification" className="text-brand-700 hover:underline">
                                Edurce Kredi sayfasından
                            </Link>{' '}
                            görebilirsiniz.
                        </Note>
                    </>
                ),
            },
            {
                id: 'iade',
                title: 'İade koşulları',
                body: (
                    <>
                        <P>
                            Dijital içerikte cayma hakkı mevzuat gereği sınırlıdır; buna rağmen
                            aşağıdaki durumlarda iade talebinizi değerlendiriyoruz:
                        </P>
                        <UL
                            items={[
                                'Satın almadan sonraki 14 gün içinde ve kursun %20\'sinden azını izlemişken talep etmeniz,',
                                'Kursun tanıtımında anlatılanla içeriğin belirgin biçimde uyuşmaması,',
                                'Teknik bir arıza nedeniyle içeriğe erişememeniz ve sorunun giderilememesi,',
                                'Aynı kursu yanlışlıkla iki kez satın almanız.',
                            ]}
                        />
                        <P>
                            Kursu büyük ölçüde izledikten, ders kaynaklarını indirdikten veya
                            sertifika aldıktan sonra yapılan iade talepleri kabul edilmez. Onaylanan
                            iadeler, ödemenin yapıldığı karta 14 gün içinde yansır; bankaya bağlı
                            olarak yansıma birkaç gün sürebilir.
                        </P>
                        <P>
                            İade edilen bir satın almada kullandığınız kredi hesabınıza geri
                            yüklenir, o satın almadan kazandığınız kredi ise geri alınır.
                        </P>
                        <P>
                            İade talebinizi{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasından</Link>{' '}
                            "İade talebi" konusuyla iletebilirsiniz. Tam metin için{' '}
                            <Link to="/terms" className="text-brand-700 hover:underline">kullanım şartlarına</Link>{' '}
                            bakabilirsiniz.
                        </P>
                    </>
                ),
            },
            {
                id: 'egitmen',
                title: 'Eğitmenler için',
                body: (
                    <>
                        <H3>Ne ödersiniz</H3>
                        <P>
                            Hiçbir şey. Eğitmen olmak, kurs oluşturmak, video yüklemek ve kursu
                            yayınlamak ücretsizdir. Aylık ücret, listeleme ücreti veya yükleme
                            kotası yoktur. Platform yalnızca satış gerçekleştiğinde pay alır.
                        </P>

                        <H3>Ne kazanırsınız</H3>
                        <P>
                            Brüt satış tutarından önce yasal vergi (%20) düşülür. Kalan tutarın
                            %55'i eğitmene, %45'i platforma aittir.
                        </P>
                        <Stats
                            items={[
                                { value: '0 ₺', label: 'Kurs açma, video yükleme ve yayınlama' },
                                { value: '%55', label: 'Vergi sonrası tutardan eğitmen payı' },
                                { value: '440 ₺', label: '1.000 ₺\'lik satışta eline geçen' },
                            ]}
                        />
                        <Table
                            head={['Kalem', 'Oran', '1.000 ₺ satışta']}
                            rows={[
                                ['Brüt satış', '—', '1.000,00 ₺'],
                                ['Yasal vergi', '%20', '−200,00 ₺'],
                                ['Platform payı', 'Net tutarın %45\'i', '−360,00 ₺'],
                                ['Eğitmenin kazancı', 'Net tutarın %55\'i', '440,00 ₺'],
                            ]}
                            emphasizeLast
                        />
                        <P>
                            Platform payı; barındırma, video işleme, dağıtım ağı, ödeme altyapısı
                            ve destek maliyetlerini karşılar. Bunun dışında gizli kesinti yoktur.
                            Her satışın dökümünü eğitmen panelindeki satış raporunda kalem kalem
                            görebilirsiniz.
                        </P>

                        <H3>Ödeme ne zaman yapılır</H3>
                        <P>
                            Ödeme gününü eğitmen panelindeki ödeme ayarlarından siz seçersiniz.
                            Ödeme yapılabilmesi için IBAN ve kimlik bilgilerinizin eksiksiz olması
                            gerekir. İade edilen satışların tutarı hakedişinizden düşülür.
                        </P>
                        <Note>
                            Süreç ve gereklilikler{' '}
                            <Link to="/become-instructor" className="text-brand-700 hover:underline">
                                eğitmen sayfasında
                            </Link>{' '}
                            ayrıntılı anlatılıyor.
                        </Note>
                    </>
                ),
            },
            {
                id: 'sorular',
                title: 'Sık sorulanlar',
                body: (
                    <>
                        <H3>Ücretsiz kurs var mı?</H3>
                        <P>
                            Eğitmen isterse kursunu ücretsiz yayınlayabilir. Ücretsiz kurslara
                            ödeme yapmadan kaydolur, ücretli kurslardaki tüm özelliklerden
                            yararlanırsınız.
                        </P>

                        <H3>Ödemeyi taksitlendirebilir miyim?</H3>
                        <P>
                            Taksit imkânı kartınızın bankasına ve tutara bağlıdır; ödeme adımında
                            uygunsa seçenek olarak görünür. Edurce ayrıca vade farkı uygulamaz.
                        </P>

                        <H3>Fatura alabilir miyim?</H3>
                        <P>
                            Evet. Satın alma sonrası faturanız e-postanıza gönderilir; geçmiş
                            faturalarınıza{' '}
                            <Link to="/home/settings/history" className="text-brand-700 hover:underline">
                                satın alma geçmişinden
                            </Link>{' '}
                            de ulaşabilirsiniz. Kurumsal fatura için ödeme öncesi bilgilerinizi
                            fatura ayarlarına girmeniz gerekir.
                        </P>

                        <H3>Kurumsal / toplu alım yapıyor musunuz?</H3>
                        <P>
                            Ekipler için toplu alım taleplerini tek tek değerlendiriyoruz. Kaç
                            kişilik bir ekip için hangi kursları düşündüğünüzü{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasından</Link>{' '}
                            yazarsanız size dönüş yaparız.
                        </P>
                    </>
                ),
            },
        ]}
    />
);

export default Pricing;

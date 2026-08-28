import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout, { P, UL, H3, Note, Table } from '@/components/content/PageLayout';

const UPDATED = '17 Ağustos 2026';

/**
 * Kullanım şartları.
 *
 * Metin platformun gerçek işleyişine göre yazıldı (tek seferlik satın alma,
 * süresiz erişim, kursun niteliğine göre %70/%55 eğitmen payı, kredi programı).
 * Genel geçer şablon cümleler yerine burada gerçekten geçerli olan kurallar var.
 */
const Terms: React.FC = () => (
    <PageLayout
        title="Kullanım Şartları"
        lead="Bu şartlar, Edurce'yi kullanan herkes için geçerlidir. Hesap açarak veya kurs satın alarak bu şartları kabul etmiş olursunuz."
        updatedAt={UPDATED}
        seo={{
            title: 'Kullanım Şartları | Edurce',
            description: 'Edurce kullanım şartları: hesap kuralları, satın alma ve iade, eğitmen yükümlülükleri, içerik hakları ve sorumluluk sınırları.',
            canonical: 'https://edurce.com/terms',
        }}
        sections={[
            {
                id: 'taraflar',
                title: 'Taraflar ve kapsam',
                body: (
                    <>
                        <P>
                            Bu sözleşme, Edurce platformunu işleten taraf ("Edurce", "biz") ile
                            platformu kullanan gerçek veya tüzel kişi ("kullanıcı", "siz") arasındadır.
                        </P>
                        <P>
                            Platformda iki tür kullanıcı vardır: kurs satın alıp izleyen
                            <strong> öğrenciler</strong> ve kurs hazırlayıp yayınlayan
                            <strong> eğitmenler</strong>. Bir kullanıcı aynı anda her ikisi de olabilir.
                            Bazı maddeler yalnızca eğitmenler için geçerlidir ve açıkça belirtilmiştir.
                        </P>
                        <P>
                            Edurce, eğitmenlerle öğrencileri buluşturan bir aracıdır. Kurs içeriğini
                            Edurce üretmez; içerik eğitmene aittir ve sorumluluğu eğitmendedir.
                        </P>
                    </>
                ),
            },
            {
                id: 'hesap',
                title: 'Hesap açma ve kullanım',
                body: (
                    <>
                        <P>
                            Hesap açmak için geçerli bir e-posta adresi gerekir ve adres doğrulama
                            koduyla teyit edilir. Google, Facebook veya Apple hesabıyla da giriş
                            yapılabilir; bu durumda ilgili sağlayıcıdan yalnızca ad ve e-posta bilgisi
                            alınır.
                        </P>
                        <P>
                            18 yaşından küçükseniz platformu ancak veli veya vasinizin izniyle
                            kullanabilirsiniz.
                        </P>
                        <H3>Sizin sorumluluğunuz</H3>
                        <UL
                            items={[
                                'Kayıt sırasında verdiğiniz bilgilerin doğru olması.',
                                'Hesap parolanızı gizli tutmak ve başkasıyla paylaşmamak.',
                                'Hesabınızdan yapılan tüm işlemler — yetkisiz bir erişim fark ederseniz derhal bize bildirin.',
                                'Aynı hesabı birden fazla kişiyle paylaşmamak.',
                            ]}
                        />
                        <P>
                            Bir hesabın çok sayıda kişi tarafından paylaşıldığını tespit edersek
                            hesabı askıya alabiliriz.
                        </P>
                    </>
                ),
            },
            {
                id: 'satin-alma',
                title: 'Satın alma ve ödeme',
                body: (
                    <>
                        <P>
                            Kurslar tek seferlik ödemeyle satın alınır; otomatik yenilenen bir
                            abonelik yoktur. Satın alınan kursa süresiz erişirsiniz. Eğitmen kursu
                            güncellerse güncellemelere ek ücret ödemeden erişirsiniz.
                        </P>
                        <P>
                            Kursun fiyatını eğitmen belirler ve değiştirebilir. Sizin için geçerli
                            olan fiyat, satın alma anında ödeme ekranında gösterilen tutardır. Sonradan
                            yapılan fiyat değişiklikleri geçmiş satın almaları etkilemez.
                        </P>
                        <P>
                            Ödemeler 3D Secure destekli ödeme altyapısı üzerinden alınır. Kart
                            bilgileriniz Edurce sistemlerinde saklanmaz.
                        </P>
                        <H3>Erişimin başlaması</H3>
                        <P>
                            Ödeme onaylandığı anda kurs Eğitimlerim sayfanıza eklenir. Ödeme
                            onaylanmadıysa erişim açılmaz; bankanızdan provizyon görünüyor olsa dahi
                            tutar tahsil edilmemiştir.
                        </P>
                    </>
                ),
            },
            {
                id: 'iade',
                title: 'Cayma hakkı ve iade',
                body: (
                    <>
                        <P>
                            Dijital içerik satışlarında, içerik anında erişime açıldığı için mesafeli
                            sözleşmelere ilişkin mevzuat uyarınca cayma hakkı sınırlıdır. Buna rağmen
                            aşağıdaki durumlarda iade talebinizi değerlendiriyoruz:
                        </P>
                        <UL
                            items={[
                                'Kursun tanıtımında belirtilen içerikle gerçek içeriğin belirgin biçimde uyuşmaması.',
                                'Teknik bir arıza nedeniyle kursa erişememeniz ve sorunun makul sürede çözülememesi.',
                                'Yanlışlıkla aynı kursu iki kez satın almanız.',
                                'Satın almadan sonraki 14 gün içinde ve kursun %20\'sinden azını izlemiş olmanız.',
                            ]}
                        />
                        <P>
                            Talebinizi{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasından</Link>{' '}
                            iletebilirsiniz. Onaylanan iadeler ödeme yaptığınız yönteme yapılır ve
                            bankanıza bağlı olarak hesabınıza geçmesi birkaç iş günü sürebilir.
                            İade edilen kursa erişiminiz sonlandırılır.
                        </P>
                        <Note>
                            İade işlemi tamamlandığında, o satın almadan kazandığınız Edurce Kredi de
                            geri alınır.
                        </Note>
                    </>
                ),
            },
            {
                id: 'kredi',
                title: 'Edurce Kredi',
                body: (
                    <>
                        <P>
                            Edurce Kredi, platformda geçirdiğiniz zamanın karşılığı olarak kazandığınız
                            ve kurs alırken indirim olarak kullanabildiğiniz bir sadakat programıdır.
                        </P>
                        <UL
                            items={[
                                'Kredinin nakit karşılığı yoktur; paraya çevrilemez, banka hesabına aktarılamaz.',
                                'Krediler başka bir kullanıcıya devredilemez.',
                                'Bir siparişin en fazla %50\'si krediyle ödenebilir.',
                                'Kredi kazanma kuralları ve seviye eşikleri önceden bildirilerek değiştirilebilir.',
                                'Hesabın kapatılması durumunda birikmiş krediler silinir.',
                            ]}
                        />
                        <P>
                            Sistemi yanıltarak kredi biriktirdiği tespit edilen hesapların kredileri
                            iptal edilir.
                        </P>
                    </>
                ),
            },
            {
                id: 'kullanim-kurallari',
                title: 'Yasak kullanım',
                body: (
                    <>
                        <P>Platformu kullanırken aşağıdakileri yapamazsınız:</P>
                        <UL
                            items={[
                                'Kurs içeriğini indirmek, kaydetmek, çoğaltmak veya üçüncü kişilerle paylaşmak.',
                                'İçeriği başka bir platformda yeniden yayınlamak veya satmak.',
                                'Hesap bilgilerinizi paylaşarak başkalarının erişimini sağlamak.',
                                'Platformun teknik korumalarını aşmaya çalışmak, tersine mühendislik yapmak.',
                                'Otomatik araçlarla toplu veri çekmek veya sisteme aşırı yük bindirmek.',
                                'Başka kullanıcıları taciz etmek, hakaret içeren mesaj veya yorum yazmak.',
                                'Yanıltıcı, sahte veya spam nitelikli içerik ve değerlendirme göndermek.',
                            ]}
                        />
                        <P>
                            Bu kuralların ihlali hâlinde içeriği kaldırabilir, hesabı askıya alabilir
                            veya kapatabiliriz. Ağır ihlallerde yasal yollara başvurma hakkımız saklıdır.
                        </P>
                    </>
                ),
            },
            {
                id: 'egitmen',
                title: 'Eğitmen yükümlülükleri',
                body: (
                    <>
                        <P><strong>Bu bölüm yalnızca eğitmenler için geçerlidir.</strong></P>
                        <H3>İçerik sorumluluğu</H3>
                        <UL
                            items={[
                                'Yayınladığınız içeriğin size ait olduğunu veya yayınlama hakkına sahip olduğunuzu taahhüt edersiniz.',
                                'Üçüncü kişilere ait müzik, görsel, video veya metin kullanıyorsanız gerekli izinleri almış olmalısınız.',
                                'Kurs tanıtımında verdiğiniz bilgiler (süre, kapsam, seviye) gerçeği yansıtmalıdır.',
                                'Öğrenci sorularına makul sürede yanıt vermeye çalışmalısınız.',
                            ]}
                        />
                        <P>
                            Telif ihlali bildirimi aldığımızda içeriği geçici olarak yayından
                            kaldırır ve size bildiririz. İtiraz hakkınız vardır.
                        </P>

                        <H3>Gelir paylaşımı ve ödeme</H3>
                        <P>
                            Eğitmen payı kursun niteliğine göre belirlenir:
                        </P>
                        <Table
                            head={['Kursun durumu', 'Eğitmen payı', '1.000 ₺ satışta']}
                            rows={[
                                ['Yalnızca Edurce\'de yayınlanan özgün kurs', '%70', '700,00 ₺'],
                                ['Başka platformlarda da yayınlanan kurs', '%55', '550,00 ₺'],
                                ['Eğitmenin kendi kupon koduyla gelen satış', '%100', '1.000,00 ₺'],
                            ]}
                        />
                        <P>
                            Kursunuzu yalnızca Edurce'de yayınladığınızı beyan eder ve sonradan
                            başka bir platformda yayınlarsanız, o tarihten sonraki satışlara %55
                            oranı uygulanır. Kendi oluşturduğunuz kupon koduyla gelen satışlarda
                            platform pay almaz.
                        </P>
                        <P>
                            Ödemeler, eğitmen panelinde belirttiğiniz IBAN'a ve seçtiğiniz ödeme
                            gününde yapılır. Ödeme yapılabilmesi için hesap bilgilerinizin eksiksiz
                            ve doğru olması gerekir.
                        </P>
                        <P>
                            İade edilen bir satışın eğitmen payı, sonraki ödeme döneminde bakiyenizden
                            mahsup edilir.
                        </P>

                        <H3>İçerik hakları</H3>
                        <P>
                            İçeriğinizin tüm hakları sizde kalır. Edurce'ye yalnızca içeriği platformda
                            barındırmak, öğrencilere sunmak ve platformu tanıtmak amacıyla kullanma
                            lisansı vermiş olursunuz. Kursunuzu yayından kaldırırsanız bu lisans sona
                            erer; ancak kursu daha önce satın almış öğrencilerin erişimi devam eder.
                        </P>
                    </>
                ),
            },
            {
                id: 'hizmet',
                title: 'Hizmetin sürekliliği',
                body: (
                    <>
                        <P>
                            Platformu kesintisiz çalıştırmak için makul çabayı gösteriyoruz ancak
                            kesintisiz erişim garantisi vermiyoruz. Bakım, güncelleme veya
                            beklenmedik arızalar nedeniyle geçici kesintiler olabilir. Planlı
                            bakımları önceden duyurmaya çalışırız.
                        </P>
                        <P>
                            Platformun özelliklerini geliştirebilir, değiştirebilir veya
                            kaldırabiliriz. Satın aldığınız kursa erişiminizi ortadan kaldıracak
                            değişiklikleri önceden bildiririz.
                        </P>
                    </>
                ),
            },
            {
                id: 'sorumluluk',
                title: 'Sorumluluğun sınırı',
                body: (
                    <>
                        <P>
                            Kurs içeriğinin doğruluğu, güncelliği ve size uygunluğu konusunda garanti
                            vermiyoruz. İçerik eğitmene aittir; eğitim amaçlıdır ve profesyonel
                            danışmanlık yerine geçmez.
                        </P>
                        <P>
                            Bir kursu izleyerek belirli bir sonuca (iş bulma, gelir elde etme,
                            sınav başarısı) ulaşacağınıza dair taahhütte bulunmuyoruz.
                        </P>
                        <P>
                            Edurce'nin sorumluluğu, her hâlükârda ilgili işlem için ödediğiniz tutarla
                            sınırlıdır. Dolaylı zararlardan, kâr kaybından veya veri kaybından
                            sorumlu değiliz. Bu sınırlama, tüketici mevzuatının emredici hükümlerini
                            ortadan kaldırmaz.
                        </P>
                    </>
                ),
            },
            {
                id: 'fesih',
                title: 'Hesabın kapatılması',
                body: (
                    <>
                        <P>
                            Hesabınızı dilediğiniz zaman ayarlar sayfasından kapatabilirsiniz.
                            Hesap kapatıldığında satın aldığınız kurslara erişiminiz sona erer ve
                            birikmiş krediler silinir; bu işlem geri alınamaz.
                        </P>
                        <P>
                            Bu şartların ihlali hâlinde hesabınızı askıya alabilir veya
                            kapatabiliriz. Bu durumda, ihlalle ilgisi olmayan satın almalarınız için
                            iade talebinde bulunabilirsiniz.
                        </P>
                        <P>
                            Hesap kapatıldıktan sonra verilerinizin ne kadar süre saklandığı{' '}
                            <Link to="/privacy" className="text-brand-700 hover:underline">gizlilik politikasında</Link>{' '}
                            açıklanmıştır.
                        </P>
                    </>
                ),
            },
            {
                id: 'degisiklik',
                title: 'Şartlarda değişiklik',
                body: (
                    <>
                        <P>
                            Bu şartları güncelleyebiliriz. Önemli değişiklikleri yürürlüğe girmeden
                            en az 15 gün önce e-posta ile veya platform üzerinden bildiririz.
                            Değişiklikten sonra platformu kullanmaya devam etmeniz yeni şartları
                            kabul ettiğiniz anlamına gelir.
                        </P>
                        <P>
                            Sayfanın başındaki yürürlük tarihi, metnin en son ne zaman güncellendiğini
                            gösterir.
                        </P>
                    </>
                ),
            },
            {
                id: 'uygulanacak-hukuk',
                title: 'Uygulanacak hukuk ve uyuşmazlık',
                body: (
                    <>
                        <P>
                            Bu sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır. Uyuşmazlıklarda
                            Türkiye Cumhuriyeti mahkemeleri ve icra daireleri yetkilidir.
                        </P>
                        <P>
                            Tüketici sıfatıyla, parasal sınırlar dâhilinde bulunduğunuz yerdeki
                            Tüketici Hakem Heyetine veya Tüketici Mahkemesine başvurma hakkınız saklıdır.
                        </P>
                        <P>
                            Her türlü soru ve talebiniz için önce{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">bizimle iletişime geçmenizi</Link>{' '}
                            rica ederiz; sorunların çoğu bu aşamada çözülüyor.
                        </P>
                    </>
                ),
            },
        ]}
    />
);

export default Terms;

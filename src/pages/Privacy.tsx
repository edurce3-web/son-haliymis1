import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout, { P, UL, H3, Note, Table } from '@/components/content/PageLayout';

const UPDATED = '17 Ağustos 2026';

/**
 * Gizlilik politikası.
 *
 * KVKK (6698) yapısına göre yazıldı: hangi veri, hangi amaçla, hangi hukuki
 * sebeple işleniyor; kime aktarılıyor; ne kadar saklanıyor; hangi haklar var.
 * İçerik platformun gerçek altyapısına dayanıyor — genel şablon değil.
 */
const Privacy: React.FC = () => (
    <PageLayout
        title="Gizlilik Politikası"
        lead="Hangi verilerinizi neden işlediğimizi, kimlerle paylaştığımızı ve haklarınızı bu sayfada açıkça anlatıyoruz."
        updatedAt={UPDATED}
        seo={{
            title: 'Gizlilik Politikası | Edurce',
            description: 'Edurce hangi kişisel verileri işler, ne kadar saklar, kimlerle paylaşır? KVKK kapsamındaki haklarınız ve başvuru yolu.',
            canonical: 'https://edurce.com/privacy',
        }}
        sections={[
            {
                id: 'genel',
                title: 'Genel bakış',
                body: (
                    <>
                        <P>
                            Edurce olarak yalnızca hizmeti sunmak için gereken veriyi topluyoruz.
                            Kişisel verilerinizi satmıyoruz, reklam amacıyla üçüncü taraflarla
                            paylaşmıyoruz ve pazarlama e-postası göndermiyoruz.
                        </P>
                        <P>
                            Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
                            kapsamında hazırlanmıştır ve platformu kullanan herkes için geçerlidir.
                        </P>
                    </>
                ),
            },
            {
                id: 'toplanan-veriler',
                title: 'Topladığımız veriler',
                body: (
                    <>
                        <H3>Siz verdiğiniz için</H3>
                        <UL
                            items={[
                                <><strong>Hesap bilgileri:</strong> ad, soyad, e-posta adresi, parolanızın şifrelenmiş özeti.</>,
                                <><strong>Profil bilgileri (isteğe bağlı):</strong> profil fotoğrafı, biyografi, web sitesi adresi.</>,
                                <><strong>Eğitmen bilgileri:</strong> uzmanlık alanları, unvan ve ödeme için IBAN, ad-soyad, iletişim bilgisi.</>,
                                <><strong>İletişim mesajları:</strong> iletişim formundan gönderdiğiniz ad, e-posta, telefon ve mesaj içeriği.</>,
                                <><strong>İçerik:</strong> yazdığınız değerlendirmeler, sorular, cevaplar ve mesajlar.</>,
                            ]}
                        />

                        <H3>Kullanım sırasında oluşan</H3>
                        <UL
                            items={[
                                <><strong>Öğrenme verisi:</strong> hangi kursa kayıtlısınız, hangi dersleri tamamladınız, ilerleme yüzdeniz.</>,
                                <><strong>İşlem verisi:</strong> satın alma kaydı, tutar, tarih, sipariş numarası.</>,
                                <><strong>Kredi hareketleri:</strong> kazandığınız ve harcadığınız Edurce Kredi kayıtları.</>,
                                <><strong>Teknik veri:</strong> IP adresi, tarayıcı ve cihaz bilgisi, hata kayıtları.</>,
                            ]}
                        />

                        <H3>Üçüncü taraflardan</H3>
                        <P>
                            Google, Facebook veya Apple hesabıyla giriş yaparsanız ilgili sağlayıcıdan
                            yalnızca <strong>ad, soyad ve e-posta adresi</strong> alınır. Sosyal medya
                            hesabınıza erişmiyor, paylaşımlarınızı okumuyoruz.
                        </P>

                        <Note>
                            <strong>Kart bilgilerinizi hiçbir zaman görmüyor ve saklamıyoruz.</strong>{' '}
                            Ödeme adımı, ödeme kuruluşunun kendi güvenli sayfasında tamamlanır;
                            bize yalnızca işlemin başarılı olup olmadığı bilgisi döner.
                        </Note>
                    </>
                ),
            },
            {
                id: 'amac',
                title: 'İşleme amaçları ve hukuki sebep',
                body: (
                    <>
                        <Table
                            head={['Veri', 'Amaç', 'Hukuki sebep']}
                            rows={[
                                ['Hesap bilgileri', 'Hesabı oluşturmak, girişi sağlamak, kimliği doğrulamak', 'Sözleşmenin kurulması ve ifası'],
                                ['Öğrenme verisi', 'İlerlemeyi kaydetmek, kaldığınız yerden devam ettirmek, sertifika üretmek', 'Sözleşmenin ifası'],
                                ['İşlem verisi', 'Satın almayı gerçekleştirmek, fatura ve muhasebe yükümlülüğü', 'Kanuni yükümlülük'],
                                ['İletişim mesajları', 'Talebinizi yanıtlamak', 'Meşru menfaat'],
                                ['Teknik veri', 'Güvenlik, kötüye kullanımı önleme, hataları gidermek', 'Meşru menfaat'],
                                ['E-posta adresi', 'Doğrulama, satın alma onayı, mesaj ve duyuru bildirimi', 'Sözleşmenin ifası / açık rıza'],
                                ['Eğitmen IBAN bilgisi', 'Hakedişi ödemek', 'Sözleşmenin ifası'],
                            ]}
                        />
                        <P>
                            Duyuru, yeni mesaj ve satış bildirimi e-postalarını{' '}
                            <Link to="/home/settings/notifications" className="text-brand-700 hover:underline">
                                bildirim ayarlarından
                            </Link>{' '}
                            kapatabilirsiniz. Doğrulama, parola değişikliği ve satın alma onayı
                            e-postaları işlemsel olduğu için kapatılamaz.
                        </P>
                    </>
                ),
            },
            {
                id: 'paylasim',
                title: 'Verilerin paylaşımı',
                body: (
                    <>
                        <P>
                            Kişisel verilerinizi satmıyoruz. Yalnızca hizmeti sunabilmek için gereken
                            hizmet sağlayıcılarla, gerektiği kadarıyla paylaşıyoruz:
                        </P>
                        <Table
                            head={['Kim', 'Ne için', 'Hangi veri']}
                            rows={[
                                ['Sunucu ve veritabanı sağlayıcısı', 'Platformun çalışması', 'Tüm hesap ve işlem verisi'],
                                ['Depolama sağlayıcısı', 'Video, görsel ve dosyaların saklanması', 'Yüklediğiniz dosyalar'],
                                ['İçerik dağıtım ağı', 'Video yayını', 'Video dosyaları, IP adresi'],
                                ['E-posta sağlayıcısı', 'Bildirim ve doğrulama e-postaları', 'Ad, e-posta adresi'],
                                ['Ödeme kuruluşu', 'Tahsilat ve iade', 'Ad, e-posta, tutar (kart bilgisi bize gelmez)'],
                            ]}
                        />
                        <P>
                            Bir kursa kaydolduğunuzda <strong>adınız ve profil fotoğrafınız</strong>{' '}
                            o kursun eğitmenine görünür. Yazdığınız değerlendirmeler adınızla birlikte
                            herkese açıktır.
                        </P>
                        <P>
                            Ayrıca yasal bir zorunluluk olduğunda (mahkeme kararı, resmî makam talebi)
                            veya bir hakkın tesisi için gerekli olduğunda verileri paylaşabiliriz.
                        </P>

                        <H3>Yurt dışına aktarım</H3>
                        <P>
                            Kullandığımız depolama ve e-posta hizmetlerinin sunucuları Avrupa
                            Birliği ülkelerinde bulunabilir. Bu durumda veriler KVKK'nın yurt dışına
                            aktarıma ilişkin hükümleri çerçevesinde, sağlayıcılarla yapılan
                            sözleşmelerdeki koruma taahhütleri altında aktarılır.
                        </P>
                    </>
                ),
            },
            {
                id: 'guvenlik',
                title: 'Verilerin güvenliği',
                body: (
                    <>
                        <UL
                            items={[
                                'Parolalar geri döndürülemez şekilde şifrelenerek saklanır; düz metin parolanızı biz de göremeyiz.',
                                'Site ve API trafiği HTTPS ile şifrelenir.',
                                'Ders videoları ve dosyalar herkese kapalı depolama alanlarında tutulur; erişim süreli imzalı bağlantılarla verilir.',
                                'Ödeme adımı 3D Secure ile korunur, kart verisi sistemimize hiç girmez.',
                                'Yönetimsel erişim yalnızca gereken kişilerle sınırlıdır.',
                            ]}
                        />
                        <P>
                            Buna rağmen internet üzerinden yapılan hiçbir aktarım %100 güvenli
                            değildir. Bir güvenlik açığı fark ederseniz lütfen{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">bize bildirin</Link>.
                        </P>
                    </>
                ),
            },
            {
                id: 'cerezler',
                title: 'Çerezler ve yerel depolama',
                body: (
                    <>
                        <P>
                            Reklam veya takip çerezi kullanmıyoruz. Üçüncü taraf analiz aracı
                            çalıştırmıyoruz.
                        </P>
                        <P>
                            Oturumunuzu açık tutmak için tarayıcınızın yerel depolamasında
                            (<code className="text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">localStorage</code>)
                            bir oturum jetonu ve temel profil bilgileriniz saklanır. Bunlar olmadan
                            her sayfa yenilemesinde tekrar giriş yapmanız gerekirdi.
                        </P>
                        <P>
                            Çıkış yaptığınızda bu veriler silinir. Tarayıcınızın site verilerini
                            temizleyerek de kaldırabilirsiniz.
                        </P>
                    </>
                ),
            },
            {
                id: 'saklama',
                title: 'Saklama süreleri',
                body: (
                    <>
                        <Table
                            head={['Veri türü', 'Saklama süresi']}
                            rows={[
                                ['Hesap ve profil bilgileri', 'Hesap açık olduğu sürece'],
                                ['Öğrenme ve ilerleme verisi', 'Hesap açık olduğu sürece'],
                                ['Satın alma ve fatura kayıtları', 'Vergi mevzuatı gereği 10 yıl'],
                                ['İletişim mesajları', 'Talep kapandıktan sonra 2 yıl'],
                                ['Teknik kayıtlar (log)', '12 ay'],
                                ['Doğrulama kodları', '10 dakika'],
                            ]}
                        />
                        <P>
                            Hesabınızı kapattığınızda profil ve öğrenme verileriniz silinir. Yasal
                            saklama yükümlülüğü bulunan satın alma kayıtları, kimliğinizle
                            ilişkilendirilmeyecek şekilde ilgili süre boyunca tutulur.
                        </P>
                    </>
                ),
            },
            {
                id: 'haklariniz',
                title: 'KVKK kapsamındaki haklarınız',
                body: (
                    <>
                        <P>KVKK'nın 11. maddesi uyarınca şu haklara sahipsiniz:</P>
                        <UL
                            items={[
                                'Kişisel verinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme.',
                                'İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.',
                                'Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme.',
                                'Eksik veya yanlış işlenmişse düzeltilmesini isteme.',
                                'Kanundaki şartlar çerçevesinde silinmesini veya yok edilmesini isteme.',
                                'Düzeltme ve silme işlemlerinin verilerin aktarıldığı taraflara bildirilmesini isteme.',
                                'Otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme.',
                                'Hukuka aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.',
                            ]}
                        />
                        <P>
                            Ad, soyad, biyografi ve profil fotoğrafınızı{' '}
                            <Link to="/home/settings/profile" className="text-brand-700 hover:underline">
                                profil ayarlarından
                            </Link>{' '}
                            kendiniz güncelleyebilir, hesabınızı{' '}
                            <Link to="/home/settings/close-account" className="text-brand-700 hover:underline">
                                hesap ayarlarından
                            </Link>{' '}
                            kapatabilirsiniz.
                        </P>
                    </>
                ),
            },
            {
                id: 'basvuru',
                title: 'Başvuru yolu',
                body: (
                    <>
                        <P>
                            Haklarınıza ilişkin taleplerinizi{' '}
                            <Link to="/contact" className="text-brand-700 hover:underline">iletişim sayfasından</Link>{' '}
                            "Kişisel veri talebi" konusuyla iletebilirsiniz. Başvurunuzu kimliğinizi
                            doğruladıktan sonra en geç <strong>30 gün</strong> içinde ücretsiz olarak
                            sonuçlandırırız.
                        </P>
                        <P>
                            Başvurunuzun reddedilmesi veya yanıtsız kalması hâlinde Kişisel Verileri
                            Koruma Kurulu'na şikâyette bulunma hakkınız saklıdır.
                        </P>
                    </>
                ),
            },
            {
                id: 'cocuklar',
                title: 'Çocukların verileri',
                body: (
                    <P>
                        Platform 18 yaş altındaki kullanıcılara yönelik değildir. 18 yaşından
                        küçükseniz platformu ancak veli veya vasinizin izniyle kullanabilirsiniz.
                        Velisinin izni olmadan hesap açmış bir çocuğa ait veri tespit edersek
                        gecikmeksizin sileriz.
                    </P>
                ),
            },
            {
                id: 'degisiklikler',
                title: 'Politikadaki değişiklikler',
                body: (
                    <P>
                        Bu politikayı güncelleyebiliriz. Önemli değişiklikleri e-posta ile veya
                        platform üzerinden bildiririz. Sayfanın başındaki yürürlük tarihi metnin
                        en son ne zaman güncellendiğini gösterir.
                    </P>
                ),
            },
        ]}
    />
);

export default Privacy;

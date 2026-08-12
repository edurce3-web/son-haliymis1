/**
 * OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME.
 *
 * Kaynak: backend/db/categories.js
 * Yeniden üretmek için: cd backend && node scripts/generate-frontend-categories.mjs
 *
 * Kategori ağacı neden burada da duruyor?
 *   Menü, yan çubuk ve kategori şeridi bu listeyi doğrudan kullanır; sunucudan
 *   gelen cevaba bakmaz. Böylece veritabanında ne kalırsa kalsın kullanıcı
 *   yalnızca bu listeyi görür. Sunucudan alınan tek şey kurs sayıları ve
 *   category_id eşlemesidir.
 */

export interface CategoryTreeChild {
    name: string;
    slug: string;
}

export interface CategoryTreeNode {
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
    children: CategoryTreeChild[];
}

export const CATEGORY_TREE: CategoryTreeNode[] = [
    {
        name: "Yazılım & Teknoloji",
        slug: "yazilim-teknoloji",
        icon: "Code2",
        description: "Web ve mobil geliştirmeden yapay zekâya, siber güvenlikten bulut sistemlerine kadar yazılım dünyasının tüm alanları.",
        children: [
        { name: "Web Geliştirme", slug: "web-gelistirme" },
        { name: "Mobil Uygulama Geliştirme", slug: "mobil-uygulama-gelistirme" },
        { name: "Veri Bilimi & Yapay Zeka", slug: "veri-bilimi-yapay-zeka" },
        { name: "Siber Güvenlik", slug: "siber-guvenlik" },
        { name: "Bulut Bilişim & DevOps", slug: "bulut-bilisim-devops" },
        { name: "Oyun Geliştirme", slug: "oyun-gelistirme" },
        { name: "Yazılım Kalitesi & Test", slug: "yazilim-kalitesi-test" },
        { name: "Veritabanı & Veri Mimarisi", slug: "veritabani-veri-mimarisi" },
        { name: "Blokzincir (Blockchain)", slug: "blokzincir" },
        { name: "Sistem & Ağ Programlama", slug: "sistem-ag-programlama" },
        { name: "Kodsuz Yazılım Geliştirme", slug: "kodsuz-yazilim-gelistirme" },
        ],
    },
    {
        name: "Mühendislik & Donanım",
        slug: "muhendislik-donanim",
        icon: "Cpu",
        description: "Elektronikten otomasyona, gömülü sistemlerden enerji ve imalata uzanan mühendislik disiplinleri.",
        children: [
        { name: "Elektrik & Elektronik Mühendisliği", slug: "elektrik-elektronik-muhendisligi" },
        { name: "Gömülü Sistemler & IoT", slug: "gomulu-sistemler-iot" },
        { name: "PCB & Devre Tasarımı", slug: "pcb-devre-tasarimi" },
        { name: "Ev & Bina Tesisatı", slug: "ev-bina-tesisati" },
        { name: "Otomasyon & PLC", slug: "otomasyon-plc" },
        { name: "Haberleşme & RF", slug: "haberlesme-rf" },
        { name: "Mühendislik Yazılımları", slug: "muhendislik-yazilimlari" },
        { name: "CAD/CAM & İmalat", slug: "cad-cam-imalat" },
        { name: "Termodinamik & Akışkanlar", slug: "termodinamik-akiskanlar" },
        { name: "Otomotiv & Savunma", slug: "otomotiv-savunma" },
        { name: "Enerji & Güç Sistemleri", slug: "enerji-guc-sistemleri" },
        { name: "Endüstri Mühendisliği", slug: "endustri-muhendisligi" },
        { name: "Biyomedikal & Sağlık Teknolojileri", slug: "biyomedikal-saglik-teknolojileri" },
        { name: "Kimya & Süreç Mühendisliği", slug: "kimya-surec-muhendisligi" },
        ],
    },
    {
        name: "Tasarım & Görsel Sanatlar",
        slug: "tasarim-gorsel-sanatlar",
        icon: "Palette",
        description: "Arayüz tasarımından 3D animasyona, grafik tasarımdan video prodüksiyona görsel üretimin her dalı.",
        children: [
        { name: "Web Tasarımı", slug: "web-tasarimi" },
        { name: "UI/UX Tasarımı", slug: "ui-ux-tasarimi" },
        { name: "Grafik Tasarım", slug: "grafik-tasarim" },
        { name: "3D Sanat & Animasyon", slug: "3d-sanat-animasyon" },
        { name: "Video Editleme & Prodüksiyon", slug: "video-editleme-produksiyon" },
        { name: "Oyun & Karakter Tasarımı", slug: "oyun-karakter-tasarimi" },
        { name: "Ürün Tasarımı", slug: "urun-tasarimi" },
        { name: "Tasarım Araçları", slug: "tasarim-araclari" },
        { name: "İç Mimarlık & Mekan", slug: "ic-mimarlik-mekan" },
        { name: "Moda & Tekstil", slug: "moda-tekstil" },
        ],
    },
    {
        name: "İş Dünyası, Yönetim & Finans",
        slug: "is-dunyasi-yonetim-finans",
        icon: "Briefcase",
        description: "Pazarlamadan muhasebeye, girişimcilikten proje yönetimine iş hayatının temel yetkinlikleri.",
        children: [
        { name: "Ekonomi", slug: "ekonomi" },
        { name: "SEO & İçerik Pazarlaması", slug: "seo-icerik-pazarlamasi" },
        { name: "Ürün & Proje Yönetimi", slug: "urun-proje-yonetimi" },
        { name: "Dijital Pazarlama & Büyüme", slug: "dijital-pazarlama-buyume" },
        { name: "Muhasebe & Defter Tutma", slug: "muhasebe-defter-tutma" },
        { name: "Borsa & Kripto Varlıklar", slug: "borsa-kripto-varliklar" },
        { name: "Uluslararası Ticaret & İhracat", slug: "uluslararasi-ticaret-ihracat" },
        { name: "Girişimcilik & Satış", slug: "girisimcilik-satis" },
        { name: "İnsan Kaynakları & Yetenek", slug: "insan-kaynaklari-yetenek" },
        { name: "İş Analizi & Lojistik", slug: "is-analizi-lojistik" },
        { name: "CRM & Operasyon Yönetimi", slug: "crm-operasyon-yonetimi" },
        { name: "Strateji & Danışmanlık", slug: "strateji-danismanlik" },
        { name: "Ticaret Hukuku & Telif", slug: "ticaret-hukuku-telif" },
        ],
    },
    {
        name: "Kişisel Gelişim & Kariyer",
        slug: "kisisel-gelisim-kariyer",
        icon: "Sparkles",
        description: "İletişimden liderliğe, zaman yönetiminden öz disipline kişisel ve mesleki gelişim.",
        children: [
        { name: "Kariyer & İş Bulma", slug: "kariyer-is-bulma" },
        { name: "Verimlilik & Zaman Yönetimi", slug: "verimlilik-zaman-yonetimi" },
        { name: "İletişim & Beden Dili", slug: "iletisim-beden-dili" },
        { name: "Liderlik & Yönetim", slug: "liderlik-yonetim" },
        { name: "Hitabet & Sunum Becerileri", slug: "hitabet-sunum-becerileri" },
        { name: "Stres & Duygu Yönetimi", slug: "stres-duygu-yonetimi" },
        { name: "Finansal Okuryazarlık", slug: "finansal-okuryazarlik" },
        { name: "Yaratıcı Yazarlık & İçerik", slug: "yaratici-yazarlik-icerik" },
        { name: "Öğrenme Teknikleri & Odaklanma", slug: "ogrenme-teknikleri-odaklanma" },
        { name: "Networking & Sosyal Beceriler", slug: "networking-sosyal-beceriler" },
        { name: "Öz Disiplin & Alışkanlıklar", slug: "oz-disiplin-aliskanliklar" },
        { name: "Problem Çözme & Karar Verme", slug: "problem-cozme-karar-verme" },
        ],
    },
    {
        name: "Dil & Akademik Hazırlık",
        slug: "dil-akademik-hazirlik",
        icon: "Languages",
        description: "Yabancı dil öğreniminden sınav hazırlığına, akademik yazımdan çeviriye.",
        children: [
        { name: "Genel İngilizce", slug: "genel-ingilizce" },
        { name: "İş İngilizcesi", slug: "is-ingilizcesi" },
        { name: "Konuşma & Akıcılık (Speaking)", slug: "konusma-akicilik" },
        { name: "Teknik & Sektörel İngilizce", slug: "teknik-sektorel-ingilizce" },
        { name: "Almanca & Fransızca", slug: "almanca-fransizca" },
        { name: "İspanyolca & İtalyanca", slug: "ispanyolca-italyanca" },
        { name: "Çince, Japonca & Korece", slug: "cince-japonca-korece" },
        { name: "IELTS & TOEFL Hazırlık", slug: "ielts-toefl-hazirlik" },
        { name: "YDS & YÖKDİL Hazırlık", slug: "yds-yokdil-hazirlik" },
        { name: "ALES, DGS & YKS Hazırlık", slug: "ales-dgs-yks-hazirlik" },
        { name: "GRE & GMAT Hazırlık", slug: "gre-gmat-hazirlik" },
        { name: "Akademik Yazım & Makale", slug: "akademik-yazim-makale" },
        { name: "Çeviri & Mütercim Tercümanlık", slug: "ceviri-mutercim-tercumanlik" },
        ],
    },
    {
        name: "Müzik, Ses & Hobi",
        slug: "muzik-ses-hobi",
        icon: "Music",
        description: "Enstrüman eğitiminden müzik prodüksiyonuna, fotoğrafçılıktan el sanatlarına.",
        children: [
        { name: "Müzik Üretimi & DAW (Ableton, FL)", slug: "muzik-uretimi-daw" },
        { name: "Ses Kayıt & Mixing/Mastering", slug: "ses-kayit-mixing-mastering" },
        { name: "Piyano & Tuşlu Çalgılar", slug: "piyano-tuslu-calgilar" },
        { name: "Gitar & Ukulele", slug: "gitar-ukulele" },
        { name: "Keman & Yaylı Çalgılar", slug: "keman-yayli-calgilar" },
        { name: "Bateri & Perkusyon", slug: "bateri-perkusyon" },
        { name: "Şan & Vokal Eğitimi", slug: "san-vokal-egitimi" },
        { name: "Müzik Teorisi & Solfej", slug: "muzik-teorisi-solfej" },
        { name: "Fotoğrafçılık", slug: "fotografcilik" },
        { name: "Gastronomi & Mutfak", slug: "gastronomi-mutfak" },
        { name: "El Sanatları & Çizim", slug: "el-sanatlari-cizim" },
        { name: "Satranç & Zeka Oyunları", slug: "satranc-zeka-oyunlari" },
        ],
    },
    {
        name: "Sağlık, Tıp & Yaşam",
        slug: "saglik-tip-yasam",
        icon: "HeartPulse",
        description: "Temel tıptan beslenmeye, spordan zihin-beden çalışmalarına sağlıklı yaşam.",
        children: [
        { name: "Temel Tıp & Anatomi", slug: "temel-tip-anatomi" },
        { name: "Beslenme & Diyet", slug: "beslenme-diyet" },
        { name: "Spor & Fitness", slug: "spor-fitness" },
        { name: "Zihin & Beden (Yoga, Mindfulness)", slug: "zihin-beden-yoga-mindfulness" },
        { name: "İlk Yardım & Hasta Bakımı", slug: "ilk-yardim-hasta-bakimi" },
        { name: "Medikal Teknolojiler", slug: "medikal-teknolojiler" },
        { name: "Fizyoterapi & Rehabilitasyon", slug: "fizyoterapi-rehabilitasyon" },
        ],
    },
];

export default CATEGORY_TREE;

export interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    subcategories: SubCategory[];
}

export const COURSE_CATEGORIES: Category[] = [
    {
        id: 1,
        name: "Yazılım Geliştirme",
        slug: "yazilim-gelistirme",
        icon: "Code",
        subcategories: [
            { id: 101, name: "Web Geliştirme", slug: "web-gelistirme" },
            { id: 102, name: "Veri Bilimi", slug: "veri-bilimi" },
            { id: 103, name: "Mobil Yazılım Geliştirme", slug: "mobil-yazilim-gelistirme" },
            { id: 104, name: "Programlama Dilleri", slug: "programlama-dilleri" },
            { id: 105, name: "Oyun Geliştirme", slug: "oyun-gelistirme" },
            { id: 106, name: "Veri Tabanı Tasarlama ve Geliştirme", slug: "veri-tabani-tasarlama-ve-gelistirme" },
            { id: 107, name: "Yazılım Testi", slug: "yazilim-testi" },
            { id: 108, name: "Yazılım Mühendisliği", slug: "yazilim-muhendisligi" },
            { id: 109, name: "Yazılım Geliştirme Araçları", slug: "yazilim-gelistirme-araclari" },
            { id: 110, name: "Kodsuz Yazılım Geliştirme", slug: "kodsuz-yazilim-gelistirme" }
        ]
    },
    {
        id: 2,
        name: "İşletme",
        slug: "isletme",
        icon: "TrendingUp",
        subcategories: [
            { id: 201, name: "Girişimcilik", slug: "girisimcilik" },
            { id: 202, name: "İletişim", slug: "iletisim" },
            { id: 203, name: "Yönetim", slug: "yonetim" },
            { id: 204, name: "Satış", slug: "satis" },
            { id: 205, name: "İş Stratejisi", slug: "is-stratejisi" },
            { id: 206, name: "Operasyonlar", slug: "operasyonlar" },
            { id: 207, name: "Proje Yönetimi", slug: "proje-yonetimi" },
            { id: 208, name: "İş Hukuku", slug: "is-hukuku" },
            { id: 209, name: "İş Analitiği ve Zekası", slug: "is-analitigi-ve-zekasi" },
            { id: 210, name: "İnsan Kaynakları", slug: "insan-kaynaklari" },
            { id: 211, name: "Sanayi", slug: "sanayi" },
            { id: 212, name: "E-Ticaret", slug: "e-ticaret" },
            { id: 213, name: "Medya", slug: "medya" },
            { id: 214, name: "Gayrimenkul", slug: "gayrimenkul" },
            { id: 215, name: "Diğer İşletme", slug: "diger-isletme" }
        ]
    },
    {
        id: 3,
        name: "Finans ve Muhasebe",
        slug: "finans-ve-muhasebe",
        icon: "DollarSign",
        subcategories: [
            { id: 301, name: "Muhasebe ve Defter Tutma", slug: "muhasebe-ve-defter-tutma" },
            { id: 302, name: "Uyumluluk", slug: "uyumluluk" },
            { id: 303, name: "Sanal Para Birimi ve Blockchain", slug: "sanal-para-birimi-ve-blockchain" },
            { id: 304, name: "Ekonomi", slug: "ekonomi" },
            { id: 305, name: "Finans", slug: "finans" },
            { id: 306, name: "Finans Alanında Sertifika ve Sınav Hazırlığı", slug: "finans-alaninda-sertifika-ve-sinav-hazirligi" },
            { id: 307, name: "Finansal Modelleme ve Analiz", slug: "finansal-modelleme-ve-analiz" },
            { id: 308, name: "Yatırım ve Ticaret", slug: "yatirim-ve-ticaret" },
            { id: 309, name: "Nakit Yönetimi Araçları", slug: "nakit-yonetimi-araclari" },
            { id: 310, name: "Vergiler", slug: "vergiler" },
            { id: 311, name: "Diğer Finans ve Muhasebe", slug: "diger-finans-ve-muhasebe" }
        ]
    },
    {
        id: 4,
        name: "BT ve Yazılım",
        slug: "bt-ve-yazilim",
        icon: "Monitor",
        subcategories: [
            { id: 401, name: "BT Sertifikaları", slug: "bt-sertifikalari" },
            { id: 402, name: "Ağ ve Güvenlik", slug: "ag-ve-guvenlik" },
            { id: 403, name: "Donanım", slug: "donanim" },
            { id: 404, name: "İşletim Sistemleri ve Sunucular", slug: "isletim-sistemleri-ve-sunucular" },
            { id: 405, name: "Diğer BT ve Yazılım", slug: "diger-bt-ve-yazilim" }
        ]
    },
    {
        id: 5,
        name: "Ofiste Verimlilik",
        slug: "ofiste-verimlilik",
        icon: "Briefcase",
        subcategories: [
            { id: 501, name: "Microsoft", slug: "microsoft" },
            { id: 502, name: "Apple", slug: "apple" },
            { id: 503, name: "Google", slug: "google" },
            { id: 504, name: "SAP", slug: "sap" },
            { id: 505, name: "Oracle", slug: "oracle" },
            { id: 506, name: "Diğer Ofiste Verimlilik", slug: "diger-ofiste-verimlilik" }
        ]
    },
    {
        id: 6,
        name: "Kişisel Gelişim",
        slug: "kisisel-gelisim",
        icon: "Users",
        subcategories: [
            { id: 601, name: "Kişisel Verimlilik", slug: "kisisel-verimlilik" },
            { id: 602, name: "Liderlik", slug: "liderlik" },
            { id: 603, name: "Kariyer Geliştirme", slug: "kariyer-gelistirme" },
            { id: 604, name: "Ebeveynlik ve İlişkiler", slug: "ebeveynlik-ve-iliskiler" },
            { id: 605, name: "Mutluluk", slug: "mutluluk" },
            { id: 606, name: "Ezoterik Uygulamalar", slug: "ezoterik-uygulamalar" },
            { id: 607, name: "Din ve Maneviyat", slug: "din-ve-maneviyat" },
            { id: 608, name: "Kişisel Marka Oluşturma", slug: "kisisel-marka-olusturma" },
            { id: 609, name: "Yaratıcılık", slug: "yaraticilik" },
            { id: 610, name: "İlham", slug: "ilham" },
            { id: 611, name: "Öz Güven ve Öz Saygı", slug: "oz-guven-ve-oz-saygi" },
            { id: 612, name: "Stres Yönetimi", slug: "stres-yonetimi" },
            { id: 613, name: "Hafıza ve Çalışma Becerileri", slug: "hafiza-ve-calisma-becerileri" },
            { id: 614, name: "Motivasyon", slug: "motivasyon" },
            { id: 615, name: "Diğer Kişisel Gelişim", slug: "diger-kisisel-gelisim" }
        ]
    },
    {
        id: 7,
        name: "Tasarım",
        slug: "tasarim",
        icon: "Palette",
        subcategories: [
            { id: 701, name: "Web Tasarımı", slug: "web-tasarimi" },
            { id: 702, name: "Grafik Tasarım ve İllüstrasyon", slug: "grafik-tasarim-ve-illustrasyon" },
            { id: 703, name: "Tasarım Araçları", slug: "tasarim-araclari" },
            { id: 704, name: "Kullanıcı Deneyimi Tasarımı (UX)", slug: "kullanici-deneyimi-tasarimi-ux" },
            { id: 705, name: "Oyun Tasarımı", slug: "oyun-tasarimi" },
            { id: 706, name: "3D ve Animasyon", slug: "3d-ve-animasyon" },
            { id: 707, name: "Moda Tasarımı", slug: "moda-tasarimi" },
            { id: 708, name: "Mimari Tasarım", slug: "mimari-tasarim" },
            { id: 709, name: "İç Tasarım", slug: "ic-tasarim" },
            { id: 710, name: "Diğer Tasarım", slug: "diger-tasarim" }
        ]
    },
    {
        id: 8,
        name: "Öğretim ve Akademi",
        slug: "ogretim-ve-akademi",
        icon: "BookOpen",
        subcategories: [
            { id: 801, name: "Mühendislik", slug: "muhendislik" },
            { id: 802, name: "Beşeri Bilimler", slug: "beseri-bilimler" },
            { id: 803, name: "Matematik", slug: "matematik" },
            { id: 804, name: "Bilim", slug: "bilim" },
            { id: 805, name: "Online Eğitim", slug: "online-egitim" },
            { id: 806, name: "Sosyal Bilimler", slug: "sosyal-bilimler" },
            { id: 807, name: "Dil Öğrenimi", slug: "dil-ogrenimi" },
            { id: 808, name: "Öğretmen Eğitimi", slug: "ogretmen-egitimi" },
            { id: 809, name: "Sınava Hazırlık", slug: "sinava-hazirlik" },
            { id: 810, name: "Diğer Öğretim ve Akademi", slug: "diger-ogretim-ve-akademi" }
        ]
    },
    {
        id: 9,
        name: "Pazarlama",
        slug: "pazarlama",
        icon: "TrendingUp",
        subcategories: [
            { id: 901, name: "Dijital Pazarlama", slug: "dijital-pazarlama" },
            { id: 902, name: "Arama Motoru Optimizasyonu (SEO)", slug: "arama-motoru-optimizasyonu-seo" },
            { id: 903, name: "Sosyal Medya Pazarlama", slug: "sosyal-medya-pazarlama" },
            { id: 904, name: "Markalaştırma", slug: "markalastirma" },
            { id: 905, name: "Pazarlamanın Temelleri", slug: "pazarlamanin-temelleri" },
            { id: 906, name: "Pazarlama Analizi ve Otomasyon", slug: "pazarlama-analizi-ve-otomasyon" },
            { id: 907, name: "Halkla İlişkiler", slug: "halkla-iliskiler" },
            { id: 908, name: "Ücretli Reklam", slug: "ucretli-reklam" },
            { id: 909, name: "Video ve Mobil Pazarlama", slug: "video-ve-mobil-pazarlama" },
            { id: 910, name: "İçerik Pazarlama", slug: "icerik-pazarlama" },
            { id: 911, name: "Growth Hacking", slug: "growth-hacking" },
            { id: 912, name: "İş Ortaklığı Pazarlama (Affiliate Marketing)", slug: "is-ortakligi-pazarlama-affiliate-marketing" },
            { id: 913, name: "Ürün Pazarlama", slug: "urun-pazarlama" },
            { id: 914, name: "Diğer Pazarlama", slug: "diger-pazarlama" }
        ]
    },
    {
        id: 10,
        name: "Yaşam Tarzı",
        slug: "yasam-tarzi",
        icon: "Heart",
        subcategories: [
            { id: 1001, name: "Sanat ve El Sanatları", slug: "sanat-ve-el-sanatlari" },
            { id: 1002, name: "Güzellik ve Makyaj", slug: "guzellik-ve-makyaj" },
            { id: 1003, name: "Ezoterik Uygulamalar", slug: "ezoterik-uygulamalar" },
            { id: 1004, name: "Yiyecek ve İçecek", slug: "yiyecek-ve-icecek" },
            { id: 1005, name: "Oyun", slug: "oyun" },
            { id: 1006, name: "Ev Geliştirme ve Bahçe İşleri", slug: "ev-gelistirme-ve-bahce-isleri" },
            { id: 1007, name: "Evcil Hayvan Bakımı ve Eğitimi", slug: "evcil-hayvan-bakimi-ve-egitimi" },
            { id: 1008, name: "Seyahat", slug: "seyahat" },
            { id: 1009, name: "Diğer Yaşam Stili", slug: "diger-yasam-stili" }
        ]
    },
    {
        id: 11,
        name: "Fotoğraf ve Video",
        slug: "fotograf-ve-video",
        icon: "Camera",
        subcategories: [
            { id: 1101, name: "Dijital Fotoğrafçılık", slug: "dijital-fotografcilik" },
            { id: 1102, name: "Fotoğrafçılık", slug: "fotografcilik" },
            { id: 1103, name: "Portre Fotoğrafçılığı", slug: "portre-fotografciligi" },
            { id: 1104, name: "Fotoğrafçılık Araçları", slug: "fotografcilik-araclari" },
            { id: 1105, name: "Ticari Fotoğrafçılık", slug: "ticari-fotografcilik" },
            { id: 1106, name: "Video Tasarımı", slug: "video-tasarimi" },
            { id: 1107, name: "Diğer Fotoğrafçılık ve Video", slug: "diger-fotografcilik-ve-video" }
        ]
    },
    {
        id: 12,
        name: "Sağlık ve Fitness",
        slug: "saglik-ve-fitness",
        icon: "Activity",
        subcategories: [
            { id: 1201, name: "Fitness", slug: "fitness" },
            { id: 1202, name: "Genel Sağlık", slug: "genel-saglik" },
            { id: 1203, name: "Spor", slug: "spor" },
            { id: 1204, name: "Beslenme ve Diyetetik", slug: "beslenme-ve-diyetetik" },
            { id: 1205, name: "Yoga", slug: "yoga" },
            { id: 1206, name: "Ruh Sağlığı", slug: "ruh-sagligi" },
            { id: 1207, name: "Dövüş Sanatları ve Kendini Savunma", slug: "dovus-sanatlari-ve-kendini-savunma" },
            { id: 1208, name: "Güvenlik ve İlk Yardım", slug: "guvenlik-ve-ilk-yardim" },
            { id: 1209, name: "Dans", slug: "dans" },
            { id: 1210, name: "Meditasyon", slug: "meditasyon" },
            { id: 1211, name: "Diğer Sağlık ve Fitness", slug: "diger-saglik-ve-fitness" }
        ]
    },
    {
        id: 13,
        name: "Müzik",
        slug: "muzik",
        icon: "Music",
        subcategories: [
            { id: 1301, name: "Enstrümanlar", slug: "enstrumanlar" },
            { id: 1302, name: "Müzik Prodüksiyonu", slug: "muzik-produksiyonu" },
            { id: 1303, name: "Müziğin Temelleri", slug: "muzigin-temelleri" },
            { id: 1304, name: "Vokal", slug: "vokal" },
            { id: 1305, name: "Müzik Teknikleri", slug: "muzik-teknikleri" },
            { id: 1306, name: "Müzik Yazılımı", slug: "muzik-yazilimi" },
            { id: 1307, name: "Diğer Müzik", slug: "diger-muzik" }
        ]
    }
];

// Helper functions
export const getCategoryById = (id: number): Category | undefined => {
    return COURSE_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
    return COURSE_CATEGORIES.find(cat => cat.slug === slug);
};

export const getSubCategoryById = (categoryId: number, subcategoryId: number): SubCategory | undefined => {
    const category = getCategoryById(categoryId);
    return category?.subcategories.find(sub => sub.id === subcategoryId);
};

export const getSubCategoryBySlug = (categorySlug: string, subcategorySlug: string): SubCategory | undefined => {
    const category = getCategoryBySlug(categorySlug);
    return category?.subcategories.find(sub => sub.slug === subcategorySlug);
};

export const getAllSubCategories = (): SubCategory[] => {
    return COURSE_CATEGORIES.flatMap(cat => cat.subcategories);
};

// Featured categories for header navigation (in order)
export const FEATURED_CATEGORIES = [
    "yazilim-gelistirme",
    "isletme",
    "finans-ve-muhasebe",
    "ofiste-verimlilik",
    "ogretim-ve-akademi",
    "tasarim",
    "bt-ve-yazilim",
    "kisisel-gelisim"
];

export const getFeaturedCategories = (): Category[] => {
    return FEATURED_CATEGORIES.map(slug => getCategoryBySlug(slug)).filter(Boolean) as Category[];
};

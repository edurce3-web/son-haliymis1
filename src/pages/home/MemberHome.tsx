import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Flame } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import ContinueBanner from '@/components/home/ContinueBanner';
import ShelfSection from '@/components/home/ShelfSection';
import CategoryExplorer from '@/components/home/CategoryExplorer';

interface CategoryShelf {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    total: number;
    courses: any[];
}

interface MemberHomeData {
    continueWatching: any[] | null;
    inProgress: any[];
    fromSearches: { term: string | null; items: any[] };
    fromCategories: { category: string | null; items: any[] };
    popular: any[];
    popularTurkish?: any[];
    /** Panelden elle seçilmiş öneri şeridi. Boşsa otomatik listeye düşülür. */
    curatedRecommended?: any[];
    categoryShelves?: CategoryShelf[];
}

interface CatalogData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
}

/**
 * Giriş yapmış kullanıcının ana sayfası.
 *
 * Misafir sayfası bir vitrin — platformun ne olduğunu anlatır, kahraman
 * bölümü ve ikna metinleri taşır. Burası ise bir katalog: kullanıcı zaten
 * üye, anlatılacak bir şey yok. Bu yüzden kahraman bölümü yok, sayfa
 * doğrudan kaldığı dersle açılıyor ve altında raflar sıralanıyor.
 *
 * Raflar sırayla daralıyor: önce kişisel olanlar (kaldığın yer, eğitimlerin,
 * sana öneriler), sonra platform geneli (öne çıkanlar, en çok tercih
 * edilenler), en altta alan alan kategori rafları. Kullanıcı aşağı indikçe
 * kendisinden uzaklaşıp katalogun tamamına açılıyor.
 */
const MemberHome: React.FC = () => {
    const { data: mine, isLoading: mineLoading } = useQuery<MemberHomeData>({
        queryKey: ['home-member'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home/member`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Kişisel içerik yüklenemedi');
            return res.json();
        },
    });

    const { data: catalog, isLoading: catalogLoading } = useQuery<CatalogData>({
        queryKey: ['home-guest'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
    });

    useSeo({
        title: 'Edurce — Ana sayfa',
        description: 'Kaldığın yerden devam et, sana önerilen kursları keşfet.',
        robots: 'noindex, follow',
    }, []);

    /*
     * Öneri şeridinin kaynağı.
     *
     * İzlediği alanlardan gelen liste daha isabetli; yoksa genel popülere
     * düşüyor. Yeni hesapta ilk şeridin boş kalması, sayfanın en üstünde
     * kocaman bir boşluk demekti.
     */
    const curated = mine?.curatedRecommended || [];

    const recommended = curated.length > 0
        ? curated
        : mine?.fromCategories?.items?.length
            ? mine.fromCategories.items
            : mine?.popular || [];

    const recommendedReason = curated.length > 0
        ? 'Edurce ekibinin öne çıkardığı eğitimler'
        : mine?.fromCategories?.items?.length
            ? mine.fromCategories.category
                ? `${mine.fromCategories.category} alanında izlediklerine göre derlendi`
                : 'İzleme geçmişine göre derlendi'
            : 'Platformda en çok tercih edilen, henüz almadığın kurslar';

    const shelves = mine?.categoryShelves || [];

    return (
        <div className="min-h-screen bg-[#faf8ff]">

            {/*
                Devam eden kurslar tek yerde: bu şerit.

                Altında ayrıca bir "Devam eden kurslarım" rafı vardı; aynı
                kurslar sayfada iki kez çıkıyordu. Geri kalanlar Eğitimlerim
                sayfasında duruyor.
            */}
            <ContinueBanner courses={mine?.continueWatching} />

            <div className="container mx-auto px-4 py-7 space-y-9">

                <ShelfSection
                    title="Sizin için önerilenler"
                    subtitle={recommendedReason}
                    href="/courses"
                    courses={recommended}
                    loading={mineLoading}
                    columns={6}
                    compactCards
                />

                {/* Arama geçmişi olmayan kullanıcıda bu raf hiç yok. Hiç arama
                    yapmamış birine "aramalarına göre" demek, önerinin
                    gerekçesini uyduruyor. */}
                {mine?.fromSearches?.items?.length ? (
                    <ShelfSection
                        title="Son aramalarına göre"
                        subtitle={`"${mine.fromSearches.term}" aramandan yola çıkarak seçildi`}
                        href={`/search?q=${encodeURIComponent(mine.fromSearches.term || '')}`}
                        courses={mine.fromSearches.items}
                        columns={6}
                        compactCards
                    />
                ) : null}

                <ShelfSection
                    title="Öne çıkarılan kurslar"
                    chip={{ text: 'Editör seçimi', icon: <BadgeCheck className="w-3.5 h-3.5" /> }}
                    subtitle="Puan ortalaması ve öğrenci sayısıyla öne çıkan eğitimler"
                    href="/courses?sort=rating"
                    courses={catalog?.featured_courses || []}
                    loading={catalogLoading}
                    columns={6}
                    compactCards
                />

                <CategoryExplorer title="Ne öğrenmek istersin?" bare />

                <ShelfSection
                    title="En çok tercih edilenler"
                    chip={{ text: 'Trend', icon: <Flame className="w-3.5 h-3.5" /> }}
                    subtitle="Platformdaki en kalabalık sınıflar"
                    href="/courses?sort=popular"
                    courses={catalog?.top_selling || []}
                    loading={catalogLoading}
                    columns={6}
                    compactCards
                />

                {/*
                    Popüler Türkçe kurslar.

                    Üstteki şerit öğrenci sayısına, bu şerit puana göre
                    sıralanıyor. Aynı listeyi iki kez göstermemek için ayrım
                    sıralamada: biri en kalabalık sınıfları, diğeri en
                    beğenilenleri öne çıkarıyor.
                */}
                <ShelfSection
                    title="Popüler Türkçe kurslar"
                    chip={{ text: '%100 Türkçe' }}
                    subtitle="Tamamı Türkçe anlatımlı, uygulamalı ve güncel eğitimler"
                    href="/courses?sort=rating"
                    courses={mine?.popularTurkish || []}
                    loading={mineLoading}
                    columns={6}
                    rows={2}
                    compactCards
                />

                {/*
                    Kategori rafları.

                    Her ana alan kendi şeridini alıyor; kullanıcı ilgilenmediği
                    alanı atlayıp kendi alanına inebiliyor. Raf kaymıyor, iki
                    satırlık ızgara: on iki kurs kaydırmadan görünüyor, devamı
                    "Tümünü gör"de.
                */}
                {shelves.map(shelf => (
                    <ShelfSection
                        key={shelf.slug || shelf.id}
                        title={`${shelf.name} Kursları`}
                        chip={{ text: `${shelf.total} kurs` }}
                        subtitle={shelf.description || undefined}
                        href={`/courses/${shelf.slug}`}
                        courses={shelf.courses}
                        columns={6}
                        rows={2}
                        compactCards
                    />
                ))}

                <ShelfSection
                    title="Yeni eklenenler"
                    subtitle="Platforma en son katılan, en taze içerikler"
                    badgeFor={() => ({ text: 'Yeni', tone: 'brand' })}
                    href="/courses?sort=newest"
                    courses={catalog?.new_courses || []}
                    loading={catalogLoading}
                    columns={6}
                    rows={2}
                    compactCards
                />

                <ShelfSection
                    title="Ücretsiz başla"
                    subtitle="Ödeme yapmadan izleyebileceğin kurslar"
                    href="/courses?free=1"
                    courses={catalog?.free_courses || []}
                    columns={6}
                    compactCards
                />
            </div>
        </div>
    );
};

export default MemberHome;

import React, { Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GuestHome from './home/GuestHome';

/**
 * Ana sayfa — iki ayrı sayfa, tek adres.
 *
 * Misafir ve üye için amaçlar farklı: biri ziyaretçiyi bir kursa götürmeye,
 * diğeri kullanıcıyı bıraktığı derse döndürmeye çalışıyor. İkisini tek
 * bileşende koşullarla yönetmek, her değişiklikte diğerini bozma riski
 * demekti; ayrı dosyalar hem okunur hem bağımsız geliştirilebilir.
 *
 * Misafir sayfası doğrudan içe aktarılıyor çünkü arama motorlarının ve ilk
 * ziyaretçinin gördüğü sayfa o; üye paneli ayrı parça olarak yükleniyor,
 * giriş yapmamış birinin paketine girmesi gereksiz.
 */
const MemberHome = lazy(() => import('./home/MemberHome'));

const Home: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();

    // Oturum okunurken misafir sayfasını çizmek, giriş yapmış kullanıcıya
    // bir an pazarlama ekranı göstermek olurdu. Kısa bir boşluk daha dürüst.
    if (loading) {
        return <div className="min-h-screen bg-white" />;
    }

    if (!isAuthenticated) return <GuestHome />;

    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <MemberHome />
        </Suspense>
    );
};

export default Home;

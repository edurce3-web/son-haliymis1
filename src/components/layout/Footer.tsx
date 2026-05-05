import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuth();
  const isInstructor = user?.role === 'instructor' || user?.is_instructor;

  return (
    <footer className="bg-[#111827] text-[#9CA3AF] py-16 px-4 md:px-8 font-inter border-t border-gray-800">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand & Small Pitch */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group w-max">
              <GraduationCap className="w-8 h-8 text-[#0D9488]" />
              <span className="text-2xl font-montserrat font-extrabold text-white tracking-tight">Edurce</span>
            </Link>
            <p className="text-sm leading-[1.7] text-[#9CA3AF] mb-6">
              {isAuthenticated
                ? (isInstructor
                  ? "Bilginizi dünyayla paylaşın ve binlerce öğrenciye ilham verin."
                  : "İhtiyacınız olan tüm yetenekler, dilediğiniz zaman tek bir platformda.")
                : "Edurce ile yüzlerce kaliteli eğitime erişin ve geleceğinizi inşa etmeye başlayın."}
            </p>
          </div>

          {/* Sütun 1: Keşfet */}
          <div className="md:col-span-1">
            <h5 className="font-montserrat font-bold text-white mb-6 text-sm tracking-wider uppercase">Keşfet</h5>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/courses" className="hover:text-[#0D9488] transition-colors inline-block">Katalog</Link></li>
              <li><Link to="/categories" className="hover:text-[#0D9488] transition-colors inline-block">Kategoriler</Link></li>
              {isAuthenticated && (
                <li><Link to="/learning" className="hover:text-[#0D9488] transition-colors inline-block">Öğrenme Merkezi</Link></li>
              )}
            </ul>
          </div>

          {/* Sütun 2: Hesap / Eğitmen */}
          <div className="md:col-span-1">
            <h5 className="font-montserrat font-bold text-white mb-6 text-sm tracking-wider uppercase">
              {isInstructor ? 'Kariyer' : 'Hesap'}
            </h5>
            <ul className="space-y-4 text-sm font-medium">
              {isInstructor ? (
                <>
                  <li><Link to="/instructor" className="hover:text-[#0D9488] transition-colors inline-block">Kontrol Paneli</Link></li>
                  <li><Link to="/instructor/courses/create" className="hover:text-[#0D9488] transition-colors inline-block">Yeni Kurs Ekle</Link></li>
                </>
              ) : (
                !isAuthenticated ? (
                  <>
                    <li><Link to="/login" className="hover:text-[#0D9488] transition-colors inline-block">Giriş Yap</Link></li>
                    <li><Link to="/register" className="hover:text-[#0D9488] transition-colors inline-block">Kayıt Ol</Link></li>
                    <li><Link to="/instructor-application" className="hover:text-[#0D9488] transition-colors inline-block">Eğitmen Ol</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/profile" className="hover:text-[#0D9488] transition-colors inline-block">Profil Ayarları</Link></li>
                    <li><Link to="/instructor-application" className="hover:text-[#0D9488] transition-colors inline-block">Eğitmen Ol</Link></li>
                  </>
                )
              )}
            </ul>
          </div>

          {/* Sütun 3: Destek */}
          <div className="md:col-span-1">
            <h5 className="font-montserrat font-bold text-white mb-6 text-sm tracking-wider uppercase">Hakkımızda</h5>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/help" className="hover:text-[#0D9488] transition-colors inline-block">Yardım Merkezi</Link></li>
              <li><Link to="/privacy" className="hover:text-[#0D9488] transition-colors inline-block">Gizlilik Politikası</Link></li>
              <li><Link to="/terms" className="hover:text-[#0D9488] transition-colors inline-block">Kullanım Şartları</Link></li>
            </ul>
          </div>

        </div>

        {/* Alt Bilgi */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-[#9CA3AF]">
          <p>© {currentYear} Edurce Inc. Tüm hakları saklıdır.</p>
          <div className="mt-4 sm:mt-0">
            <span className="hover:text-[#0D9488] cursor-pointer transition-colors font-medium">Türkçe (TR)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

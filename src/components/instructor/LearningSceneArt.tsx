import React from 'react';

/**
 * Eğitmen ol sayfasının kahraman görseli.
 *
 * Omuz üstünden bakış: önde bir kişi, karşısında ders videosunun oynadığı
 * dizüstü bilgisayar. Vektör olarak çiziliyor çünkü:
 *   - Her ekran boyutunda net kalıyor, ayrı 1x/2x/3x dosya gerekmiyor
 *   - Marka paletini birebir kullanıyor, stok fotoğrafla renk uyumsuzluğu olmuyor
 *   - Sayfaya ek ağ isteği getirmiyor
 *
 * Gerçek fotoğrafla değiştirmek istenirse bu bileşen tek bir <img> ile
 * yer değiştirebilir; dışarıdan boyut almıyor, kapsayıcısını dolduruyor.
 */
export const LearningSceneArt: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 800 560"
        className={className}
        role="img"
        aria-label="Bilgisayarında ders videosu izleyen bir kişi"
        preserveAspectRatio="xMidYMid slice"
    >
        <defs>
            <linearGradient id="ls-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EFF8F7" />
                <stop offset="100%" stopColor="#AEDBD7" />
            </linearGradient>
            <linearGradient id="ls-screen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#124A4A" />
                <stop offset="100%" stopColor="#0D3838" />
            </linearGradient>
            <linearGradient id="ls-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D6EDEB" />
                <stop offset="100%" stopColor="#7CC2BD" />
            </linearGradient>
            <linearGradient id="ls-person" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#175D5D" />
                <stop offset="100%" stopColor="#0D3838" />
            </linearGradient>
            <clipPath id="ls-frame">
                <rect width="800" height="560" rx="24" />
            </clipPath>
        </defs>

        <g clipPath="url(#ls-frame)">
            <rect width="800" height="560" fill="url(#ls-bg)" />

            {/* Arka plandaki yumuşak ışıklar */}
            <circle cx="120" cy="90" r="150" fill="#FFFFFF" opacity="0.45" />
            <circle cx="700" cy="470" r="180" fill="#2A8580" opacity="0.10" />

            {/* Duvardaki raf ve bitki — sahneye derinlik katıyor */}
            <rect x="596" y="96" width="150" height="7" rx="3.5" fill="#7CC2BD" opacity="0.6" />
            <rect x="612" y="60" width="17" height="36" rx="3" fill="#1E6E6B" opacity="0.5" />
            <rect x="634" y="52" width="17" height="44" rx="3" fill="#175D5D" opacity="0.42" />
            <rect x="656" y="66" width="17" height="30" rx="3" fill="#2A8580" opacity="0.5" />
            <path d="M706 96c0-22 10-34 22-40-6 16-4 30 2 40z" fill="#1E6E6B" opacity="0.45" />
            <path d="M706 96c-2-18-11-27-21-31 5 13 5 23 2 31z" fill="#2A8580" opacity="0.4" />

            {/* Masa yüzeyi */}
            <rect x="0" y="432" width="800" height="128" fill="#FFFFFF" opacity="0.55" />
            <rect x="0" y="432" width="800" height="3" fill="#7CC2BD" opacity="0.55" />

            {/* ── Dizüstü bilgisayar ───────────────────────────────────────── */}
            {/* Ekranın altındaki yumuşak gölge */}
            <ellipse cx="430" cy="440" rx="215" ry="13" fill="#0D3838" opacity="0.12" />

            <rect x="214" y="112" width="432" height="288" rx="14" fill="#0D3838" />
            <rect x="226" y="124" width="408" height="252" rx="8" fill="url(#ls-screen)" />

            {/* Video alanı */}
            <rect x="240" y="138" width="278" height="176" rx="6" fill="#072424" />
            {/* Videodaki sahne: sade bir grafik/sunum görüntüsü */}
            <rect x="258" y="160" width="104" height="9" rx="4.5" fill="#4AA5A0" opacity="0.75" />
            <rect x="258" y="177" width="66" height="7" rx="3.5" fill="#2A8580" opacity="0.55" />
            <rect x="258" y="238" width="26" height="52" rx="4" fill="#2A8580" opacity="0.6" />
            <rect x="292" y="220" width="26" height="70" rx="4" fill="#4AA5A0" opacity="0.7" />
            <rect x="326" y="248" width="26" height="42" rx="4" fill="#2A8580" opacity="0.5" />
            <rect x="360" y="204" width="26" height="86" rx="4" fill="#7CC2BD" opacity="0.8" />

            {/* Oynat düğmesi */}
            <circle cx="452" cy="226" r="34" fill="#FFFFFF" opacity="0.95" />
            <path d="M443 210l24 16-24 16z" fill="#175D5D" />

            {/* Oynatma çubuğu */}
            <rect x="240" y="330" width="278" height="7" rx="3.5" fill="#175D5D" />
            <rect x="240" y="330" width="166" height="7" rx="3.5" fill="#7CC2BD" />
            <circle cx="406" cy="333.5" r="8" fill="#FFFFFF" />
            <rect x="240" y="349" width="34" height="6" rx="3" fill="#2A8580" opacity="0.6" />
            <rect x="484" y="349" width="34" height="6" rx="3" fill="#2A8580" opacity="0.4" />

            {/* Sağdaki ders listesi */}
            <rect x="532" y="138" width="88" height="217" rx="6" fill="#175D5D" />
            {[0, 1, 2, 3, 4].map(i => (
                <g key={i} transform={`translate(544 ${152 + i * 42})`}>
                    <rect width="18" height="18" rx="4" fill={i < 2 ? '#7CC2BD' : '#2A8580'} opacity={i < 2 ? 1 : 0.45} />
                    {i < 2 && <path d="M5 9l3 3 5-6" stroke="#0D3838" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                    <rect x="26" y="2" width="42" height="6" rx="3" fill="#4AA5A0" opacity="0.7" />
                    <rect x="26" y="12" width="28" height="5" rx="2.5" fill="#2A8580" opacity="0.5" />
                </g>
            ))}

            {/* Klavye tabanı */}
            <path d="M186 400h488l34 34H152z" fill="url(#ls-base)" />
            <rect x="360" y="424" width="80" height="6" rx="3" fill="#7CC2BD" />

            {/* ── Öndeki kişi (omuz üstünden) ──────────────────────────────── */}
            <g>
                {/* Omuzlar */}
                <path d="M40 560c0-84 62-140 140-140s140 56 140 140z" fill="url(#ls-person)" />
                {/* Yaka */}
                <path d="M150 424c10 16 50 16 60 0-10 22-50 22-60 0z" fill="#0D3838" opacity="0.6" />
                {/* Baş */}
                <circle cx="180" cy="368" r="56" fill="#175D5D" />
                {/* Saç */}
                <path d="M124 360c0-34 25-58 56-58s56 24 56 58c-10-20-32-30-56-30s-46 10-56 30z" fill="#0D3838" />
                {/* Kulak hizası — profil hissi için hafif gölge */}
                <ellipse cx="180" cy="392" rx="40" ry="26" fill="#0D3838" opacity="0.16" />
            </g>

            {/* Kahve fincanı */}
            <rect x="640" y="392" width="42" height="40" rx="6" fill="#FFFFFF" />
            <rect x="640" y="392" width="42" height="9" rx="4" fill="#7CC2BD" />
            <path d="M682 402h12a10 10 0 010 20h-12" stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round" />

            {/* Not defteri */}
            <rect x="88" y="404" width="76" height="28" rx="5" fill="#FFFFFF" opacity="0.9" />
            <rect x="98" y="413" width="42" height="4" rx="2" fill="#7CC2BD" />
            <rect x="98" y="421" width="30" height="4" rx="2" fill="#AEDBD7" />

            {/* ── Yüzen kartlar ───────────────────────────────────────────── */}
            <g>
                <rect x="596" y="182" width="168" height="66" rx="14" fill="#FFFFFF" />
                <rect x="614" y="200" width="30" height="30" rx="8" fill="#D6EDEB" />
                <path d="M622 215l5 5 9-10" stroke="#175D5D" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="654" y="200" width="92" height="8" rx="4" fill="#175D5D" />
                <rect x="654" y="215" width="62" height="7" rx="3.5" fill="#AEDBD7" />
            </g>

            <g>
                <rect x="36" y="150" width="150" height="62" rx="14" fill="#FFFFFF" />
                <rect x="54" y="167" width="26" height="28" rx="6" fill="#175D5D" />
                <path d="M62 181l4 4 8-9" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="90" y="168" width="78" height="8" rx="4" fill="#175D5D" />
                <rect x="90" y="183" width="52" height="7" rx="3.5" fill="#AEDBD7" />
            </g>
        </g>
    </svg>
);

export default LearningSceneArt;

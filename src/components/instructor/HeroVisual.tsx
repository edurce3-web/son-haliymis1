import React, { useState } from 'react';

/**
 * Kahraman bölümünün sağ tarafındaki görsel.
 *
 * Kutu/kart yok: görsel bölümün arka planının parçası gibi durur. Sol kenarı
 * maskeyle şeffaflaşıp zemine karıştığı için metinle arasında keskin bir sınır
 * oluşmaz — "sanki bu bölümün doğasında varmış" hissi buradan gelir.
 *
 * Gerçek fotoğraf önceliklidir: public/gorsel.jpg varsa o kullanılır.
 * Dosya yoksa aşağıdaki çizim devreye girer, böylece sayfa boş kalmaz ve
 * fotoğraf eklemek kod değişikliği gerektirmez.
 */
const PHOTO_SRC = '/gorsel.jpg';

/** Sol kenarı yumuşatan maske — hem fotoğrafa hem çizime uygulanır. */
const FADE: React.CSSProperties = {
    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 14%, #000 34%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 14%, #000 34%)',
};

export const HeroVisual: React.FC = () => {
    const [hasPhoto, setHasPhoto] = useState(true);

    if (hasPhoto) {
        return (
            <img
                src={PHOTO_SRC}
                alt="Bilgisayarında ders videosu izleyen bir kişi"
                onError={() => setHasPhoto(false)}
                style={FADE}
                className="absolute inset-y-0 right-0 h-full w-full object-cover object-center"
            />
        );
    }

    // ── Fotoğraf yokken: masasında ders videosu izleyen kişi ──────────────
    return (
        <svg
            viewBox="0 0 760 620"
            style={FADE}
            className="absolute inset-y-0 right-0 h-full w-full"
            preserveAspectRatio="xMidYMax slice"
            role="img"
            aria-label="Bilgisayarında ders videosu izleyen bir kişi"
        >
            <defs>
                <linearGradient id="hv-screen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14504F" />
                    <stop offset="100%" stopColor="#0D3838" />
                </linearGradient>
                <linearGradient id="hv-sweater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E3E8E7" />
                </linearGradient>
                <linearGradient id="hv-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E9EDEC" />
                    <stop offset="100%" stopColor="#D3DAD9" />
                </linearGradient>
            </defs>

            {/* Arkadaki yumuşak marka lekeleri — derinlik */}
            <circle cx="560" cy="150" r="190" fill="#AEDBD7" opacity="0.4" />
            <circle cx="300" cy="250" r="150" fill="#7CC2BD" opacity="0.22" />

            {/* Masa */}
            <rect x="0" y="486" width="760" height="134" fill="url(#hv-desk)" />
            <rect x="0" y="486" width="760" height="3" fill="#B9C4C3" />

            {/* Dizüstü bilgisayar */}
            <ellipse cx="470" cy="492" rx="196" ry="12" fill="#0D3838" opacity="0.13" />
            <rect x="292" y="196" width="356" height="240" rx="12" fill="#0D3838" />
            <rect x="303" y="207" width="334" height="212" rx="7" fill="url(#hv-screen)" />

            {/* Oynayan ders videosu */}
            <rect x="315" y="219" width="228" height="146" rx="5" fill="#072424" />
            <rect x="330" y="238" width="86" height="8" rx="4" fill="#4AA5A0" opacity="0.75" />
            <rect x="330" y="253" width="54" height="6" rx="3" fill="#2A8580" opacity="0.55" />
            <rect x="330" y="305" width="22" height="42" rx="3" fill="#2A8580" opacity="0.6" />
            <rect x="360" y="290" width="22" height="57" rx="3" fill="#4AA5A0" opacity="0.7" />
            <rect x="390" y="313" width="22" height="34" rx="3" fill="#2A8580" opacity="0.5" />
            <rect x="420" y="277" width="22" height="70" rx="3" fill="#7CC2BD" opacity="0.8" />

            {/* Oynat düğmesi */}
            <circle cx="500" cy="292" r="29" fill="#FFFFFF" opacity="0.95" />
            <path d="M492 279l21 13-21 13z" fill="#175D5D" />

            {/* Oynatma çubuğu */}
            <rect x="315" y="378" width="228" height="6" rx="3" fill="#175D5D" />
            <rect x="315" y="378" width="134" height="6" rx="3" fill="#7CC2BD" />
            <circle cx="449" cy="381" r="7" fill="#FFFFFF" />

            {/* Ders listesi */}
            <rect x="556" y="219" width="70" height="180" rx="5" fill="#175D5D" />
            {[0, 1, 2, 3].map(i => (
                <g key={i} transform={`translate(566 ${231 + i * 42})`}>
                    <rect width="15" height="15" rx="3.5" fill={i < 2 ? '#7CC2BD' : '#2A8580'} opacity={i < 2 ? 1 : 0.45} />
                    {i < 2 && (
                        <path d="M4 7.5l2.5 2.5 4.5-5" stroke="#0D3838" strokeWidth="1.8"
                            fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    <rect x="21" y="1" width="32" height="5" rx="2.5" fill="#4AA5A0" opacity="0.7" />
                    <rect x="21" y="9" width="22" height="4" rx="2" fill="#2A8580" opacity="0.5" />
                </g>
            ))}

            {/* Klavye tabanı */}
            <path d="M268 436h404l30 30H238z" fill="#C9D2D1" />
            <rect x="420" y="454" width="66" height="5" rx="2.5" fill="#9FB0AF" />

            {/* Kahve ve defter */}
            <rect x="676" y="440" width="38" height="36" rx="5" fill="#FFFFFF" />
            <rect x="676" y="440" width="38" height="8" rx="4" fill="#7CC2BD" />
            <path d="M714 449h10a9 9 0 010 18h-10" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Öndeki kişi — omuz üstünden */}
            <ellipse cx="150" cy="470" rx="150" ry="30" fill="#0D3838" opacity="0.08" />
            <path d="M0 620c0-96 68-160 158-160s158 64 158 160z" fill="url(#hv-sweater)" />
            <path d="M118 470c14 20 62 20 76 0-12 28-64 28-76 0z" fill="#D3DAD9" />
            <circle cx="156" cy="400" r="62" fill="#175D5D" />
            <path d="M94 392c0-38 28-64 62-64s62 26 62 64c-12-22-36-34-62-34s-50 12-62 34z" fill="#0D3838" />
            <ellipse cx="156" cy="428" rx="44" ry="28" fill="#0D3838" opacity="0.15" />
        </svg>
    );
};

export default HeroVisual;

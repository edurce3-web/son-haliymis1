import React from 'react';

/**
 * Eğitmen ol sayfasının kahraman figürü.
 *
 * Çerçevesiz, zemine oturan bir üst gövde portresi. Arka planı saydam olduğu
 * için bölümün rengiyle kaynaşır — kutu ya da kart görünmez.
 *
 * Gerçek fotoğraf tercih edilirse public/hero-instructor.png dosyası eklemek
 * yeterli; sayfa varsa onu, yoksa bu çizimi gösterir (bkz. BecomeInstructor).
 */
export const InstructorFigure: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 560 720"
        className={className}
        role="img"
        aria-label="Kollarını kavuşturmuş, gülümseyen bir eğitmen"
        preserveAspectRatio="xMidYMax meet"
    >
        <defs>
            <linearGradient id="if-sweater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E7EBEA" />
            </linearGradient>
            <linearGradient id="if-hair" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#241C2E" />
                <stop offset="100%" stopColor="#3B2F45" />
            </linearGradient>
            <linearGradient id="if-skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E4AE86" />
                <stop offset="100%" stopColor="#CE9268" />
            </linearGradient>
        </defs>

        {/* Arkadaki yumuşak marka lekesi — figürü zeminden ayırır */}
        <ellipse cx="280" cy="330" rx="248" ry="266" fill="#AEDBD7" opacity="0.35" />
        <ellipse cx="280" cy="352" rx="196" ry="212" fill="#7CC2BD" opacity="0.28" />

        {/* Saçın arka kütlesi */}
        <path
            d="M280 78c-84 0-140 58-140 142 0 62 6 108 2 158-4 46-18 78-30 106h336c-12-28-26-60-30-106-4-50 2-96 2-158 0-84-56-142-140-142z"
            fill="url(#if-hair)"
        />

        {/* Boyun */}
        <path d="M242 300h76v82c0 22-76 22-76 0z" fill="#C4885E" />

        {/* Omuzlar ve gövde */}
        <path
            d="M280 352c58 0 96 16 124 42 34 32 52 82 58 146 6 62 8 122 8 180H90c0-58 2-118 8-180 6-64 24-114 58-146 28-26 66-42 124-42z"
            fill="url(#if-sweater)"
        />
        {/* Kazak dokusu — dikey nervürler */}
        {[132, 166, 200, 234, 268, 302, 336, 370, 404, 438].map(x => (
            <rect key={x} x={x} y="392" width="3" height="328" rx="1.5" fill="#D4DBDA" opacity="0.65" />
        ))}

        {/* Yaka */}
        <path d="M240 352c12 26 68 26 80 0 4 10 6 18 6 24-16 26-76 26-92 0 0-6 2-14 6-24z" fill="#D9E0DF" />

        {/* Kavuşturulmuş kollar */}
        <path
            d="M120 560c26-14 74-22 160-22s134 8 160 22c14 8 20 22 16 36-4 16-20 24-40 22-40-4-90-8-136-8s-96 4-136 8c-20 2-36-6-40-22-4-14 2-28 16-36z"
            fill="#F3F6F5"
        />
        <path
            d="M120 560c26-14 74-22 160-22s134 8 160 22"
            stroke="#D4DBDA" strokeWidth="3" fill="none" strokeLinecap="round"
        />
        {/* Eller */}
        <ellipse cx="146" cy="600" rx="34" ry="26" fill="url(#if-skin)" transform="rotate(-12 146 600)" />
        <ellipse cx="414" cy="600" rx="34" ry="26" fill="url(#if-skin)" transform="rotate(12 414 600)" />
        <path d="M124 592c14-6 30-8 44-6" stroke="#C4885E" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M392 586c14-2 30 0 44 6" stroke="#C4885E" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />

        {/* Yüz */}
        <ellipse cx="280" cy="212" rx="86" ry="100" fill="url(#if-skin)" />
        {/* Kulaklar */}
        <ellipse cx="194" cy="222" rx="13" ry="20" fill="#CE9268" />
        <ellipse cx="366" cy="222" rx="13" ry="20" fill="#CE9268" />

        {/* Saçın ön kısmı */}
        <path
            d="M280 92c-64 0-104 42-104 100 0 14 2 26 4 36 6-34 22-56 48-66 22-8 62-10 92 2 22 8 34 30 38 64 4-12 6-24 6-36 0-58-20-100-84-100z"
            fill="url(#if-hair)"
        />
        {/* Yüzü çerçeveleyen tutamlar */}
        <path d="M186 200c-6 60 0 104 10 140-24-34-34-92-28-146z" fill="url(#if-hair)" />
        <path d="M374 200c6 60 0 104-10 140 24-34 34-92 28-146z" fill="url(#if-hair)" />

        {/* Kaşlar */}
        <path d="M232 190c12-9 30-9 42-1" stroke="#2E2438" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M286 189c12-8 30-8 42 1" stroke="#2E2438" strokeWidth="7" fill="none" strokeLinecap="round" />

        {/* Gözler */}
        <ellipse cx="250" cy="218" rx="10" ry="11" fill="#2E2438" />
        <ellipse cx="310" cy="218" rx="10" ry="11" fill="#2E2438" />
        <circle cx="253" cy="214" r="3.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="313" cy="214" r="3.5" fill="#FFFFFF" opacity="0.9" />

        {/* Burun */}
        <path d="M280 226v20c0 5-5 8-11 8" stroke="#B67B52" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Gülümseme */}
        <path d="M248 272c10 16 54 16 64 0-8 24-56 24-64 0z" fill="#7A3B42" />
        <path d="M251 274c12 4 46 4 58 0-8 4-50 4-58 0z" fill="#FFFFFF" />

        {/* Yanaklarda hafif canlılık */}
        <ellipse cx="224" cy="248" rx="18" ry="11" fill="#D98A6A" opacity="0.35" />
        <ellipse cx="336" cy="248" rx="18" ry="11" fill="#D98A6A" opacity="0.35" />
    </svg>
);

export default InstructorFigure;

import React, { useState } from 'react';
import InstructorFigure from './InstructorFigure';

/** Gerçek fotoğraf kullanmak isteyenler bu dosyayı public/ içine koyar. */
const PHOTO_SRC = '/hero-instructor.png';

/**
 * Kahraman bölümündeki kişi görseli.
 *
 * Öncelik gerçek fotoğrafta: public/hero-instructor.png varsa o gösterilir.
 * Dosya yoksa çizim devreye girer, böylece sayfa hiçbir zaman boş kalmaz ve
 * fotoğraf eklemek için kod değişikliği gerekmez.
 *
 * Fotoğraf için önerilen: arka planı silinmiş (saydam) PNG, dikey çerçeve,
 * yaklaşık 1000x1400 px, kişi alt kenara oturacak şekilde kırpılmış.
 */
export const HeroPerson: React.FC<{ className?: string }> = ({ className }) => {
    const [usePhoto, setUsePhoto] = useState(true);

    if (usePhoto) {
        return (
            <img
                src={PHOTO_SRC}
                alt="Edurce eğitmeni"
                className={className}
                onError={() => setUsePhoto(false)}
            />
        );
    }
    return <InstructorFigure className={className} />;
};

export default HeroPerson;

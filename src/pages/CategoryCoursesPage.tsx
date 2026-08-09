import React from 'react';
import { useParams } from 'react-router-dom';
import CatalogPage from '@/components/catalog/CatalogPage';

/**
 * /courses/:kategori ve /courses/:kategori/:altKategori
 *
 * Arama sayfasıyla aynı bileşeni kullanır; tek fark kategorinin adresten
 * gelmesi. Böylece filtre, sıralama ve kart tasarımı iki sayfada birebir aynı.
 */
const CategoryCoursesPage: React.FC = () => {
    const { categorySlug, subcategorySlug } = useParams<{
        categorySlug: string;
        subcategorySlug?: string;
    }>();

    return (
        <CatalogPage
            mode="category"
            categorySlug={categorySlug}
            subcategorySlug={subcategorySlug}
            // Kategori değiştiğinde bileşen sıfırdan kurulsun; eski kategorinin
            // filtreleri yeni sayfaya taşınmasın
            key={`${categorySlug}/${subcategorySlug || ''}`}
        />
    );
};

export default CategoryCoursesPage;

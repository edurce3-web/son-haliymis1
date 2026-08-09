import React from 'react';
import CatalogPage from '@/components/catalog/CatalogPage';

/**
 * /courses — tüm katalog.
 *
 * Arama ve kategori sayfalarıyla aynı bileşen. Arama terimi yokken kanonik
 * adres /courses olduğu için /search?q= boş hâli de buraya işaret eder;
 * böylece Google iki adreste aynı içeriği görmüş olmaz.
 */
const AllCourses: React.FC = () => <CatalogPage mode="search" />;

export default AllCourses;

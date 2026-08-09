import React from 'react';
import CatalogPage from '@/components/catalog/CatalogPage';

/**
 * /search — tüm katalogda arama.
 *
 * Filtreler, sıralama ve sayfalama CatalogPage'de; kategori sayfasıyla aynı
 * bileşeni paylaşıyor ki iki ekranın davranışı ayrışmasın.
 */
const SearchResults: React.FC = () => <CatalogPage mode="search" />;

export default SearchResults;

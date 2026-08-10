import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';

export interface NavSubcategory {
    id: number;
    name: string;
    slug: string;
    count: number;
}

export interface NavCategory {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    count: number;
    subcategories: NavSubcategory[];
}

/**
 * Kategori ağacı — üst menü ve katalog yan çubuğu aynı veriyi kullanır.
 *
 * Aktif filtreden bağımsızdır: kullanıcı bir kategori sayfasındayken diğer
 * kategorileri de görebilmeli. Sunucu tarafında 5 dakika, burada da uzun süre
 * önbelleklenir; kategori ağacı sık değişmez.
 */
export function useCategoryNav() {
    return useQuery<{ categories: NavCategory[] }>({
        queryKey: ['category-navigation'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/catalog/navigation`);
            if (!res.ok) throw new Error('Kategoriler alınamadı');
            return res.json();
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    });
}

export default useCategoryNav;

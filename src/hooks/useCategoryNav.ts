import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';

export interface NavSubcategory {
    /** Veritabanındaki category_id. Kategori henüz tabloya yazılamadıysa null
     *  olabilir; bu durumda kursa atanamaz ama menüde görünür. */
    id: number | null;
    /** Kararlı anahtar — React key ve karşılaştırmalar için (slug ile aynı). */
    key: string;
    name: string;
    slug: string;
    count: number;
}

export interface NavCategory extends Omit<NavSubcategory, 'count'> {
    icon: string | null;
    description: string | null;
    count: number;
    subcategories: NavSubcategory[];
}

/**
 * Kategori ağacı — platformdaki TEK kaynak.
 *
 * Sunucu tarafında ağaç db/categories.js dosyasından üretilir; veritabanından
 * yalnızca kurs sayıları ve category_id eşlemesi alınır. Bu yüzden tabloda
 * eski kayıtlar kalsa bile burada asla görünmezler.
 */
export function useCategoryNav() {
    return useQuery<{ categories: NavCategory[] }>({
        queryKey: ['category-navigation'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/catalog/navigation`);
            if (!res.ok) throw new Error('Kategoriler alınamadı');
            return res.json();
        },
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
    });
}

export default useCategoryNav;

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { CATEGORY_TREE } from '@/data/categoryTree';

export interface NavSubcategory {
    /** Veritabanındaki category_id. Kategori tabloya yazılamadıysa null olur;
     *  bu durumda kursa atanamaz ama menüde görünmeye devam eder. */
    id: number | null;
    name: string;
    slug: string;
    count: number;
}

export interface NavCategory extends NavSubcategory {
    icon: string | null;
    description: string | null;
    subcategories: NavSubcategory[];
}

interface ApiCategory {
    id: number | null;
    slug: string;
    count: number;
    subcategories?: Array<{ id: number | null; slug: string; count: number }>;
}

/**
 * Kategori ağacı — platformdaki TEK kaynak.
 *
 * GÖSTERİLEN LİSTE src/data/categoryTree.ts DOSYASINDAN GELİR, sunucudan değil.
 * Sunucudan yalnızca iki şey alınır ve slug üzerinden eşlenir:
 *   - category_id  (kurs/kitap formları gerçek id yazabilsin diye)
 *   - kurs sayıları
 *
 * Sunucunun cevabında dosyada olmayan bir kategori varsa TAMAMEN yok sayılır.
 * Bu yüzden veritabanında eski kayıtlar kalsa bile kullanıcı asla görmez.
 * Menü ayrıca ağ isteği beklemeden anında çizilir.
 */
export function useCategoryNav() {
    const query = useQuery<{ categories: ApiCategory[] }>({
        queryKey: ['category-navigation'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/catalog/navigation`);
            if (!res.ok) throw new Error('Kategori verileri alınamadı');
            return res.json();
        },
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
    });

    const categories: NavCategory[] = useMemo(() => {
        // Sunucudan gelen bilgiyi slug -> {id, count} olarak düzleştir
        const meta = new Map<string, { id: number | null; count: number }>();
        for (const cat of query.data?.categories || []) {
            if (cat?.slug) meta.set(cat.slug, { id: cat.id ?? null, count: Number(cat.count) || 0 });
            for (const sub of cat?.subcategories || []) {
                if (sub?.slug) meta.set(sub.slug, { id: sub.id ?? null, count: Number(sub.count) || 0 });
            }
        }

        return CATEGORY_TREE.map(parent => {
            const subcategories = parent.children.map(child => {
                const m = meta.get(child.slug);
                return {
                    id: m?.id ?? null,
                    name: child.name,
                    slug: child.slug,
                    count: m?.count ?? 0,
                };
            });

            const own = meta.get(parent.slug);
            return {
                id: own?.id ?? null,
                name: parent.name,
                slug: parent.slug,
                icon: parent.icon,
                description: parent.description,
                // Ana kategorinin sayısı sunucudan zaten alt dallar dahil geliyor;
                // gelmediyse alt dalların toplamına düşüyoruz.
                count: own?.count ?? subcategories.reduce((s, c) => s + c.count, 0),
                subcategories,
            };
        });
    }, [query.data]);

    return {
        ...query,
        // Ağaç yerelden geldiği için data hiçbir zaman boş dönmez
        data: { categories },
    };
}

export default useCategoryNav;

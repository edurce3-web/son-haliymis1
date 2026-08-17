import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cartAPI, enrollmentAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Kullanıcının sahip olduğu ve sepetinde bulunan kursların kimlikleri.
 *
 * Kurs kartlarının doğru butonu göstermesi için gerekiyor: satın alınmış bir
 * kursta "Satın al" yazması hatalı. Liste sayfada bir kez çekilip tüm kartlar
 * tarafından paylaşılıyor (react-query önbelleği), kart başına istek atılmıyor.
 */
export function useOwnedCourses() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const enrollments = useQuery({
        queryKey: ['enrolled-courses'],
        queryFn: () => enrollmentAPI.getEnrollments(),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });

    const cart = useQuery({
        queryKey: ['cart'],
        queryFn: () => cartAPI.getCart(),
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });

    // Sepet başka bir yerden değiştiğinde (kart, kurs sayfası, sepet sayfası)
    // listeyi tazele — aksi halde buton eski durumda kalıyor.
    useEffect(() => {
        const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
        window.addEventListener('cartUpdated', refresh);
        return () => window.removeEventListener('cartUpdated', refresh);
    }, [queryClient]);

    const toIdSet = (items: any): Set<number> => {
        const list = Array.isArray(items) ? items : items?.items;
        if (!Array.isArray(list)) return new Set();
        return new Set(
            list
                .map((row: any) => Number(row?.course_id ?? row?.id))
                .filter((id: number) => Number.isFinite(id))
        );
    };

    // Sahip olunan kurslarda ilerlemeyi de taşı — kart "Eğitime git" derken
    // kaldığı yeri gösterebilsin.
    const progressById = new Map<number, number>();
    const enrolled = enrollments.data?.items;
    if (Array.isArray(enrolled)) {
        for (const row of enrolled) {
            const id = Number(row?.course_id);
            if (Number.isFinite(id)) {
                progressById.set(id, Math.round(Number(row?.progress) || 0));
            }
        }
    }

    return {
        ownedIds: toIdSet(enrollments.data),
        cartIds: toIdSet(cart.data),
        progressById,
        /** Sahiplik henüz bilinmiyorken butonu yanlış etiketle göstermemek için */
        resolving: isAuthenticated && (enrollments.isLoading || cart.isLoading),
    };
}

export default useOwnedCourses;

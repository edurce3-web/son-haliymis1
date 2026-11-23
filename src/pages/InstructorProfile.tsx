import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, getCourseImageUrl } from '@/lib/api';
import { ProfileView, type ProfileData } from '@/components/profile/ProfileView';
import { ProfileNotFound, ProfileSkeleton } from './UserProfile';

/**
 * Eski eğitmen bağlantısı — /instructors/<id>.
 *
 * Tek profil sayfası /user/<slug>; numaradan adresi bulup oraya yönlendiriyor.
 * Sunucu adres bilgisini vermezse (eski sürüm) eğitmen verisini aynı
 * görünüme çevirip burada gösteriyor.
 */
type Resolved = { slug: string } | { data: ProfileData };

const InstructorProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data, isLoading, isError } = useQuery<Resolved>({
        queryKey: ['instructor-profile', id],
        queryFn: async () => {
            try {
                const r = await fetch(`${API_BASE_URL}/users/profile/by-id/${id}`);
                if (r.ok) {
                    const j = await r.json();
                    if (j?.slug) return { slug: j.slug };
                }
            } catch { /* eski sunucu: aşağıdaki yola düş */ }

            const res = await fetch(`${API_BASE_URL}/instructor/${id}`);
            if (!res.ok) throw new Error('notfound');
            const j = await res.json();
            if (!j?.profile) throw new Error('notfound');
            if (j.profile.slug) return { slug: j.profile.slug };
            return { data: adapt(j) };
        },
        enabled: Boolean(id) && id !== 'dashboard',
        retry: false,
    });

    if (isLoading) return <ProfileSkeleton />;
    if (isError || !data) return <ProfileNotFound />;
    if ('slug' in data) return <Navigate to={`/user/${data.slug}`} replace />;
    return <ProfileView data={data.data} />;
};

/** /api/instructor/:id yanıtını profil görünümünün biçimine çevirir. */
function adapt(j: any): ProfileData {
    const p = j.profile || {};
    const courses = (j.courses || []).map((c: any) => ({
        id: Number(c.id),
        title: c.title,
        slug: c.slug,
        summary: null,
        price: Number(c.price) || 0,
        level: null,
        rating: Number(c.rating) || 0,
        reviewCount: Number(c.review_count) || 0,
        studentCount: Number(c.student_count) || 0,
        hours: 0,
        categoryName: null,
        categorySlug: null,
        image: getCourseImageUrl(c.id, c.image_path),
    }));
    const reviews = courses.reduce((s: number, c: any) => s + c.reviewCount, 0);
    const links: Record<string, string> = {};
    for (const k of ['youtube', 'instagram', 'twitter', 'tiktok', 'facebook']) {
        if (/^https?:\/\//i.test(String(p[k] || ''))) links[k] = p[k];
    }
    return {
        user: {
            id: Number(p.id),
            name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            bio: p.bio || null,
            website: /^https?:\/\//i.test(String(p.website || '')) ? p.website : null,
            image: null,
        },
        role: courses.length > 0 ? 'instructor' : 'student',
        title: p.title || null,
        expertise: (p.expertise || []).map(String),
        links,
        categories: [],
        suggested: [],
        instructor: {
            courseCount: courses.length,
            totalStudents: Number(j.stats?.total_students) || 0,
            totalReviews: reviews,
            averageRating: Math.round((Number(j.stats?.avg_rating) || 0) * 10) / 10,
            totalHours: 0,
        },
        courses,
        learning: { enrolledCount: 0, completedCount: 0, courses: [] },
    };
}

export default InstructorProfile;

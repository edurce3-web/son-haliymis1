import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { ProfileView, type ProfileData } from '@/components/profile/ProfileView';

/** Herkese açık profil — /user/<slug>. Görünüm ProfileView'da. */
const UserProfile: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const { data, isLoading, isError } = useQuery<ProfileData>({
        queryKey: ['user-profile', slug],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/users/profile/${slug}`);
            if (res.status === 404) throw new Error('notfound');
            if (!res.ok) throw new Error('Profil alınamadı');
            return res.json();
        },
        enabled: !!slug,
        retry: false,
    });

    useSeo(data?.seo, [data?.seo?.canonical]);

    if (isLoading) return <ProfileSkeleton />;
    if (isError || !data) return <ProfileNotFound />;
    return <ProfileView data={data} />;
};

export const ProfileSkeleton: React.FC = () => (
    <div className="min-h-screen bg-white" aria-busy="true">
        <div className=" bg-[#F5F6F8] h-[260px] animate-pulse" />
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 grid lg:grid-cols-[1fr_300px] gap-10">
            <div className="space-y-3">
                <div className="h-6 w-40  bg-[#F1F3F5]" />
                <div className="h-4 w-full max-w-[560px]  bg-[#F5F6F8]" />
                <div className="h-4 w-4/5 max-w-[480px]  bg-[#F5F6F8]" />
            </div>
            <div className="h-40  bg-[#F5F6F8]" />
        </div>
    </div>
);

export const ProfileNotFound: React.FC = () => (
    <div className="min-h-[70vh] bg-white flex items-center justify-center px-4 font-jakarta">
        <div className="text-center max-w-md">
            <h1 className="text-[22px] font-extrabold text-[#0A2A1A] mb-2">Profil bulunamadı</h1>
            <p className="text-[14.5px] text-[#6B7280] mb-6">Bu profil kaldırılmış ya da adresi değişmiş olabilir.</p>
            <Link to="/courses" className="h-11 px-5 inline-flex items-center  bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14px] font-bold">
                Kurslara göz at
            </Link>
        </div>
    </div>
);

export default UserProfile;

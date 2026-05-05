import React from 'react';
import { BookOpen, Users, DollarSign, Star } from 'lucide-react';
import StatCard from './StatCard';

interface InstructorStatsData {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeCampaigns: number;
}

interface InstructorStatsProps {
  stats: InstructorStatsData;
}

const InstructorStats: React.FC<InstructorStatsProps> = ({ stats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatCard
      title="Toplam Kurslar"
      value={stats.totalCourses}
      icon={BookOpen}
      color="text-blue-600"
      description="Aktif kurslarınız"
    />
    <StatCard
      title="Toplam Öğrenci"
      value={stats.totalStudents}
      icon={Users}
      color="text-green-600"
      description="Kayıtlı öğrenciler"
    />
    <StatCard
      title="Toplam Gelir"
      value={`₺${stats.totalRevenue.toLocaleString()}`}
      icon={DollarSign}
      color="text-yellow-600"
      description="Bu ay"
    />
    <StatCard
      title="Ortalama Puan"
      value={`${stats.averageRating.toFixed(1)}/5`}
      icon={Star}
      color="text-purple-600"
      description="Öğrenci değerlendirmeleri"
    />
  </div>
);

export default InstructorStats;

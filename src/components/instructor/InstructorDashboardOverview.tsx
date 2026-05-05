import React from 'react';
import { Badge } from '../ui/badge';
import { Award } from 'lucide-react';
import InstructorStats from './InstructorStats';
import PerformanceSummary from './PerformanceSummary';
import RecentActivity from './RecentActivity';

interface InstructorStatsData {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeCampaigns: number;
}

interface User {
  first_name?: string;
  last_name?: string;
}

interface InstructorDashboardOverviewProps {
  user: User | null;
  stats: InstructorStatsData;
  onTabChange: (tab: string) => void;
}

const InstructorDashboardOverview: React.FC<InstructorDashboardOverviewProps> = ({ 
  user, 
  stats, 
  onTabChange 
}) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Eğitmen Dashboard</h1>
        <p className="text-muted-foreground">
          Hoş geldiniz, {user?.first_name} {user?.last_name}
        </p>
      </div>
      <Badge variant="secondary" className="text-sm">
        <Award className="h-4 w-4 mr-1" />
        Eğitmen
      </Badge>
    </div>


    <InstructorStats stats={stats} />

    <div className="grid gap-4 md:grid-cols-2">
      <PerformanceSummary 
        completionRate={stats.completionRate}
        activeCampaigns={stats.activeCampaigns}
        totalStudents={stats.totalStudents}
      />
      <RecentActivity />
    </div>
  </div>
);

export default InstructorDashboardOverview;

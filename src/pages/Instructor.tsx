import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

// Import instructor components
import InstructorCourses from './instructor/InstructorCourses';
import InstructorStudents from './instructor/InstructorStudents';
import InstructorCampaigns from './instructor/InstructorCampaigns';
import InstructorSettings from './instructor/InstructorSettings';
import InstructorDashboardOverview from '../components/instructor/InstructorDashboardOverview';

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeCampaigns: number;
}

const Instructor: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 5,
    totalStudents: 1250,
    totalRevenue: 45000,
    averageRating: 4.8,
    completionRate: 85,
    activeCampaigns: 3
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Eğitmen sayfasına erişmek için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    if (!user?.is_instructor) {
      toast.error('Bu sayfaya erişmek için eğitmen olmalısınız');
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  if (!user || !token) {
    return null;
  }


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Kurslarım</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Öğrenciler</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Kampanyalar</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Ayarlar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <InstructorDashboardOverview
            user={user}
            stats={stats}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <InstructorCourses />
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <InstructorStudents />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <InstructorCampaigns />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <InstructorSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Instructor;

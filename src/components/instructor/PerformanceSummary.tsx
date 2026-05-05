import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp } from 'lucide-react';

interface PerformanceSummaryProps {
  completionRate: number;
  activeCampaigns: number;
  totalStudents: number;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ 
  completionRate, 
  activeCampaigns, 
  totalStudents 
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Performans Özeti
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <span>Kurs Tamamlama Oranı</span>
        <Badge variant="outline">{completionRate}%</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span>Aktif Kampanyalar</span>
        <Badge variant="outline">{activeCampaigns}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span>Bu Ay Yeni Kayıtlar</span>
        <Badge variant="outline">+{Math.floor(totalStudents * 0.1)}</Badge>
      </div>
    </CardContent>
  </Card>
);

export default PerformanceSummary;

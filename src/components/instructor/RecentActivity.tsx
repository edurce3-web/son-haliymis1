import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MessageSquare } from 'lucide-react';

const RecentActivity: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Son Aktiviteler
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">Yeni öğrenci kaydı</span>
          <span className="text-xs text-muted-foreground ml-auto">2 saat önce</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Kurs değerlendirmesi alındı</span>
          <span className="text-xs text-muted-foreground ml-auto">5 saat önce</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm">Kampanya başlatıldı</span>
          <span className="text-xs text-muted-foreground ml-auto">1 gün önce</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RecentActivity;

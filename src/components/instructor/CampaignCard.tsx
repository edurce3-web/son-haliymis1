import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Target, TrendingUp, Users, DollarSign, Edit, Trash2, Play, Pause } from 'lucide-react';

interface CampaignCardProps {
  campaign: {
    id: number;
    name: string;
    type: string;
    discount: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'paused' | 'ended';
    clicks: number;
    conversions: number;
    revenue: number;
    budget: number;
    spent: number;
  };
  onEdit?: (campaignId: number) => void;
  onDelete?: (campaignId: number) => void;
  onToggleStatus?: (campaignId: number) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'paused': return 'Duraklatıldı';
      case 'ended': return 'Sona Erdi';
      default: return 'Bilinmiyor';
    }
  };

  const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100) : 0;
  const budgetUsed = campaign.budget > 0 ? (campaign.spent / campaign.budget * 100) : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {campaign.type} - %{campaign.discount} indirim
            </p>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`}></div>
            <span>{getStatusText(campaign.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{campaign.clicks} tıklama</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-green-600" />
            <span>{campaign.conversions} dönüşüm</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Dönüşüm Oranı</span>
            <span>{conversionRate.toFixed(1)}%</span>
          </div>
          <Progress value={conversionRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bütçe Kullanımı</span>
            <span>₺{campaign.spent.toLocaleString()} / ₺{campaign.budget.toLocaleString()}</span>
          </div>
          <Progress value={budgetUsed} className="h-2" />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="font-semibold text-green-600">
            ₺{campaign.revenue.toLocaleString()} gelir
          </span>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onToggleStatus?.(campaign.id)}
            >
              {campaign.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit?.(campaign.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete?.(campaign.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;

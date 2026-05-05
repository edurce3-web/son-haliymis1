import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CampaignFormProps {
  campaign: {
    name: string;
    description: string;
    type: string;
    discount: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    targetCourse: string;
    budget: string;
  };
  onInputChange: (field: string, value: string | Date | undefined) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  onInputChange,
  onSave,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Kampanya Oluştur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Kampanya Adı</Label>
            <Input
              id="name"
              value={campaign.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Kampanya adını girin"
            />
          </div>
          <div>
            <Label htmlFor="type">Kampanya Türü</Label>
            <Select value={campaign.type} onValueChange={(value) => onInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">İndirim</SelectItem>
                <SelectItem value="flash">Flaş Satış</SelectItem>
                <SelectItem value="bundle">Paket İndirim</SelectItem>
                <SelectItem value="seasonal">Mevsimsel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            value={campaign.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Kampanya açıklamasını girin"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="discount">İndirim Oranı (%)</Label>
            <Input
              id="discount"
              type="number"
              value={campaign.discount}
              onChange={(e) => onInputChange('discount', e.target.value)}
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
          <div>
            <Label htmlFor="budget">Bütçe (₺)</Label>
            <Input
              id="budget"
              type="number"
              value={campaign.budget}
              onChange={(e) => onInputChange('budget', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Başlangıç Tarihi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {campaign.startDate ? format(campaign.startDate, "PPP", { locale: tr }) : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={campaign.startDate}
                  onSelect={(date) => onInputChange('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Bitiş Tarihi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {campaign.endDate ? format(campaign.endDate, "PPP", { locale: tr }) : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={campaign.endDate}
                  onSelect={(date) => onInputChange('endDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="targetCourse">Hedef Kurs</Label>
          <Select value={campaign.targetCourse} onValueChange={(value) => onInputChange('targetCourse', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kurs seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kurslar</SelectItem>
              <SelectItem value="course1">Python ile Veri Bilimi</SelectItem>
              <SelectItem value="course2">React Geliştiricisi Ol</SelectItem>
              <SelectItem value="course3">Finansal Okuryazarlık 101</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              İptal
            </Button>
          )}
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-1" />
            Kampanyayı Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;

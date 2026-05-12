import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronRight, Save } from 'lucide-react';

interface CourseFormProps {
  course: {
    title: string;
    description: string;
    category: string;
    level: string;
    price: string;
  };
  step: number;
  onInputChange: (field: string, value: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSave?: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  step,
  onInputChange,
  onNextStep,
  onPrevStep,
  onSave
}) => {
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Kurs Başlığı</Label>
              <Input
                id="title"
                value={course.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="Kurs başlığını girin"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={course.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder="Kurs açıklamasını girin"
                rows={4}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={course.category} onValueChange={(value) => onInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Yazılım</SelectItem>
                  <SelectItem value="2">Tasarım</SelectItem>
                  <SelectItem value="3">İş Dünyası</SelectItem>
                  <SelectItem value="4">Pazarlama</SelectItem>
                  <SelectItem value="5">Kişisel Gelişim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Alt Kategori (Opsiyonel)</Label>
              <Select value={course.subcategory || ""} onValueChange={(value) => onInputChange('subcategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alt kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Web Geliştirme</SelectItem>
                  <SelectItem value="7">Mobil Geliştirme</SelectItem>
                  <SelectItem value="8">Grafik Tasarım</SelectItem>
                  <SelectItem value="9">UI/UX Tasarım</SelectItem>
                  <SelectItem value="10">Dijital Pazarlama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level">Seviye</Label>
              <Select value={course.level} onValueChange={(value) => onInputChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seviye seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Başlangıç">Başlangıç</SelectItem>
                  <SelectItem value="Orta">Orta</SelectItem>
                  <SelectItem value="İleri">İleri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Fiyat (₺)</Label>
              <Input
                id="price"
                type="number"
                value={course.price}
                onChange={(e) => onInputChange('price', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Kurs Oluştur - Adım {step}/2</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}
        
        <div className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={onPrevStep}>
              Geri
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={onNextStep} className="ml-auto">
              İleri
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={onSave} className="ml-auto">
              <Save className="h-4 w-4 mr-1" />
              Kaydet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseForm;

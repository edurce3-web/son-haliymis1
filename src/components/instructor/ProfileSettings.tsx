import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Camera, Save } from 'lucide-react';

interface ProfileSettingsProps {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    bio: string;
    title: string;
    company: string;
    website: string;
    linkedin: string;
    twitter: string;
    phone: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSave?: () => void;
  onAvatarChange?: (file: File) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  onInputChange,
  onSave,
  onAvatarChange
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>{profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  Fotoğraf Değiştir
                </span>
              </Button>
            </Label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">Ad</Label>
            <Input
              id="first_name"
              value={profile.first_name}
              onChange={(e) => onInputChange('first_name', e.target.value)}
              placeholder="Adınız"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Soyad</Label>
            <Input
              id="last_name"
              value={profile.last_name}
              onChange={(e) => onInputChange('last_name', e.target.value)}
              placeholder="Soyadınız"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        <div>
          <Label htmlFor="title">Ünvan</Label>
          <Input
            id="title"
            value={profile.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Örn: Senior Yazılım Geliştirici"
          />
        </div>

        <div>
          <Label htmlFor="bio">Biyografi</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => onInputChange('bio', e.target.value)}
            placeholder="Kendiniz hakkında kısa bir açıklama yazın"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Şirket</Label>
            <Input
              id="company"
              value={profile.company}
              onChange={(e) => onInputChange('company', e.target.value)}
              placeholder="Şirket adı"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              placeholder="+90 555 123 45 67"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profile.website}
              onChange={(e) => onInputChange('website', e.target.value)}
              placeholder="https://website.com"
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={profile.linkedin}
              onChange={(e) => onInputChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/kullanici"
            />
          </div>
          <div>
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={profile.twitter}
              onChange={(e) => onInputChange('twitter', e.target.value)}
              placeholder="@kullanici"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Değişiklikleri Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;

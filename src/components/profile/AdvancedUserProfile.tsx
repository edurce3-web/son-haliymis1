import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  User, Settings, Trophy, Star, Shield, Bell, Eye, Camera, Edit3, Save, X,
  Crown, Fire, Award, Medal, Sparkles, Target, Heart, Zap, Volume2, Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  website?: string;
  total_courses: number;
  completed_courses: number;
  total_hours: number;
  current_streak: number;
  max_streak: number;
  points: number;
  level: number;
}

interface Achievement {
  achievement_id: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

interface UserSettings {
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_marketing: boolean;
  privacy_profile: 'public' | 'friends' | 'private';
  privacy_courses: 'public' | 'friends' | 'private';
  language: string;
  theme: 'light' | 'dark' | 'system';
  autoplay_videos: boolean;
  video_quality: 'auto' | '720p' | '1080p';
}

export const AdvancedUserProfile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/profile/achievements`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/profile/settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      toast.success('Profil güncellendi');
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<UserSettings>) => {
      const response = await fetch(`${API_BASE_URL}/profile/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Ayarlar güncellendi');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profil fotoğrafı güncellendi');
    },
  });

  const handleEditProfile = () => {
    setEditForm(profile || {});
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      trophy: <Trophy className="w-6 h-6" />,
      star: <Star className="w-6 h-6" />,
      crown: <Crown className="w-6 h-6" />,
      fire: <Fire className="w-6 h-6" />,
      zap: <Zap className="w-6 h-6" />,
      heart: <Heart className="w-6 h-6" />,
      target: <Target className="w-6 h-6" />,
      medal: <Medal className="w-6 h-6" />,
      sparkles: <Sparkles className="w-6 h-6" />,
    };
    return icons[iconName] || <Award className="w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <CardContent className="relative p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h1>
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>Seviye {profile?.level}</span>
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">@{profile?.username}</p>
              {profile?.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile?.total_courses}</div>
                  <div className="text-sm text-gray-600">Toplam Kurs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile?.completed_courses}</div>
                  <div className="text-sm text-gray-600">Tamamlanan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{profile?.total_hours}h</div>
                  <div className="text-sm text-gray-600">Öğrenme Saati</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{profile?.current_streak}</div>
                  <div className="text-sm text-gray-600">Günlük Seri</div>
                </div>
              </div>
            </div>

            <Button onClick={handleEditProfile} variant="outline" className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>Profili Düzenle</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Başarımlar</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Ayarlar</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Güvenlik</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kişisel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ad Soyad</Label>
                    <p className="text-sm text-gray-600 mt-1">{profile?.full_name}</p>
                  </div>
                  <div>
                    <Label>Kullanıcı Adı</Label>
                    <p className="text-sm text-gray-600 mt-1">@{profile?.username}</p>
                  </div>
                </div>
                <div>
                  <Label>E-posta</Label>
                  <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <Label>Telefon</Label>
                    <p className="text-sm text-gray-600 mt-1">{profile.phone}</p>
                  </div>
                )}
                {profile?.location && (
                  <div>
                    <Label>Konum</Label>
                    <p className="text-sm text-gray-600 mt-1">{profile.location}</p>
                  </div>
                )}
                {profile?.website && (
                  <div>
                    <Label>Website</Label>
                    <a href={profile.website} className="text-sm text-blue-600 hover:underline mt-1 block">
                      {profile.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Öğrenme İlerlemesi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Kurs Tamamlama</Label>
                    <span className="text-sm text-gray-600">
                      {profile?.completed_courses}/{profile?.total_courses}
                    </span>
                  </div>
                  <Progress 
                    value={profile?.total_courses ? (profile.completed_courses / profile.total_courses) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">{profile?.points}</div>
                    <div className="text-xs text-gray-600">Toplam Puan</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-semibold text-orange-600">{profile?.max_streak}</div>
                    <div className="text-xs text-gray-600">En Uzun Seri</div>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center space-x-2">
                    <Fire className="w-4 h-4 text-orange-500" />
                    <span>Günlük Seri</span>
                  </Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((profile?.current_streak || 0) / 30, 1) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{profile?.current_streak} gün</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements?.items?.map((achievement: Achievement) => (
              <Card key={achievement.achievement_id} className={`relative overflow-hidden ${achievement.unlocked_at ? 'border-2' : 'opacity-60'}`}>
                <div className={`absolute top-0 right-0 w-16 h-16 ${getRarityColor(achievement.rarity)} opacity-20 transform rotate-45 translate-x-8 -translate-y-8`}></div>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked_at ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm">{achievement.title}</h3>
                        <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                      
                      {achievement.progress !== undefined && achievement.max_progress && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>İlerleme</span>
                            <span>{achievement.progress}/{achievement.max_progress}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.max_progress) * 100} 
                            className="h-1"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-600 font-medium">+{achievement.points} puan</span>
                        {achievement.unlocked_at && (
                          <span className="text-green-600">
                            {new Date(achievement.unlocked_at).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Bildirim Ayarları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>E-posta Bildirimleri</Label>
                    <p className="text-sm text-gray-600">Kurs güncellemeleri ve duyurular</p>
                  </div>
                  <Switch
                    checked={settings?.notifications_email}
                    onCheckedChange={(checked) => handleSettingChange('notifications_email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Bildirimleri</Label>
                    <p className="text-sm text-gray-600">Anlık bildirimler</p>
                  </div>
                  <Switch
                    checked={settings?.notifications_push}
                    onCheckedChange={(checked) => handleSettingChange('notifications_push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pazarlama E-postaları</Label>
                    <p className="text-sm text-gray-600">Özel teklifler ve kampanyalar</p>
                  </div>
                  <Switch
                    checked={settings?.notifications_marketing}
                    onCheckedChange={(checked) => handleSettingChange('notifications_marketing', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Gizlilik Ayarları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profil Görünürlüğü</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings?.privacy_profile}
                    onChange={(e) => handleSettingChange('privacy_profile', e.target.value)}
                  >
                    <option value="public">Herkese Açık</option>
                    <option value="friends">Sadece Arkadaşlar</option>
                    <option value="private">Özel</option>
                  </select>
                </div>
                <div>
                  <Label>Kurs Listesi</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings?.privacy_courses}
                    onChange={(e) => handleSettingChange('privacy_courses', e.target.value)}
                  >
                    <option value="public">Herkese Açık</option>
                    <option value="friends">Sadece Arkadaşlar</option>
                    <option value="private">Özel</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5" />
                  <span>Video Ayarları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Otomatik Oynatma</Label>
                    <p className="text-sm text-gray-600">Videoları otomatik başlat</p>
                  </div>
                  <Switch
                    checked={settings?.autoplay_videos}
                    onCheckedChange={(checked) => handleSettingChange('autoplay_videos', checked)}
                  />
                </div>
                <div>
                  <Label>Video Kalitesi</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings?.video_quality}
                    onChange={(e) => handleSettingChange('video_quality', e.target.value)}
                  >
                    <option value="auto">Otomatik</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Görünüm Ayarları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tema</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings?.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <option value="light">Açık Tema</option>
                    <option value="dark">Koyu Tema</option>
                    <option value="system">Sistem Ayarı</option>
                  </select>
                </div>
                <div>
                  <Label>Dil</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings?.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Güvenlik ayarları henüz geliştirme aşamasındadır. İki faktörlü kimlik doğrulama ve şifre değiştirme özellikleri yakında eklenecektir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ad Soyad</Label>
              <Input
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Biyografi</Label>
              <Textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Konum</Label>
              <Input
                value={editForm.location || ''}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={editForm.website || ''}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

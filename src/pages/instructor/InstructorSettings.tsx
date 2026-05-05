import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { profileAPI } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import ProfileSettings from "@/components/instructor/ProfileSettings";

const InstructorSettings = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız");
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    title: "",
    company: "",
    website: "",
    linkedin: "",
    twitter: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    courseUpdates: true,
    studentMessages: true,
    systemAlerts: true,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
    allowedDevices: "5",
  });

  const [billing, setBilling] = useState({
    paymentMethod: "credit-card",
    autoWithdraw: true,
    withdrawalThreshold: "100",
    taxInfo: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const res = await profileAPI.getInstructorProfile(user.user_id);
        const u = res.user || res;
        setProfile(prev => ({
          ...prev,
          firstName: u.first_name || "",
          lastName: u.last_name || "",
          email: u.email || "",
          bio: u.bio || "",
          website: u.website || "",
        }));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user?.user_id]);

  const handleProfileUpdate = async () => {
    if (!user?.user_id) return;
    try {
      await profileAPI.updateInstructorProfile(user.user_id, {
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        bio: profile.bio,
        website: profile.website,
      });
      toast.success("Profil başarıyla güncellendi!");
    } catch (e) {
      toast.error("Profil güncellenemedi");
    }
  };

  const handleNotificationUpdate = () => {
    toast.success("Bildirim ayarları kaydedildi!");
  };

  const handleSecurityUpdate = () => {
    toast.success("Güvenlik ayarları güncellendi!");
  };

  const handlePasswordChange = () => {
    toast.success("Şifre başarıyla değiştirildi!");
  };

  const handleAvatarChange = (file: File) => {
    toast.success("Profil fotoğrafı güncellendi!");
  };

  const stats = [
    { label: "Toplam Öğrenci", value: "4,081", icon: User },
    { label: "Ortalama Puan", value: "4.8", icon: Star },
    { label: "Toplam Gelir", value: "₺24,180", icon: TrendingUp },
    { label: "Aktif Kurslar", value: "3", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Eğitmen Ayarları</h1>
          <p className="text-muted-foreground">
            Hesap bilgilerinizi ve tercihlerinizi yönetin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-course">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                      <AvatarFallback className="text-2xl">AY</AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={() => handleAvatarChange(new File([], ""))}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold mt-4">{profile.firstName} {profile.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{profile.title}</p>
                  <Badge className="mt-2 bg-success text-success-foreground">
                    Doğrulanmış Eğitmen
                  </Badge>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <stat.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <span className="font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
                <TabsTrigger value="security">Güvenlik</TabsTrigger>
                <TabsTrigger value="billing">Ödeme</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <ProfileSettings
                  profile={{
                    first_name: profile.firstName,
                    last_name: profile.lastName,
                    email: profile.email,
                    phone: profile.phone,
                    bio: profile.bio,
                    title: profile.title,
                    company: profile.company,
                    website: profile.website,
                    linkedin: profile.linkedin,
                    twitter: profile.twitter
                  }}
                  onInputChange={(field: string, value: string) => {
                    const fieldMap: { [key: string]: string } = {
                      'first_name': 'firstName',
                      'last_name': 'lastName',
                      'email': 'email',
                      'phone': 'phone',
                      'bio': 'bio',
                      'title': 'title',
                      'company': 'company',
                      'website': 'website',
                      'linkedin': 'linkedin',
                      'twitter': 'twitter'
                    };
                    const mappedField = fieldMap[field] || field;
                    setProfile(prev => ({ ...prev, [mappedField]: value }));
                  }}
                  onSave={handleProfileUpdate}
                  onAvatarChange={handleAvatarChange}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Bildirim Ayarları</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>E-posta Bildirimleri</Label>
                          <p className="text-sm text-muted-foreground">Önemli güncellemeler için e-posta alın</p>
                        </div>
                        <Switch
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Push Bildirimleri</Label>
                          <p className="text-sm text-muted-foreground">Tarayıcı bildirimleri alın</p>
                        </div>
                        <Switch
                          checked={notifications.pushNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Pazarlama E-postaları</Label>
                          <p className="text-sm text-muted-foreground">Yeni özellikler ve promosyonlar hakkında bilgi alın</p>
                        </div>
                        <Switch
                          checked={notifications.marketingEmails}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleNotificationUpdate}>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Güvenlik Ayarları</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>İki Faktörlü Doğrulama</Label>
                          <p className="text-sm text-muted-foreground">Hesabınız için ek güvenlik katmanı</p>
                        </div>
                        <Switch
                          checked={security.twoFactorAuth}
                          onCheckedChange={(checked) =>
                            setSecurity(prev => ({ ...prev, twoFactorAuth: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Giriş Uyarıları</Label>
                          <p className="text-sm text-muted-foreground">Yeni cihazlardan giriş yapıldığında bildirim alın</p>
                        </div>
                        <Switch
                          checked={security.loginAlerts}
                          onCheckedChange={(checked) =>
                            setSecurity(prev => ({ ...prev, loginAlerts: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Mevcut Şifre</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Yeni Şifre</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handlePasswordChange}>
                        Şifreyi Değiştir
                      </Button>
                      <Button onClick={handleSecurityUpdate}>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Ödeme Ayarları</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Ödeme ayarları yakında eklenecek.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorSettings;
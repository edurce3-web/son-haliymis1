import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Eye,
  MousePointer,
  ShoppingCart,
  Star,
  Copy,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { instructorsAPI } from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import CampaignCard from "@/components/instructor/CampaignCard";
import CampaignForm from "@/components/instructor/CampaignForm";
import InstructorStats from "@/components/instructor/InstructorStats";

const InstructorCampaigns = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız");
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    targetCourses: [] as string[],
    maxUses: "",
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<Array<{ id: number; title: string }>>([]);

  useEffect(() => {
    if (!user?.user_id) return;
    const load = async () => {
      try {
        const [campsRes, coursesRes] = await Promise.all([
          instructorsAPI.getCampaigns(user.user_id),
          instructorsAPI.getCourses(user.user_id),
        ]);
        setCampaigns(campsRes.items || campsRes);
        setMyCourses((coursesRes.items || coursesRes).map((c: any) => ({ id: c.id, title: c.title })));
      } catch (e) {
        console.error(e);
        toast.error("Kampanyalar yüklenemedi");
      }
    };
    load();
  }, [user?.user_id]);

  const campaignsStatic = [
    {
      id: 1,
      name: "Yılbaşı Mega İndirimi",
      description: "Tüm kurslarda %50'ye varan indirim fırsatı",
      discount: "50%",
      startDate: "2024-12-25",
      endDate: "2025-01-05",
      status: "active",
      used: 145,
      maxUses: 500,
      revenue: 25430.50,
      courses: ["Web Geliştirme Kursu", "React Masterclass"]
    },
    {
      id: 2,
      name: "Erken Kuş İndirimi",
      description: "İlk 100 kişiye özel %30 indirim",
      discount: "30%",
      startDate: "2024-11-01",
      endDate: "2024-11-30",
      status: "completed",
      used: 100,
      maxUses: 100,
      revenue: 15670.00,
      courses: ["UI/UX Tasarım Kursu"]
    },
    {
      id: 3,
      name: "Bahar Kampanyası",
      description: "Bahar aylarına özel indirim kampanyası",
      discount: "25%",
      startDate: "2025-03-01",
      endDate: "2025-05-31",
      status: "scheduled",
      used: 0,
      maxUses: 300,
      revenue: 0,
      courses: ["Tüm Kurslar"]
    }
  ];

  // fallback: if no courses from API, show empty list

  const handleCreateCampaign = async () => {
    if (!user?.user_id) return toast.error("Önce giriş yapın");
    if (!newCampaign.name || !newCampaign.discountValue || !newCampaign.startDate || !newCampaign.endDate) {
      return toast.error("Zorunlu alanları doldurun");
    }
    try {
      const payload = {
        name: newCampaign.name,
        description: newCampaign.description,
        discountType: newCampaign.discountType as any,
        discountValue: Number(newCampaign.discountValue),
        startDate: newCampaign.startDate,
        endDate: newCampaign.endDate,
        targetCourses: newCampaign.targetCourses.map((id) => Number(id)),
        maxUses: newCampaign.maxUses ? Number(newCampaign.maxUses) : undefined,
      };
      await instructorsAPI.createCampaign(user.user_id, payload);
      toast.success("Kampanya oluşturuldu");
      const campsRes = await instructorsAPI.getCampaigns(user.user_id);
      setCampaigns(campsRes.items || campsRes);
      setNewCampaign({
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
        targetCourses: [],
        maxUses: "",
      });
    } catch (e: any) {
      console.error(e);
      toast.error("Kampanya oluşturulamadı");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewCampaign(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
      case "completed":
        return <Badge className="bg-muted text-muted-foreground">Tamamlandı</Badge>;
      case "scheduled":
        return <Badge className="bg-warning text-warning-foreground">Planlandı</Badge>;
      default:
        return <Badge>Bilinmeyen</Badge>;
    }
  };

  const duplicateCampaign = (campaignId: number) => {
    toast.success("Kampanya kopyalandı!", {
      description: "Kopyalanan kampanyayı düzenleyebilirsiniz."
    });
  };

  const deleteCampaign = (campaignId: number) => {
    toast.success("Kampanya silindi!");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Kampanya Oluşturma</h1>
          <p className="text-muted-foreground">
            Kurslarınız için özel indirim kampanyaları oluşturun ve yönetin
          </p>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
            <TabsTrigger value="create">Yeni Kampanya</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Stats */}
            <InstructorStats 
              stats={{
                totalCourses: myCourses.length,
                totalStudents: 0,
                totalRevenue: 41100,
                averageRating: 0,
                completionRate: campaigns.length || 3,
                activeCampaigns: campaigns.filter(c => c.status === 'active').length || 1
              }}
            />

            {/* Campaign List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(campaigns.length ? campaigns : campaignsStatic).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    type: "discount",
                    discount: parseFloat(campaign.discount?.replace('%', '') || '0'),
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    status: campaign.status === 'completed' ? 'ended' : campaign.status === 'scheduled' ? 'paused' : campaign.status as 'active' | 'paused' | 'ended',
                    clicks: campaign.used || 0,
                    conversions: Math.floor((campaign.used || 0) * 0.7),
                    revenue: campaign.revenue,
                    budget: campaign.maxUses * 50,
                    spent: campaign.used * 50
                  }}
                  onEdit={() => toast.info("Düzenleme özelliği yakında eklenecek")}
                  onDelete={async () => {
                    if (!user?.user_id) return;
                    try {
                      await instructorsAPI.deleteCampaign(user.user_id, campaign.id);
                      toast.success("Kampanya silindi");
                      const campsRes = await instructorsAPI.getCampaigns(user.user_id);
                      setCampaigns(campsRes.items || campsRes);
                    } catch (e) {
                      toast.error("Silme başarısız");
                    }
                  }}
                  onToggleStatus={() => toast.info("Durum değiştirme özelliği yakında eklenecek")}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CampaignForm
              campaign={{
                name: newCampaign.name,
                description: newCampaign.description,
                type: newCampaign.discountType,
                discount: newCampaign.discountValue,
                startDate: newCampaign.startDate ? new Date(newCampaign.startDate) : undefined,
                endDate: newCampaign.endDate ? new Date(newCampaign.endDate) : undefined,
                targetCourse: newCampaign.targetCourses.join(','),
                budget: newCampaign.maxUses
              }}
              onInputChange={(field: string, value: string | Date | undefined) => {
                if (value instanceof Date) {
                  handleInputChange(field, value.toISOString().split('T')[0]);
                } else {
                  handleInputChange(field, value || "");
                }
              }}
              onSave={handleCreateCampaign}
              onCancel={() => {
                setNewCampaign({
                  name: "",
                  description: "",
                  discountType: "percentage",
                  discountValue: "",
                  startDate: "",
                  endDate: "",
                  targetCourses: [],
                  maxUses: "",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-course">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Kampanya Performansı</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{campaign.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((campaign.used / campaign.maxUses) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${(campaign.used / campaign.maxUses) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{campaign.used} kullanım</span>
                          <span>₺{campaign.revenue.toLocaleString()} gelir</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-course">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Gelir Analizi</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">₺41,100</div>
                      <div className="text-sm text-muted-foreground">Toplam Kampanya Geliri</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Ortalama İndirim:</span>
                        <span className="font-semibold">42%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En Başarılı Kampanya:</span>
                        <span className="font-semibold">Yılbaşı Mega İndirimi</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Toplam Kullanım:</span>
                        <span className="font-semibold">245 kez</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dönüşüm Oranı:</span>
                        <span className="font-semibold text-success">73%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-course">
              <CardHeader>
                <CardTitle>Kampanya Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.filter(c => c.status === "completed").map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                          <Gift className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(campaign.startDate), "dd MMM", { locale: tr })} - {format(new Date(campaign.endDate), "dd MMM yyyy", { locale: tr })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-success">₺{campaign.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{campaign.used} kullanım</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorCampaigns;
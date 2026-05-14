import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  Bell,
  BellRing,
  BellOff,
  Send,
  Users,
  BookOpen,
  DollarSign,
  Star,
  MessageSquare,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Plus,
  Settings,
  Smartphone,
  Mail,
  Globe,
  Zap,
  Target,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  notification_id: string;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  clicked: boolean;
  delivered: boolean;
  delivery_method: ('push' | 'email' | 'sms' | 'in_app')[];
  scheduled_for?: string;
  created_at: string;
  read_at?: string;
  action_url?: string;
  image_url?: string;
  data?: Record<string, any>;
}

interface NotificationTemplate {
  template_id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  variables: string[];
  enabled: boolean;
  delivery_methods: string[];
}

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  course_updates: boolean;
  payment_notifications: boolean;
  marketing_emails: boolean;
  system_alerts: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.user_id, filterType, filterRead, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: filterType,
        read: filterRead,
        search: searchQuery
      });
      const response = await fetch(`/api/notifications/${user?.user_id}?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  // Fetch notification settings
  const { data: settings } = useQuery({
    queryKey: ['notification-settings', user?.user_id],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/settings/${user?.user_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  // Fetch notification templates (admin)
  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: user?.is_admin
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Bildirim silindi');
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch(`/api/notifications/settings/${user?.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Ayarlar güncellendi');
    }
  });

  // Send notification mutation (admin)
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: {
      title: string;
      message: string;
      type: string;
      priority: string;
      target_users: number[];
      delivery_methods: string[];
      scheduled_for?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationData)
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success('Bildirim gönderildi');
    }
  });

  // Send push notification
  const sendPushNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const pushNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        image: notification.image_url,
        tag: notification.notification_id,
        requireInteraction: notification.priority === 'urgent',
        actions: notification.action_url ? [
          { action: 'view', title: 'Görüntüle' },
          { action: 'dismiss', title: 'Kapat' }
        ] : undefined
      });

      pushNotification.onclick = () => {
        if (notification.action_url) {
          window.open(notification.action_url, '_blank');
        }
        markAsReadMutation.mutate(notification.notification_id);
      };
    }
  };

  const NotificationCard: React.FC<{ notification: Notification }> = ({ notification }) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'course': return <BookOpen className="w-5 h-5" />;
        case 'payment': return <DollarSign className="w-5 h-5" />;
        case 'success': return <CheckCircle className="w-5 h-5" />;
        case 'warning': return <AlertCircle className="w-5 h-5" />;
        case 'error': return <X className="w-5 h-5" />;
        default: return <Info className="w-5 h-5" />;
      }
    };

    const getTypeColor = () => {
      switch (notification.type) {
        case 'success': return 'text-green-600 bg-green-50';
        case 'warning': return 'text-yellow-600 bg-yellow-50';
        case 'error': return 'text-red-600 bg-red-50';
        case 'course': return 'text-blue-600 bg-blue-50';
        case 'payment': return 'text-purple-600 bg-purple-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    const getPriorityBadge = () => {
      const variants = {
        low: 'secondary',
        medium: 'outline',
        high: 'default',
        urgent: 'destructive'
      } as const;
      
      return (
        <Badge variant={variants[notification.priority]} className="text-xs">
          {notification.priority === 'low' ? 'Düşük' :
           notification.priority === 'medium' ? 'Orta' :
           notification.priority === 'high' ? 'Yüksek' : 'Acil'}
        </Badge>
      );
    };

    return (
      <Card className={`transition-all hover:shadow-md ${
        !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getTypeColor()}`}>
              {getIcon()}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {getPriorityBadge()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotificationMutation.mutate(notification.notification_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{notification.message}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{new Date(notification.created_at).toLocaleString('tr-TR')}</span>
                  <div className="flex items-center space-x-1">
                    {notification.delivery_method.map((method, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {method === 'push' ? '🔔' :
                         method === 'email' ? '📧' :
                         method === 'sms' ? '📱' : '💬'}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(notification.notification_id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {notification.action_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(notification.action_url, '_blank');
                        markAsReadMutation.mutate(notification.notification_id);
                      }}
                    >
                      Görüntüle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const NotificationSettings: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Bildirim Türleri</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Kurs Güncellemeleri</label>
                  <p className="text-sm text-gray-600">Yeni dersler ve kurs haberleri</p>
                </div>
                <Switch
                  checked={settings?.course_updates}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ course_updates: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Ödeme Bildirimleri</label>
                  <p className="text-sm text-gray-600">Satış ve ödeme bilgileri</p>
                </div>
                <Switch
                  checked={settings?.payment_notifications}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ payment_notifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Pazarlama E-postaları</label>
                  <p className="text-sm text-gray-600">Özel teklifler ve kampanyalar</p>
                </div>
                <Switch
                  checked={settings?.marketing_emails}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ marketing_emails: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Sistem Uyarıları</label>
                  <p className="text-sm text-gray-600">Güvenlik ve sistem bildirimleri</p>
                </div>
                <Switch
                  checked={settings?.system_alerts}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ system_alerts: checked })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Teslimat Yöntemleri</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <label className="font-medium">Push Bildirimleri</label>
                </div>
                <Switch
                  checked={settings?.push_enabled}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ push_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <label className="font-medium">E-posta</label>
                </div>
                <Switch
                  checked={settings?.email_enabled}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ email_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <label className="font-medium">SMS</label>
                </div>
                <Switch
                  checked={settings?.sms_enabled}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ sms_enabled: checked })
                  }
                />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Sessiz Saatler</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Başlangıç</label>
                <Input
                  type="time"
                  value={settings?.quiet_hours_start || '22:00'}
                  onChange={(e) => 
                    updateSettingsMutation.mutate({ quiet_hours_start: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bitiş</label>
                <Input
                  type="time"
                  value={settings?.quiet_hours_end || '08:00'}
                  onChange={(e) => 
                    updateSettingsMutation.mutate({ quiet_hours_end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SendNotification: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [priority, setPriority] = useState('medium');
    const [deliveryMethods, setDeliveryMethods] = useState<string[]>(['push', 'in_app']);
    const [scheduledFor, setScheduledFor] = useState('');

    const handleSend = () => {
      sendNotificationMutation.mutate({
        title,
        message,
        type,
        priority,
        target_users: [], // All users for now
        delivery_methods: deliveryMethods,
        scheduled_for: scheduledFor || undefined
      });
      
      // Reset form
      setTitle('');
      setMessage('');
      setType('info');
      setPriority('medium');
      setDeliveryMethods(['push', 'in_app']);
      setScheduledFor('');
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Gönder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Başlık</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirim başlığı..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Mesaj</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bildirim mesajı..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tür</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Bilgi</SelectItem>
                  <SelectItem value="success">Başarı</SelectItem>
                  <SelectItem value="warning">Uyarı</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                  <SelectItem value="course">Kurs</SelectItem>
                  <SelectItem value="payment">Ödeme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Öncelik</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Zamanla (İsteğe bağlı)</label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Teslimat Yöntemleri</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'push', label: 'Push', icon: Bell },
                { value: 'email', label: 'E-posta', icon: Mail },
                { value: 'sms', label: 'SMS', icon: Smartphone },
                { value: 'in_app', label: 'Uygulama İçi', icon: MessageSquare }
              ].map((method) => (
                <Button
                  key={method.value}
                  variant={deliveryMethods.includes(method.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (deliveryMethods.includes(method.value)) {
                      setDeliveryMethods(deliveryMethods.filter(m => m !== method.value));
                    } else {
                      setDeliveryMethods([...deliveryMethods, method.value]);
                    }
                  }}
                >
                  <method.icon className="w-4 h-4 mr-2" />
                  {method.label}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleSend}
            disabled={!title || !message || deliveryMethods.length === 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Gönder
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Bell className="w-8 h-8 mr-3 text-blue-600" />
            Bildirim Sistemi
          </h1>
          <p className="text-gray-600 mt-1">Gelişmiş bildirim yönetimi ve push notification</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {notifications?.filter((n: Notification) => !n.read).length || 0} okunmamış
          </Badge>
          <Button
            variant="outline"
            onClick={() => {
              const testNotification: Notification = {
                notification_id: 'test',
                user_id: user?.user_id || 0,
                title: 'Test Bildirimi',
                message: 'Bu bir test bildirimidir.',
                type: 'info',
                priority: 'medium',
                read: false,
                clicked: false,
                delivered: true,
                delivery_method: ['push'],
                created_at: new Date().toISOString()
              };
              sendPushNotification(testNotification);
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Test Bildirimi
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          {user?.is_admin && <TabsTrigger value="send">Gönder</TabsTrigger>}
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="course">Kurs</SelectItem>
                    <SelectItem value="payment">Ödeme</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                    <SelectItem value="success">Başarı</SelectItem>
                    <SelectItem value="warning">Uyarı</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="unread">Okunmamış</SelectItem>
                    <SelectItem value="read">Okunmuş</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Bildirim ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notifications?.length > 0 ? (
              notifications.map((notification: Notification) => (
                <NotificationCard key={notification.notification_id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BellOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Bildirim Yok</h3>
                  <p className="text-gray-600">Henüz hiç bildiriminiz bulunmuyor.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>

        {user?.is_admin && (
          <TabsContent value="send">
            <SendNotification />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

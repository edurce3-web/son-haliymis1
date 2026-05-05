import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  FileText, 
  Edit3, 
  Share, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Send,
  Plus,
  Trash2,
  Download,
  Upload,
  Bell,
  Settings,
  Crown,
  Shield,
  User,
  Calendar,
  Activity,
  GitBranch,
  History,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Reply,
  AtSign
} from 'lucide-react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canManageUsers: boolean;
  };
}

interface Comment {
  id: string;
  author: Collaborator;
  content: string;
  timestamp: string;
  lessonId?: string;
  sectionId?: string;
  isResolved: boolean;
  replies: Comment[];
  likes: number;
  mentions: string[];
}

interface Version {
  id: string;
  version: string;
  author: Collaborator;
  timestamp: string;
  changes: string[];
  description: string;
  isCurrent: boolean;
}

interface Activity {
  id: string;
  type: 'edit' | 'comment' | 'share' | 'version' | 'user_added';
  author: Collaborator;
  description: string;
  timestamp: string;
  details?: any;
}

export default function CourseCollaborationHub() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'owner',
      status: 'active',
      lastActive: '2 dakika önce',
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canManageUsers: true
      }
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'editor',
      status: 'active',
      lastActive: '1 saat önce',
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: false,
        canManageUsers: false
      }
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'reviewer',
      status: 'pending',
      lastActive: '1 gün önce',
      permissions: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canManageUsers: false
      }
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: collaborators[1],
      content: 'Bu bölümde daha fazla örnek olabilir. Öğrenciler için daha anlaşılır olur.',
      timestamp: '2 saat önce',
      lessonId: '1',
      isResolved: false,
      replies: [
        {
          id: '1-1',
          author: collaborators[0],
          content: 'Haklısın, birkaç pratik örnek ekleyeceğim.',
          timestamp: '1 saat önce',
          isResolved: false,
          replies: [],
          likes: 2,
          mentions: ['ayse@example.com']
        }
      ],
      likes: 3,
      mentions: []
    },
    {
      id: '2',
      author: collaborators[2],
      content: 'Video kalitesi çok iyi, ses de net. Tebrikler!',
      timestamp: '1 gün önce',
      lessonId: '2',
      isResolved: true,
      replies: [],
      likes: 5,
      mentions: []
    }
  ]);

  const [versions, setVersions] = useState<Version[]>([
    {
      id: '1',
      version: '1.3',
      author: collaborators[0],
      timestamp: '2 saat önce',
      changes: ['Yeni bölüm eklendi', 'Video kalitesi iyileştirildi', '3 quiz sorusu eklendi'],
      description: 'İçerik güncellemesi ve kalite iyileştirmeleri',
      isCurrent: true
    },
    {
      id: '2',
      version: '1.2',
      author: collaborators[1],
      timestamp: '1 gün önce',
      changes: ['Altyazı düzeltmeleri', 'Ders sıralaması değiştirildi'],
      description: 'Küçük düzeltmeler ve iyileştirmeler',
      isCurrent: false
    }
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'edit',
      author: collaborators[0],
      description: 'Kurs başlığını güncelledi',
      timestamp: '5 dakika önce'
    },
    {
      id: '2',
      type: 'comment',
      author: collaborators[1],
      description: '1. bölüme yorum ekledi',
      timestamp: '2 saat önce'
    },
    {
      id: '3',
      type: 'user_added',
      author: collaborators[0],
      description: 'Mehmet Kaya\'yı reviewer olarak ekledi',
      timestamp: '1 gün önce'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'reviewer' | 'viewer'>('reviewer');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'editor': return Edit3;
      case 'reviewer': return Eye;
      case 'viewer': return User;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'reviewer': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const inviteCollaborator = () => {
    if (!inviteEmail) {
      toast.error('Email adresi gerekli');
      return;
    }

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      lastActive: 'Henüz katılmadı',
      permissions: {
        canEdit: inviteRole === 'editor',
        canComment: inviteRole !== 'viewer',
        canShare: false,
        canManageUsers: false
      }
    };

    setCollaborators(prev => [...prev, newCollaborator]);
    setInviteEmail('');
    toast.success('Davet gönderildi!');
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: collaborators[0], // Current user
      content: newComment,
      timestamp: 'Şimdi',
      isResolved: false,
      replies: [],
      likes: 0,
      mentions: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    toast.success('Yorum eklendi');
  };

  const resolveComment = (commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId ? { ...comment, isResolved: !comment.isResolved } : comment
    ));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return Edit3;
      case 'comment': return MessageCircle;
      case 'share': return Share;
      case 'version': return GitBranch;
      case 'user_added': return UserPlus;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kurs İşbirliği</h2>
          <p className="text-muted-foreground">Ekibinizle birlikte kurs geliştirin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Bildirimler
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Ayarlar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="collaborators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collaborators">İşbirlikçiler</TabsTrigger>
          <TabsTrigger value="comments">Yorumlar</TabsTrigger>
          <TabsTrigger value="versions">Sürümler</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          {/* Invite Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Yeni İşbirlikçi Davet Et
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Email adresi"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="p-2 border border-border rounded-md"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="editor">Editör</option>
                  <option value="reviewer">İnceleyici</option>
                  <option value="viewer">İzleyici</option>
                </select>
                <Button onClick={inviteCollaborator}>
                  <Send className="w-4 h-4 mr-2" />
                  Davet Gönder
                </Button>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                <p><strong>Editör:</strong> İçeriği düzenleyebilir, yorum yapabilir</p>
                <p><strong>İnceleyici:</strong> Yorum yapabilir, önerilerde bulunabilir</p>
                <p><strong>İzleyici:</strong> Sadece görüntüleyebilir</p>
              </div>
            </CardContent>
          </Card>

          {/* Collaborators List */}
          <Card>
            <CardHeader>
              <CardTitle>Mevcut İşbirlikçiler ({collaborators.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborators.map((collaborator) => {
                  const RoleIcon = getRoleIcon(collaborator.role);
                  return (
                    <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{collaborator.name}</h4>
                            <Badge className={getRoleColor(collaborator.role)}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {collaborator.role === 'owner' ? 'Sahip' :
                               collaborator.role === 'editor' ? 'Editör' :
                               collaborator.role === 'reviewer' ? 'İnceleyici' : 'İzleyici'}
                            </Badge>
                            <Badge className={getStatusColor(collaborator.status)}>
                              {collaborator.status === 'active' ? 'Aktif' :
                               collaborator.status === 'pending' ? 'Beklemede' : 'Pasif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                          <p className="text-xs text-muted-foreground">Son aktivite: {collaborator.lastActive}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {collaborator.permissions.canEdit && <span className="mr-2">✏️ Düzenle</span>}
                          {collaborator.permissions.canComment && <span className="mr-2">💬 Yorum</span>}
                          {collaborator.permissions.canShare && <span className="mr-2">🔗 Paylaş</span>}
                        </div>
                        {collaborator.role !== 'owner' && (
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Yeni Yorum Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea
                  placeholder="Yorumunuzu yazın..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    @kullanıcı_adı ile bahsedebilirsiniz
                  </div>
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Yorum Ekle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className={comment.isResolved ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                        {comment.lessonId && (
                          <Badge variant="outline" className="text-xs">
                            Ders {comment.lessonId}
                          </Badge>
                        )}
                        {comment.isResolved && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Çözüldü
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mb-3">{comment.content}</p>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Reply className="w-3 h-3 mr-1" />
                          Yanıtla
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => resolveComment(comment.id)}
                        >
                          {comment.isResolved ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Yeniden Aç
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Çözüldü İşaretle
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">{reply.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{reply.author.name}</span>
                                  <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Sürüm Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={version.isCurrent ? 'default' : 'outline'}>
                          v{version.version}
                        </Badge>
                        {version.isCurrent && (
                          <Badge className="bg-green-100 text-green-800">
                            Güncel
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={version.author.avatar} />
                            <AvatarFallback className="text-xs">{version.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{version.author.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{version.timestamp}</span>
                      </div>
                      <div className="flex gap-2">
                        {!version.isCurrent && (
                          <Button variant="outline" size="sm">
                            <History className="w-3 h-3 mr-1" />
                            Geri Yükle
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          İndir
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{version.description}</p>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Değişiklikler:</Label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {version.changes.map((change, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ActivityIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={activity.author.avatar} />
                            <AvatarFallback className="text-xs">{activity.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{activity.author.name}</span>
                          <span className="text-sm text-muted-foreground">{activity.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

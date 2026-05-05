import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  Filter,
  Mail,
  MessageCircle,
  MessageSquare,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  Download,
  CheckCircle,
  MoreVertical,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { instructorsAPI, messagingAPI } from "@/lib/api";
import StudentCard from "@/components/instructor/StudentCard";
import InstructorStats from "@/components/instructor/InstructorStats";

const InstructorStudents = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız");
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total_students: number; completed_students: number; active_students: number }>({ total_students: 0, completed_students: 0, active_students: 0 });
  const [studentsFromDb, setStudentsFromDb] = useState<any[]>([]);
  const [studentCoursesMap, setStudentCoursesMap] = useState<Record<number, any[]>>({});
  const [loadingCoursesFor, setLoadingCoursesFor] = useState<number | null>(null);

  const handleExpandStudent = async (studentId: number) => {
    if (studentCoursesMap[studentId]) return; // Zaten yüklüyse tekrar çekme

    try {
      setLoadingCoursesFor(studentId);
      const res = await instructorsAPI.getStudentCourses(studentId);
      if (res.courses) {
        setStudentCoursesMap(prev => ({
          ...prev,
          [studentId]: res.courses
        }));
      }
    } catch (error) {
      toast.error('Öğrenci kursları yüklenemedi.');
    } finally {
      setLoadingCoursesFor(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!user?.user_id) return;
      try {
        setLoading(true);
        const r1 = await fetch(`/api/instructors/${user.user_id}/overview`, { signal: controller.signal });
        if (r1.ok) {
          const d = await r1.json();
          setStats(prev => ({
            ...prev,
            total_students: Number(d.total_students || 0),
          }));
        }
        const r2 = await fetch(`/api/instructors/${user.user_id}/students`, { signal: controller.signal });
        if (r2.ok) {
          const d = await r2.json();
          setStudentsFromDb(Array.isArray(d.items) ? d.items : []);
        }
      } catch { }
      finally { setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [user?.user_id]);

  const conversations = [
    {
      id: 1,
      student: {
        name: "Ahmet Yılmaz",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        course: "Web Geliştirme Kursu"
      },
      lastMessage: "Merhaba, React hooks konusunda bir sorum var...",
      lastMessageTime: "2 saat önce",
      unreadCount: 2,
      status: "online"
    },
    {
      id: 2,
      student: {
        name: "Elif Kaya",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b7fd?w=40&h=40&fit=crop&crop=face",
        course: "UI/UX Tasarım Kursu"
      },
      lastMessage: "Teşekkürler! Çok yardımcı oldu.",
      lastMessageTime: "1 gün önce",
      unreadCount: 0,
      status: "offline"
    },
    {
      id: 3,
      student: {
        name: "Mehmet Özkan",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        course: "JavaScript Temelleri"
      },
      lastMessage: "API entegrasyonu nasıl yapılır?",
      lastMessageTime: "3 gün önce",
      unreadCount: 1,
      status: "online"
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 1,
      senderType: "student",
      content: "Merhaba hocam, React hooks konusunda bir sorum var. useState kullanırken bazı sorunlar yaşıyorum.",
      timestamp: "14:30",
      isRead: true
    },
    {
      id: 2,
      senderId: "instructor",
      senderType: "instructor",
      content: "Merhaba Ahmet! Tabii ki yardımcı olabilirim. Hangi konuda sorun yaşıyorsun tam olarak?",
      timestamp: "14:35",
      isRead: true
    },
    {
      id: 3,
      senderId: 1,
      senderType: "student",
      content: "State güncellenirken component yeniden render oluyor ama güncellenmiş değeri alamıyorum. Sanki bir adım geride kalıyor.",
      timestamp: "14:37",
      isRead: true
    },
    {
      id: 4,
      senderId: "instructor",
      senderType: "instructor",
      content: "Bu çok yaygın bir durum! useState asenkron çalıştığı için bu sorunu yaşıyorsun. useEffect ile state değişikliklerini takip edebilirsin. Örnek kod göndereyim:",
      timestamp: "14:40",
      isRead: true
    }
  ];

  const students = [
    {
      id: 1,
      name: "Ahmet Yılmaz",
      email: "ahmet@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      course: "Web Geliştirme Kursu",
      progress: 75,
      lastActive: "2 saat önce",
      status: "active"
    },
    {
      id: 2,
      name: "Elif Kaya",
      email: "elif@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b7fd?w=40&h=40&fit=crop&crop=face",
      course: "UI/UX Tasarım Kursu",
      progress: 45,
      lastActive: "1 gün önce",
      status: "active"
    },
    {
      id: 3,
      name: "Mehmet Özkan",
      email: "mehmet@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      course: "JavaScript Temelleri",
      progress: 90,
      lastActive: "3 gün önce",
      status: "completed"
    }
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.user_id || !activeChat) return;
    try {
      await messagingAPI.sendMessage(user.user_id, activeChat, newMessage.trim());
      setNewMessage("");
      // Note: setMessages is not defined in current scope
      // const res = await messagingAPI.getMessages(user.user_id, activeChat);
      // setMessages(res.items || res);
      toast.success("Mesaj gönderildi");
    } catch (e) {
      toast.error("Mesaj gönderilemedi");
    }
  };

  const handleStartChat = (studentId: number) => {
    setActiveChat(studentId);
    toast.success("Sohbet başlatıldı!");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Öğrencilerle Sohbet</h1>
          <p className="text-muted-foreground">
            Öğrencilerinizle iletişim kurun ve sorularını yanıtlayın
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat">Sohbet</TabsTrigger>
            <TabsTrigger value="students">Öğrenci Listesi</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <Card className="h-full border-0 shadow-course">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Konuşmalar</span>
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Konuşma ara..."
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-y-auto flex-1">
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setActiveChat(conversation.id)}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${activeChat === conversation.id
                            ? "bg-primary/5 border-primary"
                            : "border-transparent"
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={conversation.student.avatar} />
                                <AvatarFallback>
                                  {conversation.student.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {conversation.status === "online" && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm truncate">
                                  {conversation.student.name}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">
                                    {conversation.lastMessageTime}
                                  </span>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 rounded-full text-xs flex items-center justify-center">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {conversation.student.course}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2">
                {activeChat ? (
                  <Card className="h-full border-0 shadow-course flex flex-col">
                    {/* Chat Header */}
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversations.find(c => c.id === activeChat)?.student?.avatar || ''} />
                            <AvatarFallback>
                              {(conversations.find(c => c.id === activeChat)?.student?.name || '?').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {conversations.find(c => c.id === activeChat)?.student?.name || 'Öğrenci'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {conversations.find(c => c.id === activeChat)?.student?.course || ''}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === "instructor" ? "justify-end" : "justify-start"
                            }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderType === "instructor"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${message.senderType === "instructor"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                              }`}>
                              <span className="text-xs">{message.timestamp}</span>
                              {message.senderType === "instructor" && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Mesajınızı yazın..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="resize-none"
                          rows={2}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="sm"
                          className="self-end"
                          disabled={!newMessage.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="h-full border-0 shadow-course flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold mb-2">Bir konuşma seçin</h3>
                      <p>Öğrencilerinizle sohbet etmek için sol taraftan bir konuşma seçin</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {/* Stats */}
            <InstructorStats
              stats={{
                totalCourses: 0,
                totalStudents: stats.total_students,
                totalRevenue: 0,
                averageRating: 0,
                completionRate: stats.completed_students,
                activeCampaigns: stats.active_students
              }}
            />

            {/* Students List */}
            <Card className="border-0 shadow-course">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Öğrenci Listesi</CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Öğrenci ara..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrele
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studentsFromDb.map((s) => (
                    <StudentCard
                      key={s.user_id}
                      student={{
                        id: s.user_id,
                        name: `${s.first_name} ${s.last_name}`,
                        email: s.email,
                        avatar: "",
                        enrolledCourses: s.courses_taken || 0,
                        completedCourses: 0,
                        progress: s.progress || 0,
                        lastActive: s.last_activity ? new Date(s.last_activity).toLocaleDateString() : "Bilinmiyor",
                        status: "active"
                      }}
                      courses={studentCoursesMap[s.user_id]}
                      isLoadingCourses={loadingCoursesFor === s.user_id}
                      onExpand={handleExpandStudent}
                      onMessage={() => handleStartChat(s.user_id)}
                      onEmail={() => window.open(`mailto:${s.email}`)}
                    />
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

export default InstructorStudents;
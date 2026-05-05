import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Mail, MessageCircle, BookOpen, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';

interface StudentCardProps {
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    enrolledCourses: number;
    completedCourses: number;
    progress: number;
    lastActive: string;
    status: 'active' | 'inactive' | 'completed' | string;
  };
  onMessage?: (studentId: number) => void;
  onEmail?: (studentId: number) => void;
  courses?: any[];
  isLoadingCourses?: boolean;
  onExpand?: (studentId: number) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onMessage, onEmail, courses, isLoadingCourses, onExpand }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'Aktif': return 'bg-emerald-500';
      case 'completed': return 'bg-blue-500';
      case 'inactive': return 'bg-slate-400';
      default: return 'bg-emerald-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'Aktif': return 'Aktif';
      case 'completed': return 'Tamamladı';
      case 'inactive': return 'Pasif';
      default: return 'Bilinmiyor';
    }
  };

  const handleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && onExpand) {
      onExpand(student.id);
    }
  };

  return (
    <Card className={`transition-all duration-300 border-white/5 ${expanded ? 'ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'hover:border-white/10 hover:shadow-lg'}`}>
      <div className="cursor-pointer" onClick={handleExpand}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 ring-2 ring-white/10">
                <AvatarImage src={student.avatar || ''} />
                <AvatarFallback className="bg-slate-800 text-slate-300 font-medium">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-base font-bold text-slate-100">{student.name}</CardTitle>
                <p className="text-[13px] text-slate-400 mt-0.5">{student.email}</p>
              </div>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-white/5">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span className="font-medium">{student.enrolledCourses} Kurs</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-white/5">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="font-medium">{student.lastActive}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium px-1">
              <span className="text-slate-400">Genel İlerleme</span>
              <span className="text-indigo-400">{student.progress}%</span>
            </div>
            <Progress value={student.progress} className="h-1.5 bg-slate-800" />
          </div>
        </CardContent>
      </div>

      <div className="px-6 pb-6 pt-0 space-y-4">
        {expanded && (
          <div className="pt-4 border-t border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Kurstaki İlerlemeler</h4>
            {isLoadingCourses ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
            ) : courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map(course => (
                  <div key={course.course_id} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex gap-3">
                      <img src={getCourseImageUrl(course.course_id, course.image_path)} alt={course.title} className="w-12 h-8 object-cover rounded shadow-sm opacity-90" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{course.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{course.completed_lessons} / {course.total_lessons} ders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={Number(course.progress_percentage)} className="DetailsProgressBar flex-1 h-1.5 bg-slate-800" />
                      <span className="text-[10px] font-medium text-slate-400 w-8 text-right">{Math.round(Number(course.progress_percentage))}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">Kayıtlı kurs bulunamadı.</p>
            )}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onMessage?.(student.id); }} className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-9 rounded-xl text-xs">
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Mesaj Gönder
          </Button>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEmail?.(student.id); }} className="px-3 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-9 rounded-xl">
            <Mail className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StudentCard;

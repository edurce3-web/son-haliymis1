import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BookOpen, Users, Star, Edit } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    students: number;
    rating: number;
    reviews: number;
    revenue: number;
    status: string;
    image: string;
  };
  onEdit?: (courseId: number) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
          {course.status === 'published' ? 'Yayında' : 'Taslak'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span>{course.students} öğrenci</span>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>{course.rating.toFixed(1)} ({course.reviews})</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="font-semibold text-green-600">
          ₺{course.revenue.toLocaleString()}
        </span>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => onEdit?.(course.id)}>
            <Edit className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default CourseCard;

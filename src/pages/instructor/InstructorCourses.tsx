import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import CourseCard from "@/components/instructor/CourseCard";
import CourseForm from "@/components/instructor/CourseForm";
import InstructorStats from "@/components/instructor/InstructorStats";
import { apiRequest } from "@/lib/api";

const InstructorCourses = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız");
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);
  interface LessonItem {
    title: string;
    videoFile: File | null;
    documentFiles: File[];
  }
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_courses: 0, total_students: 0, average_rating: null as number | null, total_revenue: 0 });
  const [courses, setCourses] = useState<Array<{ id: number; title: string; students: number; rating: number; reviews: number; revenue: number; status: string; image: string }>>([]);
  const [newCourseStep, setNewCourseStep] = useState(1);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    level: "",
    price: "",
    curriculum: [{ title: "", videoFile: null, documentFiles: [] }] as LessonItem[],
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!user?.user_id) return;
      try {
        setLoading(true);
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE_URL}/instructors/${user.user_id}/overview`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/instructors/${user.user_id}/courses`, { signal: controller.signal }),
        ]);
        if (r1.ok) {
          const d = await r1.json();
          setStats({
            total_courses: 0, 
            total_students: d.total_students || 0,
            average_rating: d.average_rating ?? null,
            total_revenue: d.total_revenue || 0,
          });
        }
        if (r2.ok) {
          const d = await r2.json();
          const items = (d.items || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            students: Number(c.students || 0),
            rating: Number(c.rating || 0),
            reviews: Number(c.reviews || 0),
            revenue: Number(c.revenue || 0),
            status: 'published',
            image: c.image_url,
          }));
          setCourses(items);
          setStats(prev => ({ ...prev, total_courses: items.length }));
        }
      } catch { }
      finally { setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [user?.user_id]);

  const handleCourseInputChange = (field: string, value: string) => {
    setNewCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurriculumChange = (index: number, value: string) => {
    const updatedCurriculum = [...newCourse.curriculum];
    updatedCurriculum[index] = {
      ...updatedCurriculum[index],
      title: value,
    };
    setNewCourse(prev => ({ ...prev, curriculum: updatedCurriculum }));
  };

  const handleLessonVideoChange = (index: number, file: File | null) => {
    const updatedCurriculum = [...newCourse.curriculum];
    updatedCurriculum[index] = {
      ...updatedCurriculum[index],
      videoFile: file,
    };
    setNewCourse(prev => ({ ...prev, curriculum: updatedCurriculum }));
  };

  const handleLessonDocumentsChange = (index: number, files: File[]) => {
    const updatedCurriculum = [...newCourse.curriculum];
    updatedCurriculum[index] = {
      ...updatedCurriculum[index],
      documentFiles: files,
    };
    setNewCourse(prev => ({ ...prev, curriculum: updatedCurriculum }));
  };

  const addCurriculumItem = () => {
    setNewCourse(prev => ({
      ...prev,
      curriculum: [...prev.curriculum, { title: "", videoFile: null, documentFiles: [] }]
    }));
  };

  const handleNextStep = () => {
    if (newCourseStep < 3) {
      setNewCourseStep(newCourseStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (newCourseStep > 1) {
      setNewCourseStep(newCourseStep - 1);
    }
  };

  const handleSaveCourse = async () => {
    try {
      setLoading(true);
      const courseData = {
        title: newCourse.title,
        description: newCourse.description,
        category_id: parseInt(newCourse.category),
        subcategory_id: newCourse.subcategory ? parseInt(newCourse.subcategory) : null,
        level: newCourse.level,
        price: parseFloat(newCourse.price || "0"),
        status: 'draft'
      };

      const response = await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });

      toast.success("Kurs başarıyla kaydedildi!", {
        description: "Kursunuz incelendikten sonra yayınlanacak."
      });
      
      setNewCourseStep(1);
      setNewCourse({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        level: "",
        price: "",
        curriculum: [{ title: "", videoFile: null, documentFiles: [] }],
      });
      setActiveTab("courses");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Kurs Yönetimi</h1>
          <p className="text-muted-foreground">
            Kurslarınızı oluşturun, düzenleyin ve yönetin
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="courses">Kurslarım</TabsTrigger>
            <TabsTrigger value="create">Yeni Kurs</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <InstructorStats stats={{
              totalCourses: stats.total_courses,
              totalStudents: stats.total_students,
              totalRevenue: stats.total_revenue,
              averageRating: stats.average_rating || 0,
              completionRate: 85,
              activeCampaigns: 3
            }} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={(courseId) => {
                    toast.info(`Kurs düzenleme: ${courseId}`);
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CourseForm
              course={{
                title: newCourse.title,
                description: newCourse.description,
                category: newCourse.category,
                subcategory: newCourse.subcategory,
                level: newCourse.level,
                price: newCourse.price
              }}
              step={newCourseStep}
              onInputChange={handleCourseInputChange}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onSave={handleSaveCourse}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorCourses;
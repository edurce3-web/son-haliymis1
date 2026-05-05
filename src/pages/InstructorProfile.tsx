import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const InstructorProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!id || id === 'dashboard') return; // Prevent loading if ID is just 'dashboard'
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/instructor/${id}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
            setStats(data.stats);
            setCourses(data.courses || []);
          } else {
            setError('Eğitmen profili bulunamadı.');
          }
        } else {
          setError('Profil yüklenirken bir sorun oluştu.');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Bir ağ hatası oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        Yükleniyor...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{error || 'Eğitmen bulunamadı.'}</h2>
        <Link to="/" className="text-primary hover:underline">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <img
          src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face`}
          alt={`${profile.first_name} ${profile.last_name}`}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
          <div className="text-muted-foreground">{profile.email}</div>
          {stats && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Badge variant="outline">Kurs: {stats.course_count}</Badge>
              <Badge variant="outline">Puan: {Number(stats.avg_rating || 0).toFixed(1)}</Badge>
            </div>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-course">
        <CardHeader>
          <CardTitle>Eğitmenin Kursları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <Link key={c.id} to={`/course/${c.id}`} className="border rounded-lg p-4 hover:shadow-course-hover transition">
                <div className="font-semibold line-clamp-2 mb-1">{c.title}</div>
                <div className="flex items-center justify-between text-sm">
                  <span>⭐ {Number(c.rating || 0).toFixed(1)}</span>
                  <span className="font-semibold">₺{c.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorProfile;




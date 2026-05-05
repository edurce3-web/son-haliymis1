import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiData } from '@/hooks/useApi';
import api from '@/services/api';
import { BookOpen, Users, Star, Clock, TrendingUp } from 'lucide-react';

const Categories: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  // Backend API calls
  const { data: categories, loading: categoriesLoading } = useApiData(
    () => api.categories.getAll(),
    [],
    { immediate: true }
  );

  const { data: coursesData, loading: coursesLoading } = useApiData(
    () => categoryId ? api.categories.getCourses(parseInt(categoryId)) : Promise.resolve([]),
    [categoryId],
    { immediate: !!categoryId }
  );

  const selectedCategory = categories?.find(cat =>
    cat.id === parseInt(categoryId || '0') ||
    cat.subcategories?.some(sub => sub.id === parseInt(categoryId || '0'))
  );

  const selectedSubcategory = selectedCategory?.subcategories?.find(sub =>
    sub.id === parseInt(categoryId || '0')
  );

  const currentCategory = selectedSubcategory || selectedCategory;

  if (categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Eğer kategori ID'si yoksa, tüm kategorileri göster
  if (!categoryId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tüm Kategoriler</h1>
          <p className="text-muted-foreground">
            İlgi alanınıza uygun kursları keşfedin
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories?.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary/30">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-light leading-tight">
                  {category.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  {category.course_count} kurs
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {category.subcategories?.slice(0, 3).map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/categories/${sub.id}`}
                      className="block p-1 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-light text-muted-foreground hover:text-primary">{sub.name}</span>
                    </Link>
                  ))}
                  {category.subcategories && category.subcategories.length > 3 && (
                    <Link
                      to={`/categories/${category.id}`}
                      className="text-xs text-primary hover:text-primary/80 font-light"
                    >
                      +{category.subcategories.length - 3} daha...
                    </Link>
                  )}
                </div>
                <div className="mt-3">
                  <Link to={`/categories/${category.id}`}>
                    <Button size="sm" variant="outline" className="w-full text-xs font-light">
                      Görüntüle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Belirli bir kategori seçilmişse, o kategorinin kurslarını göster
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link to="/categories" className="hover:text-primary">
            Kategoriler
          </Link>
          <span>/</span>
          {selectedSubcategory && selectedCategory && (
            <>
              <Link
                to={`/categories/${selectedCategory.id}`}
                className="hover:text-primary"
              >
                {selectedCategory.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium">
            {currentCategory?.name}
          </span>
        </nav>
      </div>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{currentCategory?.name}</h1>
        <p className="text-muted-foreground mb-4">
          {currentCategory?.description}
        </p>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-xs font-light">
            {currentCategory?.course_count} kurs
          </Badge>
          <Badge variant="outline" className="text-xs font-light">
            Popüler
          </Badge>
        </div>
      </div>

      {/* Courses Grid */}
      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : coursesData?.courses && coursesData.courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {coursesData.courses.map((course: any) => (
            <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/50" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {course.average_rating ? Number(course.average_rating).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({course.review_count || 0})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{course.student_count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    {course.instructor_first_name} {course.instructor_last_name}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{course.duration || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ₺{course.price || '0'}
                  </span>
                  <Link to={`/course/${course.slug || course.course_id}`}>
                    <Button size="sm">
                      Detayları Gör
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bu kategoride henüz kurs yok</h3>
          <p className="text-muted-foreground mb-4">
            Yakında bu kategoriye yeni kurslar eklenecek.
          </p>
          <Link to="/categories">
            <Button variant="outline">
              Diğer Kategorileri Keşfet
            </Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {coursesData?.pagination && coursesData.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            {/* Pagination butonları buraya eklenebilir */}
            <span className="text-sm text-muted-foreground">
              Sayfa {coursesData.pagination.page} / {coursesData.pagination.totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

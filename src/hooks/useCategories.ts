import { useQuery } from '@tanstack/react-query';

export interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  course_count: number;
  subcategories?: Category[];
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('https://api.edurce.com/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCoursesByCategory = (categoryId: number, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['courses', 'category', categoryId, page, limit],
    queryFn: async () => {
      const response = await fetch(
        `https://api.edurce.com/api/categories/${categoryId}/courses?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

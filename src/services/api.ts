// API Service Layer for Backend Integration
import { toast } from 'sonner';

const API_BASE_URL = '/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// API request wrapper with error handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error.message || 'Bir hata oluştu');
    throw error;
  }
};

// Export all API functions
const api = {
  // Generic requests
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint: string) => apiRequest(endpoint, {
    method: 'DELETE',
  }),

  // Course APIs
  courses: {
    getAll: (params?: any) => apiRequest(`/courses${params ? `?${new URLSearchParams(params)}` : ''}`),
    getById: (id: number) => apiRequest(`/courses/${id}`),
    getByCategorySlug: (slug: string, filter?: string) => apiRequest(`/courses/category/${slug}${filter ? `?filter=${filter}` : ''}`),
    getBySubcategorySlug: (catSlug: string, subSlug: string, filter?: string) => apiRequest(`/courses/category/${catSlug}/${subSlug}${filter ? `?filter=${filter}` : ''}`),
    getFeatured: () => apiRequest('/courses/featured'),
    search: (query: string, filters?: any) => {
      const { q, ...rest } = filters || {};
      const params = new URLSearchParams({ q: query, ...rest });
      return apiRequest(`/courses/search?${params.toString()}`);
    },
    enroll: (courseId: number) => apiRequest(`/courses/${courseId}/enroll`, {
      method: 'POST',
    }),
    create: (data: any) => apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    addReview: (courseId: number, data: any) => apiRequest(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Categories APIs
  categories: {
    getAll: () => apiRequest('/categories'),
    getById: (id: number) => apiRequest(`/categories/${id}`),
    getBySlug: (slug: string) => apiRequest(`/categories/${slug}`),
    getSubcategoryBySlug: (catSlug: string, subSlug: string) => apiRequest(`/categories/${catSlug}/subcategories/${subSlug}`),
    getCourses: (id: number) => apiRequest(`/categories/${id}/courses`),
  },

  // Cart APIs
  cart: {
    get: () => apiRequest('/cart'),
    add: async (courseId: number) => {
      const res = await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId }),
      });
      window.dispatchEvent(new Event('cartUpdated'));
      return res;
    },
    remove: async (courseId: number) => {
      const res = await apiRequest(`/cart/${courseId}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('cartUpdated'));
      return res;
    },
    clear: async () => {
      const res = await apiRequest('/cart', {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('cartUpdated'));
      return res;
    },
  },

  // Bookmarks APIs
  bookmarks: {
    getAll: () => apiRequest('/bookmarks'),
    add: (courseId: number) => apiRequest('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    }),
    remove: (courseId: number) => apiRequest(`/bookmarks/${courseId}`, {
      method: 'DELETE',
    }),
  },

  // Home page APIs
  home: {
    getData: () => apiRequest('/home'),
    getStats: () => apiRequest('/stats'),
  },

  // Instructors APIs
  instructors: {
    getAll: () => apiRequest('/instructors'),
    getById: (id: number) => apiRequest(`/instructors/${id}`),
    getPopular: () => apiRequest('/instructors/popular'),
    getOverview: (id: number) => apiRequest(`/instructors/${id}/overview`),
    getCourses: (id: number) => apiRequest(`/instructors/${id}/courses`),
    getStudents: (id: number) => apiRequest(`/instructors/${id}/students`),
  },

  // User APIs
  user: {
    getProfile: () => apiRequest('/user/profile'),
    updateProfile: (data: any) => apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getDashboardStats: () => apiRequest('/user/dashboard-stats'),
  },

  // Comment APIs
  comment: {
    getByLesson: (lessonId: string) => apiRequest(`/lessons/${lessonId}/comments`),
    add: (lessonId: string, data: any) => apiRequest(`/lessons/${lessonId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Progress APIs
  progress: {
    getCourse: (courseId: string) => apiRequest(`/courses/${courseId}/progress`),
    updateLesson: (lessonId: string, data: any) => apiRequest(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Contact API
  contact: {
    send: (messageData: {
      name: string;
      email: string;
      subject: string;
      message: string;
      phone?: string;
    }) => apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
  },

  // Newsletter API
  newsletter: {
    subscribe: (email: string) => apiRequest('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  },

  // Notifications API
  notifications: {
    getAll: () => apiRequest('/notifications'),
    markAsRead: (id: number) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
    delete: (id: number) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
  },

  // Favorites API
  favorites: {
    getAll: () => apiRequest('/favorites'),
    add: async (courseId: number) => {
      const res = await apiRequest('/favorites', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId }),
      });
      window.dispatchEvent(new Event('favoritesUpdated'));
      return res;
    },
    remove: async (courseId: number) => {
      const res = await apiRequest(`/favorites/${courseId}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('favoritesUpdated'));
      return res;
    },
    check: (courseId: number) => apiRequest(`/favorites/check/${courseId}`),
  },
};

export default api;

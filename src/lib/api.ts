export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.edurce.com/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://api.edurce.com';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Kurs kapak fotoğrafı URL'sini oluşturur.
 * iDrive E2 bucket'ları private olduğu için, backend proxy endpoint'i üzerinden görsel çekilir.
 * @param courseId - Kurs ID'si
 * @param imagePath - Veritabanındaki image_path / image_url / thumbnail değeri (opsiyonel)
 * @returns Proxy URL veya placeholder
 */
export const getCourseImageUrl = (courseId?: number | string, imagePath?: string | null): string => {
  // Eğer image_path yoksa veya courseId yoksa placeholder döndür
  if (!imagePath || !courseId) {
    return '/placeholder-course.jpg';
  }

  // Eğer zaten proxy URL ise doğrudan döndür
  if (typeof imagePath === 'string' && imagePath.includes('/media/course-image/')) {
    return imagePath.startsWith('http') ? imagePath : `https://api.edurce.com${imagePath}`;
  }

  // Eğer local path / relative path ise (ör: /uploads/... veya /course-images/...)
  if (typeof imagePath === 'string' && imagePath.startsWith('/') && !imagePath.includes('idrivee2') && !imagePath.includes('neuralakademi')) {
    return imagePath;
  }

  // iDrive E2 veya Cloudflare CDN URL'si ise proxy'e yönlendir
  if (typeof imagePath === 'string' && (
    imagePath.includes('idrivee2') ||
    imagePath.includes('neuralakademi') ||
    imagePath.includes('platform-kurs-kapak')
  )) {
    return `${API_BASE_URL}/media/course-image/${courseId}`;
  }

  // Diğer durumlarda (harici URL vb.) olduğu gibi döndür
  return imagePath || '/placeholder-course.jpg';
};

// Generic API request function
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Body is not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    is_instructor: boolean;
  }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => apiRequest('/auth/me'),
};

// Cart API
export const cartAPI = {
  getCart: () => apiRequest('/cart'),

  addToCart: async (courseId: number) => {
    const res = await apiRequest(`/cart/${courseId}`, {
      method: 'POST',
    });
    window.dispatchEvent(new Event('cartUpdated'));
    return res;
  },

  removeFromCart: async (courseId: number) => {
    const res = await apiRequest(`/cart/${courseId}`, {
      method: 'DELETE',
    });
    window.dispatchEvent(new Event('cartUpdated'));
    return res;
  },

  getCartCount: () => apiRequest('/cart/count'),
};

// Favorites API
export const favoritesAPI = {
  getFavorites: () => apiRequest('/favorites'),

  addToFavorites: async (courseId: number) => {
    const res = await apiRequest(`/favorites/${courseId}`, {
      method: 'POST',
    });
    window.dispatchEvent(new Event('favoritesUpdated'));
    return res;
  },

  removeFromFavorites: async (courseId: number) => {
    const res = await apiRequest(`/favorites/${courseId}`, {
      method: 'DELETE',
    });
    window.dispatchEvent(new Event('favoritesUpdated'));
    return res;
  },

  toggleFavorite: async (courseId: number) => {
    try {
      // Try to add to favorites first
      await apiRequest(`/favorites/${courseId}`, {
        method: 'POST',
      });
      window.dispatchEvent(new Event('favoritesUpdated'));
      return { favorited: true };
    } catch (error: any) {
      if (error.message.includes('400')) {
        // Already in favorites, remove it
        await apiRequest(`/favorites/${courseId}`, {
          method: 'DELETE',
        });
        window.dispatchEvent(new Event('favoritesUpdated'));
        return { favorited: false };
      }
      throw error;
    }
  },
};

// Purchase API
export const purchaseAPI = {
  purchase: () =>
    apiRequest('/purchase', {
      method: 'POST',
    }),
};

// Courses API
export const coursesAPI = {
  getCourses: (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return apiRequest(`/courses/search${queryString ? `?${queryString}` : ''}`);
  },

  getCourse: (id: number) => apiRequest(`/courses/${id}`),

  createCourse: (courseData: {
    title: string;
    description: string;
    price: number;
    language?: string;
    level?: string;
    image_url?: string;
    categories?: string[];
    sections?: Array<{
      title: string;
      lessons?: Array<{
        title: string;
        video_url?: string;
        content?: string;
      }>;
    }>;
  }) => apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  }),

  updateCourse: (id: number, courseData: {
    title?: string;
    description?: string;
    price?: number;
    language?: string;
    level?: string;
    image_url?: string;
  }) => apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  }),

  deleteCourse: (id: number) => apiRequest(`/courses/${id}`, {
    method: 'DELETE',
  }),

  getSimilarCourses: (id: number) => apiRequest(`/courses/${id}/similar`),

  getAlsoBoughtCourses: (id: number) => apiRequest(`/courses/${id}/also-bought`),

  // Course enrollment
  enrollInCourse: (courseId: number) => apiRequest(`/courses/${courseId}/enroll`, {
    method: 'POST',
  }),

  updateProgress: (courseId: number, progress: number) => apiRequest(`/courses/${courseId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress }),
  }),

  // Course reviews
  addReview: (courseId: number, reviewData: { rating: number; comment?: string }) =>
    apiRequest(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  getReviews: (courseId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return apiRequest(`/courses/${courseId}/reviews${queryString ? `?${queryString}` : ''}`);
  },

  // Course Q&A
  addQuestion: (courseId: number, questionData: { title: string; content: string }) =>
    apiRequest(`/courses/${courseId}/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    }),

  getQuestions: (courseId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return apiRequest(`/courses/${courseId}/questions${queryString ? `?${queryString}` : ''}`);
  },

  addAnswer: (questionId: number, content: string) =>
    apiRequest(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getPlayerContent: (id: number) => apiRequest(`/courses/${id}/player-content`),
};

// Categories API
export const categoriesAPI = {
  getCategories: () => apiRequest('/categories'),
};

// Instructors API
export const instructorsAPI = {
  getInstructors: () => apiRequest('/instructors'),
  getOverview: (instructorId: number) => apiRequest(`/instructors/${instructorId}/overview`),
  getCourses: (instructorId: number) => apiRequest(`/instructors/${instructorId}/courses`),
  getStudents: (instructorId: number) => apiRequest(`/instructors/${instructorId}/students`),
  getStudentCourses: (studentId: number) => apiRequest(`/instructor/students/${studentId}/courses`),
  getMessages: (instructorId: number) => apiRequest(`/instructors/${instructorId}/messages`),
  sendMessage: (instructorId: number, data: { student_id: number; message: string }) =>
    apiRequest(`/instructors/${instructorId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getCampaigns: (instructorId: number) => apiRequest(`/instructors/${instructorId}/campaigns`),
  createCampaign: (instructorId: number, data: any) =>
    apiRequest(`/instructors/${instructorId}/campaigns`, { method: 'POST', body: JSON.stringify(data) }),
  getRevenueSummary: (instructorId: number, timeFrame: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') =>
    apiRequest(`/instructors/${instructorId}/revenue?timeFrame=${timeFrame}`),
};

// Messaging API (instructor <-> students)
export const messagingAPI = {
  getConversations: (instructorId: number) =>
    apiRequest(`/instructors/${instructorId}/conversations`),

  getMessages: (instructorId: number, studentId: number) =>
    apiRequest(`/instructors/${instructorId}/messages/${studentId}`),

  sendMessage: (
    instructorId: number,
    studentId: number,
    content: string
  ) =>
    apiRequest(`/instructors/${instructorId}/messages/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// Payment API
export const paymentAPI = {
  processPayment: (paymentData: any) =>
    apiRequest('/payment/process', { method: 'POST', body: JSON.stringify(paymentData) }),

  getPaymentHistory: () => apiRequest('/payment/history'),

  refundPayment: (paymentId: string) =>
    apiRequest(`/payment/${paymentId}/refund`, { method: 'POST' }),
};

// Live Class API
export const liveClassAPI = {
  getClassDetails: (classId: string) => apiRequest(`/live-class/${classId}`),

  joinClass: (data: { classId: string; courseId: string }) =>
    apiRequest(`/live-class/${data.classId}/join`, { method: 'POST', body: JSON.stringify(data) }),

  leaveClass: (classId: string) =>
    apiRequest(`/live-class/${classId}/leave`, { method: 'POST' }),

  getScheduledClasses: (courseId: string) =>
    apiRequest(`/courses/${courseId}/live-classes`),

  scheduleClass: (courseId: string, data: any) =>
    apiRequest(`/courses/${courseId}/live-classes`, { method: 'POST', body: JSON.stringify(data) }),
};

// Profile API (instructor)
export const profileAPI = {
  getInstructorProfile: (instructorId: number) =>
    apiRequest(`/instructors/${instructorId}/profile`),

  updateInstructorProfile: (
    instructorId: number,
    payload: Partial<{ first_name: string; last_name: string; email: string; bio: string; title: string; company: string; website: string; linkedin: string; twitter: string; phone: string }>
  ) =>
    apiRequest(`/instructors/${instructorId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// Enrollment API
export const enrollmentAPI = {
  getEnrollments: () => apiRequest('/enrollments'),

  enrollInCourse: (courseId: number) => apiRequest(`/courses/${courseId}/enroll`, {
    method: 'POST',
  }),
};

// Progress API
export const progressAPI = {
  completeLesson: (courseId: number, lessonId: number) => apiRequest(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  }),
  saveWatchTime: (courseId: number, lessonId: number, watchTimeSeconds: number) => apiRequest(`/lessons/${lessonId}/watch-time`, {
    method: 'PUT',
    body: JSON.stringify({ courseId, watchTimeSeconds }),
  }),
  updateCourseProgress: (courseId: number, progress: number) =>
    apiRequest(`/courses/${courseId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    }),
};

// Certificates API
export const certificatesAPI = {
  getCertificates: () => apiRequest('/certificates'),
  claimCertificate: (courseId: number, imageData: string) => 
    apiRequest('/certificates/claim', {
      method: 'POST',
      body: JSON.stringify({ courseId, imageData }),
    }),
};

// Reviews API
export const reviewsAPI = {
  addReview: (courseId: number, reviewData: { rating: number; comment?: string }) =>
    apiRequest(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  getReviews: (courseId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return apiRequest(`/courses/${courseId}/reviews${queryString ? `?${queryString}` : ''}`);
  },
};

// Q&A API
export const qaAPI = {
  addQuestion: (courseId: number, questionData: { title: string; content: string }) =>
    apiRequest(`/courses/${courseId}/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    }),

  getQuestions: (courseId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return apiRequest(`/courses/${courseId}/questions${queryString ? `?${queryString}` : ''}`);
  },

  addAnswer: (questionId: number, content: string) =>
    apiRequest(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

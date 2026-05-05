import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import Footer from "@/components/layout/Footer";
import CategorySubHeader from "@/components/layout/CategorySubHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Home from "./pages/Home";

import Categories from "./pages/Categories";
import Learning from "./pages/Learning";
import CoursePlayer from "./pages/CoursePlayer";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import Cart from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InstructorApplication from "./pages/InstructorApplication";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Instructor from "./pages/Instructor";
import ProfessionalInstructorDashboard from './components/instructor/ProfessionalInstructorDashboard';

import NotFound from "./pages/NotFound";
import AllCourses from "./pages/AllCourses";
import InstructorProfile from "./pages/InstructorProfile";
import CategoryCoursesPage from "./pages/CategoryCoursesPage";
import Favorites from "./pages/Favorites";
import SearchResults from "./pages/SearchResults";
import GamificationPage from "./pages/Gamification";
import Certificates from "./pages/Certificates";
import MyBooks from "./pages/MyBooks";

import { CreateCourseInitial } from './pages/instructor/CreateCourseInitial';
import { CreateBook } from './components/instructor/dashboard/CreateBook';
import { EditBook } from './components/instructor/dashboard/EditBook';
import AdvancedCourseCreator from './components/course/AdvancedCourseCreator';
import VideoUploadProcessor from './components/course/VideoUploadProcessor';
import CourseCollaborationHub from './components/course/CourseCollaborationHub';
import CoursePreviewTester from './components/course/CoursePreviewTester';

import BecomeInstructor from './pages/BecomeInstructor';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import SettingsLayout from './pages/settings/SettingsLayout';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import PaymentSettings from './pages/settings/PaymentSettings';
import PurchaseHistorySettings from './pages/settings/PurchaseHistorySettings';
import CloseAccountSettings from './pages/settings/CloseAccountSettings';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  // Hide header/footer/nav on these pages
  const hideLayout =
    !!path.match(/^\/learning\/.+/) ||  // Course player (not /learning dashboard)
    path.startsWith('/instructor') ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      {!hideLayout && <Header />}
      {children}
      {!hideLayout && <Footer />}
      {!hideLayout && <MobileNavigation />}
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <LayoutWrapper>
              <Routes>
                <Route path="/" element={<Home />} />

                {/* Instructor Course Creation & Editing Routes */}
                <Route path="/instructor/courses/create" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <CreateCourseInitial />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/books/create" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <CreateBook />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/courses/edit/:id" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <AdvancedCourseCreator />
                  </ProtectedRoute>
                } />
                <Route path="/course-preview/:id" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <CoursePreviewTester />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/books/edit/:id" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <EditBook />
                  </ProtectedRoute>
                } />

                {/* Public Course Routes */}
                <Route path="/courses" element={<AllCourses />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/courses/:categorySlug" element={<CategoryCoursesPage />} />
                <Route path="/courses/:categorySlug/:subcategorySlug" element={<CategoryCoursesPage />} />
                <Route path="/instructors/:id" element={<InstructorProfile />} />
                <Route path="/favorites" element={
                  <ProtectedRoute requiresAuth={true}>
                    <Favorites />
                  </ProtectedRoute>
                } />

                {/* Learning & Analytics (Consolidated) */}
                {/* Learning */}
                <Route path="/learning" element={<ProtectedRoute requiresAuth={true}><Learning /></ProtectedRoute>} />
                <Route path="/home/learning" element={<ProtectedRoute requiresAuth={true}><Learning /></ProtectedRoute>} />
                <Route path="/learning/:id" element={<ProtectedRoute requiresAuth={true}><CoursePlayer /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute requiresAuth={true}><Learning /></ProtectedRoute>} />
                {/* Gamification */}
                <Route path="/home/gamification" element={<ProtectedRoute requiresAuth={true}><GamificationPage /></ProtectedRoute>} />
                {/* Certificates & Books */}
                <Route path="/home/certificates" element={<ProtectedRoute requiresAuth={true}><Certificates /></ProtectedRoute>} />
                <Route path="/home/books" element={<ProtectedRoute requiresAuth={true}><MyBooks /></ProtectedRoute>} />

                <Route path="/cart" element={
                  <ProtectedRoute requiresAuth={true}>
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute requiresAuth={true}>
                    <Checkout />
                  </ProtectedRoute>
                } />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/instructor-application" element={
                  <ProtectedRoute requiresAuth={true}>
                    <InstructorApplication />
                  </ProtectedRoute>
                } />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/help" element={<Help />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/notifications" element={
                  <ProtectedRoute requiresAuth={true}>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute requiresAuth={true}>
                    <MessagesPage />
                  </ProtectedRoute>
                } />
                <Route path="/home/settings" element={
                  <ProtectedRoute requiresAuth={true}>
                    <SettingsLayout />
                  </ProtectedRoute>
                }>
                  <Route path="profile" element={<ProfileSettings />} />
                  <Route path="security" element={<SecuritySettings />} />
                  <Route path="notifications" element={<NotificationSettings />} />
                  <Route path="payment" element={<PaymentSettings />} />
                  <Route path="history" element={<PurchaseHistorySettings />} />
                  <Route path="close" element={<CloseAccountSettings />} />
                </Route>
                <Route path="/gamification" element={<ProtectedRoute requiresAuth={true}><GamificationPage /></ProtectedRoute>} />
                <Route path="/instructor/*" element={
                  <ProtectedRoute requiresAuth={true} requiresInstructor={true}>
                    <ProfessionalInstructorDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/become-instructor" element={<BecomeInstructor />} />

                <Route path="/course/:slug" element={<CourseDetailPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LayoutWrapper>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useNavigate, Routes, Route, Navigate, Link } from 'react-router-dom';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { CourseList } from './dashboard/CourseList';
import { StudentList } from './dashboard/StudentList';
import InstructorFinanceReport from './dashboard/InstructorFinanceReport';
import { InstructorProfileSettings } from './dashboard/InstructorProfileSettings';
import { InstructorAccountSettings } from './dashboard/InstructorAccountSettings';
import { PlaceholderSection } from './dashboard/PlaceholderSection';
import { InstructorQA } from './dashboard/InstructorQA';
import { InstructorAnnouncements } from './dashboard/InstructorAnnouncements';
import { InstructorReviews } from './dashboard/InstructorReviews';
import { InstructorMessages } from './dashboard/InstructorMessages';
import { BookManager } from './dashboard/BookManager';
import InstructorPayoutSettings from './dashboard/InstructorPayoutSettings';
import InstructorShell from './shell/InstructorShell';

export default function ProfessionalInstructorDashboard() {
    const navigate = useNavigate();

    return (
        <InstructorShell>
            <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="courses/list" element={<CourseList />} />
                <Route path="courses/announcements" element={<InstructorAnnouncements />} />
                <Route path="students/list" element={<StudentList />} />
                <Route path="students/qa" element={<InstructorQA onBack={() => navigate('/instructor/dashboard')} />} />
                <Route path="books/manage" element={<BookManager />} />
                <Route path="students/reviews" element={<InstructorReviews />} />
                <Route path="students/messages" element={<InstructorMessages />} />
                <Route path="finance/report" element={<InstructorFinanceReport />} />
                <Route path="finance/earnings" element={<InstructorFinanceReport />} />
                <Route path="finance/payout" element={<InstructorPayoutSettings />} />
                <Route path="finance/sales" element={<InstructorFinanceReport />} />
                <Route path="settings/profile" element={<InstructorProfileSettings />} />
                <Route path="settings/account" element={<InstructorAccountSettings />} />
                <Route path="settings/help" element={<PlaceholderSection title="Yardım & Destek" onBack={() => navigate('/instructor/dashboard')} />} />
                <Route path="*" element={
                    <div className="py-24 max-w-md">
                        <h1 className="text-2xl font-bold tracking-tight">Bu sayfa panelde yok</h1>
                        <p className="text-[14px] text-[#3e4947] mt-2">
                            Bağlantı eskimiş olabilir. Soldaki menüden devam edebilirsin.
                        </p>
                        <Link
                            to="/instructor/dashboard"
                            className="inline-flex mt-6 h-10 px-4 items-center rounded-lg bg-[#005c55] text-white text-[13.5px] font-semibold"
                        >
                            Genel bakışa dön
                        </Link>
                    </div>
                } />
            </Routes>
        </InstructorShell>
    );
}

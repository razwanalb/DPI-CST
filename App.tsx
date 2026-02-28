
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AcademicPage from './pages/AcademicPage';
import TeachersPage from './pages/FacultyPage';
import EventsPage from './pages/EventsPage';
import NoticePage from './pages/NoticePage';
import ResultsPage from './pages/ResultsPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminManageNotices from './pages/admin/AdminManageNotices';
import AdminManageEvents from './pages/admin/AdminManageEvents';
import AdminManageTeachers from './pages/admin/AdminManageFaculty';
import AdminManageAcademic from './pages/admin/AdminManageAcademic';
import AdminManageResults from './pages/admin/AdminManageResults';
import AdminAcademicResources from './pages/admin/AdminAcademicResources';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import EventDetailPage from './pages/EventDetailPage'; // Import the new page

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="flex flex-col min-h-screen bg-[#001833] text-text font-display">
            {!isAdminRoute && <Header />}
            <main className="flex-grow">
                {children}
            </main>
            {!isAdminRoute && <Footer />}
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
            <PageLayout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/academic" element={<AcademicPage />} />
                    <Route path="/teachers" element={<TeachersPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/notice" element={<NoticePage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/event/:id" element={<EventDetailPage />} />

                    <Route path="/admin" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="notices" element={<AdminManageNotices />} />
                        <Route path="events" element={<AdminManageEvents />} />
                        <Route path="teachers" element={<AdminManageTeachers />} />
                        <Route path="academic" element={<AdminManageAcademic />} />
                        <Route path="results" element={<AdminManageResults />} />
                        <Route path="resources" element={<AdminAcademicResources />} />
                        <Route path="settings" element={<AdminSiteSettings />} />
                    </Route>
                </Routes>
            </PageLayout>
        </Router>
    </AuthProvider>
  );
};

export default App;
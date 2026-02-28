



import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../components/AuthContext';

const allAdminNavLinks = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { name: 'Notices', path: '/admin/notices', icon: 'campaign' },
    { name: 'Events', path: '/admin/events', icon: 'event' },
    { name: 'Teachers', path: '/admin/teachers', icon: 'groups' },
    { name: 'Academic', path: '/admin/academic', icon: 'school' },
    { name: 'Results', path: '/admin/results', icon: 'grade' },
    { name: 'Resources', path: '/admin/resources', icon: 'folder' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
];

const AdminLayout: React.FC = () => {
    const { logout, currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error: any) {
            console.error("Failed to log out", error.message);
        }
    };

    return (
        <div className="flex h-screen bg-[#001833] text-text">
            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-center border-b border-border px-4 flex-shrink-0">
                     <h1 className="text-xl font-bold text-text">Admin Panel</h1>
                </div>
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {allAdminNavLinks.map(link => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            end={link.path === '/admin'}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive 
                                ? 'bg-primary/20 text-primary' 
                                : 'text-text/80 hover:bg-surface/80 hover:text-text'}`
                            }
                        >
                            <span className="material-symbols-outlined">{link.icon}</span>
                            {link.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-border flex-shrink-0">
                    <div className="text-sm text-text/70 mb-2 truncate">
                        {currentUser?.email}
                        {userRole && <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-bold uppercase">{userRole}</span>}
                    </div>
                     <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-surface hover:bg-red-500/20 hover:text-red-400"
                    >
                         <span className="material-symbols-outlined">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto select-none">
                 {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-10 flex items-center justify-between bg-surface/90 backdrop-blur-sm h-16 px-4 border-b border-border flex-shrink-0">
                    <h1 className="text-xl font-bold text-text">Dashboard</h1>
                    <button onClick={() => setIsSidebarOpen(true)} aria-label="Open sidebar" className="p-2 text-text">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>

                <div className="p-8 flex-grow">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
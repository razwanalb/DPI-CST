
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';

const StatCard: React.FC<{ title: string; value: string; icon: string; }> = ({ title, value, icon }) => (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-secondary">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div>
            <p className="text-text/70 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-text">{value}</p>
        </div>
    </div>
);

const QuickLink: React.FC<{ title: string; description: string; icon: string; path: string; }> = ({ title, description, icon, path }) => (
    <Link to={path} className="bg-surface border border-border rounded-xl p-5 flex flex-col text-left hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <div>
                 <h3 className="text-lg font-bold text-text">{title}</h3>
            </div>
        </div>
        <p className="text-sm text-text/70 mt-3">{description}</p>
    </Link>
);

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        notices: 0,
        upcomingEvents: 0,
        faculty: 0,
        students: 1600 // This remains static as there is no central student table
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            try {
                const noticePromise = supabase
                    .from('notices')
                    .select('*', { count: 'exact', head: true });

                const eventPromise = supabase
                    .from('events')
                    .select('*', { count: 'exact', head: true })
                    .gt('date', new Date().toISOString());

                const facultyPromise = supabase
                    .from('faculty')
                    .select('*', { count: 'exact', head: true });
                
                const [
                    { count: noticeCount },
                    { count: eventCount },
                    { count: facultyCount }
                ] = await Promise.all([
                    noticePromise,
                    eventPromise,
                    facultyPromise
                ]);

                setStats({
                    notices: noticeCount ?? 0,
                    upcomingEvents: eventCount ?? 0,
                    faculty: facultyCount ?? 0,
                    students: 1600
                });

            } catch (error: any) {
                console.error("Error fetching dashboard stats:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-text/70 mt-1">An overview of your website's content and activity.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Total Notices" value={loading ? '...' : stats.notices.toString()} icon="campaign" />
                <StatCard title="Upcoming Events" value={loading ? '...' : stats.upcomingEvents.toString()} icon="event" />
                <StatCard title="Teachers" value={loading ? '...' : stats.faculty.toString()} icon="groups" />
                <StatCard title="Total Students" value={stats.students.toString()} icon="school" />
            </div>

            {/* Quick Actions */}
            <div>
                 <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <QuickLink 
                        title="Create New Notice" 
                        description="Post a new announcement or update for students and faculty."
                        icon="add_circle"
                        path="/admin/notices"
                    />
                     <QuickLink 
                        title="Add New Teacher" 
                        description="Add a new teacher or staff member to the directory."
                        icon="person_add"
                        path="/admin/teachers"
                    />
                     <QuickLink 
                        title="Upload Resources" 
                        description="Upload a new class routine, syllabus, or other academic material."
                        icon="upload_file"
                        path="/admin/resources"
                    />
                 </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
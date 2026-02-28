
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import TeacherCard, { Teacher } from '../components/TeacherCard';

const GuestTeacherPage: React.FC = () => {
    const [guestTeachers, setGuestTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGuestTeachers = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('faculty')
                .select('*')
                .eq('title', 'Guest Teacher')
                .order('name', { ascending: true });

            if (error) {
                console.error("Error fetching guest teachers:", error.message);
                setError("Could not load the guest teacher directory.");
            } else {
                setGuestTeachers(data as Teacher[]);
            }
            setLoading(false);
        };

        fetchGuestTeachers();
    }, []);

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-text">Guest Teachers</h1>
                    <p className="mt-2 text-lg text-text/70">Meet the guest teachers contributing to our department.</p>
                </div>

                {loading ? (
                    <p className="text-center text-text/70">Loading guest teachers...</p>
                ) : error ? (
                    <div className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</div>
                ) : guestTeachers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {guestTeachers.map(member => (
                            <TeacherCard key={member.id} member={member} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-surface rounded-xl border border-border">
                        <span className="material-symbols-outlined text-6xl text-text/30">group_off</span>
                        <h3 className="mt-4 text-xl font-semibold text-text">No Guest Teachers Found</h3>
                        <p className="mt-2 text-text/60">There are currently no guest teachers listed in the directory.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuestTeacherPage;
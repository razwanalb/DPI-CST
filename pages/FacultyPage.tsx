import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabase';
import TeacherCard, { Teacher } from '../components/TeacherCard';


// --- Fallback Data ---
const fallbackTeacherData: Teacher[] = [
    { id: 'fb1', name: 'Dr. John Doe', title: 'Head of Department (Day)', qualification: 'Ph.D. in Computer Science', specialization: 'Artificial Intelligence, Machine Learning', email: 'john.doe@dpi.ac.bd', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ-deVQh9cMmyUGYCbaySdIecFeIwU5S2CqAID_-xqsnwZ6bTtvmRZXr1VnG9TP8Ygr-Vjv_ZfC8Cus20L1UkWUh2AoPXqnAx_vCPRZS7FnNipTpL0XrnOPU-MkGz7eWVLVbx1W8OSskxUuCf3_-QD_QQt-uzkUKvfnxKgBxu9UijjYqlSapaNTc3CQxoAmS_Puu_qtYo7hrKfFlCW2SdKf7wMl08Bdg2WyboOYtwZtzZ1WhNJCieJJWaj4qz5-TGwlRFawFDSm4E4', mobile_number: '01700000001' },
    { id: 'fb2', name: 'Dr. Alice Johnson', title: 'Head of Department (Morning)', qualification: 'M.Sc. in Software Engineering', specialization: 'Web Development, Cloud Computing', email: 'alice.j@dpi.ac.bd', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPAhL6pYWkeyfn_0IbY8kzCxenB1t8uhm2c1Zh7xETqpK09UrzhMsVEHVYTJzk-gPY4LUZdGWgq7BYnTTS04hSTbS30ZvZgjASAIzReXdh5aflUgE_Bnynt_GQxjePOhTjw_-nuUzYG5D07M0KWzwE-FksNYwz9u521RPGdGFvkX8IiW9H-aebkoTIUE4YKBe5PjrGRywIR_5uQ0VZYL5VZXib3HelWoQL7G93tNBs2_XoMgAt462qXBNAFJ34mVnOipFcOw4exZPV', mobile_number: '01700000002' },
    { id: 'fb3', name: 'Md. Rakibul Islam', title: 'Instructor', qualification: 'B.Sc. in CSE', specialization: 'Data Structures, Algorithms', email: 'rakibul.i@dpi.ac.bd', imageUrl: 'https://i.imgur.com/8gEb1Xn.jpg', mobile_number: '01700000003' },
    { id: 'fb4', name: 'Fatima Akter', title: 'Instructor', qualification: 'B.Sc. in CSE', specialization: 'Database Management Systems', email: 'fatima.a@dpi.ac.bd', imageUrl: 'https://i.imgur.com/DpxUbgy.jpg', mobile_number: '01700000004' },
    { id: 'fb5', name: 'Sanjida Rahman', title: 'Junior Instructor', qualification: 'Diploma in Computer Engineering', specialization: 'Computer Networking', email: 'sanjida.r@dpi.ac.bd', imageUrl: 'https://i.imgur.com/blJjL7d.jpg', mobile_number: '01700000005' },
];


const filters = ['All', 'Heads of Department', 'Instructors', 'Junior Instructors', 'Guest', 'Staff'];

const TeachersPage: React.FC = () => {
    const [teachersData, setTeachersData] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from('faculty')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error(
                    "FIX REQUIRED: Could not fetch faculty from Supabase. This is likely caused by RLS policies blocking public read access. Please go to your Supabase Dashboard -> Authentication -> Policies and ensure the 'faculty' table allows public reads. Displaying fallback data.",
                    error.message || error
                );
                setError("Could not load the latest directory. Displaying default data.");
                setTeachersData(fallbackTeacherData);
            } else {
                setTeachersData(data as Teacher[]);
            }
            setLoading(false);
        };
        fetchTeachers();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const searchedTeachers = useMemo(() => {
        return teachersData.filter(member =>
            member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            member.specialization.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [debouncedSearchTerm, teachersData]);

    const heads = searchedTeachers.filter(m => m.title.includes('Head of Department'));
    const instructors = searchedTeachers.filter(m => m.title === 'Instructor');
    const juniorInstructors = searchedTeachers.filter(m => m.title === 'Junior Instructor');
    const guestTeachers = searchedTeachers.filter(m => m.title === 'Guest Teacher');
    const staff = searchedTeachers.filter(m => m.title === 'Staff');
    
    const showHeads = (activeFilter === 'All' || activeFilter === 'Heads of Department') && heads.length > 0;
    const showInstructors = (activeFilter === 'All' || activeFilter === 'Instructors') && instructors.length > 0;
    const showJuniorInstructors = (activeFilter === 'All' || activeFilter === 'Junior Instructors') && juniorInstructors.length > 0;
    const showGuestTeachers = (activeFilter === 'All' || activeFilter === 'Guest') && guestTeachers.length > 0;
    const showStaff = (activeFilter === 'All' || activeFilter === 'Staff') && staff.length > 0;
    const noResults = !showHeads && !showInstructors && !showJuniorInstructors && !showGuestTeachers && !showStaff;

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {error && (
                    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-8 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        <div>
                            <strong className="font-bold">Notice:</strong> {error}
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2 text-center">
                        <h2 className="text-text text-4xl font-black leading-tight tracking-[-0.033em]">Teachers & Staff Directory</h2>
                        <p className="text-text/70 text-lg font-normal leading-normal">Meet the dedicated and experienced teachers and staff of the Computer Department.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:flex-1 max-w-md">
                            <label className="flex flex-col min-w-40 h-12 w-full">
                                <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-surface border border-border shadow-sm">
                                    <div className="text-text/70 flex items-center justify-center pl-4">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-text/60 px-2 text-base font-normal leading-normal" placeholder="Search by name or specialization" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </label>
                        </div>
                        <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                            {filters.map(filter => (
                                <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium shadow-sm transition-colors ${activeFilter === filter ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-surface text-text/80 hover:bg-surface/50'}`}>
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-text/70 col-span-full pt-8">Loading teachers...</p>
                    ) : (
                        <>
                            {showHeads && (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                        {heads.map(member => <TeacherCard key={member.id} member={member} />)}
                                    </div>
                                </div>
                            )}
                            
                            {showInstructors && (
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold gradient-text mb-6 pb-2 border-b-2 border-border">Instructors</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {instructors.map(member => <TeacherCard key={member.id} member={member} />)}
                                    </div>
                                </div>
                            )}
                            
                            {showJuniorInstructors && (
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold gradient-text mb-6 pb-2 border-b-2 border-border">Junior Instructors</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {juniorInstructors.map(member => <TeacherCard key={member.id} member={member} />)}
                                    </div>
                                </div>
                            )}

                             {showGuestTeachers && (
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold gradient-text mb-6 pb-2 border-b-2 border-border">Guest</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {guestTeachers.map(member => <TeacherCard key={member.id} member={member} />)}
                                    </div>
                                </div>
                            )}

                            {showStaff && (
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold gradient-text mb-6 pb-2 border-b-2 border-border">Staff</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {staff.map(member => <TeacherCard key={member.id} member={member} />)}
                                    </div>
                                </div>
                            )}
                            
                            {noResults && (
                                <p className="text-center text-text/70 col-span-full pt-8">No members found matching your criteria.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachersPage;
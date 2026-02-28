
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

const tabs = ['Syllabus', 'Class Routines', 'Exam Schedules', 'Notes & Resources', 'Admissions Info', 'DPI Programming Club', 'Student List'];
const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];

// --- Types ---
interface ResourceFile { id: string; image_url: string; file_path: string; }
interface NoteGroup { groupId: string; title: string; semester: string; images: ResourceFile[]; pdf: ResourceFile | null; }
interface PastPaperResource { id: string; title: string; image_url: string; }
type GroupedNotes = { [semester: string]: NoteGroup[] };
type GroupedPastPapers = { [semester: string]: PastPaperResource[] };
interface Student {
    id: string;
    name: string;
    roll: string;
    semester: string;
    shift: string;
    imageUrl?: string;
    gender?: 'Male' | 'Female';
}

const defaultMaleAvatar = 'https://i.postimg.cc/6QKTH6ds/male.jpg';
const defaultFemaleAvatar = 'https://i.postimg.cc/zfkv4mjn/female.jpg';


// --- Components ---
const ResourceViewerModal: React.FC<{ isOpen: boolean; onClose: () => void; note: NoteGroup | null }> = ({ isOpen, onClose, note }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0); // Reset index when modal opens or note changes
        }
    }, [isOpen, note]);
    
    if (!isOpen || !note) return null;

    const hasImages = note.images && note.images.length > 0;
    const currentImage = hasImages ? note.images[currentIndex] : null;

    const handleNext = () => {
        if (hasImages && currentIndex < note.images.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (hasImages && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDownloadAll = async () => {
        if (!hasImages) return;
        setIsDownloading(true);
        try {
            for (let i = 0; i < note.images.length; i++) {
                const image = note.images[i];
                const response = await fetch(image.image_url);
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                const filename = image.file_path.split('___').pop() || `image_${i + 1}.jpg`;
                const safeTitle = note.title.replace(/[^a-zA-Z0-9]/g, '_');
                link.download = `${safeTitle}_${filename}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert("An error occurred while trying to download the images.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-4xl max-h-[90vh] bg-[#001833] border border-border rounded-xl shadow-2xl flex flex-col" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <div className="flex justify-between items-center p-4 border-b border-border shrink-0 gap-4">
                        <h2 className="text-xl font-bold text-text truncate" title={note.title}>{note.title}</h2>
                        <div className="flex items-center gap-2 shrink-0">
                             {hasImages && (
                                <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-secondary hover:bg-secondary/90 text-white disabled:opacity-50">
                                    <span className="material-symbols-outlined text-base">{isDownloading ? 'hourglass_top' : 'download'}</span>
                                    {isDownloading ? 'Downloading...' : 'Download All'}
                                </button>
                            )}
                            <button onClick={onClose} className="text-text/70 hover:text-text"><span className="material-symbols-outlined">close</span></button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow flex flex-col items-center justify-center relative">
                       {note.pdf && <a href={note.pdf.image_url} target="_blank" rel="noopener noreferrer" className="mb-6 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-semibold transition-colors"><span className="material-symbols-outlined">picture_as_pdf</span>View PDF</a>}
                       
                        {hasImages ? (
                             <div className="relative w-full h-full flex items-center justify-center">
                                {/* Image Display */}
                                <div className="w-full h-full flex items-center justify-center">
                                    <img src={currentImage!.image_url} alt={`${note.title} - ${currentIndex + 1}`} className="max-w-full max-h-[60vh] object-contain" />
                                </div>

                                {/* Prev Button */}
                                {currentIndex > 0 && (
                                    <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                )}
                                
                                {/* Next Button */}
                                {currentIndex < note.images.length - 1 && (
                                    <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                )}
                                
                                {/* Counter */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                    {currentIndex + 1} / {note.images.length}
                                </div>
                            </div>
                        ) : !note.pdf ? (
                             <p className="text-text/70">No content available for this note.</p>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const RoutineViewerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    routine: { url: string; name: string } | null;
}> = ({ isOpen, onClose, routine }) => {
    if (!isOpen || !routine) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(routine.url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            const safeName = routine.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s/g, '_');
            link.download = `${safeName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download image. You can try right-clicking the image and selecting 'Save Image As'.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="flex justify-between items-center p-4 border-b border-border shrink-0">
                            <h2 className="text-xl font-bold text-text">{routine.name}</h2>
                            <button onClick={onClose} className="text-text/70 hover:text-text"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow flex items-center justify-center">
                            <img src={routine.url} alt={routine.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="p-4 border-t border-border shrink-0 flex justify-end">
                            <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white">
                                <span className="material-symbols-outlined">download</span>
                                Download
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Main Page ---
const AcademicPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Syllabus');
    
    // Data states
    const [pageData, setPageData] = useState({
        syllabus: {},
        routines: [],
        siteContent: {},
        students: [],
        notes: {},
        pastPapers: {}
    });
    const [loading, setLoading] = useState(true);
    
    // UI states
    const [activeResourceTab, setActiveResourceTab] = useState<'notes' | 'past_papers'>('notes');
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<NoteGroup | null>(null);
    const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState<{ url: string; name: string } | null>(null);

    // State hooks moved to top level
    const [shift, setShift] = useState<'Morning' | 'Day'>('Morning');
    const [search, setSearch] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [filterShift, setFilterShift] = useState('');
    
    const [heroContent, setHeroContent] = useState({
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAPWSvzotivWiTCcGd0i900w-3raWT8xotjhH2cv5sYinmx3_GNgMWHpibI9jdqB4ibTvRmlMHnyf-10rBCBxQIro7Fi-OCT27ce922Cdlm0w_2N6KsPQrynjZdbax-AoNIf0LgBD2HiOVdLosDDdjY7KZh8uuUB1puXSbEP8eBbW_YeVDXlVDgDSDIpXSQo6aJ__6kPkeapRStNTBlbPpJHSSYR0vFtE5tkzrEYQwpoAvuYr1MHxhV1CPgW1AwwOdV1mLUm6-IS0p2",
        title: 'Academic Hub',
        subtitle: 'All your academic resources in one place. Access syllabus, routines, notes, and more.'
    });

    const filteredStudents = useMemo(() => {
        const searchLower = search.trim().toLowerCase();
        return (pageData.students as Student[]).filter(s => {
            const searchMatch = searchLower ? (s.name.toLowerCase().includes(searchLower) || s.roll.toLowerCase().includes(searchLower)) : true;
            const semesterMatch = filterSem ? s.semester === filterSem : true;
            const shiftMatch = filterShift ? s.shift === filterShift : true;
            return searchMatch && semesterMatch && shiftMatch;
        });
    }, [pageData.students, search, filterSem, filterShift]);
    
    useEffect(() => {
        const fetchHeroContent = async () => {
            const { data, error } = await supabase.from('site_settings')
                .select('key, value')
                .in('key', ['hero_academic_image_url', 'hero_academic_title', 'hero_academic_subtitle']);

            if (!error && data) {
                const contentMap = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>);
                setHeroContent(prev => ({
                    imageUrl: contentMap.hero_academic_image_url || prev.imageUrl,
                    title: contentMap.hero_academic_title || prev.title,
                    subtitle: contentMap.hero_academic_subtitle || prev.subtitle
                }));
            }
        };
        fetchHeroContent();
    }, []);

    useEffect(() => {
        const fetchTabData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'Syllabus') {
                    const { data } = await supabase.from('syllabus').select('semester, imageUrl, pdfUrl');
                    setPageData(prev => ({ ...prev, syllabus: (data || []).reduce((acc, item) => ({ ...acc, [item.semester]: item }), {}) }));
                } else if (activeTab === 'Class Routines') {
                    const { data } = await supabase.from('class_routines').select('*');
                    setPageData(prev => ({ ...prev, routines: data || [] }));
                } else if (activeTab === 'Notes & Resources') {
                     const { data } = await supabase.from('academic_resources').select('*');
                    if (data) {
                        const notes: { [sem: string]: { [gid: string]: NoteGroup } } = {};
                        const pastPapers: GroupedPastPapers = {};
                        for (const res of data) {
                            const pathParts = res.file_path.split('/');
                            const filename = pathParts.pop() || '';
                            const nameParts = filename.split('___');
                            let title = nameParts.length > 1 ? nameParts[0].replace(/_/g, ' ') : filename.substring(0, filename.lastIndexOf('.'));

                            if (res.resource_type === 'note' && nameParts.length > 2) {
                                const groupId = nameParts[1];
                                if (!notes[res.semester]) notes[res.semester] = {};
                                if (!notes[res.semester][groupId]) notes[res.semester][groupId] = { groupId, title, semester: res.semester, images: [], pdf: null };
                                const file = { id: res.id, image_url: res.image_url, file_path: res.file_path };
                                if (res.file_path.toLowerCase().endsWith('.pdf')) notes[res.semester][groupId].pdf = file;
                                else notes[res.semester][groupId].images.push(file);
                            } else if (res.resource_type === 'past_paper') {
                                if (!pastPapers[res.semester]) pastPapers[res.semester] = [];
                                pastPapers[res.semester].push({ id: res.id, title, image_url: res.image_url });
                            }
                        }
                        const finalNotes: GroupedNotes = {};
                        for (const sem in notes) finalNotes[sem] = Object.values(notes[sem]);
                        setPageData(prev => ({...prev, notes: finalNotes, pastPapers }));
                    }
                } else if (['Admissions Info', 'DPI Programming Club', 'Exam Schedules'].includes(activeTab)) {
                    const keyMap = { 'Admissions Info': 'admissions_info', 'DPI Programming Club': 'programming_club', 'Exam Schedules': 'exam_schedules' };
                    const { data } = await supabase.from('site_content').select('content').eq('key', keyMap[activeTab]).single();
                    setPageData(prev => ({...prev, siteContent: {...prev.siteContent, [keyMap[activeTab]]: data?.content || ''}}));
                } else if (activeTab === 'Student List') {
                    const { data } = await supabase.from('students').select('*').order('roll');
                    setPageData(prev => ({...prev, students: data || []}));
                }
            } catch (error: any) { console.error("Error fetching data for tab " + activeTab, error.message); }
            setLoading(false);
        };
        fetchTabData();
    }, [activeTab]);

    const openResourceModal = (note: NoteGroup) => {
        setSelectedNote(note);
        setIsResourceModalOpen(true);
    };
    
    const openRoutineModal = (url: string, name: string) => {
        setSelectedRoutine({ url, name });
        setIsRoutineModalOpen(true);
    };

    const renderTabContent = () => {
        if(loading) return <div className="p-8 text-center">Loading...</div>;

        switch (activeTab) {
            case 'Syllabus':
                return (
                    <div className="p-4 md:p-6 divide-y divide-border">
                        {semesters.map(semester => (
                            <details key={semester} className="group py-2"><summary className="summary-marker-hidden list-none flex cursor-pointer items-center justify-between p-2 rounded-lg hover:bg-surface">
                                    <p className="text-text font-medium">{semester}</p><span className="material-symbols-outlined text-text group-open:rotate-180">expand_more</span></summary>
                                <div className="p-4 flex items-center gap-4">
                                    {pageData.syllabus[semester]?.imageUrl ? <a href={pageData.syllabus[semester].imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary/20 text-primary hover:bg-primary/30"><span className="material-symbols-outlined">image</span> View Image</a> : <p className="text-sm text-text/60">Image N/A</p>}
                                    {pageData.syllabus[semester]?.pdfUrl ? <a href={pageData.syllabus[semester].pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30"><span className="material-symbols-outlined">picture_as_pdf</span> Download PDF</a> : <p className="text-sm text-text/60">PDF N/A</p>}
                                </div>
                            </details>
                        ))}
                    </div>
                );
            case 'Class Routines':
                 return (
                    <div className="p-4 md:p-6">
                         <div className="flex justify-center gap-2 p-1 mb-6 bg-surface/50 rounded-lg border border-border w-fit mx-auto">
                            <button onClick={() => setShift('Morning')} className={`px-6 py-2 rounded-md text-sm font-semibold ${shift === 'Morning' ? 'bg-primary text-white' : 'hover:bg-surface'}`}>Morning</button>
                            <button onClick={() => setShift('Day')} className={`px-6 py-2 rounded-md text-sm font-semibold ${shift === 'Day' ? 'bg-primary text-white' : 'hover:bg-surface'}`}>Day</button>
                        </div>
                        <div className="divide-y divide-border">
                            {semesters.map(semester => {
                                const groupA = pageData.routines.find(r => r.semester === semester && r.shift === shift && r.student_group === 'A');
                                const groupB = pageData.routines.find(r => r.semester === semester && r.shift === shift && r.student_group === 'B');
                                return (
                                <details key={`${shift}-${semester}`} className="group py-2"><summary className="summary-marker-hidden list-none flex cursor-pointer items-center justify-between p-2 rounded-lg hover:bg-surface">
                                    <p className="text-text font-medium">{semester}</p><span className="material-symbols-outlined text-text group-open:rotate-180">expand_more</span></summary>
                                    <div className="p-4 flex items-center gap-4">
                                        {groupA ? (
                                            <button onClick={() => openRoutineModal(groupA.image_url, `${semester} ${shift} Shift - Group A Routine`)} className="flex-1 text-center py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md text-sm font-semibold cursor-pointer">Group A</button>
                                        ) : (
                                            <span className="flex-1 text-center py-2 bg-surface/50 text-text/60 rounded-md text-sm">Group A N/A</span>
                                        )}
                                        {groupB ? (
                                            <button onClick={() => openRoutineModal(groupB.image_url, `${semester} ${shift} Shift - Group B Routine`)} className="flex-1 text-center py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-md text-sm font-semibold cursor-pointer">Group B</button>
                                        ) : (
                                            <span className="flex-1 text-center py-2 bg-surface/50 text-text/60 rounded-md text-sm">Group B N/A</span>
                                        )}
                                    </div>
                                </details>
                            )})}
                        </div>
                    </div>
                );
            case 'Exam Schedules':
                const scheduleContent = pageData.siteContent['exam_schedules'];
                return (
                    <div className="p-8">
                        {scheduleContent ? <div className="bg-surface/50 p-6 rounded-lg border border-border whitespace-pre-wrap text-text/90">{scheduleContent}</div> : <div className="text-center text-text/70">No exam schedules posted.</div>}
                    </div>
                );
            case 'Notes & Resources':
                return (
                    <div className="p-4">
                        <div className="flex justify-center gap-2 p-1 mb-6 bg-surface/50 rounded-lg border border-border w-fit mx-auto">
                            <button onClick={() => setActiveResourceTab('notes')} className={`px-6 py-2 rounded-md text-sm font-semibold ${activeResourceTab === 'notes' ? 'bg-primary text-white' : 'hover:bg-surface'}`}>Class Notes</button>
                            <button onClick={() => setActiveResourceTab('past_papers')} className={`px-6 py-2 rounded-md text-sm font-semibold ${activeResourceTab === 'past_papers' ? 'bg-primary text-white' : 'hover:bg-surface'}`}>Past Papers</button>
                        </div>
                        <div className="divide-y divide-border">
                            {semesters.map(semester => (
                                <details key={`${activeResourceTab}-${semester}`} className="group py-2"><summary className="summary-marker-hidden list-none flex cursor-pointer items-center justify-between p-2 rounded-lg hover:bg-surface">
                                    <p className="text-text font-medium">{semester}</p><span className="material-symbols-outlined text-text group-open:rotate-180">expand_more</span></summary>
                                    <div className="p-4">
                                        {activeResourceTab === 'notes' ?
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {(pageData.notes[semester] || []).map(note => (<div key={note.groupId} onClick={() => openResourceModal(note)} className="bg-surface border p-4 cursor-pointer rounded-lg hover:shadow-lg"><p className="font-semibold truncate">{note.title}</p></div>))}
                                            </div>
                                            :
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                                {(pageData.pastPapers[semester] || []).map(paper => (<a key={paper.id} href={paper.image_url} target="_blank" className="group aspect-[4/5] bg-surface border rounded-lg p-3 flex flex-col items-center text-center"><span className="material-symbols-outlined text-5xl text-red-400">picture_as_pdf</span><p className="text-sm font-semibold line-clamp-3 mt-2">{paper.title}</p></a>))}
                                            </div>
                                        }
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                );
            case 'Admissions Info':
            case 'DPI Programming Club':
                const contentKey = activeTab === 'Admissions Info' ? 'admissions_info' : 'programming_club';
                const content = pageData.siteContent[contentKey];
                return (
                    <div className="p-8">
                        {content ? <div className="bg-surface/50 p-6 rounded-lg border border-border whitespace-pre-wrap text-text/90">{content}</div> : <div className="text-center text-text/70">Content coming soon.</div>}
                    </div>
                );
            case 'Student List':
                const inputStyle = "w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text placeholder:text-text/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";
                const showResults = search.trim() !== '' || (filterSem && filterShift);

                 return (
                     <div className="p-4 md:p-6">
                        <div className="bg-surface p-4 rounded-lg border border-border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                           <input type="text" placeholder="Search by Roll or Name..." value={search} onChange={e => setSearch(e.target.value)} className={inputStyle} />
                           <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className={inputStyle}>
                               <option value="">Select Semester</option>
                               {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                           <select value={filterShift} onChange={e => setFilterShift(e.target.value)} className={inputStyle}>
                               <option value="">Select Shift</option>
                               <option value="Morning">Morning</option>
                               <option value="Day">Day</option>
                           </select>
                        </div>
                        
                        {showResults ? (
                            <div className="bg-surface border border-border rounded-lg overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="bg-surface text-left text-text">
                                        <tr>
                                            <th className="p-3 font-semibold">Image</th>
                                            <th className="p-3 font-semibold">Roll</th>
                                            <th className="p-3 font-semibold">Name</th>
                                            <th className="p-3 font-semibold">Semester</th>
                                            <th className="p-3 font-semibold">Shift</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                            <tr key={s.id} className="border-b border-border odd:bg-surface/40 even:bg-transparent hover:bg-primary/20 transition-colors duration-200">
                                                <td className="p-2">
                                                    <img
                                                        src={s.imageUrl || (s.gender === 'Female' ? defaultFemaleAvatar : defaultMaleAvatar)}
                                                        alt={`Photo of ${s.name}`}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = defaultMaleAvatar;
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-3 text-text/90">{s.roll}</td>
                                                <td className="p-3 text-text/90">{s.name}</td>
                                                <td className="p-3 text-text/90">{s.semester}</td>
                                                <td className="p-3 text-text/90">{s.shift}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="text-center p-8 text-text/60">No students found for the selected criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-surface/50 rounded-lg border border-dashed border-border">
                                <span className="material-symbols-outlined text-6xl text-text/30">manage_search</span>
                                <p className="mt-4 text-text/70 font-medium">Please select a semester and shift, or search by roll/name to view students.</p>
                            </div>
                        )}
                     </div>
                );
            default: return null;
        }
    };

    return (
        <>
            <ResourceViewerModal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} note={selectedNote} />
            <RoutineViewerModal isOpen={isRoutineModalOpen} onClose={() => setIsRoutineModalOpen(false)} routine={selectedRoutine} />
            
            <div className="relative rounded-b-xl overflow-hidden mb-12">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to right, rgba(0, 24, 51, 0.8), rgba(0, 35, 66, 0.7)), url("${heroContent.imageUrl}")` }}></div>
                <div className="relative max-w-7xl mx-auto flex flex-col gap-4 items-center justify-center p-12 text-center text-white min-h-[300px]">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl">{heroContent.title}</h1>
                    <p className="text-lg font-normal leading-normal max-w-2xl">{heroContent.subtitle}</p>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto mb-16 text-center">
                    <h2 className="text-3xl font-bold gradient-text mb-2">Your Central Resource for Success</h2>
                    <p className="text-text/80 max-w-3xl mx-auto">
                        This section is designed to provide easy access to all the academic materials you need. From the latest syllabus and class schedules to detailed notes and past exam papers, everything is organized by semester to help you stay on top of your studies.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto mb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                            <span className="material-symbols-outlined text-4xl text-primary">layers</span>
                            <div>
                                <p className="text-2xl font-bold">8</p>
                                <p className="text-text/70">Semesters</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                            <span className="material-symbols-outlined text-4xl text-secondary">menu_book</span>
                            <div>
                                <p className="text-2xl font-bold">50+</p>
                                <p className="text-text/70">Courses Covered</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                            <span className="material-symbols-outlined text-4xl text-accent">folder_zip</span>
                            <div>
                                <p className="text-2xl font-bold">1200+</p>
                                <p className="text-text/70">Resources Available</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                            <span className="material-symbols-outlined text-4xl text-green-400">school</span>
                            <div>
                                <p className="text-2xl font-bold">95%</p>
                                <p className="text-text/70">Pass Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold gradient-text mb-6 text-center">Explore Our Key Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Java Card */}
                        <div className="bg-surface border border-border p-6 rounded-xl flex flex-col text-center items-center hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300">
                            <span className="material-symbols-outlined text-5xl text-primary mb-3">integration_instructions</span>
                            <h3 className="text-xl font-bold text-text mb-2">Master Java Programming</h3>
                            <p className="text-text/80 text-sm mb-4 flex-grow">
                                Dive deep into object-oriented programming with our complete set of Java notes, including code examples and project ideas.
                            </p>
                            <button
                                onClick={() => setActiveTab('Notes & Resources')}
                                className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                            >
                                Go to Notes
                            </button>
                        </div>
                        {/* Python Card */}
                        <div className="bg-surface border border-border p-6 rounded-xl flex flex-col text-center items-center hover:shadow-secondary/20 hover:-translate-y-2 transition-all duration-300">
                            <span className="material-symbols-outlined text-5xl text-secondary mb-3">code</span>
                            <h3 className="text-xl font-bold text-text mb-2">Unlock Python</h3>
                            <p className="text-text/80 text-sm mb-4 flex-grow">
                                From basic syntax to advanced concepts, our Python resources will help you build a solid foundation in this versatile language.
                            </p>
                            <button
                                onClick={() => setActiveTab('Notes & Resources')}
                                className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-secondary/20 hover:bg-secondary/30 text-secondary transition-colors"
                            >
                                Go to Notes
                            </button>
                        </div>
                        {/* DSA Card */}
                        <div className="bg-surface border border-border p-6 rounded-xl flex flex-col text-center items-center hover:shadow-accent/20 hover:-translate-y-2 transition-all duration-300">
                            <span className="material-symbols-outlined text-5xl text-accent mb-3">hub</span>
                            <h3 className="text-xl font-bold text-text mb-2">Conquer DSA</h3>
                            <p className="text-text/80 text-sm mb-4 flex-grow">
                                Strengthen your problem-solving skills with our Data Structures & Algorithms notes, essential for interviews and advanced coding.
                            </p>
                             <button
                                onClick={() => setActiveTab('Notes & Resources')}
                                className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-accent/20 hover:bg-accent/30 text-accent transition-colors"
                            >
                                Go to Notes
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="bg-surface/50 backdrop-blur-lg border border-border rounded-xl">
                        <div className="border-b border-border overflow-x-auto">
                             <div className="flex" role="tablist">
                                {tabs.map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-primary' : 'text-text/70 hover:text-text'}`} role="tab">
                                        {tab}
                                        {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="underline" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AcademicPage;

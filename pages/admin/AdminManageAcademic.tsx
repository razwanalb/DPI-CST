import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import ConfirmModal from '../../components/ConfirmModal';

const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
const academicTabs = ['Syllabus', 'Class Routines', 'Admissions Info', 'Programming Club', 'Student List', 'Exam Schedules', 'Academic Programs'];

// --- Helper for better error messages ---
function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred. Check the console for more details.';
}


// --- Reusable Input Component ---
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text/90 mb-1">{label}</label>
        <input {...props} className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-1 focus:ring-primary/20" />
    </div>
);

// --- Section 1: Syllabus ---
const SyllabusManager: React.FC<{ semester: string }> = ({ semester }) => {
    // ... (This component remains largely the same as before)
    const [syllabusData, setSyllabusData] = useState<{ imageUrl: string | null; pdfUrl: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState<'image' | 'pdf' | null>(null);

    const fetchSyllabus = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('syllabus').select('imageUrl, pdfUrl').eq('semester', semester).single();
        setSyllabusData(data);
        setIsLoading(false);
    };
    
    useEffect(() => { fetchSyllabus(); }, [semester]);

    const handleUploadClick = (type: 'image' | 'pdf') => {
        if (!fileInputRef.current) return;
        fileInputRef.current.accept = type === 'image' ? 'image/*' : '.pdf';
        setCurrentUploadType(type);
        fileInputRef.current.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUploadType) return;
        
        const filePath = `syllabus/${semester.replace(/ /g, '_')}_${currentUploadType}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage.from('syllabus').upload(filePath, file, { upsert: true });
        if (uploadError) { alert(`Upload failed: ${uploadError.message}`); return; }
        
        const { data: urlData } = supabase.storage.from('syllabus').getPublicUrl(filePath);
        
        const { error: dbError } = await supabase.from('syllabus').upsert({ semester, [currentUploadType === 'image' ? 'imageUrl' : 'pdfUrl']: urlData.publicUrl }, { onConflict: 'semester' });
        if (dbError) { alert(`DB update failed: ${dbError.message}`); return; }

        fetchSyllabus();
        if (event.target) event.target.value = '';
    };

    return (
        <div className="bg-surface border border-border p-4 rounded-lg">
            <h3 className="font-semibold text-text text-lg mb-2">{semester}</h3>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            {isLoading ? <p className="text-sm text-text/70">Loading...</p> : (
                <div className="flex gap-4">
                    <button onClick={() => handleUploadClick('image')} className="flex-1 text-sm py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">{syllabusData?.imageUrl ? 'Replace Image' : 'Upload Image'}</button>
                    <button onClick={() => handleUploadClick('pdf')} className="flex-1 text-sm py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-md">{syllabusData?.pdfUrl ? 'Replace PDF' : 'Upload PDF'}</button>
                </div>
            )}
        </div>
    );
};

// --- Section 2: Class Routines (FIXED) ---
const RoutinesSection: React.FC = () => {
    const [routines, setRoutines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRoutine, setUpdatingRoutine] = useState<string | null>(null);

    const fetchRoutines = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('class_routines').select('*');
        if (error) {
            const message = getErrorMessage(error);
            console.error("Error fetching routines:", error.message);
            alert(`Could not fetch routines: ${message}`);
        } else {
            setRoutines(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchRoutines(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, { semester, shift, group }) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const routineKey = `${semester}-${shift}-${group}`;
        setUpdatingRoutine(routineKey);

        try {
            const safeSemester = semester.replace(/ /g, '_');
            const filePath = `routines/${safeSemester}_${shift}_${group}.${file.name.split('.').pop()}`;
            
            const { error: uploadError } = await supabase.storage.from('routines').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('routines').getPublicUrl(filePath);
            
            const { error: dbError } = await supabase.from('class_routines').upsert(
                { semester, shift, student_group: group, image_url: urlData.publicUrl, file_path: filePath }, 
                { onConflict: 'semester,shift,student_group' }
            );
            if (dbError) throw dbError;
            
            await fetchRoutines();
        } catch (error: any) {
            const message = getErrorMessage(error);
            console.error("Failed to upload routine:", error.message);
            alert(`Upload failed: ${message}. Please check Supabase permissions for the 'routines' storage bucket and 'class_routines' table.`);
        } finally {
            setUpdatingRoutine(null);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (routine: any) => {
        if (!window.confirm(`Delete the routine for ${routine.semester}, ${routine.shift} Shift, Group ${routine.student_group}?`)) return;

        const routineKey = `${routine.semester}-${routine.shift}-${routine.student_group}`;
        setUpdatingRoutine(routineKey);

        try {
            if (routine.file_path) {
                 const { error: storageError } = await supabase.storage.from('routines').remove([routine.file_path]);
                 if (storageError && storageError.message !== 'The resource was not found') {
                     throw storageError;
                 }
            }

            const { data: deletedData, error: dbError } = await supabase.from('class_routines').delete().eq('id', routine.id).select();
            if (dbError) throw dbError;

            if (!deletedData || deletedData.length === 0) {
                throw new Error("The delete operation completed without errors, but the routine was not removed. This is likely due to a Row Level Security (RLS) policy preventing the deletion.");
            }
            
            await fetchRoutines();
        } catch (error: any) {
            const message = getErrorMessage(error);
            console.error("Failed to delete routine:", error.message);
            alert(`Deletion failed: ${message}\n\nThis is very likely caused by a Row Level Security (RLS) policy in Supabase. Please ensure the 'admin' role has DELETE permission on the 'class_routines' table.`);
        } finally {
            setUpdatingRoutine(null);
        }
    };

    if (loading) return <p className="text-center text-text/70 py-4">Loading routines...</p>;

    return (
        <div className="space-y-4">
            {semesters.map(semester => (
                <div key={semester} className="bg-surface border border-border p-4 rounded-lg">
                    <h3 className="font-semibold text-text text-lg mb-2">{semester}</h3>
                    {['Morning', 'Day'].map(shift => (
                        <div key={shift} className="mt-2 pl-4 border-l-2 border-border/50">
                            <h4 className="font-medium text-text/90">{shift} Shift</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                {['A', 'B'].map(group => {
                                    const routine = routines.find(r => r.semester === semester && r.shift === shift && r.student_group === group);
                                    const routineKey = `${semester}-${shift}-${group}`;
                                    const isUpdating = updatingRoutine === routineKey;

                                    return (
                                        <div key={group} className="bg-surface/50 border border-border p-3 rounded-md">
                                            <p className="font-medium text-text/80 text-center mb-2">Group {group}</p>
                                            <label className={`text-sm cursor-pointer w-full text-center block py-2 rounded-md transition-colors ${isUpdating ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 text-primary'}`}>
                                                {isUpdating ? 'Processing...' : (routine ? 'Replace Image' : 'Upload Image')}
                                                <input type="file" className="hidden" disabled={isUpdating} onChange={(e) => handleUpload(e, { semester, shift, group })} accept="image/*" />
                                            </label>
                                            {routine && (
                                                <div className="flex justify-center items-center gap-4 mt-2">
                                                    <a href={routine.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary hover:underline">View</a>
                                                    <button onClick={() => handleDelete(routine)} disabled={isUpdating} className="text-xs text-red-400 hover:underline disabled:opacity-50">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};


// --- Section 3 & 4 & 6: Site Content (Admissions, Club, Schedules) ---
const ContentSection: React.FC<{ contentKey: string; title: string; }> = ({ contentKey, title }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            const { data } = await supabase.from('site_content').select('content').eq('key', contentKey).single();
            if (data) setContent(data.content);
        };
        fetchContent();
    }, [contentKey]);

    const handleSave = async () => {
        setIsSaving(true);
        await supabase.from('site_content').upsert({ key: contentKey, content }, { onConflict: 'key' });
        setIsSaving(false);
    };

    return (
        <div className="bg-surface border border-border p-4 rounded-lg">
            <h3 className="font-semibold text-text text-lg mb-2">{title}</h3>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border bg-surface/50 p-3 text-text focus:border-primary"
                placeholder={`Enter content for the ${title} section here...`}
            />
            <button onClick={handleSave} disabled={isSaving} className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
                {isSaving ? 'Saving...' : 'Save Content'}
            </button>
        </div>
    );
};


// --- Section 5: Student List ---
interface Student {
    id: string;
    name: string;
    roll: string;
    semester: string;
    shift: string;
    gender: 'Male' | 'Female';
    imageUrl?: string;
    file_path?: string;
}

const defaultMaleAvatar = 'https://i.postimg.cc/6QKTH6ds/male.jpg';
const defaultFemaleAvatar = 'https://i.postimg.cc/zfkv4mjn/female.jpg';


const StudentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any, imageFile: File | null) => void;
    student: Student | null;
    isSaving: boolean;
    error: string | null;
}> = ({ isOpen, onClose, onSave, student, isSaving, error }) => {
    const [formData, setFormData] = useState({ name: '', roll: '', semester: '1st Semester', shift: 'Morning', gender: 'Male' as 'Male' | 'Female' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name,
                roll: student.roll,
                semester: student.semester,
                shift: student.shift,
                gender: student.gender || 'Male'
            });
            setImagePreview(student.imageUrl || null);
        } else {
            setFormData({ name: '', roll: '', semester: '1st Semester', shift: 'Morning', gender: 'Male' });
            setImagePreview(null);
        }
        setImageFile(null); // Always reset file
    }, [student, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.roll.trim()) {
            alert("Name and Roll are required.");
            return;
        }
        onSave(formData, imageFile);
    };

    if (!isOpen) return null;

    const handleClose = () => {
        if (!isSaving) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70" onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-lg bg-surface border border-border rounded-xl p-6" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                    <h2 className="text-lg font-bold mb-4">{student ? 'Edit' : 'Add'} Student</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-surface/50 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={formData.gender === 'Female' ? defaultFemaleAvatar : defaultMaleAvatar} alt="Default Avatar" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-text/90 mb-2">Profile Image</label>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 rounded-lg text-sm bg-primary/20 text-primary">Upload Image</button>
                            </div>
                        </div>
                        <InputField label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <InputField label="Roll" value={formData.roll} onChange={e => setFormData({ ...formData, roll: e.target.value })} required />
                        <div>
                            <label className="block text-sm font-medium text-text/90 mb-1">Gender</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={() => setFormData({ ...formData, gender: 'Male' })} /> Male</label>
                                <label className="flex items-center gap-2"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={() => setFormData({ ...formData, gender: 'Female' })} /> Female</label>
                            </div>
                        </div>
                        <div><label className="block text-sm font-medium">Semester</label><select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="w-full input-style bg-surface/50">{semesters.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Shift</label><select value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })} className="w-full input-style bg-surface/50"><option>Morning</option><option>Day</option></select></div>
                    </div>
                    {error && (
                        <div className="my-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                            <p className="text-sm font-semibold text-red-400">Save Failed</p>
                            <p className="text-xs text-red-400/80 mt-1">{error}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={handleClose} disabled={isSaving} className="px-4 py-2 rounded-md text-sm bg-surface/80 disabled:opacity-50">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-md text-sm bg-primary text-white disabled:opacity-50 min-w-[80px]">{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
};

const StudentSection: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedShift, setSelectedShift] = useState('all');

    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('students').select('*').order('roll');
        if (error) {
            console.error("Error fetching students:", error.message);
            alert("Could not load student data.");
        } else {
            setStudents(data || []);
        }
        setLoading(false);
    };
    
    useEffect(() => { fetchStudents(); }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const searchLower = searchQuery.toLowerCase();
            const nameMatch = student.name.toLowerCase().includes(searchLower);
            const rollMatch = student.roll.includes(searchQuery);
            const semesterMatch = selectedSemester === 'all' || student.semester === selectedSemester;
            const shiftMatch = selectedShift === 'all' || student.shift === selectedShift;

            return (nameMatch || rollMatch) && semesterMatch && shiftMatch;
        });
    }, [students, searchQuery, selectedSemester, selectedShift]);

    const handleSave = async (formData, imageFile: File | null) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            // --- Duplicate Roll Check ---
            if (formData.roll.trim()) {
                const { data: existingStudent, error: checkError } = await supabase
                    .from('students')
                    .select('id')
                    .eq('roll', formData.roll.trim())
                    .single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is good.
                    throw checkError;
                }
                
                if (existingStudent && (!currentStudent || existingStudent.id !== currentStudent.id)) {
                    throw new Error(`Roll number "${formData.roll.trim()}" is already assigned to another student.`);
                }
            }
            
            let imageUrl = currentStudent?.imageUrl;
            let filePath = currentStudent?.file_path;

            if (imageFile) {
                if (filePath) { // Remove old image if it exists
                    await supabase.storage.from('students').remove([filePath]);
                }
                const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const newFilePath = `${Date.now()}-${safeFileName}`;
                const { error: uploadError } = await supabase.storage.from('students').upload(newFilePath, imageFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('students').getPublicUrl(newFilePath);
                imageUrl = urlData.publicUrl;
                filePath = newFilePath;
            } else if (!imageUrl && !currentStudent) { // No existing image and it's a new student, use default
                 imageUrl = formData.gender === 'Female' ? defaultFemaleAvatar : defaultMaleAvatar;
                 filePath = null; // Ensure file_path is null for default images
            }

            const dataToSave = { ...formData, imageUrl, file_path: filePath };

            if (currentStudent) {
                const { data, error } = await supabase.from('students').update(dataToSave).eq('id', currentStudent.id).select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error("Update failed. This is likely due to database permissions (Row Level Security). Ensure admins have permission to update the 'students' table.");
            } else {
                const { data, error } = await supabase.from('students').insert(dataToSave).select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error("Insert failed. This is likely due to database permissions (Row Level Security). Ensure admins have permission to insert into the 'students' table.");
            }
            await fetchStudents();
            setIsModalOpen(false);
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes('Bucket not found')) {
                setSaveError("Configuration Error: The 'students' storage bucket was not found. Please go to your Supabase project dashboard, navigate to Storage, and create a new public bucket named 'students'.");
            } else if (errorMessage.includes("Could not find the 'file_path' column") || errorMessage.includes("column \"file_path\" of relation \"students\" does not exist")) {
                 setSaveError("Database Schema Error: Your 'students' table is missing the 'file_path' column. Please go to the Supabase SQL Editor and run: ALTER TABLE students ADD COLUMN file_path TEXT;");
            } else if (errorMessage.includes("Could not find the 'gender' column") || errorMessage.includes("column \"gender\" of relation \"students\" does not exist")) {
                 setSaveError("Database Schema Error: Your 'students' table is missing the 'gender' column. Please go to the Supabase SQL Editor and run: ALTER TABLE students ADD COLUMN gender TEXT;");
            } else if (errorMessage.includes("Could not find the 'imageUrl' column") || errorMessage.includes('column "imageUrl" of relation "students" does not exist')) {
                 setSaveError("Database Schema Error: Your 'students' table is missing the 'imageUrl' column to store the photo's web address. Please go to the Supabase SQL Editor and run: ALTER TABLE students ADD COLUMN \"imageUrl\" TEXT;");
            } else {
                setSaveError(errorMessage);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (student: Student) => {
        setStudentToDelete(student);
    };

    const handleDelete = async () => {
        if (!studentToDelete) return;
        setDeletingId(studentToDelete.id);
        try {
            if (studentToDelete.file_path) {
                await supabase.storage.from('students').remove([studentToDelete.file_path]);
            }
            const { data, error } = await supabase.from('students').delete().eq('id', studentToDelete.id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Deletion failed, likely due to RLS policy.");
            fetchStudents();
        } catch (error: any) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
        } finally {
            setDeletingId(null);
            setStudentToDelete(null);
        }
    };
    
    const inputStyle = "w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text placeholder:text-text/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-bold gradient-text">Student Records</h3>
                <button onClick={() => { setCurrentStudent(null); setSaveError(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined text-base">add</span>
                    Add Student
                </button>
            </div>
            
            <div className="bg-surface p-4 rounded-lg border border-border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Search by Roll or Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={inputStyle} />
                <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className={inputStyle}>
                    <option value="all">All Semesters</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className={inputStyle}>
                    <option value="all">All Shifts</option>
                    <option value="Morning">Morning</option>
                    <option value="Day">Day</option>
                </select>
            </div>
            
            <div className="bg-surface border border-border rounded-lg overflow-x-auto">
                {loading ? <p className="text-center p-8 text-text/70">Loading students...</p> : (
                    <table className="w-full text-sm min-w-[600px]">
                        <thead className="bg-surface text-left text-text">
                            <tr>
                                <th className="p-3 font-semibold">Image</th>
                                <th className="p-3 font-semibold">Roll</th>
                                <th className="p-3 font-semibold">Name</th>
                                <th className="p-3 font-semibold">Semester</th>
                                <th className="p-3 font-semibold">Shift</th>
                                <th className="p-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map(s => {
                                const isDeleting = deletingId === s.id;
                                return (
                                    <tr key={s.id} className="border-b border-border odd:bg-surface/40 even:bg-transparent hover:bg-primary/20 transition-colors duration-200">
                                        <td className="p-2"><img src={s.imageUrl || (s.gender === 'Female' ? defaultFemaleAvatar : defaultMaleAvatar)} alt={s.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = defaultMaleAvatar; }} /></td>
                                        <td className="p-3 text-text/90">{s.roll}</td>
                                        <td className="p-3 text-text/90">{s.name}</td>
                                        <td className="p-3 text-text/90">{s.semester}</td>
                                        <td className="p-3 text-text/90">{s.shift}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setCurrentStudent(s); setSaveError(null); setIsModalOpen(true); }} className="font-medium text-secondary hover:underline">Edit</button>
                                                <span className="text-text/30">|</span>
                                                <button onClick={() => requestDelete(s)} disabled={isDeleting} className="font-medium text-red-400 hover:underline disabled:opacity-50">
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-text/60">No students found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            <StudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} student={currentStudent} isSaving={isSaving} error={saveError} />
            <ConfirmModal
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Student Deletion"
                message={`Are you sure you want to delete the student "${studentToDelete?.name}" (Roll: ${studentToDelete?.roll})? This action cannot be undone.`}
                isConfirming={deletingId === studentToDelete?.id}
            />
        </div>
    );
};


// --- Section 7: Academic Programs ---
const ALL_ICONS = [
    'analytics', 'api', 'app_shortcut', 'apps', 'architecture', 'auto_awesome',
    'backup', 'bar_chart', 'biotech', 'bolt', 'book', 'browse', 'brush', 'bug_report',
    'build', 'business_center', 'cable', 'calculate', 'chip', 'circuit_board',
    'cloud', 'code', 'code_blocks', 'commit', 'construction', 'cpu', 'css',
    'data_array', 'data_object', 'database', 'deployed_code', 'design_services',
    'desktop_windows', 'developer_board', 'developer_mode', 'devices', 'dns',
    'draw', 'edit_note', 'engineering', 'fact_check', 'factory', 'functions',
    'gesture', 'grid_view', 'html', 'http', 'hub', 'integration_instructions',
    'javascript', 'lab_profile', 'lan', 'laptop_mac', 'lightbulb', 'memory',
    'model_training', 'monitoring', 'network_check', 'neurology', 'palette',
    'power', 'psychology', 'public', 'query_stats', 'quiz', 'robotics', 'router',
    'school', 'science', 'sdk', 'security', 'settings_ethernet', 'shapes',
    'smart_toy', 'smartphone', 'square_foot', 'storage', 'tablet_mac', 'terminal',
    'web', 'web_asset', 'widgets', 'work'
];


const IconPickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (iconName: string) => void;
}> = ({ isOpen, onClose, onSelectIcon }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;
    
    const filteredIcons = ALL_ICONS.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div className="relative w-full max-w-xl bg-[#001833] border border-border rounded-xl flex flex-col max-h-[80vh]" initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}>
                        <div className="p-4 border-b border-border">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search for an icon..."
                                className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text"
                                autoFocus
                            />
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 text-center">
                                {filteredIcons.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => onSelectIcon(icon)}
                                        className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-3xl text-text/90">{icon}</span>
                                        <span className="text-xs text-text/70 break-all">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


interface AcademicProgram {
    id: string; // ID from Supabase is not optional for existing records
    title: string;
    description: string;
    icon: string;
    created_at: string;
}

const ProgramModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (program: Omit<AcademicProgram, 'id' | 'created_at'>) => void;
    program: AcademicProgram | null;
    isSaving: boolean;
}> = ({ isOpen, onClose, onSave, program, isSaving }) => {
    const [formData, setFormData] = useState({ title: '', description: '', icon: 'school' });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    useEffect(() => {
        if (program) {
            setFormData({ 
                title: program.title || '', 
                description: program.description || '', 
                icon: program.icon || 'school' 
            });
        } else {
            setFormData({ title: '', description: '', icon: 'school' });
        }
    }, [program, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.icon.trim()) {
            alert('All fields are required.');
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <>
            <IconPickerModal
                isOpen={isIconPickerOpen}
                onClose={() => setIsIconPickerOpen(false)}
                onSelectIcon={(iconName) => {
                    setFormData(prev => ({ ...prev, icon: iconName }));
                    setIsIconPickerOpen(false);
                }}
            />
            <AnimatePresence>
                {isOpen && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                        <motion.div className="relative w-full max-w-md bg-[#001833] border border-border rounded-xl p-6" initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}>
                            <h2 className="text-lg font-bold mb-4 text-text">{program ? 'Edit' : 'Add'} Program</h2>
                            <div className="space-y-4">
                                <InputField label="Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Software Development"/>
                                
                                <div>
                                    <label className="block text-sm font-medium text-text/90 mb-1">Icon</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsIconPickerOpen(true)}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-border bg-surface/50 text-left hover:border-primary"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-secondary text-2xl shrink-0">
                                            <span className="material-symbols-outlined">
                                                {formData.icon && formData.icon.trim() !== '' ? formData.icon : 'help'}
                                            </span>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-text font-semibold">{formData.icon}</p>
                                            <p className="text-xs text-text/60">Click to change</p>
                                        </div>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text/90 mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary" placeholder="A short summary of the program."/>
                                </div>
                            </div>
                             <div className="flex justify-end gap-2 mt-6">
                                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-surface/80 hover:bg-surface text-text/80">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm bg-primary text-white disabled:opacity-50 min-w-[80px]">
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

const AcademicProgramsManager: React.FC = () => {
    const [programs, setPrograms] = useState<AcademicProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProgram, setCurrentProgram] = useState<AcademicProgram | null>(null);
    const [programToDelete, setProgramToDelete] = useState<AcademicProgram | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchPrograms = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('academic_programs').select('*').order('created_at', { ascending: true });
        if (error) {
            alert(`Failed to fetch programs: ${getErrorMessage(error)}`);
            console.error(error.message);
        } else {
            setPrograms(data as AcademicProgram[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleSave = async (formData: Omit<AcademicProgram, 'id' | 'created_at'>) => {
        setIsSaving(true);
        try {
            if (currentProgram?.id) {
                const { error } = await supabase.from('academic_programs').update(formData).eq('id', currentProgram.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('academic_programs').insert(formData);
                if (error) throw error;
            }
            await fetchPrograms(); // Refresh data
            setIsModalOpen(false);
        } catch (error: any) {
            alert(`Save failed: ${getErrorMessage(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (program: AcademicProgram) => {
        setProgramToDelete(program);
    };

    const handleDelete = async () => {
        if (!programToDelete) return;
        
        console.log(`[DELETE CONFIRMED] Deleting program: "${programToDelete.title}" (ID: ${programToDelete.id})`);
        setDeletingId(programToDelete.id);
        try {
            const { data: deletedData, error } = await supabase
                .from('academic_programs')
                .delete()
                .eq('id', programToDelete.id)
                .select();
            
            console.log('[DELETE RESPONSE] Supabase response:', { deletedData, error });

            if (error) {
                console.error('[DELETE FAILURE] Supabase returned a database error:', error.message);
                throw error;
            }
            
            if (!deletedData || deletedData.length === 0) {
                console.warn('[DELETE FAILURE] RLS policy likely blocked deletion. No rows were returned.');
                throw new Error("The delete operation completed without errors, but no rows were removed. This is almost certainly due to a Row Level Security (RLS) policy preventing the deletion.");
            }

            console.log(`[DELETE SUCCESS] Successfully deleted program: ${programToDelete.title}. Refreshing list.`);
            await fetchPrograms();

        } catch (error: any) {
            console.error("[DELETE CATCH BLOCK] An error was caught during program deletion:", error.message);
            const message = getErrorMessage(error);
            alert(`Delete failed: ${message}\n\nPlease check the browser's developer console for more details. This is very likely an RLS policy issue.`);
        } finally {
            setDeletingId(null);
            setProgramToDelete(null);
        }
    };


    const openModal = (program: AcademicProgram | null = null) => {
        setCurrentProgram(program);
        setIsModalOpen(true);
    };

    if (loading) return <p className="text-center text-text/70 py-4">Loading programs...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-text/80">Manage the academic programs listed on the homepage.</p>
                <button onClick={() => openModal()} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">add</span>
                    Add Program
                </button>
            </div>
            {programs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programs.map(p => {
                        const isDeleting = deletingId === p.id;
                        return (
                            <div key={p.id} className="bg-surface border border-border rounded-lg p-4 flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="material-symbols-outlined text-3xl text-secondary">{p.icon}</span>
                                    <h4 className="font-bold text-lg flex-grow text-text">{p.title}</h4>
                                </div>
                                <p className="text-sm text-text/80 mb-4 flex-grow">{p.description}</p>
                                <div className="flex justify-end gap-2 border-t border-border pt-2">
                                    <button onClick={() => openModal(p)} className="p-1.5 text-secondary hover:bg-surface/50 rounded-full"><span className="material-symbols-outlined text-xl">edit</span></button>
                                    <button 
                                        onClick={() => requestDelete(p)} 
                                        disabled={isDeleting}
                                        className="p-1.5 text-red-400 hover:bg-surface/50 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting 
                                            ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                            : <span className="material-symbols-outlined text-xl">delete</span>
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center py-16 bg-surface rounded-xl border border-border">
                    <span className="material-symbols-outlined text-6xl text-text/30">category</span>
                    <h3 className="mt-4 text-xl font-semibold text-text">No Programs Added</h3>
                    <p className="mt-2 text-text/60">Click 'Add Program' to add the first one.</p>
                </div>
            )}
             <ProgramModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                program={currentProgram}
                isSaving={isSaving}
            />
            <ConfirmModal
                isOpen={!!programToDelete}
                onClose={() => setProgramToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Program Deletion"
                message={`Are you sure you want to delete the program "${programToDelete?.title}"? This cannot be undone.`}
                isConfirming={deletingId === programToDelete?.id}
            />
        </div>
    );
};


// --- Main Component ---
const AdminManageAcademic: React.FC = () => {
    const [activeTab, setActiveTab] = useState(academicTabs[0]);

    const renderContent = () => {
        switch (activeTab) {
            case 'Syllabus': return <div className="space-y-4">{semesters.map(s => <SyllabusManager key={s} semester={s} />)}</div>;
            case 'Class Routines': return <RoutinesSection />;
            case 'Admissions Info': return <ContentSection contentKey="admissions_info" title="Admissions Information" />;
            case 'Programming Club': return <ContentSection contentKey="programming_club" title="DPI Programming Club" />;
            case 'Student List': return <StudentSection />;
            case 'Exam Schedules': return <ContentSection contentKey="exam_schedules" title="Exam Schedules" />;
            case 'Academic Programs': return <AcademicProgramsManager />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Manage Academic Content</h1>
                <p className="text-text/70 mt-1">Control all content displayed on the public Academic page.</p>
            </div>
            <div className="bg-surface/30 border border-border rounded-xl">
                <div className="border-b border-border flex flex-wrap">
                    {academicTabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`relative shrink-0 px-4 py-3 text-sm font-medium ${activeTab === tab ? 'text-primary' : 'text-text/70 hover:text-text'}`}>
                            {tab}
                            {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="academic-tab" />}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminManageAcademic;
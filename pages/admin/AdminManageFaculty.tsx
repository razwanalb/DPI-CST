import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

interface Teacher {
    id: string;
    name: string;
    title: string;
    qualification: string;
    specialization: string;
    email: string;
    imageUrl: string;
    file_path?: string; // For managing storage objects
    createdAt: string;
    mobile_number?: string;
    shift?: 'Morning' | 'Day';
}

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

const TeacherModal = ({ isOpen, onClose, onSave, member, isSaving, defaultTitle, saveError }) => { // Added saveError prop
    const [formData, setFormData] = useState({
        name: '', title: 'Instructor', qualification: '', specialization: '', email: '', mobile_number: '', shift: 'Morning' as 'Morning' | 'Day'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (member) {
            setFormData({
                name: member.name,
                title: member.title,
                qualification: member.qualification,
                specialization: member.specialization,
                email: member.email,
                mobile_number: member.mobile_number || '',
                shift: member.shift || 'Morning',
            });
            setImagePreview(member.imageUrl);
        } else {
            // Reset for new member and use the default title from the section
            setFormData({ 
                name: '', 
                title: defaultTitle || 'Instructor', 
                qualification: '', 
                specialization: '', 
                email: '',
                mobile_number: '',
                shift: 'Morning'
            });
            setImagePreview(null);
        }
        setImageFile(null); // Always reset file input state
    }, [member, isOpen, defaultTitle]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!formData.name.trim()) return alert("Name is required.");
        if (!formData.title.trim()) return alert("Title is required.");
        if (!imageFile && !member) return alert("An image is required for a new member.");

        onSave(formData, imageFile);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div
                    className="relative w-full max-w-lg bg-[#001833] border border-border rounded-xl shadow-2xl p-6"
                    initial={{ opacity: 0, y: -30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                >
                    <h2 className="text-2xl font-bold mb-6 text-text">{member ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-surface/50 border-2 border-primary shrink-0 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-5xl text-text/50">
                                        person
                                    </span>
                                )}
                            </div>
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-text/90 mb-2">Profile Image</label>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">upload</span>
                                    {imageFile ? 'Change Image' : 'Upload Image'}
                                </button>
                                <p className="text-xs text-text/60 mt-2">Recommended: Square image (e.g., 500x500px).</p>
                            </div>
                        </div>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <select name="title" value={formData.title} onChange={handleChange} className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20">
                            <option value="">Select Title</option>
                            <option value="Head of Department (Day)">Head of Department (Day)</option>
                            <option value="Head of Department (Morning)">Head of Department (Morning)</option>
                            <option value="Instructor">Instructor</option>
                            <option value="Junior Instructor">Junior Instructor</option>
                            <option value="Guest Teacher">Guest Teacher</option>
                            <option value="Staff">Staff</option>
                        </select>
                         <div>
                            <label className="block text-sm font-medium text-text/90 mb-2">Shift</label>
                            <div className="flex gap-6 p-3 bg-surface/50 rounded-lg border border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="shift" 
                                        value="Morning" 
                                        checked={formData.shift === 'Morning'} 
                                        onChange={handleChange} 
                                        className="h-4 w-4 text-primary bg-surface border-border focus:ring-primary"
                                    />
                                    Morning
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="shift" 
                                        value="Day" 
                                        checked={formData.shift === 'Day'} 
                                        onChange={handleChange} 
                                        className="h-4 w-4 text-primary bg-surface border-border focus:ring-primary"
                                    />
                                    Day
                                </label>
                            </div>
                        </div>
                        <input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="Qualification (e.g., B.Sc. in CSE)" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Specialization" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" type="email" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="Mobile Number" type="tel" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>

                    {/* Display Error Message */}
                    {saveError && (
                        <div className="my-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center whitespace-pre-wrap">
                            <p className="text-sm font-semibold text-red-400">Save Failed</p>
                            <p className="text-xs text-red-400/80 mt-1">{saveError}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80 text-text/90 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors disabled:bg-primary/50 min-w-[120px]">
                            {isSaving ? 'Saving...' : 'Save Member'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
        </AnimatePresence>
    );
};

// FIX: Add explicit props type for TeacherCard to resolve TypeScript error regarding the 'key' prop. The `key` prop is managed by React and should not be part of the component's own props, but explicit typing is needed to guide the compiler.
const TeacherCard: React.FC<{
    member: Teacher;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}> = ({ member, onEdit, onDelete, isDeleting }) => (
    <div className="bg-surface border border-border rounded-xl shadow-lg p-4 flex flex-col">
        <div className="flex items-center gap-4">
            <img src={member.imageUrl} alt={member.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary" 
                 onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.onerror = null; 
                     target.src = 'https://i.imgur.com/pWs3vnL.jpg';
                 }}
            />
            <div className="flex-1">
                <h3 className="font-bold text-text text-lg">{member.name}</h3>
                <p className="text-sm text-secondary">{member.title}</p>
            </div>
        </div>
        <div className="text-xs text-text/80 mt-3 space-y-1 flex-grow">
            <p><strong>Qual:</strong> {member.qualification}</p>
            <p><strong>Email:</strong> {member.email}</p>
            {member.mobile_number && <p><strong>Mobile:</strong> {member.mobile_number}</p>}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
            <button onClick={onEdit} className="p-2 rounded-full hover:bg-surface/80 text-text/70 hover:text-secondary transition-colors"><span className="material-symbols-outlined">edit</span></button>
            <button 
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 rounded-full hover:bg-surface/80 text-text/70 hover:text-red-400 transition-colors w-9 h-9 flex items-center justify-center disabled:opacity-50"
            >
                {isDeleting 
                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    : <span className="material-symbols-outlined">delete</span>
                }
            </button>
        </div>
    </div>
);

const AdminManageTeachers: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [defaultTitle, setDefaultTitle] = useState('Instructor');
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null); // State for inline error

    const fetchTeachers = async () => {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
            .from('faculty')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("ADMIN-SIDE ERROR: Error fetching faculty data:", error.message);
            setError("Failed to load teacher data. Please check your Supabase RLS policies to ensure authenticated users have read access to the 'faculty' table.");
        } else {
            setTeachers(data as Teacher[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Filter teachers into categories
    const heads = useMemo(() => teachers.filter(t => t.title.includes('Head of Department')), [teachers]);
    const instructors = useMemo(() => teachers.filter(t => t.title === 'Instructor'), [teachers]);
    const juniorInstructors = useMemo(() => teachers.filter(t => t.title === 'Junior Instructor'), [teachers]);
    const guestTeachers = useMemo(() => teachers.filter(t => t.title === 'Guest Teacher'), [teachers]);
    const staff = useMemo(() => teachers.filter(t => t.title === 'Staff'), [teachers]);

    const openModal = (member: Teacher | null = null, title: string = 'Instructor') => {
        setCurrentTeacher(member);
        setDefaultTitle(title);
        setSaveError(null); // Clear error on open
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentTeacher(null);
        setSaveError(null); // Clear error on close
        setIsModalOpen(false);
    };
    
    const requestDelete = (member: Teacher) => {
        setTeacherToDelete(member);
    };

    const handleSave = async (formData, imageFile: File | null) => {
        setIsSaving(true);
        setSaveError(null); // Clear previous errors
        try {
            let imageUrl = currentTeacher?.imageUrl;
            let filePath = currentTeacher?.file_path;

            if (imageFile) {
                if (filePath) {
                    const { error: removeError } = await supabase.storage.from('faculty').remove([filePath]);
                    if (removeError) console.error("Could not remove old image:", removeError.message);
                }
                
                const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const newFilePath = `${Date.now()}-${safeFileName}`;
                const { error: uploadError } = await supabase.storage.from('faculty').upload(newFilePath, imageFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('faculty').getPublicUrl(newFilePath);
                imageUrl = urlData.publicUrl;
                filePath = newFilePath;
            }

            const dataToSave = { ...formData, imageUrl, file_path: filePath };

            if (currentTeacher) {
                const { error } = await supabase.from('faculty').update(dataToSave).eq('id', currentTeacher.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('faculty').insert(dataToSave);
                if (error) throw error;
            }
            await fetchTeachers();
            closeModal(); // Close modal on success
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes("column \"mobile_number\" of relation \"faculty\" does not exist") || errorMessage.includes("Could not find the 'mobile_number' column")) {
                 setSaveError(`Database Schema Error: Your 'faculty' table is missing the 'mobile_number' column.\n\nPlease go to your Supabase project's SQL Editor and run the following command to fix it:\n\nALTER TABLE faculty ADD COLUMN mobile_number TEXT;`);
            } else {
                setSaveError(`Save failed: ${errorMessage}`);
            }
            console.error("Save error:", errorMessage);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!teacherToDelete) return;
        setDeletingId(teacherToDelete.id);
        try {
            if (teacherToDelete.file_path) {
                const { error: storageError } = await supabase.storage.from('faculty').remove([teacherToDelete.file_path]);
                if (storageError) console.warn(`Could not delete image:`, storageError.message);
            }
            
            const { error: dbError } = await supabase.from('faculty').delete().eq('id', teacherToDelete.id);
            if (dbError) throw dbError;

            await fetchTeachers();
        } catch (error) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
            console.error("Delete error:", getErrorMessage(error));
        } finally {
            setDeletingId(null);
            setTeacherToDelete(null);
        }
    };
    
    const renderSection = (title: string, members: Teacher[], defaultNewTitle: string) => (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text">{title}</h2>
                <button onClick={() => openModal(null, defaultNewTitle)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors">
                    <span className="material-symbols-outlined">add</span>
                    Add Member
                </button>
            </div>
            {members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {members.map(member => (
                        <TeacherCard
                            key={member.id}
                            member={member}
                            onEdit={() => openModal(member, member.title)}
                            onDelete={() => requestDelete(member)}
                            isDeleting={deletingId === member.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-surface/50 rounded-lg border border-dashed border-border">
                    <p className="text-text/60">No members in this category yet.</p>
                </div>
            )}
        </div>
    );
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Manage Teachers</h1>
                <p className="text-text/70 mt-1">Add, edit, and remove teachers and staff members.</p>
            </div>

            {loading ? (
                <p className="text-center text-text/70">Loading...</p>
            ) : error ? (
                <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">{error}</div>
            ) : (
                <div>
                    {renderSection('Heads of Department', heads, 'Head of Department (Day)')}
                    {renderSection('Instructors', instructors, 'Instructor')}
                    {renderSection('Junior Instructors', juniorInstructors, 'Junior Instructor')}
                    {renderSection('Guest Teachers', guestTeachers, 'Guest Teacher')}
                    {renderSection('Staff', staff, 'Staff')}
                </div>
            )}
            
            <TeacherModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                member={currentTeacher}
                isSaving={isSaving}
                defaultTitle={defaultTitle}
                saveError={saveError} // Pass error to modal
            />
            
            <ConfirmModal
                isOpen={!!teacherToDelete}
                onClose={() => setTeacherToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Member Deletion"
                message={`Are you sure you want to permanently delete ${teacherToDelete?.name}? This action cannot be undone.`}
                isConfirming={deletingId === teacherToDelete?.id}
            />
        </div>
    );
};

export default AdminManageTeachers;
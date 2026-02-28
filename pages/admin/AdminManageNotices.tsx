import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

// --- Interfaces ---
interface Attachment {
    url: string;
    path: string;
    name: string;
    type: 'image' | 'pdf';
}

interface Notice {
    id: string;
    title: string;
    category: 'Academic' | 'Event' | 'General';
    content: string;
    status: 'published' | 'draft';
    createdAt: string;
    author: string;
    attachments: Attachment[] | null;
}

// --- Helper Functions ---
function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred.';
}

const getCategoryBadgeStyle = (category: Notice['category']) => {
    switch (category) {
        case 'Academic': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case 'Event': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        case 'General': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        default: return 'bg-surface text-text/80';
    }
};

// --- Components ---
const StatusToggle = ({ enabled, onChange }) => (
    <div 
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-primary' : 'bg-surface'}`}
        role="switch"
        aria-checked={enabled}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </div>
);

const NoticeModal = ({ isOpen, onClose, onSave, notice, isSaving }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'Academic' | 'Event' | 'General'>('General');
    const [content, setContent] = useState('');
    
    const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [attachmentsToRemove, setAttachmentsToRemove] = useState<Attachment[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (notice) {
                setTitle(notice.title);
                setCategory(notice.category);
                setContent(notice.content);
                setExistingAttachments(notice.attachments || []);
            } else {
                setTitle('');
                setCategory('General');
                setContent('');
                setExistingAttachments([]);
            }
            setNewFiles([]);
            setAttachmentsToRemove([]);
        }
    }, [notice, isOpen]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setNewFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleRemoveExisting = (attachment: Attachment) => {
        setAttachmentsToRemove(prev => [...prev, attachment]);
        setExistingAttachments(prev => prev.filter(att => att.path !== attachment.path));
    };

    const handleRemoveNew = (fileToRemove: File) => {
        setNewFiles(prev => prev.filter(file => file !== fileToRemove));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            alert("Title and Content cannot be empty.");
            return;
        }
        onSave({ title, category, content }, newFiles, attachmentsToRemove);
    };
    
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div
                        className="relative w-full max-w-2xl bg-[#001833] border border-border rounded-xl shadow-2xl p-6 max-h-[90vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <h2 className="text-2xl font-bold mb-6 text-text shrink-0">{notice ? 'Edit Notice' : 'Create New Notice'}</h2>
                        <div className="space-y-4 overflow-y-auto pr-2">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full input-style" />
                            <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full input-style bg-surface/50"><option>General</option><option>Academic</option><option>Event</option></select>
                            <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Content" className="w-full input-style" />
                            <div>
                                <label className="block text-sm font-medium text-text/90 mb-2">Attachments (Images or PDFs)</label>
                                <div className="p-3 bg-surface/50 border border-dashed border-border rounded-lg space-y-3">
                                    {(existingAttachments.length === 0 && newFiles.length === 0) && <p className="text-sm text-center text-text/60 py-2">No attachments.</p>}
                                    {existingAttachments.map(att => (
                                        <div key={att.path} className="flex items-center justify-between gap-2 p-2 bg-surface rounded-md">
                                            <span className="material-symbols-outlined text-secondary text-lg">{att.type === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-text/80 truncate flex-grow hover:underline">{att.name}</a>
                                            <button onClick={() => handleRemoveExisting(att)} className="text-sm font-semibold text-red-400 hover:text-red-300 shrink-0">Remove</button>
                                        </div>
                                    ))}
                                    {newFiles.map((file, i) => (
                                         <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 p-2 bg-primary/10 rounded-md">
                                            <span className="material-symbols-outlined text-primary text-lg">{file.type.startsWith('image/') ? 'image' : 'picture_as_pdf'}</span>
                                            <p className="text-sm text-text/80 truncate flex-grow">New: {file.name}</p>
                                            <button onClick={() => handleRemoveNew(file)} className="text-sm font-semibold text-red-400 hover:text-red-300 shrink-0">Remove</button>
                                        </div>
                                    ))}
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" multiple className="w-full text-sm text-text/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4 shrink-0">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white min-w-[110px]">
                                {isSaving ? 'Saving...' : 'Save Notice'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


const AdminManageNotices: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'all' | Notice['category']>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | Notice['status']>('all');
    
    const fetchNotices = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('notices').select('*').order('createdAt', { ascending: false });
        if (error) { console.error("Error fetching notices:", error.message); } 
        else { setNotices(data as Notice[] || []); }
        setLoading(false);
    };

    useEffect(() => { fetchNotices(); }, []);

    const handleSaveNotice = async (formData: { title: string; category: Notice['category']; content: string }, newFiles: File[], attachmentsToRemove: Attachment[]) => {
        setIsSaving(true);
        try {
            // 1. Handle file removals from storage
            const pathsToRemove = attachmentsToRemove.map(att => att.path);
            if (pathsToRemove.length > 0) {
                const { error: removeError } = await supabase.storage.from('notices').remove(pathsToRemove);
                if (removeError) console.warn("Some attachments could not be removed from storage:", removeError.message);
            }

            // 2. Handle new file uploads
            const uploadPromises = newFiles.map(file => {
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const newFilePath = `${Date.now()}-${safeFileName}`;
                return supabase.storage.from('notices').upload(newFilePath, file);
            });
            const uploadResults = await Promise.all(uploadPromises);

            const uploadErrors = uploadResults.filter(result => result.error);
            if (uploadErrors.length > 0) {
                throw new Error(`Failed to upload files: ${uploadErrors.map(e => e.error!.message).join(', ')}`);
            }

            // 3. Construct the final attachments array
            const newUploadedAttachments: Attachment[] = uploadResults.map((result, index) => {
                const file = newFiles[index];
                const { data: urlData } = supabase.storage.from('notices').getPublicUrl(result.data!.path);
                return {
                    url: urlData.publicUrl,
                    path: result.data!.path,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 'pdf'
                };
            });
            
            const remainingAttachments = (currentNotice?.attachments || []).filter(att => !pathsToRemove.includes(att.path));
            const finalAttachments = [...remainingAttachments, ...newUploadedAttachments];

            const dataToSave = { ...formData, attachments: finalAttachments.length > 0 ? finalAttachments : null };

            // 4. Save the record to the database
            if (currentNotice) {
                const { error } = await supabase.from('notices').update(dataToSave).eq('id', currentNotice.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('notices').insert({ ...dataToSave, status: 'draft', author: 'Admin' });
                if (error) throw error;
            }
            
            fetchNotices();
            closeModal();
        } catch (error) {
            const friendlyError = getErrorMessage(error);
            console.error("Error saving notice: ", friendlyError);
            if (friendlyError.includes('Bucket not found')) {
                alert("Configuration Error: The 'notices' storage bucket was not found. Please go to your Supabase project dashboard, navigate to Storage, and create a new public bucket named 'notices'.");
            } else {
                alert(`Failed to save notice: ${friendlyError}`);
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const requestDeleteNotice = (notice: Notice) => { setNoticeToDelete(notice); };

    const handleDeleteNotice = async () => {
        if (!noticeToDelete) return;
        setDeletingId(noticeToDelete.id);
        try {
            const pathsToRemove = noticeToDelete.attachments?.map(att => att.path) || [];
            if (pathsToRemove.length > 0) {
                await supabase.storage.from('notices').remove(pathsToRemove);
            }
            const { error } = await supabase.from('notices').delete().eq('id', noticeToDelete.id);
            if (error) throw error;
            await fetchNotices();
        } catch (error: any) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
        } finally {
            setDeletingId(null);
            setNoticeToDelete(null);
        }
    };

    const handleToggleStatus = async (notice: Notice) => {
        const newStatus = notice.status === 'published' ? 'draft' : 'published';
        const { error } = await supabase.from('notices').update({ status: newStatus }).eq('id', notice.id);
        if (error) { console.error("Error updating status: ", error.message); }
        else { fetchNotices(); }
    };
    
    const openModal = (notice: Notice | null = null) => { setCurrentNotice(notice); setIsModalOpen(true); };
    const closeModal = () => { setCurrentNotice(null); setIsModalOpen(false); };

    const filteredNotices = useMemo(() => {
        return notices.filter(notice => {
            const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) || notice.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || notice.category === filterCategory;
            const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [notices, searchTerm, filterCategory, filterStatus]);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Manage Notices</h1>
                    <p className="text-text/70 mt-1">Create, publish, and manage all department announcements.</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg">
                    <span className="material-symbols-outlined">add_circle</span>
                    Create New Notice
                </button>
            </div>

            <div className="mb-6 bg-surface p-4 rounded-xl border border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text/50">search</span><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-border bg-surface/50 pl-10 pr-3 py-2 text-text" /></div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text"><option value="all">All Categories</option><option value="Academic">Academic</option><option value="Event">Event</option><option value="General">General</option></select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text"><option value="all">All Statuses</option><option value="published">Published</option><option value="draft">Draft</option></select>
            </div>

             {loading ? <p className="text-center text-text/70">Loading notices...</p> : filteredNotices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotices.map(notice => {
                        const isDeleting = deletingId === notice.id;
                        return (
                        <div key={notice.id} className="bg-surface border border-border rounded-xl shadow-lg flex flex-col h-full hover:-translate-y-1 transition-transform">
                            <div className="p-5 flex-grow">
                                <div className="flex justify-between items-start gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-text">{notice.title}</h3>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 border ${getCategoryBadgeStyle(notice.category)}`}>{notice.category}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-text/70 mb-4">
                                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                    {notice.attachments && notice.attachments.length > 0 && <span className="material-symbols-outlined text-base text-secondary" title={`Has ${notice.attachments.length} attachment(s)`}>attachment</span>}
                                </div>
                                <p className="text-sm text-text/90 leading-relaxed line-clamp-4">{notice.content}</p>
                            </div>
                            <div className="border-t border-border p-4 flex justify-between items-center bg-black/10">
                                <div className="flex items-center gap-3"><StatusToggle enabled={notice.status === 'published'} onChange={() => handleToggleStatus(notice)} /><span className={`text-sm font-medium ${notice.status === 'published' ? 'text-green-400' : 'text-text/60'}`}>{notice.status === 'published' ? 'Published' : 'Draft'}</span></div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => openModal(notice)} className="p-2 rounded-full hover:bg-surface text-text/70 hover:text-secondary"><span className="material-symbols-outlined">edit</span></button>
                                     <button onClick={() => requestDeleteNotice(notice)} disabled={isDeleting} className="p-2 rounded-full hover:bg-surface text-text/70 hover:text-red-400 w-9 h-9 flex items-center justify-center"><span className="material-symbols-outlined">{isDeleting ? 'hourglass_top' : 'delete'}</span></button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            ) : <div className="text-center py-16 bg-surface rounded-xl border border-border"><h3 className="text-xl font-semibold">No Notices Found</h3><p className="mt-2 text-text/60">Try adjusting your filters.</p></div>}
            
            <NoticeModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveNotice} notice={currentNotice} isSaving={isSaving} />
            <ConfirmModal isOpen={!!noticeToDelete} onClose={() => setNoticeToDelete(null)} onConfirm={handleDeleteNotice} title="Confirm Deletion" message={`Delete "${noticeToDelete?.title}"? This cannot be undone.`} isConfirming={!!deletingId}/>
        </div>
    );
};

export default AdminManageNotices;

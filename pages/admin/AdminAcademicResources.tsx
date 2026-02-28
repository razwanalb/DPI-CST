
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

// --- Types ---
interface ResourceFile {
    id: string;
    image_url: string;
    file_path: string;
}

interface NoteGroup {
    groupId: string;
    title: string;
    semester: string;
    images: ResourceFile[];
    pdf: ResourceFile | null;
}

interface PastPaperResource {
    id: string;
    semester: string;
    resource_type: 'past_paper';
    image_url: string;
    file_path: string;
    title: string;
}

type GroupedNotes = { [semester: string]: NoteGroup[] };
type GroupedPastPapers = { [semester: string]: PastPaperResource[] };

const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];

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

// --- Reusable Modals ---

const NoteUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, images: File[], pdf: File | null) => void;
    isUploading: boolean;
}> = ({ isOpen, onClose, onSave, isUploading }) => {
    const [title, setTitle] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (imageFiles.length === 0 && !pdfFile) {
            setError("You must upload at least one image or a PDF.");
            return;
        }
        onSave(title, imageFiles, pdfFile);
    };

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setImageFiles([]);
            setPdfFile(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-lg bg-[#001833] border border-border rounded-xl shadow-2xl p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                    <h2 className="text-xl font-bold text-text mb-4">Upload New Note</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text/90 mb-1 block">Note Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chapter 1: Introduction" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text/90 mb-1 block">Images (can select multiple)</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="w-full text-sm text-text/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                            {imageFiles.length > 0 && <p className="text-xs text-text/70 mt-1">{imageFiles.length} image(s) selected.</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text/90 mb-1 block">PDF (optional)</label>
                            <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-text/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary/20 file:text-secondary hover:file:bg-secondary/30" />
                            {pdfFile && <p className="text-xs text-text/70 mt-1">Selected: {pdfFile.name}</p>}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80">Cancel</button>
                        <button onClick={handleSave} disabled={isUploading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white disabled:bg-primary/50">
                            {isUploading ? 'Uploading...' : 'Save Note'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const PastPaperUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, pdf: File) => void;
    isUploading: boolean;
}> = ({ isOpen, onClose, onSave, isUploading }) => {
    const [title, setTitle] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!pdfFile) {
            setError("A PDF file is required.");
            return;
        }
        onSave(title, pdfFile);
    };

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setPdfFile(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-lg bg-[#001833] border border-border rounded-xl shadow-2xl p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                    <h2 className="text-xl font-bold text-text mb-4">Upload Past Paper</h2>
                    <div className="space-y-4">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Midterm Exam 2023" className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text" />
                        <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-text/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-secondary/20 file:text-secondary" />
                    </div>
                    {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80">Cancel</button>
                        <button onClick={handleSave} disabled={isUploading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white disabled:bg-primary/50">
                            {isUploading ? 'Uploading...' : 'Save Paper'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- Manager Components ---

const NoteGroupManager: React.FC<{ semester: string; noteGroups: NoteGroup[]; onActionComplete: () => void; }> = ({ semester, noteGroups, onActionComplete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<NoteGroup | null>(null);

    const handleSave = async (title: string, images: File[], pdf: File | null) => {
        setIsUploading(true);
        const groupId = Date.now().toString();
        const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s/g, '_');
        const uploadPromises = [];

        images.forEach(file => {
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `notes/${semester.replace(/ /g, '_')}/${safeTitle}___${groupId}___${safeFileName}`;
            uploadPromises.push(supabase.storage.from('academic_resources').upload(filePath, file)
                .then(({ error: uploadError }) => {
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage.from('academic_resources').getPublicUrl(filePath);
                    return supabase.from('academic_resources').insert({ semester, resource_type: 'note', image_url: urlData.publicUrl, file_path: filePath });
                }));
        });

        if (pdf) {
            const safeFileName = pdf.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `notes/${semester.replace(/ /g, '_')}/${safeTitle}___${groupId}___${safeFileName}`;
            uploadPromises.push(supabase.storage.from('academic_resources').upload(filePath, pdf)
                .then(({ error: uploadError }) => {
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage.from('academic_resources').getPublicUrl(filePath);
                    return supabase.from('academic_resources').insert({ semester, resource_type: 'note', image_url: urlData.publicUrl, file_path: filePath });
                }));
        }

        try {
            await Promise.all(uploadPromises);
            onActionComplete();
            setIsModalOpen(false);
        } catch (err) { console.error("Save failed:", err); } 
        finally { setIsUploading(false); }
    };

    const requestDeleteGroup = (group: NoteGroup) => {
        setGroupToDelete(group);
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;
        
        console.log(`[DELETE CONFIRMED] Deleting note group: "${groupToDelete.title}" (ID: ${groupToDelete.groupId})`);
        setDeletingId(groupToDelete.groupId);
        try {
            const files = [...groupToDelete.images, groupToDelete.pdf].filter(Boolean) as ResourceFile[];
            const paths = files.map(f => f.file_path);
            const ids = files.map(f => f.id);

            // Delete files from storage
            if (paths.length > 0) {
                console.log('[DELETE STORAGE] Deleting files from storage:', paths);
                const { error: storageError } = await supabase.storage.from('academic_resources').remove(paths);
                if (storageError) console.error("Partial storage delete failure:", storageError);
            }
            
            // Delete records from database
            if (ids.length > 0) {
                 const { data, error } = await supabase.from('academic_resources').delete().in('id', ids).select();
                 console.log('[DELETE RESPONSE] Supabase response:', { data, error });
                 if (error) {
                    console.error('[DELETE FAILURE] Supabase returned a database error:', error);
                    throw error;
                 }
                 if (!data || data.length === 0) {
                    console.warn('[DELETE FAILURE] RLS policy likely blocked deletion. No rows were returned.');
                    throw new Error("The delete operation completed without errors, but no rows were removed. This is likely due to a Row Level Security (RLS) policy preventing the deletion.");
                 }
            }
            console.log(`[DELETE SUCCESS] Successfully deleted note group: ${groupToDelete.title}. Refreshing list.`);
            onActionComplete();
        } catch (err) { 
            console.error("[DELETE CATCH BLOCK] An error was caught during note group deletion:", err);
            const message = getErrorMessage(err);
            alert(`Deletion failed: ${message}\n\nPlease check the browser's developer console for more details. This is very likely an RLS policy issue.`);
        } finally { 
            setDeletingId(null);
            setGroupToDelete(null);
        }
    };

    return (
        <details className="bg-surface/50 border border-border rounded-lg group" open>
            <summary className="summary-marker-hidden list-none flex cursor-pointer items-center justify-between p-4">
                <h3 className="font-semibold text-text">{semester} ({noteGroups.length} notes)</h3>
                <span className="material-symbols-outlined text-text group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="p-4 border-t border-border">
                <div className="space-y-2 mb-4">
                    {noteGroups.map(group => (
                         <div key={group.groupId} className="flex items-center justify-between p-3 bg-surface/50 border border-border rounded-lg gap-4">
                            <div className="flex-grow overflow-hidden">
                                <p className="text-sm font-semibold text-text/90 truncate" title={group.title}>{group.title}</p>
                                <div className="flex items-center gap-3 text-xs text-text/70 mt-1">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">image</span> {group.images.length}</span>
                                    {group.pdf && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">picture_as_pdf</span> 1</span>}
                                </div>
                            </div>
                            <button onClick={() => requestDeleteGroup(group)} disabled={deletingId === group.groupId} className="p-1.5 rounded-full text-text/60 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50">
                                <span className="material-symbols-outlined text-xl">{deletingId === group.groupId ? 'hourglass_top' : 'delete'}</span>
                            </button>
                        </div>
                    ))}
                </div>
                {noteGroups.length === 0 && <p className="text-sm text-text/60 text-center py-4">No notes here.</p>}
                <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white">
                    <span className="material-symbols-outlined">add_circle</span> Add Note
                </button>
            </div>
            <NoteUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} isUploading={isUploading} />
            <ConfirmModal
                isOpen={!!groupToDelete}
                onClose={() => setGroupToDelete(null)}
                onConfirm={handleDeleteGroup}
                title="Confirm Note Group Deletion"
                message={`Are you sure you want to delete "${groupToDelete?.title}" and all its files? This cannot be undone.`}
                isConfirming={deletingId === groupToDelete?.groupId}
            />
        </details>
    );
};

const PastPaperManager: React.FC<{ semester: string; pastPapers: PastPaperResource[]; onActionComplete: () => void; }> = ({ semester, pastPapers, onActionComplete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [paperToDelete, setPaperToDelete] = useState<PastPaperResource | null>(null);

    const handleSave = async (title: string, pdf: File) => {
        setIsUploading(true);
        const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s/g, '_');
        const filePath = `past_papers/${semester.replace(/ /g, '_')}/${safeTitle}___${Date.now()}.pdf`;

        try {
            const { error: uploadError } = await supabase.storage.from('academic_resources').upload(filePath, pdf);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('academic_resources').getPublicUrl(filePath);
            const { error: dbError } = await supabase.from('academic_resources').insert({ semester, resource_type: 'past_paper', image_url: urlData.publicUrl, file_path: filePath });
            if (dbError) throw dbError;
            onActionComplete();
            setIsModalOpen(false);
        } catch (err) { console.error("Save failed:", err); }
        finally { setIsUploading(false); }
    };
    
    const requestDelete = (paper: PastPaperResource) => {
        setPaperToDelete(paper);
    };
    
    const handleDelete = async () => {
        if (!paperToDelete) return;

        console.log(`[DELETE CONFIRMED] Deleting past paper: "${paperToDelete.title}" (ID: ${paperToDelete.id})`);
        setDeletingId(paperToDelete.id);
        try {
            // Delete from storage
            console.log('[DELETE STORAGE] Deleting file from storage:', paperToDelete.file_path);
            await supabase.storage.from('academic_resources').remove([paperToDelete.file_path]);
            
            // Delete from database
            const { data, error } = await supabase.from('academic_resources').delete().eq('id', paperToDelete.id).select();
            console.log('[DELETE RESPONSE] Supabase response:', { data, error });
            if (error) {
                console.error('[DELETE FAILURE] Supabase returned a database error:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                console.warn('[DELETE FAILURE] RLS policy likely blocked deletion. No rows were returned.');
                throw new Error("The delete operation completed without errors, but no rows were removed. This is likely due to a Row Level Security (RLS) policy preventing the deletion.");
            }
            console.log(`[DELETE SUCCESS] Successfully deleted past paper: ${paperToDelete.title}. Refreshing list.`);
            onActionComplete();
        } catch (err) {
            console.error("[DELETE CATCH BLOCK] An error was caught during past paper deletion:", err);
            const message = getErrorMessage(err);
            alert(`Deletion failed: ${message}\n\nPlease check the browser's developer console for more details. This is very likely an RLS policy issue.`);
        }
        finally { 
            setDeletingId(null);
            setPaperToDelete(null);
        }
    };

    return (
        <details className="bg-surface/50 border border-border rounded-lg group" open>
            <summary className="summary-marker-hidden list-none flex cursor-pointer items-center justify-between p-4">
                <h3 className="font-semibold text-text">{semester} ({pastPapers.length} papers)</h3>
                <span className="material-symbols-outlined text-text group-open:rotate-180">expand_more</span>
            </summary>
            <div className="p-4 border-t border-border">
                <div className="space-y-2 mb-4">
                     {pastPapers.map(paper => (
                        <div key={paper.id} className="flex items-center justify-between p-3 bg-surface/50 border border-border rounded-lg gap-4">
                            <div className="flex-grow overflow-hidden flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                                <p className="text-sm font-semibold text-text/90 truncate" title={paper.title}>{paper.title}</p>
                            </div>
                            <button onClick={() => requestDelete(paper)} disabled={deletingId === paper.id} className="p-1.5 rounded-full text-text/60 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50">
                                <span className="material-symbols-outlined text-xl">{deletingId === paper.id ? 'hourglass_top' : 'delete'}</span>
                            </button>
                        </div>
                    ))}
                </div>
                {pastPapers.length === 0 && <p className="text-sm text-text/60 text-center py-4">No past papers here.</p>}
                 <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white">
                    <span className="material-symbols-outlined">add_circle</span> Upload PDF
                </button>
            </div>
            <PastPaperUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} isUploading={isUploading} />
            <ConfirmModal
                isOpen={!!paperToDelete}
                onClose={() => setPaperToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Past Paper Deletion"
                message={`Are you sure you want to delete "${paperToDelete?.title}"? This cannot be undone.`}
                isConfirming={deletingId === paperToDelete?.id}
            />
        </details>
    );
};


// --- Main Page Component ---
const AdminAcademicResources: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'note' | 'past_paper'>('note');
    const [resources, setResources] = useState<{ note: GroupedNotes; past_paper: GroupedPastPapers }>({ note: {}, past_paper: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.from('academic_resources').select('id, semester, resource_type, image_url, file_path');
        if (error) { setError(`Could not load resources: ${error.message}.`); setLoading(false); return; }

        const groupedNotes: { [semester: string]: { [groupId: string]: NoteGroup } } = {};
        const groupedPastPapers: GroupedPastPapers = {};

        for (const resource of data) {
            const pathParts = resource.file_path.split('/');
            const filename = pathParts.pop() || '';
            const nameParts = filename.split('___');
            let title = nameParts.length > 1 ? nameParts[0].replace(/_/g, ' ') : filename.substring(0, filename.lastIndexOf('.')).replace(/^\d{13}_/, '');

            if (resource.resource_type === 'note' && nameParts.length > 2) {
                const groupId = nameParts[1];
                const semester = resource.semester;
                if (!groupedNotes[semester]) groupedNotes[semester] = {};
                if (!groupedNotes[semester][groupId]) groupedNotes[semester][groupId] = { groupId, title, semester, images: [], pdf: null };
                const file = { id: resource.id, image_url: resource.image_url, file_path: resource.file_path };
                if (resource.file_path.toLowerCase().endsWith('.pdf')) groupedNotes[semester][groupId].pdf = file;
                else groupedNotes[semester][groupId].images.push(file);
            } else if (resource.resource_type === 'past_paper') {
                 if (!groupedPastPapers[resource.semester]) groupedPastPapers[resource.semester] = [];
                 groupedPastPapers[resource.semester].push({ ...resource, title, resource_type: 'past_paper' });
            }
        }
        
        const finalGroupedNotes: GroupedNotes = {};
        for (const semester in groupedNotes) finalGroupedNotes[semester] = Object.values(groupedNotes[semester]);
        setResources({ note: finalGroupedNotes, past_paper: groupedPastPapers });
        setLoading(false);
    };

    useEffect(() => { fetchResources(); }, []);

    const renderContent = () => {
        if (loading) return <p className="text-center py-8 text-text/70">Loading resources...</p>;
        if (error) return <div className="text-center py-8 text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</div>;

        if (activeTab === 'note') {
            const noteGroups = resources.note || {};
            return (
                <div className="space-y-4">
                    {semesters.slice(0, 7).map(semester => (
                        <NoteGroupManager key={semester} semester={semester} noteGroups={noteGroups[semester] || []} onActionComplete={fetchResources} />
                    ))}
                </div>
            );
        }

        if (activeTab === 'past_paper') {
            const pastPapers = resources.past_paper || {};
            return (
                <div className="space-y-4">
                    {semesters.map(semester => (
                        <PastPaperManager key={semester} semester={semester} pastPapers={pastPapers[semester] || []} onActionComplete={fetchResources} />
                    ))}
                </div>
            );
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Academic Resources</h1>
                <p className="text-text/70 mt-1">Manage class notes and past question papers for all semesters.</p>
            </div>
            <div className="bg-surface/50 border border-border rounded-xl">
                <div className="border-b border-border flex" role="tablist">
                    <button onClick={() => setActiveTab('note')} className={`relative flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'note' ? 'text-primary' : 'text-text/70 hover:text-text'}`} role="tab">
                        Notes {activeTab === 'note' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="active-tab-underline" />}
                    </button>
                    <button onClick={() => setActiveTab('past_paper')} className={`relative flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'past_paper' ? 'text-primary' : 'text-text/70 hover:text-text'}`} role="tab">
                        Past Question Papers {activeTab === 'past_paper' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="active-tab-underline" />}
                    </button>
                </div>
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminAcademicResources;

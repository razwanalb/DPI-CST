import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';
import * as pdfjsLib from 'pdfjs-dist';

// Setup for pdf.js worker to enable PDF processing in the browser.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs';


// --- Types ---
interface OtherSubjectResult { subject_name: string; marks_obtained: number; total_marks: number; }
interface OtherResult { id: string; roll_number: string; student_name: string; exam_name: string; semester: string; student_group: string; subjects: OtherSubjectResult[]; }
interface FinalResultSession { id: string; session_name: string; pdf_path: string | null; file_name: string | null; updated_at: string | null; }

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

// --- Final Results Manager (PDF Upload per session) ---
const SessionRow: React.FC<{
    session: FinalResultSession;
    onRefresh: () => void;
}> = ({ session, onRefresh }) => {
    const [status, setStatus] = useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [sessionToDelete, setSessionToDelete] = useState<FinalResultSession | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isProcessing = status === 'validating' || status === 'uploading';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setStatus('validating');
        setStatusMessage('Validating PDF format...');
        
        try {
            const buffer = await selectedFile.arrayBuffer();
            const typedarray = new Uint8Array(buffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
            }
            // --- UPDATED VALIDATION LOGIC ---
            const sanitizedFullText = fullText.replace(/\s+/g, ' ');
            const oldFormatRegex = /\bgpa\d:/; // A simple check for "gpa1:", "gpa2:", etc.
            const newFormatRegexPass = /\b\d{6,}\s*\(\s*[\d.]+\s*\)/; // Checks for "123456 ( 3.47 )"
            const newFormatRegexFail = /\b\d{6,}\s*\{[^{}]+\}/; // Checks for "123456 { ... }"

            if (
                !oldFormatRegex.test(sanitizedFullText) &&
                !newFormatRegexPass.test(sanitizedFullText) &&
                !newFormatRegexFail.test(sanitizedFullText)
            ) {
                throw new Error('PDF content does not match any known result format. It should contain either the old format (e.g., "gpa1: 3.50") or the new format (e.g., "123456 (3.47)" or "123456 { 25711(T) }").');
            }
            
            setStatus('uploading');
            setStatusMessage('Uploading file...');
            const filePath = `final_results/${session.session_name}.pdf`;
            
            const { error: uploadError } = await supabase.storage.from('results').upload(filePath, selectedFile, { upsert: true });
            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from('final_result_sessions').update({
                pdf_path: filePath,
                file_name: selectedFile.name,
                updated_at: new Date().toISOString()
            }).eq('id', session.id);
            if (dbError) throw dbError;

            setStatus('success');
            setStatusMessage('Upload Complete!');
            setTimeout(() => {
                onRefresh();
                setStatus('idle');
            }, 2000);

        } catch (err: any) {
            console.error("File processing error:", err.message);
            const friendlyMessage = getErrorMessage(err);
            // FIX: Improved error message for specific Supabase storage issue.
            if (friendlyMessage.includes('Bucket not found')) {
                alert("CRITICAL ERROR: The storage bucket named 'results' was not found. Please go to your Supabase project dashboard, navigate to Storage, and create a new public bucket named exactly 'results'.");
                setStatusMessage("Configuration Error: 'results' bucket not found.");
            } else {
                 setStatusMessage(friendlyMessage);
            }
            setStatus('error');
        }
        e.target.value = ''; // Allow re-selecting the same file
    };


    const handleDeletePdf = async () => {
        if (!session.pdf_path || !window.confirm(`Are you sure you want to delete the PDF for the ${session.session_name} session?`)) return;
        setStatus('uploading'); // Re-use uploading state for generic processing feedback
        setStatusMessage('Deleting PDF...');
        try {
            await supabase.storage.from('results').remove([session.pdf_path]);
            await supabase.from('final_result_sessions').update({ pdf_path: null, file_name: null, updated_at: new Date().toISOString() }).eq('id', session.id);
            onRefresh();
        } catch (err: any) {
            console.error("Delete PDF error:", err.message);
            setStatusMessage(`Error: ${err.message}`);
            setStatus('error');
        } finally {
            if(status !== 'error') setStatus('idle');
        }
    };
    
    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;
        setIsDeleting(true);
        try {
            if (sessionToDelete.pdf_path) {
                await supabase.storage.from('results').remove([sessionToDelete.pdf_path]);
            }
            await supabase.from('final_result_sessions').delete().eq('id', sessionToDelete.id);
            onRefresh();
        } catch (error: any) {
            console.error("Delete session error:", error.message);
            alert(`Failed to delete session: ${error.message}`);
        } finally {
            setIsDeleting(false);
            setSessionToDelete(null);
        }
    };

    return (
        <div className="bg-surface/50 p-4 rounded-lg border border-border">
            <ConfirmModal
                isOpen={!!sessionToDelete}
                onClose={() => setSessionToDelete(null)}
                onConfirm={handleDeleteSession}
                title="Delete Session"
                message={`Are you sure you want to permanently delete the '${sessionToDelete?.session_name}' session and its results PDF? This action cannot be undone.`}
                isConfirming={isDeleting}
            />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h4 className="text-lg font-semibold text-text">{session.session_name}</h4>
                <div className="flex items-center gap-2">
                    <input type="file" id={`file-${session.id}`} accept=".pdf" onChange={handleFileChange} className="hidden" disabled={isProcessing} />
                    <label htmlFor={`file-${session.id}`} className={`flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors w-32 ${isProcessing ? 'bg-gray-500/50 text-text/60 cursor-not-allowed' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
                        {isProcessing ? (
                             <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                <span>Wait...</span>
                            </>
                        ) : (
                            session.pdf_path ? 'Replace PDF' : 'Choose PDF'
                        )}
                    </label>
                    {session.pdf_path && <button onClick={handleDeletePdf} disabled={isProcessing} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-full disabled:opacity-50"><span className="material-symbols-outlined text-xl">delete</span></button>}
                    <button onClick={() => setSessionToDelete(session)} disabled={isProcessing || isDeleting} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-full disabled:opacity-50"><span className="material-symbols-outlined text-xl">delete_forever</span></button>
                </div>
            </div>

            {status !== 'idle' && (
                 <div className="mt-3 flex items-center gap-2 text-sm">
                    {status === 'validating' || status === 'uploading' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : status === 'success' ? (
                        <span className="material-symbols-outlined text-green-400">check_circle</span>
                    ) : (
                        <span className="material-symbols-outlined text-red-400">error</span>
                    )}
                    <p className={`flex-grow truncate ${status === 'error' ? 'text-red-400' : (status === 'success' ? 'text-green-400' : 'text-text/80')}`}>{statusMessage}</p>
                </div>
            )}
            
            {status === 'idle' && session.file_name && (
                <p className="text-xs text-text/60 mt-2">
                    Current file: {session.file_name} (Uploaded: {new Date(session.updated_at!).toLocaleString()})
                </p>
            )}
        </div>
    );
};

const FinalResultsManager: React.FC = () => {
    const [sessions, setSessions] = useState<FinalResultSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSessionName, setNewSessionName] = useState('');
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [addSessionError, setAddSessionError] = useState('');
    const [addSessionSuccess, setAddSessionSuccess] = useState(false);

    const fetchSessions = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('final_result_sessions').select('*').order('session_name', { ascending: false });
        if (error) {
            alert(`Could not load sessions: ${error.message}. Please ensure the 'final_result_sessions' table exists and RLS policies are correct.`);
            console.error("Fetch sessions error:", error.message);
        } else {
            setSessions(data as FinalResultSession[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleAddSession = async () => {
        setAddSessionError('');
        setAddSessionSuccess(false);
        if (!newSessionName.trim() || !/^\d{4}-\d{4}$/.test(newSessionName.trim())) {
            setAddSessionError('Invalid format. Please use YYYY-YYYY (e.g., 2023-2024).');
            return;
        }

        setIsAddingSession(true);
        try {
            const { error } = await supabase.from('final_result_sessions').insert({ session_name: newSessionName.trim() });
            if (error) {
                if (error.code === '23505') { // Handle unique constraint violation
                    setAddSessionError(`Session '${newSessionName.trim()}' already exists.`);
                } else {
                    setAddSessionError(`Error: ${error.message}. Check RLS policies.`);
                    console.error("Add session error:", error.message);
                }
            } else {
                setNewSessionName('');
                setAddSessionSuccess(true);
                setTimeout(() => setAddSessionSuccess(false), 3000); // Clear message after 3 seconds
                await fetchSessions();
            }
        } catch (e: any) {
            setAddSessionError(`An unexpected error occurred: ${e.message}`);
        } finally {
            setIsAddingSession(false);
        }
    };


    return (
        <div className="space-y-4">
            <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newSessionName}
                        onChange={(e) => {
                            setNewSessionName(e.target.value);
                            if (addSessionError) setAddSessionError('');
                            if (addSessionSuccess) setAddSessionSuccess(false);
                        }}
                        placeholder="New Session, e.g., 2023-2024"
                        className="flex-grow rounded-lg border border-border bg-surface/50 px-3 py-2 text-text"
                    />
                    <button
                        onClick={handleAddSession}
                        disabled={isAddingSession}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg transition-colors hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {isAddingSession ? 'Adding...' : 'Add Session'}
                    </button>
                </div>
                {addSessionError && <p className="text-xs text-red-400 mt-2 px-1">{addSessionError}</p>}
                {addSessionSuccess && <p className="text-xs text-green-400 mt-2 px-1">Session added successfully!</p>}
            </div>
            {loading ? <p>Loading sessions...</p> : sessions.map(s => (
                <SessionRow
                    key={s.id}
                    session={s}
                    onRefresh={fetchSessions}
                />
            ))}
        </div>
    );
};

// --- Other Results Manager ---
const OtherResultModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    result: OtherResult | null;
    isSaving: boolean;
}> = ({ isOpen, onClose, onSave, result, isSaving }) => {
    const [formData, setFormData] = useState({ roll_number: '', student_name: '', exam_name: 'Class Test', semester: '1st Semester', student_group: 'A' });
    const [subjects, setSubjects] = useState<OtherSubjectResult[]>([{ subject_name: '', marks_obtained: 0, total_marks: 100 }]);

    useEffect(() => {
        if (result) {
            setFormData({
                roll_number: result.roll_number,
                student_name: result.student_name,
                exam_name: result.exam_name,
                semester: result.semester,
                student_group: result.student_group,
            });
            setSubjects(result.subjects && result.subjects.length > 0 ? result.subjects : [{ subject_name: '', marks_obtained: 0, total_marks: 100 }]);
        } else {
            setFormData({ roll_number: '', student_name: '', exam_name: 'Class Test', semester: '1st Semester', student_group: 'A' });
            setSubjects([{ subject_name: '', marks_obtained: 0, total_marks: 100 }]);
        }
    }, [result, isOpen]);

    const handleSubjectChange = (index: number, field: keyof OtherSubjectResult, value: string | number) => {
        const newSubjects = [...subjects];
        newSubjects[index] = { ...newSubjects[index], [field]: field === 'subject_name' ? value : Number(value) };
        setSubjects(newSubjects);
    };
    
    const addSubject = () => {
        setSubjects([...subjects, { subject_name: '', marks_obtained: 0, total_marks: 100 }]);
    };
    
    const removeSubject = (index: number) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter((_, i) => i !== index));
        }
    };

    const handleSave = () => {
        if (!formData.roll_number.trim() || !formData.student_name.trim()) {
            alert("Roll Number and Student Name are required.");
            return;
        }
        if (subjects.some(s => !s.subject_name.trim())) {
            alert("All subject names must be filled out.");
            return;
        }
        onSave({ ...formData, subjects });
    };
    
    if (!isOpen) return null;

    return (
         <AnimatePresence>
             {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div className="relative w-full max-w-2xl bg-[#001833] border border-border rounded-xl shadow-2xl p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                        <h2 className="text-xl font-bold mb-4">{result ? 'Edit Result' : 'Add New Result'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} placeholder="Roll Number" className="w-full input-style bg-surface/50"/>
                            <input value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} placeholder="Student Name" className="w-full input-style bg-surface/50"/>
                            <select value={formData.exam_name} onChange={e => setFormData({...formData, exam_name: e.target.value})} className="w-full input-style bg-surface/50"><option>Class Test</option><option>Quiz Test</option><option>Midterm Exam</option></select>
                            <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full input-style bg-surface/50">{semesters.map(s=><option key={s}>{s}</option>)}</select>
                            <div className="md:col-span-2"><p className="text-sm">Group:</p><div className="flex gap-4 mt-2"><label><input type="radio" value="A" checked={formData.student_group === 'A'} onChange={e=>setFormData({...formData, student_group: e.target.value})} /> A</label><label><input type="radio" value="B" checked={formData.student_group === 'B'} onChange={e=>setFormData({...formData, student_group: e.target.value})}/> B</label></div></div>
                        </div>
                        <div className="mt-4 border-t border-border pt-4">
                             <h3 className="font-semibold mb-2">Subjects</h3>
                            {subjects.map((s, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <input value={s.subject_name} onChange={e => handleSubjectChange(i, 'subject_name', e.target.value)} placeholder="Subject Name" className="col-span-5 input-style bg-surface/50"/>
                                    <input type="number" value={s.marks_obtained} onChange={e => handleSubjectChange(i, 'marks_obtained', e.target.value)} placeholder="Marks" className="col-span-3 input-style bg-surface/50"/>
                                    <input type="number" value={s.total_marks} onChange={e => handleSubjectChange(i, 'total_marks', e.target.value)} placeholder="Total" className="col-span-3 input-style bg-surface/50"/>
                                    <button onClick={() => removeSubject(i)} className="col-span-1 text-red-400 disabled:opacity-50" disabled={subjects.length <= 1}><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            ))}
                            <button onClick={addSubject} className="text-sm mt-2 text-primary">+ Add Subject</button>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={onClose} className="px-4 py-2 bg-surface text-sm rounded-lg">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Result'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


const OtherResultsManager: React.FC = () => {
    const [results, setResults] = useState<OtherResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentResult, setCurrentResult] = useState<OtherResult | null>(null);
    const [resultToDelete, setResultToDelete] = useState<OtherResult | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [filters, setFilters] = useState({ exam_name: 'all', semester: 'all', search: '' });

    const fetchResults = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('other_results').select('*').order('id', { ascending: false });
        if (error) {
            alert(`Could not load results: ${getErrorMessage(error)}`);
        } else {
            setResults(data as OtherResult[]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchResults(); }, []);

    const filteredResults = useMemo(() => {
        return results.filter(r => {
            const searchLower = filters.search.toLowerCase();
            const searchMatch = filters.search ? r.student_name.toLowerCase().includes(searchLower) || r.roll_number.includes(searchLower) : true;
            const examMatch = filters.exam_name === 'all' || r.exam_name === filters.exam_name;
            const semesterMatch = filters.semester === 'all' || r.semester === filters.semester;
            return searchMatch && examMatch && semesterMatch;
        });
    }, [results, filters]);
    
    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            if (currentResult) {
                const { error } = await supabase.from('other_results').update(data).eq('id', currentResult.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('other_results').insert(data);
                if (error) throw error;
            }
            await fetchResults();
            setIsModalOpen(false);
        } catch(error) {
            alert(`Save failed: ${getErrorMessage(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (result: OtherResult) => {
        setResultToDelete(result);
    };

    const handleDelete = async () => {
        if (!resultToDelete) return;
        setDeletingId(resultToDelete.id);
        try {
            const { error } = await supabase.from('other_results').delete().eq('id', resultToDelete.id);
            if (error) throw error;
            await fetchResults();
        } catch (error) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
        } finally {
            setDeletingId(null);
            setResultToDelete(null);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p>Manage class tests, quizzes, and midterm results.</p>
                <button onClick={() => { setCurrentResult(null); setIsModalOpen(true); }} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">Add Result</button>
            </div>
             <div className="grid grid-cols-3 gap-4 mb-4">
                <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Search by Roll or Name..." className="input-style bg-surface/50"/>
                <select value={filters.exam_name} onChange={e => setFilters({...filters, exam_name: e.target.value})} className="input-style bg-surface/50"><option value="all">All Exams</option><option>Class Test</option><option>Quiz Test</option><option>Midterm Exam</option></select>
                <select value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})} className="input-style bg-surface/50"><option value="all">All Semesters</option>{semesters.map(s=><option key={s}>{s}</option>)}</select>
            </div>

            {loading ? <p>Loading...</p> : (
                 <div className="bg-surface border border-border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-left"><th className="p-2">Roll</th><th className="p-2">Name</th><th className="p-2">Exam</th><th className="p-2">Semester</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                        {filteredResults.map(r => {
                            const isDeleting = deletingId === r.id;
                            return (
                                <tr key={r.id} className="border-t border-border">
                                    <td className="p-2">{r.roll_number}</td><td className="p-2">{r.student_name}</td><td className="p-2">{r.exam_name}</td><td className="p-2">{r.semester}</td>
                                    <td className="p-2 flex gap-2"><button onClick={() => { setCurrentResult(r); setIsModalOpen(true); }} className="text-secondary text-xs">Edit</button><button onClick={() => requestDelete(r)} disabled={isDeleting} className="text-red-400 text-xs">{isDeleting ? '...': 'Delete'}</button></td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            )}
             <OtherResultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} result={currentResult} isSaving={isSaving} />
             <ConfirmModal isOpen={!!resultToDelete} onClose={()=>setResultToDelete(null)} onConfirm={handleDelete} title="Confirm Delete" message={`Delete result for ${resultToDelete?.student_name}?`} isConfirming={!!deletingId}/>
        </div>
    );
};


// --- Main Component ---
const AdminManageResults: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'final' | 'other'>('final');

    const renderContent = () => {
        switch (activeTab) {
            case 'final': return <FinalResultsManager />;
            case 'other': return <OtherResultsManager />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Manage Results</h1>
                <p className="text-text/70 mt-1">Upload and manage final and other exam results.</p>
            </div>
            <div className="bg-surface/30 border border-border rounded-xl">
                <div className="border-b border-border flex">
                    <button onClick={() => setActiveTab('final')} className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'final' ? 'text-primary' : 'text-text/70 hover:text-text'}`}>
                        Final Results
                        {activeTab === 'final' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="results-tab" />}
                    </button>
                    <button onClick={() => setActiveTab('other')} className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'other' ? 'text-primary' : 'text-text/70 hover:text-text'}`}>
                        Other Results
                        {activeTab === 'other' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="results-tab" />}
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

export default AdminManageResults;
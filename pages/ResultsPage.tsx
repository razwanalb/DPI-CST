
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


// Setup for pdf.js worker to enable PDF processing in the browser.
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs';
 pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;
// --- Types for Results ---
interface OtherSubjectResult {
    subject_name: string;
    marks_obtained: number;
    total_marks: number;
}
interface OtherResult {
    id: string;
    roll_number: string;
    student_name: string;
    exam_name: string;
    semester: string;
    student_group: string;
    subjects: OtherSubjectResult[];
    total_marks_obtained?: number;
    percentage?: number;
}

interface FinalResultData {
    roll: string;
    gpas: { semester: string; gpa: string }[];
    referredSubjects: string[];
    status?: 'dropout';
}

interface FinalResultSession {
    session_name: string;
    pdf_path: string;
}


// --- Components for Displaying Results ---

const FinalResultDisplay: React.FC<{ result: FinalResultData; onSearchAgain: () => void }> = ({ result, onSearchAgain }) => {
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        let y = 20;

        // --- Header ---
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Final Result', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Bangladesh Technical Education Board (BTEB)', 105, y, { align: 'center' });
        y += 15;

        // --- Student Info ---
        doc.setFontSize(14);
        doc.text(`Roll Number: ${result.roll}`, 20, y);
        y += 15;

        if (result.status === 'dropout') {
            doc.setFontSize(40);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(239, 68, 68); // Red
            doc.text('DROP OUT', 105, 120, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text('This student is marked as a drop out due to having 4 or more referred subjects.', 105, 130, { align: 'center' });
        } else {
            // --- GPA Table ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Semester-wise CGPA', 20, y);
            y += 8;

            const tableColumn = ["Semester", "CGPA"];
            const tableRows: string[][] = [];
            result.gpas.forEach(item => {
                tableRows.push([item.semester, item.gpa]);
            });
            
            autoTable(doc, { 
                head: [tableColumn],
                body: tableRows,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [10, 35, 66] },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 1) {
                        const text = (data.cell.text as string[])[0];
                        if (text === 'Ref.') {
                             doc.setTextColor(239, 68, 68); // Red color for 'Ref.'
                        } else {
                             doc.setTextColor(34, 197, 94); // Green for others
                        }
                    }
                }
            });
            
            y = (doc as any).lastAutoTable.finalY + 15;

            // --- Referred Subjects ---
            if (result.referredSubjects.length > 0) {
                if (y > pageHeight - 40) { doc.addPage(); y = 20; }
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(239, 68, 68); // Red
                doc.text(`Total Referred Subjects (${result.referredSubjects.length})`, 20, y);
                y += 10;
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(40, 40, 40);
                result.referredSubjects.forEach((sub, index) => {
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    doc.text(`${index + 1}. ${sub}`, 25, y);
                    y += 8;
                });
            }
        }
        
        // --- Footer ---
        const dateTime = new Date().toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on ${dateTime}`, 105, pageHeight - 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Dinajpur Polytechnic Institute', 105, pageHeight - 14, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Computer Department', 105, pageHeight - 9, { align: 'center' });

        doc.save(`DPI_Result_${result.roll}.pdf`);
    };

    if (result.status === 'dropout') {
        return (
            <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 relative">
                <button 
                    onClick={onSearchAgain} 
                    className="absolute top-4 right-4 text-text/60 hover:text-text/90 transition-colors p-1 rounded-full hover:bg-surface/80"
                    aria-label="Close result"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="text-center pb-6 border-b border-border/50">
                    <h2 className="text-3xl font-bold gradient-text">Final Result</h2>
                    <p className="text-text/80 mt-2">Roll Number: <span className="font-bold text-lg text-primary tracking-wider">{result.roll}</span></p>
                </div>
    
                <div className="text-center my-8 py-10 bg-red-900/20 border-2 border-dashed border-red-500/30 rounded-xl">
                    <span className="material-symbols-outlined text-7xl text-red-400 animate-pulse">school</span>
                    <p className="text-5xl font-black text-red-400 mt-4 tracking-wider">DROP OUT</p>
                    <p className="text-text/70 mt-3 max-w-sm mx-auto">This roll number is marked as a drop out due to an excessive number of referred subjects.</p>
                </div>
                
                <div className="text-center mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button 
                        onClick={onSearchAgain} 
                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                         Check Another Result
                    </button>
                     <button 
                        onClick={handleDownloadPdf} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-secondary text-secondary font-bold py-3 px-8 rounded-lg hover:bg-secondary hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                         <span className="material-symbols-outlined">download</span>
                         Download PDF
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 relative">
            <button 
                onClick={onSearchAgain} 
                className="absolute top-4 right-4 text-text/60 hover:text-text/90 transition-colors p-1 rounded-full hover:bg-surface/80"
                aria-label="Close result"
            >
                <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center pb-6 border-b border-border/50">
                <h2 className="text-3xl font-bold gradient-text">Final Result</h2>
                <p className="text-text/80 mt-2">Roll Number: <span className="font-bold text-lg text-primary tracking-wider">{result.roll}</span></p>
            </div>
            <div className="mt-8">
                <h3 className="font-semibold text-xl text-secondary mb-4 text-center">Semester-wise CGPA</h3>
                <div className="overflow-x-auto bg-surface/50 rounded-lg border border-border">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-black/10">
                                <th className="p-4 font-semibold text-text/90">Semester</th>
                                <th className="p-4 font-semibold text-text/90 text-right">CGPA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.gpas.length > 0 ? result.gpas.map((item, index) => (
                                <tr key={index} className="border-t border-border">
                                    <td className="p-4 text-text/90">{item.semester}</td>
                                    <td className={`p-4 text-right font-bold text-lg ${item.gpa === 'Ref.' ? 'text-red-400' : 'text-green-400'}`}>
                                        {item.gpa}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-text/70">No GPA information found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {result.referredSubjects.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border/50">
                    <h3 className="font-semibold text-xl text-red-400 mb-3 text-center flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">warning</span>
                        Total Referred Subjects ({result.referredSubjects.length})
                    </h3>
                    <div className="text-left max-w-md mx-auto text-text/90 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            {result.referredSubjects.map((sub, index) => (
                                <p key={index} className="font-mono text-base">{index + 1}. {sub}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div className="text-center mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={onSearchAgain} 
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                     Check Another Result
                </button>
                 <button 
                    onClick={handleDownloadPdf} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-secondary text-secondary font-bold py-3 px-8 rounded-lg hover:bg-secondary hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                     <span className="material-symbols-outlined">download</span>
                     Download PDF
                </button>
            </div>
        </div>
    );
};


const OtherResultDisplay: React.FC<{ result: OtherResult; onSearchAgain: () => void }> = ({ result, onSearchAgain }) => {
    const totalMarks = result.subjects.reduce((sum, s) => sum + (s.total_marks || 0), 0);
    const obtainedMarks = result.subjects.reduce((sum, s) => sum + (s.marks_obtained || 0), 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    return (
    <div className="w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300">
        <div className="text-center pb-6 border-b border-border/50">
            <h2 className="text-3xl font-bold gradient-text">{result.student_name}</h2>
            <p className="text-text/80 mt-2">Roll: <span className="font-bold text-primary">{result.roll_number}</span> &bull; {result.semester}, Group {result.student_group}</p>
        </div>
        <div className="mt-8">
            <h3 className="font-semibold text-xl text-secondary mb-4 text-center">Result for: {result.exam_name}</h3>
            <div className="overflow-x-auto bg-surface/50 rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                    <thead>
                         <tr className="bg-black/10">
                            <th className="p-4 font-semibold text-text/90">Subject Name</th>
                            <th className="p-4 font-semibold text-text/90 text-center">Marks Obtained</th>
                            <th className="p-4 font-semibold text-text/90 text-center">Total Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.subjects.map((subject, index) => (
                            <tr key={index} className="border-t border-border">
                                <td className="p-4 text-text/90">{subject.subject_name}</td>
                                <td className="p-4 text-center font-bold text-lg text-primary">{subject.marks_obtained}</td>
                                <td className="p-4 text-center text-text/80">{subject.total_marks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xl font-bold text-text">
                Total Marks: <span className="text-primary text-2xl">{obtainedMarks} / {totalMarks}</span>
            </p>
            <p className="text-lg font-semibold text-green-400 mt-2">
                Percentage: {percentage.toFixed(2)}%
            </p>
        </div>
        <div className="text-center mt-10">
             <button 
                onClick={onSearchAgain} 
                className="bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                 Check Another Result
            </button>
        </div>
    </div>
)};

const ResultsPage: React.FC = () => {
    const [view, setView] = useState<'selection' | 'final' | 'other'>('selection');
    const [logoUrl, setLogoUrl] = useState('https://i.imgur.com/pWs3vnL.jpg');

    // State for Final Results (PDF Search)
    const [finalForm, setFinalForm] = useState({ roll: '', session: '' });
    const [finalLoading, setFinalLoading] = useState(false);
    const [finalResultData, setFinalResultData] = useState<FinalResultData | null>(null);
    const [finalNotFound, setFinalNotFound] = useState(false);
    const [pdfSearchError, setPdfSearchError] = useState('');
    const [sessions, setSessions] = useState<FinalResultSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // State for Other Results
    const [otherForm, setOtherForm] = useState({ exam_name: 'Class Test', roll: '', semester: '1st Semester', student_group: 'A' });
    const [otherLoading, setOtherLoading] = useState(false);
    const [otherResult, setOtherResult] = useState<OtherResult | null>(null);
    const [otherNotFound, setOtherNotFound] = useState(false);
    
    useEffect(() => {
        const fetchSessionsAndLogo = async () => {
             const { data: logoData } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'site_logo_url')
                .single();
            if (logoData?.value) {
                setLogoUrl(logoData.value);
            }

            if (view === 'final') {
                setSessionsLoading(true);
                const { data, error } = await supabase
                    .from('final_result_sessions')
                    .select('session_name, pdf_path')
                    .not('pdf_path', 'is', null)
                    .order('session_name', { ascending: false });

                if (error) {
                    const errorMessage = error.message || 'An unknown error occurred';
                    console.error("Error fetching sessions:", errorMessage);
                    setPdfSearchError(`Could not load available result sessions: ${errorMessage}`);
                } else {
                    setSessions(data as FinalResultSession[]);
                }
                setSessionsLoading(false);
            }
        };

        fetchSessionsAndLogo();
    }, [view]);

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!finalForm.roll || !finalForm.session) return;

        setFinalLoading(true);
        setFinalResultData(null);
        setFinalNotFound(false);
        setPdfSearchError('');

        try {
            const selectedSession = sessions.find(s => s.session_name === finalForm.session);
            if (!selectedSession || !selectedSession.pdf_path) {
                throw new Error('Selected session is invalid or has no PDF associated with it.');
            }
            
            const { data: urlData } = supabase.storage
                .from('results')
                .getPublicUrl(selectedSession.pdf_path);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('Results PDF URL could not be retrieved.');
            }
            
            const headCheck = await fetch(urlData.publicUrl, { method: 'HEAD' });
            if (!headCheck.ok) {
                 setFinalNotFound(true);
                 setPdfSearchError('The results PDF for this session could not be found. It may have been removed by an admin.');
                 setFinalLoading(false);
                 return;
            }

            const loadingTask = pdfjsLib.getDocument(urlData.publicUrl);
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
            }
            
            const sanitizedFullText = fullText.replace(/\s+/g, ' ');
            const startIndex = sanitizedFullText.indexOf(finalForm.roll);

            if (startIndex === -1) {
                setFinalNotFound(true);
                setPdfSearchError(`Roll number ${finalForm.roll} was not found in the results document for the ${finalForm.session} session.`);
                setFinalLoading(false);
                return;
            }

            const searchArea = sanitizedFullText.substring(startIndex);
            const nextRollRegex = /\b\d{6,}\b/;
            const nextRollMatch = searchArea.substring(finalForm.roll.length).match(nextRollRegex);
            const endIndex = nextRollMatch ? searchArea.indexOf(nextRollMatch[0], finalForm.roll.length) : searchArea.length;
            const resultLine = searchArea.substring(0, endIndex);

            // --- REFACTORED PARSING LOGIC ---
            
            // 1. Parse ALL potential data points from the result string.
            const gpas: { semester: string; gpa: string }[] = [];
            const referredSubjects: string[] = [];

            // Parse GPAs from "gpaX: ..." format
            const gpaRegex = /(gpa(\d)):\s*([\d.]+|[Rr]ef\b)/g;
            let gpaMatch;
            while ((gpaMatch = gpaRegex.exec(resultLine)) !== null) {
                const semesterNum = gpaMatch[2];
                let gpaValue = gpaMatch[3];
                if (gpaValue.toLowerCase().startsWith('ref')) gpaValue = 'Ref.';
                let semesterText = `${semesterNum}th Semester`;
                if (semesterNum === '1') semesterText = '1st Semester';
                else if (semesterNum === '2') semesterText = '2nd Semester';
                else if (semesterNum === '3') semesterText = '3rd Semester';
                gpas.push({ semester: semesterText, gpa: gpaValue });
            }

            // Parse referred subjects from both old ("ref_sub:") and new ("{...}") formats.
            const refSubNewFormatMatch = resultLine.match(/\{([^{}]+)\}/);
            const refSubOldFormatMatch = resultLine.match(/ref_sub:([\s\S]*)/);
            let subjectsText = '';
            if (refSubNewFormatMatch) subjectsText = refSubNewFormatMatch[1];
            else if (refSubOldFormatMatch) subjectsText = refSubOldFormatMatch[1];
            
            if (subjectsText) {
                const subjectCodeRegex = /\b\d+\s*\([^)]+\)/g;
                const matches = subjectsText.match(subjectCodeRegex);
                if (matches) referredSubjects.push(...matches.map(s => s.replace(/\s+/g, '')));
            }

            // Parse single GPA from format like "( 3.47 )"
            const newPassMatch = resultLine.match(/\(\s*([\d.]+)\s*\)/);
            
            // 2. Now, apply logic based on parsed data.

            // Drop Out Condition: 4 or more referred subjects and NO GPA data present at all.
            if (referredSubjects.length >= 4 && gpas.length === 0 && !newPassMatch) {
                setFinalResultData({
                    roll: finalForm.roll,
                    gpas: [],
                    referredSubjects: [],
                    status: 'dropout',
                });
                setFinalLoading(false);
                return; // We're done for the dropout case.
            }

            // Handle cases where no "gpaX" tags were found (e.g., single-semester result sheets).
            if (gpas.length === 0) {
                if (newPassMatch) {
                    gpas.push({ semester: '1st Semester', gpa: newPassMatch[1] });
                } else if (referredSubjects.length > 0) {
                    gpas.push({ semester: '1st Semester', gpa: 'Ref.' });
                }
            }
            
            // 3. Final check and set state.
            if (gpas.length === 0 && referredSubjects.length === 0) {
                 setFinalNotFound(true);
                 setPdfSearchError(`Roll number ${finalForm.roll} was found, but no result data could be parsed. The PDF format might be unexpected.`);
            } else {
                 gpas.sort((a, b) => {
                    const numA = parseInt(a.semester, 10);
                    const numB = parseInt(b.semester, 10);
                    return numA - numB; // Sort ascending: 1st, 2nd, etc.
                });
                
                setFinalResultData({
                    roll: finalForm.roll,
                    gpas,
                    referredSubjects,
                });
            }

        } catch (error: any) {
            console.error("Error searching PDF:", error.message);
            setPdfSearchError(`An error occurred: ${error.message}`);
            setFinalNotFound(true);
        } finally {
            setFinalLoading(false);
        }
    };

    const handleOtherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtherLoading(true);
        setOtherResult(null);
        setOtherNotFound(false);
        try {
            const { data, error } = await supabase.from('other_results').select('*').eq('roll_number', otherForm.roll).eq('exam_name', otherForm.exam_name).eq('semester', otherForm.semester).eq('student_group', otherForm.student_group).limit(1).single();
            if (error && error.code === 'PGRST116') {
                setOtherNotFound(true);
            } else if (error) {
                throw error;
            } else if (data) {
                setOtherResult(data as OtherResult);
            } else {
                setOtherNotFound(true);
            }
        } catch (error: any) {
            console.error("Error fetching other result:", error.message);
            alert(`An error occurred while fetching the result: ${error.message || 'Please try again.'}`);
        }
        finally { setOtherLoading(false); }
    };

    const resetAndGoToSelection = () => {
        setView('selection');
        setFinalResultData(null);
        setOtherResult(null);
    };

    const inputStyle = "w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-primary/80 transition-all duration-200 shadow-inner";
    const labelStyle = "block text-base font-medium text-text/90 mb-2";
    const requiredSpan = <span className="text-red-400 ml-1">*</span>;
    const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];


    const renderContent = () => {
        switch (view) {
            case 'selection':
                return (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10">
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }} 
                            onClick={() => setView('final')} 
                            className="bg-surface border border-border rounded-2xl shadow-xl p-8 text-center cursor-pointer hover:border-primary/80 transition-all duration-300 flex flex-col items-center justify-center"
                        >
                            <div className="p-5 rounded-full bg-primary/20 mb-4">
                                <span className="material-symbols-outlined text-5xl text-primary">school</span>
                            </div>
                            <h2 className="text-3xl font-bold mt-4 text-text">Final Results</h2>
                            <p className="text-text/70 mt-3">Check your final semester and diploma results from the official PDF.</p>
                        </motion.div>
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }} 
                            onClick={() => setView('other')} 
                            className="bg-surface border border-border rounded-2xl shadow-xl p-8 text-center cursor-pointer hover:border-secondary/80 transition-all duration-300 flex flex-col items-center justify-center"
                        >
                             <div className="p-5 rounded-full bg-secondary/20 mb-4">
                                <span className="material-symbols-outlined text-5xl text-secondary">assignment</span>
                            </div>
                            <h2 className="text-3xl font-bold mt-4 text-text">Other Results</h2>
                            <p className="text-text/70 mt-3">Check class tests, quizzes, and midterm exam results.</p>
                        </motion.div>
                    </div>
                );

            case 'final':
                return finalResultData ? (
                     <FinalResultDisplay result={finalResultData} onSearchAgain={resetAndGoToSelection} />
                ) : (
                    <div className="w-full max-w-md">
                        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
                             <button onClick={() => setView('selection')} className="flex items-center gap-1 text-sm text-secondary mb-6 hover:underline">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Back to Selection
                            </button>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold gradient-text">Final Result Check</h2>
                                <p className="text-center text-base text-text/70 mt-2">Enter your roll number to search the official results PDF.</p>
                            </div>
                            <form onSubmit={handleFinalSubmit} className="space-y-6 mt-8">
                                <div>
                                    <label htmlFor="session" className={labelStyle}>Session{requiredSpan}</label>
                                    <select 
                                        id="session" 
                                        value={finalForm.session} 
                                        onChange={e => setFinalForm(f => ({ ...f, session: e.target.value }))} 
                                        className={`${inputStyle} appearance-none`}
                                        required
                                        disabled={sessionsLoading}
                                    >
                                        <option value="">{sessionsLoading ? 'Loading...' : 'Select a session'}</option>
                                        {sessions.map(s => <option key={s.session_name} value={s.session_name}>{s.session_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="roll" className={labelStyle}>Roll Number{requiredSpan}</label>
                                    <input type="number" id="roll" value={finalForm.roll} onChange={e => setFinalForm(f => ({ ...f, roll: e.target.value }))} className={inputStyle} required placeholder="e.g., 702893" disabled={!finalForm.session} />
                                </div>
                                {finalNotFound && <p className="text-center text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">{pdfSearchError || 'Result not found for the entered roll number.'}</p>}
                                <button type="submit" disabled={finalLoading || !finalForm.session || !finalForm.roll} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100">
                                    {finalLoading ? 'Searching...' : 'Get Result'}
                                </button>
                            </form>
                        </div>
                    </div>
                );

            case 'other':
                 return otherResult ? <OtherResultDisplay result={otherResult} onSearchAgain={resetAndGoToSelection} /> : (
                    <div className="w-full max-w-lg">
                        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
                             <button onClick={() => setView('selection')} className="flex items-center gap-1 text-sm text-secondary mb-6 hover:underline">
                                 <span className="material-symbols-outlined text-base">arrow_back</span>
                                 Back to Selection
                             </button>
                             <div className="text-center">
                                <h2 className="text-3xl font-bold gradient-text">Other Result Check</h2>
                                <p className="text-center text-base text-text/70 mt-2">Fill in the details to find your result.</p>
                             </div>
                            <form onSubmit={handleOtherSubmit} className="space-y-6 mt-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div><label className={labelStyle}>Exam Name{requiredSpan}</label><select value={otherForm.exam_name} onChange={e => setOtherForm(f => ({...f, exam_name: e.target.value}))} className={`${inputStyle} appearance-none`}><option>Class Test</option><option>Quiz Test</option><option>Midterm Exam</option></select></div>
                                    <div><label className={labelStyle}>Roll Number{requiredSpan}</label><input type="number" value={otherForm.roll} onChange={e => setOtherForm(f => ({...f, roll: e.target.value}))} className={inputStyle} required placeholder="e.g., 702893"/></div>
                                    <div><label className={labelStyle}>Semester{requiredSpan}</label><select value={otherForm.semester} onChange={e => setOtherForm(f => ({...f, semester: e.target.value}))} className={`${inputStyle} appearance-none`}>{semesters.map(s => <option key={s}>{s}</option>)}</select></div>
                                    <div><label className={labelStyle}>Group{requiredSpan}</label><div className="flex gap-4 mt-3"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="group" value="A" checked={otherForm.student_group === 'A'} onChange={e => setOtherForm(f => ({...f, student_group: e.target.value}))} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary"/> A</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="group" value="B" checked={otherForm.student_group === 'B'} onChange={e => setOtherForm(f => ({...f, student_group: e.target.value}))} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary" /> B</label></div></div>
                                </div>
                                {otherNotFound && <p className="text-center text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">Result not found for the given details.</p>}
                                <button type="submit" disabled={otherLoading} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100">{otherLoading ? 'Checking...' : 'Get Result'}</button>
                            </form>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 font-display">
            <div className="text-center mb-12">
                <img 
                    alt="DPI Logo" 
                    className="h-20 w-20 object-contain mx-auto mb-4" 
                    src={logoUrl}
                />
                <h1 className="text-4xl font-black tracking-tight text-text">Result Publication System</h1>
                <p className="text-lg text-text/80 mt-2">Dinajpur Polytechnic Institute, Dinajpur</p>
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={view} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="w-full flex justify-center">
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default ResultsPage;
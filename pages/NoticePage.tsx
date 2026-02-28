// Fix: Corrected import statement for React hooks by removing quotes.
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Attachment {
    url: string;
    name: string;
    type: 'image' | 'pdf';
    path: string;
}

interface Notice {
    id: string;
    title: string;
    createdAt: string; 
    content: string;
    author: string;
    category: 'Academic' | 'Event' | 'General';
    status: 'published' | 'draft';
    attachments: Attachment[] | null;
}

const getTypeColor = (type: Notice['category']) => {
    switch (type) {
        case 'Academic':
            return 'bg-blue-500/20 text-blue-300';
        case 'Event':
            return 'bg-purple-500/20 text-purple-300';
        case 'General':
            return 'bg-gray-500/20 text-gray-300';
        default:
            return 'bg-surface';
    }
}

const ExpandableContent: React.FC<{ content: string; truncateLength: number }> = ({ content, truncateLength }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (content.length <= truncateLength) {
        return <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    return (
        <div>
            <p className="text-text/90 leading-relaxed whitespace-pre-wrap">
                {isExpanded ? content : `${content.substring(0, truncateLength)}...`}
            </p>
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-secondary font-semibold text-sm mt-2 hover:underline"
            >
                {isExpanded ? 'See Less' : 'See More'}
            </button>
        </div>
    );
};

const Lightbox: React.FC<{
    images: { url: string; name: string }[];
    startIndex: number;
    onClose: () => void;
    noticeTitle: string;
}> = ({ images, startIndex, onClose, noticeTitle }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    
    const handleDownload = async () => {
        const image = images[currentIndex];
        if (!image) return;
        try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = image.name || `notice-image-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) { console.error("Download failed:", error); }
    };

    const currentImage = images[currentIndex];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                
                <div className="relative w-full text-center p-4 z-[101]">
                    <h2 className="text-2xl font-bold text-white mb-2 truncate">{noticeTitle}</h2>
                    {currentImage?.name && <p className="text-white/80">{currentImage.name}</p>}
                </div>

                <motion.div className="relative w-full max-w-5xl max-h-[75vh] flex-grow" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                    <AnimatePresence mode="wait">
                        <motion.img 
                            key={currentImage.url}
                            src={currentImage.url} 
                            className="max-w-full max-h-full object-contain mx-auto" 
                            alt={currentImage.name || `Attachment ${currentIndex + 1}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    </AnimatePresence>
                </motion.div>
                
                {/* Controls */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-[101]"><span className="material-symbols-outlined">close</span></button>
                {images.length > 1 && <>
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-[101]"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-[101]"><span className="material-symbols-outlined">arrow_forward_ios</span></button>
                </>}
                <button onClick={handleDownload} className="absolute bottom-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-[101]"><span className="material-symbols-outlined">download</span></button>
                <div className="text-white text-sm mt-2 z-[101]">{currentIndex + 1} / {images.length}</div>
            </div>
        </AnimatePresence>
    );
};


const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [lightboxState, setLightboxState] = useState<{ images: Attachment[], startIndex: number, noticeTitle: string } | null>(null);


    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .eq('status', 'published')
                .order('createdAt', { ascending: false });

            if (error) {
                console.error("Error fetching notices:", error.message || error);
            } else {
                setNotices(data as Notice[]);
            }
            setLoading(false);
        };

        fetchNotices();
    }, []);

    useEffect(() => {
        if (loading || notices.length === 0 || !location.hash) {
            return;
        }
    
        const id = location.hash.substring(1);
        const element = document.getElementById(id);
    
        if (element) {
            const timer = setTimeout(() => {
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
                element.classList.add('highlight');
    
                const cleanupTimer = setTimeout(() => {
                    element.classList.remove('highlight');
                }, 5000);
    
                (element as any)._cleanupTimer = cleanupTimer;
            }, 100);
    
            return () => {
                clearTimeout(timer);
                if ((element as any)._cleanupTimer) {
                    clearTimeout((element as any)._cleanupTimer);
                }
                element.classList.remove('highlight');
            };
        }
    }, [loading, notices, location.hash]);

    return (
        <>
            {lightboxState && (
                <Lightbox 
                    images={lightboxState.images} 
                    startIndex={lightboxState.startIndex} 
                    onClose={() => setLightboxState(null)}
                    noticeTitle={lightboxState.noticeTitle}
                />
            )}
            <div className="px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tight text-text">Notice Board</h1>
                        <p className="mt-2 text-lg text-text/70">Stay updated with the latest announcements and news.</p>
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-center text-text/70">Loading notices...</p>
                        ) : notices.length > 0 ? (
                            notices.map((notice) => {
                                const imageAttachments = notice.attachments?.filter(att => att.type === 'image') || [];
                                const pdfAttachments = notice.attachments?.filter(att => att.type === 'pdf') || [];

                                return (
                                    <div key={notice.id} id={`notice-${notice.id}`} className="bg-surface border border-border rounded-xl shadow-lg p-6 hover:shadow-primary/20 transition-shadow duration-300">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                            <h2 className="text-xl font-bold text-text">{notice.title}</h2>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${getTypeColor(notice.category)}`}>
                                                {notice.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-text/70 flex items-center gap-4 mb-4">
                                            <span>
                                                <span className="font-semibold">Published on:</span> {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                            <span>|</span>
                                            <span>
                                                <span className="font-semibold">By:</span> {notice.author || 'Admin'}
                                            </span>
                                        </div>
                                        <ExpandableContent content={notice.content} truncateLength={300} />

                                        {(imageAttachments.length > 0 || pdfAttachments.length > 0) && (
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <p className="text-sm font-semibold text-text/80 mb-2">Attachments:</p>
                                                
                                                {/* Image Attachments */}
                                                {imageAttachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-4">
                                                        {imageAttachments.map((att, index) => (
                                                            <div
                                                                key={att.path}
                                                                onClick={() => setLightboxState({ images: imageAttachments, startIndex: index, noticeTitle: notice.title })}
                                                                className="w-full max-w-[336px] h-[192px] rounded-lg overflow-hidden cursor-pointer group bg-black/20 border border-border"
                                                            >
                                                                <img 
                                                                    src={att.url} 
                                                                    alt={att.name} 
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* PDF Attachments */}
                                                {pdfAttachments.length > 0 && (
                                                    <div className={`space-y-2 ${imageAttachments.length > 0 ? 'mt-4' : ''}`}>
                                                        {pdfAttachments.map(att => (
                                                            <a 
                                                                key={att.path}
                                                                href={att.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors border border-red-500/20"
                                                            >
                                                                <span className="material-symbols-outlined">picture_as_pdf</span>
                                                                {att.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 bg-surface rounded-xl border border-border">
                                <span className="material-symbols-outlined text-5xl text-text/50">inbox</span>
                                <p className="mt-4 text-text/70">No notices have been published yet. Please check back later.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NoticePage;

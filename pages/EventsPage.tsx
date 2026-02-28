import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import Link & useLocation
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
    id: string;
    title: string;
    date: string;
    description: string;
    imageUrl: string;
    status: 'published' | 'draft';
}

interface GalleryImage {
    id: string;
    image_url: string;
    title?: string;
    subtitle?: string;
    batch_id?: string;
}

type ImageGroup = GalleryImage[];

interface AlumniSettings {
    displayImage: string | null;
    facebookUrl: string;
    whatsappUrl: string;
    discordUrl: string;
}

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const formattedDate = event.date 
        ? new Date(event.date).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' 
          }) 
        : 'Date to be announced';

    return (
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl bg-surface border border-border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-cover" 
                style={{ backgroundImage: `url("${event.imageUrl}")` }}
            ></div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
                <div>
                    <p className="text-text text-lg font-bold leading-normal">{event.title}</p>
                    <p className="text-sm font-medium text-text/70 mt-1">{formattedDate}</p>
                    <p className="text-text/80 text-sm font-normal leading-normal mt-2 line-clamp-3">{event.description}</p>
                </div>
                <Link 
                    to={`/event/${event.id}`}
                    className="w-full flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:scale-105 transition-transform"
                >
                    <span className="truncate">Register</span>
                </Link>
            </div>
        </div>
    );
};

const Lightbox: React.FC<{
    images: GalleryImage[];
    startIndex: number;
    onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
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
            const response = await fetch(image.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${image.title || 'gallery-image'}-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) { console.error("Download failed:", error); }
    };

    const currentImage = images[currentIndex];
    const groupTitle = images[0]?.title;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                
                <div className="relative w-full text-center p-4 z-[101]">
                    {groupTitle && <h2 className="text-2xl font-bold text-white mb-2">{groupTitle}</h2>}
                    {currentImage?.subtitle && <p className="text-white/80">{currentImage.subtitle}</p>}
                </div>

                <motion.div className="relative w-full max-w-5xl max-h-[75vh] flex-grow" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                    <AnimatePresence mode="wait">
                        <motion.img 
                            key={currentImage.id}
                            src={currentImage.image_url} 
                            className="max-w-full max-h-full object-contain mx-auto" 
                            alt={currentImage.subtitle || `Gallery view ${currentIndex + 1}`}
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

const GroupCollage: React.FC<{ group: ImageGroup; onClick: () => void }> = ({ group, onClick }) => {
    const count = group.length;
    if (count === 0) return null;

    const imgClasses = "h-full w-full object-cover transition-transform duration-300 group-hover:scale-110";

    return (
        <div onClick={onClick} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg shadow-lg bg-surface/50">
            {/* Single Image */}
            {count === 1 && (
                <div className="overflow-hidden h-full w-full">
                    <img src={group[0].image_url} alt={group[0].title || 'Gallery image'} className={imgClasses} />
                </div>
            )}
            
            {/* Double Image (Vertical Stack) */}
            {count === 2 && (
                <div className="grid grid-rows-2 h-full w-full gap-1">
                    <div className="overflow-hidden"><img src={group[0].image_url} alt={group[0].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[1].image_url} alt={group[1].title || 'Gallery image'} className={imgClasses} /></div>
                </div>
            )}
            
            {/* 3 Images (1 large left, 2 small right) */}
            {count === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1">
                    <div className="row-span-2 overflow-hidden"><img src={group[0].image_url} alt={group[0].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[1].image_url} alt={group[1].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[2].image_url} alt={group[2].title || 'Gallery image'} className={imgClasses} /></div>
                </div>
            )}

            {/* 4 Images (2x2 Grid) */}
            {count === 4 && (
                <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1">
                    <div className="overflow-hidden"><img src={group[0].image_url} alt={group[0].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[1].image_url} alt={group[1].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[2].image_url} alt={group[2].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[3].image_url} alt={group[3].title || 'Gallery image'} className={imgClasses} /></div>
                </div>
            )}

            {/* 5+ Images (2x2 Grid with overlay) */}
            {count >= 5 && (
                <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1">
                    <div className="overflow-hidden"><img src={group[0].image_url} alt={group[0].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[1].image_url} alt={group[1].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden"><img src={group[2].image_url} alt={group[2].title || 'Gallery image'} className={imgClasses} /></div>
                    <div className="overflow-hidden relative">
                        <img src={group[3].image_url} alt={group[3].title || 'Gallery image'} className={`${imgClasses} brightness-50`} />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-2">
                             <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">arrow_forward_ios</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Title Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
                {group[0]?.title && <h3 className="font-bold text-white shadow-black/50 text-shadow-lg text-sm">{group[0].title}</h3>}
            </div>
        </div>
    );
};



const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [alumniSettings, setAlumniSettings] = useState<AlumniSettings>({
        displayImage: null, facebookUrl: '#', whatsappUrl: '#', discordUrl: '#'
    });
    const [heroContent, setHeroContent] = useState({
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQpYnw507NWDKznqfBD7vDG5SC-XU7iqxi3qvpSW0od0bRh5_qaDGfImlyCVtM1RfdrXLKfto4diS2p-JAiEd0JKvM8OUdVkfJxoGYScGD1sWR1uUFV7RH1oFmGJeiaFcacuvM2WeI-A4VnF2Gu96T-V_OcNAviaIgYnjmm03Fwld66DAn6746U6Rxx0kOBXlVo9pOxwej0GRp4Oh5AELTckUUv1Z-VuoYyiu_Tf2otNJexnSTW8Iy4gaors3hC-pCD2r9kkCpjPg6",
        title: 'Department Events & Activities',
        subtitle: 'Join us for workshops, seminars, and cultural programs.'
    });
    const [loading, setLoading] = useState(true);
    const [lightboxContent, setLightboxContent] = useState<{ images: ImageGroup, startIndex: number } | null>(null);
    const [showAllGroups, setShowAllGroups] = useState(false);
    const location = useLocation();

    const imageGroups = useMemo(() => {
        const groups: Record<string, ImageGroup> = {};
        const ungrouped: ImageGroup = [];

        galleryImages.forEach(image => {
            if (image.batch_id) {
                if (!groups[image.batch_id]) {
                    groups[image.batch_id] = [];
                }
                groups[image.batch_id].push(image);
            } else {
                ungrouped.push(image);
            }
        });

        const groupedArray = Object.values(groups);
        const ungroupedAsGroups = ungrouped.map(image => [image]);
        
        return [...groupedArray, ...ungroupedAsGroups];

    }, [galleryImages]);


    useEffect(() => {
        const fetchEventsAndContent = async () => {
            setLoading(true);

            const eventsPromise = supabase.from('events').select('*').eq('status', 'published').order('date', { ascending: false });
            const galleryPromise = supabase.from('gallery_images').select('id, image_url, title, subtitle, batch_id').order('created_at', { ascending: false });
            
            const settingsKeys = [
                'alumni_display_image', 'alumni_facebook_url', 'alumni_whatsapp_url', 'alumni_discord_url',
                'hero_events_image_url', 'hero_events_title', 'hero_events_subtitle'
            ];
            const contentPromise = supabase.from('site_settings').select('key, value').in('key', settingsKeys);

            const [
                eventsResult,
                galleryResult,
                contentResult
            ] = await Promise.all([eventsPromise, galleryPromise, contentPromise]);

            if (eventsResult.error) console.error("Error fetching events:", eventsResult.error.message);
            else setEvents(eventsResult.data as Event[] || []);
            
            if (galleryResult.error && galleryResult.error.message.includes('does not exist')) {
                console.warn("Public page: Gallery feature columns not found. Falling back to basic image query. Please run the SQL migration to enable this feature.");
                const { data: fallbackData } = await supabase.from('gallery_images').select('id, image_url').order('created_at', { ascending: false });
                setGalleryImages(fallbackData as GalleryImage[] || []);
            } else if (galleryResult.error) {
                console.error("Error fetching gallery images:", galleryResult.error.message);
            } else {
                 setGalleryImages(galleryResult.data as GalleryImage[] || []);
            }

            if (contentResult.error) console.error("Error fetching site settings:", contentResult.error.message);
            else {
                const settingsMap = contentResult.data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>);
                setAlumniSettings({
                    displayImage: settingsMap.alumni_display_image || '...',
                    facebookUrl: settingsMap.alumni_facebook_url || '#',
                    whatsappUrl: settingsMap.alumni_whatsapp_url || '#',
                    discordUrl: settingsMap.alumni_discord_url || '#',
                });
                setHeroContent(prev => ({
                    imageUrl: settingsMap.hero_events_image_url || prev.imageUrl,
                    title: settingsMap.hero_events_title || prev.title,
                    subtitle: settingsMap.hero_events_subtitle || prev.subtitle
                }));
            }
            setLoading(false);
        };
        fetchEventsAndContent();
    }, []);

    useEffect(() => {
        // FIX: This effect now depends on `loading` to prevent a race condition.
        // It will only run after all data is loaded and the component is ready to render the events.
        if (loading || events.length === 0 || !location.hash) {
            return;
        }
    
        const id = location.hash.substring(1); // Get ID from hash, e.g., "event-123"
        const element = document.getElementById(id);
    
        if (element) {
            // Use a timeout to ensure the browser has painted the element.
            const timer = setTimeout(() => {
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
                element.classList.add('highlight');
    
                const cleanupTimer = setTimeout(() => {
                    element.classList.remove('highlight');
                }, 5000); // Match CSS animation duration
    
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
    }, [loading, events, location.hash]); // Depend on loading state as well.

    const renderGallery = () => {
        if (imageGroups.length === 0) return null;

        const visibleGroups = showAllGroups ? imageGroups : imageGroups.slice(0, 8);
        const hasMore = imageGroups.length > 8 && !showAllGroups;

        return (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {visibleGroups.map((group, index) => (
                        <GroupCollage
                            key={group[0]?.batch_id || group[0]?.id || index}
                            group={group}
                            onClick={() => setLightboxContent({ images: group, startIndex: 0 })}
                        />
                    ))}
                </div>
                {hasMore && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setShowAllGroups(true)}
                            className="inline-flex min-w-[140px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-primary to-secondary px-6 py-3 text-base font-semibold text-white transition-transform hover:scale-105 shadow-lg shadow-primary/20"
                        >
                            See More
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div>
            {lightboxContent && (
                <Lightbox
                    images={lightboxContent.images}
                    startIndex={lightboxContent.startIndex}
                    onClose={() => setLightboxContent(null)}
                />
            )}
            <div className="@container">
                <div className="bg-cover bg-center flex flex-col justify-end overflow-hidden min-h-[32rem] rounded-b-xl" style={{ backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.1) 50%), url("${heroContent.imageUrl}")` }}>
                    <div className="p-8 max-w-7xl mx-auto w-full">
                        <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight leading-tight">{heroContent.title}</h1>
                        <p className="text-white/90 text-lg mt-2 max-w-2xl">{heroContent.subtitle}</p>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-text text-3xl font-bold leading-tight tracking-[-0.015em] pb-3">Upcoming & Recent Events</h2>
                
                {loading ? (
                    <p className="text-center text-text/70 pt-8">Loading events...</p>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {events.map(event => 
                            <div key={event.id} id={`event-${event.id}`}>
                                <EventCard event={event} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-surface rounded-xl border border-border mt-4">
                        <span className="material-symbols-outlined text-6xl text-text/30">event_busy</span>
                        <h3 className="mt-4 text-xl font-semibold text-text">No Events Found</h3>
                        <p className="mt-2 text-text/60">There are no upcoming events at this time. Please check back later.</p>
                    </div>
                )}

                <div className="mt-20">
                    <h2 className="text-text text-3xl font-bold leading-tight tracking-[-0.015em] pb-3">Alumni Network</h2>
                    <div className="mt-4 bg-surface border border-border rounded-xl shadow-lg overflow-hidden md:flex">
                        <div className="md:w-1/2 md:flex-shrink-0">
                            <img className="h-64 w-full object-cover md:h-full" src={alumniSettings.displayImage!} alt="Alumni group photo"/>
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                             <h3 className="text-2xl font-bold gradient-text">Stay Connected, Stay Ahead</h3>
                             <p className="mt-2 text-text/80">
                                Join our thriving alumni community to stay connected with classmates, receive career support, and contribute to the growth of our department.
                            </p>
                            <div className="mt-6 flex items-center gap-4">
                                <a href={alumniSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-primary/20 rounded-full text-primary hover:bg-primary/30 transition-colors" aria-label="Facebook"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg></a>
                                <a href={alumniSettings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-500/20 rounded-full text-green-400 hover:bg-green-500/30 transition-colors" aria-label="WhatsApp"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.357 1.846 6.069l-1.102 4.029 4.14-1.082z"/></svg></a>
                                <a href={alumniSettings.discordUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-indigo-500/20 rounded-full text-indigo-400 hover:bg-indigo-500/30 transition-colors" aria-label="Discord"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 28 28"><path d="M23.021 3.445H4.978A1.527 1.527 0 0 0 3.45 4.979V23.02a1.527 1.527 0 0 0 1.528 1.533h18.043a1.527 1.527 0 0 0 1.528-1.533V4.979a1.527 1.527 0 0 0-1.528-1.534ZM9.835 18.639a2.441 2.441 0 0 1-2.457-2.457 2.441 2.441 0 0 1 2.457-2.457 2.441 2.441 0 0 1 2.457 2.457 2.441 2.441 0 0 1-2.457 2.457Zm8.33 0a2.441 2.441 0 0 1-2.457-2.457 2.441 2.441 0 0 1 2.457-2.457 2.441 2.441 0 0 1 2.457 2.457 2.441 2.441 0 0 1-2.457 2.457Z"/></svg></a>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-text text-3xl font-bold leading-tight tracking-[-0.015em] pb-3 pt-20">Photo Gallery</h2>
                <div className="pt-4">
                    {loading ? (
                         <p className="text-center text-text/70 pt-8">Loading gallery...</p>
                    ) : imageGroups.length > 0 ? (
                        renderGallery()
                    ) : (
                        <div className="text-center py-16 bg-surface rounded-xl border border-border mt-4">
                            <span className="material-symbols-outlined text-6xl text-text/30">photo_library</span>
                            <h3 className="mt-4 text-xl font-semibold text-text">Gallery is Empty</h3>
                            <p className="mt-2 text-text/60">Images will appear here once they are added by an admin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
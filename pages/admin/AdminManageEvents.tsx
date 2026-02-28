import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

interface Event {
    id: string;
    title: string;
    date: string;
    description: string;
    imageUrl: string;
    status: 'published' | 'draft';
    file_path?: string; // For storage management
}

interface GalleryImage {
    id: string;
    image_url: string;
    file_path: string;
    created_at: string;
    title?: string;
    subtitle?: string;
    batch_id?: string;
}

interface ImageMeta {
    file: File;
    previewUrl: string;
    title: string;
    subtitle: string;
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

const EventModal = ({ isOpen, onClose, onSave, event, isSaving }) => {
    const [formData, setFormData] = useState({ title: '', date: '', description: ''});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (event) {
            const date = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';
            setFormData({
                title: event.title,
                date: date,
                description: event.description,
            });
            setImagePreview(event.imageUrl);
            setImageFile(null); // Reset file on open
        } else {
            setFormData({ title: '', date: '', description: '' });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (!formData.title.trim() || !formData.date || !formData.description.trim()) {
            return alert("Title, Date, and Description are required.");
        }
        if (!imageFile && !event) {
            return alert("An image is required for a new event.");
        }
        
        const dateISOString = new Date(formData.date).toISOString();
        onSave({ ...formData, date: dateISOString }, imageFile);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div
                        className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <h2 className="text-2xl font-bold mb-6">{event ? 'Edit Event' : 'Create New Event'}</h2>
                        <div className="space-y-4">
                            <input name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" className="w-full input-style" />
                            <input name="date" value={formData.date} onChange={handleChange} type="datetime-local" className="w-full input-style" />
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Event Description" rows={5} className="w-full input-style" />
                            <div>
                                <label className="block text-sm font-medium text-text/90 mb-2">Event Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-32 bg-surface/50 rounded-lg border border-border flex items-center justify-center shrink-0">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover rounded-md" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-text/50">image</span>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">upload</span>
                                            Choose Image
                                        </button>
                                        <p className="text-xs text-text/60 mt-2">
                                            Recommended aspect ratio is 16:9.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface/80 hover:bg-surface text-text/90">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white min-w-[100px]">
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const GalleryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any, files?: File[]) => void;
    image: GalleryImage | null;
    isSaving: boolean;
    schemaSupportsTitles: boolean;
}> = ({ isOpen, onClose, onSave, image, isSaving, schemaSupportsTitles }) => {
    
    // State for editing a single image
    const [editTitle, setEditTitle] = useState('');
    const [editSubtitle, setEditSubtitle] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);

    // State for adding multiple images
    const [groupTitle, setGroupTitle] = useState('');
    const [imageMetas, setImageMetas] = useState<ImageMeta[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset all states
            setImageMetas([]);
            setEditFile(null);
            setGroupTitle('');

            if (image) { // If editing
                setEditTitle(image.title || '');
                setEditSubtitle(image.subtitle || '');
                setEditPreview(image.image_url);
            } else { // If adding
                setEditTitle('');
                setEditSubtitle('');
                setEditPreview(null);
            }
        }
    }, [isOpen, image]);

    useEffect(() => {
        // Cleanup object URLs on unmount
        return () => {
            imageMetas.forEach(meta => URL.revokeObjectURL(meta.previewUrl));
        };
    }, [imageMetas]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        if (image) { // Handle file change for editing
            const file = files[0];
            setEditFile(file);
            setEditPreview(URL.createObjectURL(file as Blob));
        } else { // Handle file change for adding
            const newMetas = files.map(file => ({
                file,
                previewUrl: URL.createObjectURL(file as Blob),
                title: '', // title is now at the group level
                subtitle: '',
            }));
            setImageMetas(newMetas);
        }
    };
    
    const handleMetaChange = (index: number, field: 'title' | 'subtitle', value: string) => {
        setImageMetas(prev => {
            const newMetas = [...prev];
            newMetas[index][field] = value;
            return newMetas;
        });
    };

    const handleSave = () => {
        if (image) { // Saving an edit
             if (schemaSupportsTitles && !editTitle.trim()) {
                return alert('Title is required.');
            }
            onSave({ title: editTitle, subtitle: editSubtitle }, editFile ? [editFile] : []);
        } else { // Saving a new batch
            if (imageMetas.length === 0) {
                return alert('Please select at least one image to upload.');
            }
            if (schemaSupportsTitles && !groupTitle.trim()) {
                return alert('A Group Title is required.');
            }
            onSave({ groupTitle, imageMetas });
        }
    };
    
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-2xl bg-[#001833] border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                    <h2 className="text-xl font-bold text-text p-6 shrink-0">{image ? 'Edit Image Info' : 'Add New Gallery Image(s)'}</h2>
                    
                    <div className="px-6 pb-6 overflow-y-auto">
                        {!image && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text/90 mb-2">Select Images</label>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">upload</span>
                                    Choose Image(s)
                                </button>
                            </div>
                        )}
                        
                        {/* Edit Mode UI */}
                        {image && (
                             <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <img src={editPreview || ''} alt="Preview" className="w-24 h-24 object-cover rounded-md shrink-0" />
                                    <div className="flex-grow">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary">Change Image</button>
                                    </div>
                                </div>
                                {schemaSupportsTitles && (
                                    <>
                                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Image Title (Required)" className="w-full input-style" />
                                        <input value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} placeholder="Image Subtitle (Optional)" className="w-full input-style" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Add Mode UI (List of images) */}
                        {!image && imageMetas.length > 0 && (
                            <div className="space-y-4 border-t border-border pt-4">
                                {schemaSupportsTitles && (
                                    <div>
                                        <label className="block text-sm font-medium text-text/90 mb-2">Group Title (Required)</label>
                                        <input 
                                            value={groupTitle} 
                                            onChange={(e) => setGroupTitle(e.target.value)} 
                                            placeholder="Title for this image group" 
                                            className="w-full input-style text-base"
                                        />
                                    </div>
                                )}
                                {imageMetas.map((meta, index) => (
                                    <div key={index} className="flex items-start gap-4 p-3 bg-surface/50 rounded-lg">
                                        <img src={meta.previewUrl} alt={`preview ${index}`} className="w-20 h-20 object-cover rounded-md shrink-0"/>
                                        <div className="flex-grow space-y-2">
                                            {schemaSupportsTitles && (
                                                <input 
                                                    value={meta.subtitle} 
                                                    onChange={(e) => handleMetaChange(index, 'subtitle', e.target.value)} 
                                                    placeholder="Image Subtitle (Optional)" 
                                                    className="w-full input-style text-sm"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-auto p-6 border-t border-border flex justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white disabled:bg-primary/50">
                            {isSaving ? 'Saving...' : (image ? 'Save Changes' : 'Add Image(s)')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};


// --- Gallery Section ---
const GalleryManager: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [isSavingImage, setIsSavingImage] = useState(false);
    const [schemaSupportsTitles, setSchemaSupportsTitles] = useState(true);


    const fetchGalleryImages = async () => {
        setLoading(true);
        let { data, error } = await supabase
            .from('gallery_images')
            .select('id, image_url, file_path, created_at, title, subtitle, batch_id')
            .order('created_at', { ascending: false });

        if (error && (error.message.includes('column "title" does not exist') || error.message.includes('column "subtitle" does not exist') || error.message.includes('column "batch_id" does not exist'))) {
            console.warn("Admin Panel: Gallery 'title'/'subtitle'/'batch_id' columns not found. Title/subtitle fields will be hidden. Please update the database schema to enable this feature.");
            setSchemaSupportsTitles(false);
            const fallbackResult = await supabase.from('gallery_images').select('id, image_url, file_path, created_at').order('created_at', { ascending: false });
            data = fallbackResult.data;
            error = fallbackResult.error;
        } else {
            setSchemaSupportsTitles(true);
        }

        if (error) {
            console.error("Error fetching gallery images:", error.message);
        } else {
            setImages(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGalleryImages();
    }, []);

    const openImageModal = (image: GalleryImage | null) => {
        setEditingImage(image);
        setIsImageModalOpen(true);
    };

    const handleSaveImage = async (data: any, files?: File[]) => {
        setIsSavingImage(true);
        try {
            if (editingImage) { // Editing an existing image
                const { title, subtitle } = data;
                const file = files?.[0];
                let newImageUrl = editingImage.image_url;
                let newFilePath = editingImage.file_path;
    
                if (file) {
                    if (editingImage.file_path) {
                        await supabase.storage.from('site_assets').remove([editingImage.file_path]);
                    }
                    newFilePath = `gallery/${Date.now()}-${file.name}`;
                    const { error: uploadError } = await supabase.storage.from('site_assets').upload(newFilePath, file);
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(newFilePath);
                    newImageUrl = urlData.publicUrl;
                }
    
                const dataToUpdate: { image_url: string; file_path: string; title?: string; subtitle?: string; } = { image_url: newImageUrl, file_path: newFilePath };
                if (schemaSupportsTitles) {
                    dataToUpdate.title = title;
                    dataToUpdate.subtitle = subtitle;
                }
                const { error } = await supabase.from('gallery_images').update(dataToUpdate).eq('id', editingImage.id);
                if (error) throw error;
    
            } else if (data.groupTitle !== undefined && Array.isArray(data.imageMetas)) { // Adding new image group
                const { groupTitle, imageMetas: metas } = data;
                const batch_id = crypto.randomUUID();
    
                const uploadPromises = metas.map(async (meta) => {
                    const { file, subtitle } = meta;
                    const filePath = `gallery/${Date.now()}-${file.name}`;
                    const { error: uploadError } = await supabase.storage.from('site_assets').upload(filePath, file);
                    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(filePath);
                    
                    const dataToInsert: any = { 
                        image_url: urlData.publicUrl, 
                        file_path: filePath,
                        batch_id
                    };
                    if (schemaSupportsTitles) {
                        dataToInsert.title = groupTitle;
                        dataToInsert.subtitle = subtitle;
                    }
                    const { error: insertError } = await supabase.from('gallery_images').insert(dataToInsert);
                    if (insertError) throw new Error(`DB insert for ${file.name} failed: ${insertError.message}`);
                });
                await Promise.all(uploadPromises);
            }
    
            await fetchGalleryImages();
            setIsImageModalOpen(false);
        } catch (error) {
            alert(`Save failed: ${getErrorMessage(error)}`);
        } finally {
            setIsSavingImage(false);
        }
    };
    
    const requestDelete = (image: GalleryImage) => {
        setImageToDelete(image);
    };

    const handleDelete = async () => {
        if (!imageToDelete) return;
        setIsDeleting(true);
        try {
            if (imageToDelete.file_path) {
                const { error: storageError } = await supabase.storage.from('site_assets').remove([imageToDelete.file_path]);
                if (storageError) throw storageError;
            }

            const { error: dbError } = await supabase.from('gallery_images').delete().eq('id', imageToDelete.id);
            if (dbError) throw dbError;

            await fetchGalleryImages(); // Refresh
        } catch (error) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
        } finally {
            setIsDeleting(false);
            setImageToDelete(null);
        }
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold gradient-text">Events Page Photo Gallery</h2>
                <button 
                    onClick={() => openImageModal(null)}
                    className="px-4 py-2 bg-primary/20 text-primary text-sm font-semibold rounded-lg flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">add_photo_alternate</span> 
                    Add Image(s)
                </button>
            </div>
            {loading ? (
                <p className="text-center text-text/70">Loading gallery...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="aspect-square bg-surface/50 rounded-lg relative group overflow-hidden border border-border">
                             <img src={image.image_url} alt={image.title || 'Gallery image'} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                 <button onClick={() => openImageModal(image)} className="p-2 bg-secondary/80 text-white rounded-full hover:bg-secondary"><span className="material-symbols-outlined">edit</span></button>
                                 <button onClick={() => requestDelete(image)} className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-600"><span className="material-symbols-outlined">delete</span></button>
                             </div>
                        </div>
                    ))}
                </div>
            )}
            <GalleryModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onSave={handleSaveImage}
                image={editingImage}
                isSaving={isSavingImage}
                schemaSupportsTitles={schemaSupportsTitles}
            />
            <ConfirmModal
                isOpen={!!imageToDelete}
                onClose={() => setImageToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Image Deletion"
                message="Are you sure you want to permanently delete this image from the gallery? This cannot be undone."
                isConfirming={isDeleting}
            />
        </div>
    );
};


// --- Alumni Section ---
const AlumniManager: React.FC = () => {
    const [links, setLinks] = useState({
        alumni_facebook_url: '',
        alumni_whatsapp_url: '',
        alumni_discord_url: '',
    });
    const [displayImage, setDisplayImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const settingKeys = ['alumni_display_image', 'alumni_facebook_url', 'alumni_whatsapp_url', 'alumni_discord_url'];

    useEffect(() => {
        const fetchAlumniSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value')
                .in('key', settingKeys);

            if (error) {
                console.error("Error fetching alumni settings:", error.message);
                alert('Could not load alumni settings.');
            } else {
                const settingsMap = data.reduce((acc, { key, value }) => ({...acc, [key]: value }), {} as Record<string, string>);
                setLinks({
                    alumni_facebook_url: settingsMap.alumni_facebook_url || '',
                    alumni_whatsapp_url: settingsMap.alumni_whatsapp_url || '',
                    alumni_discord_url: settingsMap.alumni_discord_url || '',
                });
                setDisplayImage(settingsMap.alumni_display_image || null);
            }
            setLoading(false);
        };
        fetchAlumniSettings();
    }, []);

    const handleImageUpload = async (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setDisplayImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let imageUrl = displayImage;
            // Upload new image if one is selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const filePath = `alumni/display-image-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('site_assets').upload(filePath, imageFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(filePath);
                imageUrl = urlData.publicUrl;
            }

            const settingsToSave = [
                { key: 'alumni_display_image', value: imageUrl },
                { key: 'alumni_facebook_url', value: links.alumni_facebook_url },
                { key: 'alumni_whatsapp_url', value: links.alumni_whatsapp_url },
                { key: 'alumni_discord_url', value: links.alumni_discord_url },
            ];
            
            const { error } = await supabase.from('site_settings').upsert(settingsToSave, { onConflict: 'key' });
            if (error) throw error;
            
            alert('Alumni settings saved successfully!');
            setImageFile(null); // Reset file state after successful save
        } catch (error) {
            alert(`Save failed: ${getErrorMessage(error)}`);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <p className="text-center text-text/70">Loading alumni settings...</p>;

    return (
        <div className="bg-surface p-6 rounded-xl border border-border space-y-6">
            <div>
                <h2 className="text-xl font-bold gradient-text mb-4">Alumni Section Content</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-text/90 mb-2">Display Image (512x512 recommended)</label>
                        <div className="aspect-square bg-surface/50 rounded-lg border-2 border-dashed border-border flex items-center justify-center relative group">
                            {displayImage ? (
                                <img src={displayImage} alt="Alumni display preview" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-text/40">groups</span>
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <span className="material-symbols-outlined text-white text-4xl">upload</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}/>
                            </label>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                             <label className="block text-sm font-medium text-text/90 mb-1">Facebook Group URL</label>
                             <input value={links.alumni_facebook_url} onChange={(e) => setLinks({...links, alumni_facebook_url: e.target.value})} placeholder="https://facebook.com/groups/..." className="w-full input-style"/>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-text/90 mb-1">WhatsApp Group URL</label>
                             <input value={links.alumni_whatsapp_url} onChange={(e) => setLinks({...links, alumni_whatsapp_url: e.target.value})} placeholder="https://chat.whatsapp.com/..." className="w-full input-style"/>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-text/90 mb-1">Discord Server URL</label>
                             <input value={links.alumni_discord_url} onChange={(e) => setLinks({...links, alumni_discord_url: e.target.value})} placeholder="https://discord.gg/..." className="w-full input-style"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Alumni Settings'}
                </button>
            </div>
        </div>
    );
};


const AdminManageEvents: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'events' | 'gallery' | 'alumni'>('events');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    
    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
        if (error) {
            // FIX: Log the specific error message instead of the object.
            console.error("Error fetching events:", error.message);
            // FIX: Provide a more helpful alert message.
            alert(`Could not fetch events: ${error.message}`);
        } else {
            setEvents(data as Event[] || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'events') {
            fetchEvents();
        }
    }, [activeTab]);

    const handleSave = async (formData, imageFile: File | null) => {
        setIsSaving(true);
        try {
            let imageUrl = currentEvent?.imageUrl;
            let filePath = currentEvent?.file_path;

            if (imageFile) {
                if (filePath) {
                    await supabase.storage.from('events').remove([filePath]);
                }

                const fileExt = imageFile.name.split('.').pop();
                const newFilePath = `events/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('events').upload(newFilePath, imageFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('events').getPublicUrl(newFilePath);
                imageUrl = urlData.publicUrl;
                filePath = newFilePath;
            }

            const dataToSave = {
                ...formData,
                imageUrl,
                file_path: filePath,
            };

            if (currentEvent) {
                const { error } = await supabase.from('events').update(dataToSave).eq('id', currentEvent.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('events').insert({ ...dataToSave, status: 'draft' });
                if (error) throw error;
            }
            fetchEvents();
            closeModal();
        } catch (error: any) {
            console.error("Error saving event:", error.message);
            const detailedMessage = error.message ? error.message : JSON.stringify(error);
            alert(`Failed to save event. This is likely due to a permission issue in your Supabase project. Please check the browser console for more details.\n\nError: ${detailedMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (event: Event) => {
        setEventToDelete(event);
    };

    const handleDelete = async () => {
        if (!eventToDelete) return;
        
        setDeletingId(eventToDelete.id);
        try {
            if (eventToDelete.file_path) {
                await supabase.storage.from('events').remove([eventToDelete.file_path]);
            }

            await supabase.from('events').delete().eq('id', eventToDelete.id);
            
            await fetchEvents();
        } catch (error: any) {
            alert(`Delete failed: ${getErrorMessage(error)}`);
        } finally {
            setDeletingId(null);
            setEventToDelete(null);
        }
    };

    const handleToggleStatus = async (event: Event) => {
        const newStatus = event.status === 'published' ? 'draft' : 'published';
        try {
            const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', event.id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const openModal = (event: Event | null = null) => {
        setCurrentEvent(event);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentEvent(null);
        setIsModalOpen(false);
    };
    
    const TABS = ['Events', 'Gallery', 'Alumni'];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Manage Events</h1>
                <p className="text-text/70 mt-1">Create, publish, and manage all department events and the page gallery.</p>
            </div>

            <div className="bg-surface/30 border border-border rounded-xl">
                 <div className="border-b border-border flex">
                    {TABS.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab.toLowerCase() as 'events' | 'gallery' | 'alumni')}
                            className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.toLowerCase() ? 'text-primary' : 'text-text/70 hover:text-text'}`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="event-tab-underline" />}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'events' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors">
                                            <span className="material-symbols-outlined">add_circle</span>
                                            Create New Event
                                        </button>
                                    </div>
                                    {loading ? (
                                        <p className="text-center text-text/70">Loading events...</p>
                                    ) : events.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {events.map(event => {
                                                const isDeleting = deletingId === event.id;
                                                return (
                                                <div key={event.id} className="bg-surface border border-border rounded-xl shadow-lg flex flex-col h-full hover:-translate-y-1 transition-transform">
                                                    <img src={event.imageUrl} alt={event.title} className="aspect-video w-full object-cover rounded-t-xl" />
                                                    <div className="p-5 flex-grow flex flex-col">
                                                        <h3 className="text-lg font-bold text-text">{event.title}</h3>
                                                        <p className="text-sm text-secondary font-medium my-2">
                                                            {event.date ? new Date(event.date).toLocaleString() : 'No date'}
                                                        </p>
                                                        <p className="text-sm text-text/80 leading-relaxed line-clamp-3 flex-grow">{event.description}</p>
                                                    </div>
                                                    <div className="border-t border-border p-4 flex justify-between items-center bg-black/10">
                                                        <div className="flex items-center gap-3">
                                                            <StatusToggle enabled={event.status === 'published'} onChange={() => handleToggleStatus(event)} />
                                                            <span className={`text-sm font-medium ${event.status === 'published' ? 'text-green-400' : 'text-text/60'}`}>{event.status === 'published' ? 'Published' : 'Draft'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => openModal(event)} className="p-2 rounded-full hover:bg-surface text-text/70 hover:text-secondary"><span className="material-symbols-outlined">edit</span></button>
                                                            <button 
                                                                onClick={() => requestDelete(event)} 
                                                                disabled={isDeleting}
                                                                className="p-2 rounded-full hover:bg-surface text-text/70 hover:text-red-400 w-9 h-9 flex items-center justify-center disabled:opacity-50"
                                                            >
                                                                {isDeleting
                                                                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                                    : <span className="material-symbols-outlined">delete</span>
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-surface rounded-xl border border-border">
                                            <span className="material-symbols-outlined text-6xl text-text/30">event_busy</span>
                                            <h3 className="mt-4 text-xl font-semibold text-text">No Events Created</h3>
                                            <p className="mt-2 text-text/60">Click 'Create New Event' to get started.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'gallery' && <GalleryManager />}
                            {activeTab === 'alumni' && <AlumniManager />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            
            <EventModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} event={currentEvent} isSaving={isSaving} />

            <ConfirmModal
                isOpen={!!eventToDelete}
                onClose={() => setEventToDelete(null)}
                onConfirm={handleDelete}
                title="Confirm Event Deletion"
                message={`Are you sure you want to permanently delete the event "${eventToDelete?.title}"? This will also delete the associated image and cannot be undone.`}
                isConfirming={deletingId === eventToDelete?.id}
            />
        </div>
    );
};

export default AdminManageEvents;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';

// --- Types ---
interface Facility {
    key?: string; // For predefined
    icon: string;
    title: string;
    description: string;
}

interface Achievement {
    icon: 'emoji_events';
    title: string;
    description: string;
    details?: string;
}

// --- Image Cropper Logic ---

// Helper to draw cropped image on canvas
async function canvasPreview(image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
        image,
        0, 0,
        image.naturalWidth, image.naturalHeight,
        0, 0,
        image.naturalWidth, image.naturalHeight
    );
    ctx.restore();
}

const ImageCropModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onCropComplete: (file: File) => void;
    aspect?: number;
}> = ({ isOpen, onClose, imageSrc, onCropComplete, aspect = 1 }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [zoom, setZoom] = useState(1);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
            width, height
        );
        setCrop(newCrop);
    }

    async function handleApplyCrop() {
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        if (!image || !canvas || !completedCrop) {
            return;
        }

        await canvasPreview(image, canvas, completedCrop);
        canvas.toBlob((blob) => {
            if (blob) {
                const croppedFile = new File([blob], 'cropped-image.png', { type: 'image/png' });
                onCropComplete(croppedFile);
            }
        }, 'image/png');
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div className="relative w-full max-w-2xl bg-[#001833] border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]" initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}>
                    <div className="p-4 border-b border-border text-center">
                        <h2 className="text-xl font-bold text-text">Adjust Image</h2>
                        <p className="text-sm text-text/70">Crop and zoom to fit the banner.</p>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow flex items-center justify-center bg-black/20">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            minHeight={100}
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imageSrc}
                                style={{ transform: `scale(${zoom})` }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                            <span className="material-symbols-outlined text-text/80">zoom_out</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.01}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-surface/80 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="material-symbols-outlined text-text/80">zoom_in</span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80 text-text/90">Cancel</button>
                            <button onClick={handleApplyCrop} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white">Apply Crop</button>
                        </div>
                    </div>
                </motion.div>
                {/* Hidden canvas for processing */}
                <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
            </div>
        </AnimatePresence>
    );
};

// --- Image Uploader Component ---
const ImageUploader: React.FC<{
    label: string;
    currentImageUrl: string | null;
    onImageSelect: (file: File) => void;
    aspect?: number;
    className?: string;
}> = ({ label, currentImageUrl, onImageSelect, aspect, className = "" }) => {
    const [preview, setPreview] = useState<string | null>(currentImageUrl);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageSrcForCrop, setImageSrcForCrop] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentImageUrl && !currentImageUrl.startsWith('blob:')) {
            setPreview(currentImageUrl);
        }
    }, [currentImageUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrcForCrop(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = "";
    };

    const handleCropComplete = (croppedFile: File) => {
        const newPreviewUrl = URL.createObjectURL(croppedFile);
        setPreview(newPreviewUrl);
        onImageSelect(croppedFile);
        setIsCropModalOpen(false);
    };

    return (
        <div className={className}>
            <ImageCropModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                imageSrc={imageSrcForCrop}
                onCropComplete={handleCropComplete}
                aspect={aspect}
            />
            <label className="block text-sm font-medium text-text/90 mb-2">{label}</label>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50 border border-border">
                <div className="w-48 h-24 bg-surface rounded-lg flex items-center justify-center shrink-0">
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md p-2" />
                    ) : (
                        <span className="material-symbols-outlined text-4xl text-text/50">image_not_supported</span>
                    )}
                </div>
                <div className="flex-grow">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">upload</span>
                        Change Image
                    </button>
                    <p className="text-xs text-text/60 mt-2">
                        Upload a new image to replace the current one. Changes are applied on save.
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- Constants ---
const SETTING_KEYS = [
    'institute_name', 'department_name', 'address', 'contact_email', 'contact_phone',
    'facebook_url', 'twitter_url', 'github_url', 'site_logo_url',
    'hod_day_message', 'hod_morning_message',
    'vision_statement', 'mission_statement', 'about_department_text',
    'department_facilities', 'department_achievements',
    'hero_home_image_url', 'hero_home_title', 'hero_home_subtitle',
    'welcome_home_title', 'welcome_home_subtitle',
    'hero_about_image_url', 'hero_about_title', 'hero_about_subtitle',
    'hero_academic_image_url', 'hero_academic_title', 'hero_academic_subtitle',
    'hero_events_image_url', 'hero_events_title', 'hero_events_subtitle'
];

const PREDEFINED_FACILITIES: Facility[] = [
    { key: 'computer_labs', icon: 'laptop_chromebook', title: 'Computer Labs', description: 'State-of-the-art labs with the latest hardware and software.' },
    { key: 'networking_lab', icon: 'router', title: 'Networking Lab', description: 'Advanced equipment for networking and cybersecurity training.' },
    { key: 'library', icon: 'local_library', title: 'Department Library', description: 'A vast collection of books, journals, and digital resources.' },
    { key: 'iot_lab', icon: 'hub', title: 'IoT Lab', description: 'Explore the Internet of Things with modern sensors and devices.' },
    { key: 'mpmc_lab', icon: 'memory', title: 'MPMC Lab', description: 'Microprocessor & Microcontroller programming and interfacing.' },
    { key: 'hardware_lab', icon: 'hardware', title: 'Hardware Lab', description: 'Hands-on experience with computer hardware and peripherals.' },
    { key: 'wifi_zone', icon: 'wifi', title: 'Wi-Fi Zone', description: 'Campus-wide high-speed wireless internet connectivity.' },
    { key: 'binary_shop', icon: 'store', title: 'Binary Shop', description: 'A student-run shop for tech essentials and repairs.' },
];

// --- Icon Data & Component ---
const ALL_ICONS = [
    'analytics', 'api', 'app_shortcut', 'apps', 'architecture', 'auto_awesome',
    'backup', 'bar_chart', 'biotech', 'bolt', 'book', 'browse', 'brush', 'bug_report',
    'build', 'business_center', 'cable', 'calculate', 'chip', 'circuit_board', 'construction',
    'cloud', 'code', 'code_blocks', 'commit', 'computer', 'connected_tv', 'construction', 'cpu', 'css',
    'data_array', 'data_object', 'database', 'deployed_code', 'design_services', 'desktop_windows',
    'developer_board', 'developer_mode', 'devices', 'dns', 'draw', 'edit_note',
    'engineering', 'fact_check', 'factory', 'functions', 'gesture', 'grid_view', 'group_work',
    'hardware', 'html', 'http', 'hub', 'important_devices', 'integration_instructions',
    'javascript', 'lan', 'laptop_mac', 'layers', 'lightbulb', 'local_library',
    'memory', 'model_training', 'monitoring', 'network_check', 'neurology', 'palette',
    'power', 'psychology', 'public', 'query_stats', 'quiz', 'robotics', 'router',
    'school', 'science', 'sdk', 'security', 'settings_ethernet', 'shapes', 'share',
    'smart_toy', 'smartphone', 'source_environment', 'square_foot', 'storage', 'store',
    'tablet_mac', 'terminal', 'wifi', 'web', 'web_asset', 'widgets', 'work'
];

const IconPickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (iconName: string) => void;
}> = ({ isOpen, onClose, onSelectIcon }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIcons = useMemo(() =>
        ALL_ICONS.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase())),
        [searchTerm]
    );

    if (!isOpen) return null;

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

const formatKeyToLabel = (key: string): string => key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

// --- Main Component ---
const AdminSiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stagedFiles, setStagedFiles] = useState<Record<string, File>>({});

    // Form states for new entries
    const [newFacility, setNewFacility] = useState({ title: '', description: '', icon: 'home_work' });
    const [newAchievement, setNewAchievement] = useState({ title: '', description: '', details: '' });

    // UI states
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    
    // Consistent styling for all text inputs and textareas
    const inputStyle = "w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text placeholder:text-text/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200";


    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase.from('site_settings').select('key, value');

            if (fetchError) {
                const errorMessage = `Could not load site settings. Details: ${fetchError.message}`;
                console.error("Error fetching site settings:", fetchError.message);
                setError(errorMessage);
            } else {
                const settingsMap = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>);
                
                const initialSettings = SETTING_KEYS.reduce((acc, key) => ({ ...acc, [key]: settingsMap[key] || '' }), {} as Record<string, string>);
                setSettings(initialSettings);

                try {
                    setFacilities(initialSettings.department_facilities ? JSON.parse(initialSettings.department_facilities) : []);
                } catch { setFacilities([]); }
                
                try {
                    setAchievements(initialSettings.department_achievements ? JSON.parse(initialSettings.department_achievements) : []);
                } catch { setAchievements([]); }
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleImageFileSelect = (key: string, file: File) => {
        setStagedFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updatedSettings = { ...settings };

            // Process staged file uploads
            for (const key of Object.keys(stagedFiles)) {
                const file = stagedFiles[key];
                if (file) {
                    const filePath = `site-assets/${key}-${Date.now()}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('site_assets')
                        .upload(filePath, file, { upsert: true });

                    if (uploadError) {
                        throw new Error(`Image upload failed for ${key}: ${uploadError.message}`);
                    }
                    
                    const { data: urlData } = supabase.storage
                        .from('site_assets')
                        .getPublicUrl(filePath);

                    updatedSettings[key] = urlData.publicUrl;
                }
            }
            
            updatedSettings.department_facilities = JSON.stringify(facilities, null, 2);
            updatedSettings.department_achievements = JSON.stringify(achievements, null, 2);
            
            const dataToUpsert = Object.entries(updatedSettings).map(([key, value]) => ({ key, value }));

            const { error } = await supabase.from('site_settings').upsert(dataToUpsert, { onConflict: 'key' });
            if (error) throw error;
            
            setSaveSuccess(true);
            setStagedFiles({}); // Clear staged files after successful save
            setSettings(updatedSettings); // Update local state with new URLs
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
             console.error("Failed to save settings:", error.message);
             if (error.message && error.message.includes('Bucket not found')) {
                alert("Configuration Error: The 'site_assets' storage bucket was not found. Please go to your Supabase project dashboard, navigate to Storage, and create a new public bucket named 'site_assets'.");
             } else {
                alert(`Failed to save settings: ${error.message}`);
             }
        }
        setIsSaving(false);
    };

    // --- Facilities Management ---
    const handlePredefinedFacilityToggle = (facility: Facility, isChecked: boolean) => {
        if (isChecked) {
            setFacilities(prev => [...prev, facility]);
        } else {
            setFacilities(prev => prev.filter(f => f.key !== facility.key));
        }
    };
    const addCustomFacility = () => {
        if (!newFacility.title.trim() || !newFacility.icon.trim()) return alert("Title and Icon are required for a custom facility.");
        setFacilities(prev => [...prev, { ...newFacility }]);
        setNewFacility({ title: '', description: '', icon: 'home_work' });
    };
    const removeCustomFacility = (facilityToRemove: Facility) => {
        setFacilities(prev => prev.filter(f => f.title !== facilityToRemove.title));
    };

    // --- Achievements Management ---
    const addAchievement = () => {
        if (!newAchievement.title.trim() || !newAchievement.description.trim()) return alert("Title and Description are required.");
        setAchievements(prev => [...prev, { ...newAchievement, icon: 'emoji_events' }]);
        setNewAchievement({ title: '', description: '', details: '' });
    };
    const removeAchievement = (index: number) => {
        setAchievements(prev => prev.filter((_, i) => i !== index));
    };

    // --- Render Functions ---
    const renderInput = (key: string, type: 'input' | 'textarea' = 'input') => (
        <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-text/90 mb-1">{formatKeyToLabel(key)}</label>
            {type === 'textarea' ? <textarea id={key} name={key} value={settings[key] || ''} onChange={handleChange} rows={5} className={inputStyle}/> : <input type="text" id={key} name={key} value={settings[key] || ''} onChange={handleChange} className={inputStyle}/>}
        </div>
    );
    
    if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>;
    if (error) return (
         <div><h1 className="text-3xl font-bold text-red-400">Configuration Error</h1><div className="mt-6 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300"><p className="font-mono text-sm bg-black/20 p-2 rounded-md mt-2">{error}</p></div></div>
    );

    return (
        <div>
             <IconPickerModal
                isOpen={isIconPickerOpen}
                onClose={() => setIsIconPickerOpen(false)}
                onSelectIcon={(iconName) => {
                    setNewFacility(prev => ({ ...prev, icon: iconName }));
                    setIsIconPickerOpen(false);
                }}
            />
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#001833] py-4 z-10">
                <div><h1 className="text-3xl font-bold">Site Settings</h1><p className="text-text/70 mt-1">Manage global website information from one place.</p></div>
                 <div className="flex items-center gap-4">
                    {saveSuccess && <p className="text-green-400 text-sm">Settings saved!</p>}
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white disabled:bg-primary/50">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </div>
            
            <div className="space-y-8">
                <div className="bg-surface p-6 rounded-xl border border-border"><h2 className="text-xl font-bold gradient-text mb-4">General & Contact</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{renderInput('institute_name')}{renderInput('department_name')}<ImageUploader label="Site Logo" className="md:col-span-2" currentImageUrl={settings['site_logo_url']} onImageSelect={(file) => handleImageFileSelect('site_logo_url', file)} aspect={1 / 1} />{renderInput('address', 'textarea')}{renderInput('contact_email')}{renderInput('contact_phone')}</div></div>
                <div className="bg-surface p-6 rounded-xl border border-border"><h2 className="text-xl font-bold gradient-text mb-4">Social Links</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{renderInput('facebook_url')}{renderInput('twitter_url')}{renderInput('github_url')}</div></div>
                
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h2 className="text-xl font-bold gradient-text mb-4">Hero Section Content</h2>
                    <p className="text-sm text-text/70 mb-6 -mt-2">Manage the main banner image and text for key pages.</p>
                    
                    <div className="border-t border-border pt-4">
                        <h3 className="text-lg font-semibold text-text/90 mb-4">Home Page</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <ImageUploader label="Hero Image" currentImageUrl={settings['hero_home_image_url']} onImageSelect={(file) => handleImageFileSelect('hero_home_image_url', file)} aspect={16 / 9} className="md:col-span-2" />
                            {renderInput('hero_home_title')}
                            {renderInput('hero_home_subtitle', 'textarea')}
                            <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                                <h4 className="text-md font-semibold text-text/90 mb-4">Welcome Section</h4>
                                {renderInput('welcome_home_title')}
                                {renderInput('welcome_home_subtitle', 'textarea')}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-6">
                        <h3 className="text-lg font-semibold text-text/90 mb-4">About Page</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <ImageUploader label="Hero Image" currentImageUrl={settings['hero_about_image_url']} onImageSelect={(file) => handleImageFileSelect('hero_about_image_url', file)} aspect={16 / 9} className="md:col-span-2" />
                            {renderInput('hero_about_title')}
                            {renderInput('hero_about_subtitle', 'textarea')}
                        </div>
                    </div>
                    
                    <div className="border-t border-border pt-4 mt-6">
                        <h3 className="text-lg font-semibold text-text/90 mb-4">Academic Page</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <ImageUploader label="Hero Image" currentImageUrl={settings['hero_academic_image_url']} onImageSelect={(file) => handleImageFileSelect('hero_academic_image_url', file)} aspect={16 / 9} className="md:col-span-2" />
                            {renderInput('hero_academic_title')}
                            {renderInput('hero_academic_subtitle', 'textarea')}
                        </div>
                    </div>
                    
                    <div className="border-t border-border pt-4 mt-6">
                        <h3 className="text-lg font-semibold text-text/90 mb-4">Events Page</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <ImageUploader label="Hero Image" currentImageUrl={settings['hero_events_image_url']} onImageSelect={(file) => handleImageFileSelect('hero_events_image_url', file)} aspect={16 / 9} className="md:col-span-2" />
                            {renderInput('hero_events_title')}
                            {renderInput('hero_events_subtitle', 'textarea')}
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border"><h2 className="text-xl font-bold gradient-text mb-4">Homepage HOD Messages</h2><p className="text-sm text-text/70 mb-4 -mt-2">HOD details are managed in the <a href="#/admin/teachers" className="text-secondary underline">Teachers</a> section.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderInput('hod_morning_message', 'textarea')}{renderInput('hod_day_message', 'textarea')}</div></div>
                <div className="bg-surface p-6 rounded-xl border border-border"><h2 className="text-xl font-bold gradient-text mb-4">About Page: Vision & Mission</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderInput('vision_statement', 'textarea')}{renderInput('mission_statement', 'textarea')}</div></div>
                <div className="bg-surface p-6 rounded-xl border border-border"><h2 className="text-xl font-bold gradient-text mb-4">About Page: Department Description</h2>{renderInput('about_department_text', 'textarea')}</div>

                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h2 className="text-xl font-bold gradient-text mb-4">About Page: Department Facilities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {PREDEFINED_FACILITIES.map(facility => (
                            <label key={facility.key} className="flex items-center gap-2 p-3 bg-surface/50 border border-border rounded-lg cursor-pointer hover:bg-primary/10">
                                <input type="checkbox" className="h-4 w-4 rounded bg-surface border-border text-primary focus:ring-primary" checked={facilities.some(f => f.key === facility.key)} onChange={e => handlePredefinedFacilityToggle(facility, e.target.checked)} />
                                <span className="text-sm font-medium text-text/90">{facility.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border-t border-border pt-4">
                        <h3 className="text-lg font-semibold text-text/90 mb-2">Custom Facilities</h3>
                        <div className="space-y-2 mb-4">
                            {facilities.filter(f => !f.key).map((facility, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-surface/50 rounded-md">
                                    <span className="material-symbols-outlined text-secondary">{facility.icon}</span>
                                    <p className="flex-grow text-sm font-medium">{facility.title}</p>
                                    <button onClick={() => removeCustomFacility(facility)} className="p-1 text-red-400 hover:bg-red-500/20 rounded-full"><span className="material-symbols-outlined text-base">delete</span></button>
                                </div>
                            ))}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-surface/50 rounded-lg">
                            <input value={newFacility.title} onChange={e => setNewFacility(p => ({ ...p, title: e.target.value }))} placeholder="Title" className={inputStyle} />
                            <input value={newFacility.description} onChange={e => setNewFacility(p => ({ ...p, description: e.target.value }))} placeholder="Description" className={inputStyle} />
                            <button
                                type="button"
                                onClick={() => setIsIconPickerOpen(true)}
                                className="flex items-center gap-3 p-2 rounded-lg border border-border bg-surface text-left hover:border-primary h-full"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface/50 text-secondary text-2xl shrink-0">
                                    <span className="material-symbols-outlined">{newFacility.icon}</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-text font-semibold">{newFacility.icon}</p>
                                    <p className="text-xs text-text/60">Click to change</p>
                                </div>
                            </button>
                            <button onClick={addCustomFacility} className="md:col-span-3 mt-2 px-4 py-2 text-sm bg-primary/20 text-primary rounded-lg hover:bg-primary/30">Add Custom Facility</button>
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h2 className="text-xl font-bold gradient-text mb-4">About Page: Department Achievements</h2>
                    <div className="space-y-3 mb-4">
                        {achievements.map((ach, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg">
                                <span className="material-symbols-outlined text-accent">emoji_events</span>
                                <div className="flex-grow">
                                    <p className="font-semibold text-text/90">{ach.title}</p>
                                    <p className="text-sm text-text/70">{ach.description}</p>
                                </div>
                                <button onClick={() => removeAchievement(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded-full"><span className="material-symbols-outlined text-base">delete</span></button>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-surface/50 rounded-lg">
                        <input value={newAchievement.title} onChange={e => setNewAchievement(p => ({ ...p, title: e.target.value }))} placeholder="Achievement Title" className={inputStyle} />
                        <input value={newAchievement.description} onChange={e => setNewAchievement(p => ({ ...p, description: e.target.value }))} placeholder="Description / Award" className={inputStyle} />
                        <input value={newAchievement.details} onChange={e => setNewAchievement(p => ({ ...p, details: e.target.value }))} placeholder="Details (Optional)" className={inputStyle} />
                        <button onClick={addAchievement} className="md:col-span-3 mt-2 px-4 py-2 text-sm bg-primary/20 text-primary rounded-lg hover:bg-primary/30">Add Achievement</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSiteSettings;
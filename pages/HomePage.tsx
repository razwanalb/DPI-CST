import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, Variants } from 'framer-motion';

// --- Particle Animation Component ---
const Particles = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        const particleCount = 50;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.01;
            }
            draw() {
                if(ctx) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if(ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.update();
                    p.draw();
                    if (p.size <= 0.1) {
                        particles[i] = new Particle();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas();
        init();
        animate();

        window.addEventListener('resize', resizeCanvas);
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };

    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-10" />;
};


// --- Interfaces & Data ---
interface Notice {
    id: string;
    title: string;
    createdAt: string;
    content: string;
    category: 'Academic' | 'Event' | 'General';
}

interface Event {
    id: string;
    title: string;
    date: string;
    imageUrl: string;
}

interface HeadOfDepartment {
    name: string;
    title: string;
    imageUrl: string;
    message: string;
}

interface AcademicProgram {
    id: string;
    title: string;
    description: string;
    icon: string;
}

// --- Animation Variants ---
const sectionVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// --- Skeleton Loader Component ---
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-surface/50 rounded ${className}`}></div>
);

// --- Main Component ---
const HomePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [programs, setPrograms] = useState<AcademicProgram[]>([]);
    const [headsOfDepartment, setHeadsOfDepartment] = useState<HeadOfDepartment[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [loadingHOD, setLoadingHOD] = useState(true);

    const [siteInfo, setSiteInfo] = useState({
        departmentName: 'Computer Department',
        instituteName: 'Dinajpur Polytechnic Institute'
    });

    const [heroImageLoaded, setHeroImageLoaded] = useState(false);
    const [heroContent, setHeroContent] = useState({
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
        title: 'Innovate. Create. Lead.',
        subtitle: 'The Future of Technology Starts Here. Join us to shape the world of tomorrow.',
    });

    // Low-res version for blur-up effect
    const heroPlaceholderUrl = useMemo(() => {
        if (heroContent.imageUrl.includes('unsplash.com')) {
            try {
                const url = new URL(heroContent.imageUrl);
                url.searchParams.set('w', '50');
                url.searchParams.set('q', '10');
                url.searchParams.set('blur', '10');
                return url.toString();
            } catch (e) {
                return heroContent.imageUrl;
            }
        }
        return '';
    }, [heroContent.imageUrl]);

    const [welcomeContent, setWelcomeContent] = useState({
        title: 'Welcome to the Computer Department',
        subtitle: 'The Computer Department at Dinajpur Polytechnic Institute has a rich history of academic excellence. Established in 1994, we are at the forefront of providing quality technical education, equipping students with the skills to excel in the ever-evolving field of technology.',
    });


    useEffect(() => {
        const fetchHomePageData = async () => {
            // Fetch Notices
            supabase.from('notices').select('*').eq('status', 'published').order('createdAt', { ascending: false }).limit(5)
                .then(({ data, error }) => {
                    if (error) console.error("Error fetching notices:", error.message);
                    else setNotices(data as Notice[]);
                });

            // Fetch Events
            supabase.from('events').select('*').eq('status', 'published').order('date', { ascending: false }).limit(4)
                .then(({ data, error }) => {
                    if (error) console.error("Error fetching events:", error.message);
                    else setEvents(data as Event[]);
                });

            // Fetch Academic Programs
            setLoadingPrograms(true);
            supabase.from('academic_programs').select('id, title, description, icon').order('created_at', { ascending: true })
                .then(({ data, error }) => {
                    if (error) console.error("Error fetching academic programs:", error.message);
                    else setPrograms(data as AcademicProgram[]);
                    setLoadingPrograms(false);
                });
            
            // Fetch Heads of Department Data (from two tables)
            setLoadingHOD(true);
            Promise.all([
                supabase.from('faculty').select('name, title, imageUrl').in('title', ['Head of Department (Day)', 'Head of Department (Morning)']),
                supabase.from('site_settings').select('key, value').in('key', ['hod_day_message', 'hod_morning_message'])
            ]).then(([{ data: facultyData, error: facultyError }, { data: settingsData, error: settingsError }]) => {
                if (facultyError) console.error("Error fetching HOD faculty:", facultyError.message);
                if (settingsError) console.error("Error fetching HOD messages:", settingsError.message);

                const dayHOD = facultyData?.find(f => f.title === 'Head of Department (Day)');
                const morningHOD = facultyData?.find(f => f.title === 'Head of Department (Morning)');
                
                const messages = settingsData?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>) || {};

                const hods = [
                    {
                        name: dayHOD?.name || 'Dr. John Doe',
                        title: dayHOD?.title || 'Head of Department (Day)',
                        imageUrl: dayHOD?.imageUrl || 'https://i.imgur.com/8gEb1Xn.jpg',
                        message: messages.hod_day_message || '"Welcome to the Day Shift. We are committed to providing a dynamic and supportive learning environment to prepare our students for successful careers in tech."'
                    },
                    {
                        name: morningHOD?.name || 'Dr. Alice Johnson',
                        title: morningHOD?.title || 'Head of Department (Morning)',
                        imageUrl: morningHOD?.imageUrl || 'https://i.imgur.com/yjmrHfi.jpg',
                        message: messages.hod_morning_message || '"Welcome to the Morning Shift! We are dedicated to fostering a strong academic foundation and inspiring innovation from day one."'
                    }
                ];
                setHeadsOfDepartment(hods);
            }).finally(() => setLoadingHOD(false));

             // Fetch Hero and Welcome content
            const settingsKeys = ['hero_home_image_url', 'hero_home_title', 'hero_home_subtitle', 'welcome_home_title', 'welcome_home_subtitle', 'department_name', 'institute_name'];
            supabase.from('site_settings').select('key, value').in('key', settingsKeys)
                .then(({ data, error }) => {
                    if (!error && data) {
                        const settingsMap = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>);
                        setHeroContent(prev => ({
                            imageUrl: (settingsMap.hero_home_image_url || '').trim() || prev.imageUrl,
                            title: settingsMap.hero_home_title || prev.title,
                            subtitle: settingsMap.hero_home_subtitle || prev.subtitle,
                        }));
                        setSiteInfo(prev => ({
                            departmentName: settingsMap.department_name || prev.departmentName,
                            instituteName: settingsMap.institute_name || prev.instituteName,
                        }));
                        setWelcomeContent(prev => ({
                            title: settingsMap.welcome_home_title || prev.title,
                            subtitle: settingsMap.welcome_home_subtitle || prev.subtitle,
                        }));
                    }
                });
        };

        fetchHomePageData();
    }, []);

    const getNoticeIcon = (category: Notice['category']) => {
        switch (category) {
            case 'Academic': return 'school';
            case 'Event': return 'event';
            case 'General': return 'campaign';
            default: return 'article';
        }
    };

    return (
        <>
            {/* Hero Section */}
            <div className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#001833]">
                {/* Blur-up Placeholder */}
                {heroPlaceholderUrl && (
                    <div 
                        className={`absolute inset-0 z-0 bg-cover bg-center blur-xl scale-110 transition-opacity duration-1000 ${heroImageLoaded ? 'opacity-0' : 'opacity-100'}`}
                        style={{ backgroundImage: `url("${heroPlaceholderUrl}")` }}
                    />
                )}
                
                {/* Main Hero Image */}
                <img 
                    src={heroContent.imageUrl}
                    alt="Hero Background"
                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setHeroImageLoaded(true)}
                    // @ts-ignore - fetchpriority is a valid attribute in modern browsers
                    fetchpriority="high"
                />
                
                <Particles />
                <div className="absolute inset-0 bg-black/60 z-20"></div>
                <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white z-30">
                    <motion.h1 
                        className="text-5xl font-black leading-tight tracking-tight md:text-7xl"
                        style={{textShadow: '0 4px 12px rgba(0,0,0,0.6)'}}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                    >
                        {siteInfo.departmentName}
                    </motion.h1>
                    <motion.h2 
                        className="text-4xl font-bold leading-tight tracking-tight md:text-6xl text-white/90 mt-2"
                        style={{textShadow: '0 4px 12px rgba(0,0,0,0.6)'}}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                    >
                        {siteInfo.instituteName}
                    </motion.h2>
                    <motion.p 
                        className="mt-6 max-w-3xl text-lg font-light md:text-xl"
                        style={{textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
                    >
                        {heroContent.subtitle}
                    </motion.p>
                </div>
            </div>
            
            {/* About Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h2 
                        className="text-3xl font-bold tracking-tight text-text mb-4"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5 }}
                    >
                        {welcomeContent.title}
                    </motion.h2>
                    <motion.p 
                        className="max-w-3xl mx-auto text-text/80 mb-8"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {welcomeContent.subtitle}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Link 
                            to="/about" className="inline-flex min-w-[140px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-primary to-secondary px-6 py-3 text-base font-semibold text-white transition-transform hover:scale-105 shadow-lg shadow-primary/20"
                        >
                            Learn More About Us
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Academic Highlights Section */}
            <section className="py-24 bg-gradient-to-b from-surface/50 to-transparent">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                         <h2 className="text-4xl font-bold tracking-tight gradient-text">Our Academic Programs</h2>
                         <p className="mt-2 text-text/80 max-w-2xl mx-auto">We offer a comprehensive diploma program covering key areas of computer technology.</p>
                    </div>
                    {loadingPrograms ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="p-6 bg-surface border border-border rounded-xl h-64 flex flex-col items-center">
                                    <Skeleton className="h-16 w-16 rounded-full mb-4" />
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                        >
                            {programs.length > 0 ? programs.map(item => (
                                <motion.div variants={itemVariants} key={item.id} className="flex">
                                    <div className="group text-center p-6 bg-surface border border-border rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 h-full w-full flex flex-col">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                                            <span className="material-symbols-outlined text-4xl">{item.icon}</span>
                                        </div>
                                        <div className="mt-4 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-text line-clamp-2 flex-grow">{item.title}</h3>
                                            <p className="mt-2 text-sm text-text/70 line-clamp-3">{item.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <p className="col-span-full text-center text-text/70">No academic programs have been added yet.</p>
                            )}
                        </motion.div>
                    )}
                    <div className="text-center mt-12">
                         <Link to="/academic" className="inline-flex min-w-[140px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-secondary text-text px-6 py-3 text-base font-semibold transition-all hover:bg-secondary hover:text-white hover:shadow-lg hover:shadow-secondary/30">
                            Explore Academic Resources
                        </Link>
                    </div>
                </div>
            </section>
            
            {/* Heads of Department Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center mb-12">
                         <h2 className="text-4xl font-bold tracking-tight text-text">Heads of Departments</h2>
                         <p className="mt-2 text-text/80 max-w-2xl mx-auto">Meet the dedicated leaders guiding our department's vision and success.</p>
                    </div>
                    {loadingHOD ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {[1, 2].map(i => (
                                <div key={i} className="flex flex-col items-center bg-surface p-6 rounded-xl border border-border h-80">
                                    <Skeleton className="w-32 h-32 rounded-full mb-4" />
                                    <Skeleton className="h-6 w-1/2 mb-2" />
                                    <Skeleton className="h-4 w-1/3 mb-6" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
                        >
                            {headsOfDepartment.map(member => (
                                <motion.div key={member.name} variants={itemVariants}>
                                    <div className="flex flex-col items-center text-center bg-surface p-6 rounded-xl border border-border shadow-lg hover:-translate-y-2 transition-transform duration-300 h-full hover:shadow-primary/20">
                                        <img 
                                            src={member.imageUrl} 
                                            alt={member.name} 
                                            className="w-32 h-32 rounded-full object-cover border-4 border-primary/80 mb-4"
                                            loading="lazy"
                                        />
                                        <h3 className="font-bold text-text text-xl">{member.name}</h3>
                                        <p className="gradient-text text-md font-semibold">{member.title}</p>
                                        <div className="flex-grow w-full mt-4 pt-4 border-t border-border/50">
                                            <p className="text-text/80 italic">"{member.message}"</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

             {/* Notice and Events Section */}
            <section className="py-24 bg-gradient-to-t from-surface/50 to-transparent">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Notice Section */}
                        <motion.div className="flex flex-col" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
                            <h2 className="text-3xl font-bold text-text mb-6">Latest Notices</h2>
                             <div className="flex-grow flex flex-col justify-between">
                                {notices.length > 0 ? notices.map(item => (
                                    <motion.div variants={itemVariants} key={item.id}>
                                         <Link to={`/notice#notice-${item.id}`} className="block p-4 bg-surface/80 border border-border rounded-lg hover:bg-surface transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-secondary">
                                                    <span className="material-symbols-outlined text-lg">{getNoticeIcon(item.category)}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-text line-clamp-2">{item.title}</h3>
                                                    <p className="text-sm text-text/70 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )) : <p className="text-text/70">No notices published yet.</p>}
                            </div>
                        </motion.div>
                        {/* Event Section */}
                        <motion.div className="flex flex-col" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
                            <h2 className="text-3xl font-bold text-text mb-6">Upcoming Events</h2>
                            <div className="flex-grow flex flex-col justify-between">
                                {events.length > 0 ? events.map(event => (
                                    <motion.div variants={itemVariants} key={event.id}>
                                         <Link to={`/events#event-${event.id}`} className="flex flex-col sm:flex-row items-center gap-4 bg-surface/80 p-4 rounded-lg border border-border hover:bg-surface transition-colors">
                                            <img 
                                                src={event.imageUrl} 
                                                alt={event.title} 
                                                className="w-full sm:w-32 h-24 object-cover rounded-md"
                                                loading="lazy"
                                            />
                                            <div className="flex-grow">
                                                <h3 className="font-semibold text-text line-clamp-2">{event.title}</h3>
                                                <p className="text-sm text-text/70 mt-1">{new Date(event.date).toLocaleDateString()}</p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )) : <p className="text-text/70">No upcoming events.</p>}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
};
export default HomePage;
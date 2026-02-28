import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Fallback data
const fallbackFacilities = [
    { icon: 'laptop_chromebook', title: 'Computer Labs', description: 'State-of-the-art labs with the latest hardware and software.' },
    { icon: 'router', title: 'Networking Lab', description: 'Advanced equipment for networking and cybersecurity training.' },
    { icon: 'local_library', title: 'Department Library', description: 'A vast collection of books, journals, and digital resources.' },
    { icon: 'hub', title: 'IoT Lab', description: 'Explore the world of Internet of Things with modern sensors and devices.' },
];
const fallbackAchievements = [
    { icon: 'emoji_events', title: 'National Programming Contest 2023', description: '1st Place Winner' },
    { icon: 'emoji_events', title: 'Innovate Bangladesh 2022', description: 'Best Project Award' },
    { icon: 'emoji_events', title: 'Inter-Polytechnic Tech Fest', description: 'Runners-up' },
];

interface HeadOfDepartment {
    name: string;
    title: string;
    imageUrl: string;
    message: string;
}

const AboutPage: React.FC = () => {
    const [headsOfDepartment, setHeadsOfDepartment] = useState<HeadOfDepartment[]>([]);
    const [heroContent, setHeroContent] = useState({
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPWSvzotivWiTCcGd0i900w-3raWT8xotjhH2cv5sYinmx3_GNgMWHpibI9jdqB4ibTvRmlMHnyf-10rBCBxQIro7Fi-OCT27ce922Cdlm0w_2N6KsPQrynjZdbax-AoNIf0LgBD2HiOVdLosDDdjY7KZh8uuUB1puXSbEP8eBbW_YeVDXlVDgDSDIpXSQo6aJ__6kPkeapRStNTBlbPpJHSSYR0vFtE5tkzrEYQwpoAvuYr1MHxhV1CPgW1AwwOdV1mLUm6-IS0p2',
        title: 'Welcome to the Computer Department',
        subtitle: 'Your journey into the world of technology begins here.'
    });
    const [pageContent, setPageContent] = useState({
        vision: 'To be a center of excellence in computer engineering education, producing skilled and ethical professionals to meet the global challenges.',
        mission: 'To impart high-quality education, foster research and development, and create a conducive learning environment for all our students.',
        about_department: 'The Computer Department at Dinajpur Polytechnic Institute has a rich history of academic excellence and innovation. Established in 1994, we have been at the forefront of providing quality technical education and fostering a research-oriented environment. Our programs are designed to equip students with the skills and knowledge needed to excel in the ever-evolving field of computer science and technology.',
        facilities: fallbackFacilities,
        achievements: fallbackAchievements,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAboutPageData = async () => {
            setLoading(true);

            // Fetch HODs (details from faculty, message from settings)
            const hodPromise = Promise.all([
                supabase.from('faculty').select('name, title, imageUrl').in('title', ['Head of Department (Day)', 'Head of Department (Morning)']),
                supabase.from('site_settings').select('key, value').in('key', ['hod_day_message', 'hod_morning_message'])
            ]).then(([{ data: facultyData }, { data: settingsData }]) => {
                const dayHOD = facultyData?.find(f => f.title === 'Head of Department (Day)');
                const morningHOD = facultyData?.find(f => f.title === 'Head of Department (Morning)');
                const messages = settingsData?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>) || {};
                
                const hods = [
                    {
                        name: morningHOD?.name || 'Dr. Alice Johnson',
                        title: morningHOD?.title || 'Head of Department (Morning)',
                        imageUrl: morningHOD?.imageUrl || 'https://i.imgur.com/yjmrHfi.jpg',
                        message: messages.hod_morning_message || '"Welcome! Our morning shift is dedicated to fostering a strong academic foundation and inspiring innovation from day one."'
                    },
                    {
                        name: dayHOD?.name || 'Dr. John Doe',
                        title: dayHOD?.title || 'Head of Department (Day)',
                        imageUrl: dayHOD?.imageUrl || 'https://i.imgur.com/8gEb1Xn.jpg',
                        message: messages.hod_day_message || '"It is my great pleasure to welcome you. We are committed to a dynamic, supportive learning environment."'
                    }
                ];
                setHeadsOfDepartment(hods);
            });

            const contentKeys = [
                'vision_statement', 'mission_statement', 'department_facilities', 
                'department_achievements', 'about_department_text',
                'hero_about_image_url', 'hero_about_title', 'hero_about_subtitle'
            ];
            const contentPromise = supabase.from('site_settings').select('key, value').in('key', contentKeys)
                .then(({ data, error }) => {
                    if (error) console.error("Error fetching page content:", error.message);
                    else {
                        const contentMap = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as Record<string, string>);
                        setPageContent(prev => {
                            let facilities = prev.facilities;
                            let achievements = prev.achievements;
                            try {
                                if (contentMap.department_facilities) {
                                    const parsed = JSON.parse(contentMap.department_facilities);
                                    if (Array.isArray(parsed)) facilities = parsed;
                                }
                            } catch (e) { console.warn("Could not parse facilities JSON."); }
                             try {
                                if (contentMap.department_achievements) {
                                    const parsed = JSON.parse(contentMap.department_achievements);
                                    if (Array.isArray(parsed)) achievements = parsed;
                                }
                            } catch (e) { console.warn("Could not parse achievements JSON."); }

                            return {
                                vision: contentMap.vision_statement || prev.vision,
                                mission: contentMap.mission_statement || prev.mission,
                                about_department: contentMap.about_department_text || prev.about_department,
                                facilities,
                                achievements
                            };
                        });
                        setHeroContent(prev => ({
                            imageUrl: contentMap.hero_about_image_url || prev.imageUrl,
                            title: contentMap.hero_about_title || prev.title,
                            subtitle: contentMap.hero_about_subtitle || prev.subtitle
                        }));
                    }
                });
            
            await Promise.all([hodPromise, contentPromise]);
            setLoading(false);
        };
        fetchAboutPageData();
    }, []);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-7xl mx-auto">
                <div className="relative rounded-xl overflow-hidden mb-12">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${heroContent.imageUrl}")` }}></div>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                    <div className="relative flex flex-col gap-4 items-center justify-center p-12 text-center text-white min-h-[300px]">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>{heroContent.title}</h1>
                        <p className="text-lg font-normal leading-normal" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{heroContent.subtitle}</p>
                    </div>
                </div>
                <div className="bg-surface backdrop-blur-sm border border-border p-8 rounded-xl mb-12">
                    <h2 className="gradient-text text-3xl font-bold leading-tight tracking-[-0.015em] mb-4">About Our Department</h2>
                    <p className="text-base font-normal leading-relaxed mb-6 text-text/90">{loading ? 'Loading...' : pageContent.about_department}</p>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-bold text-text mb-2">Our Vision</h3>
                            <p className="text-base text-text/80">{loading ? 'Loading...' : pageContent.vision}</p>
                        </div>
                        <div className="border-l-4 border-accent pl-4">
                            <h3 className="text-xl font-bold text-text mb-2">Our Mission</h3>
                            <p className="text-base text-text/80">{loading ? 'Loading...' : pageContent.mission}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-surface backdrop-blur-sm border border-border p-8 rounded-xl mb-12 shadow-lg">
                    <h2 className="gradient-text text-3xl font-bold leading-tight tracking-[-0.015em] mb-6 text-center">Messages from our Heads of Department</h2>
                    {loading ? <p className="text-center text-text/70">Loading...</p> : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {headsOfDepartment.map(hod => (
                                <div key={hod.name} className="flex flex-col items-center text-center">
                                    <img alt={`Photo of ${hod.name}`} className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-primary" src={hod.imageUrl}/>
                                    <h3 className="mt-4 text-xl font-bold">{hod.name}</h3>
                                    <p className="gradient-text font-semibold">{hod.title}</p>
                                    <p className="text-base font-normal leading-relaxed mt-4 text-text/90 italic">"{hod.message}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                     <div className="text-center mt-8">
                        <a href="#/teachers" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:scale-105 transition-transform w-fit mx-auto">
                            <span className="truncate">Meet Our Full Teaching Staff</span>
                        </a>
                    </div>
                </div>
                <div className="bg-gradient-to-b from-primary/10 to-surface backdrop-blur-sm border border-border p-8 rounded-xl mb-12">
                    <h2 className="gradient-text text-3xl font-bold leading-tight tracking-[-0.015em] mb-6 text-center">Department Facilities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loading ? <p className="col-span-full text-center">Loading...</p> : pageContent.facilities.map((facility, index) => (
                             <div key={index} className="flex flex-col items-center text-center p-4 bg-surface/40 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                                <span className="material-symbols-outlined text-4xl text-accent mb-2">{facility.icon}</span>
                                <h4 className="font-bold text-lg mb-1">{facility.title}</h4>
                                <p className="text-sm text-text/80">{facility.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="gradient-text text-3xl font-bold leading-tight tracking-[-0.015em] mb-6 text-center">Department Achievements</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {loading ? <p className="col-span-full text-center">Loading...</p> : pageContent.achievements.map((achievement, index) => (
                            <div key={index} className="bg-surface p-6 rounded-lg border border-border">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-3xl text-accent">{achievement.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-lg">{achievement.title}</h4>
                                        <p className="text-sm text-text/70">{achievement.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;

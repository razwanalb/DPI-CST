

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

// --- Team Data and Modal Component ---
const teamMembers = [
    { name: 'Razwan Ahammad', role: 'Project Lead & Developer', imageUrl: 'https://i.imgur.com/8gEb1Xn.jpg', email: 'razwan.ahammad@example.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
    { name: 'Rafsan Zani', role: 'Project Manager & Consultant', imageUrl: 'https://i.imgur.com/yjmrHfi.jpg', email: 'rafsan.zani@example.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
    { name: 'Siddikur Riyad', role: 'Content & Resource Coordinator', imageUrl: 'https://i.imgur.com/7ufrtNT.jpg', email: 'siddikur.riyad@example.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
    { name: 'Mashiyat Tabassum', role: 'Content & Resource Coordinator', imageUrl: 'https://i.imgur.com/DpxUbgy.jpg', email: 'mashiyat.tabassum@example.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
    { name: 'Esrat Tasnim', role: 'Content & Resource Coordinator', imageUrl: 'https://i.imgur.com/blJjL7d.jpg', email: 'esrat.tasnim@example.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
];

const TeamModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        className="relative w-full max-w-6xl bg-[#001833] border border-border rounded-xl shadow-2xl p-6 flex flex-col max-h-[90vh]"
                        initial={{ opacity: 0, y: -30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="flex justify-between items-center mb-8 flex-shrink-0">
                            <h2 className="text-2xl font-bold gradient-text">Our Development Team</h2>
                            <button
                                onClick={onClose}
                                className="text-text/70 hover:text-text hover:bg-surface rounded-full p-1 transition-colors"
                                aria-label="Close modal"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {teamMembers.map(member => (
                                     <div 
                                        key={member.name} 
                                        className="flex flex-col items-center text-center bg-surface p-8 rounded-2xl border border-border hover:border-primary/50 hover:-translate-y-2 transition-all duration-300 shadow-xl hover:shadow-primary/20"
                                    >
                                        <img
                                            src={member.imageUrl}
                                            alt={`Profile of ${member.name}`}
                                            className="w-28 h-28 rounded-full object-cover border-4 border-primary mb-5 shadow-lg"
                                        />
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-text text-xl">{member.name}</h3>
                                            <p className="text-secondary text-base">{member.role}</p>
                                        </div>
                                        <div className="mt-6 flex items-center justify-center gap-4">
                                            <a href={`mailto:${member.email}`} className="text-text/60 hover:text-primary transition-colors" aria-label="Email">
                                                <span className="material-symbols-outlined text-2xl">email</span>
                                            </a>
                                            <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors" aria-label="Facebook">
                                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path></svg>
                                            </a>
                                            <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors" aria-label="LinkedIn">
                                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                                            </a>
                                            <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors" aria-label="GitHub">
                                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


const Footer: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [siteInfo, setSiteInfo] = useState({
        instituteName: 'Dinajpur Polytechnic Institute',
        departmentName: 'Computer Department',
        address: 'Dinajpur, Bangladesh',
        email: 'info@dpi.ac.bd',
        phone: '+880 1234 567890',
        facebookUrl: '#',
        twitterUrl: '#',
        githubUrl: '#',
        logoUrl: 'https://i.imgur.com/pWs3vnL.jpg'
    });

    useEffect(() => {
        const fetchSiteSettings = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value');

            if (error) {
                console.error("Error fetching site settings for footer:", error.message || error);
            } else {
                const settingsMap = data.reduce((acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
                
                setSiteInfo(prev => ({
                    ...prev,
                    instituteName: settingsMap.institute_name || prev.instituteName,
                    departmentName: settingsMap.department_name || prev.departmentName,
                    address: settingsMap.address || prev.address,
                    email: settingsMap.contact_email || prev.email,
                    phone: settingsMap.contact_phone || prev.phone,
                    facebookUrl: settingsMap.facebook_url || prev.facebookUrl,
                    twitterUrl: settingsMap.twitter_url || prev.twitterUrl,
                    githubUrl: settingsMap.github_url || prev.githubUrl,
                    logoUrl: settingsMap.site_logo_url || prev.logoUrl
                }));
            }
        };
        fetchSiteSettings();
    }, []);

    return (
        <>
            <footer className="bg-surface/30 mt-auto border-t border-border backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left">
                        <div className="sm:col-span-2 md:col-span-1">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <img alt="DPI Logo" className="h-10 w-10 object-contain" src={siteInfo.logoUrl}/>
                                <div>
                                    <h3 className="text-lg font-semibold text-text">{siteInfo.instituteName}</h3>
                                    <p className="text-sm text-text/70">{siteInfo.departmentName}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-secondary">Contact Us</h4>
                            <p className="text-sm text-text/90">{siteInfo.address}</p>
                            <p className="text-sm mt-2 text-text/90">Email: {siteInfo.email}</p>
                            <p className="text-sm text-text/90">Phone: {siteInfo.phone}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-secondary">Quick Links</h4>
                            <ul className="space-y-1 text-sm text-text/90">
                                <li><Link className="hover:text-primary" to="/academic">Admissions</Link></li>
                                <li><Link className="hover:text-primary" to="/notice">Results</Link></li>
                                <li><Link className="hover:text-primary" to="/events">Alumni</Link></li>
                                <li><Link className="hover:text-primary" to="/contact">Career</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-secondary">Follow Us</h4>
                            <div className="flex justify-center md:justify-start space-x-4">
                                <a className="text-text/70 hover:text-primary" href={siteInfo.facebookUrl} target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path></svg></a>
                                <a className="text-text/70 hover:text-primary" href={siteInfo.twitterUrl} target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
                                <a className="text-text/70 hover:text-primary" href={siteInfo.githubUrl} target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12.011c0 4.612 3.023 8.524 7.159 9.743.521.096.712-.226.712-.503 0-.247-.009-.897-.014-1.76-2.934.636-3.553-1.416-3.553-1.416-.474-1.204-1.158-1.525-1.158-1.525-.946-.646.071-.634.071-.634 1.046.074 1.597 1.074 1.597 1.074.929 1.594 2.437 1.134 3.031.868.094-.675.364-1.134.663-1.393-2.313-.263-4.744-1.157-4.744-5.148 0-1.137.406-2.067 1.074-2.795-.108-.264-.465-1.323.102-2.758 0 0 .874-.28 2.862 1.07A9.972 9.972 0 0112 6.819c.895.004 1.796.12 2.624.356 1.988-1.35 2.862-1.07 2.862-1.07.567 1.435.21 2.494.102 2.758.67.728 1.074 1.658 1.074 2.795 0 3.999-2.435 4.881-4.756 5.138.376.323.709.965.709 1.944 0 1.403-.013 2.534-.013 2.877 0 .279.19.604.718.503C18.979 20.535 22 16.623 22 12.011 22 6.477 17.523 2 12 2z" fillRule="evenodd"></path></svg></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-secondary">Developed By</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="font-semibold text-text/90">Razwan Ahammad</li>
                                <li className="font-semibold text-text/90">Rafsan zani</li>
                                <li className="mt-2">
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="text-primary hover:underline font-medium transition-colors"
                                    >
                                        Meet Our Team
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border mt-8 pt-6 text-center text-sm text-text/70">
                        <p>© 2026 {siteInfo.instituteName}. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
            <TeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default Footer;
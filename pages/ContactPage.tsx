

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [contactInfo, setContactInfo] = useState({
        address: 'Computer Department, Dinajpur Polytechnic Institute, Dinajpur, Bangladesh',
        email: 'department@email.com',
        phone: '123-456-7890',
    });

    useEffect(() => {
        const fetchContactInfo = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value')
                .in('key', ['address', 'contact_email', 'contact_phone']);

            if (error) {
                console.error("Error fetching contact info:", error.message || error);
            } else {
                const infoMap = data.reduce((acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);

                setContactInfo(prev => ({
                    ...prev,
                    address: infoMap.address || prev.address,
                    email: infoMap.contact_email || prev.email,
                    phone: infoMap.contact_phone || prev.phone,
                }));
            }
        };
        fetchContactInfo();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("subject", formData.subject);
        data.append("message", formData.message);

        try {
            // IMPORTANT: Replace this URL with your actual Formspree endpoint for the contact form.
            const response = await fetch('https://formspree.io/f/movpojln', {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            setSubmitStatus('error');
            console.error('Contact form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-3 text-center mb-10">
                    <p className="text-4xl font-black leading-tight tracking-[-0.033em]">Contact Us</p>
                    <p className="text-text/70 text-lg font-normal leading-normal">Get in touch with the Computer Department</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col gap-8">
                        <div className="p-6 grid grid-cols-1 gap-y-5 rounded-lg border border-border bg-surface">
                            <div>
                                <p className="text-text/70 text-sm font-medium leading-normal">Our Location</p>
                                <p className="text-text text-base font-normal leading-normal mt-1">{contactInfo.address}</p>
                            </div>
                            <div className="border-t border-t-border pt-5">
                                <p className="text-text/70 text-sm font-medium leading-normal">Email</p>
                                <a className="text-primary text-base font-medium leading-normal hover:underline mt-1 block" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                            </div>
                            <div className="border-t border-t-border pt-5">
                                <p className="text-text/70 text-sm font-medium leading-normal">Phone</p>
                                <a className="text-primary text-base font-medium leading-normal hover:underline mt-1 block" href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
                            </div>
                             <div className="border-t border-t-border pt-5">
                                <p className="text-text/70 text-sm font-medium leading-normal">Career Inquiries</p>
                                <a className="text-primary text-base font-medium leading-normal hover:underline mt-1 block" href="mailto:careers@dpi.ac.bd">careers@dpi.ac.bd</a>
                            </div>
                            <div className="border-t border-t-border pt-5">
                                <p className="text-text/70 text-sm font-medium leading-normal">Office Hours</p>
                                <p className="text-text text-base font-normal leading-normal mt-1">Mon-Fri: 9am - 5pm</p>
                            </div>
                        </div>
                        <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg object-cover" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvAdjR1wr2xAarxsJKoCMDtmtfs4RbeeFYbhXm0FW9fv5NvjYK4AQdPA6npfYWUjulXTzZnaw3-6J_MTCIOtNb4xOPhRVHm9MscAtwrosEQ-3etciSVQQGIMic-nK2sfmJ8mnlsoQwqICS63iyAuP39wmI6dENh_ENUiludG0VPVFssv81ThLTYKCiYlDIwuAULYxkavz8IXy-CYl0eF2Xd-RimBcX40GMmaXFuoRwg-oUkPsZM6h6C850paixLVJziwRPxZgrDaPs")` }}></div>
                    </div>
                    <div className="flex flex-col gap-5 p-6 rounded-lg border border-border bg-surface">
                        <h2 className="text-text tracking-tight text-3xl font-bold leading-tight text-left">Send us a Message</h2>
                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text" htmlFor="name">Name</label>
                                <input className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 placeholder:text-text/60" id="name" name="name" placeholder="Your Name" type="text" value={formData.name} onChange={handleChange} required/>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text" htmlFor="email">Email</label>
                                <input className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 placeholder:text-text/60" id="email" name="email" placeholder="your.email@example.com" type="email" value={formData.email} onChange={handleChange} required/>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text" htmlFor="subject">Subject</label>
                                <input className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 placeholder:text-text/60" id="subject" name="subject" placeholder="Subject of your message" type="text" value={formData.subject} onChange={handleChange} required/>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text" htmlFor="message">Your Message</label>
                                <textarea className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 placeholder:text-text/60" id="message" name="message" placeholder="Type your message here..." rows={5} value={formData.message} onChange={handleChange} required></textarea>
                            </div>

                            {submitStatus === 'success' && (
                                <div className="p-3 text-center text-sm bg-green-500/10 text-green-400 rounded-md">
                                    Thank you! Your message has been sent successfully.
                                </div>
                            )}
                            {submitStatus === 'error' && (
                                <div className="p-3 text-center text-sm bg-red-500/10 text-red-400 rounded-md">
                                    Something went wrong. Please try again later.
                                </div>
                            )}

                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:scale-105 transition-transform duration-200 w-full disabled:opacity-60" type="submit" disabled={isSubmitting}>
                                <span className="truncate">{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
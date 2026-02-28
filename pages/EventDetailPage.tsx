

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

interface Event {
    id: string;
    title: string;
    date: string;
    description: string;
    imageUrl: string;
}

const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];


const EventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formError, setFormError] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        roll: '',
        phone: '',
        email: '',
        department: 'Computer',
        session: '',
        semester: '',
        student_group: 'A',
        shift: 'Morning',
    });

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                setError('Event ID is missing.');
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching event:", error.message);
                setError('Event not found or there was an error loading it.');
            } else {
                setEvent(data);
            }
            setLoading(false);
        };

        fetchEvent();
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        setSubmitSuccess(false);

        // --- Start of Validation ---
        // General empty field check
        for (const key in formData) {
            if (!formData[key]) {
                setFormError(`Please fill out the '${key.replace(/_/g, ' ')}' field.`);
                setIsSubmitting(false);
                return;
            }
        }

        // Phone number validation
        const phoneRegex = /^\d{11}$/;
        if (!phoneRegex.test(formData.phone)) {
            setFormError('Phone number must be exactly 11 digits.');
            setIsSubmitting(false);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFormError('Please enter a valid email address.');
            setIsSubmitting(false);
            return;
        }
        // --- End of Validation ---

        try {
            // Step 1: Save the registration to your Supabase database.
            const { error } = await supabase.from('event_registrations').insert([
                { ...formData, event_id: id }
            ]);

            if (error) {
                throw error;
            }

            setSubmitSuccess(true); // Show success message to the user immediately.

            // Step 2: Send an email notification in the background using Formspree.
            if (event) {
                const emailPayload = new FormData();
                emailPayload.append("_subject", `New Event Registration: ${event.title}`);
                emailPayload.append("Event Title", event.title);
                emailPayload.append("Full Name", formData.full_name);
                emailPayload.append("Roll", formData.roll);
                emailPayload.append("Phone Number", formData.phone);
                emailPayload.append("Email Address", formData.email);
                emailPayload.append("Department", formData.department);
                emailPayload.append("Session", formData.session);
                emailPayload.append("Semester", formData.semester);
                emailPayload.append("Shift", formData.shift);
                emailPayload.append("Group", formData.student_group);
                
                fetch('https://formspree.io/f/xldoyglj', {
                    method: 'POST',
                    body: emailPayload,
                    headers: { 'Accept': 'application/json' }
                })
                .then(response => {
                    if (response.ok) {
                        console.log('Registration email notification sent successfully.');
                    } else {
                        console.error('Failed to send registration email notification via Formspree.');
                    }
                })
                .catch(error => console.error('Error sending registration email notification:', error));
            }

            setFormData({
                full_name: '', roll: '', phone: '', email: '', department: 'Computer', session: '', semester: '', student_group: 'A', shift: 'Morning'
            });

        } catch (err: any) {
            console.error("Registration failed:", err.message);
            const detailedMessage = err.message ? err.message : 'An unexpected error occurred. Please try again.';
            setFormError(`Registration failed: ${detailedMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 10; i <= currentYear + 1; i++) {
            years.push(`${i}-${i + 1}`);
        }
        return years.reverse();
    };

    if (loading) {
        return <div className="text-center py-20 text-text">Loading event details...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-400">{error}</div>;
    }

    if (!event) {
        return <div className="text-center py-20 text-text">Event could not be found.</div>;
    }

    const formattedDate = new Date(event.date).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    
    const isEventPast = new Date(event.date) < new Date();

    const formInputClasses = "w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 placeholder:text-text/60";

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
                <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover" />
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-text mb-2">{event.title}</h1>
                    <p className="text-secondary font-semibold mb-4">{formattedDate}</p>
                    <p className="text-text/80 whitespace-pre-wrap">{event.description}</p>
                </div>
            </div>

            <div className="mt-12 bg-surface border border-border rounded-xl shadow-2xl p-8">
                 {isEventPast ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-6xl text-text/40">event_busy</span>
                        <h2 className="text-2xl font-bold text-center text-text mt-4">Registration Closed</h2>
                        <p className="text-text/70 mt-2">This event has already taken place. Registration is no longer available.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-center text-text mb-6">Register for this Event</h2>
                        {submitSuccess ? (
                            <div className="text-center py-12 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <span className="material-symbols-outlined text-5xl text-green-400">check_circle</span>
                                <h3 className="mt-4 text-xl font-semibold text-green-300">Registration Successful!</h3>
                                <p className="mt-2 text-text/70">Thank you for registering. We look forward to seeing you at the event.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="full_name">Full Name</label>
                                    <input className={formInputClasses} id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} required/>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="roll">Roll</label>
                                    <input className={formInputClasses} id="roll" name="roll" type="text" value={formData.roll} onChange={handleInputChange} required/>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="phone">Phone Number</label>
                                    <input className={formInputClasses} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required/>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="email">Email Address</label>
                                    <input className={formInputClasses} id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required/>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="department">Department</label>
                                    <select className={formInputClasses} id="department" name="department" value={formData.department} onChange={handleInputChange} required>
                                        <option value="Computer">Computer</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Architecture">Architecture</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Power">Power</option>
                                        <option value="Electrical">Electrical</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="session">Session</label>
                                    <select className={formInputClasses} id="session" name="session" value={formData.session} onChange={handleInputChange} required>
                                        <option value="">Select Session</option>
                                        {generateYearOptions().map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text" htmlFor="semester">Semester</label>
                                    <select className={formInputClasses} id="semester" name="semester" value={formData.semester} onChange={handleInputChange} required>
                                        <option value="">Select Semester</option>
                                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text">Shift</label>
                                    <div className="flex items-center gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-text">
                                            <input type="radio" name="shift" value="Morning" checked={formData.shift === 'Morning'} onChange={handleRadioChange} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary" />
                                            Morning
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-text">
                                            <input type="radio" name="shift" value="Day" checked={formData.shift === 'Day'} onChange={handleRadioChange} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary" />
                                            Day
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-sm font-medium text-text">Group</label>
                                    <div className="flex items-center gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-text">
                                            <input type="radio" name="student_group" value="A" checked={formData.student_group === 'A'} onChange={handleRadioChange} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary" />
                                            Group A
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-text">
                                            <input type="radio" name="student_group" value="B" checked={formData.student_group === 'B'} onChange={handleRadioChange} className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary" />
                                            Group B
                                        </label>
                                    </div>
                                </div>
                                
                                {formError && (
                                    <div className="md:col-span-2 text-center text-sm text-red-400 bg-red-500/10 p-3 rounded-md">
                                        {formError}
                                    </div>
                                )}
                                
                                <div className="md:col-span-2">
                                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold tracking-wide hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-wait">
                                        {isSubmitting ? 'Submitting Registration...' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EventDetailPage;
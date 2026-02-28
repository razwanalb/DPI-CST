
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setResetMessage('');
        setResetError('');

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

        setResetLoading(false);
        if (error) {
            setResetError(error.message);
        } else {
            setResetMessage('If an account exists for that email, a password reset link has been sent.');
            setResetEmail(''); // Clear input on success
        }
    };

    if (!isOpen) return null;

    return (
         <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-md bg-[#001833] border border-border rounded-xl shadow-2xl p-8"
                        initial={{ opacity: 0, y: -30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <h2 className="text-2xl font-bold mb-4 text-center text-text">Reset Password</h2>
                        <p className="text-sm text-text/70 text-center mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label htmlFor="reset-email" className="sr-only">Email address</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-text focus:border-primary"
                                />
                            </div>
                            
                            {resetMessage && <p className="text-sm text-green-400 text-center">{resetMessage}</p>}
                            {resetError && <p className="text-sm text-red-400 text-center">{resetError}</p>}
                            
                            <div className="flex justify-end gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80 text-text/90"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                                >
                                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('https://i.imgur.com/pWs3vnL.jpg');
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogo = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'site_logo_url')
                .single();
            if (!error && data?.value) {
                setLogoUrl(data.value);
            }
        };
        fetchLogo();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Failed to log in. Please check your email and password.');
            console.error("Login failed:", err.message || err);
        }

        setLoading(false);
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-xl border border-border shadow-2xl relative overflow-hidden">
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <svg className="animate-spin-slow h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-4 text-text/90 font-semibold tracking-wide">Authenticating...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div>
                         <img
                            className="mx-auto h-20 w-auto"
                            src={logoUrl}
                            alt="Department Logo"
                        />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
                            Admin Panel Login
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <fieldset disabled={loading} className="space-y-6">
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label htmlFor="email-address" className="sr-only">Email address</label>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-text/60 text-text rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-surface/50"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor="password" className="sr-only">Password</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-text/60 text-text rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-surface/50 pr-10"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                     <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-text/70 hover:text-text transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}
                            
                            <div className="flex items-center justify-end text-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="font-medium text-primary hover:text-primary/90 focus:outline-none"
                                >
                                    Forgot your password?
                                </button>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                >
                                    <span className="material-symbols-outlined mr-2">login</span>
                                    Sign in
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
            <ForgotPasswordModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
            />
        </>
    );
};

export default LoginPage;
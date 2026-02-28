
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isConfirming?: boolean; // Optional state for showing loading indicator
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, isConfirming = false }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-md bg-[#001833] border border-border rounded-xl shadow-2xl p-6 text-center"
                        initial={{ opacity: 0, y: -30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-4">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-text">{title}</h2>
                        <p className="text-sm text-text/70 mb-6">{message}</p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={onClose}
                                disabled={isConfirming}
                                className="px-6 py-2 rounded-lg text-sm font-semibold bg-surface hover:bg-surface/80 text-text/90 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isConfirming}
                                className="px-6 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-600/90 text-white transition-colors disabled:bg-red-600/50 min-w-[120px]"
                            >
                                {isConfirming ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;

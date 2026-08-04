import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Check, Info } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        title: 'Confirm Action',
        resolve: null,
        variant: 'danger' // 'danger', 'warning', 'info'
    });

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                title: options.title || 'Confirm Action',
                variant: options.variant || 'danger',
                resolve
            });
        });
    }, []);

    React.useEffect(() => {
        window.confirmModal = confirm;
    }, [confirm]);

    const handleClose = (result) => {
        setConfirmState(prev => {
            if (prev.resolve) prev.resolve(result);
            return { ...prev, isOpen: false };
        });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleClose(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden z-10"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                        confirmState.variant === 'danger' ? 'bg-rose-100 text-rose-600' :
                                        confirmState.variant === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {confirmState.variant === 'info' ? <Info size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-lg font-black text-slate-800">{confirmState.title}</h3>
                                        <p className="mt-2 text-sm font-medium text-slate-600 leading-relaxed">
                                            {confirmState.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => handleClose(false)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleClose(true)}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl text-white transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow ${
                                        confirmState.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' :
                                        confirmState.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    <Check size={16} /> Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
};

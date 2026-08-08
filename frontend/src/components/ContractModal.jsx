import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Building2, Download, Loader2, PenTool } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

const ContractModal = ({ isOpen, onClose, contractDetails, employeeName }) => {
    const documentRef = useRef();
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!documentRef.current) return;
        setIsDownloading(true);

        try {
            // Create a perfect clone of the document
            const clone = documentRef.current.cloneNode(true);
            
            // Remove all dark mode classes from the clone so it forces light mode
            const stripDarkClasses = (el) => {
                const classesToRemove = [];
                el.classList.forEach(cls => {
                    if (cls.startsWith('dark:')) classesToRemove.push(cls);
                });
                classesToRemove.forEach(cls => el.classList.remove(cls));
            };
            
            stripDarkClasses(clone);
            clone.querySelectorAll('*').forEach(stripDarkClasses);

            // Append clone to a hidden container that still renders
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '0';
            container.style.top = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.zIndex = '-9999';
            container.style.opacity = '0'; // Invisible to user, but html2canvas can still process it usually if not display:none
            container.style.pointerEvents = 'none';
            container.appendChild(clone);
            document.body.appendChild(container);

            const opt = {
                margin: 10,
                filename: `Employment_Contract_${employeeName?.replace(/\s+/g, '_') || 'Employee'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            await html2pdf().set(opt).from(clone).save();
            
            // Clean up
            document.body.removeChild(container);
        } catch (error) {
            console.error('PDF Generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const getContractType = () => {
        return contractDetails?.contractType || 'Full-Time';
    };

    const getStartDate = () => {
        return contractDetails?.startDate ? formatDate(contractDetails.startDate) : formatDate(new Date());
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                    onClick={onClose} 
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700"
                >
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl shadow-sm">
                                <FileText size={22} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Employment Contract</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">Official Document</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-indigo-600 dark:text-white hover:text-white rounded-xl transition-all duration-300 font-bold text-sm disabled:opacity-50 border border-indigo-100 dark:border-indigo-500 shadow-sm"
                            >
                                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 duration-300 ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content (Scrollable Area) */}
                    <div className="p-4 sm:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full bg-slate-100 dark:bg-slate-900/50" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                        
                        {/* The PDF Document Page - ADAPTS TO DARK MODE */}
                        <div 
                            ref={documentRef}
                            className="p-10 sm:p-16 shadow-lg border border-slate-200 dark:border-slate-700 w-full mx-auto shrink-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-200"
                            style={{ 
                                maxWidth: '800px',
                                minHeight: 'max-content',
                                fontFamily: "'Times New Roman', Times, serif"
                            }}
                        >
                            {/* Document Header */}
                            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 mb-8 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight uppercase text-slate-900 dark:text-white">Employment Agreement</h1>
                                    <p className="text-sm font-semibold mt-2 tracking-widest uppercase text-slate-500 dark:text-slate-400">STRICTLY CONFIDENTIAL</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2 mb-1">
                                        <Building2 size={20} className="text-slate-900 dark:text-white" />
                                        <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">TECH INNOVA</span>
                                    </div>
                                    <p className="text-xs italic text-slate-600 dark:text-slate-400">Official HR Documentation</p>
                                </div>
                            </div>

                            {/* Document Body */}
                            <div className="space-y-6 text-sm leading-relaxed text-justify text-slate-800 dark:text-slate-300">
                                <p>
                                    This Employment Agreement (the "Agreement") is entered into as of <strong>{getStartDate()}</strong>, by and between <strong>Tech Innova Ltd.</strong> (the "Company") and <strong>{employeeName || 'the Employee'}</strong> (the "Employee").
                                </p>
                                
                                <p>
                                    <strong>1. Position and Duties:</strong> The Employee will be employed as a <strong className="text-slate-900 dark:text-white">{getContractType()}</strong> staff member. The Employee agrees to perform all duties and responsibilities assigned to them by the Company diligently and to the best of their abilities.
                                </p>
                                
                                <p>
                                    <strong>2. Term of Employment:</strong> Employment shall commence on <strong className="text-slate-900 dark:text-white">{getStartDate()}</strong> and will continue until <strong className="text-slate-900 dark:text-white">{contractDetails?.endDate ? formatDate(contractDetails.endDate) : 'terminated by either party in accordance with standard company policies'}</strong>.
                                </p>
                                
                                <p>
                                    <strong>3. Compensation and Benefits:</strong> The Employee will receive standard compensation as agreed upon in the offer letter, along with access to all company benefits applicable to <strong className="text-slate-900 dark:text-white">{getContractType()}</strong> employees, subject to the terms of those benefit plans.
                                </p>

                                <p>
                                    <strong>4. Confidentiality:</strong> The Employee agrees that during and after their employment, they will not disclose any confidential information or trade secrets of the Company to any third party without explicit written consent.
                                </p>

                                <div className="p-5 mt-6 border-l-4 border-slate-800 dark:border-slate-400 bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-slate-200">
                                    <h4 className="font-bold not-italic mb-2 text-base text-slate-900 dark:text-white">Summary of Terms:</h4>
                                    <p className="italic">{contractDetails?.summary || 'This is a standard employment contract establishing the terms, conditions, and expectations of employment between the company and the employee. It encompasses compensation, benefits, working hours, confidentiality agreements, and termination clauses.'}</p>
                                </div>
                            </div>

                            {/* Signatures Section */}
                            <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-700">
                                <p className="mb-12 italic text-slate-600 dark:text-slate-400">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.</p>
                                
                                <div className="flex justify-between items-end px-4">
                                    <div className="w-64">
                                        <div className="border-b border-slate-900 dark:border-slate-100 pb-2 mb-2 flex items-center justify-center min-h-[40px]">
                                            <span className="font-['Brush_Script_MT',cursive] text-2xl text-slate-800 dark:text-slate-200">Tech Innova HR</span>
                                        </div>
                                        <p className="font-bold text-center text-slate-900 dark:text-white">Company Representative</p>
                                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">Date: {getStartDate()}</p>
                                    </div>
                                    
                                    <div className="w-64">
                                        <div className="border-b border-slate-900 dark:border-slate-100 pb-2 mb-2 min-h-[40px] flex items-end">
                                            <PenTool size={16} className="absolute ml-2 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="font-bold text-center text-slate-900 dark:text-white">{employeeName || 'Employee Name'}</p>
                                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">Date: _________________</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContractModal;

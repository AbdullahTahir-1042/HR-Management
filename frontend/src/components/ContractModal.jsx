import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Building2, Download, Loader2, PenTool } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';

const ContractModal = ({ isOpen, onClose, contractDetails, employeeName }) => {
    const documentRef = useRef();
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            let y = margin;

            // --- HEADER ---
            doc.setFont('times', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text('EMPLOYMENT AGREEMENT', margin, y + 6);

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text('STRICTLY CONFIDENTIAL', margin, y + 13);

            doc.setFont('times', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('TECH INNOVA', pageWidth - margin, y + 6, { align: 'right' });
            doc.setFont('times', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Official HR Documentation', pageWidth - margin, y + 12, { align: 'right' });

            y += 18;
            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(0.6);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            // --- KEY DETAILS BOX ---
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

            const startDate = contractDetails?.startDate ? formatDate(contractDetails.startDate) : formatDate(new Date());
            const endDate = contractDetails?.endDate ? formatDate(contractDetails.endDate) : 'Not Specified / At-Will';
            const contractType = contractDetails?.contractType || 'Full-Time';

            const col1 = margin + 5;
            const col2 = margin + contentWidth / 3 + 5;
            const col3 = margin + (contentWidth * 2) / 3 + 5;

            doc.setFont('times', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('START DATE', col1, y + 6);
            doc.text('END DATE', col2, y + 6);
            doc.text('CONTRACT TYPE', col3, y + 6);

            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text(startDate, col1, y + 12);
            doc.text(endDate, col2, y + 12);
            doc.text(contractType, col3, y + 12);

            y += 26;

            // --- BODY TEXT ---
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);

            const addParagraph = (text, bold) => {
                if (bold) doc.setFont('times', 'bold');
                else doc.setFont('times', 'normal');
                const lines = doc.splitTextToSize(text, contentWidth);
                if (y + lines.length * 5.5 > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(lines, margin, y);
                y += lines.length * 5.5 + 3;
            };

            addParagraph(`This Employment Agreement (the "Agreement") is entered into as of ${startDate}, by and between Tech Innova Ltd. (the "Company") and ${employeeName || 'the Employee'} (the "Employee").`);

            addParagraph(`1. Position and Duties: The Employee will be employed as a ${contractType} staff member. The Employee agrees to perform all duties and responsibilities assigned to them by the Company diligently and to the best of their abilities.`);

            addParagraph(`2. Term of Employment: Employment shall commence on ${startDate} and will continue until ${contractDetails?.endDate ? formatDate(contractDetails.endDate) : 'terminated by either party in accordance with standard company policies'}.`);

            addParagraph(`3. Compensation and Benefits: The Employee will receive standard compensation as agreed upon in the offer letter, along with access to all company benefits applicable to ${contractType} employees, subject to the terms of those benefit plans.`);

            addParagraph(`4. Confidentiality: The Employee agrees that during and after their employment, they will not disclose any confidential information or trade secrets of the Company to any third party without explicit written consent.`);

            // --- SUMMARY BOX ---
            y += 2;
            const summaryText = contractDetails?.summary || 'This is a standard employment contract establishing the terms, conditions, and expectations of employment between the company and the employee. It encompasses compensation, benefits, working hours, confidentiality agreements, and termination clauses.';
            const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 16);
            const summaryBoxH = 12 + summaryLines.length * 5;

            if (y + summaryBoxH > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, summaryBoxH, 'F');
            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(1);
            doc.line(margin, y, margin, y + summaryBoxH);

            doc.setFont('times', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text('Summary of Terms:', margin + 8, y + 7);

            doc.setFont('times', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text(summaryLines, margin + 8, y + 14);

            y += summaryBoxH + 15;

            // --- SIGNATURES ---
            if (y + 45 > pageHeight - margin) {
                doc.addPage();
                y = margin + 10;
            }

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            doc.setFont('times', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            const witnessLines = doc.splitTextToSize('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.', contentWidth);
            doc.text(witnessLines, margin, y);
            y += witnessLines.length * 5 + 15;

            // Company signature
            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(0.4);
            doc.line(margin, y, margin + 65, y);
            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text('Company Representative', margin, y + 6);
            doc.setFont('times', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Date: ${startDate}`, margin, y + 11);

            // Employee signature
            const sigRight = pageWidth - margin;
            doc.setDrawColor(15, 23, 42);
            doc.line(sigRight - 65, y, sigRight, y);
            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text(employeeName || 'Employee Name', sigRight - 65, y + 6);
            doc.setFont('times', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Date: _________________', sigRight - 65, y + 11);

            doc.save(`Employment_Contract_${employeeName?.replace(/\s+/g, '_') || 'Employee'}.pdf`);
            toast.success('Contract downloaded!');
        } catch (error) {
            console.error('PDF Generation failed:', error);
            toast.error('Failed to generate PDF. Please try again.');
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

                            {/* Contract Key Details Box */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 mb-8 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{getStartDate()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{contractDetails?.endDate ? formatDate(contractDetails.endDate) : 'Not Specified / At-Will'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Type</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{getContractType()}</p>
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

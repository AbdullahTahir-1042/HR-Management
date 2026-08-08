import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, User, ShieldCheck, CheckCircle2, Target, FileText, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import StarRatingInput from './StarRatingInput';

const RATING_LABELS = {
    1: 'Needs Improvement',
    2: 'Average',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
};

const RATING_COLORS = {
    1: 'text-rose-500',
    2: 'text-amber-500',
    3: 'text-sky-500',
    4: 'text-emerald-500',
    5: 'text-indigo-600'
};

const EmployeeReviews = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?._id) return;
            try {
                const [revRes, repRes] = await Promise.all([
                    apiClient.get(`/performance-reviews/${user._id}`),
                    apiClient.get(`/mistake-reports/agent/${encodeURIComponent(user?.name || '')}`)
                ]);

                const mappedReviews = revRes.data.map(r => ({
                    ...r,
                    entryType: 'review',
                    entryDate: r.createdAt || r.reviewDate
                }));
                const mappedReports = repRes.data.map(r => ({
                    ...r,
                    entryType: 'report',
                    entryDate: r.createdAt
                }));

                const combined = [...mappedReviews, ...mappedReports].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
                setHistory(combined);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user?._id, user?.name]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Star size={24} className="fill-amber-400 text-amber-400" /> My Performance & Reports
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">View feedback, goals, and reports issued by HR or Team Leads.</p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                    <Star size={40} className="text-slate-200 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No History Yet</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                        You do not have any performance reviews or reports recorded. Keep up the good work!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map(item => {
                        if (item.entryType === 'review') {
                            return (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`border rounded-2xl p-5 hover:shadow-xs transition-all bg-white border-slate-200`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <div className="flex items-center gap-1">
                                                    <StarRatingInput value={item.overallRating} readonly={true} size={16} />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-md ${RATING_COLORS[Math.floor(item.overallRating)] || 'text-slate-600'}`}>
                                                    {RATING_LABELS[Math.floor(item.overallRating)] || 'Rated'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200/50 px-2 py-0.5 rounded-md">
                                                    Performance Review
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">
                                                <span className="flex items-center gap-1.5"><Calendar size={11} className="text-indigo-500" /> Date: {formatDate(item.reviewDate)}</span>
                                                <span className="flex items-center gap-1.5"><User size={11} className="text-indigo-500" /> Reviewer: {item.reviewer}</span>
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-3 bg-slate-50 border border-slate-100 p-4 rounded-xl italic">
                                                "{item.comments}"
                                            </p>

                                            {(item.strengths || item.areasForImprovement || item.goals) && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                                                    {item.strengths && (
                                                        <div className="bg-emerald-50/20 rounded-xl p-3 border border-emerald-100/50">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CheckCircle2 size={11} /> Strengths</p>
                                                            <p className="text-xs font-semibold text-slate-600 leading-normal">{item.strengths}</p>
                                                        </div>
                                                    )}
                                                    {item.areasForImprovement && (
                                                        <div className="bg-amber-50/20 rounded-xl p-3 border border-amber-100/50">
                                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target size={11} /> Areas to Improve</p>
                                                            <p className="text-xs font-semibold text-slate-600 leading-normal">{item.areasForImprovement}</p>
                                                        </div>
                                                    )}
                                                    {item.goals && (
                                                        <div className="bg-indigo-50/20 rounded-xl p-3 border border-indigo-100/50">
                                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileText size={11} /> Review Goals</p>
                                                            <p className="text-xs font-semibold text-slate-600 leading-normal">{item.goals}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        } else {
                            // Mistake Report
                            return (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`border rounded-2xl p-5 hover:shadow-xs transition-all bg-rose-50/30 border-rose-100`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <AlertTriangle size={12} /> Mistake / Complaint
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">
                                                <span className="flex items-center gap-1.5"><Calendar size={11} className="text-rose-500" /> Date: {formatDate(item.createdAt)}</span>
                                                <span className="flex items-center gap-1.5"><User size={11} className="text-rose-500" /> Reporter: {item.reportedBy}</span>
                                                <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-rose-500" /> Type: {item.mistakeType}</span>
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-3 bg-white border border-rose-100 p-4 rounded-xl italic">
                                                "{item.description}"
                                            </p>

                                            {(item.learning || item.improvement) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                                                    {item.learning && (
                                                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Expected Learning</p>
                                                            <p className="text-xs font-semibold text-slate-600 leading-normal">{item.learning}</p>
                                                        </div>
                                                    )}
                                                    {item.improvement && (
                                                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Improvement Plan</p>
                                                            <p className="text-xs font-semibold text-slate-600 leading-normal">{item.improvement}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default EmployeeReviews;

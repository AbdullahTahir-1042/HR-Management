import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, User, ShieldCheck, CheckCircle2, Target, FileText } from 'lucide-react';
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
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user?._id) return;
            try {
                const res = await apiClient.get(`/performance-reviews/${user._id}`);
                setReviews(res.data);
            } catch (err) {
                console.error("Failed to load reviews", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [user?._id]);

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
                        <Star size={24} className="fill-amber-400 text-amber-400" /> My Performance Reviews
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">View feedback and goals set by your Team Lead.</p>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                    <Star size={40} className="text-slate-200 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No Reviews Yet</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                        You do not have any performance reviews recorded. Keep up the good work!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(rev => (
                        <motion.div
                            key={rev._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-2xl p-5 hover:shadow-xs transition-all bg-white border-slate-200`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <div className="flex items-center gap-1">
                                            <StarRatingInput value={rev.overallRating} readonly={true} size={16} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-md ${RATING_COLORS[Math.floor(rev.overallRating)] || 'text-slate-600'}`}>
                                            {RATING_LABELS[Math.floor(rev.overallRating)] || 'Rated'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">
                                        <span className="flex items-center gap-1.5"><Calendar size={11} className="text-indigo-500" /> Date: {formatDate(rev.reviewDate)}</span>
                                        <span className="flex items-center gap-1.5"><User size={11} className="text-indigo-500" /> Reviewer: {rev.reviewer}</span>
                                        <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-indigo-500" /> Created: {formatDate(rev.createdAt)}</span>
                                    </div>

                                    <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-3 bg-slate-50 border border-slate-100 p-4 rounded-xl italic">
                                        "{rev.comments}"
                                    </p>

                                    {(rev.strengths || rev.areasForImprovement || rev.goals) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                                            {rev.strengths && (
                                                <div className="bg-emerald-50/20 rounded-xl p-3 border border-emerald-100/50">
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CheckCircle2 size={11} /> Strengths</p>
                                                    <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.strengths}</p>
                                                </div>
                                            )}
                                            {rev.areasForImprovement && (
                                                <div className="bg-amber-50/20 rounded-xl p-3 border border-amber-100/50">
                                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target size={11} /> Areas to Improve</p>
                                                    <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.areasForImprovement}</p>
                                                </div>
                                            )}
                                            {rev.goals && (
                                                <div className="bg-indigo-50/20 rounded-xl p-3 border border-indigo-100/50">
                                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileText size={11} /> Review Goals</p>
                                                    <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.goals}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default EmployeeReviews;

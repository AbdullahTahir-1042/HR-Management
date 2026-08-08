import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/axiosClient';
import StarRatingInput from './StarRatingInput';

const EMPTY_FORM = {
    overallRating: 5.0,
    comments: '',
    strengths: '',
    areasForImprovement: '',
    goals: '',
};

const PerformanceReviewModal = ({ employee, members, onClose, onSuccess }) => {
    const [form, setForm] = useState({ ...EMPTY_FORM, employeeId: employee ? employee._id : '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleRatingChange = (val) => {
        setForm(prev => ({ ...prev, overallRating: val }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.employeeId) {
            setError('Please select an employee.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await apiClient.post('/performance-reviews', {
                employee: form.employeeId,
                reviewDate: new Date().toISOString(),
                ...form
            });
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <Star size={18} className="text-amber-500 fill-amber-500" />
                        <h3 className="font-bold text-slate-800">
                            {employee ? `Performance Review for ${employee.name}` : 'Submit Performance Review'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {submitted ? (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={28} className="text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg">Review Submitted!</h4>
                        <p className="text-sm text-slate-500">The performance review has been saved.</p>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={onClose}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertTriangle size={15} /> {error}
                            </div>
                        )}

                        {members && !employee && (
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Select Team Member <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                    >
                                        <option value="">Select a team member...</option>
                                        {members.map(m => (
                                            <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                    Overall Rating (Click stars)
                                </label>
                                <StarRatingInput
                                    value={form.overallRating}
                                    onChange={handleRatingChange}
                                    size={32}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                    Comments <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    name="comments"
                                    value={form.comments}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Strengths
                                    </label>
                                    <textarea
                                        name="strengths"
                                        value={form.strengths}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Areas for Improvement
                                    </label>
                                    <textarea
                                        name="areasForImprovement"
                                        value={form.areasForImprovement}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Review'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default PerformanceReviewModal;

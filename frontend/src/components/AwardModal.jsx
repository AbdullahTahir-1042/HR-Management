import React, { useState } from 'react';
import { Award, X } from 'lucide-react';
import apiClient from '../api/axiosClient';
import toast from 'react-hot-toast';

const AwardModal = ({ isOpen, onClose, employeeId, onSave }) => {
    const [title, setTitle] = useState('Employee of the Month');
    const [customTitle, setCustomTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const finalTitle = title === 'Custom' ? customTitle : title;
            const res = await apiClient.post('/awards', {
                title: finalTitle,
                description,
                employeeId,
                date: date ? `${date}-01` : undefined
            });
            onSave(res.data);
            toast.success('Award granted successfully!');
            setTitle('Employee of the Month');
            setCustomTitle('');
            setDescription('');
            onClose();
        } catch (err) {
            console.error('Error awarding employee:', err);
            toast.error(err.response?.data?.msg || 'Error giving award');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 overflow-hidden z-10 border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Award className="text-amber-500" size={20} /> Issue Company Award
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Award Title</label>
                        <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm text-slate-800"
                        >
                            <option value="Employee of the Month">Employee of the Month</option>
                            <option value="Top Performer">Top Performer</option>
                            <option value="Rising Star">Rising Star</option>
                            <option value="Best Team Player">Best Team Player</option>
                            <option value="Custom">Custom Title...</option>
                        </select>
                    </div>

                    {title === 'Custom' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Title</label>
                            <input
                                required
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                placeholder="Enter award title"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm text-slate-800"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month / Date</label>
                        <input
                            type="month"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm text-slate-800"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe why the employee is receiving this award..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm text-slate-800 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-75"
                        >
                            {loading ? 'Saving...' : 'Issue Award'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AwardModal;

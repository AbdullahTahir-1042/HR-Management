import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, User, AlertCircle, CheckCircle, Search } from 'lucide-react';

const LatecomersPage = ({ latecomers = [], dateFilter = '', setDateFilter = () => {} }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (isoStr) => {
        if (!isoStr) return '-';
        return new Date(isoStr).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatLateDuration = (totalMinutes) => {
        if (!totalMinutes || totalMinutes <= 0) return '0m';
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    };

    const filtered = (dateFilter
        ? latecomers.filter(l => l.date === dateFilter)
        : latecomers).filter(l => {
            const q = searchTerm.toLowerCase();
            return !q || 
                   l.employee?.name?.toLowerCase().includes(q) || 
                   l.employee?.email?.toLowerCase().includes(q);
        });

    const uncompensated = filtered.filter(l => !l.compensated);
    const compensated = filtered.filter(l => l.compensated);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                        {uncompensated.length} Late
                    </span>
                    {compensated.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                            {compensated.length} Compensated
                        </span>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 pl-9 bg-slate-100 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm w-48 sm:w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-100 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                        />
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    dateFilter === new Date().toISOString().slice(0, 10)
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setDateFilter('')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    dateFilter === ''
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="table-container"
            >
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <User size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No latecomers found.</p>
                        </div>
                    ) : (
                        <table className="table-base">
                            <thead>
                                <tr className="table-header">
                                    <th>Employee</th>
                                    <th>Date</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Duration Late</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {filtered.map(entry => (
                                    <tr
                                        key={entry._id}
                                        className={`table-row transition-colors ${
                                            entry.compensated
                                                ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                                                : ''
                                        }`}
                                    >
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">
                                                    {entry.employee?.name || '—'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {entry.employee?.email || ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                                                <Calendar size={14} className="text-slate-400" />
                                                {formatDate(entry.date)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                                                <Clock size={14} className="text-red-400" />
                                                {formatTime(entry.checkIn)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                                                <Clock size={14} className="text-slate-400" />
                                                {formatTime(entry.checkOut)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 flex items-center gap-1.5 w-fit">
                                                <AlertCircle size={12} />
                                                {formatLateDuration(entry.minutesLate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {entry.compensated ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-fit">
                                                    <CheckCircle size={12} />
                                                    Compensated
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 flex items-center gap-1.5 w-fit">
                                                    <AlertCircle size={12} />
                                                    Late
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LatecomersPage;
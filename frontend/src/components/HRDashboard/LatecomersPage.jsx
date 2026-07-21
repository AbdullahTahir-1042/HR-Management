import { motion } from 'framer-motion';
import { Clock, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';

const LatecomersPage = ({ latecomers = [], dateFilter = '', setDateFilter = () => {} }) => {

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

    const filtered = dateFilter
        ? latecomers.filter(l => l.date === dateFilter)
        : latecomers;

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
                <div className="flex items-center gap-2">
                    {dateFilter && (
                        <button
                            onClick={() => setDateFilter('')}
                            className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                    />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <User size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No latecomers found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-[0.1em]">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check-in</th>
                                    <th className="px-6 py-4">Check-out</th>
                                    <th className="px-6 py-4">Duration Late</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(entry => (
                                    <tr
                                        key={entry._id}
                                        className={`transition-colors ${
                                            entry.compensated
                                                ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                                                : 'hover:bg-slate-50/80'
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
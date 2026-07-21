import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, Tag, Info, PartyPopper, X } from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getDurationDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff === 1 ? '1 day' : `${diff} days`;
};

const isUpcoming = (dateStr) => new Date(dateStr) >= new Date();

const TYPE_STYLES = {
    Public:     { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  dot: 'bg-indigo-500'  },
    Optional:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
    Restricted: { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
    Company:    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const getTypeStyle = (type) => TYPE_STYLES[type] || TYPE_STYLES['Public'];

// ── animation variants ──────────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── sub-components ──────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm`}>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

// ── modal component ─────────────────────────────────────────────────────────────

const HolidayDetailModal = ({ holiday, onClose }) => {
    if (!holiday) return null;

    const style = getTypeStyle(holiday.type);
    const upcoming = isUpcoming(holiday.startDate);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 overflow-hidden z-10 space-y-6"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 pr-6">
                    <div className={`p-4 rounded-2xl ${style.bg} shrink-0`}>
                        <PartyPopper size={28} className={style.text} />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                                {holiday.type || 'Public'}
                            </span>
                            {upcoming && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                    Upcoming
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 leading-snug">{holiday.name}</h2>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" /> Start Date
                        </span>
                        <span className="font-semibold text-slate-700">{formatDate(holiday.startDate)}</span>
                    </div>

                    {holiday.endDate && holiday.endDate !== holiday.startDate && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/60">
                            <span className="text-slate-400 font-medium flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> End Date
                            </span>
                            <span className="font-semibold text-slate-700">{formatDate(holiday.endDate)}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                            <Tag size={16} className="text-slate-400" /> Total Duration
                        </span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                            {getDurationDays(holiday.startDate, holiday.endDate || holiday.startDate)}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Info size={14} className="text-slate-400" /> Description & Details
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 min-h-[70px]">
                        {holiday.description || 'No additional description provided for this holiday.'}
                    </p>
                </div>

                {/* Action button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md"
                >
                    Close Details
                </button>
            </motion.div>
        </div>
    );
};

const HolidayCard = ({ holiday, onClick }) => {
    const style = getTypeStyle(holiday.type);
    const upcoming = isUpcoming(holiday.startDate);

    return (
        <motion.div
            variants={cardVariants}
            onClick={() => onClick(holiday)}
            className={`bg-white rounded-2xl border ${upcoming ? 'border-indigo-100 shadow-md shadow-indigo-50' : 'border-slate-100 shadow-sm'} p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 cursor-pointer transition-all duration-200 group`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${style.bg} shrink-0 group-hover:scale-105 transition-transform`}>
                        <CalendarDays size={18} className={style.text} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{holiday.name}</h3>
                        {upcoming && (
                            <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                Upcoming
                            </span>
                        )}
                    </div>
                </div>

                {/* Type badge */}
                <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    {holiday.type || 'Public'}
                </span>
            </div>

            {/* Date & duration */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    {formatDate(holiday.startDate)}
                    {holiday.endDate && holiday.endDate !== holiday.startDate && (
                        <> → {formatDate(holiday.endDate)}</>
                    )}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <Tag size={13} className="text-slate-400" />
                    {getDurationDays(holiday.startDate, holiday.endDate || holiday.startDate)}
                </span>
            </div>

            {/* Description preview */}
            {holiday.description && (
                <p className="text-xs text-slate-400 line-clamp-2 flex items-start gap-1.5 pt-1 border-t border-slate-50">
                    <Info size={13} className="mt-0.5 shrink-0 text-slate-300" />
                    {holiday.description}
                </p>
            )}

            <div className="text-[11px] font-bold text-indigo-600 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                View Details &rarr;
            </div>
        </motion.div>
    );
};

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
        <div className="bg-indigo-50 p-5 rounded-full mb-4">
            <CalendarDays size={32} className="text-indigo-300" />
        </div>
        <p className="text-slate-700 font-semibold text-lg">No holidays found</p>
        <p className="text-slate-400 text-sm mt-1">There are no holidays scheduled at the moment.</p>
    </motion.div>
);

// ── main component ──────────────────────────────────────────────────────────────

const EmployeeHolidays = ({ holidays = [] }) => {
    const [selectedHoliday, setSelectedHoliday] = React.useState(null);

    const upcoming = useMemo(
        () => holidays.filter((h) => isUpcoming(h.startDate)),
        [holidays]
    );

    const typeCount = useMemo(() => {
        const counts = {};
        holidays.forEach((h) => {
            const t = h.type || 'Public';
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [holidays]);

    return (
        <motion.div
            key="employee-holidays"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* ── Page Title ── */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
                    <PartyPopper size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Holiday Calendar</h1>
                    <p className="text-sm text-slate-400">Official company holidays for the year</p>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={CalendarDays}
                    label="Total Holidays"
                    value={holidays.length}
                    color="bg-indigo-500"
                />
                <StatCard
                    icon={Clock}
                    label="Upcoming"
                    value={upcoming.length}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={Tag}
                    label="Holiday Types"
                    value={Object.keys(typeCount).length}
                    color="bg-amber-500"
                />
            </div>

            {/* ── Holiday Grid ── */}
            {holidays.length === 0 ? (
                <EmptyState />
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                    {holidays.map((holiday, index) => (
                        <HolidayCard 
                            key={holiday._id} 
                            holiday={holiday} 
                            onClick={(h) => setSelectedHoliday(h)} 
                        />
                    ))}
                </motion.div>
            )}

            {/* Modal Detail Pop-up */}
            <AnimatePresence>
                {selectedHoliday && (
                    <HolidayDetailModal
                        holiday={selectedHoliday}
                        onClose={() => setSelectedHoliday(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default EmployeeHolidays;
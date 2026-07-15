import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Tag, Info, PartyPopper } from 'lucide-react';

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

const HolidayCard = ({ holiday, index }) => {
    const style = getTypeStyle(holiday.type);
    const upcoming = isUpcoming(holiday.startDate);

    return (
        <motion.div
            variants={cardVariants}
            className={`bg-white rounded-2xl border ${upcoming ? 'border-indigo-100 shadow-md shadow-indigo-50' : 'border-slate-100 shadow-sm'} p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${style.bg} shrink-0`}>
                        <CalendarDays size={18} className={style.text} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{holiday.name}</h3>
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

            {/* Description */}
            {holiday.description && (
                <p className="text-xs text-slate-400 flex items-start gap-1.5">
                    <Info size={13} className="mt-0.5 shrink-0 text-slate-300" />
                    {holiday.description}
                </p>
            )}
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
                        <HolidayCard key={holiday._id} holiday={holiday} index={index} />
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default EmployeeHolidays;
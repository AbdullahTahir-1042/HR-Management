import toast from 'react-hot-toast';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, Save, Pencil, Bell, MessageSquare, Megaphone, CalendarCheck, CheckCircle2, FileText, ArrowRight, Award } from 'lucide-react';
import ContractModal from './ContractModal';

const UpdateProfilePage = ({ user, onBack, onUpdate }) => {
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        photo: user?.photo || '',
        department: user?.department || '',
        reportingTo: user?.reportingTo || '',
        salary: user?.salary || '',
        notificationPreferences: user?.notificationPreferences || {
            all: true,
            announcements: true,
            messages: true,
            leaves: true,
            attendance: true
        }
    });
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [awards, setAwards] = useState([]);

    // Fetch full user data to ensure we have everything
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await apiClient.get('/auth/user');
                const { password, ...safeUserData } = res.data;
                setFormData(prev => ({ ...prev, ...safeUserData }));
            } catch (err) {
                console.error("Error fetching user data", err);
            }
            try {
                const awardRes = await apiClient.get(`/awards/employee/${user.id || user._id}`);
                setAwards(awardRes.data || []);
            } catch (err) {
                console.error("Error fetching employee awards", err);
            }
        };
        fetchUserData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const res = await apiClient.put(`/auth/users/${userId}`, formData);
            toast.success('Settings saved!');
            updateUser(res.data);
            if (onUpdate) onUpdate(res.data);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error saving settings');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        const userId = user?._id || user?.id;
        const basePath = user?.role === 'hr' ? '/hr' : `/employee/${userId}`;
        navigate(`${basePath}/profile/edit-profile`);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto pb-12"
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Photo Section */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-300 dark:text-slate-500" />
                                )}
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{formData.name}</h3>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">{user?.role}</p>
                    </div>

                    {/* Awards & Recognition */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 mt-6">
                        <h3 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
                            <Award className="text-indigo-600" size={16} /> Awards & Recognition
                        </h3>
                        {awards.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No awards or recognition recorded yet.</p>
                        ) : (
                            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                                {awards.map(a => (
                                    <div key={a._id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 flex flex-col gap-2 relative">
                                        <div className="flex gap-2.5 items-start">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                                <Award size={16} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={a.title}>{a.title}</h4>
                                                {a.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/50 dark:border-slate-600/50 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>{a.date ? new Date(a.date).toLocaleDateString('default', { month: 'short', year: 'numeric' }) : '-'}</span>
                                            <span>By: {a.awardedBy?.name || 'HR'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">

                        {/* Read-Only Personal Info */}
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personal Information</h4>
                            <button
                                type="button"
                                onClick={handleEditProfile}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                <Pencil size={14} />
                                Edit Profile
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                                    <User size={18} className="text-slate-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formData.name}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                                    <Mail size={18} className="text-slate-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formData.email}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                                    <Phone size={18} className="text-slate-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formData.phone || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">Employment Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {formData.department || '—'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Monthly Salary</label>
                                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {formData.salary || '—'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div 
                                    onClick={() => setIsContractModalOpen(true)}
                                    className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors p-4 rounded-xl cursor-pointer flex items-center justify-between border border-slate-200 dark:border-slate-600 group w-full md:w-1/2"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm text-left">Employment Contract</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-left">Click to view details</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-3">* Employment details can only be changed by the HR Department.</p>
                        </div>

                        {/* Notification Preferences Section */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Bell size={14}/> Notification Settings</h4>
                            <div className="space-y-4">
                                {/* Master Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">All Notifications</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Master switch to pause or resume all alerts.</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, all: !formData.notificationPreferences.all } })}
                                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.all ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <span className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.all ? 'left-[24px]' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Specific Toggles */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all ${!formData.notificationPreferences.all ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                    {/* Announcements */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg"><Megaphone size={16} /></div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Announcements</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, announcements: !formData.notificationPreferences.announcements } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.announcements ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.announcements ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg"><MessageSquare size={16} /></div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Chat Messages</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, messages: !formData.notificationPreferences.messages } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.messages ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.messages ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Leaves */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg"><CalendarCheck size={16} /></div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Leave Updates</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, leaves: !formData.notificationPreferences.leaves } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.leaves ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.leaves ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Attendance */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg"><CheckCircle2 size={16} /></div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Attendance Emails</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, attendance: !formData.notificationPreferences.attendance } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.attendance ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.attendance ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </form>

            <ContractModal 
                isOpen={isContractModalOpen} 
                onClose={() => setIsContractModalOpen(false)} 
                contractDetails={formData?.contractDetails} 
                employeeName={formData?.name} 
            />
        </motion.div>
    );
};

export default UpdateProfilePage;

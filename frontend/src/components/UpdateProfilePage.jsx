import toast from 'react-hot-toast';
import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosClient';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Camera, Save, Lock, Eye, EyeOff, Trash2, Pencil, Bell, MessageSquare, Megaphone, CalendarCheck, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import ContractModal from './ContractModal';

const UpdateProfilePage = ({ user, onBack, onUpdate }) => {
    const { updateUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        photo: user?.photo || '',
        department: user?.department || '',
        reportingTo: user?.reportingTo || '',
        salary: user?.salary || '',
        password: '', // Optional password update
        notificationPreferences: user?.notificationPreferences || {
            all: true,
            announcements: true,
            messages: true,
            leaves: true,
            attendance: true
        }
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch full user data to ensure we have everything
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await apiClient.get('/auth/user');
                setFormData(prev => ({ ...prev, ...res.data }));
            } catch (err) {
                console.error("Error fetching user data", err);
            }
        };
        fetchUserData();
    }, []);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
                toast.error("File size must be less than 500KB");
                e.target.value = null;
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setFormData({ ...formData, photo: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use the generic user update route
            const userId = user.id || user._id;
            const res = await apiClient.put(`/auth/users/${userId}`, formData);
            toast.success('Profile updated successfully!');
            updateUser(res.data); // Update global auth state
            if (onUpdate) onUpdate(res.data);
            onBack();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const isHR = user?.role === 'hr';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto pb-12"
        >

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Photo Section */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-300" />
                                )}
                            </div>
                            {/* Main Camera Icon (Bottom Right) */}
                            <label className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors z-10">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        {formData.photo && (
                            <button 
                                type="button" 
                                onClick={handleRemovePhoto} 
                                className="mb-4 text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 justify-center transition-colors"
                            >
                                <Trash2 size={12} /> Remove Photo
                            </button>
                        )}
                        <h3 className="font-bold text-slate-800">{formData.name}</h3>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">{user?.role}</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="tel" value={formData.phone} onChange={e => {
                                        let val = e.target.value.replace(/[^0-9+]/g, '');
                                        if (val.includes('+')) {
                                            val = '+' + val.replace(/\+/g, '');
                                        }
                                        setFormData({...formData, phone: val});
                                    }} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Update Password (Optional)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input type={showPassword ? "text" : "password"} placeholder="Leave empty to keep current" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Restricted Fields for non-HR */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Employment Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <input disabled value={formData.department} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Salary</label>
                                    <input disabled value={formData.salary} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div 
                                    onClick={() => setIsContractModalOpen(true)}
                                    className="bg-slate-50 hover:bg-slate-100 transition-colors p-4 rounded-xl cursor-pointer flex items-center justify-between border border-slate-200 group w-full md:w-1/2"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm text-left">Employment Contract</h3>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider text-left">Click to view details</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-3">* Employment details can only be changed by the HR Department.</p>
                        </div>

                        {/* Notification Preferences Section */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Bell size={14}/> Notification Settings</h4>
                            <div className="space-y-4">
                                {/* Master Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">All Notifications</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Master switch to pause or resume all alerts.</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, all: !formData.notificationPreferences.all } })}
                                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.all ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.all ? 'left-[24px]' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Specific Toggles */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all ${!formData.notificationPreferences.all ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                    {/* Announcements */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Megaphone size={16} /></div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">Announcements</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, announcements: !formData.notificationPreferences.announcements } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.announcements ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.announcements ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MessageSquare size={16} /></div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">Chat Messages</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, messages: !formData.notificationPreferences.messages } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.messages ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.messages ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Leaves */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><CalendarCheck size={16} /></div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">Leave Updates</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, leaves: !formData.notificationPreferences.leaves } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.leaves ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.leaves ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Attendance */}
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={16} /></div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">Attendance Emails</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationPreferences: { ...formData.notificationPreferences, attendance: !formData.notificationPreferences.attendance } })}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${formData.notificationPreferences.attendance ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute transition-all ${formData.notificationPreferences.attendance ? 'left-[18px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Updating..." : <><Save size={18} /> Save Changes</>}
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

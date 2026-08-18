import toast from 'react-hot-toast';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Camera, Save, Lock, Eye, EyeOff, Trash2, ShieldCheck, X } from 'lucide-react';

const EditProfilePage = ({ user, onUpdate }) => {
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        photo: user?.photo || '',
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch latest user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await apiClient.get('/auth/user');
                const { password, ...safeUserData } = res.data;
                setFormData(prev => ({
                    ...prev,
                    name: safeUserData.name || prev.name,
                    email: safeUserData.email || prev.email,
                    phone: safeUserData.phone || prev.phone,
                    photo: safeUserData.photo || prev.photo,
                }));
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

    const handleGoBack = () => {
        const userId = user?._id || user?.id;
        const basePath = user?.role === 'hr' ? '/hr' : `/employee/${userId}`;
        navigate(`${basePath}/profile`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const digitCount = (formData.phone || '').replace(/[^0-9]/g, '').length;
        if (digitCount < 11) {
            toast.error('Phone number must be at least 11 digits long.');
            return;
        }

        // Password validation
        if (showPasswordSection && (currentPassword || newPassword || confirmPassword)) {
            if (!currentPassword) {
                toast.error('Please enter your current password.');
                return;
            }
            if (!newPassword) {
                toast.error('Please enter a new password.');
                return;
            }
            if (newPassword.length < 6) {
                toast.error('New password must be at least 6 characters.');
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error('New password and confirm password do not match.');
                return;
            }
        }

        setLoading(true);
        try {
            const userId = user.id || user._id;
            const payload = { ...formData };
            
            // Only send password fields if user is changing password
            if (showPasswordSection && newPassword) {
                payload.password = newPassword;
                payload.currentPassword = currentPassword;
            }

            const res = await apiClient.put(`/auth/users/${userId}`, payload);
            toast.success('Profile updated successfully!');
            updateUser(res.data);
            if (onUpdate) onUpdate(res.data);
            handleGoBack();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto pb-12"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Profile Photo</h4>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={36} className="text-slate-300 dark:text-slate-500" />
                                )}
                            </div>
                            <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                                <Camera size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload a new photo</p>
                            <p className="text-xs text-slate-400">Max file size: 500KB</p>
                            {formData.photo && (
                                <button 
                                    type="button" 
                                    onClick={handleRemovePhoto} 
                                    className="text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 size={12} /> Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personal Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <div className="space-y-1.5 md:col-span-2">
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
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Change Password</h4>
                        {!showPasswordSection ? (
                            <button
                                type="button"
                                onClick={() => setShowPasswordSection(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                            >
                                <Lock size={12} />
                                Change
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            >
                                <X size={12} />
                                Cancel
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {!showPasswordSection ? (
                            <p className="text-sm text-slate-400">Your password is secure. Click "Change" above to update it.</p>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600 p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <ShieldCheck size={16} className="text-indigo-500" />
                                        Verify & Update Password
                                    </div>
                                    <div className="space-y-4">
                                        {/* Current Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    placeholder="Enter your current password"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200"
                                                />
                                                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* New Password */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        placeholder="Enter new password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200"
                                                    />
                                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Confirm Password */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Confirm new password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className={`w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border rounded-xl outline-none focus:border-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200 ${confirmPassword && confirmPassword !== newPassword ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-600'}`}
                                                    />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                {confirmPassword && confirmPassword !== newPassword && (
                                                    <p className="text-[10px] text-rose-500 font-semibold ml-1">Passwords do not match</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? "Updating..." : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default EditProfilePage;

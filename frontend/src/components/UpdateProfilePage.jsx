import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosClient';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Camera, Save, Lock, Eye, EyeOff } from 'lucide-react';

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
        password: '' // Optional password update
    });
    const [showPassword, setShowPassword] = useState(false);
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use the generic user update route
            const userId = user.id || user._id;
            const res = await apiClient.put(`/auth/users/${userId}`, formData);
            alert('Profile updated successfully!');
            updateUser(res.data); // Update global auth state
            if (onUpdate) onUpdate(res.data);
            onBack();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error updating profile');
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
                            <label className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        <h3 className="font-bold text-slate-800">{formData.name}</h3>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">{user?.role}</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Update Password (Optional)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input type={showPassword ? "text" : "password"} placeholder="Leave empty to keep current" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
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
                                    <input disabled value={formData.department} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Salary</label>
                                    <input disabled value={formData.salary} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-3">* Employment details can only be changed by the HR Department.</p>
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
        </motion.div>
    );
};

export default UpdateProfilePage;

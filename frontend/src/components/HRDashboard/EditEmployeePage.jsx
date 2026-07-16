import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Mail, User, Shield, Briefcase, Building2, UserCheck, Image as ImageIcon, Phone } from 'lucide-react';
import axios from 'axios';

const EditEmployeePage = ({ employee, onBack, onEmployeeUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        status: 'full time',
        department: 'development',
        reportingTo: '',
        salary: '',
        photo: ''
    });
    const [departmentsList, setDepartmentsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/departments/all`);
                setDepartmentsList(res.data);
            } catch (err) {
                console.error("Failed to load departments:", err);
            }
        };
        fetchDepts();
    }, []);

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                role: employee.role || 'employee',
                status: employee.status || 'full time',
                department: employee.department || 'development',
                reportingTo: employee.reportingTo || '',
                salary: employee.salary || '',
                photo: employee.photo || ''
            });
            setPreview(employee.photo || null);
        }
    }, [employee]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/auth/users/${employee._id}`, formData, config);
            onEmployeeUpdated(res.data);
            onBack();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
                >
                    <ArrowLeft size={18} /> Cancel Editing
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-10">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {error && (
                            <div className="md:col-span-2 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl text-center">
                                {error}
                            </div>
                        )}

                        {/* Profile Photo Section */}
                        <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white ring-1 ring-slate-200">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/80 rounded-3xl transition-all cursor-pointer">
                                    <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 uppercase tracking-wider">Change</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </label>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Photo</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Basic Information</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Employment Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Employment Details</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Department</label>
                                    <div className="relative mt-1">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none">
                                            {departmentsList.map(dept => (
                                                <option key={dept._id} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                            {departmentsList.length === 0 && (
                                                <>
                                                    <option value="design">Design</option>
                                                    <option value="hr">HR</option>
                                                    <option value="development">Development</option>
                                                    <option value="QA">QA</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reporting To</label>
                                    <div className="relative mt-1">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" value={formData.reportingTo} onChange={e => setFormData({...formData, reportingTo: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                    <div className="relative mt-1">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none">
                                            <option value="full time">Full Time</option>
                                            <option value="probation">Probation</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monthly Salary (₨)</label>
                                    <div className="relative mt-1 group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₨</div>
                                        <input required type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Role</label>
                                    <div className="relative mt-1">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none">
                                            <option value="employee">Employee</option>
                                            <option value="hr">HR Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-base"
                            >
                                {loading ? 'Saving Changes...' : <><Save size={20} /> Update Employee Profile</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default EditEmployeePage;

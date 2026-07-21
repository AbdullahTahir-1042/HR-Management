import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Mail, Lock, User, Shield, Briefcase, Eye, EyeOff, Building2, UserCheck, Phone, Crown, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ── Validation helpers ────────────────────────────────────────────────────────
const validators = {
    name: (val) => {
        if (!val.trim()) return 'Full name is required';
        if (val.trim().length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-zA-Z\s.'\-]+$/.test(val.trim())) return 'Name can only contain letters, spaces, and hyphens';
        return '';
    },
    email: (val) => {
        if (!val.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address';
        return '';
    },
    phone: (val) => {
        if (!val.trim()) return 'Phone number is required';
        const digits = val.replace(/\D/g, '');
        if (digits.length < 10) return 'Phone number must have at least 10 digits';
        if (digits.length > 15) return 'Phone number is too long';
        return '';
    },
    password: (val) => {
        if (!val) return 'Password is required';
        if (val.length < 6) return 'Password must be at least 6 characters';
        if (!/[a-zA-Z]/.test(val)) return 'Password must contain at least one letter';
        if (!/[0-9]/.test(val)) return 'Password must contain at least one number';
        return '';
    },
    salary: (val) => {
        if (!val && val !== 0) return 'Salary is required';
        if (isNaN(val) || Number(val) <= 0) return 'Salary must be a positive number';
        return '';
    }
};

// ── Inline Field Error Component ──────────────────────────────────────────────
const FieldError = ({ message }) => {
    if (!message) return null;
    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-rose-500 text-[11px] font-semibold mt-1.5 ml-1 flex items-center gap-1"
        >
            <AlertCircle size={12} className="shrink-0" />
            {message}
        </motion.p>
    );
};

// ── Compute input border class ────────────────────────────────────────────────
const getInputBorderClass = (fieldName, touched, errors, baseClass) => {
    if (!touched[fieldName]) return baseClass;
    if (errors[fieldName]) return baseClass.replace('border-slate-200', 'border-rose-300').replace('focus:border-indigo-500', 'focus:border-rose-500').replace('focus:ring-indigo-500/10', 'focus:ring-rose-500/10');
    return baseClass.replace('border-slate-200', 'border-emerald-300').replace('focus:border-indigo-500', 'focus:border-emerald-500').replace('focus:ring-indigo-500/10', 'focus:ring-emerald-500/10');
};

const AddEmployeePage = ({ onBack, onEmployeeAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'employee',
        status: 'full time',
        department: 'development',
        reportingTo: '',
        salary: '',
        photo: '',
        isTeamLead: false
    });
    const [departmentsList, setDepartmentsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // ── Validation State ──────────────────────────────────────────────────────
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitShake, setSubmitShake] = useState(false);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await apiClient.get('/departments');
                setDepartmentsList(res.data);
                if (res.data && res.data.length > 0) {
                    setFormData(prev => ({ ...prev, department: res.data[0].name }));
                }
            } catch (err) {
                console.error("Failed to load departments:", err);
            }
        };
        fetchDepts();
    }, []);

    // Reset isTeamLead to false if the newly selected department already has a Team Lead
    useEffect(() => {
        const selectedDeptObj = departmentsList.find(
            dept => dept.name.toLowerCase() === formData.department.toLowerCase()
        );
        const hasExistingLead = selectedDeptObj && selectedDeptObj.teamLead;
        if (hasExistingLead && formData.isTeamLead) {
            setFormData(prev => ({ ...prev, isTeamLead: false }));
        }
    }, [formData.department, departmentsList]);

    // ── Validate a single field ───────────────────────────────────────────────
    const validateField = useCallback((fieldName, value) => {
        const validator = validators[fieldName];
        if (!validator) return '';
        return validator(value);
    }, []);

    // ── Handle field blur (trigger validation) ────────────────────────────────
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        const err = validateField(fieldName, formData[fieldName]);
        setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
    };

    // ── Handle field change (clear error if fixing) ───────────────────────────
    const handleChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // If already touched, re-validate on change for instant feedback
        if (touched[fieldName]) {
            const err = validateField(fieldName, value);
            setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
        }
    };

    // ── Validate all fields before submit ─────────────────────────────────────
    const validateAll = () => {
        const fieldsToValidate = ['name', 'email', 'phone', 'password', 'salary'];
        const newErrors = {};
        const newTouched = {};
        let hasError = false;

        fieldsToValidate.forEach(field => {
            newTouched[field] = true;
            const err = validateField(field, formData[field]);
            newErrors[field] = err;
            if (err) hasError = true;
        });

        setTouched(prev => ({ ...prev, ...newTouched }));
        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        return !hasError;
    };

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

        if (!validateAll()) {
            setSubmitShake(true);
            setTimeout(() => setSubmitShake(false), 600);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiClient.post('/auth/register', formData);
            onEmployeeAdded();
            onBack(); // Go back to list after success
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to add employee');
        } finally {
            setLoading(false);
        }
    };

    const BASE_INPUT = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm";
    const BASE_INPUT_PASS = "w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm";

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
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
                                        <div className="text-slate-300 flex flex-col items-center gap-1">
                                            <User size={32} />
                                            <span className="text-[10px] font-bold">UPLOAD</span>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/80 rounded-3xl transition-all cursor-pointer">
                                    <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 uppercase tracking-wider text-center px-2">Change Photo</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </label>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Photo</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Basic Information</h3>
                            
                            {/* Full Name */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                <div className="relative mt-1 group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="John Doe" 
                                        value={formData.name} 
                                        onChange={e => handleChange('name', e.target.value)} 
                                        onBlur={() => handleBlur('name')}
                                        className={getInputBorderClass('name', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.name && !fieldErrors.name && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.name ? fieldErrors.name : ''} />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
                                <div className="relative mt-1 group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="email" 
                                        placeholder="john@company.com" 
                                        value={formData.email} 
                                        onChange={e => handleChange('email', e.target.value)} 
                                        onBlur={() => handleBlur('email')}
                                        className={getInputBorderClass('email', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.email && !fieldErrors.email && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.email ? fieldErrors.email : ''} />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                <div className="relative mt-1 group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="tel" 
                                        placeholder="+92 3XX XXXXXXX" 
                                        value={formData.phone} 
                                        onChange={e => handleChange('phone', e.target.value)} 
                                        onBlur={() => handleBlur('phone')}
                                        className={getInputBorderClass('phone', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.phone && !fieldErrors.phone && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Temporary Password</label>
                                <div className="relative mt-1 group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={formData.password} 
                                        onChange={e => handleChange('password', e.target.value)} 
                                        onBlur={() => handleBlur('password')}
                                        className={getInputBorderClass('password', touched, fieldErrors, BASE_INPUT_PASS)} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <FieldError message={touched.password ? fieldErrors.password : ''} />
                                {/* Password strength hint */}
                                {touched.password && !fieldErrors.password && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-[11px] font-semibold mt-1.5 ml-1 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Strong password
                                    </motion.p>
                                )}
                            </div>

                            {/* Salary */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Annual Salary (₨)</label>
                                <div className="relative mt-1 group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₨</div>
                                    <input 
                                        type="number" 
                                        placeholder="60000" 
                                        value={formData.salary} 
                                        onChange={e => handleChange('salary', e.target.value)} 
                                        onBlur={() => handleBlur('salary')}
                                        className={getInputBorderClass('salary', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.salary && !fieldErrors.salary && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.salary ? fieldErrors.salary : ''} />
                            </div>
                        </div>

                        {/* Employment Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Employment Details</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Department</label>
                                <div className="relative mt-1 group">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
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
                            {/* Assign as Team Lead Toggle */}
                            {formData.role === 'employee' && (() => {
                                const selectedDeptObj = departmentsList.find(
                                    dept => dept.name.toLowerCase() === formData.department.toLowerCase()
                                );
                                const hasExistingLead = selectedDeptObj && selectedDeptObj.teamLead;
                                const existingLeadName = hasExistingLead ? (selectedDeptObj.teamLead.name || 'Another employee') : '';

                                return (
                                    <div className="space-y-2">
                                        <div
                                            onClick={() => {
                                                if (!hasExistingLead) {
                                                    setFormData({...formData, isTeamLead: !formData.isTeamLead});
                                                }
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                                hasExistingLead
                                                    ? 'border-slate-200 bg-slate-100/50 cursor-not-allowed opacity-60'
                                                    : formData.isTeamLead
                                                        ? 'border-amber-300 bg-amber-50 cursor-pointer'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl transition-colors ${
                                                    formData.isTeamLead ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    <Crown size={18} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${formData.isTeamLead ? 'text-amber-700' : 'text-slate-600'}`}>
                                                        Assign as Team Lead
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        This employee will lead the selected department
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                                                formData.isTeamLead ? 'bg-amber-500' : 'bg-slate-300'
                                            }`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                                    formData.isTeamLead ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                            </div>
                                        </div>
                                        {hasExistingLead && (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] font-semibold">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>
                                                    {existingLeadName} is already assigned as the Team Lead of this department.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reporting To</label>
                                <div className="relative mt-1 group">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input type="text" placeholder="Manager Name" value={formData.reportingTo} onChange={e => setFormData({...formData, reportingTo: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Employment Status</label>
                                <div className="relative mt-1 group">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none">
                                        <option value="full time">Full Time</option>
                                        <option value="probation">Probation</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Role</label>
                                <div className="relative mt-1 group">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none">
                                        <option value="employee">Employee</option>
                                        <option value="hr">HR Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <motion.button 
                                type="submit"
                                disabled={loading}
                                animate={submitShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                                transition={{ duration: 0.5 }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-base"
                            >
                                {loading ? 'Processing...' : <><UserPlus size={20} /> Register New Employee</>}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default AddEmployeePage;
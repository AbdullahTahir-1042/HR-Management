import toast from 'react-hot-toast';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Mail, Lock, User, Shield, Briefcase, Eye, EyeOff, Building2, UserCheck, Phone, Crown, AlertCircle, CheckCircle2, Award, Trash2 } from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ── Validation helpers ────────────────────────────────────────────────────────
const validators = {
    name: (val) => {
        if (!val.trim()) return 'Full name is required';
        const trimmed = val.trim();
        if (trimmed.length < 3) return 'Name must be at least 3 characters';
        if (trimmed.length > 50) return 'Name cannot exceed 50 characters';
        if (!/^[a-zA-Z\s.'\-]+$/.test(trimmed)) return 'Name can only contain letters, spaces, and hyphens';
        const words = trimmed.split(/\s+/);
        if (words.length < 2) return 'Please enter both first and last name (e.g. John Doe)';
        return '';
    },
    joiningStatus: (val) => {
        if (!val) return 'Employee Joining Status is required';
        if (!['Intern', 'Fresh Join'].includes(val)) return 'Invalid joining status selected';
        return '';
    },
    promotionRank: (val) => {
        if (!val) return 'Promotion Rank is required';
        const validRanks = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];
        if (!validRanks.includes(val)) return 'Invalid promotion rank selected';
        return '';
    },
    email: (val) => {
        if (!val.trim()) return 'Email address is required';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(val.trim())) return 'Please enter a valid work email (e.g. john@company.com)';
        return '';
    },
    phone: (val) => {
        if (!val.trim()) return 'Phone number is required';
        const trimmed = val.trim();
        const digits = trimmed.replace(/\D/g, '');

        // 1. Detect dummy repeated or sequential numbers (e.g. "1111111111", "0000000000", "1234567890")
        if (/^(\d)\1{8,}$/.test(digits)) {
            return 'Please enter a valid phone number (repetitive dummy digits are not allowed)';
        }
        if (digits === '1234567890' || digits === '0123456789' || digits === '9876543210') {
            return 'Please enter a valid phone number (sequential dummy digits are not allowed)';
        }

        // 2. Minimum / maximum digit count check
        if (digits.length < 10) return 'Phone number must contain at least 10 digits';
        if (digits.length > 15) return 'Phone number cannot exceed 15 digits';

        // 3. Local Mobile Operator Prefix Check (03XX XXXXXXX or +92 3XX XXXXXXX)
        if (trimmed.startsWith('03') || trimmed.startsWith('+923') || trimmed.startsWith('923')) {
            const pkDigits = trimmed.startsWith('+92') ? '0' + trimmed.slice(3).replace(/\D/g, '') :
                             trimmed.startsWith('92') ? '0' + trimmed.slice(2).replace(/\D/g, '') :
                             trimmed.replace(/\D/g, '');

            if (pkDigits.length !== 11) {
                return 'Pakistani mobile number must be exactly 11 digits (e.g. 0300 1234567 or +92 300 1234567)';
            }
            const prefix = pkDigits.slice(0, 4);
            const validPrefixes = [
                '0300','0301','0302','0303','0304','0305','0306','0307','0308','0309',
                '0310','0311','0312','0313','0314','0315','0316','0317','0318',
                '0320','0321','0322','0323','0324','0325',
                '0330','0331','0332','0333','0334','0335','0336','0337',
                '0340','0341','0342','0343','0344','0345','0346','0347','0348','0349',
                '0355','0370'
            ];
            if (!validPrefixes.includes(prefix)) {
                return 'Invalid mobile network prefix (must start with valid code like 0300, 0312, 0333, 0345)';
            }
            return '';
        }

        // 4. Standard International Number Check
        if (!/^\+?[1-9]\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/.test(trimmed)) {
            return 'Please enter a valid phone number (e.g. +92 300 1234567 or 0300 1234567)';
        }

        return '';
    },
    password: (val) => {
        if (!val) return 'Temporary password is required';
        if (val.length < 6) return 'Password must be at least 6 characters long';
        if (!/[a-zA-Z]/.test(val)) return 'Password must contain at least 1 letter';
        if (!/[0-9]/.test(val)) return 'Password must contain at least 1 number';
        return '';
    },
    salary: (val) => {
        if (val === '' || val === null || val === undefined) return 'Salary is required';
        const num = Number(val);
        if (isNaN(num) || num <= 0) return 'Salary must be a positive number';
        if (num < 10000) return 'Salary must be at least ₨ 10,000';
        if (num > 50000000) return 'Salary exceeds maximum limit';
        return '';
    },
    reportingTo: (val) => {
        if (val && val.trim()) {
            if (!/^[a-zA-Z\s.'\-]+$/.test(val.trim())) return 'Manager name can only contain letters and spaces';
        }
        return '';
    }
};

// ── Password Strength Calculator ──────────────────────────────────────────────
const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[a-zA-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (pass.length >= 8) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
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

// ── Password Strength Meter Component ─────────────────────────────────────────
const PasswordStrengthMeter = ({ password }) => {
    if (!password) return null;
    const strength = getPasswordStrength(password);

    return (
        <div className="mt-2 space-y-1 ml-1">
            <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((seg) => (
                    <div
                        key={seg}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                            seg <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Strength: <span className={strength.text}>{strength.label}</span></span>
                <span>Requirements: Min 6 characters (letters & numbers)</span>
            </div>
        </div>
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
        joiningStatus: 'Fresh Join',
        promotionRank: 'Junior',
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

    // Reset isTeamLead to false if the employee is an Intern
    useEffect(() => {
        const isIntern = formData.status === 'internship' || formData.joiningStatus === 'Intern' || formData.promotionRank === 'Intern';
        if (isIntern && formData.isTeamLead) {
            setFormData(prev => ({ ...prev, isTeamLead: false }));
        }
    }, [formData.status, formData.joiningStatus, formData.promotionRank]);

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
        let cleanedValue = value;
        if (fieldName === 'phone') {
            cleanedValue = value.replace(/[^0-9+]/g, '');
            if (cleanedValue.includes('+')) {
                cleanedValue = '+' + cleanedValue.replace(/\+/g, '');
            }
        }
        setFormData(prev => ({ ...prev, [fieldName]: cleanedValue }));
        // If already touched, re-validate on change for instant feedback
        if (touched[fieldName]) {
            const err = validateField(fieldName, cleanedValue);
            setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
        }
    };

    // ── Validate all fields before submit ─────────────────────────────────────
    const validateAll = () => {
        const fieldsToValidate = ['name', 'email', 'phone', 'password', 'salary', 'joiningStatus', 'promotionRank'];
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
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                e.target.value = null;
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPreview(null);
        setFormData({ ...formData, photo: '' });
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

    const BASE_INPUT = "input-field pl-10";
    const BASE_INPUT_PASS = "w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm";

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >


            <div className="card shadow-xl p-0 overflow-hidden">
                <div className="p-6 sm:p-10">
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
                            {preview && (
                                <button 
                                    type="button" 
                                    onClick={handleRemovePhoto} 
                                    className="mt-3 text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 justify-center transition-colors"
                                >
                                    <Trash2 size={12} /> Remove Photo
                                </button>
                            )}
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
                                <PasswordStrengthMeter password={formData.password} />
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
                                    <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="input-field pl-10">
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
                                
                                const isIntern = formData.status === 'internship' || formData.joiningStatus === 'Intern' || formData.promotionRank === 'Intern';

                                return (
                                    <div className="space-y-2">
                                        <div
                                            onClick={() => {
                                                if (!hasExistingLead && !isIntern) {
                                                    setFormData({...formData, isTeamLead: !formData.isTeamLead});
                                                }
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                                hasExistingLead || isIntern
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
                                        {isIntern && !hasExistingLead && (
                                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[11px] font-semibold">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>
                                                    Interns cannot be assigned as Team Leads.
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
                                    <input type="text" placeholder="Manager Name" value={formData.reportingTo} onChange={e => setFormData({...formData, reportingTo: e.target.value})} className="input-field pl-10" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Employment Status</label>
                                <div className="relative mt-1 group">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field pl-10">
                                        <option value="full time">Full Time</option>
                                        <option value="probation">Probation</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Promotion Rank (Career Level) *</label>
                                <div className="relative mt-1 group">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select 
                                        value={formData.promotionRank} 
                                        onChange={e => handleChange('promotionRank', e.target.value)} 
                                        onBlur={() => handleBlur('promotionRank')}
                                        className={getInputBorderClass('promotionRank', touched, fieldErrors, "input-field pl-10 font-bold text-indigo-600")}
                                    >
                                        <option value="Intern">Intern</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Associate">Associate</option>
                                        <option value="Mid-Level">Mid-Level</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Lead">Lead</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                    {touched.promotionRank && !fieldErrors.promotionRank && <CheckCircle2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.promotionRank ? fieldErrors.promotionRank : ''} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Employee Joining Status *</label>
                                <div className="relative mt-1 group">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select 
                                        value={formData.joiningStatus} 
                                        onChange={e => handleChange('joiningStatus', e.target.value)} 
                                        onBlur={() => handleBlur('joiningStatus')}
                                        className={getInputBorderClass('joiningStatus', touched, fieldErrors, "input-field pl-10")}
                                    >
                                        <option value="Fresh Join">Fresh Join</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                    {touched.joiningStatus && !fieldErrors.joiningStatus && <CheckCircle2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.joiningStatus ? fieldErrors.joiningStatus : ''} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Role</label>
                                <div className="relative mt-1 group">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="input-field pl-10">
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
                                className="btn-primary w-full py-4 text-base"
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
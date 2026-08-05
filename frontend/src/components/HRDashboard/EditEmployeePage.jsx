import toast from 'react-hot-toast';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Save, Mail, User, Shield, Briefcase, Building2,
    UserCheck, Image as ImageIcon, Phone, Crown, AlertCircle,
    TrendingUp, Award, CheckCircle2, Trash2, FileText, CalendarDays
} from 'lucide-react';
import apiClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';

// ── Validation Helpers ────────────────────────────────────────────────────────
const validators = {
    name: (val) => {
        if (!val || !val.trim()) return 'Full name is required';
        const trimmed = val.trim();
        if (trimmed.length < 3) return 'Name must be at least 3 characters';
        if (trimmed.length > 50) return 'Name cannot exceed 50 characters';
        if (!/^[a-zA-Z\s.'\-]+$/.test(trimmed)) return 'Name can only contain letters, spaces, and hyphens';
        const words = trimmed.split(/\s+/);
        if (words.length < 2) return 'Please enter both first and last name (e.g. John Doe)';
        return '';
    },
    email: (val) => {
        if (!val || !val.trim()) return 'Email address is required';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(val.trim())) return 'Please enter a valid work email (e.g. john@company.com)';
        return '';
    },
    phone: (val) => {
        if (!val || !val.trim()) return 'Phone number is required';
        const trimmed = val.trim();
        const digits = trimmed.replace(/\D/g, '');

        if (/^(\d)\1{8,}$/.test(digits)) {
            return 'Please enter a valid phone number (repetitive dummy digits are not allowed)';
        }
        if (digits === '1234567890' || digits === '0123456789' || digits === '9876543210') {
            return 'Please enter a valid phone number (sequential dummy digits are not allowed)';
        }

        if (digits.length < 10) return 'Phone number must contain at least 10 digits';
        if (digits.length > 15) return 'Phone number cannot exceed 15 digits';

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

        if (!/^\+?[1-9]\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/.test(trimmed)) {
            return 'Please enter a valid phone number (e.g. +92 300 1234567)';
        }

        return '';
    },
    password: (val) => {
        if (!val) return ''; // Optional for edits
        if (val.length < 6) return 'Password must be at least 6 characters';
        if (!/[a-zA-Z]/.test(val) || !/[0-9]/.test(val)) return 'Password must contain both letters and numbers';
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
    },
    promotionRank: (val) => {
        if (!val) return 'Promotion Rank is required';
        const validRanks = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];
        if (!validRanks.includes(val)) return 'Invalid promotion rank selected';
        return '';
    },
    joiningStatus: (val) => {
        if (!val) return 'Joining Status is required';
        if (!['Intern', 'Fresh Join'].includes(val)) return 'Invalid joining status selected';
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

// ── Compute Input Border Styling ──────────────────────────────────────────────
const getInputBorderClass = (fieldName, touched, errors, baseClass) => {
    if (!touched[fieldName]) return baseClass;
    if (errors[fieldName]) return baseClass.replace('border-slate-200', 'border-rose-300').replace('focus:border-indigo-500', 'focus:border-rose-500').replace('focus:ring-indigo-500/10', 'focus:ring-rose-500/10');
    return baseClass.replace('border-slate-200', 'border-emerald-300').replace('focus:border-indigo-500', 'focus:border-emerald-500').replace('focus:ring-indigo-500/10', 'focus:ring-emerald-500/10');
};

const EditEmployeePage = ({ employee, onBack, onEmployeeUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        status: 'full time',
        joiningStatus: 'Fresh Join',
        promotionRank: 'Junior',
        department: 'development',
        reportingTo: '',
        salary: '',
        photo: '',
        isTeamLead: false,
        contractDetails: {
            contractType: 'Full-Time',
            startDate: '',
            endDate: '',
            summary: ''
        }
    });
    const [departmentsList, setDepartmentsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const { user: currentUser } = useContext(AuthContext);

    const isHRUser = currentUser?.role === 'hr';
    const disableProtectedFields = false;

    // ── Validation State ──────────────────────────────────────────────────────
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitShake, setSubmitShake] = useState(false);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await apiClient.get('/departments');
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
                joiningStatus: employee.joiningStatus || 'Fresh Join',
                promotionRank: employee.promotionRank || 'Junior',
                department: employee.department || 'development',
                reportingTo: employee.reportingTo || '',
                salary: employee.salary || '',
                photo: employee.photo || '',
                isTeamLead: employee.isTeamLead || false,
                contractDetails: employee.contractDetails || {
                    contractType: 'Full-Time',
                    startDate: '',
                    endDate: '',
                    summary: ''
                }
            });
            setPreview(employee.photo || null);
        }
    }, [employee]);

    // Reset isTeamLead to false if the selected department already has a different Team Lead
    useEffect(() => {
        const selectedDeptObj = departmentsList.find(
            dept => dept.name.toLowerCase() === formData.department.toLowerCase()
        );
        const hasExistingLead = selectedDeptObj && selectedDeptObj.teamLead && (
            typeof selectedDeptObj.teamLead === 'object'
                ? selectedDeptObj.teamLead._id !== (employee?._id || '')
                : selectedDeptObj.teamLead !== (employee?._id || '')
        );
        if (hasExistingLead && formData.isTeamLead) {
            setFormData(prev => ({ ...prev, isTeamLead: false }));
        }
    }, [formData.department, departmentsList, employee]);

    // Reset isTeamLead to false if the employee is an Intern
    useEffect(() => {
        const isIntern = formData.status === 'internship' || formData.joiningStatus === 'Intern' || formData.promotionRank === 'Intern';
        if (isIntern && formData.isTeamLead) {
            setFormData(prev => ({ ...prev, isTeamLead: false }));
        }
    }, [formData.status, formData.joiningStatus, formData.promotionRank]);

    // ── Validate single field ────────────────────────────────────────────────
    const validateField = useCallback((fieldName, value) => {
        const validator = validators[fieldName];
        if (!validator) return '';
        return validator(value);
    }, []);

    // ── Handle field blur ────────────────────────────────────────────────────
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        const err = validateField(fieldName, formData[fieldName]);
        setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
    };

    // ── Handle field change ──────────────────────────────────────────────────
    const handleChange = (fieldName, value) => {
        let cleanedValue = value;
        if (fieldName === 'phone') {
            cleanedValue = value.replace(/[^0-9+]/g, '');
            if (cleanedValue.includes('+')) {
                cleanedValue = '+' + cleanedValue.replace(/\+/g, '');
            }
        }
        setFormData(prev => ({ ...prev, [fieldName]: cleanedValue }));
        if (touched[fieldName]) {
            const err = validateField(fieldName, cleanedValue);
            setFieldErrors(prev => ({ ...prev, [fieldName]: err }));
        }
    };

    // ── Validate all fields before submission ───────────────────────────────
    const validateAll = () => {
        const fieldsToValidate = ['name', 'email', 'phone', 'salary', 'reportingTo', 'promotionRank', 'joiningStatus'];
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
            const res = await apiClient.put(`/auth/users/${employee._id}`, formData);
            onEmployeeUpdated(res.data);
            onBack();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update employee');
        } finally {
            setLoading(false);
        }
    };

    const BASE_INPUT = "input-field pl-10";

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >


            <div className="card p-0 overflow-hidden shadow-xl">
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
                                        <ImageIcon size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/80 rounded-3xl transition-all cursor-pointer">
                                    <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 uppercase tracking-wider">Change</span>
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
                            <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Photo</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Basic Information</h3>
                            
                            {/* Full Name */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name *</label>
                                <div className="relative mt-1 group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address *</label>
                                <div className="relative mt-1 group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="email" 
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number *</label>
                                <div className="relative mt-1 group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="tel" 
                                        value={formData.phone} 
                                        onChange={e => handleChange('phone', e.target.value)} 
                                        onBlur={() => handleBlur('phone')}
                                        className={getInputBorderClass('phone', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.phone && !fieldErrors.phone && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                            </div>
                        </div>

                        {/* Security & Access */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Security & Access</h3>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Temporary Password (Optional)</label>
                                <div className="relative mt-1 group">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={formData.password || ''} 
                                        onChange={e => handleChange('password', e.target.value)} 
                                        onBlur={() => handleBlur('password')}
                                        placeholder="Enter to reset employee's password"
                                        className={getInputBorderClass('password', touched, fieldErrors, BASE_INPUT)} 
                                    />
                                    {touched.password && !fieldErrors.password && formData.password && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">If provided, the employee will be forced to change this upon next login.</p>
                                <FieldError message={touched.password ? fieldErrors.password : ''} />
                            </div>
                        </div>

                        {/* Employment Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Employment Details</h3>
                            <div className="grid grid-cols-1 gap-4">
                                
                                {/* Department */}
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
                                    const hasExistingLead = selectedDeptObj && selectedDeptObj.teamLead && (
                                        typeof selectedDeptObj.teamLead === 'object'
                                            ? selectedDeptObj.teamLead._id !== (employee?._id || '')
                                            : selectedDeptObj.teamLead !== (employee?._id || '')
                                    );
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

                                {/* Reporting To */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reporting To</label>
                                    <div className="relative mt-1 group">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            value={formData.reportingTo} 
                                            onChange={e => handleChange('reportingTo', e.target.value)} 
                                            onBlur={() => handleBlur('reportingTo')}
                                            className={getInputBorderClass('reportingTo', touched, fieldErrors, BASE_INPUT)} 
                                        />
                                        {touched.reportingTo && !fieldErrors.reportingTo && formData.reportingTo && <CheckCircle2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                    </div>
                                    <FieldError message={touched.reportingTo ? fieldErrors.reportingTo : ''} />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                    <div className="relative mt-1 group">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select disabled={disableProtectedFields} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`input-field pl-10 ${disableProtectedFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}>
                                            <option value="full time">Full Time</option>
                                            <option value="probation">Probation</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Promotion Rank */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Promotion Rank (Career Level) *</label>
                                    <div className="relative mt-1 group">
                                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select 
                                            value={formData.promotionRank} 
                                            onChange={e => handleChange('promotionRank', e.target.value)} 
                                            onBlur={() => handleBlur('promotionRank')}
                                            className={getInputBorderClass('promotionRank', touched, fieldErrors, "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none")}
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

                                {/* Joining Status */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Joining Status *</label>
                                    <div className="relative mt-1 group">
                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select 
                                            value={formData.joiningStatus} 
                                            onChange={e => handleChange('joiningStatus', e.target.value)} 
                                            onBlur={() => handleBlur('joiningStatus')}
                                            className={getInputBorderClass('joiningStatus', touched, fieldErrors, "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none")}
                                        >
                                            <option value="Fresh Join">Fresh Join</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                        {touched.joiningStatus && !fieldErrors.joiningStatus && <CheckCircle2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                    </div>
                                    <FieldError message={touched.joiningStatus ? fieldErrors.joiningStatus : ''} />
                                </div>

                                {/* Monthly Salary */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monthly Salary (₨) *</label>
                                    <div className="relative mt-1 group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₨</div>
                                        <input 
                                            type="number" 
                                            disabled={disableProtectedFields}
                                            value={formData.salary} 
                                            onChange={e => handleChange('salary', e.target.value)} 
                                            onBlur={() => handleBlur('salary')}
                                            className={`${getInputBorderClass('salary', touched, fieldErrors, BASE_INPUT)} ${disableProtectedFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                                        />
                                        {touched.salary && !fieldErrors.salary && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                    </div>
                                    <FieldError message={touched.salary ? fieldErrors.salary : ''} />
                                </div>

                                {/* Account Role */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Role</label>
                                    <div className="relative mt-1 group">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select disabled={disableProtectedFields} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={`input-field pl-10 ${disableProtectedFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}>
                                            <option value="employee">Standard Employee</option>
                                            <option value="hr">HR Administrator</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contract Details */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                                <FileText size={16} /> Contract Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contract Type</label>
                                    <div className="relative mt-1 group">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select 
                                            value={formData.contractDetails?.contractType || 'Full-Time'} 
                                            onChange={e => setFormData({...formData, contractDetails: {...formData.contractDetails, contractType: e.target.value}})} 
                                            className={`input-field pl-10 ${disableProtectedFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                                            disabled={disableProtectedFields}
                                        >
                                            <option value="Full-Time">Full-Time</option>
                                            <option value="Part-Time">Part-Time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Date</label>
                                    <div className="relative mt-1 group">
                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input 
                                            type="date" 
                                            value={formData.contractDetails?.startDate ? formData.contractDetails.startDate.split('T')[0] : ''} 
                                            readOnly
                                            className={`input-field pl-10 opacity-70 bg-slate-100 pointer-events-none cursor-default`} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Date (Extendable)</label>
                                    <div className="relative mt-1 group">
                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input 
                                            type="date" 
                                            value={formData.contractDetails?.endDate ? formData.contractDetails.endDate.split('T')[0] : ''} 
                                            onChange={e => setFormData({...formData, contractDetails: {...formData.contractDetails, endDate: e.target.value}})} 
                                            className={`input-field pl-10 ${disableProtectedFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`} 
                                            disabled={disableProtectedFields}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contract Summary / Terms (Non-editable)</label>
                                <textarea
                                    value={formData.contractDetails?.summary || ''}
                                    readOnly
                                    className={`w-full p-4 mt-1 border border-slate-200 rounded-2xl outline-none transition-all text-sm resize-none h-24 opacity-70 bg-slate-100 pointer-events-none cursor-default`}
                                    placeholder="Contract summary..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="md:col-span-2 pt-6">
                            <motion.button 
                                type="submit"
                                disabled={loading}
                                animate={submitShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                                transition={{ duration: 0.5 }}
                                className="btn-primary w-full py-4 text-base"
                            >
                                {loading ? 'Saving Changes...' : <><Save size={20} /> Update Employee Profile</>}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default EditEmployeePage;

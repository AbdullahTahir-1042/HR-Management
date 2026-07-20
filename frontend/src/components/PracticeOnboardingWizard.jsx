import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
    Settings, Bell, ChevronDown, UploadCloud, Globe, MapPin, 
    ShieldAlert, Sparkles, Check, CheckCircle2, AlertCircle, X,
    Search, ExternalLink, Trash2, User, Award, Briefcase, Palette
} from 'lucide-react';

const PracticeOnboardingWizard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const redirectBack = () => {
        if (user?.role === 'hr') {
            navigate('/hr');
        } else {
            navigate('/employee');
        }
    };

    // Form data state
    const [formData, setFormData] = useState({
        practiceName: '',
        phoneCountry: 'US',
        phoneNumber: '',
        email: '',
        website: '',
        registrationNumber: '',
        legalName: '',
        faxNumber: '',
        country: '',
        city: '',
        stateProvince: '',
        street: '',
        zipPostalCode: '',
        timeZone: '',
        logo: '',
        facebookUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        googleBusinessUrl: '',
        twitterUrl: '',
        yelpUrl: ''
    });

    // Load existing practice info on mount
    useEffect(() => {
        const loadPracticeInfo = async () => {
            try {
                const res = await apiClient.get('/practice');
                if (res.data && res.data._id) {
                    setFormData(res.data);
                    if (res.data.currentStep) {
                        setCurrentStep(res.data.currentStep);
                    }
                }
            } catch (err) {
                console.error("Error fetching practice info:", err);
            } finally {
                setFetching(false);
            }
        };
        loadPracticeInfo();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Providers state and handlers
    const [providers, setProviders] = useState([]);
    const [providersLoading, setProvidersLoading] = useState(false);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providerForm, setProviderForm] = useState({
        firstName: '',
        lastName: '',
        preferredName: '',
        internalCodeName: '',
        phoneCountry: 'US',
        phoneNumber: '',
        email: '',
        licenseNumber: '',
        npi: '',
        federalTaxNumber: '',
        dea: '',
        specialty: '',
        taxIdType: '',
        providerType: 'Dentist',
        profileColor: '#f97316',
        signatureOnFile: false
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setProvidersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/practice/providers`, config);
            setProviders(res.data);
        } catch (err) {
            console.error("Error fetching providers:", err);
        } finally {
            setProvidersLoading(false);
        }
    };

    const handleAddProviderSubmit = async (e) => {
        e.preventDefault();
        if (
            !providerForm.firstName.trim() ||
            !providerForm.lastName.trim() ||
            !providerForm.phoneNumber.trim() ||
            !providerForm.email.trim() ||
            !providerForm.licenseNumber.trim() ||
            !providerForm.federalTaxNumber.trim() ||
            !providerForm.specialty.trim()
        ) {
            alert("Please fill out all required fields marked with * (First Name, Last Name, Phone, Email, License, Federal Tax, Specialty).");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/practice/providers`, providerForm, config);
            setProviders([...providers, res.data]);
            setProviderForm({
                firstName: '',
                lastName: '',
                preferredName: '',
                internalCodeName: '',
                phoneCountry: 'US',
                phoneNumber: '',
                email: '',
                licenseNumber: '',
                npi: '',
                federalTaxNumber: '',
                dea: '',
                specialty: '',
                taxIdType: '',
                providerType: 'Dentist',
                profileColor: '#f97316',
                signatureOnFile: false
            });
            setShowProviderModal(false);
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to add provider.");
        }
    };

    const handleDeleteProvider = async (id) => {
        if (!window.confirm("Are you sure you want to delete this provider?")) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.delete(`${import.meta.env.VITE_API_URL}/practice/providers/${id}`, config);
            setProviders(providers.filter(p => p._id !== id));
        } catch (err) {
            console.error("Error deleting provider:", err);
            alert("Failed to delete provider.");
        }
    };

    // Handle base64 logo upload
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Limit to images and check file size (e.g. 2MB)
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({
                ...formData,
                logo: reader.result
            });
        };
        reader.readAsDataURL(file);
    };

    const triggerLogoInput = () => {
        document.getElementById('logo-file-input').click();
    };

    const handleRemoveLogo = (e) => {
        e.stopPropagation();
        setFormData({
            ...formData,
            logo: ''
        });
    };

    // Save Data to Backend
    const handleSave = async (stepToSave) => {
        // Validation
        if (!formData.practiceName.trim()) {
            setErrorMessage("Practice Name is required.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        if (!formData.phoneNumber.trim()) {
            setErrorMessage("Phone Number is required.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        if (!formData.city.trim()) {
            setErrorMessage("City is required.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        if (!formData.stateProvince.trim()) {
            setErrorMessage("State/Province is required.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const body = {
                ...formData,
                currentStep: stepToSave
            };
            const res = await apiClient.post('/practice', body);
            setFormData(res.data);
            setSuccessMessage("Practice settings saved successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
            return true;
        } catch (err) {
            console.error("Error saving practice info:", err);
            setErrorMessage(err.response?.data?.msg || "Failed to save settings. Please try again.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const success = await handleSave(currentStep + 1);
        if (success) {
            if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("You have completed all onboarding steps!");
                redirectBack();
            }
        }
    };

    const handleFinishLater = async () => {
        const success = await handleSave(currentStep);
        if (success) {
            redirectBack();
        }
    };

    // Steps configuration
    const steps = [
        { num: 1, label: 'Practice Info' },
        { num: 2, label: 'Providers' },
        { num: 3, label: 'Users' },
        { num: 4, label: 'Opening Hours' },
        { num: 5, label: 'Schedule Setup' },
        { num: 6, label: 'Billing Configuration' }
    ];

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#f8fafc] min-h-screen text-slate-700 flex flex-col font-sans overflow-x-hidden">
            {/* Main content container */}
            <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-6">
                {/* Exit Onboarding Back Button */}
                <div className="flex justify-start">
                    <button
                        onClick={redirectBack}
                        className="flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-indigo-600 transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow"
                    >
                        ← Exit Onboarding
                    </button>
                </div>

                {/* Save status alerts */}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}
                {errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
                        <AlertCircle className="text-rose-500 shrink-0" size={18} />
                        <span className="font-semibold">{errorMessage}</span>
                    </div>
                )}

                {/* Unified Onboarding Container */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Onboarding Header Title inside the card */}
                    <div className="text-center space-y-1 pt-8 px-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Practice Onboarding</h2>
                        <p className="text-xs text-slate-400 font-semibold">Complete the steps below to setup your practice</p>
                    </div>

                    <div className="relative flex items-center justify-between max-w-3xl mx-auto px-12 pt-4 pb-8">
                        {/* Connecting Line background */}
                        <div className="absolute top-[30px] left-0 right-0 h-0.5 bg-slate-200 z-0"></div>
                        
                        {/* Interactive blue active line */}
                        <div 
                            className="absolute top-[30px] left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                        ></div>

                        {steps.map((s) => {
                            const isActive = s.num === currentStep;
                            const isCompleted = s.num < currentStep;
                            return (
                                <div 
                                    key={s.num} 
                                    onClick={() => setCurrentStep(s.num)}
                                    className="flex flex-col items-center space-y-2.5 z-10 cursor-pointer"
                                >
                                    <div 
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                            isActive 
                                                ? 'border-blue-600 bg-white ring-4 ring-blue-50' 
                                                : isCompleted 
                                                    ? 'border-blue-600 bg-white' 
                                                    : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        {(isCompleted || isActive) ? (
                                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-fade-in"></div>
                                        ) : null}
                                    </div>
                                    <span 
                                        className={`text-[10px] font-extrabold tracking-tight text-center max-w-[80px] leading-tight ${
                                            isActive ? 'text-blue-600' : 'text-slate-400 font-semibold'
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                {/* STEP 1 FORM: PRACTICE INFO */}
                {currentStep === 1 ? (
                    <>
                            {/* Section header */}
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200/60 flex items-center gap-3">
                                <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">
                                    <Settings size={18} />
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Practice Information</h3>
                            </div>

                            {/* Section Inputs */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Practice Name */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">
                                        Practice Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="practiceName"
                                        placeholder="Enter Practice Name"
                                        value={formData.practiceName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">
                                        Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative shrink-0">
                                            <select
                                                name="phoneCountry"
                                                value={formData.phoneCountry}
                                                onChange={handleChange}
                                                className="h-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none pr-8 cursor-pointer"
                                            >
                                                <option value="US">US</option>
                                                <option value="PK">PK</option>
                                                <option value="GB">GB</option>
                                                <option value="CA">CA</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            placeholder="(XXX) XXX-XXXX"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter Your Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Website */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Website</label>
                                    <input
                                        type="text"
                                        name="website"
                                        placeholder="Enter Your Website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Registration Number */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Registration Number</label>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        placeholder="Enter Business Number"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Legal Name */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Legal Name</label>
                                    <input
                                        type="text"
                                        name="legalName"
                                        placeholder="Enter Legal Name"
                                        value={formData.legalName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Fax Number */}
                                <div className="space-y-1 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500">Fax Number</label>
                                    <input
                                        type="text"
                                        name="faxNumber"
                                        placeholder="Enter Fax Number"
                                        value={formData.faxNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Section header */}
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200/60 flex items-center gap-3">
                                <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">
                                    <MapPin size={18} />
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Address & Location Details</h3>
                            </div>

                            {/* Section Inputs */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Country */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Enter your Country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">
                                        City <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="Enter your City"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* State/Province */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">
                                        State/Province <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="stateProvince"
                                        placeholder="Enter State/Province"
                                        value={formData.stateProvince}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Street */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Street</label>
                                    <input
                                        type="text"
                                        name="street"
                                        placeholder="Enter your Address"
                                        value={formData.street}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Zip/Postal Code */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Zip/Postal Code</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="zipPostalCode"
                                            placeholder="Enter Zip/Postal Code"
                                            value={formData.zipPostalCode}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-8"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>

                                {/* Time Zone */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Time Zone</label>
                                    <input
                                        type="text"
                                        name="timeZone"
                                        placeholder="Enter your Timezone"
                                        value={formData.timeZone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Section header */}
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200/60 flex items-center gap-3">
                                <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">
                                    <UploadCloud size={18} />
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Upload your Office Logo</h3>
                            </div>

                            {/* Logo File upload container */}
                            <div className="p-6">
                                <input 
                                    type="file" 
                                    id="logo-file-input" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload}
                                />
                                
                                <div 
                                    onClick={triggerLogoInput}
                                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/30 hover:bg-blue-50/10 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                                >
                                    {formData.logo ? (
                                        <div className="relative group max-w-[200px] rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img 
                                                src={formData.logo} 
                                                alt="Office Logo Preview" 
                                                className="w-full object-contain aspect-square max-h-[140px]"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                <button 
                                                    type="button" 
                                                    onClick={handleRemoveLogo}
                                                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 shadow transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-slate-400 mb-3" size={36} />
                                            <span className="text-sm font-bold text-slate-700">Click to upload or drag and drop</span>
                                            <span className="text-xs text-slate-400 mt-1">Please make sure the Image does not exceed 500×500</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Section header */}
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200/60 flex items-center gap-3">
                                <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">
                                    <Globe size={18} />
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Social Media Link</h3>
                            </div>

                            {/* Section Inputs */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Facebook */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Facebook Page Url</label>
                                    <input
                                        type="url"
                                        name="facebookUrl"
                                        placeholder="Enter Facebook URI"
                                        value={formData.facebookUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Instagram */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Instagram Url</label>
                                    <input
                                        type="url"
                                        name="instagramUrl"
                                        placeholder="Enter Instagram Url"
                                        value={formData.instagramUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* LinkedIn */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">LinkedIn Url</label>
                                    <input
                                        type="url"
                                        name="linkedinUrl"
                                        placeholder="Enter LinkedIn Url"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Google Business */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Google Business Url</label>
                                    <input
                                        type="url"
                                        name="googleBusinessUrl"
                                        placeholder="Enter Business Url"
                                        value={formData.googleBusinessUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Twitter */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Twitter Page Url</label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            name="twitterUrl"
                                            placeholder="Enter Twitter Url"
                                            value={formData.twitterUrl}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-8"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>

                                {/* Yelp */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500">Yelp Url</label>
                                    <input
                                        type="url"
                                        name="yelpUrl"
                                        placeholder="Enter Yelp Url"
                                        value={formData.yelpUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                    </>
                ) : currentStep === 2 ? (
                    // PROVIDERS STEP (Step 2)
                    <div className="p-8 space-y-6">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">PROVIDERS</h3>
                        </div>

                        {/* Providers Table */}
                        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4">Provider</th>
                                            <th className="px-6 py-4">Speciality</th>
                                            <th className="px-6 py-4">Provider Type</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Telephone Number</th>
                                            <th className="px-6 py-4 text-center w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                                        {providersLoading ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                                                </td>
                                            </tr>
                                        ) : providers.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                    No providers added yet. Click "Add Providers" below to start.
                                                </td>
                                            </tr>
                                        ) : (
                                            providers.map((prov) => (
                                                <tr key={prov._id} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 text-slate-800 font-bold">{prov.firstName} {prov.lastName}</td>
                                                    <td className="px-6 py-4 text-slate-600">{prov.specialty || 'General Dentistry'}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-bold">{prov.providerType}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-normal">{prov.email}</td>
                                                    <td className="px-6 py-4 text-slate-500">+{prov.phoneCountry} {prov.phoneNumber}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteProvider(prov._id)}
                                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-all"
                                                            title="Delete Provider"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Add Providers button wrapper */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => setShowProviderModal(true)}
                                className="px-5 py-2.5 bg-white border border-blue-500 hover:bg-blue-50 text-blue-600 font-extrabold rounded-xl text-sm transition-all"
                            >
                                Add Providers
                            </button>
                        </div>
                    </div>
                ) : (
                    // MOCK INTERFACE FOR OTHER STEPS
                    <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                            <Sparkles size={28} />
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-lg">Step {currentStep}: {steps[currentStep-1]?.label}</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            This step will let you configure the {steps[currentStep-1]?.label.toLowerCase()} settings for your clinic. Click Next to save and continue or previous step to go back.
                        </p>
                        <button 
                            type="button"
                            onClick={() => setCurrentStep(1)} 
                            className="text-xs text-blue-600 hover:text-blue-800 font-extrabold underline"
                        >
                            Return to Practice Info
                        </button>
                    </div>
                )}

                {/* Footer actions inside the unified container */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200">
                    {/* Return button if on later steps */}
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all"
                        >
                            Back
                        </button>
                    )}

                    {/* Finish Later Button */}
                    <button
                        type="button"
                        onClick={handleFinishLater}
                        disabled={loading}
                        className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-sm transition-all"
                    >
                        Finish Later
                    </button>

                    {/* Next Button */}
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm shadow-md shadow-blue-100 transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : null}
                        <span>{currentStep === 6 ? 'Submit' : 'Next'}</span>
                    </button>
                </div>
                </div>
            </main>

            {/* 5. Add Provider Modal Overlay */}
            {showProviderModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden text-left my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="text-blue-600 bg-blue-100 p-2.5 rounded-full">
                                    <Settings size={22} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-lg">Add Providers</h4>
                                    <p className="text-xs text-slate-400 font-semibold">Add new Providers</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowProviderModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddProviderSubmit}>
                            {/* Section 1: Personal Information */}
                            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200/60 flex items-center gap-2.5">
                                <div className="text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                                    <User size={16} />
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-sm tracking-tight">Personal Information</h5>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100">
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">First Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter First Name"
                                        value={providerForm.firstName}
                                        onChange={(e) => setProviderForm({ ...providerForm, firstName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Last Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter Last Name"
                                        value={providerForm.lastName}
                                        onChange={(e) => setProviderForm({ ...providerForm, lastName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Preferred Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Preferred Name"
                                        value={providerForm.preferredName}
                                        onChange={(e) => setProviderForm({ ...providerForm, preferredName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Internal Code Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Internal Code"
                                        value={providerForm.internalCodeName}
                                        onChange={(e) => setProviderForm({ ...providerForm, internalCodeName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Mobile Phone Number <span className="text-rose-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="relative shrink-0">
                                            <select
                                                value={providerForm.phoneCountry}
                                                onChange={(e) => setProviderForm({ ...providerForm, phoneCountry: e.target.value })}
                                                className="h-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none pr-8 cursor-pointer"
                                            >
                                                <option value="US">US</option>
                                                <option value="PK">PK</option>
                                                <option value="GB">GB</option>
                                                <option value="CA">CA</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="(XXX) XXX-XXXX"
                                            value={providerForm.phoneNumber}
                                            onChange={(e) => setProviderForm({ ...providerForm, phoneNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Email <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        placeholder="Enter Your Email"
                                        value={providerForm.email}
                                        onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section 2: Professional & Licensing Information */}
                            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200/60 flex items-center gap-2.5">
                                <div className="text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                                    <Award size={16} />
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-sm tracking-tight">Professional & Licensing Information</h5>
                            </div>
                            <div className="px-6 py-5 space-y-4 border-b border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-extrabold text-slate-600">License Number <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter License Number"
                                            value={providerForm.licenseNumber}
                                            onChange={(e) => setProviderForm({ ...providerForm, licenseNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-extrabold text-slate-600">NPI</label>
                                        <input
                                            type="text"
                                            placeholder="Enter NPI"
                                            value={providerForm.npi}
                                            onChange={(e) => setProviderForm({ ...providerForm, npi: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-extrabold text-slate-600">Federal Tax Number <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter Federal Tax Number"
                                            value={providerForm.federalTaxNumber}
                                            onChange={(e) => setProviderForm({ ...providerForm, federalTaxNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-extrabold text-slate-600">DEA</label>
                                        <input
                                            type="text"
                                            placeholder="Enter DEA"
                                            value={providerForm.dea}
                                            onChange={(e) => setProviderForm({ ...providerForm, dea: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Speciality <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={providerForm.specialty}
                                            onChange={(e) => setProviderForm({ ...providerForm, specialty: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none pr-8 cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Speciality</option>
                                            <option value="General Dentistry">General Dentistry</option>
                                            <option value="Orthodontics">Orthodontics</option>
                                            <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                                            <option value="Periodontics">Periodontics</option>
                                            <option value="Oral Surgery">Oral Surgery</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Provider Type & Tax Detail */}
                            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200/60 flex items-center gap-2.5">
                                <div className="text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                                    <Briefcase size={16} />
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-sm tracking-tight">Provider Type & Tax Detail</h5>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100">
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Tax Id Type</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Tax Id Type"
                                        value={providerForm.taxIdType}
                                        onChange={(e) => setProviderForm({ ...providerForm, taxIdType: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-extrabold text-slate-600">Provider Type</label>
                                    <div className="relative">
                                        <select
                                            value={providerForm.providerType}
                                            onChange={(e) => setProviderForm({ ...providerForm, providerType: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none pr-8 cursor-pointer"
                                        >
                                            <option value="Dentist">Dentist</option>
                                            <option value="DDS">DDS</option>
                                            <option value="DMD">DMD</option>
                                            <option value="MD">MD</option>
                                            <option value="Hygienist">Hygienist</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Profile Background Color */}
                            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200/60 flex items-center gap-2.5">
                                <div className="text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                                    <Palette size={16} />
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-sm tracking-tight">Profile Background Color</h5>
                            </div>
                            <div className="px-6 py-5 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-extrabold text-slate-600">Colors</label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {[
                                                '#f97316', '#10b981', '#ec4899',
                                                '#8b5cf6', '#3b82f6', '#14b8a6'
                                            ].map((c) => {
                                                const isSelected = providerForm.profileColor === c;
                                                return (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setProviderForm({ ...providerForm, profileColor: c })}
                                                        style={{ backgroundColor: c }}
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                                            isSelected ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow' : 'opacity-80 hover:opacity-100'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="text-white" size={12} strokeWidth={3} />}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                className="w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-slate-400 text-slate-400 flex items-center justify-center text-xs font-extrabold"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="block text-[9px] text-slate-400 font-semibold leading-tight pt-1">
                                            The color for the provider show on the appointment card and as a background for the provider name in the different parts of the software.
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="checkbox"
                                            id="signature-on-file"
                                            checked={providerForm.signatureOnFile}
                                            onChange={(e) => setProviderForm({ ...providerForm, signatureOnFile: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <label htmlFor="signature-on-file" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                                            Signature on the File
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProviderModal(false)}
                                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm shadow-md shadow-blue-100 transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PracticeOnboardingWizard;

import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Printer, 
  MapPin, 
  UploadCloud, 
  Link, 
  ChevronDown, 
  Bell, 
  Settings, 
  Search, 
  Sliders, 
  Check, 
  User, 
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CreditCard,
  Info,
  Users as UsersIcon,
  UserPlus,
  CalendarClock,
  Upload,
  Share2,
  X,
  ArrowLeft,
  CloudUpload,
  CircleUser,
  Link2,
} from 'lucide-react';

const Facebook = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const countriesList = [
  { code: 'us', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'ca', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'gb', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'au', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'in', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'pk', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'ae', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'sa', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'de', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'sg', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'nz', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'za', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ie', dialCode: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: 'my', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'mx', dialCode: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: 'br', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'cn', dialCode: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'jp', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'tr', dialCode: '+90', name: 'Turkey', flag: '🇹🇷' }
];


const COMPILATION_ID = "build_20260713_195100";

const STEPS = [
  { label: 'Practice Info', icon: Info },
  { label: 'Providers', icon: UserPlus },
  { label: 'Users', icon: UsersIcon },
  { label: 'Opening Hours', icon: Clock },
  { label: 'Schedule\nSetup', icon: CalendarClock },
  { label: 'Billing\nConfiguration', icon: CreditCard },
];

const countryCodes = [
  { code: 'us', flag: '🇺🇸', label: 'US (+1)' },
  { code: 'uk', flag: '🇬🇧', label: 'UK (+44)' },
  { code: 'pk', flag: '🇵🇰', label: 'PK (+92)' },
  { code: 'in', flag: '🇮🇳', label: 'IN (+91)' },
  { code: 'au', flag: '🇦🇺', label: 'AU (+61)' },
];

const DEFAULT_PROVIDERS = [
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
  { name: "Amanda Wilson", speciality: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
];

const DEFAULT_USERS = [
  { name: "Sarah Wells", role: "Administrator", email: "sarah.wells@medflow.com", phone: "+1 (555) 019-2834", status: "Active" },
  { name: "Ali Tariq", role: "Dentist", email: "ali.tariq@medflow.com", phone: "+1 (555) 019-5829", status: "Active" },
  { name: "Amanda Wilson", role: "Dentist", email: "saramitchel@medflow.com", phone: "—", status: "Active" },
];

const WEEK_DAYS = [
  { name: "Monday", active: true, start: "09:00 AM", end: "05:00 PM" },
  { name: "Tuesday", active: true, start: "09:00 AM", end: "05:00 PM" },
  { name: "Wednesday", active: true, start: "09:00 AM", end: "05:00 PM" },
  { name: "Thursday", active: true, start: "09:00 AM", end: "05:00 PM" },
  { name: "Friday", active: true, start: "09:00 AM", end: "05:00 PM" },
  { name: "Saturday", active: false, start: "10:00 AM", end: "02:00 PM" },
  { name: "Sunday", active: false, start: "10:00 AM", end: "02:00 PM" },
];

const TIME_OPTIONS = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
  "07:00 PM", "08:00 PM", "09:00 PM"
];

const PRESET_COLORS = [
  '#4dd0e1', 
  '#ffb74d', 
  '#fff176', 
  '#f06292', 
  '#ba68c8', 
  '#64b5f6', 
  '#81c784', 
  '#4db6ac', 
];

const BoxTextInput = ({ label, placeholder, required, value, onChange, type = 'text', error }) => (
  <div className="flex flex-col gap-1 text-left w-full">
    <label className="text-[11.5px] font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 text-[12.5px] border rounded-lg bg-white text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 hover:border-slate-300
        ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200'}`}
    />
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

const BoxSelectInput = ({ label, placeholder, required, value, onChange, options = [], error }) => (
  <div className="flex flex-col gap-1 text-left relative w-full">
    <label className="text-[11.5px] font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 text-[12.5px] border rounded-lg bg-white text-slate-800 outline-none appearance-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 hover:border-slate-300 cursor-pointer
          ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200'}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

const BoxPhoneInput = ({ label, required, phone, setPhone, countryCode, setCountryCode, error }) => (
  <div className="flex flex-col gap-1 text-left w-full">
    <label className="text-[11.5px] font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className={`flex border rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 hover:border-slate-300
      ${error ? 'border-red-400 focus-within:border-red-500' : 'border-slate-200'}`}>
      <div className="relative flex-shrink-0">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="h-full pl-3 pr-7 py-2 text-[12.5px] bg-slate-50 border-r border-slate-200 outline-none appearance-none cursor-pointer text-slate-600 rounded-l-lg"
        >
          {countryCodes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code.toUpperCase()}
            </option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      <input
        type="tel"
        placeholder="(XXX) XXX-XXXX"
        value={phone}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9\s()+-]/g, '');
          setPhone(val);
        }}
        className="flex-1 px-3 py-2 text-[12.5px] outline-none bg-transparent text-slate-800 placeholder-slate-400 rounded-r-lg"
      />
    </div>
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

const PracticeOnboarding = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);

  const getSavedData = () => {
    try {
      const saved = localStorage.getItem('practice_onboarding_submission');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.compilationId === COMPILATION_ID) {
          return parsed;
        } else {
          localStorage.removeItem('practice_onboarding_submission');
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage", e);
    }
    return null;
  };

  const savedData = getSavedData();

  const [practiceInfo, setPracticeInfo] = useState({
    practiceName: '',
    phoneCountry: 'us',
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

  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState({ name: "Ali Tariq", id: "#PAT007", age: "43y", initials: "AT" });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [addProviderModalOpen, setAddProviderModalOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(savedData ? new Set(STEPS.map((_, i) => i)) : new Set());
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(savedData?.isSubmitted || false);

  const [form, setForm] = useState(savedData?.form || {
    practiceName: '',
    phone: '',
    countryCode: 'us',
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
    zipCode: '',
    timeZone: '',
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    googleBusinessUrl: '',
    twitterUrl: '',
    yelpUrl: ''
  });

  const [scheduleConfig, setScheduleConfig] = useState(savedData?.scheduleConfig || {
    slotDuration: '30 mins',
    allowOnlineBooking: true,
    calendarColor: '#2563eb'
  });

  // Step 6: Billing Configuration
  const [billingConfig, setBillingConfig] = useState(savedData?.billingConfig || {
    paymentProcessor: 'stripe',
    taxRate: '8.25',
    currency: 'USD'
  });

  // Load existing onboarding state from the database
  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const res = await apiClient.get('/practice/current');
        if (res.data) {
          const p = res.data;
          setPracticeInfo({
            practiceName: p.practiceName || '',
            phoneCountry: p.phoneCountry || 'us',
            phoneNumber: p.phoneNumber || '',
            email: p.email || '',
            website: p.website || '',
            registrationNumber: p.registrationNumber || '',
            legalName: p.legalName || '',
            faxNumber: p.faxNumber || '',
            country: p.country || '',
            city: p.city || '',
            stateProvince: p.stateProvince || '',
            street: p.street || '',
            zipPostalCode: p.zipPostalCode || '',
            timeZone: p.timeZone || '',
            facebookUrl: p.facebookUrl || '',
            instagramUrl: p.instagramUrl || '',
            linkedinUrl: p.linkedinUrl || '',
            googleBusinessUrl: p.googleBusinessUrl || '',
            twitterUrl: p.twitterUrl || '',
            yelpUrl: p.yelpUrl || ''
          });
          if (p.logo) {
            setLogoPreview(p.logo);
          }
          if (p.providers && p.providers.length > 0) {
            setProviders(p.providers);
          }
          if (p.users && p.users.length > 0) {
            setUsers(p.users);
          }
          if (p.openingHours && p.openingHours.length > 0) {
            setOpeningHours(p.openingHours);
          }
          if (p.scheduleConfig) {
            setScheduleConfig(p.scheduleConfig);
          }
          if (p.billingConfig) {
            setBillingConfig(p.billingConfig);
          }
        }
      } catch (err) {
        console.error("Error loading practice onboarding data:", err);
      }
    };

    fetchPractice();
  }, []);

  // Save Progress to DB
  const saveProgressToDB = async (nextStep = currentStep, isComplete = false) => {
    try {
      const payload = {
        practiceInfo,
        logo: logoPreview,
        providers,
        users,
        openingHours,
        scheduleConfig,
        billingConfig,
        currentStep: nextStep,
        isCompleted: isComplete
      };

      await apiClient.post('/practice/save', payload);
      return true;
    } catch (err) {
      console.error("Error saving onboarding details:", err);
      alert(err.response?.data?.msg || "Failed to save onboarding details to server.");
      return false;
    }
  };

  // Handle Text Field Changes
  const handleInputChange = (field, val) => {
    let cleanVal = val;
    if (field === 'phoneNumber') {
      const digits = val.replace(/\D/g, '');
      const currentCountry = countriesList.find(c => c.code === practiceInfo.phoneCountry) || { dialCode: '+1' };
      
      if (currentCountry.dialCode === '+1') {
        // Format as (XXX) XXX-XXXX for US/Canada
        if (digits.length === 0) {
          cleanVal = '';
        } else if (digits.length <= 3) {
          cleanVal = `(${digits}`;
        } else if (digits.length <= 6) {
          cleanVal = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else {
          cleanVal = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }
      } else {
        // Enforce digits only for other countries up to 15 digits
        cleanVal = digits.slice(0, 15);
      }
    } else if (field === 'faxNumber' || field === 'zipPostalCode' || field === 'registrationNumber') {
      // Strictly digits only
      cleanVal = val.replace(/\D/g, '');
    }

    setPracticeInfo(prev => ({
      ...prev,
      [field]: cleanVal
    }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Handle Logo File Drop/Upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit.");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(savedData?.logoPreview || null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [providers, setProviders] = useState(savedData?.providers || DEFAULT_PROVIDERS);
  const [newProvider, setNewProvider] = useState({ name: '', specialty: '', type: '', email: '', phone: '' });

  const [users, setUsers] = useState(savedData?.users || DEFAULT_USERS);
  const [newUser, setNewUser] = useState({ name: '', role: 'Front Desk Specialist' });

  const [openingHours, setOpeningHours] = useState(savedData?.openingHours || WEEK_DAYS);

  const setVal = (key) => (e) => {
    let value = e.target.value;

    if (key === 'registrationNumber') {
      value = value.replace(/\D/g, '');
    } else if (key === 'faxNumber') {
      value = value.replace(/[^0-9\s()+-]/g, '');
    }

    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('Image size should not exceed 500KB.');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Trigger Navigation to Next Step with Validations
  const handleNext = async () => {
    if (currentStep === 1) {
      // Required fields: Practice Name, Phone Number, City, State/Province
      const errors = {};
      if (!practiceInfo.practiceName) errors.practiceName = true;
      if (!practiceInfo.phoneNumber) errors.phoneNumber = true;
      if (!practiceInfo.city) errors.city = true;
      if (!practiceInfo.stateProvince) errors.stateProvince = true;

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        // Scroll to top of form
        window.scrollTo({ top: 150, behavior: 'smooth' });
        return;
      }
    }

    const nextStep = currentStep + 1;
    const isFinished = currentStep === 6;

    const saved = await savePractice(isFinished ? currentStep : nextStep, isFinished);
    if (saved) {
      if (isFinished) {
        alert("Practice Onboarding Completed Successfully!");
      } else {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      const saved = await savePractice(prevStep, false);
      if (saved) {
        setCurrentStep(prevStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleFinishLater = async () => {
    const saved = await savePractice(currentStep, false);
    if (saved) {
      alert("Draft onboarding progress saved to server! You can resume anytime.");
    }
  };

  // Predefined Steps List matching mockup names
  const steps = [
    { number: 1, label: "Practice Info" },
    { number: 2, label: "Providers" },
    { number: 3, label: "Users" },
    { number: 4, label: "Opening Hours" },
    { number: 5, label: "Schedule Setup" },
    { number: 6, label: "Billing Configuration" }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased pb-20">
      
      {/* 1. MedFlow Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
        
        {/* Left Section: Logo & Patient Selector */}
        <div className="flex items-center gap-4">
          
          {/* MedFlow Logo */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-9 h-9 bg-[#0b5ed7] rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              {/* SVG double-wave M logo */}
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16C4.5 12 7.5 8 12 8C16.5 8 19.5 12 20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M4 12C4.5 8 7.5 4 12 4C16.5 4 19.5 8 20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">MedFlow</span>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Patient Selector Card Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
              className="border border-slate-200 hover:border-slate-300 py-1.5 px-3 rounded-full flex items-center gap-2.5 bg-white cursor-pointer hover:bg-slate-50 transition-all select-none max-w-56"
            >
              <div className="w-7 h-7 bg-[#2563eb] text-white rounded-full flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm shadow-blue-100">
                {selectedPatient.initials}
              </div>
              <div className="flex flex-col text-left leading-tight overflow-hidden">
                <span className="font-semibold text-slate-700 text-xs truncate">{selectedPatient.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">{selectedPatient.id} · {selectedPatient.age}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {patientDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPatientDropdownOpen(false)}></div>
                <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search patient..." 
                        className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {[
                      { name: "Ali Tariq", id: "#PAT007", age: "43y", initials: "AT" },
                      { name: "John Doe", id: "#PAT009", age: "28y", initials: "JD" },
                      { name: "Emma Smith", id: "#PAT012", age: "35y", initials: "ES" }
                    ].map((pat) => (
                      <button 
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(pat);
                          setPatientDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                          {pat.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{pat.name}</span>
                          <span className="text-[10px] text-slate-400">{pat.id} · {pat.age}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Patient Slider Action Button */}
          <button className="border border-slate-200 hover:border-slate-300 py-1.5 px-3 rounded-full flex items-center gap-1.5 bg-white text-slate-600 text-xs font-medium cursor-pointer hover:bg-slate-50 transition-all select-none shadow-sm shadow-slate-100">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Patient slider</span>
          </button>
        </div>

        {/* Center Section: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {["Schedule", "Patients", "Clinical", "Billing", "Reports"].map((link) => (
            <a 
              key={link} 
              href={`#${link.toLowerCase()}`}
              className="text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right Section: Notification, Settings, Doctor Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <button className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50 transition-all cursor-pointer">
            <Bell className="w-4.5 h-4.5 text-slate-500" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          {/* Settings icon */}
          <button className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50 transition-all cursor-pointer">
            <Settings className="w-4.5 h-4.5 text-slate-500" />
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Profile Selector */}
          <div className="relative">
            <div 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none text-left"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-200">
                SW
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-semibold text-slate-800 text-xs">Dr. Sarah Wells</span>
                <span className="text-[10px] text-slate-400 font-medium">Riverside Dental</span>
              </div>
            </div>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 text-slate-700">
                    <p className="text-xs font-bold leading-tight">Dr. Sarah Wells</p>
                    <p className="text-[10px] text-slate-400">Riverside Dental</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-600">Profile Settings</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-600">Practice Settings</button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-red-600 font-medium">Sign Out</button>
                </div>
              </>
            )}
          </div>
        </div>

      </header>

      {/* 2. Onboarding Main Body Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Title and Subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Practice Onboarding</h1>
          <p className="text-slate-500 text-sm mt-1">Complete the steps below to setup your practice</p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-10 px-4">
          <div className="relative flex items-center justify-between">
            
            {/* Connecting lines background */}
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 -z-10"></div>
            <div 
              className="absolute left-0 top-4 h-0.5 bg-blue-600 -z-10 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {/* Step circles */}
            {steps.map((s) => {
              const isActive = currentStep === s.number;
              const isCompleted = currentStep > s.number;

              return (
                <div 
                  key={s.number} 
                  onClick={() => {
                    // Make stepper interactive for navigation (with basic safety)
                    if (s.number <= currentStep || Object.keys(validationErrors).length === 0) {
                      setCurrentStep(s.number);
                    }
                  }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-all duration-300 ${
                      isActive 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110' 
                        : isCompleted
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : isActive ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    ) : (
                      s.number
                    )}
                  </div>
                  <span 
                    className={`mt-2.5 text-[10px] font-semibold text-center tracking-wide leading-tight max-w-[80px] transition-colors duration-300 ${
                      isActive 
                        ? 'text-slate-800 font-bold' 
                        : isCompleted
                          ? 'text-slate-600'
                          : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        {/* 3. Steps Panel Container with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-6 sm:p-8"
          >
            {/* STEP 1: Practice Info (Forms) */}
            {currentStep === 1 && (
              <div className="space-y-6">
                
                {/* Section 1: Practice Information */}
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Header bar */}
                  <div className="bg-[#f0f6ff] border-b border-blue-100/50 py-3.5 px-5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Practice Information</h2>
                  </div>

                  {/* Body fields */}
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Practice Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Practice Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        value={practiceInfo.practiceName}
                        onChange={(e) => handleInputChange('practiceName', e.target.value)}
                        placeholder="Enter Practice Name"
                        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl outline-none focus:ring-2 transition-all ${
                          validationErrors.practiceName 
                            ? 'border-red-400 focus:ring-red-100 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
                        }`}
                      />
                      {validationErrors.practiceName && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Practice Name is required
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Phone Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className={`w-full flex items-center bg-white border rounded-xl outline-none focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 relative transition-all ${
                        validationErrors.phoneNumber ? 'border-red-400' : 'border-slate-200'
                      }`}>
                        {/* Country code selector */}
                        <div 
                          onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                          className="pl-3 pr-2 py-2.5 flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <span className="text-sm">{countriesList.find(c => c.code === practiceInfo.phoneCountry)?.flag || '🇺🇸'}</span>
                          <span className="text-xs font-bold text-slate-600 uppercase">{practiceInfo.phoneCountry}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                          <div className="h-4 w-px bg-slate-200 ml-1"></div>
                        </div>

                        {/* Country Dropdown */}
                        {countryDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setCountryDropdownOpen(false)}></div>
                            <div className="absolute left-3 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                              {countriesList.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => {
                                    setPracticeInfo(prev => ({
                                      ...prev,
                                      phoneCountry: country.code,
                                      phoneNumber: '' // Clear input to prevent format conflicts
                                    }));
                                    setCountryDropdownOpen(false);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left text-xs transition-colors"
                                >
                                  <span className="text-sm">{country.flag}</span>
                                  <span className="font-semibold text-slate-700 uppercase w-7">{country.code}</span>
                                  <span className="text-slate-400">{country.dialCode}</span>
                                  <span className="text-slate-500 font-medium truncate flex-1 text-right">{country.name}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Main input */}
                        <input 
                          type="tel"
                          value={practiceInfo.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder={countriesList.find(c => c.code === practiceInfo.phoneCountry)?.dialCode === '+1' ? "(XXX) XXX-XXXX" : "Enter Phone Number"}
                          className="w-full px-3 py-2.5 text-sm bg-transparent border-0 outline-none rounded-r-xl"
                        />
                      </div>
                      {validationErrors.phoneNumber && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Phone Number is required
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                      <input 
                        type="email"
                        value={practiceInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter Your Email"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                      <input 
                        type="url"
                        value={practiceInfo.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="Enter Your Website"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Registration Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Registration Number</label>
                      <input 
                        type="text"
                        value={practiceInfo.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="Enter Business Number"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Legal Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Legal Name</label>
                      <input 
                        type="text"
                        value={practiceInfo.legalName}
                        onChange={(e) => handleInputChange('legalName', e.target.value)}
                        placeholder="Enter Legal Name"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Fax Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fax Number</label>
                      <input 
                        type="text"
                        value={practiceInfo.faxNumber}
                        onChange={(e) => handleInputChange('faxNumber', e.target.value)}
                        placeholder="Enter Fax Number"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                  </div>
                </div>

                {/* Section 2: Address & Location Details */}
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Header bar */}
                  <div className="bg-[#f0f6ff] border-b border-blue-100/50 py-3.5 px-5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Address & Location Details</h2>
                  </div>

                  {/* Body fields */}
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Country */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                      <input 
                        type="text"
                        value={practiceInfo.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Enter your Country"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        City <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        value={practiceInfo.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter your City"
                        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl outline-none focus:ring-2 transition-all ${
                          validationErrors.city 
                            ? 'border-red-400 focus:ring-red-100 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
                        }`}
                      />
                      {validationErrors.city && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> City is required
                        </p>
                      )}
                    </div>

                    {/* State/Province */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        State/Province <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        value={practiceInfo.stateProvince}
                        onChange={(e) => handleInputChange('stateProvince', e.target.value)}
                        placeholder="Enter State/Province"
                        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl outline-none focus:ring-2 transition-all ${
                          validationErrors.stateProvince 
                            ? 'border-red-400 focus:ring-red-100 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
                        }`}
                      />
                      {validationErrors.stateProvince && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> State/Province is required
                        </p>
                      )}
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Street</label>
                      <input 
                        type="text"
                        value={practiceInfo.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="Enter your Address"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Zip/Postal Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Zip/Postal Code</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={practiceInfo.zipPostalCode}
                          onChange={(e) => handleInputChange('zipPostalCode', e.target.value)}
                          placeholder="Enter Zip/Postal Code"
                          className="w-full px-4 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        />
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Time Zone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Time Zone</label>
                      <input 
                        type="text"
                        value={practiceInfo.timeZone}
                        onChange={(e) => handleInputChange('timeZone', e.target.value)}
                        placeholder="Enter your Address"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                  </div>
                </div>

                {/* Section 3: Upload your Office Logo */}
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Header bar */}
                  <div className="bg-[#f0f6ff] border-b border-blue-100/50 py-3.5 px-5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Upload your Office Logo</h2>
                  </div>

                  {/* Body drag zone */}
                  <div className="p-6 bg-white">
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className="border-2 border-dashed border-slate-200/80 bg-slate-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/30 hover:border-blue-300 transition-all group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                      
                      {logoPreview ? (
                        <div className="flex flex-col items-center">
                          <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain rounded-xl border border-slate-200 p-1 bg-white mb-2 shadow-sm" />
                          <span className="text-xs text-blue-600 font-semibold mt-1">Change photo</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{logoFile?.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform mb-3">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 tracking-tight">Click to upload or drag and drop</span>
                          <span className="text-[11px] text-slate-400 font-medium mt-1">Please make sure the Image does not exceed 500x500</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Social Media Link */}
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Header bar */}
                  <div className="bg-[#f0f6ff] border-b border-blue-100/50 py-3.5 px-5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <Link className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Social Media Link</h2>
                  </div>

                  {/* Body fields */}
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Facebook Page Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Facebook Page Url
                      </label>
                      <input 
                        type="url"
                        value={practiceInfo.facebookUrl}
                        onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                        placeholder="Enter Facebook URI"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Instagram Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Instagram Url
                      </label>
                      <input 
                        type="url"
                        value={practiceInfo.instagramUrl}
                        onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                        placeholder="Enter Instagram Url"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* LinkedIn Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        LinkedIn Url
                      </label>
                      <input 
                        type="url"
                        value={practiceInfo.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        placeholder="Enter LinkedIn Url"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Google Business Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Google Business Url
                      </label>
                      <input 
                        type="url"
                        value={practiceInfo.googleBusinessUrl}
                        onChange={(e) => handleInputChange('googleBusinessUrl', e.target.value)}
                        placeholder="Enter Business Url"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Twitter Page Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Twitter Page Url
                      </label>
                      <div className="relative">
                        <input 
                          type="url"
                          value={practiceInfo.twitterUrl}
                          onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                          placeholder="Enter Twitter Url"
                          className="w-full px-4 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        />
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Yelp Url */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Yelp Url
                      </label>
                      <input 
                        type="url"
                        value={practiceInfo.yelpUrl}
                        onChange={(e) => handleInputChange('yelpUrl', e.target.value)}
                        placeholder="Enter Yelp Url"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: Providers Setup */}
            {currentStep === 2 && (
              <div className="space-y-6 relative">
                
                {/* Section Title */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">PROVIDERS</h2>
                </div>

                {/* Providers Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2563eb] text-white">
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-left">Provider</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-left">Speciality</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-left">Provider Type</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-left">Email</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-left">Telephone Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                      {providers.map((p, i) => (
                        <tr key={p.id || i} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-4 text-slate-700 font-semibold">{p.name}</td>
                          <td className="px-5 py-4 text-slate-500">{p.specialty}</td>
                          <td className="px-5 py-4 text-slate-400 uppercase font-bold text-[10px]">{p.type || 'DDS'}</td>
                          <td className="px-5 py-4 text-slate-500">{p.email}</td>
                          <td className="px-5 py-4 text-slate-400">{p.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Providers button right below the table on the right */}
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setAddProviderModalOpen(true)}
                    className="border border-[#2563eb] text-[#2563eb] hover:bg-blue-50/50 bg-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm select-none"
                  >
                    Add Providers
                  </button>
                </div>

                {/* Add Provider Modal */}
                {addProviderModalOpen && (
                  <>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center animate-fade-in" onClick={() => setAddProviderModalOpen(false)}></div>
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-slate-200 rounded-[20px] shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-800">Add Practice Provider</h3>
                        <button 
                          type="button" 
                          onClick={() => setAddProviderModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newProvider.name || !newProvider.specialty) {
                          alert("Name and Specialty are required.");
                          return;
                        }
                        const added = {
                          id: Date.now().toString(),
                          name: newProvider.name,
                          specialty: newProvider.specialty,
                          type: newProvider.type || 'DDS',
                          email: newProvider.email || '—',
                          phone: newProvider.phone || '—'
                        };
                        setProviders(prev => [...prev, added]);
                        // Auto save changes to DB
                        savePractice(currentStep, false);
                        // Reset form fields
                        setNewProvider({ name: '', specialty: '', type: '', email: '', phone: '' });
                        setAddProviderModalOpen(false);
                      }} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name *</label>
                          <input 
                            type="text"
                            value={newProvider.name}
                            onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Amanda Wilson"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Speciality *</label>
                          <input 
                            type="text"
                            value={newProvider.specialty}
                            onChange={(e) => setNewProvider(prev => ({ ...prev, specialty: e.target.value }))}
                            placeholder="e.g. General Dentistry"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Provider Type (Credential)</label>
                          <input 
                            type="text"
                            value={newProvider.type}
                            onChange={(e) => setNewProvider(prev => ({ ...prev, type: e.target.value }))}
                            placeholder="e.g. DDS"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Email</label>
                          <input 
                            type="email"
                            value={newProvider.email}
                            onChange={(e) => setNewProvider(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="e.g. saramitchel@medflow.com"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Telephone Number</label>
                          <input 
                            type="text"
                            value={newProvider.phone}
                            onChange={(e) => setNewProvider(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="e.g. —"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                          />
                        </div>
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                          <button 
                            type="button" 
                            onClick={() => setAddProviderModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-100"
                          >
                            Add Provider
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}

              </div>
            )}

            {/* STEP 3: Users Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Configure Staff Users</h2>
                    <p className="text-xs text-slate-500">Add receptionist, assistant, or clinical users to manage MedFlow</p>
                  </div>
                </div>

                {/* Users list */}
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/50 p-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Staff Directory</h3>
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-xs">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.role}</p>
                        </div>
                        {u.id !== 1 && (
                          <button 
                            type="button"
                            onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new user form */}
                <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700">Add New Staff Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                      <input 
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Alice Johnson"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Role / Access Level</label>
                      <select 
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option>Front Desk Specialist</option>
                        <option>Dental Assistant</option>
                        <option>Billing Manager</option>
                        <option>Practice Administrator</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!newUser.name) {
                        alert("Please fill in the staff name");
                        return;
                      }
                      setUsers(prev => [...prev, { ...newUser, id: Date.now() }]);
                      setNewUser({ name: '', role: 'Front Desk Specialist' });
                    }}
                    className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Staff Member
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Opening Hours */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Define Opening Hours</h2>
                    <p className="text-xs text-slate-500">Establish the weekly schedule and clinic operating hours</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3">Day</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Open Time</th>
                        <th className="px-5 py-3">Close Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {openingHours.map((h, i) => (
                        <tr key={h.day} className={`hover:bg-slate-50/50 transition-colors ${!h.active ? 'bg-slate-50/30' : ''}`}>
                          <td className="px-5 py-3 font-semibold text-slate-700">{h.day}</td>
                          <td className="px-5 py-3">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={h.active} 
                                onChange={(e) => {
                                  const updated = [...openingHours];
                                  updated[i].active = e.target.checked;
                                  if (!e.target.checked) {
                                    updated[i].open = 'Closed';
                                    updated[i].close = 'Closed';
                                  } else {
                                    updated[i].open = '09:00 AM';
                                    updated[i].close = '05:00 PM';
                                  }
                                  setOpeningHours(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-2 font-medium text-slate-500">{h.active ? 'Open' : 'Closed'}</span>
                            </label>
                          </td>
                          <td className="px-5 py-3">
                            {h.active ? (
                              <input 
                                type="text"
                                value={h.open}
                                onChange={(e) => {
                                  const updated = [...openingHours];
                                  updated[i].open = e.target.value;
                                  setOpeningHours(updated);
                                }}
                                className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 w-24 bg-white"
                              />
                            ) : (
                              <span className="text-slate-400 font-semibold italic">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {h.active ? (
                              <input 
                                type="text"
                                value={h.close}
                                onChange={(e) => {
                                  const updated = [...openingHours];
                                  updated[i].close = e.target.value;
                                  setOpeningHours(updated);
                                }}
                                className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 w-24 bg-white"
                              />
                            ) : (
                              <span className="text-slate-400 font-semibold italic">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 5: Schedule Setup */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Schedule & Calendar Settings</h2>
                    <p className="text-xs text-slate-500">Configure scheduling parameters and appointment preferences</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Slot Duration */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                    <h3 className="text-xs font-bold text-slate-700">Default Appointment Slot</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Choose the standard scheduling interval for the clinic calendar grid.</p>
                    <div className="flex gap-2">
                      {['15 mins', '30 mins', '45 mins', '60 mins'].map((duration) => (
                        <button 
                          key={duration}
                          type="button"
                          onClick={() => setScheduleConfig(prev => ({ ...prev, slotDuration: duration }))}
                          className={`flex-1 py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            scheduleConfig.slotDuration === duration 
                              ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Online Booking Settings */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <h3 className="text-xs font-bold text-slate-700">Online Patient Scheduling</h3>
                    <div className="flex items-start justify-between">
                      <div className="max-w-[75%]">
                        <p className="text-xs font-semibold text-slate-700">Allow Online Appointments</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Let patients view calendar availability and book directly via patient portal</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                        <input 
                          type="checkbox" 
                          checked={scheduleConfig.allowOnlineBooking} 
                          onChange={(e) => setScheduleConfig(prev => ({ ...prev, allowOnlineBooking: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 6: Billing Configuration */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Billing & Payment Setup</h2>
                    <p className="text-xs text-slate-500">Link your merchant accounts, configure default tax codes, and currency</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Payment Processor Selection */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <h3 className="text-xs font-bold text-slate-700">Payment Merchant Link</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'stripe', name: 'Stripe' },
                        { id: 'paypal', name: 'PayPal' },
                        { id: 'square', name: 'Square' }
                      ].map((proc) => (
                        <button 
                          key={proc.id}
                          type="button"
                          onClick={() => setBillingConfig(prev => ({ ...prev, paymentProcessor: proc.id }))}
                          className={`py-3 px-2 border rounded-xl text-xs font-bold flex flex-col items-center gap-2 cursor-pointer transition-all ${
                            billingConfig.paymentProcessor === proc.id 
                              ? 'border-blue-500 bg-blue-50 text-blue-600' 
                              : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 opacity-70" />
                          <span>{proc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tax Rate & Currency */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <h3 className="text-xs font-bold text-slate-700">Tax & Currency Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Tax Rate (%)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={billingConfig.taxRate}
                          onChange={(e) => setBillingConfig(prev => ({ ...prev, taxRate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Currency</label>
                        <select 
                          value={billingConfig.currency}
                          onChange={(e) => setBillingConfig(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Stepper Actions Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={handleFinishLater}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 font-semibold px-5 py-2.5 rounded-xl text-xs mr-3 transition-all cursor-pointer"
                >
                  Finish Later
                </button>
                <button 
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  {currentStep === 6 ? 'Finish Onboarding' : 'Next'}
                </button>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
};

export default PracticeOnboarding;

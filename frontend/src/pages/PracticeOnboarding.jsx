import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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
  CreditCard
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

const PracticeOnboarding = () => {
  // Stepper state (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [addProviderModalOpen, setAddProviderModalOpen] = useState(false);
  
  // Patient Selector Dropdown State
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState({
    name: "Ali Tariq",
    id: "#PAT007",
    age: "43y",
    initials: "AT"
  });

  // Profile Menu Dropdown State
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Form Field States - Step 1: Practice Info
  const [practiceInfo, setPracticeInfo] = useState({
    practiceName: '',
    phoneCountry: 'us',
    phoneNumber: '',
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  Users as UsersIcon,
  UserPlus,
  Clock,
  CalendarClock,
  CreditCard,
  MapPin,
  Upload,
  Share2,
  ChevronDown,
  X,
  ArrowLeft,
  Check,
  CloudUpload,
  Plus,
  CircleUser,
  Building2,
  Link2,
} from 'lucide-react';

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

  const [currentStep, setCurrentStep] = useState(savedData ? STEPS.length - 1 : 0);
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

  // Validation state (highlights missing fields if user tries to submit)
  const [validationErrors, setValidationErrors] = useState({});

  // File Upload State
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Mock data for subsequent steps
  // Step 2: Providers
  const [providers, setProviders] = useState([
    { id: '1', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '2', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '3', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '4', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '5', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '6', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" },
    { id: '7', name: "Amanda Wilson", specialty: "General Dentistry", type: "DDS", email: "saramitchel@medflow.com", phone: "—" }
  ]);
  const [newProvider, setNewProvider] = useState({ name: '', specialty: '', type: '', email: '', phone: '' });

  // Step 3: Users
  const [users, setUsers] = useState([
    { id: 1, name: "Alice Johnson", role: "Front Desk Specialist" }
  ]);
  const [newUser, setNewUser] = useState({ name: '', role: 'Front Desk Specialist' });

  // Step 4: Opening Hours
  const [openingHours, setOpeningHours] = useState([
    { day: "Monday", open: "09:00 AM", close: "05:00 PM", active: true },
    { day: "Tuesday", open: "09:00 AM", close: "05:00 PM", active: true },
    { day: "Wednesday", open: "09:00 AM", close: "05:00 PM", active: true },
    { day: "Thursday", open: "09:00 AM", close: "05:00 PM", active: true },
    { day: "Friday", open: "09:00 AM", close: "05:00 PM", active: true },
    { day: "Saturday", open: "10:00 AM", close: "02:00 PM", active: false },
    { day: "Sunday", open: "Closed", close: "Closed", active: false }
  ]);

  // Step 5: Schedule Setup
  const [scheduleConfig, setScheduleConfig] = useState({
    slotDuration: '30 mins',
    allowOnlineBooking: true,
    calendarColor: '#2563eb'
  });

  // Step 6: Billing Configuration
  const [billingConfig, setBillingConfig] = useState({
    paymentProcessor: 'stripe',
    taxRate: '8.25',
    currency: 'USD'
  });

  // Load existing onboarding state from the database
  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/practice/current`, {
          headers: { 'x-auth-token': token }
        });
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
          if (p.currentStep) {
            setCurrentStep(p.currentStep);
          }
        }
      } catch (err) {
        console.log("No existing practice setup found or error loading, starting fresh.", err);
      }
    };
    fetchPractice();
  }, []);

  // Save onboarding details to database
  const savePractice = async (step, isComplete = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("You must be logged in to save onboarding details.");
        return false;
      }
      
      const payload = {
        ...practiceInfo,
        logo: logoPreview || '',
        providers,
        users,
        openingHours,
        scheduleConfig,
        billingConfig,
        currentStep: step,
        isCompleted: isComplete
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/practice/save`, payload, {
        headers: { 'x-auth-token': token }
      });
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
    yelpUrl: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(savedData?.logoPreview || null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [providers, setProviders] = useState(savedData?.providers || DEFAULT_PROVIDERS);
  const [showAddForm, setShowAddForm] = useState(false);

  const [providerForm, setProviderForm] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    internalCode: '',
    mobilePhone: '',
    countryCode: 'us',
    email: '',
    licenseNumber: '',
    npi: '',
    federalTaxNumber: '',
    dea: '',
    speciality: 'General Dentistry',
    taxIdType: '',
    providerType: 'Dentist',
    profileColor: '#3b82f6',
    signatureOnFile: false,
  });
  const [providerErrors, setProviderErrors] = useState({});
  const [customColors, setCustomColors] = useState([]);

  const [users, setUsers] = useState(savedData?.users || DEFAULT_USERS);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    role: 'Dentist',
    email: '',
    phone: '',
    countryCode: 'us',
  });
  const [userErrors, setUserErrors] = useState({});

  const [openingHours, setOpeningHours] = useState(savedData?.openingHours || WEEK_DAYS);

  const [scheduleSetup, setScheduleSetup] = useState(savedData?.scheduleSetup || {
    slotInterval: '15 mins',
    defaultView: 'Week View',
    onlineBooking: true,
    preventBookingWithin: '2 hours',
    enabledStatuses: {
      'Scheduled': true,
      'Confirmed': true,
      'Checked In': true,
      'In Treatment': false,
      'Completed': true,
      'Cancelled': true,
      'No Show': true,
    }
  });

  const [billingConfig, setBillingConfig] = useState(savedData?.billingConfig || {
    currency: 'USD',
    taxRate: '5.0',
    enableInvoices: true,
    paymentTerms: 'Due on Receipt',
    paymentGateways: {
      'Visa/Mastercard': true,
      'PayPal': false,
      'Stripe': true,
      'Direct Deposit': false,
    }
  });

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

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 0) {
      if (!form.practiceName.trim()) newErrors.practiceName = 'Practice name is required';

      const phoneDigits = form.phone.replace(/\D/g, '');
      if (!form.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9\s()+-]+$/.test(form.phone.trim())) {
        newErrors.phone = 'Invalid characters in phone number';
      } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.phone = 'Phone number must contain between 7 and 15 digits';
      }

      if (form.faxNumber.trim()) {
        const faxDigits = form.faxNumber.replace(/\D/g, '');
        if (!/^[0-9\s()+-]+$/.test(form.faxNumber.trim())) {
          newErrors.faxNumber = 'Invalid characters in fax number';
        } else if (faxDigits.length < 7 || faxDigits.length > 15) {
          newErrors.faxNumber = 'Fax number must contain between 7 and 15 digits';
        }
      }

      if (form.registrationNumber.trim()) {
        if (!/^\d+$/.test(form.registrationNumber.trim())) {
          newErrors.registrationNumber = 'Registration number must contain digits only';
        }
      }

      if (!form.city.trim()) newErrors.city = 'City is required';
      if (!form.stateProvince.trim()) newErrors.stateProvince = 'State/Province is required';
      
      if (!form.zipCode.trim()) {
        newErrors.zipCode = 'Zip/Postal code is required';
      } else if (!/^[a-zA-Z0-9\s-]{3,10}$/.test(form.zipCode.trim())) {
        newErrors.zipCode = 'Enter a valid postal code (3–10 alphanumeric characters)';
      }
    }

    if (currentStep === 1) {
      if (providers.length === 0) {
        alert("Please add at least one provider to proceed.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (users.length === 0) {
        alert("Please add at least one user to proceed.");
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      const submissionData = {
        compilationId: COMPILATION_ID,
        isSubmitted: true,
        form,
        logoPreview,
        providers,
        users,
        openingHours,
        scheduleSetup,
        billingConfig,
      };
      try {
        localStorage.setItem('practice_onboarding_submission', JSON.stringify(submissionData));
      } catch (e) {
        console.error("Failed to write submission to localStorage", e);
      }
      setIsSubmitted(true);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (completedSteps.has(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex);
      setErrors({});
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

    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const highestCompleted = completedSteps.size > 0
    ? Math.max(...completedSteps)
    : -1;

  const handleApplyProvider = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!providerForm.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!providerForm.lastName.trim()) newErrors.lastName = 'Last Name is required';
    
    if (!providerForm.mobilePhone.trim()) {
      newErrors.mobilePhone = 'Mobile Phone Number is required';
    } else {
      const phoneDigits = providerForm.mobilePhone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.mobilePhone = 'Phone number must contain 7 to 15 digits';
      }
    }

    if (!providerForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(providerForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!providerForm.licenseNumber.trim()) newErrors.licenseNumber = 'License Number is required';
    if (!providerForm.federalTaxNumber.trim()) newErrors.federalTaxNumber = 'Federal Tax Number is required';
    if (!providerForm.speciality.trim()) newErrors.speciality = 'Speciality is required';

    if (Object.keys(newErrors).length > 0) {
      setProviderErrors(newErrors);
      return;
    }

    const providerObj = {
      name: `${providerForm.firstName} ${providerForm.lastName}`,
      speciality: providerForm.speciality,
      type: providerForm.providerType,
      email: providerForm.email,
      phone: `${providerForm.countryCode.toUpperCase()} ${providerForm.mobilePhone}`,
    };

    setProviders((prev) => [...prev, providerObj]);
    resetProviderForm();
    setShowAddForm(false);
  };

  const resetProviderForm = () => {
    setProviderForm({
      firstName: '',
      lastName: '',
      preferredName: '',
      internalCode: '',
      mobilePhone: '',
      countryCode: 'us',
      email: '',
      licenseNumber: '',
      npi: '',
      federalTaxNumber: '',
      dea: '',
      speciality: 'General Dentistry',
      taxIdType: '',
      providerType: 'Dentist',
      profileColor: '#3b82f6',
      signatureOnFile: false,
    });
    setProviderErrors({});
  };

  const handleCustomColorAdd = (e) => {
    const selectedColor = e.target.value;
    if (selectedColor && !customColors.includes(selectedColor)) {
      setCustomColors((prev) => [...prev, selectedColor]);
      setProviderForm((prev) => ({ ...prev, profileColor: selectedColor }));
    }
  };

  const handleApplyUser = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!userForm.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!userForm.lastName.trim()) newErrors.lastName = 'Last Name is required';

    if (!userForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (userForm.phone.trim()) {
      const phoneDigits = userForm.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.phone = 'Phone number must contain 7 to 15 digits';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setUserErrors(newErrors);
      return;
    }

    const userObj = {
      name: `${userForm.firstName} ${userForm.lastName}`,
      role: userForm.role,
      email: userForm.email,
      phone: userForm.phone ? `${userForm.countryCode.toUpperCase()} ${userForm.phone}` : '—',
      status: "Active",
    };

    setUsers((prev) => [...prev, userObj]);
    setUserForm({
      firstName: '',
      lastName: '',
      role: 'Dentist',
      email: '',
      phone: '',
      countryCode: 'us',
    });
    setUserErrors({});
    setShowAddUserForm(false);
  };

  const handleToggleDay = (index) => {
    setOpeningHours((prev) =>
      prev.map((day, i) => (i === index ? { ...day, active: !day.active } : day))
    );
  };

  const handleDayTimeChange = (index, field, value) => {
    setOpeningHours((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const allColors = [...PRESET_COLORS, ...customColors];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#edf2f7] flex flex-col font-[Inter,system-ui,sans-serif] items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm max-w-xl w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-pulse">
            <Check size={32} strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h1 className="text-[16px] font-bold text-slate-800">Onboarding Submitted Successfully!</h1>
            <p className="text-[12px] text-slate-400">
              Your practice onboarding configuration has been saved.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-5 text-left border border-slate-100 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
              Practice Summary
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
              <div>
                <span className="text-slate-400 block text-[11px]">Practice Name</span>
                <span className="font-semibold text-slate-700">{form.practiceName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <span className="font-semibold text-slate-700">{form.countryCode.toUpperCase()} {form.phone}</span>
              </div>
              {form.email && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-semibold text-slate-700 truncate block">{form.email}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-slate-700">{form.city}, {form.stateProvince}</span>
              </div>
              {logoPreview && (
                <div className="col-span-2 flex items-center gap-3 pt-2">
                  <span className="text-slate-400 text-[11px]">Logo:</span>
                  <img src={logoPreview} alt="Practice Logo" className="w-8 h-8 object-contain rounded border border-slate-200" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 text-left">
            💡 <strong>Note:</strong> This submission status is persisted in local storage and will remain active until the application code is compiled/rebuilt again.
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                localStorage.removeItem('practice_onboarding_submission');
                setIsSubmitted(false);
                setCurrentStep(0);
                setCompletedSteps(new Set());
                setProviders(DEFAULT_PROVIDERS);
                setUsers(DEFAULT_USERS);
                setOpeningHours(WEEK_DAYS);
              }}
              className="px-5 py-2 text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-md transition-all cursor-pointer"
            >
              Reset / Start Over
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all shadow cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-[Inter,system-ui,sans-serif] relative text-slate-800 pb-12">

      <div className="max-w-[1000px] w-full mx-auto my-6 px-4">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-md overflow-hidden text-center">

          <div className="p-8 space-y-6">

            <div>
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Practice Onboarding</h2>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Complete the steps below to setup your practice</p>
            </div>

            <div className="max-w-[640px] mx-auto px-6 pb-2">
              <div className="flex items-start justify-between relative">
                
                <div className="absolute top-[13px] left-[48px] right-[48px] h-[2px] bg-slate-200 z-0 rounded-full" />
                
                {highestCompleted >= 0 && (
                  <div
                    className="absolute top-[13px] left-[48px] h-[2px] bg-blue-500 z-[1] transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${Math.min((highestCompleted) / (STEPS.length - 1), 1) * 100}%`,
                      maxWidth: 'calc(100% - 96px)',
                    }}
                  />
                )}

                {STEPS.map((step, i) => {
                  const isActive = i === currentStep;
                  const isCompleted = completedSteps.has(i);
                  const isReachable = isCompleted || i === currentStep;

                  return (
                    <button
                      key={step.label}
                      onClick={() => handleStepClick(i)}
                      className={`relative z-10 flex flex-col items-center gap-1.5 group
                        ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ width: '84px' }}
                      disabled={!isReachable}
                    >
                      {isActive ? (
                        
                        <div className="w-[26px] h-[26px] rounded-full border-2 border-blue-600 bg-white flex items-center justify-center shadow-sm scale-110">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        </div>
                      ) : isCompleted ? (
                        
                        <div className="w-[26px] h-[26px] rounded-full bg-blue-500 border border-blue-500 text-white flex items-center justify-center shadow-sm">
                          <Check size={12} strokeWidth={3} className="text-white" />
                        </div>
                      ) : (
                        
                        <div className="w-[26px] h-[26px] rounded-full border-2 border-slate-200 bg-white flex items-center justify-center" />
                      )}
                      
                      <span
                        className={`text-[9px] leading-[1.3] text-center whitespace-pre-line transition-colors
                          ${isActive
                            ? 'text-blue-600 font-semibold'
                            : isCompleted
                              ? 'text-blue-500 font-medium'
                              : 'text-slate-400'
                          }`}
                      >
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            <div className="text-left">

              {currentStep === 0 && (
                <div className="space-y-6">

                  <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left flex items-center gap-2">
                      <CircleUser size={16} className="text-blue-600" strokeWidth={2.2} />
                      <span className="text-[12px] font-bold text-slate-700 tracking-wide">Practice Information</span>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      <BoxTextInput label="Practice Name" placeholder="Enter Practice Name" required value={form.practiceName} onChange={setVal('practiceName')} error={errors.practiceName} />
                      <BoxPhoneInput label="Phone Number" required phone={form.phone} setPhone={(v) => { setForm((p) => ({ ...p, phone: v })); if (errors.phone) setErrors((prev) => { const next = { ...prev }; delete next.phone; return next; }); }} countryCode={form.countryCode} setCountryCode={(v) => setForm((p) => ({ ...p, countryCode: v }))} error={errors.phone} />
                      <BoxTextInput label="Email" placeholder="Enter Your Email" value={form.email} onChange={setVal('email')} type="email" />
                      <BoxTextInput label="Website" placeholder="Enter Your Website" value={form.website} onChange={setVal('website')} />
                      <BoxTextInput label="Registration Number" placeholder="Enter Business Number" value={form.registrationNumber} onChange={setVal('registrationNumber')} error={errors.registrationNumber} />
                      <BoxTextInput label="Legal Name" placeholder="Enter Legal Name" value={form.legalName} onChange={setVal('legalName')} />
                      <BoxTextInput label="Fax Number" placeholder="Enter Fax Number" value={form.faxNumber} onChange={setVal('faxNumber')} error={errors.faxNumber} />
                    </div>
                  </div>

                  <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600" strokeWidth={2.2} />
                      <span className="text-[12px] font-bold text-slate-700 tracking-wide">Address & Location Details</span>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      <BoxTextInput label="Country" placeholder="Enter your Country" value={form.country} onChange={setVal('country')} />
                      <BoxTextInput label="City" placeholder="Enter your City" required value={form.city} onChange={setVal('city')} error={errors.city} />
                      <BoxTextInput label="State/Province" placeholder="Enter State/Province" required value={form.stateProvince} onChange={setVal('stateProvince')} error={errors.stateProvince} />
                      <BoxTextInput label="Street" placeholder="Enter your Address" value={form.street} onChange={setVal('street')} />
                      <BoxTextInput label="Zip/Postal Code" placeholder="Enter Zip/Postal Code" required value={form.zipCode} onChange={setVal('zipCode')} error={errors.zipCode} />
                      <BoxSelectInput
                        label="Time Zone"
                        placeholder="Select Time Zone"
                        value={form.timeZone}
                        onChange={setVal('timeZone')}
                        options={[
                          { value: 'EST', label: 'Eastern (EST)' },
                          { value: 'CST', label: 'Central (CST)' },
                          { value: 'MST', label: 'Mountain (MST)' },
                          { value: 'PST', label: 'Pacific (PST)' },
                          { value: 'GMT', label: 'GMT' },
                          { value: 'UTC+5', label: 'UTC+5 (PKT)' },
                          { value: 'UTC+5:30', label: 'UTC+5:30 (IST)' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left flex items-center gap-2">
                      <Building2 size={16} className="text-blue-600" strokeWidth={2.2} />
                      <span className="text-[12px] font-bold text-slate-700 tracking-wide">Upload your Office Logo</span>
                    </div>
                    <div className="p-5">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !logoPreview && fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg py-12 px-6 text-center transition-all duration-300 cursor-pointer group
                          ${isDragOver
                            ? 'border-blue-400 bg-blue-50/50'
                            : logoPreview
                              ? 'border-blue-300 bg-blue-50/20'
                              : 'border-slate-200 bg-blue-50/10 hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files[0])}
                        />

                        {logoPreview ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg border border-slate-200" />
                              <button
                                onClick={(e) => { e.stopPropagation(); removeLogo(); }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow cursor-pointer"
                              >
                                <X size={10} strokeWidth={3} />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400">{logoFile?.name}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              className="text-[11px] text-blue-600 font-medium hover:text-blue-700 cursor-pointer"
                            >
                              Change Logo
                            </button>
                          </div>
                        ) : (
                          <>
                            <CloudUpload size={28} className="mx-auto text-slate-300 group-hover:text-blue-400 transition-colors mb-3" strokeWidth={1.5} />
                            <p className="text-[13px] font-medium text-slate-500">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Please make sure the image does not exceed 500×500
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left flex items-center gap-2">
                      <Link2 size={16} className="text-blue-600" strokeWidth={2.2} />
                      <span className="text-[12px] font-bold text-slate-700 tracking-wide">Social Media Link</span>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      <BoxTextInput label="Facebook Page Url" placeholder="Enter Facebook URL" value={form.facebookUrl} onChange={setVal('facebookUrl')} />
                      <BoxTextInput label="Instagram Url" placeholder="Enter Instagram Url" value={form.instagramUrl} onChange={setVal('instagramUrl')} />
                      <BoxTextInput label="LinkedIn Url" placeholder="Enter LinkedIn Url" value={form.linkedinUrl} onChange={setVal('linkedinUrl')} />
                      <BoxTextInput label="Google Business Url" placeholder="Enter Business Url" value={form.googleBusinessUrl} onChange={setVal('googleBusinessUrl')} />
                      <BoxTextInput label="Twitter Page Url" placeholder="Enter Twitter Url" value={form.twitterUrl} onChange={setVal('twitterUrl')} />
                      <BoxTextInput label="Yelp Url" placeholder="Enter Yelp Url" value={form.yelpUrl} onChange={setVal('yelpUrl')} />
                    </div>
                  </div>

                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight uppercase">Providers</h2>
                  </div>

                  <div className="relative bg-white border border-slate-200/80 rounded-lg shadow-sm">
                    <div className="overflow-hidden rounded-t-lg">
                      <table className="w-full text-[12.5px] text-left border-collapse">
                        <thead>
                          <tr className="bg-blue-600 text-white font-bold uppercase tracking-wider text-[10.5px]">
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Provider</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Speciality</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Provider Type</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Email</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Telephone Number</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {providers.map((p, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-slate-800">{p.name}</td>
                              <td className="py-3.5 px-5 text-slate-600">{p.speciality}</td>
                              <td className="py-3.5 px-5 text-slate-500 font-medium">{p.type}</td>
                              <td className="py-3.5 px-5 text-slate-600">{p.email}</td>
                              <td className="py-3.5 px-5 text-slate-500">{p.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!showAddForm && (
                      <div className="absolute right-4 bottom-0 translate-y-1/2 z-10 bg-white pl-2">
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="flex items-center gap-1.5 border border-slate-300 text-blue-600 bg-white hover:bg-slate-50 px-4 py-1 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm"
                        >
                          <Plus size={14} strokeWidth={2.5} className="text-blue-500" />
                          <span>Add Providers</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showAddForm && (
                    <div className="bg-[#f4f7fa] border border-slate-200/80 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mt-8">
                      <div className="bg-[#e2eafd] px-6 py-4 flex justify-between items-center border-b border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100/70 text-blue-600 rounded-full flex items-center justify-center">
                            <UserPlus size={18} strokeWidth={2.2} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Add Providers</h3>
                            <p className="text-[11px] text-slate-500">Add new Providers</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setShowAddForm(false); setProviderErrors({}); }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                            <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left">
                              <span className="text-[12px] font-bold text-slate-700 tracking-wide">Personal Information</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                              <BoxTextInput label="First Name" placeholder="Enter First Name" required value={providerForm.firstName} onChange={(e) => { setProviderForm((prev) => ({ ...prev, firstName: e.target.value })); if (providerErrors.firstName) setProviderErrors((prev) => { const next = { ...prev }; delete next.firstName; return next; }); }} error={providerErrors.firstName} />
                              <BoxTextInput label="Last Name" placeholder="Enter Last Name" required value={providerForm.lastName} onChange={(e) => { setProviderForm((prev) => ({ ...prev, lastName: e.target.value })); if (providerErrors.lastName) setProviderErrors((prev) => { const next = { ...prev }; delete next.lastName; return next; }); }} error={providerErrors.lastName} />
                              <BoxTextInput label="Preferred Name" placeholder="Enter Preferred Name" value={providerForm.preferredName} onChange={(e) => setProviderForm((prev) => ({ ...prev, preferredName: e.target.value }))} />
                              <BoxTextInput label="Internal Code Name" placeholder="Enter Internal Code" value={providerForm.internalCode} onChange={(e) => setProviderForm((prev) => ({ ...prev, internalCode: e.target.value }))} />
                              <BoxPhoneInput label="Mobile Phone Number" required phone={providerForm.mobilePhone} setPhone={(val) => { setProviderForm((prev) => ({ ...prev, mobilePhone: val })); if (providerErrors.mobilePhone) setProviderErrors((prev) => { const next = { ...prev }; delete next.mobilePhone; return next; }); }} countryCode={providerForm.countryCode} setCountryCode={(val) => setProviderForm((prev) => ({ ...prev, countryCode: val }))} error={providerErrors.mobilePhone} />
                              <BoxTextInput label="Email" placeholder="Enter Your Email" required type="email" value={providerForm.email} onChange={(e) => { setProviderForm((prev) => ({ ...prev, email: e.target.value })); if (providerErrors.email) setProviderErrors((prev) => { const next = { ...prev }; delete next.email; return next; }); }} error={providerErrors.email} />
                            </div>
                          </div>

                          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                            <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left">
                              <span className="text-[12px] font-bold text-slate-700 tracking-wide">Professional & Licensing Information</span>
                            </div>
                            <div className="p-4 space-y-4 flex-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <BoxTextInput label="License Number" placeholder="Enter License Number" required value={providerForm.licenseNumber} onChange={(e) => { setProviderForm((prev) => ({ ...prev, licenseNumber: e.target.value })); if (providerErrors.licenseNumber) setProviderErrors((prev) => { const next = { ...prev }; delete next.licenseNumber; return next; }); }} error={providerErrors.licenseNumber} />
                                <BoxTextInput label="NPI" placeholder="Enter NPI" value={providerForm.npi} onChange={(e) => setProviderForm((prev) => ({ ...prev, npi: e.target.value }))} />
                                <BoxTextInput label="Federal Tax Number" placeholder="Enter Federal Tax Number" required value={providerForm.federalTaxNumber} onChange={(e) => { setProviderForm((prev) => ({ ...prev, federalTaxNumber: e.target.value })); if (providerErrors.federalTaxNumber) setProviderErrors((prev) => { const next = { ...prev }; delete next.federalTaxNumber; return next; }); }} error={providerErrors.federalTaxNumber} />
                                <BoxTextInput label="DEA" placeholder="Enter DEA" value={providerForm.dea} onChange={(e) => setProviderForm((prev) => ({ ...prev, dea: e.target.value }))} />
                              </div>
                              <BoxSelectInput label="Speciality" placeholder="Select Speciality" required value={providerForm.speciality} onChange={(e) => { setProviderForm((prev) => ({ ...prev, speciality: e.target.value })); if (providerErrors.speciality) setProviderErrors((prev) => { const next = { ...prev }; delete next.speciality; return next; }); }} options={[{ value: 'General Dentistry', label: 'General Dentistry' }, { value: 'Orthodontics', label: 'Orthodontics' }, { value: 'Pediatric Dentistry', label: 'Pediatric Dentistry' }, { value: 'Periodontics', label: 'Periodontics' }, { value: 'Oral Surgery', label: 'Oral Surgery' }]} error={providerErrors.speciality} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                            <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left">
                              <span className="text-[12px] font-bold text-slate-700 tracking-wide">Provider Type & Tax Detail</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-end">
                              <BoxTextInput label="Tax Id Type" placeholder="Enter Tax Id Type" value={providerForm.taxIdType} onChange={(e) => setProviderForm((prev) => ({ ...prev, taxIdType: e.target.value }))} />
                              <BoxSelectInput label="Provider Type" placeholder="Select Type" required value={providerForm.providerType} onChange={(e) => setProviderForm((prev) => ({ ...prev, providerType: e.target.value }))} options={[{ value: 'Dentist', label: 'Dentist' }, { value: 'DDS', label: 'DDS' }, { value: 'DMD', label: 'DMD' }, { value: 'Hygienist', label: 'Hygienist' }, { value: 'Assistant', label: 'Assistant' }, { value: 'Receptionist', label: 'Receptionist' }]} />
                            </div>
                          </div>

                          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                            <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left">
                              <span className="text-[12px] font-bold text-slate-700 tracking-wide">Profile Background Color</span>
                            </div>
                            <div className="p-4 space-y-4 flex-1 text-left">
                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Colors</span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {allColors.map((col) => (
                                    <button type="button" key={col} onClick={() => setProviderForm((prev) => ({ ...prev, profileColor: col }))} className="w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center" style={{ backgroundColor: col, borderColor: providerForm.profileColor === col ? '#3b82f6' : 'transparent', borderWidth: providerForm.profileColor === col ? '2px' : '1px', boxShadow: providerForm.profileColor === col ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none' }}>
                                      {providerForm.profileColor === col && <Check size={11} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" strokeWidth={3} />}
                                    </button>
                                  ))}
                                  <button type="button" onClick={() => colorInputRef.current?.click()} className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 cursor-pointer bg-slate-50 transition-colors"><Plus size={12} strokeWidth={3} /></button>
                                  <input ref={colorInputRef} type="color" className="hidden" onChange={handleCustomColorAdd} />
                                </div>
                                <p className="text-[9.5px] leading-tight text-slate-400 mt-2.5 italic">The color for the provider show on the appointment card and as a background for the provider name in the different parts of the software</p>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <input type="checkbox" id="signatureOnFile" checked={providerForm.signatureOnFile} onChange={(e) => setProviderForm((prev) => ({ ...prev, signatureOnFile: e.target.checked }))} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
                                <label htmlFor="signatureOnFile" className="text-[12.5px] font-medium text-slate-600 cursor-pointer select-none">Signature on the File</label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                          <button type="button" onClick={() => { setShowAddForm(false); setProviderErrors({}); }} className="px-5 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer transition-all">Cancel</button>
                          <button type="button" onClick={handleApplyProvider} className="px-6 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition-all active:scale-[0.98] cursor-pointer">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight uppercase">Users</h2>
                  </div>

                  <div className="relative bg-white border border-slate-200/80 rounded-lg shadow-sm">
                    <div className="overflow-hidden rounded-t-lg">
                      <table className="w-full text-[12.5px] text-left border-collapse">
                        <thead>
                          <tr className="bg-blue-600 text-white font-bold uppercase tracking-wider text-[10.5px]">
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">User</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Role</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Email</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Telephone Number</th>
                            <th className="py-3 px-5 border-b border-blue-700 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.map((u, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-slate-800">{u.name}</td>
                              <td className="py-3.5 px-5 text-slate-600">{u.role}</td>
                              <td className="py-3.5 px-5 text-slate-600">{u.email}</td>
                              <td className="py-3.5 px-5 text-slate-500">{u.phone}</td>
                              <td className="py-3.5 px-5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                                  {u.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!showAddUserForm && (
                      <div className="absolute right-4 bottom-0 translate-y-1/2 z-10 bg-white pl-2">
                        <button
                          onClick={() => setShowAddUserForm(true)}
                          className="flex items-center gap-1.5 border border-slate-300 text-blue-600 bg-white hover:bg-slate-50 px-4 py-1 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm"
                        >
                          <Plus size={14} strokeWidth={2.5} className="text-blue-500" />
                          <span>Add Users</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showAddUserForm && (
                    <div className="bg-[#f4f7fa] border border-slate-200/80 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mt-8">
                      <div className="bg-[#e2eafd] px-6 py-4 flex justify-between items-center border-b border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100/70 text-blue-600 rounded-full flex items-center justify-center">
                            <UserPlus size={18} strokeWidth={2.2} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Add Users</h3>
                            <p className="text-[11px] text-slate-500">Create new System Users</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setShowAddUserForm(false); setUserErrors({}); }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col md:col-span-2">
                            <div className="bg-[#f0f4fa] px-4 py-2.5 border-b border-slate-200/60 text-left">
                              <span className="text-[12px] font-bold text-slate-700 tracking-wide">User Account Information</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <BoxTextInput label="First Name" placeholder="Enter First Name" required value={userForm.firstName} onChange={(e) => { setUserForm((prev) => ({ ...prev, firstName: e.target.value })); if (userErrors.firstName) setUserErrors((prev) => { const next = { ...prev }; delete next.firstName; return next; }); }} error={userErrors.firstName} />
                              <BoxTextInput label="Last Name" placeholder="Enter Last Name" required value={userForm.lastName} onChange={(e) => { setUserForm((prev) => ({ ...prev, lastName: e.target.value })); if (userErrors.lastName) setUserErrors((prev) => { const next = { ...prev }; delete next.lastName; return next; }); }} error={userErrors.lastName} />
                              <BoxSelectInput label="System Role" placeholder="Select Role" required value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))} options={[{ value: 'Administrator', label: 'Administrator' }, { value: 'Dentist', label: 'Dentist' }, { value: 'Hygienist', label: 'Hygienist' }, { value: 'Assistant', label: 'Assistant' }, { value: 'Billing Manager', label: 'Billing Manager' }]} />
                              <BoxTextInput label="Email Address" placeholder="Enter Email" required type="email" value={userForm.email} onChange={(e) => { setUserForm((prev) => ({ ...prev, email: e.target.value })); if (userErrors.email) setUserErrors((prev) => { const next = { ...prev }; delete next.email; return next; }); }} error={userErrors.email} />
                              <BoxPhoneInput label="Telephone Number" phone={userForm.phone} setPhone={(val) => { setUserForm((prev) => ({ ...prev, phone: val })); if (userErrors.phone) setUserErrors((prev) => { const next = { ...prev }; delete next.phone; return next; }); }} countryCode={userForm.countryCode} setCountryCode={(val) => setUserForm((prev) => ({ ...prev, countryCode: val }))} error={userErrors.phone} />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                          <button type="button" onClick={() => { setShowAddUserForm(false); setUserErrors({}); }} className="px-5 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer transition-all">Cancel</button>
                          <button type="button" onClick={handleApplyUser} className="px-6 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition-all active:scale-[0.98] cursor-pointer">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight uppercase">Opening Hours</h2>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm p-6 space-y-4">
                    <p className="text-[12.5px] text-slate-500 mb-2">Set your daily hours of operation for appointments and scheduling.</p>
                    
                    <div className="space-y-3.5">
                      {openingHours.map((day, idx) => (
                        <div key={day.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleDay(idx)}
                              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer outline-none
                                ${day.active ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out transform block
                                ${day.active ? 'translate-x-4.5' : 'translate-x-0'}`}
                              />
                            </button>
                            <span className="text-[13px] font-semibold text-slate-700 min-w-[80px]">{day.name}</span>
                          </div>

                          {day.active ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={day.start}
                                onChange={(e) => handleDayTimeChange(idx, 'start', e.target.value)}
                                className="px-2 py-1 text-[12.5px] border border-slate-200 rounded bg-white outline-none cursor-pointer text-slate-700 focus:border-blue-500"
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-slate-400 text-[12px]">to</span>
                              <select
                                value={day.end}
                                onChange={(e) => handleDayTimeChange(idx, 'end', e.target.value)}
                                className="px-2 py-1 text-[12.5px] border border-slate-200 rounded bg-white outline-none cursor-pointer text-slate-700 focus:border-blue-500"
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          ) : (
                            <span className="text-[12px] text-slate-400 italic pr-8">Closed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight uppercase">Schedule Setup</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm p-6 space-y-4">
                      <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Calendar Preferences</h3>
                      
                      <div className="space-y-4">
                        <BoxSelectInput
                          label="Calendar Slot Interval"
                          value={scheduleSetup.slotInterval}
                          onChange={(e) => setScheduleSetup(prev => ({ ...prev, slotInterval: e.target.value }))}
                          options={[
                            { value: '10 mins', label: '10 Minutes' },
                            { value: '15 mins', label: '15 Minutes' },
                            { value: '20 mins', label: '20 Minutes' },
                            { value: '30 mins', label: '30 Minutes' },
                          ]}
                        />
                        <BoxSelectInput
                          label="Default Calendar View"
                          value={scheduleSetup.defaultView}
                          onChange={(e) => setScheduleSetup(prev => ({ ...prev, defaultView: e.target.value }))}
                          options={[
                            { value: 'Day View', label: 'Day View' },
                            { value: 'Week View', label: 'Week View' },
                            { value: 'Month View', label: 'Month View' },
                          ]}
                        />
                        <BoxSelectInput
                          label="Prevent online booking within"
                          value={scheduleSetup.preventBookingWithin}
                          onChange={(e) => setScheduleSetup(prev => ({ ...prev, preventBookingWithin: e.target.value }))}
                          options={[
                            { value: '1 hour', label: '1 Hour' },
                            { value: '2 hours', label: '2 Hours' },
                            { value: '12 hours', label: '12 Hours' },
                            { value: '24 hours', label: '24 Hours' },
                          ]}
                        />

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="onlineBooking"
                            checked={scheduleSetup.onlineBooking}
                            onChange={(e) => setScheduleSetup(prev => ({ ...prev, onlineBooking: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <label htmlFor="onlineBooking" className="text-[12.5px] font-semibold text-slate-600 cursor-pointer select-none">
                            Allow Online Booking for Patients
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm p-6 space-y-4">
                      <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Active Appointment Statuses</h3>
                      <p className="text-[11.5px] text-slate-400">Configure which statuses you want to track in your workflow.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {Object.keys(scheduleSetup.enabledStatuses).map((status) => (
                          <div key={status} className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              id={`status-${status}`}
                              checked={scheduleSetup.enabledStatuses[status]}
                              onChange={(e) => {
                                const nextStatuses = { ...scheduleSetup.enabledStatuses, [status]: e.target.checked };
                                setScheduleSetup(prev => ({ ...prev, enabledStatuses: nextStatuses }));
                              }}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`status-${status}`} className="text-[12.5px] font-medium text-slate-600 cursor-pointer select-none">
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight uppercase">Billing Configuration</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm p-6 space-y-4">
                      <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Billing & Tax Preferences</h3>
                      
                      <div className="space-y-4">
                        <BoxSelectInput
                          label="Currency"
                          value={billingConfig.currency}
                          onChange={(e) => setBillingConfig(prev => ({ ...prev, currency: e.target.value }))}
                          options={[
                            { value: 'USD', label: 'USD ($)' },
                            { value: 'GBP', label: 'GBP (£)' },
                            { value: 'EUR', label: 'EUR (€)' },
                            { value: 'PKR', label: 'PKR (Rs.)' },
                            { value: 'INR', label: 'INR (₹)' },
                          ]}
                        />
                        <BoxTextInput
                          label="Default Tax Rate (%)"
                          placeholder="5.0"
                          value={billingConfig.taxRate}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setBillingConfig(prev => ({ ...prev, taxRate: val }));
                          }}
                        />
                        <BoxSelectInput
                          label="Standard Payment Terms"
                          value={billingConfig.paymentTerms}
                          onChange={(e) => setBillingConfig(prev => ({ ...prev, paymentTerms: e.target.value }))}
                          options={[
                            { value: 'Due on Receipt', label: 'Due on Receipt' },
                            { value: 'Net 15', label: 'Net 15 Days' },
                            { value: 'Net 30', label: 'Net 30 Days' },
                          ]}
                        />

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="enableInvoices"
                            checked={billingConfig.enableInvoices}
                            onChange={(e) => setBillingConfig(prev => ({ ...prev, enableInvoices: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <label htmlFor="enableInvoices" className="text-[12.5px] font-semibold text-slate-600 cursor-pointer select-none">
                            Automatically Generate Invoices on checkout
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm p-6 space-y-4">
                      <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Supported Payment Gateways</h3>
                      <p className="text-[11.5px] text-slate-400">Select which options you accept for invoice payments.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {Object.keys(billingConfig.paymentGateways).map((gateway) => (
                          <div key={gateway} className="flex items-center gap-2.5 p-2.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              id={`gateway-${gateway}`}
                              checked={billingConfig.paymentGateways[gateway]}
                              onChange={(e) => {
                                const nextGateways = { ...billingConfig.paymentGateways, [gateway]: e.target.checked };
                                setBillingConfig(prev => ({ ...prev, paymentGateways: nextGateways }));
                              }}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`gateway-${gateway}`} className="text-[12.5px] font-medium text-slate-600 cursor-pointer select-none">
                              {gateway}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div> 

          <div className="bg-[#f4f7fa] border-t border-slate-200/60 px-8 py-4 flex justify-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 text-[12.5px] font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Finish Later
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 text-[12.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-all active:scale-[0.98] cursor-pointer"
            >
              {currentStep === STEPS.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
};

export default PracticeOnboarding;
export default PracticeOnboarding;

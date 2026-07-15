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
    zipCode: '',
    timeZone: '',
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    googleBusinessUrl: '',
    twitterUrl: '',
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
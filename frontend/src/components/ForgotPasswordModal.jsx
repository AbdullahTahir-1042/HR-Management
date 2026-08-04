import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2, X, AlertCircle } from 'lucide-react';
import apiClient from '../api/axiosClient';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(180); // 3 minutes = 180 seconds

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setError('OTP has expired. Please request a new one.');
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleClose = () => {
        setStep(1);
        setEmail('');
        setOtp(['', '', '', '', '', '']);
        setPasswords({ newPassword: '', confirmPassword: '' });
        setError('');
        setTimer(180);
        onClose();
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) return setError('Please enter your email address.');

        setLoading(true);
        try {
            const res = await apiClient.post('/auth/forgot-password', { email });
            if (res.data && res.data.bypassOtp) {
                alert(res.data.msg);
                handleClose();
                return;
            }
            setStep(2);
            setTimer(180);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Prevent multiple chars
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value !== '' && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setError('');
        const enteredOtp = otp.join('');
        if (enteredOtp.length < 6) return setError('Please enter the 6-digit OTP.');
        setStep(3);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (passwords.newPassword.length < 6) return setError('Password must be at least 6 characters.');
        if (passwords.newPassword !== passwords.confirmPassword) return setError('Passwords do not match.');

        setLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                email,
                otp: otp.join(''),
                newPassword: passwords.newPassword
            });
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            {step === 1 && <><Mail size={20} className="text-indigo-600" /> Reset Password</>}
                            {step === 2 && <><KeyRound size={20} className="text-indigo-600" /> Enter OTP</>}
                            {step === 3 && <><Lock size={20} className="text-indigo-600" /> New Password</>}
                            {step === 4 && <><CheckCircle2 size={20} className="text-emerald-500" /> Success</>}
                        </h2>
                        <button onClick={handleClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-6">
                                        {import.meta.env.VITE_LOCAL_TESTING_MODE === 'true' 
                                            ? "Write your email and HR will be notified and will send you a new temporary password." 
                                            : "Enter your account email address. We'll send a 6-digit OTP to verify your identity."}
                                    </p>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Sending...' : (import.meta.env.VITE_LOCAL_TESTING_MODE === 'true' ? 'SEND REQ' : 'Send OTP')} <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                                <p className="text-sm font-medium text-slate-500">
                                    We've sent a code to <span className="font-bold text-slate-700">{email}</span>.
                                    <br />Enter it below to continue.
                                </p>
                                
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value.replace(/[^0-9]/g, ''))}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all"
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                    <span>Time remaining: <span className={`${timer < 60 ? 'text-rose-500' : 'text-indigo-600'}`}>{formatTime(timer)}</span></span>
                                    {timer === 0 && (
                                        <button type="button" onClick={handleSendOtp} className="text-indigo-600 hover:underline">
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={timer === 0}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify Code
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        {step === 4 && (
                            <div className="text-center py-6 space-y-4">
                                <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Password Reset!</h3>
                                <p className="text-sm font-medium text-slate-500 px-4">
                                    Your password has been successfully reset. You can now use your new password to log in.
                                </p>
                                <div className="pt-6">
                                    <button
                                        onClick={handleClose}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ForgotPasswordModal;

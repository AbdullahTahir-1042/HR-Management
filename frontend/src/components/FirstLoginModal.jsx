import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/axiosClient';
import { Lock, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const FirstLoginModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useContext(AuthContext);

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen || !user || user.isFirstLogin === false) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!form.currentPassword) {
            return setError('Please enter your current password.');
        }
        if (!form.newPassword || form.newPassword.length < 6 || !/[a-zA-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
            return setError('New password must be at least 6 characters with both letters and numbers.');
        }
        if (form.newPassword !== form.confirmPassword) {
            return setError('New password and confirm password do not match.');
        }

        setSubmitting(true);
        try {
            const res = await apiClient.post('/auth/change-first-password', form);
            if (res.data && res.data.user) {
                updateUser(res.data.user);
            } else {
                updateUser({ ...user, isFirstLogin: false });
            }

            setSuccessMsg('Password updated successfully.');
            setTimeout(() => {
                setSubmitting(false);
                if (onClose) onClose();
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update password. Please check your current password.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">First Login Password Change</h2>
                    <p className="text-xs text-indigo-100 mt-2.5 leading-relaxed bg-white/10 p-2.5 rounded-xl border border-white/10">
                        For security reasons, please change your password before continuing.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Current Password *</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPass ? 'text' : 'password'}
                                    value={form.currentPassword}
                                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                    placeholder="Enter password provided by HR"
                                    required
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">New Password *</label>
                            <div className="relative">
                                <input
                                    type={showNewPass ? 'text' : 'password'}
                                    value={form.newPassword}
                                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                    placeholder="Min 6 chars (letters & numbers)"
                                    required
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Confirm Password *</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPass ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    placeholder="Re-enter new password"
                                    required
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <span>Update Password</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FirstLoginModal;

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLogin && formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        setLoading(true);
        try {
            if (isLogin) {
                const user = await login(formData.email, formData.password);
                navigate(user.role === 'hr' ? '/hr' : '/employee');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, formData);
                alert('Registered successfully! Now login.');
                setIsLogin(true);
            }
        } catch (err) {
            alert(err.response?.data?.msg || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 relative overflow-hidden font-sans">
            {/* Background Decorative Elements - Increased Opacity */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-80 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-80 animate-pulse" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
                {/* Header section */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-indigo-600 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-200">
                        <ShieldCheck size={28} />
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.h2 
                            key={isLogin ? 'login' : 'register'}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-3xl font-bold text-slate-800 tracking-tight"
                        >
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </motion.h2>
                    </AnimatePresence>
                    <p className="text-slate-500 mt-2 text-sm">
                        {isLogin ? 'Please enter your details to sign in' : 'Join our team today'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="relative overflow-hidden"
                            >
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                                    placeholder="Full Name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                    required 
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            placeholder="Email Address" 
                            type="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            placeholder="Password" 
                            type={showPassword ? "text" : "password"} 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            required 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                                placeholder="Confirm Password" 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={formData.confirmPassword} 
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    )}

                    <motion.button 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Register Now'}
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                    <p className="text-slate-500 text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-indigo-600 font-bold hover:underline underline-offset-4 transition-all"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
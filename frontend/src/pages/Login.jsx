import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, EyeOff, Eye, Loader2, ShieldCheck } from 'lucide-react';

const getDashboardPath = (role) => {
    if (role === 'hr') return '/hr';
    return '/employee';
};

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate(getDashboardPath(user.role), { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loggedInUser = await login(formData.email, formData.password);
            navigate(getDashboardPath(loggedInUser.role), { replace: true });
        } catch (err) {
            alert(err.response?.data?.msg || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-80 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-80 animate-pulse" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/95 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-indigo-600 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-200">
                        <ShieldCheck size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 mt-2 text-sm">Please enter your details to sign in</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            placeholder="Email Address" type="email"
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
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                    </motion.button>
                </form>
                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                    <p className="text-slate-500 text-sm">Contact HR if you need an account</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
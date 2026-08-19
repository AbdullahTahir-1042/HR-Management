import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LeaveRequestCard = ({ leave, user }) => {
    const [status, setStatus] = useState(leave.status);
    const [loading, setLoading] = useState(false);

    const handleAction = async (action) => {
        setLoading(true);
        try {
            const endpoint = user.role === 'hr' ? `/leaves/${leave._id}/hr-review` : `/leaves/${leave._id}/team-lead-review`;
            await apiClient.put(endpoint, { action, remark: 'Actioned via HR Assistant' });
            setStatus(action);
        } catch (err) {
            console.error('Error actioning leave:', err);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'approved' || status === 'rejected' || status === 'hr_rejected') {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{leave.employee?.name}</span>'s leave was <span className="font-bold">{status.includes('reject') ? 'Rejected' : 'Approved'}</span>.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-2 w-64 sm:w-72">
            <div className="flex items-center gap-3">
                {leave.employee?.photo ? (
                    <img src={leave.employee.photo} alt="" className="w-9 h-9 rounded-full object-cover shadow-sm" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                        {leave.employee?.name?.charAt(0)}
                    </div>
                )}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{leave.employee?.name}</h4>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{leave.leaveType?.name}</p>
                </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-700 dark:text-slate-200">Reason:</span> {leave.reason}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">
                {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
            </div>
            <div className="flex gap-2 mt-1">
                <button 
                    onClick={() => handleAction('approved')}
                    disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                    {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Approve'}
                </button>
                <button 
                    onClick={() => handleAction(user.role === 'hr' ? 'hr_rejected' : 'rejected')}
                    disabled={loading}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                    {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Reject'}
                </button>
            </div>
        </div>
    );
};

const VirtualHRAssistant = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', parts: `Hi ${user?.name || 'there'}! I'm your Virtual HR Assistant ✨ How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toolStatus, setToolStatus] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const suggestedActions = user?.role === 'hr' 
        ? ["👥 Employee Directory", "📝 Pending Leaves", "🎫 Open HR Requests"]
        : ["🏖️ Apply for Leave", "🗓️ My Attendance History", "🎉 Show Company Public Holidays"];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await apiClient.get('/ai/chat/history');
                if (res.data && res.data.history && res.data.history.length > 0) {
                    setMessages(res.data.history);
                }
            } catch (err) {
                console.error("Could not fetch chat history", err);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleClearChat = async () => {
        try {
            await apiClient.delete('/ai/chat/history');
            setMessages([{ role: 'model', parts: `Hi ${user?.name || 'there'}! I'm your Virtual HR Assistant ✨ How can I help you today?` }]);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('Failed to clear chat', err);
        }
    };

    const handleSend = async (e, directMessage = null) => {
        if (e) e.preventDefault();
        
        const messageToSend = directMessage || input.trim();
        if (!messageToSend || isLoading) return;

        setInput('');
        
        // Add user message to UI immediately
        setMessages(prev => [...prev, { role: 'user', parts: messageToSend }]);
        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('token') || sessionStorage.getItem('x-auth-token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            const res = await fetch(`${apiUrl}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ message: messageToSend })
            });

            if (!res.ok) {
                throw new Error("API Error");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            let isFirstChunk = true;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunkString = decoder.decode(value, { stream: true });
                const lines = chunkString.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        if (dataStr) {
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.type === 'status') {
                                    setToolStatus(parsed.text);
                                } else if (parsed.type === 'ui') {
                                    setToolStatus(null);
                                    setMessages(prev => [...prev, { role: 'ui', component: parsed.component, data: parsed.data }]);
                                } else if (parsed.text) {
                                    setToolStatus(null);
                                    if (isFirstChunk) {
                                        setIsLoading(false);
                                        setMessages(prev => [...prev, { role: 'model', parts: parsed.text }]);
                                        isFirstChunk = false;
                                    } else {
                                        setMessages(prev => {
                                            const newMsgs = [...prev];
                                            const lastIdx = newMsgs.length - 1;
                                            newMsgs[lastIdx] = {
                                                ...newMsgs[lastIdx],
                                                parts: newMsgs[lastIdx].parts + parsed.text
                                            };
                                            return newMsgs;
                                        });
                                    }
                                }
                            } catch (e) {
                                console.error("Parse error", e);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: "I'm having trouble connecting to my brain right now. Please try again later!" 
            }]);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-[450px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                        style={{ height: '600px', maxHeight: '85vh' }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-600 flex items-center justify-between shadow-sm z-10 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">HR Assistant</h3>
                                    <p className="text-xs text-indigo-200">Powered by AI</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={handleClearChat}
                                    className="flex items-center gap-1.5 text-indigo-100 hover:text-white px-2.5 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs font-medium tracking-wide"
                                >
                                    <Plus size={14} />
                                    <span>New Chat</span>
                                </button>

                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0 ml-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 no-scrollbar">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div 
                                        className={`rounded-2xl text-sm ${msg.role !== 'ui' ? 'prose prose-sm dark:prose-invert p-3' : 'w-full'} ${
                                            msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                                                : msg.role === 'model'
                                                    ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
                                                    : 'bg-transparent'
                                        }`}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.parts
                                        ) : msg.role === 'ui' ? (
                                            msg.component === 'LeaveRequests' && (
                                                <div className="flex flex-col gap-3 w-full items-start">
                                                    {msg.data.length > 0 ? msg.data.map(leave => (
                                                        <LeaveRequestCard key={leave._id} leave={leave} user={user} />
                                                    )) : (
                                                        <p className="text-slate-500 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">No pending requests found.</p>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.parts}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(isLoading || toolStatus) && (
                                <div className="flex items-start gap-2 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm rounded-tl-sm flex items-center gap-2">
                                        {toolStatus ? (
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wide">
                                                <Loader2 size={14} className="animate-spin text-indigo-500" />
                                                {toolStatus}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Actions & Input */}
                        <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex flex-col">
                            <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar border-b border-slate-50 dark:border-slate-700/50">
                                {suggestedActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(null, action.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim())}
                                        disabled={isLoading}
                                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleSend} className="p-3 flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={user?.role === 'hr' ? "Lookup employee attendance, requests..." : "Ask about leaves, policies..."}
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-colors z-50 relative ${
                    isOpen ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </motion.button>
        </div>
    );
};

export default VirtualHRAssistant;

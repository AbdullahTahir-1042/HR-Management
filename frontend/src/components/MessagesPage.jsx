import { useState, useEffect, useRef, useContext, useMemo, useLayoutEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Search, Plus, Send, Users, X, Loader2,
    ArrowLeft, UserPlus, Check, CheckCheck, Clock, Reply,
    Trash2, Settings, ShieldCheck, ShieldOff, LogOut, ChevronUp, Sparkles,
    Info, Mail, Building2, BadgeCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const POLL_INTERVAL_MS = 3000;
const TYPING_PING_THROTTLE_MS = 2000;
const ONLINE_THRESHOLD_MS = 20000;
const PAGE_SIZE = 50;

const MessagesPage = () => {
    const { user: authUser } = useContext(AuthContext);
    const currentUserId = authUser?.id || authUser?._id;

    const [conversations, setConversations] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);

    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatMode, setNewChatMode] = useState('dm');
    const [colleagueSearch, setColleagueSearch] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState('');

    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [groupSettingsName, setGroupSettingsName] = useState('');
    const [groupSettingsError, setGroupSettingsError] = useState('');
    const [savingGroupSettings, setSavingGroupSettings] = useState(false);

    const activeConversationRef = useRef(null);
    const messagesEndRef = useRef(null);
    const threadScrollRef = useRef(null);
    const lastTypingPingAtRef = useRef(0);
    const prevConversationsRef = useRef([]);
    const pendingScrollAdjustRef = useRef(null);
    const [notifPermission, setNotifPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    );

    const getToken = () =>
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('x-auth-token') ||
        null;

    const authHeaders = () => ({ headers: { 'x-auth-token': getToken() } });

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().then(setNotifPermission);
        }
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/conversations`, authHeaders());
            notifyOnNewMessages(prevConversationsRef.current, res.data);
            prevConversationsRef.current = res.data;
            setConversations(res.data);

            // Keep the open thread's header (admin badges, member list, online dot) in sync.
            const active = activeConversationRef.current;
            if (active) {
                const fresh = res.data.find(c => c._id === active._id);
                if (fresh) setActiveConversation(prev => (prev ? { ...prev, ...fresh } : prev));
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    const notifyOnNewMessages = (prevList, nextList) => {
        if (notifPermission !== 'granted') return;
        const prevById = new Map(prevList.map(c => [c._id, c]));
        for (const conv of nextList) {
            if (activeConversationRef.current?._id === conv._id) continue;
            const prev = prevById.get(conv._id);
            const wasUnread = prev?.unreadCount || 0;
            if (conv.unreadCount > wasUnread && !conv.lastMessageFromMe) {
                try {
                    new Notification(conv.name, { body: conv.lastMessage || 'New message', tag: conv._id });
                } catch {
                    // Notification constructor can throw in some contexts (e.g. no active document focus) — non-critical.
                }
            }
        }
    };

    const fetchColleagues = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/colleagues`, authHeaders());
            setColleagues(res.data);
        } catch (err) {
            console.error('Error fetching colleagues:', err);
        }
    };

    const fetchThread = async (conversationId, { silent = false } = {}) => {
        if (!silent) setLoadingThread(true);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`,
                authHeaders()
            );
            setMessages(res.data.messages);
            setHasMore(res.data.hasMore);
            setTypingUsers(res.data.typingUsers || []);
            setActiveConversation(prev => (prev && prev._id === conversationId ? { ...prev, ...res.data.conversation } : prev));
        } catch (err) {
            console.error('Error fetching thread:', err);
        } finally {
            if (!silent) setLoadingThread(false);
        }
    };

    const loadOlderMessages = async () => {
        if (!activeConversation || messages.length === 0 || loadingOlder) return;
        setLoadingOlder(true);
        const container = threadScrollRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/messages?limit=${PAGE_SIZE}&before=${messages[0]._id}`,
                authHeaders()
            );
            setMessages(prev => [...res.data.messages, ...prev]);
            setHasMore(res.data.hasMore);
            pendingScrollAdjustRef.current = prevScrollHeight;
        } catch (err) {
            console.error('Error loading older messages:', err);
        } finally {
            setLoadingOlder(false);
        }
    };

    // Anchor scroll position after prepending older messages so the view doesn't jump.
    useLayoutEffect(() => {
        if (pendingScrollAdjustRef.current != null && threadScrollRef.current) {
            const container = threadScrollRef.current;
            container.scrollTop = container.scrollHeight - pendingScrollAdjustRef.current;
            pendingScrollAdjustRef.current = null;
        }
    }, [messages]);

    useEffect(() => {
        fetchConversations();
        fetchColleagues();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations();
            if (activeConversationRef.current) {
                fetchThread(activeConversationRef.current._id, { silent: true });
            }
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifPermission]);

    useEffect(() => {
        if (pendingScrollAdjustRef.current == null) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    const openConversation = (conv) => {
        setActiveConversation(conv);
        setMessages([]);
        setHasMore(false);
        setReplyingTo(null);
        setMessageText('');
        fetchThread(conv._id);
        setConversations(prev => prev.map(c => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)));
    };

    const pingTyping = () => {
        if (!activeConversation) return;
        const now = Date.now();
        if (now - lastTypingPingAtRef.current < TYPING_PING_THROTTLE_MS) return;
        lastTypingPingAtRef.current = now;
        axios.post(`${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/typing`, {}, authHeaders())
            .catch(() => {});
    };

    const handleInputChange = (e) => {
        setMessageText(e.target.value);
        pingTyping();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const text = messageText.trim();
        if (!text || !activeConversation) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            text,
            createdAt: new Date().toISOString(),
            sender: { _id: currentUserId, name: authUser?.name },
            replyTo: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, senderName: replyingTo.sender?.name } : null,
            deliveredCount: 0,
            readCount: 0,
            totalRecipients: (activeConversation.participants?.length || 1) - 1,
            _sending: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageText('');
        const replyToId = replyingTo?._id;
        setReplyingTo(null);

        try {
            setSending(true);
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/messages`,
                { text, replyTo: replyToId },
                authHeaders()
            );
            setMessages(prev => prev.map(m => (m._id === tempId ? res.data : m)));
            fetchConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m._id !== tempId));
            setMessageText(text);
        } finally {
            setSending(false);
        }
    };

    const startReply = (message) => {
        setReplyingTo(message);
    };

    const startDM = async (userId) => {
        try {
            setCreating(true);
            setFormError('');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/conversations/dm`, { userId }, authHeaders());
            setConversations(prev => (prev.some(c => c._id === res.data._id) ? prev : [res.data, ...prev]));
            openConversation(res.data);
            closeNewChat();
        } catch (err) {
            setFormError(err.response?.data?.msg || 'Failed to start conversation');
        } finally {
            setCreating(false);
        }
    };

    const createGroup = async () => {
        if (!groupName.trim()) { setFormError('Group name is required'); return; }
        if (selectedMembers.length === 0) { setFormError('Select at least one member'); return; }
        try {
            setCreating(true);
            setFormError('');
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/conversations/group`,
                { name: groupName.trim(), participantIds: selectedMembers },
                authHeaders()
            );
            setConversations(prev => [res.data, ...prev]);
            openConversation(res.data);
            closeNewChat();
        } catch (err) {
            setFormError(err.response?.data?.msg || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const closeNewChat = () => {
        setShowNewChat(false);
        setNewChatMode('dm');
        setColleagueSearch('');
        setGroupName('');
        setSelectedMembers([]);
        setFormError('');
    };

    const toggleMember = (id) => {
        setSelectedMembers(prev => (prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]));
    };

    const openGroupSettings = () => {
        setGroupSettingsName(activeConversation.name);
        setGroupSettingsError('');
        setShowGroupSettings(true);
    };

    const openConversationInfo = () => {
        if (activeConversation.type === 'group') {
            openGroupSettings();
        } else {
            setShowContactInfo(true);
        }
    };

    const saveGroupName = async () => {
        if (!groupSettingsName.trim()) { setGroupSettingsError('Group name is required'); return; }
        try {
            setSavingGroupSettings(true);
            setGroupSettingsError('');
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}`,
                { name: groupSettingsName.trim() },
                authHeaders()
            );
            setActiveConversation(prev => ({ ...prev, ...res.data }));
            setConversations(prev => prev.map(c => (c._id === res.data._id ? res.data : c)));
        } catch (err) {
            setGroupSettingsError(err.response?.data?.msg || 'Failed to rename group');
        } finally {
            setSavingGroupSettings(false);
        }
    };

    const toggleAdmin = async (userId) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/participants/${userId}/promote`,
                {},
                authHeaders()
            );
            setActiveConversation(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to update admin status');
        }
    };

    const removeMember = async (userId) => {
        if (!window.confirm('Remove this member from the group?')) return;
        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/participants/${userId}`,
                authHeaders()
            );
            setActiveConversation(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to remove member');
        }
    };

    const leaveGroup = async () => {
        if (!window.confirm('Leave this group?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/conversations/${activeConversation._id}/participants/me`, authHeaders());
            setConversations(prev => prev.filter(c => c._id !== activeConversation._id));
            setActiveConversation(null);
            setShowGroupSettings(false);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to leave group');
        }
    };

    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;
        const q = searchTerm.toLowerCase();
        return conversations.filter(c => c.name?.toLowerCase().includes(q));
    }, [conversations, searchTerm]);

    const filteredColleagues = useMemo(() => {
        if (!colleagueSearch.trim()) return colleagues;
        const q = colleagueSearch.toLowerCase();
        return colleagues.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
    }, [colleagues, colleagueSearch]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOnline = (lastSeenAt) => lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

    const formatLastSeen = (lastSeenAt) => {
        const diffMs = Date.now() - new Date(lastSeenAt).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const presenceLabel = (lastSeenAt) => {
        if (isOnline(lastSeenAt)) return 'Online';
        if (!lastSeenAt) return 'Offline';
        return `Last seen ${formatLastSeen(lastSeenAt)}`;
    };

    const initials = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

    // Deterministic per-person color so avatars are easy to tell apart at a
    // glance, the way Slack/Linear assign a stable color per user.
    const AVATAR_PALETTE = [
        { bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-50' },
        { bg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-50' },
        { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-50' },
        { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-50' },
        { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-50' },
        { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-50' },
        { bg: 'bg-pink-100', text: 'text-pink-600', ring: 'ring-pink-50' },
        { bg: 'bg-teal-100', text: 'text-teal-600', ring: 'ring-teal-50' },
    ];
    const avatarColor = (seed = '') => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
    };

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    const StatusTicks = ({ message }) => {
        let status = 'sent';
        if (message._sending) status = 'sending';
        else if (message.totalRecipients > 0 && message.readCount >= message.totalRecipients) status = 'seen';
        else if (message.totalRecipients > 0 && message.deliveredCount >= message.totalRecipients) status = 'delivered';

        const icons = {
            sending: <Clock size={13} className="text-white/70" />,
            sent: <Check size={13} className="text-white/70" />,
            delivered: <CheckCheck size={13} className="text-white/70" />,
            seen: <CheckCheck size={13} className="text-sky-300" />
        };

        return (
            <AnimatePresence mode="wait">
                <motion.span
                    key={status}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="inline-flex"
                >
                    {icons[status]}
                </motion.span>
            </AnimatePresence>
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Messages</h2>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                        {totalUnread > 0 && <span className="text-rose-500 font-semibold"> · {totalUnread} unread</span>}
                    </p>
                </div>
                <motion.button
                    onClick={() => setShowNewChat(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 transition-shadow"
                >
                    <Plus size={16} />
                    New Chat
                </motion.button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden flex h-[calc(100vh-180px)] min-h-[600px]">
                {/* Conversation list */}
                <div className={`w-full sm:w-80 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/40 ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-3.5 border-b border-slate-100">
                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
                        {loadingConversations ? (
                            <div className="p-10 text-center text-slate-400">
                                <Loader2 size={24} className="mx-auto mb-2 animate-spin opacity-40" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle size={24} className="text-indigo-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500">No conversations yet</p>
                                <p className="text-xs mt-1 text-slate-400">Start a new chat to get going.</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const color = avatarColor(conv.type === 'group' ? conv._id : (conv.otherUser?._id || conv._id));
                                const isActive = activeConversation?._id === conv._id;
                                return (
                                    <motion.button
                                        layout
                                        key={conv._id}
                                        onClick={() => openConversation(conv)}
                                        className={`group w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors ${
                                            isActive ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-105 ${color.bg} ${color.text}`}>
                                                {conv.type === 'group' ? <Users size={17} /> : initials(conv.name)}
                                            </div>
                                            {conv.type === 'dm' && isOnline(conv.otherUser?.lastSeenAt) && (
                                                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>{conv.name}</p>
                                                <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                                                {conv.lastMessageFromMe && conv.lastMessage ? 'You: ' : ''}
                                                {conv.lastMessage || (conv.type === 'group' ? `${conv.memberCount} members` : 'No messages yet')}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <motion.span
                                                key={conv.unreadCount}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full shrink-0"
                                            >
                                                {conv.unreadCount}
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Thread */}
                <div className={`flex-1 flex-col ${activeConversation ? 'flex' : 'hidden sm:flex'}`}>
                    {!activeConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-white to-slate-50/60">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                                <MessageCircle size={28} className="text-indigo-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">Select a conversation</p>
                            <p className="text-xs text-slate-400 mt-1">Pick a chat from the list to start messaging.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white/80 backdrop-blur-sm">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="sm:hidden text-slate-400 hover:text-slate-600"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button
                                    onClick={openConversationInfo}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl -mx-2 px-2 py-1 cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                                            avatarColor(activeConversation.type === 'group' ? activeConversation._id : (activeConversation.otherUser?._id || activeConversation._id)).bg
                                        } ${avatarColor(activeConversation.type === 'group' ? activeConversation._id : (activeConversation.otherUser?._id || activeConversation._id)).text}`}>
                                            {activeConversation.type === 'group' ? <Users size={15} /> : initials(activeConversation.name)}
                                        </div>
                                        {activeConversation.type === 'dm' && isOnline(activeConversation.otherUser?.lastSeenAt) && (
                                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{activeConversation.name}</p>
                                        {activeConversation.type === 'group' ? (
                                            <p className="text-[11px] text-slate-400 truncate">
                                                {activeConversation.participants?.map(p => p.name).join(', ')}
                                            </p>
                                        ) : (
                                            <p className={`text-[11px] truncate flex items-center gap-1 ${isOnline(activeConversation.otherUser?.lastSeenAt) ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                                                {isOnline(activeConversation.otherUser?.lastSeenAt) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                {presenceLabel(activeConversation.otherUser?.lastSeenAt)}
                                            </p>
                                        )}
                                    </div>
                                </button>
                                <button onClick={openConversationInfo} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0" title="Info">
                                    {activeConversation.type === 'group' ? <Settings size={17} /> : <Info size={17} />}
                                </button>
                            </div>

                            <div ref={threadScrollRef} className="flex-1 overflow-y-auto p-5 bg-[linear-gradient(to_bottom,white,theme(colors.slate.50/60))]">
                                {loadingThread ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        <Loader2 size={24} className="animate-spin opacity-40" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Sparkles size={22} className="text-indigo-200 mb-2" />
                                        <p className="text-sm font-medium">No messages yet. Say hello!</p>
                                    </div>
                                ) : (
                                    <>
                                        {hasMore && (
                                            <div className="flex justify-center pb-3">
                                                <button
                                                    onClick={loadOlderMessages}
                                                    disabled={loadingOlder}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {loadingOlder ? <Loader2 size={13} className="animate-spin" /> : <ChevronUp size={13} />}
                                                    Load earlier messages
                                                </button>
                                            </div>
                                        )}
                                        {messages.map((msg, idx) => {
                                            const isMine = msg.sender?._id === currentUserId;
                                            const prevMsg = messages[idx - 1];
                                            const isConsecutive = prevMsg
                                                && prevMsg.sender?._id === msg.sender?._id
                                                && new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60 * 1000;
                                            const showSender = activeConversation.type === 'group' && !isMine && !isConsecutive;
                                            return (
                                                <motion.div
                                                    key={msg._id}
                                                    layout="position"
                                                    initial={{ opacity: 0, y: 14, scale: 0.94 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                    className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
                                                >
                                                    {showSender && (
                                                        <span className="text-[11px] font-semibold text-slate-400 mb-1 ml-1">{msg.sender?.name}</span>
                                                    )}
                                                    <div className="flex items-center gap-1 max-w-[85%]">
                                                        {isMine && (
                                                            <button
                                                                onClick={() => startReply(msg)}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all"
                                                                title="Reply"
                                                            >
                                                                <Reply size={14} />
                                                            </button>
                                                        )}
                                                        <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-transform hover:-translate-y-0.5 ${
                                                            isMine
                                                                ? `bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl ${isConsecutive ? 'rounded-tr-md' : ''} rounded-br-md`
                                                                : `bg-white text-slate-700 border border-slate-100 rounded-2xl ${isConsecutive ? 'rounded-tl-md' : ''} rounded-bl-md`
                                                        }`}>
                                                            {msg.replyTo && (
                                                                <div className={`mb-1.5 pl-2 border-l-2 text-xs rounded-sm ${isMine ? 'border-white/40 text-white/70' : 'border-indigo-300 text-slate-400'}`}>
                                                                    <p className="font-semibold">{msg.replyTo.senderName}</p>
                                                                    <p className="truncate max-w-[220px]">{msg.replyTo.text}</p>
                                                                </div>
                                                            )}
                                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                                        </div>
                                                        {!isMine && (
                                                            <button
                                                                onClick={() => startReply(msg)}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all"
                                                                title="Reply"
                                                            >
                                                                <Reply size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center gap-1 mt-1 mx-1 transition-opacity ${isMine ? 'flex-row-reverse' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                                                        {isMine && <StatusTicks message={msg} />}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <AnimatePresence>
                                {typingUsers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-5 overflow-hidden"
                                    >
                                        <div className="py-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-500">
                                            <span className="flex gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                                            </span>
                                            {typingUsers.map(t => t.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {replyingTo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mx-4 overflow-hidden"
                                    >
                                        <div className="mb-2 px-3 py-2 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start justify-between gap-2">
                                            <div className="min-w-0 border-l-2 border-indigo-300 pl-2">
                                                <p className="text-[11px] font-bold text-indigo-500">Replying to {replyingTo.sender?.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{replyingTo.text}</p>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white">
                                <input
                                    value={messageText}
                                    onChange={handleInputChange}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 focus:bg-white transition-all"
                                />
                                <motion.button
                                    type="submit"
                                    disabled={sending || !messageText.trim()}
                                    whileHover={!sending && messageText.trim() ? { scale: 1.08 } : {}}
                                    whileTap={!sending && messageText.trim() ? { scale: 0.85, rotate: -12 } : {}}
                                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 disabled:opacity-40 disabled:shadow-none transition-shadow shrink-0"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </motion.button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* New chat panel */}
            <AnimatePresence>
                {showNewChat && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeNewChat}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 w-full max-w-md max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-800">New Conversation</h3>
                                <button onClick={closeNewChat} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex px-5 pt-4 gap-2">
                                <button
                                    onClick={() => { setNewChatMode('dm'); setFormError(''); }}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        newChatMode === 'dm' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    Direct Message
                                </button>
                                <button
                                    onClick={() => { setNewChatMode('group'); setFormError(''); }}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        newChatMode === 'group' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    Group
                                </button>
                            </div>

                            {newChatMode === 'group' && (
                                <div className="px-5 pt-4">
                                    <input
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="Group name"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                                    />
                                </div>
                            )}

                            <div className="px-5 pt-4">
                                <div className="relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={colleagueSearch}
                                        onChange={(e) => setColleagueSearch(e.target.value)}
                                        placeholder="Search colleagues..."
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1 min-h-[200px]">
                                {filteredColleagues.length === 0 ? (
                                    <p className="text-center text-sm text-slate-400 py-8">No colleagues found.</p>
                                ) : (
                                    filteredColleagues.map(person => {
                                        const isSelected = selectedMembers.includes(person._id);
                                        const color = avatarColor(person._id);
                                        return (
                                            <button
                                                key={person._id}
                                                onClick={() => (newChatMode === 'dm' ? startDM(person._id) : toggleMember(person._id))}
                                                disabled={creating}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}>
                                                        {initials(person.name)}
                                                    </div>
                                                    {isOnline(person.lastSeenAt) && (
                                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-sm font-semibold text-slate-700 truncate">{person.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{person.department || person.email}</p>
                                                </div>
                                                {newChatMode === 'group' && (
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                                    }`}>
                                                        {isSelected && <Check size={13} className="text-white" />}
                                                    </div>
                                                )}
                                                {newChatMode === 'dm' && <UserPlus size={15} className="text-slate-300 shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {formError && (
                                <p className="mx-5 mb-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {formError}
                                </p>
                            )}

                            {newChatMode === 'group' && (
                                <div className="p-5 border-t border-slate-100">
                                    <button
                                        onClick={createGroup}
                                        disabled={creating}
                                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                    >
                                        {creating && <Loader2 size={14} className="animate-spin" />}
                                        Create Group {selectedMembers.length > 0 && `(${selectedMembers.length + 1})`}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Group settings panel */}
            <AnimatePresence>
                {showGroupSettings && activeConversation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowGroupSettings(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 w-full max-w-md max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-800">Group Info</h3>
                                <button onClick={() => setShowGroupSettings(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-5 pt-4 space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={groupSettingsName}
                                        onChange={(e) => setGroupSettingsName(e.target.value)}
                                        disabled={!activeConversation.viewerIsAdmin}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all disabled:bg-slate-50"
                                    />
                                    {activeConversation.viewerIsAdmin && (
                                        <button
                                            onClick={saveGroupName}
                                            disabled={savingGroupSettings}
                                            className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {savingGroupSettings ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                                        </button>
                                    )}
                                </div>
                                {groupSettingsError && (
                                    <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{groupSettingsError}</p>
                                )}
                            </div>

                            <div className="px-5 pt-5 pb-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{activeConversation.memberCount} Members</p>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1">
                                {activeConversation.participants?.map(p => {
                                    const memberIsAdmin = activeConversation.adminIds?.includes(p._id);
                                    const isSelf = p._id === currentUserId;
                                    const color = avatarColor(p._id);
                                    return (
                                        <div key={p._id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50">
                                            <div className="relative shrink-0">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}>
                                                    {initials(p.name)}
                                                </div>
                                                {isOnline(p.lastSeenAt) && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{p.name}{isSelf ? ' (You)' : ''}</p>
                                                {memberIsAdmin && <p className="text-[11px] text-indigo-500 font-bold">Admin</p>}
                                            </div>
                                            {activeConversation.viewerIsAdmin && !isSelf && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => toggleAdmin(p._id)}
                                                        title={memberIsAdmin ? 'Remove admin' : 'Make admin'}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                                    >
                                                        {memberIsAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                                                    </button>
                                                    <button
                                                        onClick={() => removeMember(p._id)}
                                                        title="Remove from group"
                                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-5 border-t border-slate-100">
                                <button
                                    onClick={leaveGroup}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                                >
                                    <LogOut size={15} />
                                    Leave Group
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contact info panel (DM) */}
            <AnimatePresence>
                {showContactInfo && activeConversation && activeConversation.type === 'dm' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowContactInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 w-full max-w-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-800">Contact Info</h3>
                                <button onClick={() => setShowContactInfo(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {(() => {
                                const other = activeConversation.otherUser || {};
                                const fullProfile = colleagues.find(c => c._id === other._id) || other;
                                const color = avatarColor(other._id || activeConversation._id);
                                const online = isOnline(fullProfile.lastSeenAt);
                                return (
                                    <div className="px-6 py-6 flex flex-col items-center text-center border-b border-slate-100">
                                        <div className="relative mb-3">
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${color.bg} ${color.text}`}>
                                                {initials(activeConversation.name)}
                                            </div>
                                            {online && (
                                                <span className="absolute bottom-1 right-1 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-lg font-bold text-slate-800">{activeConversation.name}</p>
                                        <p className={`text-xs font-semibold mt-0.5 ${online ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {presenceLabel(fullProfile.lastSeenAt)}
                                        </p>

                                        <div className="w-full mt-5 space-y-3 text-left">
                                            {fullProfile.email && (
                                                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                                                    <Mail size={15} className="text-slate-400 shrink-0" />
                                                    <p className="text-sm text-slate-600 truncate">{fullProfile.email}</p>
                                                </div>
                                            )}
                                            {fullProfile.department && (
                                                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                                                    <Building2 size={15} className="text-slate-400 shrink-0" />
                                                    <p className="text-sm text-slate-600 truncate">{fullProfile.department}</p>
                                                </div>
                                            )}
                                            {fullProfile.role && (
                                                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                                                    <BadgeCheck size={15} className="text-slate-400 shrink-0" />
                                                    <p className="text-sm text-slate-600 truncate capitalize">{fullProfile.role}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="p-4">
                                <button
                                    onClick={() => setShowContactInfo(false)}
                                    className="w-full px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagesPage;

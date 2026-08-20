import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, X, User } from 'lucide-react';
import apiClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';

const TeamLeaves = () => {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [remark, setRemark] = useState('');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchTeamLeaves();
    }, []);

    const fetchTeamLeaves = async () => {
        try {
            const res = await apiClient.get('/leaves/team');
            setLeaves(res.data);
        } catch (error) {
            console.error('Error fetching team leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (leaveId, action) => {
        setActionLoading(leaveId);
        try {
            await apiClient.put(`/leaves/${leaveId}/team-lead-review`, { action, remark });
            await fetchTeamLeaves(); // Refresh to update status
            setSelectedLeave(null);
            setRemark('');
        } catch (error) {
            console.error(`Error ${action} leave:`, error);
            alert(error.response?.data?.msg || `Failed to ${action} leave request.`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        if (activeTab === 'pending') {
            return leave.status === 'pending_team_lead';
        }
        return ['approved', 'rejected', 'hr_rejected'].includes(leave.status);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">


            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Pending Action
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    History
                </button>
            </div>

            {filteredLeaves.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
                    <p className="text-slate-500 mt-2">There are no {activeTab === 'pending' ? 'pending' : 'historical'} leave requests from your team.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Leave Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeaves.map((leave) => (
                                    <React.Fragment key={leave._id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                                        {leave.employee?.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-800 text-sm">{leave.employee?.name || 'Unknown Employee'}</span>
                                                        <span className="block text-xs text-slate-400 mt-0.5">{leave.employee?.email || ''}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-700 text-sm">{leave.leaveType?.name || 'Leave'}</span>
                                                        <span className="text-slate-400 text-xs">•</span>
                                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {leave.isHalfDay ? `Half Day (${leave.halfDayPeriod}) - ${new Date(leave.startDate).toLocaleDateString()}` : `${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 italic max-w-md truncate">"{leave.reason}"</p>
                                                    
                                                    {(leave.hrRemark || leave.teamLeadRemark) && (
                                                        <div className="flex gap-2 mt-1">
                                                            {leave.hrRemark && (
                                                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200" title={leave.hrRemark}>HR Remark</span>
                                                            )}
                                                            {leave.teamLeadRemark && (
                                                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200" title={leave.teamLeadRemark}>TL Remark</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                    leave.status === 'pending_team_lead' ? 'bg-indigo-100 text-indigo-700' :
                                                    leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    leave.status === 'hr_rejected' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {leave.status === 'pending_team_lead' ? 'Pending' : 
                                                     leave.status === 'hr_rejected' ? 'HR Rejected' : 
                                                     leave.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {activeTab === 'pending' && selectedLeave !== leave._id && (
                                                    <button 
                                                        onClick={() => setSelectedLeave(leave._id)}
                                                        className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {activeTab === 'history' && (
                                                    <span className="text-xs text-slate-400 italic">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                        {selectedLeave === leave._id && activeTab === 'pending' && (
                                            <tr className="bg-slate-50/80 border-t border-slate-100">
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-3 w-full max-w-2xl ml-auto">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add remark (optional)"
                                                            value={remark}
                                                            onChange={(e) => setRemark(e.target.value)}
                                                            className="flex-1 text-sm px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                                        />
                                                        <button 
                                                            onClick={() => handleAction(leave._id, 'approve')}
                                                            disabled={actionLoading === leave._id}
                                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            {actionLoading === leave._id ? '...' : <><Check size={16} /> Approve</>}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(leave._id, 'reject')}
                                                            disabled={actionLoading === leave._id}
                                                            className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            {actionLoading === leave._id ? '...' : <><X size={16} /> Reject</>}
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedLeave(null); setRemark(''); }}
                                                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamLeaves;

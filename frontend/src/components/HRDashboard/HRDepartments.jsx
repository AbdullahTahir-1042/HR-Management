import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Pencil, Trash2, X, Check,
    Crown, Users, UserCheck, ChevronDown, Loader2
} from 'lucide-react';

// ─── Small reusable components ───────────────────────────────────────────────

const TeamLeadBadge = () => (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        Team Lead
    </span>
);

const MemberAvatar = ({ name, isLead }) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${isLead ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {name?.[0]?.toUpperCase() || '?'}
    </div>
);

// ─── Assign Team Lead Modal ───────────────────────────────────────────────────

const AssignTeamLeadModal = ({ dept, onClose, onSuccess }) => {
    const [selectedUserId, setSelectedUserId] = useState(dept.teamLead?._id || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const members = dept.employees || [];

    const handleAssign = async () => {
        if (!selectedUserId) return setError('Please select a team member');
        setSaving(true);
        setError('');
        try {
            await apiClient.put(
                `/departments/${dept._id}/assign-teamlead`,
                { userId: selectedUserId }
            );
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to assign team lead');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Crown size={18} className="text-amber-500" />
                        <h3 className="font-bold text-slate-800">Assign Team Lead</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                    Select a member from <span className="font-semibold text-slate-700">{dept.name}</span> to be the Team Lead.
                </p>

                {members.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                        No employees assigned to this department yet.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                        {members.map((m) => (
                            <label
                                key={m._id}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                    ${selectedUserId === m._id
                                        ? 'border-indigo-400 bg-indigo-50'
                                        : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                            >
                                <input
                                    type="radio"
                                    name="teamLead"
                                    value={m._id}
                                    checked={selectedUserId === m._id}
                                    onChange={() => setSelectedUserId(m._id)}
                                    className="accent-indigo-600"
                                />
                                <MemberAvatar name={m.name} isLead={dept.teamLead?._id === m._id} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                                    <p className="text-xs text-slate-400">{m.status}</p>
                                </div>
                                {dept.teamLead?._id === m._id && <TeamLeadBadge />}
                            </label>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-xs text-rose-600 mb-3">{error}</p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleAssign}
                        disabled={saving || members.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />}
                        Confirm
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Add Department Modal ─────────────────────────────────────────────────────

const AddDeptModal = ({ allEmployees, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [teamLeadId, setTeamLeadId] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filter employees who are not assigned to any department
    const eligibleEmployees = allEmployees.filter(emp => !emp.departmentId);

    const toggleEmployee = (id) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!name.trim()) return setError('Department name is required');
        setSaving(true);
        setError('');
        try {
            await apiClient.post(
                '/departments',
                {
                    name: name.trim(),
                    description: desc.trim(),
                    employeeIds: selectedEmployeeIds,
                    teamLeadId: teamLeadId || null
                }
            );
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Error creating department');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-slate-800 text-lg">New Department</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Department Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Marketing"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Description
                        </label>
                        <input
                            type="text"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Brief description..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Team Lead Dropdown */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Team Lead <span className="text-slate-400 normal-case font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={teamLeadId}
                                onChange={e => setTeamLeadId(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white appearance-none transition-all"
                            >
                                <option value="">— Select Team Lead —</option>
                                {eligibleEmployees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Employees multi-select */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wide">
                            Add Members <span className="text-slate-400 normal-case font-normal">({selectedEmployeeIds.length} selected)</span>
                        </label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                            {eligibleEmployees.length === 0 ? (
                                <p className="text-xs text-slate-400 p-4">No unassigned employees found</p>
                            ) : eligibleEmployees.map(emp => (
                                <label key={emp._id}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                                        ${selectedEmployeeIds.includes(emp._id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployeeIds.includes(emp._id)}
                                        onChange={() => toggleEmployee(emp._id)}
                                        className="accent-indigo-600"
                                    />
                                    <MemberAvatar name={emp.name} />
                                    <span className="text-sm text-slate-700">{emp.name}</span>
                                    <span className="text-xs text-slate-400 ml-auto">{emp.status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Create Department
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Edit Department Modal ────────────────────────────────────────────────────

const EditDeptModal = ({ dept, allEmployees, onClose, onSuccess }) => {
    const [name, setName] = useState(dept.name || '');
    const [desc, setDesc] = useState(dept.description || '');
    const [teamLeadId, setTeamLeadId] = useState(dept.teamLead?._id || '');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
        dept.employees?.map(emp => emp._id) || []
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const toggleEmployee = (id) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    // Auto-update team lead selection if the selected lead is removed from members
    useEffect(() => {
        if (teamLeadId && !selectedEmployeeIds.includes(teamLeadId)) {
            setTeamLeadId('');
        }
    }, [selectedEmployeeIds, teamLeadId]);

    const handleSubmit = async () => {
        if (!name.trim()) return setError('Department name is required');
        setSaving(true);
        setError('');
        try {
            await apiClient.put(
                `/departments/${dept._id}`,
                {
                    name: name.trim(),
                    description: desc.trim(),
                    employeeIds: selectedEmployeeIds,
                    teamLeadId: teamLeadId || null
                }
            );
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Error updating department');
        } finally {
            setSaving(false);
        }
    };

    // Filter employees who are either already in this department, OR not assigned to any department
    const eligibleEmployees = allEmployees.filter(emp => {
        const isCurrentMember = dept.employees?.some(e => e._id === emp._id) || emp.departmentId === dept._id;
        const isUnassigned = !emp.departmentId;
        return isCurrentMember || isUnassigned;
    });

    // Only allow selected members to be eligible team leads
    const eligibleTeamLeads = eligibleEmployees.filter(emp => selectedEmployeeIds.includes(emp._id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-slate-800 text-lg">Edit Department</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Department Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Marketing"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Description
                        </label>
                        <input
                            type="text"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Brief description..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Employees multi-select */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wide">
                            Manage Members <span className="text-slate-400 normal-case font-normal">({selectedEmployeeIds.length} selected)</span>
                        </label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                            {eligibleEmployees.length === 0 ? (
                                <p className="text-xs text-slate-400 p-4">No employees available</p>
                            ) : eligibleEmployees.map(emp => (
                                <label key={emp._id}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                                        ${selectedEmployeeIds.includes(emp._id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployeeIds.includes(emp._id)}
                                        onChange={() => toggleEmployee(emp._id)}
                                        className="accent-indigo-600"
                                    />
                                    <MemberAvatar name={emp.name} />
                                    <span className="text-sm text-slate-700">{emp.name}</span>
                                    <span className="text-xs text-slate-400 ml-auto">{emp.status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Team Lead Dropdown (Filtered to selected members only) */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                            Team Lead <span className="text-slate-400 normal-case font-normal">(must be a selected member)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={teamLeadId}
                                onChange={e => setTeamLeadId(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 focus:bg-white appearance-none transition-all"
                            >
                                <option value="">— Select Team Lead —</option>
                                {eligibleTeamLeads.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Save Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Department Details Modal ──────────────────────────────────────────────────

const DepartmentDetailsModal = ({ dept, onEdit, onDelete, onClose }) => {
    const members = dept.employees || [];
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto flex flex-col justify-between"
            >
                {/* Modal Header */}
                <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg capitalize">{dept.name}</h3>
                                <p className="text-xs text-slate-400">Department Overview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { onEdit(dept); onClose(); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                title="Edit Department"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={() => { onDelete(dept._id); onClose(); }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Delete Department"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors ml-2">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</h4>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {dept.description || 'No description provided for this department.'}
                            </p>
                        </div>

                        {/* Team Lead Section */}
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Team Lead</h4>
                            {dept.teamLead ? (
                                <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                                        <Crown size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{dept.teamLead.name}</p>
                                        <p className="text-xs text-slate-400">{dept.teamLead.email}</p>
                                    </div>
                                    <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Lead
                                    </span>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 italic">
                                    No team lead assigned
                                </div>
                            )}
                        </div>

                        {/* Members Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    Members ({members.length})
                                </h4>
                            </div>
                            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-50">
                                {members.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400 italic">
                                        No members assigned to this department
                                    </div>
                                ) : (
                                    members.map((member) => (
                                        <div key={member._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                                            <MemberAvatar name={member.name} isLead={dept.teamLead?._id === member._id} />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{member.name}</p>
                                                <p className="text-xs text-slate-400">{member.email}</p>
                                            </div>
                                            <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
                                                {member.status || 'Employee'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HRDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [assignModal, setAssignModal] = useState(null); // dept object or null

    // Edit modal state
    const [editModal, setEditModal] = useState(null); // dept object or null
    const [selectedDept, setSelectedDept] = useState(null); // dept object or null

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            showMessage('Failed to load departments', true);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await apiClient.get('/auth/users');
            setAllEmployees(res.data.filter(u => u.role === 'employee'));
        } catch (_) { }
    };

    const showMessage = (msg, isError = false) => {
        if (isError) setError(msg);
        else setSuccess(msg);
        setTimeout(() => { setError(''); setSuccess(''); }, 3500);
    };

    const startEdit = (dept) => {
        setEditModal(dept);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await apiClient.delete(`/departments/${id}`);
            fetchDepartments();
            showMessage('Department deleted successfully!');
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Error deleting department', true);
        }
    };

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
                        <p className="text-sm text-slate-400">Manage departments and team leads</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            {/* ── Alerts ── */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                        ✅ {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                        ❌ {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Department Cards ── */}
            {loading ? (
                <div className="flex items-center gap-3 text-slate-400 py-8">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Loading departments...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {departments.map((dept, i) => (
                        <motion.div
                            key={dept._id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 cursor-pointer hover:border-indigo-100"
                            onClick={() => setSelectedDept(dept)}
                        >
                            {/* View Card Details */}
                            <div className="flex items-start justify-between">
                                <div className="bg-indigo-50 p-2 rounded-lg">
                                    <Building2 size={18} className="text-indigo-600" />
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startEdit(dept); }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(dept._id); }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Dept Name + Description */}
                            <div>
                                <h3 className="font-bold text-slate-800 text-base capitalize">{dept.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                    {dept.description || 'No description provided'}
                                </p>
                            </div>

                            {/* Team Lead Row */}
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                <Crown size={14} className="text-amber-500 shrink-0" />
                                {dept.teamLead ? (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <MemberAvatar name={dept.teamLead.name} isLead />
                                        <span className="text-sm font-semibold text-slate-700 truncate">
                                            {dept.teamLead.name}
                                        </span>
                                        <TeamLeadBadge />
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No team lead assigned</span>
                                )}
                            </div>

                            {/* Members */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Users size={13} className="text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500">
                                        {dept.employees?.length || 0} Member{dept.employees?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {dept.employees?.length > 0 && (
                                    <div className="flex -space-x-2">
                                        {dept.employees.slice(0, 5).map(emp => (
                                            <div
                                                key={emp._id}
                                                title={emp.name}
                                                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold
                                                    ${dept.teamLead?._id === emp._id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                            >
                                                {emp.name?.[0]?.toUpperCase()}
                                            </div>
                                        ))}
                                        {dept.employees.length > 5 && (
                                            <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                +{dept.employees.length - 5}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Assign Team Lead Button */}
                            {!dept.teamLead && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setAssignModal(dept); }}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    <UserCheck size={14} />
                                    Assign Team Lead
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            <AnimatePresence>
                {showAddModal && (
                    <AddDeptModal
                        allEmployees={allEmployees}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => { fetchDepartments(); showMessage('Department created successfully!'); }}
                    />
                )}
                {selectedDept && (
                    <DepartmentDetailsModal
                        dept={selectedDept}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        onClose={() => setSelectedDept(null)}
                    />
                )}
                {editModal && (
                    <EditDeptModal
                        dept={editModal}
                        allEmployees={allEmployees}
                        onClose={() => setEditModal(null)}
                        onSuccess={() => { fetchDepartments(); showMessage('Department updated successfully!'); }}
                    />
                )}
                {assignModal && (
                    <AssignTeamLeadModal
                        dept={assignModal}
                        onClose={() => setAssignModal(null)}
                        onSuccess={() => { fetchDepartments(); showMessage('Team lead assigned successfully!'); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default HRDepartments;
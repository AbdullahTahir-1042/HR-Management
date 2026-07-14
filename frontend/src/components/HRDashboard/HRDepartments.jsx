import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const HRDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // For Add form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // For Edit form
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load departments when page opens
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/departments/all`
            );
            setDepartments(res.data);
        } catch (err) {
            setError('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, isError = false) => {
        if (isError) setError(msg);
        else setSuccess(msg);
        setTimeout(() => { setError(''); setSuccess(''); }, 3000);
    };

    // ── ADD ──────────────────────────────────────────
    const handleAdd = async () => {
        if (!newName.trim()) {
            return showMessage('Department name is required', true);
        }
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/departments/add`,
                { name: newName.trim(), description: newDesc.trim() }
            );
            setNewName('');
            setNewDesc('');
            setShowAddForm(false);
            fetchDepartments();
            showMessage('Department added successfully!');
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Error adding department', true);
        }
    };

    // ── EDIT ─────────────────────────────────────────
    const startEdit = (dept) => {
        setEditingId(dept._id);
        setEditName(dept.name);
        setEditDesc(dept.description);
    };

    const handleEdit = async (id) => {
        if (!editName.trim()) {
            return showMessage('Department name is required', true);
        }
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/departments/${id}`,
                { name: editName.trim(), description: editDesc.trim() }
            );
            setEditingId(null);
            fetchDepartments();
            showMessage('Department updated successfully!');
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Error updating department', true);
        }
    };

    // ── DELETE ───────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/departments/${id}`
            );
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
                        <p className="text-sm text-slate-400">Manage your company departments</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowAddForm(true); setError(''); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            {/* ── Success / Error Messages ── */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                    ✅ {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                    ❌ {error}
                </div>
            )}

            {/* ── Add Department Form ── */}
            {showAddForm && (
                <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-slate-700 text-base">New Department</h2>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">
                            Department Name *
                        </label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Marketing"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">
                            Description (optional)
                        </label>
                        <input
                            type="text"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            placeholder="Brief description..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <Check size={16} /> Save
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setNewName(''); setNewDesc(''); setError(''); }}
                            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                        >
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Department Cards ── */}
            {loading ? (
                <p className="text-slate-400 text-sm">Loading departments...</p>
            ) : departments.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No departments yet. Click "Add Department" to start.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <div key={dept._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            {editingId === dept._id ? (
                                /* ── Edit Mode ── */
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full border border-indigo-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold"
                                    />
                                    <input
                                        type="text"
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        placeholder="Description..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(dept._id)}
                                            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700"
                                        >
                                            <Check size={14} /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200"
                                        >
                                            <X size={14} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── View Mode ── */
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="bg-indigo-50 p-2 rounded-lg">
                                            <Building2 size={18} className="text-indigo-600" />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEdit(dept)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept._id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-base capitalize mb-1">
                                        {dept.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 line-clamp-2">
                                        {dept.description || 'No description provided'}
                                    </p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HRDepartments;
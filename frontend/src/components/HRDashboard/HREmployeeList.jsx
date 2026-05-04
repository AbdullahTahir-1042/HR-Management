import React from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Shield, Calendar, UserPlus, Briefcase, Building2, UserCheck } from 'lucide-react';

const HREmployeeList = ({ employees, searchTerm, onAddNew, onSelect }) => {
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatSalary = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredEmployees = employees.filter(emp => 
        emp.role === 'employee' && (
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                        {filteredEmployees.length} Active
                    </span>
                </div>
                <button 
                    onClick={onAddNew}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 text-sm"
                >
                    <UserPlus size={18} /> Add New Employee
                </button>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-[0.1em]">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Reporting To</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Salary</th>
                                <th className="px-6 py-4">Joined On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.map(emp => (
                                <tr 
                                    key={emp._id} 
                                    onClick={() => onSelect(emp)}
                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-colors">
                                                {emp.photo ? (
                                                    <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 font-bold text-sm">{emp.name?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{emp.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{emp.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium capitalize">
                                            <Building2 size={14} className="text-slate-400" />
                                            {emp.department || 'development'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                                            <UserCheck size={14} className="text-slate-400" />
                                            {emp.reportingTo || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`
                                            px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit
                                            ${emp.status === 'full time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : ''}
                                            ${emp.status === 'probation' ? 'bg-amber-50 text-amber-600 border border-amber-100' : ''}
                                            ${emp.status === 'internship' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : ''}
                                        `}>
                                            <Briefcase size={12} />
                                            {emp.status || 'full time'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-700 font-bold text-sm">
                                            {formatSalary(emp.salary)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-600 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {formatDate(emp.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEmployees.length === 0 && (
                        <div className="p-20 text-center text-slate-400">
                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No employees found matching your search.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default HREmployeeList;

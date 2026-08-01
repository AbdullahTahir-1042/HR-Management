import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, LayoutGrid } from 'lucide-react';

const RestoreCardModal = ({
    isOpen,
    onClose,
    onRestore,
    hiddenCards = [] // Array of { id, label }
}) => {
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => {
        if (hiddenCards.length > 0) {
            setSelectedId(hiddenCards[0].id);
        } else {
            setSelectedId('');
        }
    }, [hiddenCards, isOpen]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!selectedId) return;
        onRestore(selectedId);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <Plus size={16} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">
                                Add Card
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-5">
                        <p className="text-xs text-slate-500 mb-3 font-medium">
                            Select a removed card to restore it to the summary view:
                        </p>

                        {hiddenCards.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                                All cards are currently visible.
                            </p>
                        ) : (
                            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
                                {hiddenCards.map(card => {
                                    const isSelected = selectedId === card.id;
                                    return (
                                        <button
                                            key={card.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedId(card.id);
                                                onRestore(card.id);
                                                onClose();
                                            }}
                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-2xs'
                                                    : 'bg-slate-50/60 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:border-indigo-200'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <LayoutGrid size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                                                {card.label}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Plus size={10} /> Add
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!selectedId}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-200 transition-all cursor-pointer"
                            >
                                Add Card
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RestoreCardModal;

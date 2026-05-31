'use client';

import { useState, useEffect } from 'react';
import AttachmentUpload from '@/components/AttachmentUpload';

interface Expense {
    _id: string;
    title: string;
    category: string;
    payeeId?: {
        name: string;
    };
}

interface Payment {
    _id: string;
    amount: number;
    receiptNumber: string;
    paymentMode: string;
    paymentDate: string;
}

interface Attachment {
    _id: string;
    originalName: string;
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
    expenseId?: Expense | null | any;
    paymentId?: Payment | null | any;
    createdAt: string;
}

export default function FilesDashboard() {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadValue, setUploadValue] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'tagged' | 'untagged'>('all');
    
    // Track selected tag relationships in state for dynamic UI changes
    const [tagState, setTagState] = useState<Record<string, { expenseId: string; paymentId: string; paymentsList: Payment[] }>>({});

    const fetchAttachments = async () => {
        try {
            const res = await fetch('/api/attachments');
            const data = await res.json();
            if (data.success) {
                setAttachments(data.data);
                
                // Initialize local edit state for each attachment
                const initialTags: any = {};
                data.data.forEach((att: Attachment) => {
                    const eId = att.expenseId?._id || att.expenseId || '';
                    const pId = att.paymentId?._id || att.paymentId || '';
                    initialTags[att._id] = {
                        expenseId: eId,
                        paymentId: pId,
                        paymentsList: [] // Will fetch on demand if expense is tagged
                    };
                });
                setTagState(initialTags);
            }
        } catch (e) {
            console.error('Failed to fetch attachments', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            const data = await res.json();
            if (data.success) {
                setExpenses(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch expenses', e);
        }
    };

    useEffect(() => {
        fetchAttachments();
        fetchExpenses();
    }, []);

    // Helper to load payments for a specific expense inside the file card
    const loadPaymentsForExpense = async (attId: string, expenseId: string) => {
        if (!expenseId) {
            setTagState(prev => ({
                ...prev,
                [attId]: { ...prev[attId], expenseId: '', paymentId: '', paymentsList: [] }
            }));
            return;
        }

        try {
            const res = await fetch(`/api/payments?expenseId=${expenseId}`);
            const data = await res.json();
            if (data.success) {
                setTagState(prev => ({
                    ...prev,
                    [attId]: {
                        ...prev[attId],
                        expenseId,
                        paymentsList: data.data
                    }
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Trigger loading of payments if a file is already tagged to an expense on load
    useEffect(() => {
        attachments.forEach(att => {
            const expenseId = att.expenseId?._id || att.expenseId;
            if (expenseId && tagState[att._id]?.paymentsList.length === 0) {
                loadPaymentsForExpense(att._id, expenseId).then(() => {
                    // Restore the tagged paymentId after fetching list
                    const pId = att.paymentId?._id || att.paymentId || '';
                    setTagState(prev => ({
                        ...prev,
                        [att._id]: {
                            ...prev[att._id],
                            paymentId: pId
                        }
                    }));
                });
            }
        });
    }, [attachments]);

    const handleUploadComplete = async (newUploadedFiles: any[]) => {
        // Since AttachmentUpload does the direct Cloudinary upload,
        // we persist these new attachments to our MongoDB database immediately.
        setLoading(true);
        for (const file of newUploadedFiles) {
            // Check if already persisted (exists in attachments)
            if (attachments.some(a => a.publicId === file.publicId)) continue;

            try {
                const res = await fetch('/api/attachments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(file),
                });
                if (!res.ok) throw new Error();
            } catch (e) {
                console.error('Failed to persist uploaded file:', file.originalName);
            }
        }
        setUploadValue([]);
        await fetchAttachments();
    };

    const handleSaveTag = async (attId: string) => {
        const state = tagState[attId];
        if (!state) return;

        try {
            const res = await fetch(`/api/attachments/${attId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseId: state.expenseId || null,
                    paymentId: state.paymentId || null
                })
            });

            if (res.ok) {
                alert('File tags updated successfully!');
                fetchAttachments();
            } else {
                alert('Failed to update tags');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating tags');
        }
    };

    const handleDeleteFile = async (attId: string) => {
        if (!confirm('Are you sure you want to permanently delete this file? This will remove it from Cloudinary.')) {
            return;
        }

        try {
            const res = await fetch(`/api/attachments/${attId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setAttachments(prev => prev.filter(att => att._id !== attId));
            } else {
                alert('Failed to delete file');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting file');
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const filteredAttachments = attachments.filter(att => {
        const isTagged = !!(att.expenseId || att.paymentId);
        if (filter === 'tagged') return isTagged;
        if (filter === 'untagged') return !isTagged;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Files & Receipts</h1>
                <p className="text-slate-500 text-sm mt-1">Upload arbitrary images or invoice PDFs and dynamically tag them to construction cost heads.</p>
            </div>

            {/* Dashboard grid: Left = uploader, Right = list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Upload Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Upload New Files</h2>
                    <p className="text-xs text-slate-400">Select invoice receipts, delivery notes, or site photos to store securely.</p>
                    <AttachmentUpload
                        value={uploadValue}
                        onChange={handleUploadComplete}
                        label=""
                    />
                </div>

                {/* Right Files List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filters bar */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <div className="flex gap-2">
                            {(['all', 'tagged', 'untagged'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFilter(opt)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                                        filter === opt
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                            Showing {filteredAttachments.length} of {attachments.length} files
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <svg className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm">Loading files workspace...</p>
                        </div>
                    ) : filteredAttachments.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 bg-white border border-dashed border-slate-350 rounded-2xl shadow-sm">
                            <p className="text-sm">No attachments match this filter.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredAttachments.map((att) => {
                                const isPdf = att.format?.toLowerCase() === 'pdf' || att.originalName.toLowerCase().endsWith('.pdf');
                                const tState = tagState[att._id] || { expenseId: '', paymentId: '', paymentsList: [] };
                                const hasChanges = (att.expenseId?._id || att.expenseId || '') !== tState.expenseId || 
                                                    (att.paymentId?._id || att.paymentId || '') !== tState.paymentId;

                                return (
                                    <div
                                        key={att._id}
                                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-250 transition-colors flex flex-col md:flex-row gap-5 justify-between items-start md:items-center"
                                    >
                                        {/* File Info */}
                                        <div className="flex items-center space-x-4 overflow-hidden w-full md:max-w-xs">
                                            {isPdf ? (
                                                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100 font-extrabold text-sm uppercase flex-shrink-0">
                                                    PDF
                                                </div>
                                            ) : (
                                                <img
                                                    src={att.url}
                                                    alt={att.originalName}
                                                    className="w-14 h-14 object-cover rounded-xl border border-slate-100 shadow-sm flex-shrink-0"
                                                />
                                            )}
                                            <div className="overflow-hidden text-left">
                                                <p className="text-sm font-semibold text-slate-800 truncate" title={att.originalName}>
                                                    {att.originalName}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {formatBytes(att.bytes)} • {att.format?.toUpperCase() || 'FILE'}
                                                </p>
                                                <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-block mt-1"
                                                >
                                                    View Document →
                                                </a>
                                            </div>
                                        </div>

                                        {/* Tagging Fields */}
                                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">
                                                    Link to Expense
                                                </label>
                                                <select
                                                    value={tState.expenseId}
                                                    onChange={(e) => loadPaymentsForExpense(att._id, e.target.value)}
                                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 font-medium"
                                                >
                                                    <option value="">-- Unlinked --</option>
                                                    {expenses.map((exp) => (
                                                        <option key={exp._id} value={exp._id}>
                                                            {exp.title} ({exp.category})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">
                                                    Link to Payment
                                                </label>
                                                <select
                                                    value={tState.paymentId}
                                                    disabled={!tState.expenseId}
                                                    onChange={(e) => setTagState(prev => ({
                                                        ...prev,
                                                        [att._id]: { ...prev[att._id], paymentId: e.target.value }
                                                    }))}
                                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">-- General Expense File --</option>
                                                    {tState.paymentsList.map((pay) => (
                                                        <option key={pay._id} value={pay._id}>
                                                            ₹{pay.amount.toLocaleString('en-IN')} (#{pay.receiptNumber})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex md:flex-col items-stretch gap-2 w-full md:w-auto">
                                            <button
                                                disabled={!hasChanges}
                                                onClick={() => handleSaveTag(att._id)}
                                                className={`flex-1 md:flex-none text-xs font-semibold py-2 px-3 rounded-lg border text-center transition-all ${
                                                    hasChanges
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm'
                                                        : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                                }`}
                                            >
                                                Save Tag
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(att._id)}
                                                className="flex-1 md:flex-none text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg border border-transparent text-center transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

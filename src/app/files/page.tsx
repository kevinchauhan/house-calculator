'use client';

import { useState, useEffect } from 'react';
import AttachmentUpload from '@/components/AttachmentUpload';
import { triggerDownload } from '@/lib/download';

// --- Tagging Workspace Interfaces ---
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

// --- Documents Cabinet Interfaces ---
interface Folder {
    _id: string;
    name: string;
    parentFolderId?: string | null;
    createdAt: string;
}

interface DocumentItem {
    _id: string;
    name: string;
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
    folderId?: string | null;
    createdAt: string;
}

export default function FilesPage() {
    const [activeTab, setActiveTab] = useState<'tagging' | 'cabinet'>('cabinet');


    // ==========================================
    // TAB 1: TAGGING WORKSPACE STATE & FUNCTIONS
    // ==========================================
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [taggingLoading, setTaggingLoading] = useState(true);
    const [uploadValue, setUploadValue] = useState<any[]>([]);
    const [tagFilter, setTagFilter] = useState<'all' | 'tagged' | 'untagged'>('all');
    const [tagState, setTagState] = useState<Record<string, { expenseId: string; paymentId: string; paymentsList: Payment[] }>>({});

    const fetchAttachments = async () => {
        try {
            const res = await fetch('/api/attachments');
            const data = await res.json();
            if (data.success) {
                setAttachments(data.data);
                const initialTags: any = {};
                data.data.forEach((att: Attachment) => {
                    const eId = att.expenseId?._id || att.expenseId || '';
                    const pId = att.paymentId?._id || att.paymentId || '';
                    initialTags[att._id] = {
                        expenseId: eId,
                        paymentId: pId,
                        paymentsList: []
                    };
                });
                setTagState(initialTags);
            }
        } catch (e) {
            console.error('Failed to fetch attachments', e);
        } finally {
            setTaggingLoading(false);
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

    useEffect(() => {
        attachments.forEach(att => {
            const expenseId = att.expenseId?._id || att.expenseId;
            if (expenseId && tagState[att._id]?.paymentsList.length === 0) {
                loadPaymentsForExpense(att._id, expenseId).then(() => {
                    const pId = att.paymentId?._id || att.paymentId || '';
                    setTagState(prev => ({
                        ...prev,
                        [att._id]: { ...prev[att._id], paymentId: pId }
                    }));
                });
            }
        });
    }, [attachments]);

    const handleUploadComplete = async (newUploadedFiles: any[]) => {
        setTaggingLoading(true);
        for (const file of newUploadedFiles) {
            if (attachments.some(a => a.publicId === file.publicId)) continue;
            try {
                const res = await fetch('/api/attachments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(file),
                });
                if (!res.ok) throw new Error();
            } catch (e) {
                console.error('Failed to persist file:', file.originalName);
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
        if (!confirm('Permanently delete this file? This clears it from Cloudinary and your database.')) {
            return;
        }

        try {
            const res = await fetch(`/api/attachments/${attId}`, { method: 'DELETE' });
            if (res.ok) {
                setAttachments(prev => prev.filter(att => att._id !== attId));
            } else {
                alert('Failed to delete file');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // ==========================================
    // TAB 2: DOCUMENTS CABINET STATE & FUNCTIONS
    // ==========================================
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [cabinetFiles, setCabinetFiles] = useState<DocumentItem[]>([]);
    const [cabinetLoading, setCabinetLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cabinetSort, setCabinetSort] = useState<'date' | 'name' | 'size'>('date');
    const [cabinetUploadValue, setCabinetUploadValue] = useState<any[]>([]);

    const fetchCabinetContents = async () => {
        setCabinetLoading(true);
        try {
            // 1. Fetch directories inside current folder
            const foldersRes = await fetch(`/api/folders?parentFolderId=${currentFolderId || 'null'}`);
            const foldersData = await foldersRes.json();
            if (foldersData.success) {
                setFolders(foldersData.data);
            }

            // 2. Fetch files inside current folder or globally via search
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const filesRes = await fetch(`/api/documents?folderId=${currentFolderId || 'null'}&sortBy=${cabinetSort}${searchParam}`);
            const filesData = await filesRes.json();
            if (filesData.success) {
                setCabinetFiles(filesData.data);
            }

            // 3. Fetch breadcrumbs trail if inside a folder
            if (currentFolderId) {
                const bcRes = await fetch(`/api/folders/${currentFolderId}`);
                const bcData = await bcRes.json();
                if (bcData.success) {
                    setBreadcrumbs(bcData.data);
                }
            } else {
                setBreadcrumbs([]);
            }
        } catch (e) {
            console.error('Error fetching cabinet contents', e);
        } finally {
            setCabinetLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'cabinet') {
            fetchCabinetContents();
        }
    }, [currentFolderId, cabinetSort, searchQuery, activeTab]);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parentFolderId: currentFolderId
                })
            });

            if (res.ok) {
                setNewFolderName('');
                setShowFolderModal(false);
                fetchCabinetContents();
            } else {
                alert('Failed to create folder');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCabinetUpload = async (newUploadedFiles: any[]) => {
        setCabinetLoading(true);
        for (const file of newUploadedFiles) {
            try {
                const res = await fetch('/api/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: file.originalName,
                        url: file.url,
                        publicId: file.publicId,
                        format: file.format,
                        bytes: file.bytes,
                        folderId: currentFolderId
                    }),
                });
                if (!res.ok) throw new Error();
            } catch (e) {
                console.error('Failed to save document:', file.originalName);
            }
        }
        setCabinetUploadValue([]);
        await fetchCabinetContents();
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Permanently delete this document from the cabinet and Cloudinary?')) {
            return;
        }

        try {
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCabinetContents();
            } else {
                alert('Failed to delete document');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteFolder = async (foldId: string, name: string) => {
        if (!confirm(`Warning: Deleting the folder "${name}" will recursively delete ALL child sub-folders and files inside it from Cloudinary and DB. Continue?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/folders/${foldId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCabinetContents();
            } else {
                alert('Failed to delete folder');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Shared Initializer
    useEffect(() => {
        fetchAttachments();
        fetchExpenses();
    }, []);

    // Size Parser
    const formatBytes = (bytes?: number) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const filteredAttachments = attachments.filter(att => {
        const isTagged = !!(att.expenseId || att.paymentId);
        if (tagFilter === 'tagged') return isTagged;
        if (tagFilter === 'untagged') return !isTagged;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Files Cabinet</h1>
                    <p className="text-slate-500 text-sm mt-1">Tag file receipts to expenses or manage nested custom project folders and directories.</p>
                </div>

                {/* Dashboard Tabs Toggle */}
                <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('cabinet')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                            activeTab === 'cabinet'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('tagging')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                            activeTab === 'tagging'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Tag Payments
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: TAGGING WORKSPACE */}
            {activeTab === 'tagging' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Upload Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">Upload Tagging Files</h2>
                        <p className="text-xs text-slate-400">Select receipts, delivery notes, or invoices to tag directly to your accounts.</p>
                        <AttachmentUpload
                            value={uploadValue}
                            onChange={handleUploadComplete}
                            label=""
                        />
                    </div>

                    {/* Right Files List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                            <div className="flex gap-2">
                                {(['all', 'tagged', 'untagged'] as const).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setTagFilter(opt)}
                                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                                            tagFilter === opt
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

                        {taggingLoading ? (
                            <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <svg className="animate-spin h-8 w-8 text-slate-405 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm">Loading tagging workspace...</p>
                            </div>
                        ) : filteredAttachments.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm">
                                <p className="text-sm">No files uploaded for tagging yet.</p>
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
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-850 inline-block mt-1 animate-pulse"
                                                    >
                                                        View Document →
                                                    </a>
                                                    <button
                                                        onClick={() => triggerDownload(att.url, att.originalName)}
                                                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-850 inline-block mt-1 ml-3 bg-transparent border-none cursor-pointer"
                                                    >
                                                        Download ↓
                                                    </button>
                                                </div>
                                            </div>

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
            )}

            {/* TAB CONTENT: DOCUMENTS CABINET */}
            {activeTab === 'cabinet' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Explorer Upload Panel */}
                    <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">Upload to Directory</h2>
                        <p className="text-xs text-slate-400">
                            Files will be uploaded directly into: <span className="font-semibold text-slate-700">{breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Root'}</span>
                        </p>
                        <AttachmentUpload
                            value={cabinetUploadValue}
                            onChange={handleCabinetUpload}
                            label=""
                        />
                    </div>

                    {/* Right Directory Workspace */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Directory Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            {/* Breadcrumbs Navigation */}
                            <div className="flex items-center flex-wrap gap-2 text-sm font-semibold text-slate-600">
                                <button
                                    onClick={() => setCurrentFolderId(null)}
                                    className={`hover:text-slate-900 transition-colors ${!currentFolderId ? 'text-indigo-600 font-bold' : ''}`}
                                >
                                    📁 Cabinet Root
                                </button>
                                {breadcrumbs.map((bc, idx) => (
                                    <span key={bc._id} className="flex items-center gap-2">
                                        <span className="text-slate-300">/</span>
                                        <button
                                            onClick={() => setCurrentFolderId(bc._id)}
                                            className={`hover:text-slate-900 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-indigo-600 font-bold' : ''}`}
                                        >
                                            {bc.name}
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Actions / Search Panel */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Sort Dropdown */}
                                <select
                                    value={cabinetSort}
                                    onChange={(e: any) => setCabinetSort(e.target.value)}
                                    className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                                >
                                    <option value="date">Sort: Date 📅</option>
                                    <option value="name">Sort: Name 🔤</option>
                                    <option value="size">Sort: Size ⚖️</option>
                                </select>

                                {/* New Folder Button */}
                                <button
                                    onClick={() => setShowFolderModal(true)}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                                >
                                    + New Folder
                                </button>
                            </div>
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search all folders and documents globally..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white shadow-sm"
                            />
                        </div>

                        {/* Explorer Contents */}
                        {cabinetLoading ? (
                            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <svg className="animate-spin h-8 w-8 text-slate-405 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-slate-500 text-sm">Navigating directory...</p>
                            </div>
                        ) : folders.length === 0 && cabinetFiles.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm text-slate-400 space-y-2">
                                <p className="text-sm font-medium">This folder is empty.</p>
                                <p className="text-xs">Create a new folder or select files on the left panel to populate it!</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {/* 1. Render Subfolders */}
                                {!searchQuery && folders.map((fold) => (
                                    <div
                                        key={fold._id}
                                        className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-200 hover:bg-slate-50/30 transition-all cursor-pointer"
                                        onClick={() => setCurrentFolderId(fold._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">📁</span>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-slate-800">{fold.name}</p>
                                                <p className="text-[10px] text-slate-400">Directory Folder</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent entering folder
                                                handleDeleteFolder(fold._id, fold.name);
                                            }}
                                            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                        >
                                            Delete Folder
                                        </button>
                                    </div>
                                ))}

                                {/* 2. Render Cabinet Documents */}
                                {cabinetFiles.map((doc) => {
                                    const isPdf = doc.format?.toLowerCase() === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');
                                    return (
                                        <div
                                            key={doc._id}
                                            className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-200 transition-all"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden text-left max-w-lg">
                                                {isPdf ? (
                                                    <span className="w-10 h-10 bg-red-100 text-red-700 border border-red-150 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0">PDF</span>
                                                ) : (
                                                    <img src={doc.url} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                                                )}
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold text-slate-800 truncate" title={doc.name}>
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {formatBytes(doc.bytes)} • {doc.format?.toUpperCase() || 'FILE'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all animate-pulse"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    onClick={() => triggerDownload(doc.url, doc.name)}
                                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-transparent"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(doc._id)}
                                                    className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
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
            )}

            {/* Folder Creation Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreateFolder} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Create New Folder</h3>
                            <button
                                type="button"
                                onClick={() => setShowFolderModal(false)}
                                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Folder Name</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                placeholder="e.g. Invoices, Site Progress"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setShowFolderModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                Create Directory
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

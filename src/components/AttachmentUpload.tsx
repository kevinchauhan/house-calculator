'use client';

import { useState, useRef } from 'react';

interface Attachment {
    originalName: string;
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
}

interface AttachmentUploadProps {
    value: Attachment[];
    onChange: (files: Attachment[]) => void;
    label?: string;
}

export default function AttachmentUpload({ value, onChange, label = 'Attachments (Images or PDFs)' }: AttachmentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadFiles = async (files: FileList) => {
        setUploading(true);
        setError(null);
        const uploadedList: Attachment[] = [...value];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError(`File ${file.name} is too large. Max size is 10MB.`);
                continue;
            }

            // Validate file type
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            if (!isImage && !isPdf) {
                setError(`File ${file.name} is not a valid format (only Images and PDFs allowed).`);
                continue;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error('Upload failed');
                }

                const data = await res.json();
                if (data.success && data.file) {
                    uploadedList.push(data.file);
                } else {
                    throw new Error(data.error || 'Failed to upload');
                }
            } catch (e: any) {
                console.error(e);
                setError(`Failed to upload ${file.name}`);
            }
        }

        onChange(uploadedList);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(e.target.files);
        }
    };

    const removeFile = (indexToRemove: number) => {
        const updated = value.filter((_, idx) => idx !== indexToRemove);
        onChange(updated);
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className="space-y-3">
            {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
            
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragging
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm transition-all group-hover:scale-105">
                        {uploading ? (
                            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-indigo-600 hover:underline">Click to upload</span>
                        <span className="text-sm text-slate-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-slate-400">PDF, PNG, JPG, JPEG (Max 10MB)</p>
                </div>
            </div>

            {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                    {error}
                </p>
            )}

            {value.length > 0 && (
                <div className="grid gap-2 mt-3">
                    {value.map((file, idx) => {
                        const isPdf = file.format?.toLowerCase() === 'pdf' || file.originalName.toLowerCase().endsWith('.pdf');
                        return (
                            <div
                                key={file.publicId + idx}
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    {isPdf ? (
                                        <div className="w-10 h-10 flex-shrink-0 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 font-bold text-xs uppercase">
                                            PDF
                                        </div>
                                    ) : (
                                        <img
                                            src={file.url}
                                            alt={file.originalName}
                                            className="w-10 h-10 flex-shrink-0 rounded-lg object-cover border border-slate-100"
                                        />
                                    )}
                                    <div className="text-left overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                                            {file.originalName}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatBytes(file.bytes)} {file.format && `• ${file.format.toUpperCase()}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                        View
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

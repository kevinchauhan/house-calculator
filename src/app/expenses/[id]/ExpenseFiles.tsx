'use client';

import { triggerDownload } from '@/lib/download';

interface Attachment {
    _id: string;
    originalName: string;
    url: string;
    format?: string;
}

interface ExpenseFilesProps {
    attachments: Attachment[];
}

export default function ExpenseFiles({ attachments }: ExpenseFilesProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Expense Files</h3>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[220px] pr-1">
                {attachments.map((att) => {
                    const isPdf = att.format?.toLowerCase() === 'pdf' || att.originalName.toLowerCase().endsWith('.pdf');
                    return (
                        <div
                            key={att._id}
                            className="group relative flex flex-col justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-center overflow-hidden"
                        >
                            <div className="mx-auto my-1 flex items-center justify-center">
                                {isPdf ? (
                                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 font-extrabold text-xs">
                                        PDF
                                    </div>
                                ) : (
                                    <img
                                        src={att.url}
                                        alt={att.originalName}
                                        className="w-10 h-10 object-cover rounded-lg shadow-sm border border-white group-hover:scale-105 transition-transform"
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-700 truncate mt-1 w-full block" title={att.originalName}>
                                {att.originalName}
                            </span>
                            <div className="flex gap-2 justify-center mt-1.5 border-t border-slate-100 pt-1.5">
                                <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] font-bold text-indigo-600 hover:underline"
                                >
                                    View
                                </a>
                                <span className="text-[9px] text-slate-300">|</span>
                                <button
                                    onClick={() => triggerDownload(att.url, att.originalName)}
                                    className="text-[9px] font-bold text-emerald-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                                >
                                    Get
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { triggerDownload } from '@/lib/download';

export default function PaymentList({ payments, expenseId, attachments = [] }: { payments: any[], expenseId: string, attachments?: any[] }) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!confirmDeleteId) return;

        const paymentId = confirmDeleteId;
        setConfirmDeleteId(null);
        setDeletingId(paymentId);

        try {
            const res = await fetch(`/api/payments/${paymentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete payment');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting payment');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
                <Link
                    href={`/expenses/${expenseId}/payment/new`}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all"
                >
                    + Record Payment
                </Link>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No payments recorded yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {payments.map((p: any) => {
                        const pAttachments = attachments.filter((att: any) => att.paymentId === p._id);
                        return (
                            <div key={p._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col hover:border-indigo-200 transition-colors gap-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                                {p.paymentMode}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                            <span>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            <span>•</span>
                                            <span className="font-mono text-xs bg-slate-50 px-1 py-0.5 rounded text-slate-400">#{p.receiptNumber}</span>
                                        </div>
                                        {p.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">{p.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                        <a
                                            href={`/api/receipts/${p._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                        >
                                            Receipt
                                        </a>
                                        <Link
                                            href={`/expenses/${expenseId}/payment/${p._id}/edit`}
                                            className="text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setConfirmDeleteId(p._id)}
                                            disabled={deletingId === p._id}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {deletingId === p._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>

                                {/* Render payment attachments if any */}
                                {pAttachments.length > 0 && (
                                    <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
                                        {pAttachments.map((att: any) => {
                                            const isPdf = att.format?.toLowerCase() === 'pdf' || att.originalName.toLowerCase().endsWith('.pdf');
                                            return (
                                                <div
                                                    key={att._id}
                                                    className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-slate-150 bg-slate-50 text-xs font-semibold text-slate-700 max-w-[260px] shadow-xs"
                                                >
                                                    {isPdf ? (
                                                        <span className="w-5 h-5 bg-red-100 text-red-700 rounded flex items-center justify-center font-bold text-[9px] flex-shrink-0">PDF</span>
                                                    ) : (
                                                        <img src={att.url} alt="" className="w-5 h-5 object-cover rounded shadow-sm flex-shrink-0" />
                                                    )}
                                                    <span className="truncate max-w-[80px] text-[11px]" title={att.originalName}>{att.originalName}</span>
                                                    <span className="text-slate-300 text-[10px]">|</span>
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline">View</a>
                                                    <button onClick={() => triggerDownload(att.url, att.originalName)} className="text-[10px] text-emerald-600 hover:underline bg-transparent border-none cursor-pointer p-0">Get</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}


            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                title="Delete Payment"
                message="Are you sure you want to delete this payment record?"
                confirmLabel="Delete Payment"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                isDestructive={true}
            />
        </div>
    );
}

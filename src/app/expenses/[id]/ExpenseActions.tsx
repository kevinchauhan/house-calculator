'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import ReportButton from '@/components/ReportButton';

export default function ExpenseActions({ expenseId }: { expenseId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        setShowConfirm(false);

        try {
            const res = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/expenses');
                router.refresh();
            } else {
                alert('Failed to delete expense');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting expense');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex gap-3">
                <Link
                    href={`/expenses/${expenseId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                    Edit Expense
                </Link>
                <ReportButton expenseId={expenseId} />
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Delete Expense"
                message="Are you sure you want to delete this expense and all associated payments? This action cannot be undone."
                confirmLabel="Delete Expense"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
                isDestructive={true}
            />
        </>
    );
}

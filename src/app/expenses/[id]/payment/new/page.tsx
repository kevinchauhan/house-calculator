'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';

export default function AddPayment({ params }: { params: { id: string } }) {
    const router = useRouter();
    const expenseId = params.id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'cash',
        notes: '',
    });

    // We need to fetch expense details to get the payeeId.
    // Ideally we should pass it or re-fetch.
    // Or we can just include it in the POST body if we fetch it first.
    // Actually, the PAYMENT endpoint needs payeeId.
    // So we must fetch the expense first to know who we are paying (the default payee).
    // But wait, can we change payee for a payment?
    // The User Request says "One Expense -> Many Payments". "A single payee can be used in multiple expenses".
    // Usually partial payments for an expense go to the SAME payee.
    // The Expense model has `payeeId`.
    // So we should use that payeeId.
    // UseEffect to fetch expense details.

    const [expense, setExpense] = useState<any>(null);

    useState(() => {
        // Basic fetch
        fetch(`/api/expenses/${expenseId}`).then(res => res.json()).then(data => {
            if (data.success) {
                setExpense(data.data.expense);
            }
        });
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expense) return;

        setLoading(true);

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseId: expenseId,
                    payeeId: expense.payeeId._id, // Use expense's payee
                    amount: parseFloat(formData.amount),
                    paymentDate: new Date(formData.paymentDate),
                    paymentMode: formData.paymentMode,
                    notes: formData.notes,
                }),
            });

            if (res.ok) {
                router.push(`/expenses/${expenseId}`);
                router.refresh();
            } else {
                alert('Failed to record payment');
            }
        } catch (error) {
            console.error(error);
            alert('Error recording payment');
        } finally {
            setLoading(false);
        }
    };

    if (!expense) return <div className="p-4">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-2">
                <Link href={`/expenses/${expenseId}`} className="text-gray-500 hover:text-gray-700">← Back</Link>
                <h1 className="text-2xl font-bold text-gray-900">Add Payment</h1>
            </div>

            <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="text-sm text-blue-700">
                    Recording payment for <strong>{expense.title}</strong> to <strong>{expense.payeeId.name}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (INR) *</label>
                    <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2 border"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <input
                        type="date"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Mode *</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="w-full justify-center bg-green-600 hover:bg-green-700">
                        Record Payment
                    </Button>
                </div>
            </form>
        </div>
    );
}

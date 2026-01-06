'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';

export default function EditPayment() {
    const router = useRouter();
    const params = useParams();
    const expenseId = params.id as string;
    const paymentId = params.paymentId as string;

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: '',
        paymentMode: 'cash',
        notes: '',
    });

    const [expense, setExpense] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Expense Details for Context
                const expRes = await fetch(`/api/expenses/${expenseId}`);
                const expData = await expRes.json();
                if (expData.success) {
                    setExpense(expData.data.expense);
                }

                // Fetch Payment Details
                const payRes = await fetch(`/api/payments/${paymentId}`);
                const payData = await payRes.json();
                if (payData.success) {
                    const p = payData.data;
                    setFormData({
                        amount: p.amount.toString(),
                        paymentDate: new Date(p.paymentDate).toISOString().split('T')[0],
                        paymentMode: p.paymentMode,
                        notes: p.notes || ''
                    });
                }
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [expenseId, paymentId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/payments/${paymentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                alert('Failed to update payment');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating payment');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border hover:border-indigo-200 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    if (loading) return <div className="p-10 text-center text-slate-500">Loading payment details...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/expenses/${expenseId}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Payment</h1>
                    {expense && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>For: <span className="font-medium text-slate-700">{expense.title}</span></span>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl border border-slate-200 p-8 space-y-6">
                <div>
                    <label className={labelClasses}>Amount (INR) *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-4 text-slate-400 text-lg">₹</span>
                        <input
                            type="number"
                            required
                            min="1"
                            className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-2xl p-3 pl-8 border hover:border-emerald-200 transition-colors font-bold text-slate-900"
                            placeholder="0"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>Date *</label>
                        <input
                            type="date"
                            required
                            className={inputClasses}
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Mode *</label>
                        <select
                            className={inputClasses}
                            value={formData.paymentMode}
                            onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        >
                            <option value="cash">Cash 💵</option>
                            <option value="upi">UPI 📱</option>
                            <option value="bank">Bank Transfer 🏦</option>
                            <option value="cheque">Cheque 📝</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Notes</label>
                    <textarea
                        className={inputClasses}
                        rows={3}
                        placeholder="Transaction ID, Cheque No, etc..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="w-full justify-center py-3 text-base bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200">
                        Update Payment
                    </Button>
                </div>
            </form>
        </div>
    );
}

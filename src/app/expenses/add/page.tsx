'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';

interface Payee {
    _id: string;
    name: string;
}

export default function AddExpense() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [payees, setPayees] = useState<Payee[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        estimatedAmount: '',
        payeeId: '',
        description: '',
    });

    useEffect(() => {
        const fetchPayees = async () => {
            try {
                const res = await fetch('/api/payees');
                const data = await res.json();
                if (data.success) {
                    setPayees(data.data);
                    if (data.data.length > 0) {
                        setFormData(prev => ({ ...prev, payeeId: data.data[0]._id }));
                    }
                }
            } catch (e) {
                console.error('Failed to fetch payees', e);
            }
        };
        fetchPayees();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.payeeId) {
            alert('Please select a payee');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimatedAmount: parseFloat(formData.estimatedAmount),
                }),
            });

            if (res.ok) {
                router.push('/expenses');
                router.refresh(); // Ensure list updates
            } else {
                alert('Failed to create expense');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating expense');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border hover:border-indigo-200 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/expenses" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Expense</h1>
                    <p className="text-slate-500 text-sm">Estimate a new cost head</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl border border-slate-200 p-8 space-y-6">
                <div>
                    <label className={labelClasses}>Title *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Electrical Wiring 1st Floor"
                        className={inputClasses}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className={labelClasses}>Category *</label>
                    <input
                        type="text"
                        list="common-categories"
                        required
                        placeholder="Select or type..."
                        className={inputClasses}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="common-categories">
                        <option value="Material" />
                        <option value="Labor" />
                        <option value="Civil" />
                        <option value="Electrical" />
                        <option value="Plumbing" />
                        <option value="Government" />
                    </datalist>
                </div>

                <div>
                    <label className={labelClasses}>Payee *</label>
                    {payees.length === 0 ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm mb-2">
                            No payees found. <Link href="/payees/new" className="underline font-medium">Create a payee first.</Link>
                        </div>
                    ) : (
                        <select
                            required
                            className={inputClasses}
                            value={formData.payeeId}
                            onChange={(e) => setFormData({ ...formData, payeeId: e.target.value })}
                        >
                            {payees.map((p) => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label className={labelClasses}>Estimated Amount (INR) *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">₹</span>
                        <input
                            type="number"
                            required
                            min="0"
                            className={`${inputClasses} pl-8`}
                            placeholder="0.00"
                            value={formData.estimatedAmount}
                            onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Description</label>
                    <textarea
                        className={inputClasses}
                        rows={3}
                        placeholder="Optional details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="w-full justify-center py-3 text-base" disabled={payees.length === 0}>
                        Create Expense
                    </Button>
                </div>
            </form>
        </div>
    );
}

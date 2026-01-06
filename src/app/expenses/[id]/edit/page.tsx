'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';
import Combobox from '@/components/Combobox';

interface Payee {
    _id: string;
    name: string;
}

export default function EditExpense() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [payees, setPayees] = useState<Payee[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        estimatedAmount: '',
        payeeId: '',
        description: '',
    });

    const categories = [
        { id: 'Material', label: 'Material', value: 'Material' },
        { id: 'Labor', label: 'Labor', value: 'Labor' },
        { id: 'Civil', label: 'Civil', value: 'Civil' },
        { id: 'Electrical', label: 'Electrical', value: 'Electrical' },
        { id: 'Plumbing', label: 'Plumbing', value: 'Plumbing' },
        { id: 'Government', label: 'Government', value: 'Government' },
        { id: 'Consultant', label: 'Consultant', value: 'Consultant' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Payees
                const payeesRes = await fetch('/api/payees');
                const payeesData = await payeesRes.json();
                if (payeesData.success) setPayees(payeesData.data);

                // Fetch Expense
                const expenseRes = await fetch(`/api/expenses/${id}`);
                const expenseData = await expenseRes.json();
                if (expenseData.success) {
                    const e = expenseData.data.expense;
                    setFormData({
                        title: e.title,
                        category: e.category,
                        estimatedAmount: e.estimatedAmount.toString(),
                        payeeId: e.payeeId._id,
                        description: e.description || ''
                    });
                }
            } catch (error) {
                console.error(error);
                alert('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimatedAmount: parseFloat(formData.estimatedAmount),
                }),
            });

            if (res.ok) {
                router.push(`/expenses/${id}`);
                router.refresh();
            } else {
                alert('Failed to update expense');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating expense');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border hover:border-slate-300 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    const payeeOptions = payees.map(p => ({ id: p._id, label: p.name, value: p._id }));

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/expenses/${id}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Expense</h1>
                    <p className="text-slate-500 text-sm">Update cost estimate details</p>
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

                <Combobox
                    label="Category *"
                    options={categories}
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    allowCustom={true}
                    placeholder="Select or type..."
                />

                {/* Note: Cannot easily edit payee here because it changes payment relations. Disabled for safety or complexity reduction unless requested. Assuming user might want to change it though. */}
                <Combobox
                    label="Payee *"
                    options={payeeOptions}
                    value={formData.payeeId}
                    onChange={(val) => setFormData({ ...formData, payeeId: val })}
                    allowCustom={false} // Disable custom payee creation on edit for now to keep it simple
                    placeholder="Select payee..."
                />

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

                <div className="pt-2">
                    <Button type="submit" isLoading={loading} className="w-full justify-center py-3 text-base">
                        Update Expense
                    </Button>
                </div>
            </form>
        </div>
    );
}

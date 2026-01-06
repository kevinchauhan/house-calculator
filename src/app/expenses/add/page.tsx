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
        // Fetch payees for dropdown
        const fetchPayees = async () => {
            try {
                const res = await fetch('/api/payees');
                const data = await res.json();
                if (data.success) {
                    setPayees(data.data);
                    // Auto select first if available
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
            alert('Please select a payee. If none exist, create one first.');
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
                router.refresh();
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-2">
                <Link href="/expenses" className="text-gray-500 hover:text-gray-700">← Back</Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Electrical Wiring 1st Floor"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <input
                        type="text"
                        list="common-categories"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
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
                    <label className="block text-sm font-medium text-gray-700">Payee *</label>
                    {payees.length === 0 ? (
                        <div className="mt-1 text-sm text-red-500">
                            No payees found. <Link href="/payees/new" className="underline">Create a payee first.</Link>
                        </div>
                    ) : (
                        <select
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
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
                    <label className="block text-sm font-medium text-gray-700">Estimated Amount (INR) *</label>
                    <input
                        type="number"
                        required
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        value={formData.estimatedAmount}
                        onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="w-full justify-center" disabled={payees.length === 0}>
                        Create Expense
                    </Button>
                </div>
            </form>
        </div>
    );
}

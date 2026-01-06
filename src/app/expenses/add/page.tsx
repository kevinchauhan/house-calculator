'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';
import Combobox from '@/components/Combobox';
import AddPayeeModal from '@/components/AddPayeeModal';
import AddCategoryModal from '@/components/AddCategoryModal';

interface Payee {
    _id: string;
    name: string;
}

export default function AddExpense() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [hasInitialPayment, setHasInitialPayment] = useState(false);

    // Modals state
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        estimatedAmount: '',
        payeeId: '',
        description: '',
    });

    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'cash'
    });

    const [categories, setCategories] = useState([
        { id: 'Material', label: 'Material', value: 'Material' },
        { id: 'Labor', label: 'Labor', value: 'Labor' },
        { id: 'Civil', label: 'Civil', value: 'Civil' },
        { id: 'Electrical', label: 'Electrical', value: 'Electrical' },
        { id: 'Plumbing', label: 'Plumbing', value: 'Plumbing' },
        { id: 'Government', label: 'Government', value: 'Government' },
        { id: 'Consultant', label: 'Consultant', value: 'Consultant' },
    ]);

    useEffect(() => {
        const fetchPayees = async () => {
            try {
                const res = await fetch('/api/payees');
                const data = await res.json();
                if (data.success) {
                    setPayees(data.data);
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
            alert('Please select or create a payee');
            setLoading(false);
            return;
        }

        try {
            const payload: any = {
                ...formData,
                estimatedAmount: parseFloat(formData.estimatedAmount),
            };

            if (hasInitialPayment) {
                payload.initialPayment = {
                    amount: parseFloat(paymentData.amount),
                    date: paymentData.date,
                    mode: paymentData.mode
                };
            }

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border hover:border-slate-300 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700";

    const payeeOptions = payees.map(p => ({ id: p._id, label: p.name, value: p._id }));

    const handlePayeeCreated = (newPayee: Payee) => {
        setPayees(prev => [newPayee, ...prev]);
        setFormData(prev => ({ ...prev, payeeId: newPayee._id }));
    };

    const handleCategoryCreated = (newCategory: string) => {
        if (!categories.some(c => c.value === newCategory)) {
            setCategories(prev => [...prev, { id: newCategory, label: newCategory, value: newCategory }]);
        }
        setFormData(prev => ({ ...prev, category: newCategory }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/expenses" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
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
                    <div className="flex justify-between items-center mb-1">
                        <label className={labelClasses}>Category *</label>
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                        >
                            + Add New
                        </button>
                    </div>
                    <Combobox
                        label="" // Label handled above for custom layout
                        options={categories}
                        value={formData.category}
                        onChange={(val) => setFormData({ ...formData, category: val })}
                        allowCustom={true}
                        placeholder="Select or type new category..."
                        onAddClick={() => setIsCategoryModalOpen(true)}
                        className="mt-0"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className={labelClasses}>Payee *</label>
                        <button
                            type="button"
                            onClick={() => setIsPayeeModalOpen(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                        >
                            + Add New
                        </button>
                    </div>
                    <Combobox
                        label="" // Label handled above
                        options={payeeOptions}
                        value={formData.payeeId}
                        onChange={(val) => setFormData({ ...formData, payeeId: val })}
                        allowCustom={false}
                        placeholder="Select payee..."
                        onAddClick={() => setIsPayeeModalOpen(true)}
                        className="mt-0"
                    />
                </div>

                <div>
                    <label className={labelClasses}>Estimated Amount (INR) *</label>
                    <div className="relative mt-1">
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
                    <label className={`${labelClasses} mb-1`}>Description</label>
                    <textarea
                        className={inputClasses}
                        rows={2}
                        placeholder="Optional details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Initial Payment Toggle */}
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="initialPayment"
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            checked={hasInitialPayment}
                            onChange={(e) => setHasInitialPayment(e.target.checked)}
                        />
                        <label htmlFor="initialPayment" className="text-sm font-medium text-slate-900 select-none">
                            Record initial payment now?
                        </label>
                    </div>

                    {hasInitialPayment && (
                        <div className="bg-slate-50 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className={labelClasses}>Paid Amount (INR) *</label>
                                <input
                                    type="number"
                                    required={hasInitialPayment}
                                    min="0"
                                    className={inputClasses}
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Date</label>
                                    <input
                                        type="date"
                                        required={hasInitialPayment}
                                        className={inputClasses}
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Mode</label>
                                    <select
                                        className={inputClasses}
                                        value={paymentData.mode}
                                        onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank">Bank</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <Button type="submit" isLoading={loading} className="w-full justify-center py-3 text-base">
                        Create Expense
                    </Button>
                </div>
            </form>

            <AddPayeeModal
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={handlePayeeCreated}
            />
            <AddCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={handleCategoryCreated}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';

export default function EditPayee() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        phone: '',
        notes: '',
    });

    useEffect(() => {
        const fetchPayee = async () => {
            try {
                const res = await fetch(`/api/payees/${id}`);
                const data = await res.json();
                if (data.success) {
                    setFormData({
                        name: data.data.name,
                        type: data.data.type,
                        phone: data.data.phone || '',
                        notes: data.data.notes || ''
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayee();
    }, [id]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/payees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/payees');
                router.refresh();
            } else {
                alert('Failed to update payee');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating payee');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border hover:border-slate-300 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/payees" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Payee</h1>
                    <p className="text-slate-500 text-sm">Update contact information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl border border-slate-200 p-8 space-y-6">
                <div>
                    <label className={labelClasses}>Name *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Milan Civil Contractor"
                        className={inputClasses}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className={labelClasses}>Type *</label>
                    <select
                        className={inputClasses}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="individual">Individual</option>
                        <option value="contractor">Contractor</option>
                        <option value="govt">Government</option>
                        <option value="utility">Utility</option>
                        <option value="supplier">Supplier</option>
                    </select>
                </div>

                <div>
                    <label className={labelClasses}>Phone</label>
                    <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className={inputClasses}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div>
                    <label className={labelClasses}>Notes</label>
                    <textarea
                        className={inputClasses}
                        rows={3}
                        placeholder="Bank details, address, or other info..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="w-full justify-center py-3 text-base">
                        Update Payee
                    </Button>
                </div>
            </form>
        </div>
    );
}

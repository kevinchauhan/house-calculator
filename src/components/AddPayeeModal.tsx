'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface AddPayeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (payee: any) => void;
}

export default function AddPayeeModal({ isOpen, onClose, onSuccess }: AddPayeeModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        phone: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/payees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                onSuccess(data.data);
                setFormData({ name: '', type: 'individual', phone: '', notes: '' }); // Reset form
                onClose();
            } else {
                alert('Failed to create payee');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating payee');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border hover:border-slate-300 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Payee">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClasses}>Name *</label>
                    <input
                        type="text"
                        required
                        className={inputClasses}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe / ABC Traders"
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
                        className={inputClasses}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91..."
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" isLoading={loading} className="w-full justify-center">
                        Create Payee
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

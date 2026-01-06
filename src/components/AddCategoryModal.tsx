'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (category: string) => void;
}

export default function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryModalProps) {
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category.trim()) return;

        onSuccess(category.trim());
        setCategory('');
        onClose();
    };

    const inputClasses = "mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border hover:border-slate-300 transition-colors";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Category">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClasses}>Category Name *</label>
                    <input
                        type="text"
                        required
                        className={inputClasses}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Painting, Furniture"
                        autoFocus
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" isLoading={false} className="w-full justify-center">
                        Add Category
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

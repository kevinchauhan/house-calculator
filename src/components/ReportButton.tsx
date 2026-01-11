'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';

interface ReportButtonProps {
    expenseId?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

export default function ReportButton({ expenseId, variant = 'outline', className }: ReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors";

    let variantClasses = "";
    if (variant === 'outline') {
        variantClasses = "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
    } else if (variant === 'primary') {
        variantClasses = "border border-transparent text-white bg-indigo-600 hover:bg-indigo-700";
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`${baseClasses} ${variantClasses} ${className || ''}`}
            >
                📥 Export Report
            </button>

            <ReportModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                expenseId={expenseId}
            />
        </>
    );
}

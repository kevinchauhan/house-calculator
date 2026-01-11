'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    expenseId?: string; // If present, export is for specific expense
}

export default function ReportModal({ isOpen, onClose, expenseId }: ReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('all'); // all, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState('excel'); // excel, pdf

    const handleDownload = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (expenseId) params.append('expenseId', expenseId);
            if (dateRange === 'custom' && startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            const endpoint = format === 'pdf' ? '/api/reports/pdf' : '/api/reports/excel';
            const url = `${endpoint}?${params.toString()}`;

            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onClose();
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Report">
            <div className="space-y-6">
                {/* Date Range Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Date Range</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="dateRange"
                                value="all"
                                checked={dateRange === 'all'}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-700">All Time</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="dateRange"
                                value="custom"
                                checked={dateRange === 'custom'}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-700">Custom Date</span>
                        </label>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Format Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Format</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormat('excel')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'excel'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <span className="text-2xl mb-2">📊</span>
                            <span className="text-sm font-medium">Excel</span>
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'pdf'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <span className="text-2xl mb-2">📄</span>
                            <span className="text-sm font-medium">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownload}
                        isLoading={loading}
                        disabled={dateRange === 'custom' && (!startDate || !endDate)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        Download Report
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

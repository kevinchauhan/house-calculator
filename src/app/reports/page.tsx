'use client';

import { useState } from 'react';
import Button from '@/components/Button';

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('all'); // all, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState('excel'); // excel, pdf

    const handleDownload = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
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

        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
                <p className="text-slate-500 mt-1">Generate lists of expenses and payments.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
                {/* Date Range Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-900">1. Select Date Range</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${dateRange === 'all'
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}>
                            <input
                                type="radio"
                                name="dateRange"
                                value="all"
                                checked={dateRange === 'all'}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                            />
                            <span className={`font-medium ${dateRange === 'all' ? 'text-emerald-900' : 'text-slate-700'}`}>All Time</span>
                        </label>
                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${dateRange === 'custom'
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}>
                            <input
                                type="radio"
                                name="dateRange"
                                value="custom"
                                checked={dateRange === 'custom'}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                            />
                            <span className={`font-medium ${dateRange === 'custom' ? 'text-emerald-900' : 'text-slate-700'}`}>Custom Date</span>
                        </label>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50 border"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Format Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-900">2. Select Format</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormat('excel')}
                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${format === 'excel'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <span className="text-3xl mb-3">📊</span>
                            <span className="text-base font-medium">Excel (.xlsx)</span>
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${format === 'pdf'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <span className="text-3xl mb-3">📄</span>
                            <span className="text-base font-medium">PDF Document</span>
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-100">
                    <Button
                        onClick={handleDownload}
                        isLoading={loading}
                        disabled={dateRange === 'custom' && (!startDate || !endDate)}
                        className="w-full justify-center py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    >
                        {loading ? 'Generating Report...' : `Download ${format === 'excel' ? 'Excel' : 'PDF'} Report`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

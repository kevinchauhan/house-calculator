'use client';

export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-2 pb-6 border-b border-slate-200">
                <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>
                <div className="h-8 w-64 bg-slate-200 rounded-xl"></div>
                <div className="h-4 w-80 bg-slate-200 rounded-lg mt-2"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                        <div className="h-4 w-24 bg-slate-200 rounded-lg"></div>
                        <div className="h-8 w-36 bg-slate-200 rounded-xl"></div>
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton Area */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <div className="h-6 w-40 bg-slate-200 rounded-lg"></div>
                    <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
                </div>

                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-2 w-full md:w-auto">
                                <div className="h-5 w-48 bg-slate-200 rounded-lg"></div>
                                <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

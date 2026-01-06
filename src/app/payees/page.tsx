import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Payee from '@/models/Payee';
import Link from 'next/link';

async function getPayees() {
    await dbConnect();
    const payees = await Payee.find({}).sort({ createdAt: -1 });
    return payees;
}

const typeStyles: Record<string, string> = {
    contractor: 'bg-blue-50 text-blue-700 border-blue-200',
    govt: 'bg-amber-50 text-amber-700 border-amber-200',
    utility: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    supplier: 'bg-purple-50 text-purple-700 border-purple-200',
    individual: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default async function PayeesList() {
    const payees = await getPayees();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payees</h1>
                    <p className="text-slate-500 mt-1">Manage contacts and entities</p>
                </div>
                <Link
                    href="/payees/new"
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all"
                >
                    + Add Payee
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {payees.map((payee) => (
                    <div key={payee._id.toString()} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-lg">
                                    {payee.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${typeStyles[payee.type] || typeStyles.individual}`}>
                                        {payee.type.toUpperCase()}
                                    </span>
                                    <Link href={`/payees/${payee._id}/edit`} className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
                                        ✏️
                                    </Link>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{payee.name}</h3>
                            {payee.phone && <p className="text-sm text-slate-500 flex items-center gap-2">📞 {payee.phone}</p>}
                        </div>

                        {payee.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-500 italic line-clamp-2">"{payee.notes}"</p>
                            </div>
                        )}
                    </div>
                ))}
                {payees.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            👥
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No payees yet</h3>
                        <p className="text-slate-500 mt-1">Add contractors, suppliers, or workers to list here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

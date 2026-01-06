import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import Link from 'next/link';

async function getExpenseDetails(id: string) {
    await dbConnect();

    const expense = await Expense.findById(id).populate('payeeId').lean();
    if (!expense) return null;

    const payments = await Payment.find({ expenseId: id }).sort({ paymentDate: -1 }).lean();

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = (expense.estimatedAmount || 0) - totalPaid;

    return JSON.parse(JSON.stringify({ expense, payments, totalPaid, balance }));
}

export default async function ExpenseDetail(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const data = await getExpenseDetails(params.id);

    if (!data) {
        return <div className="text-center py-20 text-slate-500">Expense not found</div>;
    }

    const { expense, payments, totalPaid, balance } = data;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div>
                    <Link href="/expenses" className="text-sm font-medium text-slate-500 hover:text-indigo-600 mb-2 inline-block transition-colors">← Back to Expenses</Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{expense.title}</h1>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                            {expense.category}
                        </span>
                        <span className="text-slate-500">
                            Paid to <span className="font-semibold text-slate-700">{expense.payeeId?.name}</span>
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/expenses/${expense._id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                        Edit Expense
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Estimated Cost</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{expense.estimatedAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Balance Pending</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">₹{balance.toLocaleString()}</p>
                </div>
            </div>

            {/* Description */}
            {expense.description && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-600 leading-relaxed">{expense.description}</p>
                </div>
            )}

            {/* Payments */}
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
                    <Link
                        href={`/expenses/${expense._id}/payment/new`}
                        className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all"
                    >
                        + Record Payment
                    </Link>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No payments recorded yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {payments.map((p: any) => (
                            <div key={p._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-indigo-200 transition-colors">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-900">₹{p.amount.toLocaleString()}</span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                            {p.paymentMode}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                        <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="font-mono text-xs bg-slate-50 px-1 py-0.5 rounded text-slate-400">#{p.receiptNumber}</span>
                                    </div>
                                    {p.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">{p.notes}</p>}
                                </div>
                                <div>
                                    <a
                                        href={`/api/receipts/${p._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        Download Receipt ↓
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

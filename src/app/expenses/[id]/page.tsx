import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import Link from 'next/link';
import ExpenseActions from './ExpenseActions';
import PaymentList from './PaymentList';

async function getExpenseDetails(id: string) {
    await dbConnect();

    const expense = await Expense.findById(id).populate('payeeId').lean();
    if (!expense) return null;

    const payments = await Payment.find({ expenseId: id }).sort({ paymentDate: -1 }).lean();

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = (expense.estimatedAmount || 0) - totalPaid;

    // Convert _id and dates to string/number to be serializable for Client Components if needed, 
    // though passing to ExpenseActions and PaymentList (Client Components) standard serializable props is fine.
    // Next.js Server Actions/Components serialization handles basic JSON types.
    // We'll trust lean() and JSON.parse trick to strip mongoose object wrappers.
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

                {/* Actions Component (Edit, Delete) */}
                <ExpenseActions expenseId={expense._id} />
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
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{balance.toLocaleString()}</p>
                </div>
            </div>

            {/* Description */}
            {expense.description && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-600 leading-relaxed">{expense.description}</p>
                </div>
            )}

            {/* Payments List Component (includes Delete Actions) */}
            <PaymentList payments={payments} expenseId={expense._id} />
        </div>
    );
}

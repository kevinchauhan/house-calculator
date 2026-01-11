import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Link from 'next/link';
import ReportButton from '@/components/ReportButton';

async function getExpenses() {
    await dbConnect();
    const expenses = await Expense.aggregate([
        {
            $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'expenseId',
                as: 'payments',
            },
        },
        {
            $addFields: {
                totalPaid: { $sum: '$payments.amount' },
            },
        },
        {
            $addFields: {
                balance: { $subtract: ['$estimatedAmount', '$totalPaid'] },
            },
        },
        {
            $lookup: {
                from: 'payees',
                localField: 'payeeId',
                foreignField: '_id',
                as: 'payee',
            },
        },
        {
            $unwind: { path: '$payee', preserveNullAndEmptyArrays: true },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);
    return JSON.parse(JSON.stringify(expenses));
}

export default async function ExpensesList() {
    const expenses = await getExpenses();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
                    <p className="text-slate-500 mt-1">Track payments against estimates</p>
                </div>
                <Link
                    href="/expenses/add"
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all"
                >
                    + Add Expense
                </Link>
            </div>

            <div className="flex justify-end">
                <ReportButton />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {expenses.map((expense: any) => {
                    const progress = Math.min(100, Math.max(0, ((expense.totalPaid || 0) / (expense.estimatedAmount || 1)) * 100));
                    const isFull = progress >= 100;

                    return (
                        <Link href={`/expenses/${expense._id}`} key={expense._id} className="block group">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {expense.title}
                                            </h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {expense.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            {expense.payee?.name || 'Unknown Payee'}
                                        </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="text-2xl font-bold text-slate-900">₹{expense.totalPaid?.toLocaleString()}</p>
                                        <p className="text-sm text-slate-500">
                                            of ₹{(expense.estimatedAmount || 0).toLocaleString()} estimated
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                                        <span className={isFull ? 'text-green-600' : 'text-indigo-600'}>
                                            {Math.round(progress)}% Paid
                                        </span>
                                        <span>₹{expense.balance?.toLocaleString()} Pending</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${isFull
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                                : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {expenses.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            💸
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No expenses yet</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">Get started by adding your first expense estimate.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';

async function getExpenses() {
    await dbConnect();
    // Same aggregation as API
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

    // Serialize for Server Component if needed, but Next.js handles plain objects mostly.
    return JSON.parse(JSON.stringify(expenses));
}

export default async function ExpensesList() {
    const expenses = await getExpenses();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                <Link
                    href="/expenses/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    + Add Expense
                </Link>
            </div>

            <div className="space-y-4">
                {expenses.map((expense: any) => {
                    const progress = Math.min(100, Math.max(0, ((expense.totalPaid || 0) / (expense.estimatedAmount || 1)) * 100));

                    return (
                        <Link href={`/expenses/${expense._id}`} key={expense._id} className="block group">
                            <Card className="hover:border-blue-300 border border-transparent transition-all">
                                <CardContent>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                                                {expense.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">{expense.payee?.name || 'Unknown Payee'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">₹{expense.totalPaid?.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">
                                                of ₹{(expense.estimatedAmount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}

                {expenses.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        No expenses recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
}

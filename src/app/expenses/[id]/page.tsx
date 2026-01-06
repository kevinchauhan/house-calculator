import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/Card';
import { jsPDF } from 'jspdf';

async function getExpenseDetails(id: string) {
    await dbConnect();

    const expense = await Expense.findById(id).populate('payeeId').lean();
    if (!expense) return null;

    const payments = await Payment.find({ expenseId: id }).sort({ paymentDate: -1 }).lean();

    // Calculate stats
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = (expense.estimatedAmount || 0) - totalPaid;

    // Serialize IDs
    return JSON.parse(JSON.stringify({ expense, payments, totalPaid, balance }));
}

export default async function ExpenseDetail({ params }: { params: { id: string } }) {
    const data = await getExpenseDetails(params.id);

    if (!data) {
        return <div className="text-center py-10">Expense not found</div>;
    }

    const { expense, payments, totalPaid, balance } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <Link href="/expenses" className="text-sm text-gray-500 hover:text-gray-700">← Back to Expenses</Link>
                <h1 className="text-2xl font-bold text-gray-900">{expense.title}</h1>
                <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Paid to:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">{expense.payeeId?.name}</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent>
                        <p className="text-sm text-gray-500">Estimated</p>
                        <p className="text-xl font-bold">₹{expense.estimatedAmount?.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Paid</p>
                        <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className="text-xl font-bold text-purple-600">₹{balance.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Description */}
            {expense.description && (
                <Card>
                    <CardContent>
                        <h3 className="text-sm font-medium text-gray-700">Description</h3>
                        <p className="mt-1 text-gray-600">{expense.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Payments */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                    <Link
                        href={`/expenses/${expense._id}/payment/new`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        + Add Payment
                    </Link>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded border border-gray-200 text-gray-500">
                        No payments made yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((p: any) => (
                            <Card key={p._id}>
                                <CardContent>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900">₹{p.amount.toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">{new Date(p.paymentDate).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-400 mt-1">{p.paymentMode.toUpperCase()} | Receipt: {p.receiptNumber}</p>
                                        </div>
                                        <a
                                            href={`/api/receipts/${p._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center"
                                        >
                                            Download Receipt
                                        </a>
                                    </div>
                                    {p.notes && <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{p.notes}</p>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import '@/models/Payee'; // Ensure Payee model is registered for populate
import Payment from '@/models/Payment';
import Attachment from '@/models/Attachment';
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

    // Fetch attachments for this expense
    const attachments = await Attachment.find({ expenseId: id }).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify({ expense, payments, totalPaid, balance, attachments }));
}

export default async function ExpenseDetail(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const data = await getExpenseDetails(params.id);

    if (!data) {
        return <div className="text-center py-20 text-slate-500">Expense not found</div>;
    }

    const { expense, payments, totalPaid, balance, attachments = [] } = data;

    // Separate expense-level attachments from payment attachments
    const expenseAttachments = attachments.filter((att: any) => !att.paymentId);

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
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{expense.estimatedAmount?.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Balance Pending</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{balance.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Description & Expense-level attachments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${expenseAttachments.length > 0 ? 'md:col-span-2' : 'md:col-span-3'} space-y-6`}>
                    {expense.description && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                            <p className="text-slate-600 leading-relaxed">{expense.description}</p>
                        </div>
                    )}
                </div>

                {/* Expense-level Attachments Panel */}
                {expenseAttachments.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Expense Files</h3>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[220px] pr-1">
                            {expenseAttachments.map((att: any) => {
                                const isPdf = att.format?.toLowerCase() === 'pdf' || att.originalName.toLowerCase().endsWith('.pdf');
                                return (
                                    <a
                                        key={att._id}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex flex-col justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-center overflow-hidden"
                                    >
                                        <div className="mx-auto my-1 flex items-center justify-center">
                                            {isPdf ? (
                                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 font-extrabold text-xs">
                                                    PDF
                                                </div>
                                            ) : (
                                                <img
                                                    src={att.url}
                                                    alt={att.originalName}
                                                    className="w-10 h-10 object-cover rounded-lg shadow-sm border border-white group-hover:scale-105 transition-transform"
                                                />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 truncate mt-2 w-full block">
                                            {att.originalName}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Payments List Component (includes Delete Actions and pass files) */}
            <PaymentList payments={payments} expenseId={expense._id} attachments={attachments} />
        </div>
    );
}


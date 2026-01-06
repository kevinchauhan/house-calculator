import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import Link from 'next/link';

async function getSummaryData() {
  await dbConnect();

  const expenses = await Expense.find({}, 'estimatedAmount');
  const totalEstimated = expenses.reduce((sum, e) => sum + (e.estimatedAmount || 0), 0);

  const payments = await Payment.find({}, 'amount');
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const balance = totalEstimated - totalPaid;

  return { totalEstimated, totalPaid, balance };
}

function SummaryCard({ title, amount, icon, colorClass }: { title: string, amount: number, icon: string, colorClass: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{amount.toLocaleString()}</p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}

export default async function Home() {
  const { totalEstimated, totalPaid, balance } = await getSummaryData();

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of construction finances</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/payees"
            className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Manage Payees
          </Link>
          <Link
            href="/expenses/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <SummaryCard
          title="Total Estimated"
          amount={totalEstimated}
          icon="📊"
          colorClass="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Total Paid"
          amount={totalPaid}
          icon="✅"
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Balance Remaining"
          amount={balance}
          icon="⏳"
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Actions / Recents */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Quick Access</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/expenses" className="group">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all duration-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">View Expenses</h3>
                <p className="text-slate-500 text-sm mt-0.5">Check status of all cost heads</p>
              </div>
              <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

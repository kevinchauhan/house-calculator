import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import { Card, CardTitle, CardContent } from '@/components/Card';
import Link from 'next/link';

async function getSummaryData() {
  await dbConnect();

  // Total Estimated
  const expenses = await Expense.find({}, 'estimatedAmount');
  const totalEstimated = expenses.reduce((sum, e) => sum + (e.estimatedAmount || 0), 0);

  // Total Paid
  const payments = await Payment.find({}, 'amount');
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const balance = totalEstimated - totalPaid;

  return { totalEstimated, totalPaid, balance };
}

export default async function Home() {
  const { totalEstimated, totalPaid, balance } = await getSummaryData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
        <div className="mt-4 sm:mt-0 space-x-3">
          <Link
            href="/expenses/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            + Add Expense
          </Link>
          <Link
            href="/payees"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage Payees
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <CardTitle className="text-blue-700">Total Estimated</CardTitle>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">
              ₹{totalEstimated.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-l-4 border-green-500">
          <CardTitle className="text-green-700">Total Paid</CardTitle>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              ₹{totalPaid.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-l-4 border-purple-500">
          <CardTitle className="text-purple-700">Balance Remaining</CardTitle>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">
              ₹{balance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity or Quick Links could go here */}
      <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/expenses" className="group">
          <Card className="hover:border-blue-300 border border-transparent transition-all">
            <CardTitle className="group-hover:text-blue-600">View Expenses</CardTitle>
            <CardContent className="text-gray-500 text-sm">See all cost heads and their status</CardContent>
          </Card>
        </Link>
        {/* More quick links */}
      </div>
    </div>
  );
}

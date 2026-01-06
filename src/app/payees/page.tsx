import dbConnect from '@/lib/dbConnect';
export const dynamic = 'force-dynamic';
import Payee from '@/models/Payee';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';

async function getPayees() {
    await dbConnect();
    const payees = await Payee.find({}).sort({ createdAt: -1 });
    return payees;
}

export default async function PayeesList() {
    const payees = await getPayees();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Payees</h1>
                <Link
                    href="/payees/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    + Add Payee
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {payees.map((payee) => (
                    <Card key={payee._id.toString()}>
                        <CardContent>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{payee.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${payee.type === 'contractor' ? 'bg-blue-100 text-blue-800' :
                                            payee.type === 'govt' ? 'bg-yellow-100 text-yellow-800' :
                                                payee.type === 'utility' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                        {payee.type.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-500 space-y-1">
                                {payee.phone && <p>Phone: {payee.phone}</p>}
                                {payee.notes && <p className="truncate">Notes: {payee.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {payees.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No payees found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}

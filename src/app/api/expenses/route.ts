import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import mongoose from 'mongoose';

export async function GET() {
    await dbConnect();
    try {
        // Aggregate to include totalPaid and balance
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

        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        console.error('Expense GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        const expense = await Expense.create(body);
        return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

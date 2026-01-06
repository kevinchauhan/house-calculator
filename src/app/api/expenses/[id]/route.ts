import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import Payee from '@/models/Payee'; // Ensure model is registered
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid expense ID' }, { status: 400 });
    }

    try {
        const expense = await Expense.findById(id).populate('payeeId');
        if (!expense) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }

        const payments = await Payment.find({ expenseId: id }).sort({ paymentDate: -1 });

        // Calculate totals
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = (expense.estimatedAmount || 0) - totalPaid;

        return NextResponse.json({
            success: true,
            data: {
                expense,
                payments,
                summary: {
                    totalPaid,
                    balance
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch expense details' }, { status: 500 });
    }
}

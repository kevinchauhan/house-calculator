import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid expense ID' }, { status: 400 });
    }

    const expense = await Expense.findById(id).populate('payeeId');
    if (!expense) {
        return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const payments = await Payment.find({ expenseId: id }).sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = (expense.estimatedAmount || 0) - totalPaid;

    return NextResponse.json({ success: true, data: { expense, payments, totalPaid, balance } });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid expense ID' }, { status: 400 });
    }

    const expense = await Expense.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!expense) {
        return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: expense });
}

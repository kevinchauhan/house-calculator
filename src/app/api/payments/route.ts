import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Expense from '@/models/Expense';
import Payee from '@/models/Payee'; // Ensure model is registered

export async function GET(request: NextRequest) {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const expenseId = searchParams.get('expenseId');

    try {
        const query = expenseId ? { expenseId } : {};
        const payments = await Payment.find(query)
            .populate('payeeId')
            .populate('expenseId')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: payments });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();

        // Generate Receipt Number
        // Format: HC-YYYY-XXXX (e.g., HC-2026-0001)
        const year = new Date().getFullYear();
        const prefix = `HC-${year}-`;

        const lastPayment = await Payment.findOne({
            receiptNumber: { $regex: `^${prefix}` }
        }).sort({ receiptNumber: -1 });

        let sequence = 1;
        if (lastPayment && lastPayment.receiptNumber) {
            const parts = lastPayment.receiptNumber.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2], 10) + 1;
            }
        }

        const receiptNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

        const payment = await Payment.create({
            ...body,
            receiptNumber
        });

        return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

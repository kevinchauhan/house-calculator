import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attachment from '@/models/Attachment';
import Expense from '@/models/Expense'; // Ensure models are registered
import Payment from '@/models/Payment'; // Ensure models are registered

export async function GET(request: NextRequest) {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const expenseId = searchParams.get('expenseId');
    const paymentId = searchParams.get('paymentId');

    try {
        const query: any = {};
        if (expenseId) query.expenseId = expenseId;
        if (paymentId) query.paymentId = paymentId;

        const attachments = await Attachment.find(query)
            .populate({
                path: 'expenseId',
                select: 'title category estimatedAmount payeeId',
                populate: { path: 'payeeId', select: 'name' }
            })
            .populate({
                path: 'paymentId',
                select: 'amount receiptNumber paymentDate paymentMode'
            })
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: attachments });
    } catch (error: any) {
        console.error('Fetch attachments error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attachments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        const attachment = await Attachment.create(body);
        return NextResponse.json({ success: true, data: attachment }, { status: 201 });
    } catch (error: any) {
        console.error('Create attachment error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

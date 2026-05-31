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
        
        // Extract attachment arrays and initial payment
        const expenseAttachments = body.attachments || [];
        const initialPayment = body.initialPayment;
        
        // Clean body to prevent schema issues
        const expenseData = { ...body };
        delete expenseData.attachments;
        delete expenseData.initialPayment;

        // 1. Create Expense
        const expense = await Expense.create(expenseData);

        // 2. Link Expense level attachments
        if (expenseAttachments.length > 0) {
            const Attachment = (await import('@/models/Attachment')).default;
            await Promise.all(
                expenseAttachments.map((att: any) =>
                    Attachment.create({
                        ...att,
                        expenseId: expense._id,
                    })
                )
            );
        }

        // 3. Create Initial Payment if requested
        if (initialPayment) {
            const paymentAttachments = initialPayment.attachments || [];
            
            // Generate Receipt Number
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
                expenseId: expense._id,
                payeeId: expense.payeeId,
                amount: initialPayment.amount,
                paymentDate: initialPayment.date ? new Date(initialPayment.date) : new Date(),
                paymentMode: initialPayment.mode || 'cash',
                receiptNumber,
            });

            // Link Initial Payment attachments
            if (paymentAttachments.length > 0) {
                const Attachment = (await import('@/models/Attachment')).default;
                await Promise.all(
                    paymentAttachments.map((att: any) =>
                        Attachment.create({
                            ...att,
                            expenseId: expense._id,
                            paymentId: payment._id,
                        })
                    )
                );
            }
        }

        return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } catch (error: any) {
        console.error('Expense POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}


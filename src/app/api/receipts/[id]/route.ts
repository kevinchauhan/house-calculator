import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Expense from '@/models/Expense';
import Payee from '@/models/Payee';
import { jsPDF } from 'jspdf';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const payment = await Payment.findById(id)
            .populate('expenseId')
            .populate('payeeId');

        if (!payment) {
            return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
        }

        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });

        // Meta Info
        doc.setFontSize(12);
        doc.text(`Receipt No: ${payment.receiptNumber}`, 20, 40);
        doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 140, 40);

        // Card
        doc.setDrawColor(0);
        doc.rect(15, 50, 180, 100);

        // Content
        doc.setFontSize(14);
        doc.text(`Paid To:`, 20, 70);
        doc.setFontSize(16);
        doc.text(`${(payment.payeeId as any).name}`, 60, 70);

        doc.setFontSize(14);
        doc.text(`Amount:`, 20, 90);
        doc.setFontSize(16);
        doc.text(`INR ${payment.amount.toLocaleString()}`, 60, 90);

        doc.setFontSize(14);
        doc.text(`For:`, 20, 110);
        doc.setFontSize(14);
        // Safe check if expenseId exists (it might have been deleted, though referenced)
        const expenseTitle = payment.expenseId ? (payment.expenseId as any).title : 'Expense Deleted';
        doc.text(`${expenseTitle}`, 60, 110);

        doc.setFontSize(12);
        doc.text(`Payment Mode: ${payment.paymentMode.toUpperCase()}`, 20, 130);

        if (payment.notes) {
            doc.text(`Notes: ${payment.notes}`, 20, 140);
        }

        // Footer
        doc.setFontSize(10);
        doc.text('Thank you for your business.', 105, 180, { align: 'center' });

        doc.line(20, 220, 80, 220);
        doc.text('Authorized Signature', 20, 225);

        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('Receipt generation error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate receipt' }, { status: 500 });
    }
}

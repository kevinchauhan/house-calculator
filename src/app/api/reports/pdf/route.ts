import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Expense from '@/models/Expense';
import '@/models/Payee';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const searchParams = request.nextUrl.searchParams;
        const expenseId = searchParams.get('expenseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build Query (Same as Excel)
        const query: any = {};
        if (expenseId) query.expenseId = expenseId;
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.paymentDate.$lte = end;
            }
        }

        const payments = await Payment.find(query)
            .populate('expenseId')
            .populate('payeeId')
            .sort({ paymentDate: -1 })
            .lean();

        // Create PDF
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Expense Report', 14, 22);

        doc.setFontSize(10);
        const dateRangeText = startDate && endDate
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'All Time';
        doc.text(`Period: ${dateRangeText}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

        // Table
        const tableBody = payments.map((p: any) => [
            new Date(p.paymentDate).toLocaleDateString('en-IN'),
            p.receiptNumber || '-',
            p.expenseId?.title || 'Unknown',
            p.payeeId?.name || '-',
            `INR ${p.amount.toLocaleString('en-IN')}`,
            p.paymentMode.toUpperCase()
        ]);

        // Calculate Total
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        tableBody.push(['', '', '', 'TOTAL', `INR ${totalAmount.toLocaleString('en-IN')}`, '']);

        autoTable(doc, {
            head: [['Date', 'Receipt', 'Expense', 'Payee', 'Amount', 'Mode']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
            footStyles: { fillColor: [241, 245, 249], textColor: 50, fontStyle: 'bold' }, // Slate-100
        });

        // Output
        const buffer = doc.output('arraybuffer');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="expense-report.pdf"`
            }
        });

    } catch (error) {
        console.error('PDF Export Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate PDF report' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import '@/models/Expense'; // Force registration
import '@/models/Payee';   // Force registration
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const searchParams = request.nextUrl.searchParams;
        const expenseId = searchParams.get('expenseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build Query
        const query: any = {};

        if (expenseId) {
            query.expenseId = expenseId;
        }

        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            // End date should include the full day
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.paymentDate.$lte = end;
            }
        }

        // Fetch Data
        const payments = await Payment.find(query)
            .populate('expenseId')
            .populate('payeeId')
            .sort({ paymentDate: -1 })
            .lean();

        // Create Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payments');

        // Define Columns
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Receipt No', key: 'receipt', width: 20 },
            { header: 'Expense Title', key: 'expense', width: 30 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Payee', key: 'payee', width: 25 },
            { header: 'Amount (INR)', key: 'amount', width: 15 },
            { header: 'Mode', key: 'mode', width: 15 },
            { header: 'Notes', key: 'notes', width: 40 },
        ];

        // Add Header Style
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add Rows
        payments.forEach((p: any) => {
            worksheet.addRow({
                date: new Date(p.paymentDate).toLocaleDateString('en-IN'),
                receipt: p.receiptNumber || '-',
                expense: p.expenseId?.title || 'Unknown',
                category: p.expenseId?.category || '-',
                payee: p.payeeId?.name || '-',
                amount: p.amount,
                mode: p.paymentMode.toUpperCase(),
                notes: p.notes || ''
            });
        });

        // Totals Row
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        worksheet.addRow([]);
        const totalRow = worksheet.addRow({
            payee: 'TOTAL',
            amount: totalAmount
        });
        totalRow.font = { bold: true };

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Return Response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="expense-report.xlsx"`
            }
        });

    } catch (error) {
        console.error('Excel Export Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate Excel report' },
            { status: 500 }
        );
    }
}

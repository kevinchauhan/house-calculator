import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payee from '@/models/Payee';

export async function GET() {
    await dbConnect();
    try {
        const payees = await Payee.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: payees });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch payees' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        const payee = await Payee.create(body);
        return NextResponse.json({ success: true, data: payee }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

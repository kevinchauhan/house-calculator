import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payee from '@/models/Payee';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid payee ID' }, { status: 400 });
    }

    const payee = await Payee.findById(id);
    if (!payee) {
        return NextResponse.json({ success: false, error: 'Payee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payee });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid payee ID' }, { status: 400 });
    }

    const payee = await Payee.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!payee) {
        return NextResponse.json({ success: false, error: 'Payee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payee });
}

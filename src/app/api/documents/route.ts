import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DocumentModel from '@/models/Document';

export async function GET(request: NextRequest) {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    let folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date'; // date, name, size

    if (folderId === 'null' || folderId === 'undefined' || !folderId) {
        folderId = null;
    }

    try {
        let query: any = {};

        // If there's a search term, ignore folderId to perform a global search
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        } else {
            query.folderId = folderId;
        }

        let sortOption: any = { createdAt: -1 }; // default: newest first
        if (sortBy === 'name') {
            sortOption = { name: 1 };
        } else if (sortBy === 'size') {
            sortOption = { bytes: -1 }; // largest first
        } else if (sortBy === 'date') {
            sortOption = { createdAt: -1 };
        }

        const documents = await DocumentModel.find(query).sort(sortOption);
        return NextResponse.json({ success: true, data: documents });
    } catch (error: any) {
        console.error('Fetch documents error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        
        let folderId = body.folderId;
        if (folderId === 'null' || folderId === 'undefined' || !folderId) {
            folderId = null;
        }

        const newDocument = await DocumentModel.create({
            name: body.name,
            url: body.url,
            publicId: body.publicId,
            format: body.format,
            bytes: body.bytes,
            folderId
        });

        return NextResponse.json({ success: true, data: newDocument }, { status: 201 });
    } catch (error: any) {
        console.error('Create document error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

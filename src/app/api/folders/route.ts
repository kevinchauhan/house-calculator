import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Folder from '@/models/Folder';

export async function GET(request: NextRequest) {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    let parentFolderId = searchParams.get('parentFolderId');

    // Treat 'null', 'undefined', or empty string as root (null)
    if (parentFolderId === 'null' || parentFolderId === 'undefined' || !parentFolderId) {
        parentFolderId = null;
    }

    try {
        const folders = await Folder.find({ parentFolderId }).sort({ name: 1 });
        return NextResponse.json({ success: true, data: folders });
    } catch (error: any) {
        console.error('Fetch folders error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch folders' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        
        let parentFolderId = body.parentFolderId;
        if (parentFolderId === 'null' || parentFolderId === 'undefined' || !parentFolderId) {
            parentFolderId = null;
        }

        const newFolder = await Folder.create({
            name: body.name,
            parentFolderId
        });

        return NextResponse.json({ success: true, data: newFolder }, { status: 201 });
    } catch (error: any) {
        console.error('Create folder error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

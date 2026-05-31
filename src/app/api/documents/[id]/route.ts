import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DocumentModel from '@/models/Document';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    try {
        const document = await DocumentModel.findById(params.id);
        if (!document) {
            return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
        }

        const isPdf = document.format?.toLowerCase() === 'pdf' || document.name.toLowerCase().endsWith('.pdf');

        try {
            await cloudinary.uploader.destroy(document.publicId, {
                resource_type: isPdf ? 'raw' : 'image'
            });
            await cloudinary.uploader.destroy(document.publicId, {
                resource_type: 'raw'
            });
        } catch (cloudinaryErr) {
            console.warn('Failed to delete asset from Cloudinary:', cloudinaryErr);
        }

        await DocumentModel.findByIdAndDelete(params.id);

        return NextResponse.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

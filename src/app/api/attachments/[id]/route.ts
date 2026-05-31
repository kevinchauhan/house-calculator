import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attachment from '@/models/Attachment';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    try {
        const body = await request.json();

        const updateData: any = {};
        if ('expenseId' in body) {
            updateData.expenseId = body.expenseId ? body.expenseId : null;
        }
        if ('paymentId' in body) {
            updateData.paymentId = body.paymentId ? body.paymentId : null;
        }

        const attachment = await Attachment.findByIdAndUpdate(
            params.id,
            { $set: updateData },
            { new: true }
        );

        if (!attachment) {
            return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: attachment });
    } catch (error: any) {
        console.error('Update attachment error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    try {
        const attachment = await Attachment.findById(params.id);
        if (!attachment) {
            return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 });
        }

        const isPdf = attachment.format?.toLowerCase() === 'pdf' || attachment.originalName.toLowerCase().endsWith('.pdf');

        try {
            // Cloudinary auto resource type uploads PDFs either as raw or image.
            // We destroy as image first.
            await cloudinary.uploader.destroy(attachment.publicId, {
                resource_type: 'image'
            });
            // Try destroying as raw too if it was uploaded as raw
            await cloudinary.uploader.destroy(attachment.publicId, {
                resource_type: 'raw'
            });
        } catch (cloudinaryErr) {
            console.warn('Failed to delete asset from Cloudinary:', cloudinaryErr);
        }

        await Attachment.findByIdAndDelete(params.id);

        return NextResponse.json({ success: true, message: 'Attachment deleted successfully' });
    } catch (error: any) {
        console.error('Delete attachment error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

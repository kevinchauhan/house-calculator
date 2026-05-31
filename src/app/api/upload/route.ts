import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        
        // Generate a safe, unique public ID containing the file extension
        const cleanName = file.name
            .substring(0, file.name.lastIndexOf('.'))
            .replace(/[^a-zA-Z0-9_.-]/g, '_'); // sanitize filename characters
        const fileExt = file.name.split('.').pop() || 'pdf';
        const uniqueId = `${cleanName}_${Date.now()}`;
        const publicId = isPdf ? `${uniqueId}.${fileExt}` : uniqueId;

        // Upload to Cloudinary using a Promise stream upload
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: isPdf ? 'raw' : 'image', // raw for PDFs to bypass delivery restriction, image for images
                    folder: 'house_calculator',
                    public_id: publicId,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });



        const uploadResult = result as any;

        return NextResponse.json({
            success: true,
            file: {
                originalName: file.name,
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                format: uploadResult.format || file.name.split('.').pop(),
                bytes: uploadResult.bytes || file.size,
            },
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

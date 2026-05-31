import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Folder from '@/models/Folder';
import DocumentModel from '@/models/Document';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Build the breadcrumb path upwards
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    try {
        const ancestors: any[] = [];
        let currentFolder = await Folder.findById(params.id);
        
        while (currentFolder) {
            ancestors.unshift(currentFolder); // prepend to get root-first ordering
            if (currentFolder.parentFolderId) {
                currentFolder = await Folder.findById(currentFolder.parentFolderId);
            } else {
                currentFolder = null;
            }
        }

        return NextResponse.json({ success: true, data: ancestors });
    } catch (error: any) {
        console.error('Fetch folder ancestors error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Helper to recursively delete subfolders and documents
async function deleteFolderRecursively(folderId: string) {
    // 1. Find and delete all documents in this folder
    const documents = await DocumentModel.find({ folderId });
    for (const doc of documents) {
        const isPdf = doc.format?.toLowerCase() === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');
        try {
            await cloudinary.uploader.destroy(doc.publicId, {
                resource_type: isPdf ? 'raw' : 'image'
            });
            await cloudinary.uploader.destroy(doc.publicId, {
                resource_type: 'raw'
            });
        } catch (cloudinaryErr) {
            console.warn('Failed to delete asset from Cloudinary:', cloudinaryErr);
        }
        await DocumentModel.findByIdAndDelete(doc._id);
    }

    // 2. Find child folders and delete them recursively
    const childFolders = await Folder.find({ parentFolderId: folderId });
    for (const child of childFolders) {
        await deleteFolderRecursively(child._id as string);
    }

    // 3. Delete this folder itself
    await Folder.findByIdAndDelete(folderId);
}

// DELETE: Cascading directory deletion
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const params = await props.params;
    try {
        await deleteFolderRecursively(params.id);
        return NextResponse.json({ success: true, message: 'Folder and all its contents deleted successfully' });
    } catch (error: any) {
        console.error('Delete folder recursively error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

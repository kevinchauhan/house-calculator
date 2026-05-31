import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocument extends Document {
    name: string;
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
    folderId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        format: { type: String },
        bytes: { type: Number },
        folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    },
    { timestamps: true }
);

// Indexes for faster lookups
DocumentSchema.index({ folderId: 1 });
DocumentSchema.index({ name: 'text' }); // Allow text search over filenames

const DocumentModel: Model<IDocument> =
    mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;

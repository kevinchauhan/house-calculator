import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
    name: string;
    parentFolderId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    },
    { timestamps: true }
);

// Register index for faster directory tree listing
FolderSchema.index({ parentFolderId: 1 });

const Folder: Model<IFolder> =
    mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;

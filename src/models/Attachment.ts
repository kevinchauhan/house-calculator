import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment extends Document {
    originalName: string;
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
    expenseId?: mongoose.Types.ObjectId;
    paymentId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSchema: Schema = new Schema(
    {
        originalName: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        format: { type: String },
        bytes: { type: Number },
        expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    },
    { timestamps: true }
);

// Register indexes for faster queries
AttachmentSchema.index({ expenseId: 1 });
AttachmentSchema.index({ paymentId: 1 });

const Attachment: Model<IAttachment> =
    mongoose.models.Attachment || mongoose.model<IAttachment>('Attachment', AttachmentSchema);

export default Attachment;

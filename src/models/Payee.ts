import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayee extends Document {
    name: string;
    type: 'contractor' | 'govt' | 'utility' | 'supplier' | 'individual';
    phone?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PayeeSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ['contractor', 'govt', 'utility', 'supplier', 'individual'],
            required: true,
            default: 'individual',
        },
        phone: { type: String },
        notes: { type: String },
    },
    { timestamps: true }
);

const Payee: Model<IPayee> =
    mongoose.models.Payee || mongoose.model<IPayee>('Payee', PayeeSchema);

export default Payee;

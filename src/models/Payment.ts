import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    expenseId: mongoose.Types.ObjectId;
    payeeId: mongoose.Types.ObjectId;
    amount: number;
    paymentDate: Date;
    paymentMode: 'cash' | 'upi' | 'bank' | 'cheque';
    receiptNumber: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
    {
        expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true },
        payeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payee', required: true },
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        paymentMode: {
            type: String,
            enum: ['cash', 'upi', 'bank', 'cheque'],
            required: true,
            default: 'cash',
        },
        receiptNumber: { type: String, unique: true, required: true },
        notes: { type: String },
    },
    { timestamps: true }
);

const Payment: Model<IPayment> =
    mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

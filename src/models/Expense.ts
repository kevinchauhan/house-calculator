import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    title: string;
    category: string;
    estimatedAmount?: number;
    payeeId: mongoose.Types.ObjectId;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        category: { type: String, required: true }, // User defined or dropdown
        estimatedAmount: { type: Number },
        payeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payee', required: true },
        description: { type: String },
    },
    { timestamps: true }
);

const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;

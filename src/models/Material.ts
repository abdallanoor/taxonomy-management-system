import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    title: {
      type: String,
      required: [true, 'عنوان المادة مطلوب'],
      trim: true,
      maxlength: [200, 'العنوان لا يمكن أن يتجاوز 200 حرف'],
    },
    author: {
      type: String,
      required: [true, 'اسم المؤلف مطلوب'],
      trim: true,
      maxlength: [100, 'اسم المؤلف لا يمكن أن يتجاوز 100 حرف'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
MaterialSchema.index({ title: 'text', author: 'text' });

const Material: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;

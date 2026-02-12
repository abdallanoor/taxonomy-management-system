import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISegment extends Document {
  _id: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  content: string;
  pageNumber: number;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'المادة مطلوبة'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'محتوى الفقرة مطلوب'],
      trim: true,
    },
    pageNumber: {
      type: Number,
      required: [true, 'رقم الصفحة مطلوب'],
      min: [1, 'رقم الصفحة يجب أن يكون 1 أو أكثر'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false, // Optional for draft mode
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
SegmentSchema.index({ materialId: 1, pageNumber: 1 });
SegmentSchema.index({ categoryId: 1, createdAt: -1 });
SegmentSchema.index({ content: 'text' });


const Segment: Model<ISegment> =
  mongoose.models.Segment || mongoose.model<ISegment>('Segment', SegmentSchema);

export default Segment;

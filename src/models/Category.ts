import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  level?: number; // Optional: cache the level for easier querying
  createdAt: Date;
  updatedAt: Date;
}

// Plain object for tree structure (not a Document)
export interface ICategoryWithChildren {
  _id: mongoose.Types.ObjectId;
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  children?: ICategoryWithChildren[];
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'اسم التصنيف مطلوب'],
      trim: true,
      maxlength: [100, 'اسم التصنيف لا يمكن أن يتجاوز 100 حرف'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to check depth
CategorySchema.pre('save', async function () {
  if (this.isModified('parentId') && this.parentId) {
    const CategoryModel = this.constructor as ICategoryModel;
    const parentPath = await CategoryModel.getCategoryPath(this.parentId);
    
    // If parent is already at level 6 (or more), adding a child would make it level 7+
    if (parentPath.length >= 6) {
      throw new Error('لا يمكن إضافة تصنيف فرعي. الحد الأقصى للمستويات هو 6.');
    }
  }
});

// Virtual populate for children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Index for parent-child queries
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ name: 'text' });

// Static method to get category path (breadcrumb)
CategorySchema.statics.getCategoryPath = async function (
  categoryId: mongoose.Types.ObjectId
): Promise<ICategory[]> {
  const path: ICategory[] = [];
  let currentId: mongoose.Types.ObjectId | null = categoryId;

  while (currentId) {
    const category: ICategory | null = await this.findById(currentId);
    if (!category) break;
    path.unshift(category);
    currentId = category.parentId;
  }

  return path;
};

// Static method to build tree structure
CategorySchema.statics.buildTree = async function (): Promise<ICategoryWithChildren[]> {
  const categories = (await this.find().lean()) as ICategoryWithChildren[];
  const categoryMap = new Map<string, ICategoryWithChildren>();
  const rootCategories: ICategoryWithChildren[] = [];

  // First pass: create map
  for (const cat of categories) {
    categoryMap.set(cat._id.toString(), { ...cat, children: [] });
  }

  // Second pass: build tree
  for (const cat of categories) {
    const category = categoryMap.get(cat._id.toString())!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId.toString());
      if (parent) {
        parent.children!.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  }

  return rootCategories;
};

export interface ICategoryModel extends Model<ICategory> {
  getCategoryPath(categoryId: mongoose.Types.ObjectId): Promise<ICategory[]>;
  buildTree(): Promise<ICategoryWithChildren[]>;
}

const Category: ICategoryModel =
  (mongoose.models.Category as ICategoryModel) ||
  mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema);

export default Category;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password?: string; // Optional because we might exclude it in queries
  isAdmin: boolean;
  canEditCategories: boolean;
  assignedMaterials: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "اسم المستخدم مطلوب"],
      unique: true,
      trim: true,
      minlength: [3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"],
    },
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    canEditCategories: {
      type: Boolean,
      default: false,
    },
    assignedMaterials: [
      {
        type: Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

import dbConnect from "./mongodb";
import mongoose from "mongoose";
import { Material, Category, Segment } from "@/models";
import type { ICategory, ICategoryWithChildren } from "@/models/Category";
import type { IMaterial } from "@/models/Material";

// Types for serialized data (no mongoose Documents)
export interface MaterialData {
  _id: string;
  title: string;
  author: string;
  createdAt: string;
}

export interface CategoryData {
  _id: string;
  name: string;
  parentId: string | null;
}

export interface CategoryTreeData {
  _id: string;
  name: string;
  parentId: string | null;
  children?: CategoryTreeData[];
}

export interface SegmentData {
  _id: string;
  materialId: { _id: string; title: string };
  content: string;
  pageNumber: number;
  categoryId: { _id: string; name: string };
  createdAt: string;
}

export interface PreviewSegmentData {
  _id: string;
  content: string;
  pageNumber: number;
  categoryPath: string[];
  categoryName: string;
  categoryId: string | null;
}

// Helper to serialize MongoDB documents
function serializeDoc<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

/**
 * Get all materials
 */
export async function getMaterials(): Promise<MaterialData[]> {
  await dbConnect();
  const materials = await Material.find().sort({ createdAt: -1 }).lean();
  return serializeDoc<MaterialData[]>(materials);
}

/**
 * Get flat list of all categories
 */
export async function getCategories(): Promise<CategoryData[]> {
  await dbConnect();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return serializeDoc<CategoryData[]>(categories);
}

/**
 * Get categories as tree structure
 */
export async function getCategoriesTree(): Promise<CategoryTreeData[]> {
  await dbConnect();
  const tree = await (Category as typeof Category & { buildTree: () => Promise<ICategoryWithChildren[]> }).buildTree();
  return serializeDoc<CategoryTreeData[]>(tree);
}

/**
 * Get recent segments with populated references
 */
export async function getRecentSegments(limit: number = 10): Promise<SegmentData[]> {
  await dbConnect();
  const segments = await Segment.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("materialId", "title")
    .populate("categoryId", "name")
    .lean();
  return serializeDoc<SegmentData[]>(segments);
}

/**
 * Get a material and its segments with full category ancestry
 */
export async function getMaterialWithSegments(id: string) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const material = await Material.findById(id).lean();
  if (!material) {
    return null;
  }

  // Fetch segments with category ancestry
  const segments = await Segment.aggregate([
    {
      $match: {
        materialId: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $sort: { pageNumber: 1, createdAt: 1 },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$category.parentId",
        connectFromField: "parentId",
        connectToField: "_id",
        as: "ancestors",
      },
    },
  ]);

  // Process segments to build the category path
  const processedSegments = segments.map((segment) => {
    const categoryPath: string[] = [];

    if (segment.category) {
      const allNodes: ICategory[] = [
        segment.category,
        ...(segment.ancestors || []),
      ];
      const nodeMap = new Map<string, ICategory>();
      allNodes.forEach((n: ICategory) => nodeMap.set(n._id.toString(), n));

      const path: ICategory[] = [];
      let current: ICategory | undefined = segment.category;
      while (current) {
        path.unshift(current);
        if (current.parentId) {
          current = nodeMap.get(current.parentId.toString());
        } else {
          current = undefined;
        }
      }

      for (let i = 0; i < 6; i++) {
        categoryPath.push(path[i]?.name || "");
      }
    }

    return {
      _id: segment._id.toString(),
      content: segment.content,
      pageNumber: segment.pageNumber,
      categoryPath,
      categoryName: segment.category?.name || "",
      categoryId: segment.categoryId ? segment.categoryId.toString() : null,
    };
  });

  const mat = material as IMaterial & { _id: mongoose.Types.ObjectId };

  return serializeDoc<{
    material: MaterialData;
    segments: PreviewSegmentData[];
  }>({
    material: {
      _id: mat._id.toString(),
      title: mat.title,
      author: mat.author,
      createdAt: mat.createdAt ? mat.createdAt.toISOString() : new Date().toISOString(),
    },
    segments: processedSegments,
  });
}

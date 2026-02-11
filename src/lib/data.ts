import dbConnect from "./mongodb";
import { Material, Category, Segment } from "@/models";
import type { ICategoryWithChildren } from "@/models/Category";

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

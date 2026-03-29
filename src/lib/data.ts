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
/**
 * Get all materials (optionally filtered)
 */
export async function getMaterials(query: Record<string, unknown> = {}): Promise<MaterialData[]> {
  await dbConnect();
  // Ensure we lean() to get plain POJOs
  const materials = await Material.find(query).sort({ createdAt: -1 }).lean();
  
  // Serialize because MongoDB ObjectIDs and Dates need to be strings for Server Components -> Client Components
  return JSON.parse(JSON.stringify(materials));
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
export async function getMaterialWithSegments(
  id: string,
  options?: { page?: number; limit?: number; search?: string; searchMode?: "text" | "page" | "all" }
) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const material = await Material.findById(id).lean();
  if (!material) {
    return null;
  }

  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const search = options?.search?.trim() || "";
  const searchMode = options?.searchMode || "all";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchStage: any = {
    materialId: new mongoose.Types.ObjectId(id),
  };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchNumber = Number(search);

    if (searchMode === "page") {
      // Search only by page number
      if (!isNaN(searchNumber)) {
        matchStage.pageNumber = searchNumber;
      }
      // if not a number, return no results
      else {
        matchStage.pageNumber = -1;
      }
    } else if (searchMode === "text") {
      // Search only in content text
      matchStage.content = { $regex: escapedSearch, $options: "i" };
    } else {
      // "all" mode: search in both text and page number (original behavior)
      if (!isNaN(searchNumber)) {
        matchStage.$or = [
          { content: { $regex: escapedSearch, $options: "i" } },
          { pageNumber: searchNumber },
        ];
      } else {
        matchStage.content = { $regex: escapedSearch, $options: "i" };
      }
    }
  }

  const totalCountResult = await Segment.aggregate([
    { $match: matchStage },
    { $count: "total" }
  ]);
  const totalSegments = totalCountResult[0]?.total || 0;

  // Fetch segments with category ancestry
  const segments = await Segment.aggregate([
    {
      $match: matchStage,
    },
    {
      $addFields: {
        effectiveOrder: {
          $cond: {
            if: { $eq: ["$order", null] },
            then: { $toLong: "$createdAt" },
            else: "$order",
          },
        },
      },
    },
    {
      $sort: { pageNumber: 1, effectiveOrder: 1 },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
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
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>({
    material: {
      _id: mat._id.toString(),
      title: mat.title,
      author: mat.author,
      createdAt: mat.createdAt ? mat.createdAt.toISOString() : new Date().toISOString(),
    },
    segments: processedSegments,
    pagination: {
      total: totalSegments,
      page,
      limit,
      totalPages: Math.ceil(totalSegments / limit),
    },
  });
}

export interface UserData {
  _id: string;
  username: string;
  isAdmin: boolean;
  canEditCategories: boolean;
  assignedMaterials: string[];
  createdAt: string;
}

/**
 * Get all users
 */
export async function getUsers(): Promise<UserData[]> {
  await dbConnect();
  // We need to fetch users and manually map them because assignedMaterials are ObjectIds in DB
  // but we want them as strings in our UserData interface for the client.
  // We also need to be careful about not leaking passwords, even though our interface doesn't have it.
  const users = await import("@/models/User").then((mod) =>
    mod.default.find().sort({ createdAt: -1 }).lean()
  );

  return JSON.parse(JSON.stringify(users));
}

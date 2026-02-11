import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Segment, Material } from '@/models';
import type { ICategory } from '@/models';

// GET - Fetch all segments for a material with full category ancestry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Verify material exists
    const material = await Material.findById(materialId).lean();
    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    // Fetch segments with category ancestry, sorted by orderIndex then pageNumber
    const segments = await Segment.aggregate([
      {
        $match: {
          materialId: new mongoose.Types.ObjectId(materialId),
        },
      },
      {
        $sort: { orderIndex: 1, createdAt: 1 },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $graphLookup: {
          from: 'categories',
          startWith: '$category.parentId',
          connectFromField: 'parentId',
          connectToField: '_id',
          as: 'ancestors',
        },
      },
    ]);

    // Process each segment to build flattened category path
    const processedSegments = segments.map((segment) => {
      const categoryPath: string[] = [];

      if (segment.category) {
        const allNodes: ICategory[] = [segment.category, ...(segment.ancestors || [])];
        const nodeMap = new Map<string, ICategory>();
        allNodes.forEach((n: ICategory) => nodeMap.set(n._id.toString(), n));

        // Walk from leaf to root
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

        // Fill category levels
        for (let i = 0; i < 6; i++) {
          categoryPath.push(path[i]?.name || '');
        }
      }

      return {
        _id: segment._id.toString(),
        content: segment.content,
        pageNumber: segment.pageNumber,
        orderIndex: segment.orderIndex,
        categoryPath,
        categoryName: segment.category?.name || '',
        categoryId: segment.categoryId ? segment.categoryId.toString() : null,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = material as any;

    return NextResponse.json({
      success: true,
      data: {
        material: {
          _id: mat._id,
          title: mat.title,
          author: mat.author,
        },
        segments: processedSegments,
      },
    });
  } catch (error) {
    console.error('Error fetching material segments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الفقرات' },
      { status: 500 }
    );
  }
}

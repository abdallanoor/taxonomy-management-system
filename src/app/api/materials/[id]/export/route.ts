import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Segment, Material, ICategory } from '@/models';
import ExcelJS from 'exceljs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    await dbConnect();

    // 1. Fetch Material details
    const material = await Material.findById(materialId);
    if (!material) {
      return NextResponse.json(
        { error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    // 2. Fetch Segments with Category Ancestry
    // We use aggregation to look up the category and all its ancestors
    const segments = await Segment.aggregate([
      { 
        $match: { 
          materialId: new mongoose.Types.ObjectId(materialId) 
        } 
      },
      {
        $sort: { orderIndex: 1, pageNumber: 1 } as Record<string, 1 | -1>,
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      // GraphLookup to find all ancestors
      {
        $graphLookup: {
          from: 'categories',
          startWith: '$category.parentId',
          connectFromField: 'parentId',
          connectToField: '_id',
          as: 'ancestors'
        }
      }
    ]);

    // 3. Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Segments');

    // Set RTL view
    worksheet.views = [{ rightToLeft: true }];

    // Define Columns with Arabic Headers but standard widths
    worksheet.columns = [
      { header: 'معرف السجل', key: 'recordId' }, // removed width
      { header: 'نص الفقرة', key: 'paragraphText' }, // removed width
      { header: 'رقم الصفحة', key: 'pageNumber' }, // removed width
      { header: 'التصنيف 1', key: 'l1' },
      { header: 'التصنيف 2', key: 'l2' },
      { header: 'التصنيف 3', key: 'l3' },
      { header: 'التصنيف 4', key: 'l4' },
      { header: 'التصنيف 5', key: 'l5' },
      { header: 'التصنيف 6', key: 'l6' },
    ];

    // Enable text wrapping for all columns so content is fully visible
    worksheet.columns.forEach(column => {
      column.alignment = { wrapText: true, vertical: 'top', horizontal: 'right' };
      // Optional: Set a reasonable min width so it's not too cramped
      column.width = 20; 
    });
    // Give paragraph text more space
    worksheet.getColumn('paragraphText').width = 80;

    // 4. Process Data & Populate Rows
    segments.forEach((segment, index) => {
      const row: Record<string, string | number> = {
        recordId: index + 1, // Simple sequential ID
        paragraphText: segment.content,
        pageNumber: segment.pageNumber,
        l1: '',
        l2: '',
        l3: '',
        l4: '',
        l5: '',
        l6: '',
      };

      if (segment.category) {
        // Construct the full path: [...ancestors_sorted, current_category]
        const allNodes: ICategory[] = [segment.category, ...(segment.ancestors || [])];
        const nodeMap = new Map<string, ICategory>();
        allNodes.forEach(n => nodeMap.set(n._id.toString(), n));

        // Iterate from leaf upwards to root
        const path: ICategory[] = [];
        let current = segment.category;
        while (current) {
          path.unshift(current);
          if (current.parentId) {
            current = nodeMap.get(current.parentId.toString());
          } else {
            current = null;
          }
        }
        
        // Now map path to columns
        if (path.length > 0) row.l1 = path[0].name;
        if (path.length > 1) row.l2 = path[1].name;
        if (path.length > 2) row.l3 = path[2].name;
        if (path.length > 3) row.l4 = path[3].name;
        if (path.length > 4) row.l5 = path[4].name;
        if (path.length > 5) row.l6 = path[5].name;
      }

      worksheet.addRow(row);
    });

    // 5. Generate Buffer and Return
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Sanitize filename
    const safeTitle = material.title.replace(/[^a-z0-9\u0600-\u06FF]/gi, '_');
    const filename = `${safeTitle}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير الملف' },
      { status: 500 }
    );
  }
}

"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download01Icon,
  Edit02Icon,
  Delete02Icon,
  AddToListIcon,
  Loading03Icon,
  Search01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";

import { SegmentForm, SegmentFormData } from "@/components/forms/SegmentForm";
import { useSegments } from "@/hooks/useSegments";
import { useCategoriesTreeQuery } from "@/hooks/useCategories";
import { useMaterialPreview, type SearchMode } from "@/hooks/useMaterials";
import { exportMaterialToExcel } from "@/lib/export";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface Segment {
  _id: string;
  content: string;
  pageNumber: number;
  categoryPath: string[];
  categoryName: string;
  categoryId: string | null;
}

interface PreviewClientProps {
  materialId: string;
  initialPage?: number;
  initialSearch?: string;
}

// Expandable Content Cell Component
function ExpandableContent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const shouldTruncate = content && content.length > 80;
  const displayContent =
    shouldTruncate && !isExpanded ? content.slice(0, 80) + "..." : content;

  return (
    <div className="min-w-[300px] max-w-[500px] text-xs whitespace-pre-wrap leading-relaxed py-4">
      {displayContent}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary text-sm ms-1 font-medium hover:underline focus:outline-none"
        >
          {isExpanded ? "عرض أقل" : "المزيد"}
        </button>
      )}
    </div>
  );
}

export function PreviewClient({
  materialId,
  initialPage = 1,
  initialSearch = "",
}: PreviewClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialUrlPage = Number(searchParams.get("page")) || initialPage;
  const initialUrlSearch = searchParams.get("q") || initialSearch;

  const [page, setPage] = React.useState(initialUrlPage);
  const [searchQuery, setSearchQuery] = React.useState(initialUrlSearch);
  const [inputValue, setInputValue] = React.useState(initialUrlSearch);
  const [searchMode, setSearchMode] = React.useState<SearchMode>("all");

  // Client side fetch hooks
  const { data, isLoading, isPlaceholderData } = useMaterialPreview(
    materialId,
    page,
    searchQuery,
    searchMode,
  );
  const { data: categories = [] } = useCategoriesTreeQuery();

  const material = data?.material;
  const segments = (data?.segments || []) as Segment[];
  const currentPagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  };

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    params.set("page", page.toString());

    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }, [page, searchQuery, pathname]);

  const handleClearSearch = () => {
    setInputValue("");
    setSearchQuery("");
    setPage(1);
  };

  const handleModeChange = (newMode: SearchMode) => {
    setSearchMode(newMode);
    setInputValue("");
    setSearchQuery("");
    setPage(1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClearSearch();
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Enter") {
      handleSearchNow();
    }
  };

  // Fires search (used by button + Enter key), with all edge-case guards
  const handleSearchNow = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      handleClearSearch();
      return;
    }
    if (searchMode === "page") {
      const n = Number(trimmed);
      if (isNaN(n) || n < 1 || !Number.isInteger(n)) return;
      // if (currentPagination.totalPages > 0 && n > currentPagination.totalPages)
      //   return;
    }
    if (trimmed === searchQuery) return;
    setSearchQuery(trimmed);
    setPage(1);
  };

  const navigateToPage = (e: React.MouseEvent, newPage: number) => {
    e.preventDefault();
    if (newPage < 1 || newPage > currentPagination.totalPages) return;
    setPage(newPage);
  };

  const {
    createSegment,
    updateSegment,
    deleteSegment,
    reorderSegments,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
  } = useSegments({
    materialId,
  });

  const [exporting, setExporting] = React.useState(false);
  const [editingSegment, setEditingSegment] = React.useState<Segment | null>(
    null,
  );
  const [deletingSegment, setDeletingSegment] = React.useState<Segment | null>(
    null,
  );
  const [activeReorder, setActiveReorder] = React.useState<string | null>(null);

  const columnHelper = createColumnHelper<Segment>();

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: "#",
        cell: (info) => {
          const index = info.row.index;
          return (
            <span className="font-medium text-muted-foreground">
              {(currentPagination.page - 1) * currentPagination.limit +
                index +
                1}
            </span>
          );
        },
      }),
      columnHelper.accessor("content", {
        header: "النص",
        cell: (info) => <ExpandableContent content={info.getValue()} />,
      }),
      columnHelper.accessor("pageNumber", {
        header: () => <div className="text-center w-[120px]">ص</div>,
        cell: (info) => {
          const segment = info.row.original;
          const samePage = segments.filter(
            (s) => s.pageNumber === segment.pageNumber,
          );
          const posInPage = samePage.findIndex((s) => s._id === segment._id);
          const isFirstInPage = posInPage === 0;
          const isLastInPage = posInPage === samePage.length - 1;
          const isSingleInPage = samePage.length === 1;

          const neighborAbove = !isFirstInPage ? samePage[posInPage - 1] : null;
          const neighborBelow = !isLastInPage ? samePage[posInPage + 1] : null;

          return (
            <div className="flex items-center justify-center gap-1 font-bold text-primary">
              {!isSingleInPage && !isFirstInPage ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (neighborAbove && !isReordering && !isDeleting) {
                      setActiveReorder(`${segment._id}-up`);
                      reorderSegments(segment._id, neighborAbove._id);
                    }
                  }}
                  disabled={isReordering || isDeleting}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="تحريك لأعلى"
                >
                  {isReordering && activeReorder === `${segment._id}-up` ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}

              <span>{info.getValue()}</span>

              {!isSingleInPage && !isLastInPage ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (neighborBelow && !isReordering && !isDeleting) {
                      setActiveReorder(`${segment._id}-down`);
                      reorderSegments(segment._id, neighborBelow._id);
                    }
                  }}
                  disabled={isReordering || isDeleting}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="تحريك لأسفل"
                >
                  {isReordering && activeReorder === `${segment._id}-down` ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
            </div>
          );
        },
      }),
      ...[0, 1, 2, 3, 4, 5].map((level) =>
        columnHelper.accessor((row) => row.categoryPath?.[level], {
          id: `level_${level}`,
          header: `مستوى ${level + 1}`,
          cell: (info) => (
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {info.getValue() || "-"}
            </span>
          ),
        }),
      ),
      columnHelper.display({
        id: "actions",
        header: "إجراءات",
        cell: (info) => {
          const segment = info.row.original;
          const isEditing = editingSegment?._id === segment._id;

          return (
            <div className="flex items-center gap-1 w-[80px]">
              {/* Edit */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingSegment(segment);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`h-8 w-8 ${
                  isEditing ? "text-primary bg-primary/10" : ""
                }`}
                title="تعديل"
              >
                <HugeiconsIcon icon={Edit02Icon} size={16} />
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingSegment(segment)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="حذف"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </Button>
            </div>
          );
        },
      }),
    ],
    [
      currentPagination.page,
      currentPagination.limit,
      editingSegment,
      columnHelper,
      segments,
      isReordering,
      isDeleting,
      reorderSegments,
      activeReorder,
    ],
  );

  const table = useReactTable({
    data: segments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: currentPagination.totalPages,
  });

  const handleFormSubmit = async (formData: SegmentFormData) => {
    if (editingSegment) {
      const updated = await updateSegment(editingSegment._id, {
        content: formData.content,
        pageNumber: parseInt(formData.pageNumber),
        categoryId: formData.categoryId || null,
      });

      if (updated) {
        setEditingSegment(null);
        return true;
      }
      return false;
    } else {
      const resp = await createSegment({
        materialId,
        pageNumber: parseInt(formData.pageNumber),
        content: formData.content,
        categoryId: formData.categoryId || null,
      });

      if (resp) {
        return true;
      }
      return false;
    }
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deletingSegment) return;

    const success = await deleteSegment(deletingSegment._id);

    if (success) {
      setDeletingSegment(null);
      if (editingSegment?._id === deletingSegment._id) {
        setEditingSegment(null);
      }
    }
  };

  const handleExport = async () => {
    if (!material) return;
    setExporting(true);
    await exportMaterialToExcel(material._id, material.title);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="min-h-[64px] flex items-center">
        {isLoading && !material ? (
          <div className="space-y-2 w-full">
            <Skeleton className="h-7 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ) : material ? (
          <div>
            <h2 className="text-xl font-semibold">{material.title}</h2>
            <p className="text-sm text-muted-foreground">{material.author}</p>
          </div>
        ) : (
          <div className="text-destructive font-semibold">
            فشل تحميل بيانات المادة.
          </div>
        )}
      </div>

      {/* Inline Form Card */}
      <Card className="max-w-full w-xl wrap-break-word">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={AddToListIcon} size={22} />
            {editingSegment ? "تعديل الفقرة" : "إضافة فقرة جديدة"}
          </CardTitle>
          <CardDescription>
            {editingSegment
              ? "قم بتعديل بيانات الفقرة أدناه"
              : "أدخل بيانات الفقرة وحدد التصنيف المناسب"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SegmentForm
            categories={categories}
            onSubmit={handleFormSubmit}
            isSubmitting={isCreating || isUpdating}
            mode={editingSegment ? "edit" : "create"}
            onCancel={editingSegment ? handleCancelEdit : undefined}
            defaultValues={{
              materialId: materialId,
              pageNumber: editingSegment
                ? editingSegment.pageNumber.toString()
                : "",
              content: editingSegment ? editingSegment.content : "",
              categoryId: editingSegment
                ? editingSegment.categoryId || null
                : null,
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-center flex-wrap justify-between gap-4 mb-4">
        {/* Search */}
        <div className="flex flex-col gap-2 max-w-md w-full">
          {/* Mode selector tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-2xl p-1 w-fit">
            {(
              [
                { value: "all", label: "الكل" },
                { value: "text", label: "النص" },
                { value: "page", label: "رقم الصفحة" },
              ] as { value: SearchMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={`px-3 py-1 rounded-2xl text-xs font-medium transition-all ${
                  searchMode === mode.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Search input + button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <HugeiconsIcon icon={Search01Icon} size={15} />
              </span>

              <Input
                type={searchMode === "page" ? "number" : "text"}
                min={searchMode === "page" ? 1 : undefined}
                placeholder={
                  searchMode === "page"
                    ? "أدخل رقم الصفحة..."
                    : searchMode === "text"
                      ? "ابحث في نص الفقرة..."
                      : "ابحث في النص أو رقم الصفحة..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="pe-9 ps-9 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Clear button inside input (end) */}
              {inputValue && (
                <button
                  onClick={handleClearSearch}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="مسح البحث (Escape)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            <Button
              onClick={handleSearchNow}
              variant="outline"
              size="icon"
              title="بحث (Enter أو الزر)"
              disabled={inputValue.trim() === searchQuery || !inputValue.trim()}
            >
              <HugeiconsIcon icon={Search01Icon} size={18} />
            </Button>
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground min-h-[16px]">
            {searchQuery ? (
              <span>
                {currentPagination.total > 0
                  ? `${currentPagination.total} نتيجة`
                  : "لا توجد نتائج"}
                {searchMode === "page" && ` في صفحة ${searchQuery}`}
                {searchMode === "text" && ` تحتوي على "${searchQuery}"`}
                {searchMode === "all" && ` مطابقة لـ "${searchQuery}"`}
                {" — "}
                <button
                  onClick={handleClearSearch}
                  className="text-primary hover:underline"
                >
                  مسح
                </button>
              </span>
            ) : (
              <span className="opacity-0">placeholder</span>
            )}
            <span className="text-muted-foreground/60 text-[11px]">
              Esc لمسح البحث
            </span>
          </div>
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting || !material}
            variant="secondary"
          >
            {exporting ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                size={18}
                className="animate-spin animation-duration-[2s]"
              />
            ) : (
              <HugeiconsIcon icon={Download01Icon} size={18} />
            )}
            <span>تصدير Excel</span>
          </Button>
        </div>
      </div>

      <div
        className={
          isPlaceholderData || isLoading
            ? "opacity-50 pointer-events-none transition-opacity duration-200"
            : "transition-opacity duration-200"
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  let widthClass = "";
                  if (header.column.id === "index") widthClass = "w-[40px]";
                  if (header.column.id === "content")
                    widthClass = "min-w-[300px]";
                  if (header.column.id === "pageNumber")
                    widthClass = "w-[120px] text-center";
                  if (header.column.id.startsWith("level_"))
                    widthClass = "w-[140px] min-w-[140px]";
                  if (header.column.id === "actions") widthClass = "w-[80px]";

                  return (
                    <TableHead key={header.id} className={widthClass}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {table.getAllColumns().map((column) => (
                    <TableCell key={column.id}>
                      {column.id === "content" ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      ) : column.id === "actions" ? (
                        <div className="flex items-center gap-1 w-[100px]">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      ) : column.id === "index" ||
                        column.id === "pageNumber" ? (
                        <Skeleton className="h-4 w-8 mx-auto" />
                      ) : (
                        <Skeleton className="h-4 w-full min-w-[80px]" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    editingSegment?._id === row.original._id
                      ? "bg-muted/50"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  لا توجد فقرات للبحث أو المادة.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {currentPagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => navigateToPage(e, currentPagination.page - 1)}
                  className={
                    currentPagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  text="السابق"
                />
              </PaginationItem>

              {(() => {
                const pages: (number | string)[] = [];
                const maxPages = currentPagination.totalPages;
                const current = currentPagination.page;

                if (maxPages <= 7) {
                  for (let i = 1; i <= maxPages; i++) pages.push(i);
                } else {
                  if (current <= 4) {
                    pages.push(1, 2, 3, 4, 5, "ellipsis", maxPages);
                  } else if (current >= maxPages - 3) {
                    pages.push(
                      1,
                      "ellipsis",
                      maxPages - 4,
                      maxPages - 3,
                      maxPages - 2,
                      maxPages - 1,
                      maxPages,
                    );
                  } else {
                    pages.push(
                      1,
                      "ellipsis",
                      current - 1,
                      current,
                      current + 1,
                      "ellipsis",
                      maxPages,
                    );
                  }
                }

                return pages.map((page, idx) => {
                  if (page === "ellipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={current === page}
                        onClick={(e) => navigateToPage(e, page as number)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => navigateToPage(e, currentPagination.page + 1)}
                  className={
                    currentPagination.page >= currentPagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  text="التالي"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Page jump input */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>صفحة</span>
            <input
              type="number"
              min={1}
              max={currentPagination.totalPages}
              defaultValue={currentPagination.page}
              key={currentPagination.page}
              className="w-14 h-8 rounded-2xl border border-input bg-background px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (
                    !isNaN(val) &&
                    val >= 1 &&
                    val <= currentPagination.totalPages
                  ) {
                    setPage(val);
                  } else {
                    (e.target as HTMLInputElement).value =
                      currentPagination.page.toString();
                  }
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (
                  !isNaN(val) &&
                  val >= 1 &&
                  val <= currentPagination.totalPages
                ) {
                  setPage(val);
                } else {
                  e.target.value = currentPagination.page.toString();
                }
              }}
            />
            <span>من {currentPagination.totalPages}</span>
          </div>
        </div>
      )}

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!deletingSegment}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingSegment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفقرة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفقرة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

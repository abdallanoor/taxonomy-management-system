"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DuplicateRow {
  rowNumber: number;
  content: string;
  pageNumber: number;
}

interface InvalidRow {
  rowNumber: number;
  reason: string;
}

interface Analysis {
  summary: {
    totalRows: number;
    newRows: number;
    duplicateRows: number;
    invalidRows: number;
  };
  duplicateRows: DuplicateRow[];
  invalidRows: InvalidRow[];
  fingerprint: string;
}

interface ImportResult {
  added: number;
  skippedDuplicates: number;
  invalidRows: number;
}

const DUPLICATES_PER_PAGE = 50;

export function MaterialImportDialog({
  materialId,
  disabled,
  onImported,
}: {
  materialId: string;
  disabled?: boolean;
  onImported: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = React.useState<
    Set<number>
  >(new Set());
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [duplicatePage, setDuplicatePage] = React.useState(1);

  const reset = React.useCallback(() => {
    setFile(null);
    setAnalysis(null);
    setSelectedDuplicates(new Set());
    setDuplicatePage(1);
  }, []);

  const close = () => {
    if (isAnalyzing || isImporting) return;
    setOpen(false);
    reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) close();
    else setOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setAnalysis(null);
    setSelectedDuplicates(new Set());
    setDuplicatePage(1);
  };

  const analyze = async () => {
    if (!file) {
      toast.error("اختر ملف Excel أولًا");
      return;
    }
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(
        `/api/materials/${materialId}/import/preview`,
        {
          method: "POST",
          body: formData,
        },
      );
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "فشل تحليل الملف");
      setAnalysis(json.data as Analysis);
      setSelectedDuplicates(new Set());
      setDuplicatePage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحليل الملف");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleDuplicate = (rowNumber: number, checked: boolean) => {
    setSelectedDuplicates((current) => {
      const next = new Set(current);
      if (checked) next.add(rowNumber);
      else next.delete(rowNumber);
      return next;
    });
  };

  const commit = async () => {
    if (!file || !analysis) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("fingerprint", analysis.fingerprint);
      formData.set(
        "duplicateRowNumbers",
        JSON.stringify([...selectedDuplicates]),
      );
      const response = await fetch(
        `/api/materials/${materialId}/import/commit`,
        {
          method: "POST",
          body: formData,
        },
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        if (json.code === "STALE_PREVIEW") {
          setAnalysis(null);
          setSelectedDuplicates(new Set());
        }
        throw new Error(json.error || "فشل استيراد الفقرات");
      }

      const result = json.data as ImportResult;
      toast.success(`تمت إضافة ${result.added} فقرة`);
      if (result.skippedDuplicates || result.invalidRows) {
        toast.info(
          `تم تخطي ${result.skippedDuplicates} مكرر و${result.invalidRows} صف غير صالح`,
        );
      }
      onImported();
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "فشل استيراد الفقرات",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const totalDuplicatePages = Math.max(
    1,
    Math.ceil((analysis?.duplicateRows.length ?? 0) / DUPLICATES_PER_PAGE),
  );
  const visibleDuplicates =
    analysis?.duplicateRows.slice(
      (duplicatePage - 1) * DUPLICATES_PER_PAGE,
      duplicatePage * DUPLICATES_PER_PAGE,
    ) ?? [];
  const importableCount =
    (analysis?.summary.newRows ?? 0) + selectedDuplicates.size;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        استيراد Excel
      </Button>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>استيراد فقرات من Excel</DialogTitle>
          <DialogDescription>
            ارفع ملف التصدير نفسه. سنقرأ نص الفقرة ورقم الصفحة فقط، والتصنيف يتم
            لاحقًا من المنصة.
          </DialogDescription>
        </DialogHeader>

        {!analysis ? (
          <>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-4 pe-2">
              <Input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                ملف .xlsx فقط، بحد أقصى 10 MB و10,000 صف.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={isAnalyzing}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={analyze}
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? "جارٍ تحليل الملف..." : "تحليل الملف"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-5 pe-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold">{analysis.summary.totalRows}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الصفوف</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-3">
                  <p className="font-semibold">{analysis.summary.newRows}</p>
                  <p className="text-xs text-muted-foreground">ستُضاف</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <p className="font-semibold">
                    {analysis.summary.duplicateRows}
                  </p>
                  <p className="text-xs text-muted-foreground">مكررة</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="font-semibold">
                    {analysis.summary.invalidRows}
                  </p>
                  <p className="text-xs text-muted-foreground">غير صالحة</p>
                </div>
              </div>

              {analysis.duplicateRows.length > 0 && (
                <section className="space-y-3">
                  <div>
                    <h3 className="font-medium">الفقرات المكررة</h3>
                    <p className="text-xs text-muted-foreground">
                      حدد الفقرات التي تريد إضافتها رغم وجود فقرة مطابقة في
                      المادة.
                    </p>
                  </div>
                  <ScrollArea
                    type="always"
                    className="h-[min(46vh,28rem)] overflow-hidden rounded-lg border **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-scrollbar]:w-2 **:data-[slot=scroll-area-scrollbar]:rounded-full **:data-[slot=scroll-area-scrollbar]:border-0 **:data-[slot=scroll-area-scrollbar]:bg-muted/70 **:data-[slot=scroll-area-thumb]:bg-muted-foreground/35 **:data-[slot=scroll-area-thumb]:hover:bg-muted-foreground/50"
                  >
                    <div className="divide-y pl-3">
                      {visibleDuplicates.map((row) => (
                        <label
                          key={row.rowNumber}
                          className="flex gap-3 px-2 py-3 cursor-pointer hover:bg-muted/50 items-start"
                        >
                          <Checkbox
                            checked={selectedDuplicates.has(row.rowNumber)}
                            onCheckedChange={(checked) =>
                              toggleDuplicate(row.rowNumber, checked === true)
                            }
                            aria-label={`إضافة الصف ${row.rowNumber}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-muted-foreground">
                              صف {row.rowNumber} · صفحة {row.pageNumber}
                            </span>
                            <span className="block whitespace-pre-wrap break-words">
                              {row.content}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                  {totalDuplicatePages > 1 && (
                    <div className="flex justify-between items-center text-sm">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={duplicatePage <= 1}
                        onClick={() => setDuplicatePage((page) => page - 1)}
                      >
                        السابق
                      </Button>
                      <span>
                        صفحة {duplicatePage} من {totalDuplicatePages}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={duplicatePage >= totalDuplicatePages}
                        onClick={() => setDuplicatePage((page) => page + 1)}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {analysis.invalidRows.length > 0 && (
                <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <h3 className="font-medium text-destructive">
                    صفوف لن تُستورد
                  </h3>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {analysis.invalidRows.slice(0, 20).map((row) => (
                      <li key={row.rowNumber}>
                        صف {row.rowNumber}: {row.reason}
                      </li>
                    ))}
                    {analysis.invalidRows.length > 20 && (
                      <li>و{analysis.invalidRows.length - 20} صفًا آخر.</li>
                    )}
                  </ul>
                </section>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setAnalysis(null);
                  setSelectedDuplicates(new Set());
                }}
                disabled={isImporting}
              >
                اختيار ملف آخر
              </Button>
              <Button
                type="button"
                onClick={commit}
                disabled={isImporting || importableCount === 0}
              >
                {isImporting
                  ? "جارٍ الاستيراد..."
                  : `تأكيد استيراد ${importableCount} فقرة`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

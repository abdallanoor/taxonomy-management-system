import crypto from "node:crypto";
import ExcelJS from "exceljs";

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10_000;
const WORKSHEET_NAME = "Segments";
const CONTENT_HEADER = "نص الفقرة";
const PAGE_HEADER = "رقم الصفحة";

export interface ImportRow {
  rowNumber: number;
  content: string;
  pageNumber: number;
}

export interface InvalidImportRow {
  rowNumber: number;
  reason: string;
}

export interface ParsedImportFile {
  validRows: ImportRow[];
  invalidRows: InvalidImportRow[];
  totalRows: number;
}

export interface ExistingSegmentForImport {
  content: string;
  pageNumber: number;
}

export interface ImportDuplicateRow extends ImportRow {
  isDuplicate: true;
}

export interface ImportAnalysis extends ParsedImportFile {
  duplicateRows: ImportDuplicateRow[];
  newRows: ImportRow[];
  fingerprint: string;
}

export class ImportFileError extends Error {}

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("result" in value && value.result !== undefined && value.result !== null) {
    return cellValueToString(value.result as ExcelJS.CellValue);
  }
  if ("text" in value) return value.text;
  return "";
}

function hasAnyValue(row: ExcelJS.Row): boolean {
  let hasValue = false;
  row.eachCell({ includeEmpty: false }, (cell) => {
    if (cellValueToString(cell.value).trim()) hasValue = true;
  });
  return hasValue;
}

function parsePageNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const pageNumber = Number(trimmed);
  return Number.isSafeInteger(pageNumber) && pageNumber >= 1 ? pageNumber : null;
}

export function importRowKey(content: string, pageNumber: number): string {
  return `${pageNumber}\u0000${content.trim()}`;
}

export async function parseMaterialImportFile(file: File): Promise<ParsedImportFile> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new ImportFileError("يُقبل فقط ملف Excel بامتداد .xlsx");
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new ImportFileError("حجم الملف يجب ألا يتجاوز 10 MB");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new ImportFileError("تعذر قراءة ملف Excel. تأكد أنه ملف .xlsx سليم");
  }

  const worksheet = workbook.getWorksheet(WORKSHEET_NAME);
  if (!worksheet) {
    throw new ImportFileError("يجب أن يحتوي الملف على تبويب باسم Segments");
  }

  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headers.set(cellValueToString(cell.value).trim(), columnNumber);
  });

  const contentColumn = headers.get(CONTENT_HEADER);
  const pageColumn = headers.get(PAGE_HEADER);
  if (!contentColumn || !pageColumn) {
    throw new ImportFileError("يجب أن يحتوي الصف الأول على عمودي «نص الفقرة» و«رقم الصفحة»");
  }

  const validRows: ImportRow[] = [];
  const invalidRows: InvalidImportRow[] = [];
  let totalRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!hasAnyValue(row)) continue;

    totalRows += 1;
    if (totalRows > MAX_IMPORT_ROWS) {
      throw new ImportFileError("الملف يحتوي أكثر من 10,000 صف");
    }

    const content = cellValueToString(row.getCell(contentColumn).value).trim();
    const pageNumber = parsePageNumber(cellValueToString(row.getCell(pageColumn).value));

    if (!content && !pageNumber) {
      invalidRows.push({ rowNumber, reason: "نص الفقرة ورقم الصفحة مطلوبان" });
    } else if (!content) {
      invalidRows.push({ rowNumber, reason: "نص الفقرة مطلوب" });
    } else if (!pageNumber) {
      invalidRows.push({ rowNumber, reason: "رقم الصفحة يجب أن يكون عددًا صحيحًا يبدأ من 1" });
    } else {
      validRows.push({ rowNumber, content, pageNumber });
    }
  }

  return { validRows, invalidRows, totalRows };
}

export function analyzeMaterialImport(
  parsed: ParsedImportFile,
  existingSegments: ExistingSegmentForImport[],
): ImportAnalysis {
  const existingKeys = new Set(
    existingSegments.map((segment) => importRowKey(segment.content, segment.pageNumber)),
  );
  const duplicateRows: ImportDuplicateRow[] = [];
  const newRows: ImportRow[] = [];

  for (const row of parsed.validRows) {
    if (existingKeys.has(importRowKey(row.content, row.pageNumber))) {
      duplicateRows.push({ ...row, isDuplicate: true });
    } else {
      newRows.push(row);
    }
  }

  const fingerprintInput = parsed.validRows
    .map((row) => `${row.rowNumber}:${importRowKey(row.content, row.pageNumber)}:${existingKeys.has(importRowKey(row.content, row.pageNumber))}`)
    .join("\n");
  const fingerprint = crypto.createHash("sha256").update(fingerprintInput).digest("hex");

  return { ...parsed, duplicateRows, newRows, fingerprint };
}

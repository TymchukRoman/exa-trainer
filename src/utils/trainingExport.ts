import { downloadDir, join } from "@tauri-apps/api/path";
import { isTauri } from "@tauri-apps/api/core";
import { writeFile } from "@tauri-apps/plugin-fs";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import type { GroupedTrainingByDate } from "../state/AppContext";

export type TrainingExportRow = {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  durationMs?: number;
};

export type TrainingExportResult = {
  path: string;
  filename: string;
  canOpen: boolean;
};

const EXPORT_HEADERS = ["date", "exercise", "reps", "weight", "duration_ms"] as const;

export function buildTrainingExportRows(filteredGroups: GroupedTrainingByDate[]): TrainingExportRow[] {
  const rows: TrainingExportRow[] = [];

  for (const dateGroup of filteredGroups) {
    for (const exerciseGroup of dateGroup.exercises) {
      for (const setItem of exerciseGroup.sets) {
        rows.push({
          date: dateGroup.date,
          exercise: exerciseGroup.exercise,
          reps: setItem.reps,
          weight: setItem.weight,
          durationMs: setItem.durationMs,
        });
      }
    }
  }

  return rows;
}

function buildTrainingWorkbook(rows: TrainingExportRow[]): XLSX.WorkBook {
  const sheetData = rows.map((row) => ({
    date: dayjs(row.date, "YYYY-MM-DD").startOf("day").toDate(),
    exercise: row.exercise,
    reps: row.reps,
    weight: row.weight,
    duration_ms: row.durationMs ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData, { header: [...EXPORT_HEADERS] });

  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    const cell = worksheet[cellAddress];
    if (cell) {
      cell.z = "yyyy-mm-dd";
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Trainings");
  return workbook;
}

function buildTrainingXlsxBytes(rows: TrainingExportRow[]): Uint8Array {
  const workbook = buildTrainingWorkbook(rows);
  return new Uint8Array(XLSX.write(workbook, { bookType: "xlsx", type: "array" }));
}

export async function exportTrainingsToXlsx(
  rows: TrainingExportRow[],
  filename?: string,
): Promise<TrainingExportResult | null> {
  const exportFilename = filename ?? `trainings-export-${dayjs().format("YYYY-MM-DD")}.xlsx`;
  const bytes = buildTrainingXlsxBytes(rows);

  if (isTauri()) {
    const dir = await downloadDir();
    const path = await join(dir, exportFilename);
    await writeFile(path, bytes);
    return { path, filename: exportFilename, canOpen: true };
  }

  const workbook = buildTrainingWorkbook(rows);
  XLSX.writeFile(workbook, exportFilename);
  return { path: exportFilename, filename: exportFilename, canOpen: false };
}

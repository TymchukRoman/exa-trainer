import { openPath } from "@tauri-apps/plugin-opener";
import { useCallback, useState } from "react";
import { toErrorMessage } from "../utils/errors";
import {
  exportTrainingsToXlsx,
  type TrainingExportResult,
  type TrainingExportRow,
} from "../utils/trainingExport";

export function useDataExport(rows: TrainingExportRow[]) {
  const [exportSuccess, setExportSuccess] = useState<TrainingExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const dismissExportFeedback = useCallback(() => {
    setExportSuccess(null);
    setExportError(null);
  }, []);

  const startExport = useCallback(async () => {
    if (rows.length === 0) return;

    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const result = await exportTrainingsToXlsx(rows);
      if (result) {
        setExportSuccess(result);
      }
    } catch (error) {
      setExportError(toErrorMessage(error, "Failed to export trainings."));
    } finally {
      setIsExporting(false);
    }
  }, [rows]);

  const openExportedFile = useCallback(async () => {
    if (!exportSuccess?.canOpen) return;
    await openPath(exportSuccess.path);
  }, [exportSuccess]);

  return {
    startExport,
    exportSuccess,
    exportError,
    isExporting,
    openExportedFile,
    dismissExportFeedback,
  };
}

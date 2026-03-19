import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ThemeMode } from "../api/settings";
import { useAppContext } from "../state/AppContext";

export function SettingsPage() {
  const {
    mongoConnectionUrl,
    themeMode,
    saveMongoConnectionUrl,
    checkMongoConnectionUrl,
    saveThemeMode,
  } = useAppContext();
  const [draftMongoUrl, setDraftMongoUrl] = useState(mongoConnectionUrl ?? "");
  const [draftTheme, setDraftTheme] = useState<ThemeMode>(themeMode);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setDraftMongoUrl(mongoConnectionUrl ?? "");
  }, [mongoConnectionUrl]);

  useEffect(() => {
    setDraftTheme(themeMode);
  }, [themeMode]);

  const canSave = useMemo(() => draftMongoUrl.trim().length > 0, [draftMongoUrl]);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Settings
          </Typography>
          <Typography color="text.secondary">
            Configure app startup settings.
          </Typography>
        </Box>

        {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

        <TextField
          label="MongoDB connection string"
          type="password"
          value={draftMongoUrl}
          onChange={(e) => setDraftMongoUrl(e.currentTarget.value)}
          placeholder="mongodb://localhost:27017"
          fullWidth
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            disabled={!canSave || isChecking}
            onClick={async () => {
              setStatus(null);
              setIsChecking(true);
              try {
                const ok = await checkMongoConnectionUrl(draftMongoUrl.trim());
                setStatus(
                  ok
                    ? { type: "success", message: "Connection check passed." }
                    : { type: "error", message: "Connection check failed." },
                );
              } catch (error) {
                setStatus({
                  type: "error",
                  message: error instanceof Error ? error.message : "Connection check failed.",
                });
              } finally {
                setIsChecking(false);
              }
            }}
          >
            Check connection
          </Button>
          <Button
            variant="contained"
            disabled={!canSave || isSaving}
            onClick={async () => {
              setStatus(null);
              setIsSaving(true);
              try {
                await saveMongoConnectionUrl(draftMongoUrl.trim());
                setStatus({ type: "success", message: "MongoDB connection string saved." });
              } catch (error) {
                setStatus({
                  type: "error",
                  message: error instanceof Error ? error.message : "Failed to save MongoDB URL.",
                });
              } finally {
                setIsSaving(false);
              }
            }}
          >
            Save Mongo URL
          </Button>
        </Stack>

        <TextField
          select
          label="App theme"
          value={draftTheme}
          onChange={(e) => setDraftTheme(e.target.value as ThemeMode)}
          fullWidth
        >
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </TextField>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={async () => {
              setStatus(null);
              try {
                await saveThemeMode(draftTheme);
                setStatus({ type: "success", message: "Theme saved." });
              } catch (error) {
                setStatus({
                  type: "error",
                  message: error instanceof Error ? error.message : "Failed to save theme.",
                });
              }
            }}
          >
            Save theme
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}


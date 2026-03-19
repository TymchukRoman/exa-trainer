import {
  Add as AddIcon,
  Home as HomeIcon,
  List as ListIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Fab,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAppContext } from "../state/AppContext";
import { NewTrainingDialog } from "./NewTrainingDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isConfigured } = useAppContext();
  const [isNewTrainingOpen, setIsNewTrainingOpen] = useState(false);

  const title =
    location.pathname === "/trainings"
      ? "Trainings"
      : location.pathname === "/settings"
        ? "Settings"
        : "Home";

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0} color="transparent">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Tooltip title="Home">
            <IconButton component={RouterLink} to="/" size="large" disabled={!isConfigured}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Trainings">
            <IconButton
              component={RouterLink}
              to="/trainings"
              size="large"
              disabled={!isConfigured}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton component={RouterLink} to="/settings" size="large">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="main">{children}</Box>

      {isConfigured && location.pathname !== "/settings" ? (
        <Fab
          color="primary"
          aria-label="Add training"
          sx={{ position: "fixed", right: 20, bottom: 20 }}
          onClick={() => setIsNewTrainingOpen(true)}
        >
          <AddIcon />
        </Fab>
      ) : null}

      <NewTrainingDialog
        open={isNewTrainingOpen}
        onClose={() => setIsNewTrainingOpen(false)}
      />
    </Box>
  );
}


import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  EmojiEvents as EmojiEventsIcon,
  FitnessCenter as FitnessCenterIcon,
  ListAlt as ListAltIcon,
  ShowChart as ShowChartIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  Box,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
} from "@mui/material";
import { ReactNode, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAppContext } from "../state/AppContext";
import { NewTrainingDialog } from "./NewTrainingDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isConfigured } = useAppContext();
  const [isNewTrainingOpen, setIsNewTrainingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerWidth = 240;

  const title =
    location.pathname === "/trainings"
      ? "Trainings"
      : location.pathname === "/progression"
        ? "Progression"
      : location.pathname === "/exercises"
        ? "Exercises"
      : location.pathname === "/records"
        ? "Personal records"
      : location.pathname === "/settings"
        ? "Settings"
        : "Home";

  const navItems = useMemo(() => [
    { to: "/", label: "Home", icon: <DashboardIcon />, disabled: !isConfigured },
    { to: "/trainings", label: "Trainings", icon: <FitnessCenterIcon />, disabled: !isConfigured },
    { to: "/progression", label: "Progression", icon: <ShowChartIcon />, disabled: !isConfigured },
    { to: "/exercises", label: "Exercises", icon: <ListAltIcon />, disabled: !isConfigured },
    { to: "/records", label: "Personal records", icon: <EmojiEventsIcon />, disabled: !isConfigured },
    { to: "/settings", label: "Settings", icon: <SettingsIcon />, disabled: false },
  ], [isConfigured]);

  const drawerContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" fontWeight={800} sx={{ px: 1.5, py: 1 }}>
        Exa Trainer
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={location.pathname === item.to}
            disabled={item.disabled}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="default"
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}
      >
        <Toolbar
          sx={{
            gap: 1,
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setIsMobileMenuOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        {children}
      </Box>

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


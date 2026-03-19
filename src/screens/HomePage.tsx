import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Exa Trainer
          </Typography>
          <Typography color="text.secondary">
            Store your training results and review them later.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/trainings" variant="contained">
            Trainings list
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}


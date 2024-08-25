import { createLazyFileRoute } from "@tanstack/react-router";
import UserSummaryCard from "../components/userSummaryCard";
import FlightDutySummary from "../components/flightDutySummary";
import { Grid } from "@mui/material";
import Ranking from "../components/ranking";

export const Route = createLazyFileRoute("/")({ component: Index });

function Index() {
  return (
    <Grid container spacing={2} className="p-4">
      <Grid item xs={12} md={4} xl={3}>
        <UserSummaryCard />
      </Grid>
      <Grid item xs={12} md={8} xl={9}>
        <FlightDutySummary />
      </Grid>
      <Grid item xs={12} md={4} xl={3}>
        <Ranking />
      </Grid>
    </Grid>
  );
}

import { createLazyFileRoute } from "@tanstack/react-router";
import UserSummaryCard from "../components/userSummaryCard";

export const Route = createLazyFileRoute("/")({ component: Index });

function Index() {
  return (
    <div className="flex">
      <UserSummaryCard />
    </div>
  );
}

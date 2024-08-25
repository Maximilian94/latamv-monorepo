import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";
import { SideBar } from "../components/sideBar";

export const Route = createRootRoute({
  component: () => {
    return (
      <div className="h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex w-full h-full">
          <SideBar />
          <div className="h-full">
            <Outlet />
          </div>
        </div>
        <Footer />
        <TanStackRouterDevtools />
      </div>
    );
  },
});

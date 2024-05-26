import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";

export const Route = createRootRoute({
  component: () => {
    return (
      <div className="h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        {/* <div className="p-2 flex gap-2">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>{" "}
          <Link to="/about" className="[&.active]:font-bold">
            About
          </Link>
        </div> */}
        {/* <hr /> */}
        <div className="h-full">
          <Outlet />
        </div>
        <Footer />
        <TanStackRouterDevtools />
      </div>
    );
  },
});

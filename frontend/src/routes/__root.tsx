import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";
import { SideBar } from "../components/sideBar";
import toast, { Toaster } from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SnackBar } from "../components/snackBar.tsx";

export type User = {
  name: string;
};

const Root = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const initiateSocketConnection = useCallback(() => {
    const token = localStorage.getItem("auth-token");

    if (!socket && token) {
      const socket = io("http://localhost:3000", {
        auth: { token },
      });
      const loadingToastId = toast.loading(`Attempting to reconnect...`);

      socket.on("connect", () => {
        toast.dismiss(loadingToastId);
        toast.success("Connected to server");
      });

      socket.on("disconnect", (reason: string) => {
        disconnectSocket(socket);
        toast.error(`Disconnected: ${reason}`);
      });

      socket.on("newUserConnected", (data: any) => {
        console.log(data);
        toast.custom((t) => <SnackBar t={t} user={data.user as User} />);
      });

      setSocket(socket);
      console.log("WebSocket connection established");
    }
  }, [socket]);

  const disconnectSocket = (_socket: Socket): void => {
    if (_socket) {
      _socket.disconnect();
      setSocket(null);
    }
  };

  useEffect(() => {
    if (socket) return;
    initiateSocketConnection();

    // We dont neet to disconect as the entire apllication is working with this
    // return () => {
    //     if(socket)return disconnectSocket(socket)
    // }
  }, [initiateSocketConnection, socket]);

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
      <Toaster position="bottom-right"></Toaster>
      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({
  component: Root,
});

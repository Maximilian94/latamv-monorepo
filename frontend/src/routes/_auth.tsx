import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { SnackBar } from "../components/snackBar.tsx";
import Navbar from "../components/navbar.tsx";
import { SideBar } from "../components/sideBar.tsx";
import { Footer } from "../components/footer.tsx";
import { useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  name: string;
  email: string;
  username: string;
  status: UserStatus;
};

type UserStatus = "online" | "offline";

export type Users = Map<User["id"], User>;

const AuthLayout = () => {
  const socketStartedRef = useRef<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const loadingToastIdRef = useRef<string | undefined>(undefined);

  const initiateSocketConnection = useCallback(() => {
    console.log("Executa a função de conexão");
    const token = localStorage.getItem("auth-token");

    if (!socketStartedRef.current && token) {
      console.log("Cria nova conexão", socketStartedRef.current);
      socketStartedRef.current = true;
      const socketConnection = io("http://localhost:3000", {
        auth: { token },
      });

      socketRef.current = socketConnection;

      loadingToastIdRef.current = toast.loading(`Attempting to reconnect...`);

      socketConnection.on("connect", () => {
        console.log("WebSocket connection established");
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = undefined;
        toast.success("Connected to server");
      });

      socketConnection.on("disconnect", (reason: string) => {
        console.log("Desconectado");
        disconnectSocket();
        toast.error(`Disconnected: ${reason}`);
      });

      socketConnection.on(
        "newUserConnected",
        async (data: { userId: number }) => {
          console.log("user", data.userId);

          queryClient.setQueryData<Users>(["users"], (oldData) => {
            if (!oldData) return new Map();
            const userData = oldData.get(data.userId);
            if (userData) {
              userData.status = "online";
            }
            toast.custom((t) => <SnackBar t={t} user={userData} />);
            return new Map(oldData);
          });
        },
      );

      socketConnection.on("userDisconected", (data: { userId: number }) => {
        queryClient.setQueryData<Users>(["users"], (oldData) => {
          if (!oldData) return new Map();
          const userData = oldData.get(data.userId);
          if (userData) userData.status = "offline";
          return new Map(oldData);
        });
      });

      socketConnection.on(
        "usersAndConnectionStatus",
        (data: { users: Array<any> }) => {
          const users = new Map();
          for (const [id, userData] of data.users) {
            users.set(id, userData);
          }
          queryClient.setQueryData<Users>(["users"], () => {
            return users;
          });

          console.log(users);
        },
      );

      return socketConnection;
    }
  }, []);

  const disconnectSocket = (): void => {
    console.log("Chamou função para desconectar");
    if (socketRef.current) {
      console.log("Chamou função para desconectar", socketRef.current);
      socketRef.current.disconnect();

      if (loadingToastIdRef.current) {
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = undefined;
      }

      socketRef.current = null;
      socketStartedRef.current = false;
    }
  };

  useEffect(() => {
    console.log("Inicia useEffect");
    const socketConnection = initiateSocketConnection();
    console.log("socketConnection", socketConnection);

    return () => {
      disconnectSocket();
    };
  }, []);

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
    </div>
  );
};

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

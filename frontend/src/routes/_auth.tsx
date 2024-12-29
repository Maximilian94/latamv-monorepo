import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SnackBar } from '../components/snackBar.tsx';
import Navbar from '../components/navbar.tsx';
import { SideBar } from '../components/sideBar.tsx';
import { FlightDutyProvider } from '../context/flight-duty.context.tsx';

type User = {
  id: number;
  name: string;
  email: string;
  username: string;
  status: UserStatus;
};

type UserStatus = 'online' | 'offline';

// export type Users = Map<User['id'], User>;
export type Users = Array<User>;

const AuthLayout = () => {
  const socketStartedRef = useRef<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const loadingToastIdRef = useRef<string | undefined>(undefined);
  const [expand, setExpand] = useState(false);

  const initiateSocketConnection = useCallback(() => {
    const token = localStorage.getItem('_auth-token');

    if (!socketStartedRef.current && token) {
      socketStartedRef.current = true;
      const socketConnection = io(
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
        {
          auth: { token },
        }
      );

      socketRef.current = socketConnection;

      loadingToastIdRef.current = toast.loading(`Attempting to reconnect...`);

      socketConnection.on('connect', () => {
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = undefined;
        toast.success('Connected to server');
      });

      socketConnection.on('disconnect', (reason: string) => {
        disconnectSocket();
        toast.error(`Disconnected: ${reason}`);
      });

      socketConnection.on(
        'newUserConnected',
        async (data: { userId: number }) => {
          queryClient.setQueryData<Users>(['users'], (oldData) => {
            if (!oldData) return [];
            const userData = oldData.find((user) => user.id == data.userId);
            if (userData) {
              userData.status = 'online';
            }
            if (userData) {
              toast.custom((t) => (
                <SnackBar t={t} user={userData} message={`Acabou de entrar`} />
              ));
            }
            return sorAndUpdateOldData(oldData);
          });
        }
      );

      socketConnection.on('userDisconected', (data: { userId: number }) => {
        queryClient.setQueryData<Users>(['users'], (oldData) => {
          if (!oldData) return [];
          const userData = oldData.find((user) => user.id == data.userId);
          if (userData) userData.status = 'offline';
          return sorAndUpdateOldData(oldData);
        });
      });

      socketConnection.on(
        'usersAndConnectionStatus',
        (data: { users: Array<any> }) => {
          const users: Users = [];
          for (const user of data.users) {
            users.push(user);
          }
          queryClient.setQueryData<Users>(['users'], () => {
            return sorAndUpdateOldData(users);
          });
        }
      );

      socketConnection.on('userCreated', async (data: { user: User }) => {
        queryClient.setQueryData<Users>(['users'], (oldData) => {
          if (!oldData) return [];
          oldData.push(data.user);
          toast.custom((t) => (
            <SnackBar
              t={t}
              user={data.user}
              message={`Acabou de ser contratado`}
            />
          ));
          return sorAndUpdateOldData(oldData);
        });
      });

      const sorAndUpdateOldData = (users: Users) => {
        return users.slice().sort((user) => (user.status == 'online' ? -1 : 1));
      };

      return socketConnection;
    }
  }, []);

  const disconnectSocket = (): void => {
    if (socketRef.current) {
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
    initiateSocketConnection();
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <FlightDutyProvider>
      <div className="h-screen bg-slate-950 flex flex-col justify-between">
        <Navbar />
        <div className="flex w-full h-[calc(100vh-64px)]">
          <div className="h-full">
            <SideBar expand={expand} setExpand={setExpand} />
          </div>
          <div
            className="flex-1 h-full p-4 box-border w-full"
            onMouseEnter={() => setExpand(false)}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </FlightDutyProvider>
  );
};

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
});

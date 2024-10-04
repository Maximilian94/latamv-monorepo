import { Popover, Typography } from '@mui/material';
import Avatar from './avatar';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from '../routes/_auth.tsx';

export function SideBar() {
  const { data: users } = useQuery<Users>({
    queryKey: ['users'],
  });
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [expand, setExpand] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setExpand(false);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div
      className={`flex flex-col items-start gap-1 h-full p-2 ${expand ? 'w-44' : 'w-12'} bg-slate-200 transition-all duration-300 ease-in-out overflow-hidden`}
      onMouseOver={() => setExpand(true)}
      onMouseLeave={() => setExpand(false)}
    >
      {users &&
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Array.from(users).map(([_, userData], index) => {
          return (
            <div
              className="flex gap-1 w-44 hover:bg-slate-300 rounded-md cursor-pointer"
              onClick={handleClick}
              key={`sidebar-user-${index}`}
            >
              <Avatar online={userData.status == 'online'} />
              <div
                className={`w-44 transition-opacity duration-300 ease-in-out flex flex-col ${expand ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className="text-base font-semibold leading-6 text-gray-900">
                  {userData.name}
                </span>
                <span className="text-sm text-gray-500">Co-Pilot | 200h</span>
              </div>
            </div>
          );
        })}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div className="bg-black">
          <Typography sx={{ p: 2 }}>The content of the Popover.</Typography>
        </div>
      </Popover>
    </div>
  );
}

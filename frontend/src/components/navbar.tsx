import React, { useContext, useState } from "react";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { ToSubOptions } from "@tanstack/react-router";
import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Settings from "@mui/icons-material/Settings";
import { Logout } from "@mui/icons-material";
import { AuthContext } from "../context/auth.context.tsx";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

interface NavigationOption {
  name: string;
  href: ToSubOptions["to"];
  current: boolean;
}

const navigation: NavigationOption[] = [
  { name: "Operations", href: "/", current: true },
  { name: "Training", href: "/about", current: false },
  { name: "Main", href: "/main", current: false },
];

function classNames(...classes: Array<string>) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openAnchor = Boolean(anchorEl);
  const authContext = useContext(AuthContext);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const matchRoute = useMatchRoute();
  return (
    <Disclosure as="nav" className="bg-indigo-950">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="/latam-logo.svg"
                    alt="Your Company"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          matchRoute({ to: item.href })
                            ? "bg-indigo-900 text-white"
                            : "text-gray-50 hover:bg-indigo-900 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium",
                        )}
                        aria-current={item.current ? "page" : undefined}
                        search={""}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <button
                  type="button"
                  className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Profile dropdown */}
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleClick}
                    sx={{
                      ml: 2,
                      "&:focus": {
                        outline: "none",
                        boxShadow: "none",
                      },
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      alt="Remy Sharp"
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  open={openAnchor}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <div
                      style={{ display: "flex", gap: "10px", width: "100%" }}
                    >
                      <div style={{ width: "40px", height: "40px" }}>
                        <img
                          alt={"patent"}
                          src={
                            "https://cdn-icons-png.flaticon.com/512/3416/3416563.png"
                          }
                          style={{
                            objectFit: "contain",
                            height: "100%",
                            width: "100%",
                          }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography variant={"caption"} lineHeight={1}>
                            Co-Pilot
                          </Typography>
                          <Typography variant={"button"} lineHeight={1}>
                            {authContext?.user?.name}
                          </Typography>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "2px",
                              alignItems: "center",
                            }}
                          >
                            <QueryBuilderIcon
                              sx={{ fontSize: 14 }}
                            ></QueryBuilderIcon>
                            <Typography variant={"caption"}>200h</Typography>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "2px",
                              alignItems: "center",
                            }}
                          >
                            <FlightTakeoffIcon
                              sx={{ fontSize: 14 }}
                            ></FlightTakeoffIcon>
                            <Typography variant={"caption"}>75</Typography>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={() => authContext?.logout()}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium",
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

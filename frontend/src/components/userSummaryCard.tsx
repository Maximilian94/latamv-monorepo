import {
  CheckBadgeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Card, Divider, Slide } from "@mui/material";
import React, { useEffect } from "react";

const MOCK_MEDALS = [{ href: "/faa-favicon.png", alt: "FAA" }];

const MOCK_TASKS = [
  { text: "Memory Items", status: true },
  { text: "TCAS", status: true },
  { text: "RNAV", status: true },
  { text: "Advanced Systems", status: false },
  { text: "A320 Captain Training", status: false },
];

export default function UserSummaryCard() {
  const [checked, setChecked] = React.useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  return (
    <Slide direction="right" in={checked} mountOnEnter unmountOnExit>
      <Card className="w-full flex flex-col gap-1">
        <div className="px-3 pt-3 flex gap-1">
          <div>
            <Avatar
              alt="Remy Sharp"
              src="https://cdn-icons-png.flaticon.com/512/9159/9159709.png"
              className="w-14 h-14 border-solid border-2 border-indigo-800"
            />
          </div>

          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col">
              <span className="text-xl leading-5">Maximilian Kaden</span>
              <span className="text-xs leading-3 font-light">
                Co-pilot | 70 hours
              </span>
            </div>
            <div className="flex gap-0.5">
              {MOCK_MEDALS.map(({ href, alt }) => (
                <img src={href} alt={alt} className="w-5 h-5" />
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className="px-3 pt-1 pb-2">
          {MOCK_TASKS.map(({ text, status }) => (
            <div className="flex justify-between items-center">
              <span className="text-sm leading-4">{text}</span>
              {status ? (
                <CheckBadgeIcon className="h-4 w-4" color="green" />
              ) : (
                <InformationCircleIcon className="h-4 w-4" color="orange" />
              )}
            </div>
          ))}
        </div>
      </Card>
      {/* <div className="bg-white border border-gray-200 px-4 py-5 rounded-lg shadow"></div> */}
    </Slide>
  );
}

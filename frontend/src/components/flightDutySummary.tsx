import { Avatar, Card, Collapse } from '@mui/material';
import React, { useEffect } from 'react';

const FLIGHT_DUTY = [
  { departure: 'SBGR', arrival: 'SBRF', current: false, done: true },
  { departure: 'SBRF', arrival: 'SBSV', current: false, done: true },
  { departure: 'SBSV', arrival: 'SBNT', current: true, done: false },
  { departure: 'SBNT', arrival: 'SBGR', current: false, done: false },
];

export default function FlightDutySummary() {
  const [checked, setChecked] = React.useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  const CorrectCircle = () => {
    return (
      <div className="bg-indigo-700 h-6 w-6 rounded-full shadow flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-check"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="#FFFFFF"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M5 12l5 5l10 -10" />
        </svg>
      </div>
    );
  };

  const DotCircle = () => {
    return (
      <div className="bg-white h-6 w-6 rounded-full shadow flex items-center justify-center -mr-3 relative">
        <div className="h-3 w-3 bg-indigo-700 rounded-full"></div>
      </div>
    );
  };

  const WhiteCircle = () => {
    return <div className="bg-white h-6 w-6 rounded-full shadow"></div>;
  };

  return (
    <Collapse in={checked} className="w-full">
      <Card className="box-border w-full flex gap-3 p-3 h-full">
        <div>
          <Avatar
            alt="Remy Sharp"
            src="https://www.vidadeturista.com/wp-content/uploads/2009/03/recife-pe.jpg"
            className="w-24 h-24 border-solid border-2 border-indigo-800"
          />
        </div>

        <div className="flex flex-col w-full h-full justify-between">
          <div className="flex justify-between w-full text-xs">
            <span>Voce esta em Recife</span>
            <span>1/4</span>
          </div>
          <div className="flex justify-between w-full text-lg">
            <span>LATAM 3502 | SBRF - SBSV</span>
            <span>+70 EXP</span>
          </div>
          <div className="box-border flex flex-col w-full gap-4 p-2">
            <div className="flex justify-between w-full text-xs items-end">
              {FLIGHT_DUTY.map(({ departure, arrival, current }, index) => {
                const isLastCurrent = FLIGHT_DUTY[index - 1]?.current;
                const isLastItem = FLIGHT_DUTY.length == index + 1;
                return (
                  <div
                    className={`basis-1/4 flex items-end ${isLastItem ? 'justify-between' : 'justify-start'}`}
                  >
                    <span
                      className={`${index == 0 ? '-translate-x-1/4' : '-translate-x-2/4'} ${current || isLastCurrent ? 'text-lg leading-5' : ''} `}
                    >
                      {departure}
                    </span>
                    {isLastItem && (
                      <span
                        className={`${current ? 'text-lg' : ''} translate-x-1/4 `}
                      >
                        {arrival}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="w-full">
              <div className="bg-gray-200 w-full h-1 flex items-center justify-between">
                {FLIGHT_DUTY.map((data, index) => {
                  const width = `${100 / FLIGHT_DUTY.length}%`;

                  return (
                    <div
                      className={`${data.done ? 'bg-indigo-700' : ''} h-1 flex items-center ${FLIGHT_DUTY.length == index + 1 ? 'justify-between' : 'justify-start'}`}
                      style={{ width }}
                    >
                      <div
                        className={`${index == 0 ? '-translate-x-1.5' : '-translate-x-3'}`}
                      >
                        {data.done
                          ? CorrectCircle()
                          : data.current
                            ? DotCircle()
                            : WhiteCircle()}
                      </div>

                      {FLIGHT_DUTY.length == index + 1 && (
                        <div className="translate-x-1.5">
                          {data.done
                            ? CorrectCircle()
                            : data.current
                              ? DotCircle()
                              : WhiteCircle()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Collapse>
  );
}

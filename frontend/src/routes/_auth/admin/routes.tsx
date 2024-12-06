import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getRoutes,
  Route as RouteType,
} from '../../../services/latam.service.ts';
import { Autocomplete, IconButton, TextField, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';

type Operation<T> = (input: T) => T[];

const Routes = () => {
  const routes = useQuery({ queryKey: ['routes'], queryFn: getRoutes });
  const [airportOptions, setAirportOptions] = useState<string[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RouteType[]>([]);
  const [airportSelected, setAirportSelected] = useState<string>('');

  const weekDay = (weekday: number) => {
    const weekDaysName = [
      { name: 'Seg', tooltip: 'Segunda-feira' },
      { name: 'Ter', tooltip: 'Terça-feira' },
      { name: 'Qua', tooltip: 'Quarta-feira' },
      { name: 'Qui', tooltip: 'Quinta-feira' },
      { name: 'Sex', tooltip: 'Sexta-feira' },
      { name: 'Sáb', tooltip: 'Sábado' },
      { name: 'Dom', tooltip: 'Domingo' },
    ];
    return (
      <div className={'flex gap-1'}>
        {weekDaysName.map((weekDayName, index) => {
          return (
            <div
              className={weekday == index + 1 ? '' : 'opacity-30'}
              key={index}
            >
              <Tooltip title={weekDayName.tooltip}>
                <span>{weekDayName.name}</span>
              </Tooltip>
            </div>
          );
        })}
      </div>
    );
  };

  const airport = (ICAO: string) => {
    return (
      <div className={'flex flex-col'}>
        <span className={'leading-4'}>{ICAO}</span>
        <span className={'text-xs leading-3'}>São Paulo</span>
      </div>
    );
  };

  const pipeline = <T,>(data: T[], operations: Operation<T>[]): T[] => {
    return operations.reduce((acc, operation) => operation(acc), data);
  };

  const filterByDeparture = (route: RouteType) => {
    if (airportSelected) return route.departure_icao == airportSelected;
  };
  const filterByArrival = (person: { active: boolean }) => person.active;

  const loadFilteredRoutes = (routes: RouteType[]) => {
    setFilteredRoutes(routes.slice(0, 200));
  };

  useEffect(() => {
    console.log('Vai criar a lista de aeroportos');
    if (routes.data?.data) {
      const airports = routes.data?.data.reduce((acc, curr) => {
        if (!acc.includes(curr.departure_icao)) acc.push(curr.departure_icao);
        if (!acc.includes(curr.arrival_icao)) acc.push(curr.arrival_icao);
        return acc;
      }, [] as Array<string>);

      setAirportOptions(airports);
    }
  }, [filteredRoutes]);

  useEffect(() => {
    if (routes.data?.data) loadFilteredRoutes(routes.data.data);
  }, [routes.data?.data]);

  return (
    // <div className="h-full max-h-screen w-full flex flex-col gap-2 overflow-auto bg-cyan-700 border-box">
    //   <div className={'w-full'}>
    //     <Autocomplete
    //       options={airportOptions}
    //       sx={{ width: 300 }}
    //       renderInput={(params) => <TextField {...params} label="Movie" />}
    //     />
    //   </div>

    // <div className={'h-full flex flex-col gap-2 text-black overflow-hidden'}>
    //   {filteredRoutes.map((route, index) => (
    //     <div
    //       className="flex items-center justify-between border-solid border-1 rounded bg-gray-50 shadow px-2 py-1 hover:bg-gray-200"
    //       key={route.id}
    //     >
    //       <div>{route.flight_number}</div>
    //       <div>{route.aircraft_model_code}</div>
    //       {weekDay(+route.weekday)}
    //       {airport(route.departure_icao)}
    //       <span>{route.eet}</span>
    //       {airport(route.arrival_icao)}
    //       <IconButton aria-label="delete" size={'small'}>
    //         <DescriptionIcon />
    //       </IconButton>
    //     </div>
    //   ))}
    // </div>

    <div
      className={`text-black bg-yellow-400 h-full overflow-hidden box-border`}
    >
      {filteredRoutes.map(() => {
        return <div>Aoba</div>;
      })}
      {/*<div className={'h-full flex flex-col gap-2 text-black overflow-hidden'}>*/}
      {/*  {filteredRoutes.map((route, index) => (*/}
      {/*    <div*/}
      {/*      className="flex items-center justify-between border-solid border-1 rounded bg-gray-50 shadow px-2 py-1 hover:bg-gray-200"*/}
      {/*      key={route.id}*/}
      {/*    >*/}
      {/*      <div>{route.flight_number}</div>*/}
      {/*      <div>{route.aircraft_model_code}</div>*/}
      {/*      {weekDay(+route.weekday)}*/}
      {/*      {airport(route.departure_icao)}*/}
      {/*      <span>{route.eet}</span>*/}
      {/*      {airport(route.arrival_icao)}*/}
      {/*      <IconButton aria-label="delete" size={'small'}>*/}
      {/*        <DescriptionIcon />*/}
      {/*      </IconButton>*/}
      {/*    </div>*/}
      {/*  ))}*/}
      {/*</div>*/}
    </div>
    // </div>
  );
};

export const Route = createFileRoute('/_auth/admin/routes')({
  component: () => <Routes />,
});

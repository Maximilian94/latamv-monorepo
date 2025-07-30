import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getRoutes,
  Route as RouteType,
  updateRoutesFromFlightAware,
} from '../../../../services/latam/latam.service.ts';
import {
  Autocomplete,
  Box,
  IconButton,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import LoadingButton from '@mui/lab/LoadingButton';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';

const Routes = () => {
  const routes = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });
  const [airportOptions, setAirportOptions] = useState<string[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RouteType[]>([]);

  const [departureAirportSelected, setDepartureAirportSelected] = useState<
    string | null
  >('');
  const [arrivalAirportSelected, setArrivalAirportSelected] = useState<
    string | null
  >('');

  const [page, setPage] = useState(0);
  const rowsPerPageOptions: number[] = [20, 40];
  const [rowsPerPage, setRowsPerPage] = useState<number>(rowsPerPageOptions[0]);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  const filterByDeparture = useCallback(
    (route: RouteType) => {
      if (departureAirportSelected)
        return route.departure_icao == departureAirportSelected;
      return true;
    },
    [departureAirportSelected]
  );

  const filterByArrival = useCallback(
    (route: RouteType) => {
      if (arrivalAirportSelected)
        return route.arrival_icao == arrivalAirportSelected;
      return true;
    },
    [arrivalAirportSelected]
  );

  const applyFilters = useCallback(
    (data: RouteType[], filters: Array<(item: RouteType) => boolean>) => {
      return data.filter((item) => filters.every((filter) => filter(item)));
    },
    []
  );

  const loadFilteredRoutes = useCallback(
    (routes: RouteType[]) => {
      const filters: Array<(item: RouteType) => boolean> = [
        filterByDeparture,
        filterByArrival,
      ];

      const filteredItems = applyFilters(routes, filters);

      setFilteredRoutes(filteredItems);
    },
    [filterByDeparture, filterByArrival, applyFilters]
  );

  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    updateRoutesFromFlightAware()
      .then(() => {
        setLoading(false);
        // Refetch routes after update
        routes.refetch();
      })
      .catch(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (routes.data?.data) {
      const airports = routes.data?.data.reduce((acc, curr) => {
        if (!acc.includes(curr.departure_icao)) acc.push(curr.departure_icao);
        if (!acc.includes(curr.arrival_icao)) acc.push(curr.arrival_icao);
        return acc;
      }, [] as Array<string>);

      setAirportOptions(airports);
    }
  }, [filteredRoutes, routes.data?.data]);

  useEffect(() => {
    if (routes.data?.data) loadFilteredRoutes(routes.data.data);
  }, [
    routes.data?.data,
    departureAirportSelected,
    arrivalAirportSelected,
    loadFilteredRoutes,
  ]);

  const initialIndex = (page: number, rowsPerPage: number) => {
    return page * rowsPerPage + 1;
  };

  return (
    <div className={`flex flex-col text-black h-full box-border`}>
      <LoadingButton
        type={'button'}
        variant="contained"
        loadingPosition="end"
        loading={loading}
        endIcon={<ConnectingAirportsIcon />}
        color={'secondary'}
        onClick={handleClick}
      >
        Update routes via FlightAware
      </LoadingButton>
      <div className={'p-2 flex gap-1'}>
        <Autocomplete
          disablePortal
          options={airportOptions}
          className={'w-36'}
          renderInput={(params) => <TextField {...params} label="Departure" />}
          onChange={(_event, newValue: string | null) => {
            setDepartureAirportSelected(newValue);
          }}
          value={departureAirportSelected}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box
                key={key}
                component="li"
                sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                {...optionProps}
              >
                <div className={'flex flex-col'}>
                  <Typography>{option}</Typography>
                  <p className={'text-xs m-0 p-0'}>City</p>
                </div>
              </Box>
            );
          }}
        />

        <Autocomplete
          disablePortal
          options={airportOptions}
          className={'w-36'}
          renderInput={(params) => <TextField {...params} label="Arrival" />}
          onChange={(_event, newValue: string | null) => {
            setArrivalAirportSelected(newValue);
          }}
          value={arrivalAirportSelected}
        />
      </div>
      <div className={'flex-1 h-full overflow-y-scroll'}>
        <div className={'flex flex-col gap-2'}>
          {filteredRoutes
            .slice(
              initialIndex(page, rowsPerPage),
              initialIndex(page, rowsPerPage) + rowsPerPage
            )
            .map((route) => (
              <div
                className="flex items-center justify-between border-solid border-1 rounded bg-gray-50 shadow px-2 py-1 hover:bg-gray-200"
                key={route.flight_number}
              >
                <div>{route.flight_number}</div>
                <div>{route.ident_icao || route.ident_iata || 'N/A'}</div>
                <div>{route.departure_icao}</div>
                <span>{route.eet_seconds ? (() => {
                  const totalMinutes = Math.floor(route.eet_seconds / 60);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${hours}h${minutes.toString().padStart(2, '0')}m`;
                })() : 'N/A'}</span>
                <div>{route.arrival_icao}</div>
                <IconButton aria-label="delete" size={'small'}>
                  <DescriptionIcon />
                </IconButton>
              </div>
            ))}
        </div>
      </div>
      <TablePagination
        component="div"
        count={filteredRoutes.length - 1}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/routes')({
  component: () => <Routes />,
});

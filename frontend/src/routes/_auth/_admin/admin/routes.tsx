import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getRoutes,
  Route as RouteType,
  updateRoutesFromCGNA,
} from '../../../../services/latam/latam.service.ts';
import {
  Autocomplete,
  Box,
  IconButton,
  TablePagination,
  TextField,
  Tooltip,
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
    updateRoutesFromCGNA()
      .then(() => {
        setLoading(false);
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

  const inicialIndex = (page: number, rowsPerPage: number) => {
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
        Gerar rotas pelo CGNA
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
                  <p className={'text-xs m-0 p-0'}>Cidade</p>
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
              inicialIndex(page, rowsPerPage),
              inicialIndex(page, rowsPerPage) + rowsPerPage
            )
            .map((route) => (
              <div
                className="flex items-center justify-between border-solid border-1 rounded bg-gray-50 shadow px-2 py-1 hover:bg-gray-200"
                key={route.id}
              >
                <div>{route.flight_number}</div>
                <div>{route.aircraft_model_code}</div>
                {weekDay(+route.weekday)}
                {airport(route.departure_icao)}
                <span>{route.eet}</span>
                {airport(route.arrival_icao)}
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

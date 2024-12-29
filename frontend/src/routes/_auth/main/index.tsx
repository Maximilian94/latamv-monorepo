import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getRoutes } from '../../../services/latam/latam.service.ts';
import { TablePagination } from '@mui/material';
import { useState } from 'react';

const Main = () => {
  const routes = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });
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

  const getCount = () => {
    if (!routes.data) return 0;
    return routes.data?.data?.length - 1 || 0;
  };

  return (
    <div className={'text-black h-full'}>
      <div className={'flex flex-col h-full gap-2 '}>
        <div className={'flex flex-col h-full gap-2 overflow-y-scroll pt-6'}>
          {/*{routes.data?.data &&*/}
          {/*  routes.data.data*/}
          {/*    .slice(*/}
          {/*      inicialIndex(page, rowsPerPage),*/}
          {/*      inicialIndex(page, rowsPerPage) + rowsPerPage*/}
          {/*    )*/}
          {/*    .map((route, index) => {*/}
          {/*      return (*/}
          {/*        <FlightCard*/}
          {/*          permissionToThisFlight={{ havePermission: true }}*/}
          {/*          flight={{*/}
          {/*            departure: { icao: route.departure_icao },*/}
          {/*            status: 'Looking for Pilot',*/}
          {/*            arrival: { icao: route.arrival_icao },*/}
          {/*            aircraft: route.aircraft_model_code,*/}
          {/*            flightTime: route.eet,*/}
          {/*            flightNumber: route.flight_number,*/}
          {/*          }}*/}
          {/*          key={route.flight_number + index}*/}
          {/*        />*/}
          {/*      );*/}
          {/*    })}*/}
        </div>

        <TablePagination
          component="div"
          count={getCount()}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/main/')({
  component: Main,
});

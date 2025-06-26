import { createFileRoute } from '@tanstack/react-router';
import {
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import {
  EventSeverity,
  getEvents,
  getEventSeverities,
  Event,
} from '../../../../services/latam/latam.service.ts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import parse from 'html-react-parser';

export const Route = createFileRoute('/_auth/_admin/admin/events')({
  component: () => <Events />,
});

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (
    value: number | string | null | { eventID: string; description: string }
  ) => string;
}

interface Data {
  name: string;
  code: string;
  population: number;
  size: number;
  density: number;
}

function createData(
  name: string,
  code: string,
  population: number,
  size: number
): Data {
  const density = population / size;
  return { name, code, population, size, density };
}

const rows = [
  createData('India', 'IN', 1324171354, 3287263),
  createData('China', 'CN', 1403500365, 9596961),
  createData('Italy', 'IT', 60483973, 301340),
  createData('United States', 'US', 327167434, 9833520),
  createData('Canada', 'CA', 37602103, 9984670),
  createData('Australia', 'AU', 25475400, 7692024),
  createData('Germany', 'DE', 83019200, 357578),
  createData('Ireland', 'IE', 4857000, 70273),
  createData('Mexico', 'MX', 126577691, 1972550),
  createData('Japan', 'JP', 126317000, 377973),
  createData('France', 'FR', 67022000, 640679),
  createData('United Kingdom', 'GB', 67545757, 242495),
  createData('Russia', 'RU', 146793744, 17098246),
  createData('Nigeria', 'NG', 200962417, 923768),
  createData('Brazil', 'BR', 210147125, 8515767),
];

const Events = () => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [events, setEvents] = useState<Event[]>([]);
  const [openId, setOpenId] = useState<number>(-1);

  const [severitiesOptions, setSeveritiesOptions] = useState<EventSeverity[]>(
    []
  );

  const openEventDetails = (eventId: number) => {
    return setOpenId(openId == eventId ? -1 : eventId);
  };

  const getSeverityName = (v: number) => {
    return severitiesOptions.find((s) => s.id == v)?.name || '';
  };

  const columns: readonly Column[] = [
    { id: 'icon', label: '' },
    { id: 'id', label: 'Id' },
    {
      id: 'severityId',
      label: 'Severity',
      format: (e) => getSeverityName(e as number),
    },
    {
      id: 'name',
      label: 'Name',
      align: 'right',
    },
  ];

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  useEffect(() => {
    getEventSeverities().then((e) => {
      setSeveritiesOptions(e.data);
    });
  }, []);

  useEffect(() => {
    updateEvents();
  }, []);

  const updateEvents = () => {
    getEvents().then((e) => {
      setEvents(e.data);
    });
  };

  const getRowColor = (severity: Event['severityId'], isDetailRow = false) => {
    const number = isDetailRow ? '800' : '900';
    if (severity == 1) return `bg-emerald-${number}`;
    if (severity == 2) return `bg-green-${number}`;
    if (severity == 3) return `bg-amber-${number}`;
    if (severity == 4) return `bg-red-${number}`;
  };

  return (
    <div>
      <h1 className={'text-xl'}>Events</h1>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {events
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((event) => {
                  const rowColor = getRowColor(event.severityId);
                  return (
                    <>
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={event.id}
                      >
                        <TableCell key={'icon'} className={rowColor}>
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => openEventDetails(event.id)}
                          >
                            {openId === event.id ? (
                              <KeyboardArrowUpIcon />
                            ) : (
                              <KeyboardArrowDownIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell
                          key={'id'}
                          align={'left'}
                          className={rowColor}
                        >
                          {event.id}
                        </TableCell>
                        <TableCell
                          key={'severityId'}
                          align={'left'}
                          className={rowColor}
                        >
                          {getSeverityName(event.severityId)}
                        </TableCell>
                        <TableCell
                          key={'name'}
                          align={'left'}
                          className={rowColor}
                        >
                          {event.name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} style={{ padding: 0 }}>
                          <Collapse
                            in={openId === event.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <div
                              className={`p-4 flex flex-col gap-4 ${getRowColor(event.severityId, true)}`}
                            >
                              <div>
                                <span className={'text-lg text-slate-50'}>
                                  Event Description
                                </span>

                                <div className={'text text-slate-200'}>
                                  {parse(event.eventDescription.description)}
                                </div>
                              </div>
                              <div>
                                <span className={'text-lg'}>Reference</span>
                              </div>
                            </div>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
};

import { createFileRoute } from '@tanstack/react-router';
import {
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

export const Route = createFileRoute('/_auth/_admin/admin/events')({
  component: () => <Events />,
});

interface Column {
  id: keyof Event;
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: number) => string;
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

  const [severitiesOptions, setSeveritiesOptions] = useState<EventSeverity[]>(
    []
  );
  // const [severitySelected, setSeveritySelected] = useState<number>(-1);
  // const [name, setName] = useState<string>('');
  // const [reference, setReference] = useState<string>('');
  // const [description, setDescription] = useState<string>('');

  const getSeverityName = (v: any) => {
    if (typeof v != 'number') return 'error';
    return severitiesOptions.find((s) => s.id == v)?.name || '';
  };

  const getDescription = (v: any) => {
    return v?.description || '';
  };

  const columns: readonly Column[] = [
    { id: 'id', label: 'Id' },
    { id: 'severityId', label: 'Severity', format: getSeverityName },
    {
      id: 'name',
      label: 'Name',
      align: 'right',
    },
    {
      id: 'eventDescription',
      label: 'Description',
      align: 'right',
      format: getDescription,
    },
    {
      id: 'reference',
      label: 'Reference',
      align: 'right',
    },
  ];

  // const handleChange = (event: SelectChangeEvent) => {
  //   setSeveritySelected(+event.target.value);
  // };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // const handleCreateEvent = () => {
  //   createEvent({
  //     description,
  //     reference,
  //     name,
  //     severityId: severitySelected,
  //   }).then(() => {
  //     updateEvents();
  //     resetForm();
  //   });
  //   console.log('createEvent');
  // };

  // const resetForm = () => {
  //   setSeveritySelected(-1);
  //   setName('');
  //   setReference('');
  //   setDescription('');
  // };

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

  return (
    <div>
      <h1 className={'text-xl'}>Events</h1>
      {/*<div>*/}
      {/*  <div className={'mb-2'}>*/}
      {/*    <span className={'text-xl'}>Create event</span>*/}
      {/*  </div>*/}
      {/*  <Grid container spacing={2}>*/}
      {/*    <Grid size={4}>*/}
      {/*      <FormControl fullWidth>*/}
      {/*        <InputLabel id="demo-simple-select-label">Severity</InputLabel>*/}
      {/*        <Select*/}
      {/*          labelId="severity"*/}
      {/*          id="severity"*/}
      {/*          value={severitySelected?.toString()}*/}
      {/*          label="Severity"*/}
      {/*          onChange={handleChange}*/}
      {/*          variant={'filled'}*/}
      {/*        >*/}
      {/*          {severitiesOptions.map((severity) => {*/}
      {/*            return (*/}
      {/*              <MenuItem value={severity.id}>{severity.name}</MenuItem>*/}
      {/*            );*/}
      {/*          })}*/}
      {/*        </Select>*/}
      {/*      </FormControl>*/}
      {/*    </Grid>*/}

      {/*    <Grid size={4}>*/}
      {/*      <FormControl fullWidth>*/}
      {/*        <TextField*/}
      {/*          id="name"*/}
      {/*          label="Name"*/}
      {/*          variant="outlined"*/}
      {/*          value={name}*/}
      {/*          onChange={(v) => setName(v.target.value)}*/}
      {/*        />*/}
      {/*      </FormControl>*/}
      {/*    </Grid>*/}

      {/*    <Grid size={4}>*/}
      {/*      <FormControl fullWidth>*/}
      {/*        <TextField*/}
      {/*          id="reference"*/}
      {/*          label="Reference"*/}
      {/*          variant="outlined"*/}
      {/*          value={reference}*/}
      {/*          onChange={(v) => setReference(v.target.value)}*/}
      {/*        />*/}
      {/*      </FormControl>*/}
      {/*    </Grid>*/}

      {/*    <Grid size={12}>*/}
      {/*      <FormControl fullWidth>*/}
      {/*        <TextField*/}
      {/*          id="description"*/}
      {/*          label="Description"*/}
      {/*          multiline*/}
      {/*          rows={4}*/}
      {/*          defaultValue=""*/}
      {/*          variant="outlined"*/}
      {/*          value={description}*/}
      {/*          onChange={(v) => setDescription(v.target.value)}*/}
      {/*        />*/}
      {/*      </FormControl>*/}
      {/*    </Grid>*/}

      {/*    <Grid size={12}>*/}
      {/*      <Button*/}
      {/*        onClick={handleCreateEvent}*/}
      {/*        variant={'contained'}*/}
      {/*        color={'secondary'}*/}
      {/*      >*/}
      {/*        Create Event*/}
      {/*      </Button>*/}
      {/*    </Grid>*/}
      {/*  </Grid>*/}
      {/*</div>*/}

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
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={event.id}
                    >
                      {columns.map((column) => {
                        const value = event[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {/*@ts-ignore*/}
                            {column.format && column.format(value)}
                            {/*@ts-ignore*/}
                            {!column.format && value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
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

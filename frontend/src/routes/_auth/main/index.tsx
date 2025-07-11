import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '../../../components/card.tsx';
import Avatar from '../../../components/avatar.tsx';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import { useAuth } from '../../../context/auth.context.tsx';
import { convertMinutesTo_HH_MM } from '../../../utils/flight.ts';
import Grid from '@mui/material/Grid2';
import { List, ListItem, ListItemButton, Skeleton } from '@mui/material';
import Button from '@mui/material/Button';
import HistoryIcon from '@mui/icons-material/History';
import { useEffect, useState } from 'react';

const Main = () => {
  const { user } = useAuth();
  const [last_5_flights, set_last_5_flights] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  useEffect(() => {
    const MOCK_LAST_5_FLIGHTS = [true, true, true, true, true];

    setTimeout(() => {
      set_last_5_flights(MOCK_LAST_5_FLIGHTS);
    }, 3000);
  }, []);

  return (
    <div className={'text-black h-full'}>
      <div className={'flex flex-col h-full gap-2 '}>
        <div className={'flex flex-col h-full gap-2 pt-6'}>
          <div className={'w-full px-2 box-border'}>
            <Grid container spacing={2}>
              <Grid size={12}>
                {/*Basic User Details*/}
                <Card>
                  <div className={'flex gap-2'}>
                    <div>
                      <Avatar online={false}></Avatar>
                    </div>
                    <div
                      className={'flex flex-col justify-between text-slate-200'}
                    >
                      <span className={''}>{user?.name}</span>
                      <span className={'text-sm'}>
                        {user?.roles?.map((r) => {
                          return r.name;
                        })}
                      </span>
                      <div className={'flex items-center'}>
                        <QueryBuilderIcon fontSize={'small'} />
                        {convertMinutesTo_HH_MM(user?.flightHours || 0)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Grid>

              <Grid size={8}>
                {/*History User Details*/}
                <Card>My next flight</Card>
              </Grid>

              <Grid size={4}>
                {/*History User Details*/}
                <Card>
                  <div className={'text-slate-200'}>
                    <div className={'flex justify-between items-center'}>
                      <div className={'flex items-start gap-2'}>
                        <HistoryIcon />
                        <span className={'text-lg'}>Last 5 flights</span>
                      </div>
                      <Link to={'/logbook'} params={{}} search={{}}>
                        <Button variant="contained" color={'secondary'}>
                          Go to logbook
                        </Button>
                      </Link>
                    </div>

                    <List>
                      {last_5_flights.map((value) => {
                        return (
                          <ListItem disablePadding>
                            <ListItemButton>
                              <div
                                className={
                                  'flex justify-between items-center w-full'
                                }
                              >
                                {!value && (
                                  <Skeleton
                                    animation="wave"
                                    className={'w-full'}
                                  />
                                )}

                                {value && (
                                  <>
                                    <div>TAM3001</div>
                                    {/*<SeverityInfo flight={} />*/}
                                  </>
                                )}
                              </div>
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </div>
                </Card>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/main/')({
  component: Main,
});

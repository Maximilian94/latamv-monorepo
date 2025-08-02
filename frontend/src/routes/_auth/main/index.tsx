import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '../../../components/card.tsx';
import Avatar from '../../../components/avatar.tsx';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import { useAuth } from '../../../context/auth.context.tsx';
import { convertMinutesTo_HH_MM } from '../../../utils/flight.ts';
import Grid from '@mui/material/Grid2';
import { Divider, List, ListItem, ListItemButton, Skeleton } from '@mui/material';
import Button from '@mui/material/Button';
import HistoryIcon from '@mui/icons-material/History';
import { useGetFlights } from '../../../services/latam/latam.service.ts';
import SeverityInfo from '../../../components/severity/severityInfo.tsx';
import PlanBadge from '../../../components/planBadge.tsx';
import PlanManager from '../../../components/planManager.tsx';

const Main = () => {
  const { user } = useAuth();
  const { data: flights } = useGetFlights();

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
                      <div className="flex items-center gap-2">
                        <span className={''}>{user?.name}</span>
                        {user?.plan && <PlanBadge plan={user.plan} />}
                      </div>
                      <span className={'text-sm'}>
                        {user?.roles?.map((r) => {
                          return r.name;
                        })}
                      </span>
                      <div className={'flex items-center gap-1'}>
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
                <div className="space-y-4">
                  {/*Plan Manager*/}
                  <PlanManager />
                  
                  {/*History User Details*/}
                  <Card>
                    <div className={'text-slate-200'}>
                      <div className={'flex justify-between items-center'}>
                        <div className={'flex items-start gap-2'}>
                          <HistoryIcon />
                          <span className={'text-lg'}>Last 5 flights</span>
                        </div>
                        <Link to={'/logbook'} params={{}} search={{}}>
                          <Button variant="contained" color={'primary'}>
                            Go to logbook
                          </Button>
                        </Link>
                      </div>

                      <Divider className='mt-2' />

                      <List>
                        {flights.slice(0, 5).map((flight) => {
                          return (
                            <ListItem disablePadding key={flight.id}>
                              <Link 
                                to="/flight-details/$flightId" 
                                params={{ flightId: flight.id.toString() }}
                                className="w-full no-underline"
                              >
                                <ListItemButton>
                                  <div
                                    className={
                                      'flex justify-between items-center w-full'
                                    }
                                  >
                                    {!flight && (
                                      <Skeleton
                                        animation="wave"
                                        className={'w-full'}
                                      />
                                    )}

                                    {flight && (
                                      <>
                                        <div>{flight.flightNumber}</div>
                                        <SeverityInfo
                                          flight={flight}
                                          small={true}
                                        />
                                      </>
                                    )}
                                  </div>
                                </ListItemButton>
                              </Link>
                            </ListItem>
                          );
                        })}
                      </List>
                    </div>
                  </Card>
                </div>
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

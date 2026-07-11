import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Assessment,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { useState } from 'react';
import { getExams, Exam } from '../../../../services/latam/exam.service';
import dayjs from 'dayjs';

const Exams = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const exams = useQuery({
    queryKey: ['exams', statusFilter],
    queryFn: () => getExams({ status: statusFilter || undefined }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getStatusChip = (status: Exam['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Chip icon={<Schedule />} label="In Progress" color="warning" size="small" />;
      case 'FINISHED':
        return <Chip icon={<CheckCircle />} label="Finished" color="success" size="small" />;
      case 'ABANDONED':
        return <Chip icon={<Cancel />} label="Abandoned" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getScoreColor = (score?: number, isPassed?: boolean) => {
    if (score === undefined) return 'text-gray-500';
    if (isPassed) return 'text-green-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredExams = exams.data?.data || [];
  const paginatedExams = filteredExams.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Exam Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all user exams
          </Typography>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Exams</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredExams.length}
                </p>
              </div>
              <Assessment className="text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Finished</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredExams.filter(e => e.status === 'FINISHED').length}
                </p>
              </div>
              <CheckCircle className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-orange-900">
                  {filteredExams.filter(e => e.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Schedule className="text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Abandoned</p>
                <p className="text-2xl font-bold text-red-900">
                  {filteredExams.filter(e => e.status === 'ABANDONED').length}
                </p>
              </div>
              <Cancel className="text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <FormControl size="small" className="min-w-[200px]">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="FINISHED">Finished</MenuItem>
                <MenuItem value="ABANDONED">Abandoned</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardContent className="p-0">
          <TableContainer component={Paper} className="shadow-none">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">ID</TableCell>
                  <TableCell className="font-semibold">Template</TableCell>
                  <TableCell className="font-semibold">User ID</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Score</TableCell>
                  <TableCell className="font-semibold">Progress</TableCell>
                  <TableCell className="font-semibold">Time Spent</TableCell>
                  <TableCell className="font-semibold">Started</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography>Loading exams...</Typography>
                    </TableCell>
                  </TableRow>
                ) : exams.isError ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">
                        Error loading exams. Please try again.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography>No exams found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExams.map((exam) => (
                    <TableRow key={exam.id} hover>
                      <TableCell>{exam.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          {exam.examTemplateTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>{exam.userId}</TableCell>
                      <TableCell>{getStatusChip(exam.status)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          className={getScoreColor(exam.score, exam.isPassed)}
                        >
                          {exam.score !== undefined ? `${exam.score}%` : '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {exam.answeredCount}/{exam.questionCount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(exam.timeSpent)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(exam.startedAt).format('MMM DD, YYYY HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredExams.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/exams')({
  component: () => <Exams />,
});
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { PlayArrow, Edit, Add } from '@mui/icons-material';

export const Route = createFileRoute('/_auth/exam')({
  component: ExamHomePage,
});

function ExamHomePage() {
  const navigate = useNavigate();

  const handleCreateTemplate = () => {
    navigate({ to: '/admin/exam-templates/create-exam-template' });
  };

  const handleManageTemplates = () => {
    navigate({ to: '/admin/exam-templates' });
  };

  return (
    <div className="min-h-screen bg-indigo-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Typography variant="h3" component="h1" className="text-white mb-8 text-center">
          Exam System
        </Typography>
        
        <Grid container spacing={4}>
          {/* Take Exam Card */}
          <Grid item xs={12} md={4}>
            <Card className="h-full bg-indigo-900 text-white">
              <CardContent className="text-center">
                <PlayArrow sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" component="h2" className="mb-4">
                  Take Exam
                </Typography>
                <Typography variant="body1" className="mb-4">
                  Start a new exam with template ID 1
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  fullWidth
                  startIcon={<PlayArrow />}
                  // onClick={() => handleStartExam(1)}
                >
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Template Card */}
          <Grid item xs={12} md={4}>
            <Card className="h-full bg-indigo-900 text-white">
              <CardContent className="text-center">
                <Edit sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" component="h2" className="mb-4">
                  Edit Template
                </Typography>
                <Typography variant="body1" className="mb-4">
                  Edit exam template with ID 1
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  fullWidth
                  startIcon={<Edit />}
                  // onClick={() => handleEditTemplate(1)}
                >
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Create Template Card */}
          <Grid item xs={12} md={4}>
            <Card className="h-full bg-indigo-900 text-white">
              <CardContent className="text-center">
                <Add sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" component="h2" className="mb-4">
                  Create Template
                </Typography>
                <Typography variant="body1" className="mb-4">
                  Create a new exam template
                </Typography>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large"
                  fullWidth
                  startIcon={<Add />}
                  onClick={handleCreateTemplate}
                >
                  Create Template
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box className="mt-8 text-center">
          <Typography variant="h6" className="text-white mb-4">
            Quick Actions
          </Typography>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              variant="outlined" 
              color="primary" 
              className="text-white border-white"
              // onClick={() => handleStartExam(1)}
            >
              Exam ID 1
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              className="text-white border-white"
              // onClick={() => handleStartExam(2)}
            >
              Exam ID 2
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              className="text-white border-white"
              // onClick={() => handleStartExam(3)}
            >
              Exam ID 3
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              className="text-white border-white"
              onClick={handleManageTemplates}
            >
              Manage Templates
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
}

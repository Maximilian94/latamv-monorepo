import { Button, Grid2 } from '@mui/material';
import { useExamStore } from '../../../store/exam.store';

export const ExamIndex = ({ isEditing = false }: { isEditing: boolean }) => {
  const {
    currentQuestion,
    setCurrentQuestion,
    alternativesSelected,
    currentExamTemplate
  } = useExamStore();

  // const handleCreateQuestion = () => {
  //   createQuestion();
  //   setCurrentQuestion(questions.length);
  // };

  return (
    <div className="h-full bg-indigo-950 flex flex-col p-4 gap-4 box-border">
      <div className="flex flex-row gap-4 h-min">
        {isEditing && (
          <Button
            color="secondary"
            variant="contained"
            // onClick={handleCreateQuestion}
          >
            Create Question
          </Button>
        )}

        {!isEditing && (
          <Button color="secondary" variant="contained">
            Finish Test
          </Button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 box-border h-full">
        <Grid2 container spacing={2} className="overflow-y-auto">
          {currentExamTemplate?.questions?.map((question, index) => {
            const isCurrent = currentQuestion === index;
            // Since questions is just an array of numbers, we can't check selectedOption here.
            // We'll just mark all as unanswered for now.
            const isAnswered = alternativesSelected[index] !== undefined;
            return (
              <Grid2 size={{ xs: 4, md: 3 }} key={index}>
                <Button
                  fullWidth
                  className={`rounded-md p-2 text-center ${isCurrent ? 'bg-slate-200' : isAnswered ? 'bg-indigo-500' : 'bg-slate-600'} `}
                  onClick={() => setCurrentQuestion(index)}
                >
                  <span
                    className={`${isCurrent ? 'text-indigo-950' : 'text-white'}`}
                  >
                    {index + 1}
                  </span>
                </Button>
              </Grid2>
            );
          })}
        </Grid2>
      </div>
    </div>
  );
};

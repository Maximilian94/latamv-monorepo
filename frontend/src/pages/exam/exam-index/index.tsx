import { Button, Grid2 } from '@mui/material';
import { useQuestionContext } from '../question/useQuestionContext';

export const ExamIndex = ({ isEditing = false }: { isEditing: boolean }) => {
  const { currentQuestion, setCurrentQuestion, questions, createQuestion } = useQuestionContext();

  const handleCreateQuestion = () => {
    createQuestion();
    setCurrentQuestion(questions.length);
  }
  
  return (
    <div className="w-96 bg-indigo-950 flex flex-col p-4 gap-4">
      {isEditing &&  <Button color="secondary" variant="contained" onClick={handleCreateQuestion}>
        Create Question
      </Button>}

      {!isEditing && <Button color="secondary" variant="contained">
        Finish Test
      </Button>}
      

      <Grid2 container spacing={2}>
        {questions.map((_, index) => {
          const isCurrent = currentQuestion === index;
          // Since questions is just an array of numbers, we can't check selectedOption here.
          // We'll just mark all as unanswered for now.
          const isAnswered = questions[index].selectedOption !== null;
          return (
            <Grid2 size={{ xs: 4, md: 3 }} key={index}>

              <Button
              fullWidth
                className={`rounded-md p-2 text-center ${isCurrent ? 'bg-slate-200' : isAnswered ? 'bg-indigo-500' : 'bg-slate-600'} `}
                onClick={() => setCurrentQuestion(index)}
              >
                <span className={`${isCurrent ? 'text-indigo-950' : 'text-white'}`}>{index + 1}</span>
              </Button>
            </Grid2>
          );
        })}
      </Grid2>
    </div>
  );
};

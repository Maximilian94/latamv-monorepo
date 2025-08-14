import { List, ListItem, ListItemButton } from '@mui/material';
import { useQuestionContext } from './useQuestionContext';

export const QuestionContent = () => {
  const { currentQuestion, questions, onOptionSelect } = useQuestionContext();

  const letters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];

  if (questions === undefined || questions.length === 0) return null;

  return (
    <div>
      <span>{questions[currentQuestion].label}</span>
      <List>
        {questions[currentQuestion].options.map((option, index) => (
          <ListItem key={option.id}>
            <ListItemButton
              className={`rounded-md border-2 border-solid  ${questions[currentQuestion].selectedOption === option.id ? 'bg-indigo-500 border-indigo-200' : 'bg-indigo-900 border-indigo-900'}`}
              disableRipple
              onClick={() => onOptionSelect(currentQuestion, option.id)}
            >
              <div className=" flex gap-4 items-center">
                <span className="text-4xl text-gray-50">{letters[index]}</span>
                <span>{option.label}</span>
              </div>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

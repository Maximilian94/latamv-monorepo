import { QuestionHeader } from './header';
import { QuestionTabs } from './tabs';
import { QuestionContent } from './content';
import { TabContext, TabPanel } from '@mui/lab';
import { QuestionExplanation } from './explanation';
import { QuestionStatistics } from './statistics';
import { QuestionComments } from './comments';
import { SyntheticEvent, useState } from 'react';
import { Button, Collapse } from '@mui/material';
import { useQuestionContext } from './useQuestionContext';

export const Question = ({ isEditing = false }: { isEditing: boolean }) => {
  const [value, setValue] = useState('1');
  const { currentQuestion, setCurrentQuestion } = useQuestionContext();
  
  const handleChange = (_event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <div className="flex-1 bg-indigo-950 h-full">
      <div className="flex flex-col h-full">
        <QuestionHeader isEditing={isEditing} />
        <div className='flex-1'>
        <TabContext value={value}>
          <QuestionTabs handleChange={handleChange} />

          <Collapse in={value === '1'}>
            <TabPanel value="1">
              <QuestionContent isEditing={isEditing} />
            </TabPanel>
          </Collapse>

          <Collapse in={value === '2'}>
            <TabPanel value="2">
              <QuestionExplanation />
            </TabPanel>
          </Collapse>

          <Collapse in={value === '3'}>
            <TabPanel value="3">
              <QuestionStatistics />
            </TabPanel>
          </Collapse>
          
          <Collapse in={value === '4'}>
            <TabPanel value="4">
              <QuestionComments />
            </TabPanel>
          </Collapse>
        </TabContext>
        </div>
        
        <div className='flex justify-between w-full p-2 box-border'>
        <Button variant='contained' color='inherit' className='bg-indigo-900' onClick={() => setCurrentQuestion(currentQuestion - 1)}>
            Back
          </Button>
          <Button variant='contained' color='inherit' className='bg-indigo-900' onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next Question
          </Button>
        </div>
      </div>
    </div>
  );
};

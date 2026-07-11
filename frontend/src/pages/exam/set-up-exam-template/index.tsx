import {
  Autocomplete,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import { useExamStore } from '../../../store/exam.store';
import { useState, useEffect } from 'react';

export const SetUpExamTemplate = () => {
  const { examQuestionTags } = useExamStore();
  const [selectedTags, setSelectedTags] = useState(examQuestionTags);

  // Update selectedTags when examQuestionTags changes
  useEffect(() => {
    setSelectedTags(examQuestionTags);
  }, [examQuestionTags]);

  return (
    <div className="w-full h-full bg-indigo-950 flex flex-col p-4 gap-4 box-border">
      <TextField label="Exam Title" />

      <TextField label="Number of questions" />

      <TextField label="Passing score" />

      <FormControlLabel control={<Switch />} label="Is active" />

      <Autocomplete
        fullWidth
        multiple
        id="tags-standard"
        options={examQuestionTags}
        getOptionLabel={(option) => option.questionTagName}
        value={selectedTags}
        onChange={(_event, newValue) => {
          setSelectedTags(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Multiple values"
            placeholder="Favorites"
          />
        )}
      />
    </div>
  );
};

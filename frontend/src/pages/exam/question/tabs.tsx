import { TabList } from '@mui/lab';
import { Tab } from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BarChartIcon from '@mui/icons-material/BarChart';
import CommentIcon from '@mui/icons-material/Comment';
import { colors } from '../../../utils/colors';

export const QuestionTabs = ({
  handleChange,
}: {
  handleChange: (event: React.SyntheticEvent, newValue: string) => void;
}) => {
  return (
    <TabList 
      onChange={handleChange} 
      aria-label="lab API tabs example"
      sx={{
        '& .MuiTabs-indicator': {
          backgroundColor: colors.rose[600], // rose-600 - cor do botão secundário
        },
        '& .MuiTab-root': {
          color: colors.slate[200], // gray-400 - cor padrão
          minHeight: '48px', // altura mínima reduzida
          padding: '6px 16px', // padding reduzido
          '&.Mui-selected': {
            color: colors.rose[600], // rose-600 - cor do botão secundário quando selecionado
          },
          '&:hover': {
            color: colors.slate[50], // rose-500 - cor mais clara no hover
            backgroundColor: colors.indigo[900], // rose-50 - background muito claro no hover
          },
        },
      }}
    >
      <Tab 
        icon={<QuestionMarkIcon fontSize="small" />} 
        label="Question" 
        disableRipple 
        value="1" 
        iconPosition="start"
      />
      <Tab 
        icon={<LightbulbIcon fontSize="small" />} 
        label="Explanation" 
        disableRipple 
        value="2" 
        iconPosition="start"
      />
      <Tab 
        icon={<BarChartIcon fontSize="small" />} 
        label="Statistics" 
        disableRipple 
        value="3" 
        iconPosition="start"
      />
      <Tab 
        icon={<CommentIcon fontSize="small" />} 
        label="Comments" 
        disableRipple 
        value="4" 
        iconPosition="start"
      />
    </TabList>
  );
};

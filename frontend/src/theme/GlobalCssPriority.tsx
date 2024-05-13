import { StyledEngineProvider } from "@mui/material/styles";

interface GlobalCssPriorityProps {
  children: React.ReactNode;
}

const GlobalCssPriority: React.FC<GlobalCssPriorityProps> = ({ children }) => {
  return <StyledEngineProvider injectFirst>{children}</StyledEngineProvider>;
};

export default GlobalCssPriority;

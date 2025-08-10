import React from "react";
import { Collapse } from "@mui/material";

export const PhaseWrapper = ({ 
  children, 
  phaseNumber, 
  actualPhaseNumber 
}: { 
  children: React.ReactNode, 
  phaseNumber: number, 
  actualPhaseNumber: number
}) => {
  return (
    <Collapse
      in={phaseNumber === actualPhaseNumber}
      easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
      unmountOnExit mountOnEnter
      className="w-full"
    >
      {(actualPhaseNumber === phaseNumber) && children}
    </Collapse>
  );
};
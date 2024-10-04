import { Card, Slide } from '@mui/material';
import React, { useEffect } from 'react';

export default function Ranking() {
  const [checked, setChecked] = React.useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  return (
    <Slide direction="right" in={checked} mountOnEnter unmountOnExit>
      <Card className="w-full flex flex-col gap-1">Aoba</Card>
    </Slide>
  );
}

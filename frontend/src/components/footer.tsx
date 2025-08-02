import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import VersionDisplay from './version-display';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <Box
      component="footer"
      className={className}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2024 LATAM Virtual. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Version:
            </Typography>
            <VersionDisplay variant="chip" showDetails={true} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

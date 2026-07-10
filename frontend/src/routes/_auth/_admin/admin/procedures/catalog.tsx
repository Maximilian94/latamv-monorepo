import { createFileRoute } from '@tanstack/react-router';
import { ProceduresThemeProvider } from '../../../../../pages/procedures/procedures-theme';
import { DatarefCatalogPage } from '../../../../../pages/procedures/dataref-catalog';

export const Route = createFileRoute('/_auth/_admin/admin/procedures/catalog')({
  component: () => (
    <ProceduresThemeProvider>
      <DatarefCatalogPage />
    </ProceduresThemeProvider>
  ),
});

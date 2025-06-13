import { createFileRoute } from '@tanstack/react-router';
import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import yaml from 'js-yaml';

// Definindo o tipo para os dados do latest.yml
interface LatestInfo {
  version: string;
  files: Array<{ url: string; sha512: string; size: number }>;
  path: string;
  sha512: string;
  releaseDate: string;
}

export const Route = createFileRoute('/_auth/resources')({
  component: () => <Resources />,
});

const Resources = () => {
  const [latestInfo, setLatestInfo] = useState<LatestInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para baixar e parsear o latest.yml
  useEffect(() => {
    const fetchLatestInfo = async () => {
      try {
        const response = await fetch(
          'https://storage.googleapis.com/latam-v-bucket/latest.yml'
        );
        if (!response.ok) throw new Error('Falha ao baixar o latest.yml');
        const text = await response.text();
        const data = yaml.load(text) as LatestInfo; // Type assertion para o tipo definido
        setLatestInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao buscar latest.yml:', err);
      }
    };

    fetchLatestInfo();
  }, []);

  // Função de download
  const downloadAcars = () => {
    if (latestInfo) {
      const url = `https://storage.googleapis.com/latam-v-bucket/${latestInfo.path}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = latestInfo.path; // Usa o nome do arquivo do latest.yml
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col">
      <h2>Resources</h2>

      <div className={'flex flex-col max-w-screen-lg'}>
        <div className={'w-full max-w-screen-lg flex justify-between'}>
          {/*Left*/}
          <div className={'flex flex-col'}>
            <span>LATAM Virtual ACARS</span>
            {latestInfo ? (
              <span className={'text-sm text-slate-400'}>
                Version: {latestInfo.version}
              </span>
            ) : error ? (
              <span className={'text-sm text-red-500'}>Erro: {error}</span>
            ) : (
              <span className={'text-sm text-slate-400'}>
                Carregando versão...
              </span>
            )}
          </div>

          {/*Right*/}
          <div>
            <Button
              variant="contained"
              onClick={downloadAcars}
              disabled={!latestInfo}
            >
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

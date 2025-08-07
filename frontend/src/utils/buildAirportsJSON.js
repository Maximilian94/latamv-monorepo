import fs from 'fs/promises';
import https from 'https';

// eslint-disable-next-line no-undef
const token = process.env.AUTH_TOKEN;

const options = {
  hostname: 'latamv-monorepo-be.onrender.com',
  port: 443,
  path: '/routes/airports',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

https
  .get(options, async (res) => {
    // Handle redirects
    if (res.statusCode >= 300 && res.statusCode < 400) {
      const location = res.headers.location;
      if (location) {
        console.log(`Redirecting to: ${location}`);
        const url = new URL(location);
        const redirectOptions = {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        https.get(redirectOptions, async (redirectRes) => {
          let data = '';
          redirectRes.on('data', (chunk) => {
            data += chunk;
          });
          
          redirectRes.on('end', async () => {
            try {
              console.log('Response status:', redirectRes.statusCode);
              console.log('Response headers:', redirectRes.headers);
              console.log('data', data);
              
              if (redirectRes.statusCode !== 200) {
                console.error('Error: Server returned status', redirectRes.statusCode);
                return;
              }
              
              const listOfAirports = JSON.parse(data);
              const AirportInfo = {};

              const jsonString = await fs.readFile('./airports (1).json', 'utf8');
              const originalData = JSON.parse(jsonString);

              listOfAirports.map((airportICAO) => {
                if (!AirportInfo[airportICAO]) AirportInfo[airportICAO] = {};
                AirportInfo[airportICAO] = originalData[airportICAO];
              });

              await fs.writeFile(
                './airports.json',
                JSON.stringify(AirportInfo, null, 2)
              );

              console.log('Arquivo JSON criado com sucesso!');
              console.log('AirportInfo', AirportInfo);
              console.log('Resposta completa:', data);
            } catch (error) {
              console.error('Erro ao processar o arquivo:', error);
            }
          });
        }).on('error', (err) => {
          console.error('Erro na requisição de redirecionamento:', err);
        });
      }
    } else {
      // Handle direct response
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          console.log('Response status:', res.statusCode);
          console.log('data', data);
          
          if (res.statusCode !== 200) {
            console.error('Error: Server returned status', res.statusCode);
            return;
          }
          
          const listOfAirports = JSON.parse(data);
          const AirportInfo = {};

          const jsonString = await fs.readFile('./airports (1).json', 'utf8');
          const originalData = JSON.parse(jsonString);

          listOfAirports.map((airportICAO) => {
            if (!AirportInfo[airportICAO]) AirportInfo[airportICAO] = {};
            AirportInfo[airportICAO] = originalData[airportICAO];
          });

          await fs.writeFile(
            './airports.json',
            JSON.stringify(AirportInfo, null, 2)
          );

          console.log('Arquivo JSON criado com sucesso!');
          console.log('AirportInfo', AirportInfo);
          console.log('Resposta completa:', data);
        } catch (error) {
          console.error('Erro ao processar o arquivo:', error);
        }
      });
    }
  })
  .on('error', (err) => {
    console.error('Erro na requisição:', err);
  });

import fs from 'fs/promises';
import http from 'http';
const token = process.env.AUTH_TOKEN;

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/routes/airports',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

http
  .get(options, async (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', async () => {
      const listOfAirports = JSON.parse(data);
      const AirportInfo = {};

      try {
        const jsonString = await fs.readFile('./airports (1).json', 'utf8');
        const originalData = JSON.parse(jsonString);

        listOfAirports.map((airportICAO) => {
          const [firstLetter, secondLetter, thirdLetter, fourthLetter] =
            airportICAO;

          if (!AirportInfo[firstLetter]) AirportInfo[firstLetter] = {};
          if (!AirportInfo[firstLetter][secondLetter])
            AirportInfo[firstLetter][secondLetter] = {};
          if (!AirportInfo[firstLetter][secondLetter][thirdLetter])
            AirportInfo[firstLetter][secondLetter][thirdLetter] = {};
          if (
            !AirportInfo[firstLetter][secondLetter][thirdLetter][fourthLetter]
          )
            AirportInfo[firstLetter][secondLetter][thirdLetter][fourthLetter] =
              {};

          AirportInfo[firstLetter][secondLetter][thirdLetter][fourthLetter] =
            originalData[airportICAO];
        });

        await fs.writeFile(
          './airports.json',
          JSON.stringify(AirportInfo, null, 2),
          (err) => {
            if (err) {
              console.error('Erro ao criar o arquivo JSON:', err);
            } else {
              console.log('Arquivo JSON criado com sucesso!');
            }
          }
        );

        console.log('AirportInfo', AirportInfo);
        console.log('Resposta completa:', data);
      } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
      }
    });
  })
  .on('error', (err) => {
    console.error('Erro na requisição:', err);
  });

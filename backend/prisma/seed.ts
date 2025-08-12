import { Prisma, PrismaClient } from '@prisma/client';
import { SeverityId } from './seed/severity';
import { eventList as generatedEventsData } from './seed/eventsListSeed';
import { seedBases } from './seed/base.seed';
import { seedSubsidiaries } from './seed/subsidiary.seed';


export const A319_DATA = [
  {
    registration: 'PT-TMT',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TML',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MBN',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MBU',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MBV',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MBW',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MYC',
    type: '319-112',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMA',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMB',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMC',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMD',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TME',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMO',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MYL',
    type: '319-112',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PR-MYM',
    type: '319-112',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMG',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TPA',
    type: '319-112',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TPB',
    type: '319-112',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
  {
    registration: 'PT-TMI',
    type: '319-132',
    engine: '',
    active: true,
    aircraftModelCode: 'A319',
  },
];

export const A320_DATA = [
  {
    registration: 'PR-MBG',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MAK',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MAG',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MBA',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MBF',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MBH',
    type: '320-232',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHA',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHG',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHI',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHJ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHK',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHE',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHF',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHM',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHP',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHQ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHR',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHU',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHX',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHW',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MHZ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYA',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYH',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYI',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYJ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYK',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TQB',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TQC',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYN',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYO',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYP',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYQ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYR',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYT',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYV',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYW',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYX',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYY',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-MYZ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYA',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYD',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYF',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYH',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYI',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYJ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYK',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYL',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYM',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYN',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYO',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYS',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYT',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYP',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYQ',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYR',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYU',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-TYV',
    type: '320-214',
    engine: '',
    active: true,
    aircraftModelCode: 'A320',
  },
  {
    registration: 'PR-XBB',
    type: '320-273N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBA',
    type: '320-273N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBD',
    type: '320-273N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBE',
    type: '320-273N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBF',
    type: '320-273N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBI',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBJ',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBK',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBL',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBM',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBN',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBO',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBH',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBP',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBG',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBQ',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
  {
    registration: 'PR-XBR',
    type: '320-271N',
    engine: '',
    active: true,
    aircraftModelCode: 'A20N',
  },
];

export const A321_DATA = [
  {
    registration: 'PT-MXA',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXB',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXC',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXD',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXE',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXF',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXG',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXH',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXI',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXJ',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXL',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXM',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXN',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXO',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXP',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-MXQ',
    type: '321-231',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPA',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPB',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPC',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPD',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPE',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPF',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPG',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPH',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPI',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPJ',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPL',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPM',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPN',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPQ',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PT-XPO',
    type: '321-211',
    engine: '',
    active: true,
    aircraftModelCode: 'A321',
  },
  {
    registration: 'PS-LBA',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBB',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBC',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBE',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBF',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBG',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBJ',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBH',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
  {
    registration: 'PS-LBI',
    type: '321-271NX',
    engine: '',
    active: true,
    aircraftModelCode: 'A21N',
  },
];

const aircraftModelData: Prisma.AircraftModelCreateInput[] = [
  { code: 'A318', manufacturer: 'Airbus', model: 'A318' },
  { code: 'A319', manufacturer: 'Airbus', model: 'A319' },
  { code: 'A320', manufacturer: 'Airbus', model: 'A320' },
  { code: 'A321', manufacturer: 'Airbus', model: 'A321' },
  { code: 'A20N', manufacturer: 'Airbus', model: 'A320neo' },
  { code: 'A21N', manufacturer: 'Airbus', model: 'A321neo' },
  { code: 'A350', manufacturer: 'Airbus', model: 'A350' },
  { code: 'B767', manufacturer: 'Boeing', model: 'B767' },
  { code: 'B777', manufacturer: 'Boeing', model: 'B777' },
  { code: 'B787', manufacturer: 'Boeing', model: 'B787' },
];

const roles: Prisma.RoleCreateInput[] = [
  { name: 'Admin' },
  { name: 'Candidate' },
  { name: 'First Officer in Training' },
  { name: 'National First Officer' },
  { name: 'Mercosur First Officer' },
  { name: 'International First Officer' },
  { name: 'National Captain' },
  { name: 'Mercosur Captain' },
  { name: 'International Captain' },
];

const eventSeverity: Prisma.SeverityCreateInput[] = [
  {
    id: SeverityId.StandardCompliance,
    name: 'StandardCompliance',
    description: 'Represents the execution of a mandatory procedure.',
    points: 2,
  },
  {
    id: SeverityId.ProactiveExcellence,
    name: 'ProactiveExcellence',
    description:
      'It represents a specific action of the operational procedure, these actions can be a small operational detail or an action recommended by the original manual, however, not mandatory.',
    points: 1,
  },
  {
    id: SeverityId.ProceduralDeviation,
    name: 'ProceduralDeviation',
    description:
      'It represents an operational error but without serious consequences, easily correctable.',
    points: -1,
  },
  {
    id: SeverityId.SafetyCompromise,
    name: 'SafetyCompromise',
    description:
      'It represents a high-risk operational failure that threatens the aircraft, crew or passengers, requiring significant attention.',
    points: -2,
  },
];

// --- Início da lógica para processar os eventos gerados ---

// Array para armazenar os eventos e descrições prontos para o Prisma
// O id do Evento será o logicalId gerado
const eventsToSeed: Prisma.EventCreateInput[] = [];
const eventDescriptionsToSeed: Prisma.EventDescriptionCreateInput[] = [];

// Função recursiva para percorrer o objeto aninhado e coletar os eventos
function collectEvents(obj: any) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  // Verifica se é um objeto de evento (contém 'logicalId', 'name', 'severityId')
  if (obj.logicalId && obj.name && obj.severityId !== undefined) {
    // Adicionado 'undefined' check para severityId
    const eventData = obj; // obj já é a GeneratedEvent do eventsListSeed.ts

    // Cria o Evento. O 'id' do modelo Prisma será o 'logicalId' gerado.
    const eventCreateInput: Prisma.EventCreateInput = {
      id: eventData.logicalId, // <-- Agora o 'id' do Prisma será sua string única!
      name: eventData.name,
      reference: eventData.reference,
      severity: {
        connect: { id: eventData.severityId },
      },
    };
    eventsToSeed.push(eventCreateInput);

    // Adiciona a descrição do evento. A conexão será feita com o 'id' do evento.
    eventDescriptionsToSeed.push({
      description: eventData.description,
      event: {
        connect: { id: eventData.logicalId }, // Conecta EventDescription ao Evento via seu 'id' (que é a string única)
      },
    });

    return; // Já processou este objeto de evento
  }

  // Se não é um objeto de evento, percorre suas propriedades
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      collectEvents(obj[key]);
    }
  }
}

// Inicia a coleta de eventos a partir do seu objeto gerado
collectEvents(generatedEventsData);

const prisma = new PrismaClient();

async function main() {
  // Seed subsidiaries first
  await seedSubsidiaries();
  
  // Seed bases
  await seedBases();

  await prisma.$transaction([
    ...aircraftModelData.map((cur) => {
      return prisma.aircraftModel.upsert({
        where: { code: cur.code },
        update: {},
        create: cur,
      });
    }),
    ...roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
    ...[...A320_DATA, ...A319_DATA, ...A321_DATA].map((aircraft) =>
      prisma.aircraft.upsert({
        where: {
          registration: aircraft.registration,
        },
        update: { ...aircraft },
        create: {
          ...aircraft,
        },
      }),
    ),
  ]);

  // 4. Criar Event Severities
  await prisma.$transaction(
    eventSeverity.map((severity) =>
      prisma.severity.upsert({
        where: {
          id: severity.id,
        },
        update: { ...severity },
        create: {
          ...severity,
        },
      }),
    ),
  );
  console.log('Event Severities seeded.');

  // 5. Criar Events e EventDescriptions
  console.log('Seeding Events and EventDescriptions...');

  for (const eventInput of eventsToSeed) {
    // Usa o 'id' do eventInput (que é sua string única) para o upsert do Evento.
    const event = await prisma.event.upsert({
      where: { id: eventInput.id }, // <-- Usa o 'id' do Evento diretamente aqui
      update: {
        name: eventInput.name,
        reference: eventInput.reference,
        severityId: (eventInput.severity as any).connect.id,
      },
      create: eventInput,
    });

    // Encontra a descrição correspondente pelo 'id' do evento (sua string única)
    const descriptionForThisEvent = eventDescriptionsToSeed.find(
      (desc) => (desc.event as any).connect.id === eventInput.id,
    );

    if (descriptionForThisEvent) {
      await prisma.eventDescription.upsert({
        where: { eventID: event.id }, // Onde event.id é o ID real (sua string única) do Evento
        update: { description: descriptionForThisEvent.description },
        create: {
          eventID: event.id, // Usa o ID real do Evento aqui
          description: descriptionForThisEvent.description,
        },
      });
    }
  }
  console.log('Events and EventDescriptions seeded.');

  const accessPageGroup = await prisma.permissionGroup.upsert({
    where: { name: 'AccessPage' },
    update: {},
    create: {
      name: 'AccessPage',
      description: 'Permissions related to accessing pages',
    },
  });

  const adminPagePermission = await prisma.permission.upsert({
    where: { name: 'ACCESS_ADMIN_PANEL' },
    update: {},
    create: {
      name: 'ACCESS_ADMIN_PANEL',
      description: 'Allows access to the admin page',
      permissionGroup: { connect: { id: accessPageGroup.id } },
    },
  });

  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: adminPagePermission.id,
      },
    },
    create: {
      role: { connect: { id: adminRole.id } },
      permission: { connect: { id: adminPagePermission.id } },
    },
    update: {},
  });

  // Create FlightManagement permission group
  const flightManagementGroup = await prisma.permissionGroup.upsert({
    where: { name: 'FlightManagement' },
    update: {},
    create: {
      name: 'FlightManagement',
      description: 'Permissions related to flight management and generation',
    },
  });

  // Create flight generation permission
  const generateFlightPermission = await prisma.permission.upsert({
    where: { name: 'GENERATE_FLIGHT' },
    update: {},
    create: {
      name: 'GENERATE_FLIGHT',
      description: 'Allows user to generate flight duties and flights',
      permissionGroup: { connect: { id: flightManagementGroup.id } },
    },
  });

  // Get all roles except Candidate
  const rolesWithFlightPermission = await prisma.role.findMany({
    where: { name: { not: 'Candidate' } },
  });

  // Assign flight generation permission to all roles except Candidate
  for (const role of rolesWithFlightPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: generateFlightPermission.id,
        },
      },
      create: {
        role: { connect: { id: role.id } },
        permission: { connect: { id: generateFlightPermission.id } },
      },
      update: {},
    });
  }

  // Seed Awards
  console.log('Seeding Awards...');
  
  const awardsData = [
    {
      name: 'Air Law Exam',
      description: 'Successfully completed the Air Law examination',
      tooltip: 'Demonstrates knowledge of Air Law',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'Phraseology Exam',
      description: 'Successfully completed the Aviation Phraseology examination',
      tooltip: 'Shows proficiency in standard aviation communication procedures',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'IFR Exam',
      description: 'Successfully completed the Instrument Flight Rules examination',
      tooltip: 'Certifies ability to fly under instrument meteorological conditions',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'Chart Interpretation Exam',
      description: 'Successfully completed the Aeronautical Chart Interpretation examination',
      tooltip: 'Demonstrates skill in reading and interpreting aviation charts',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'Flight Theory Exam',
      description: 'Successfully completed the Flight Theory examination',
      tooltip: 'Shows understanding of fundamental flight principles and aerodynamics',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'Performance Exam',
      description: 'Successfully completed the Aircraft Performance examination',
      tooltip: 'Certifies knowledge of aircraft performance calculations and limitations',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    },
    {
      name: 'Meteorology Exam',
      description: 'Successfully completed the Aviation Meteorology examination',
      tooltip: 'Demonstrates understanding of weather patterns and aviation weather',
      validityDuration: 365, // 1 year
      image: 'https://cdn-icons-png.flaticon.com/512/3416/3416563.png'
    }
  ];

  for (const awardData of awardsData) {
    await prisma.award.upsert({
      where: { name: awardData.name },
      update: {},
      create: awardData,
    });
  }

  console.log('Awards seeded successfully.');
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });

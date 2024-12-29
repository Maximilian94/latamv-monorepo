interface AtcSession {
  frequency: number;
  position: string;
}

interface LastTrack {
  altitude: number;
  altitudeDifference: number;
  arrivalDistance: number | null;
  departureDistance: number | null;
  groundSpeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  onGround: boolean;
  state: string;
  timestamp: string;
  transponder: number;
  transponderMode: string;
  time: number;
}

interface Atis {
  lines: string[];
  revision: string;
  timestamp: string;
}

export interface AtcData {
  id: number;
  userId: number;
  callsign: string;
  serverId: string;
  softwareTypeId: string;
  softwareVersion: string;
  rating: number;
  createdAt: string;
  time: number;
  atcSession: AtcSession;
  lastTrack: LastTrack;
  atis: Atis;
}

interface ObservableAtcSession {
  frequency: number;
  position: string | null;
}

interface ObservableLastTrack {
  altitude: number;
  altitudeDifference: number;
  arrivalDistance: number | null;
  departureDistance: number | null;
  groundSpeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  onGround: boolean;
  state: string;
  timestamp: string;
  transponder: number;
  transponderMode: string;
  time: number;
}

interface Observable {
  id: number;
  userId: number;
  callsign: string;
  serverId: string;
  softwareTypeId: string;
  softwareVersion: string;
  rating: number;
  createdAt: string;
  time: number;
  atcSession: ObservableAtcSession;
  lastTrack: ObservableLastTrack;
}

interface PilotSession {
  simulatorId: string;
  textureId: number;
}

interface LastTrack {
  altitude: number;
  altitudeDifference: number;
  arrivalDistance: number | null;
  departureDistance: number | null;
  groundSpeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  onGround: boolean;
  state: string;
  timestamp: string;
  transponder: number;
  transponderMode: string;
  time: number;
}

interface Aircraft {
  icaoCode: string;
  model: string;
  wakeTurbulence: string;
  isMilitary: boolean;
  description: string;
}

interface FlightPlan {
  id: number;
  revision: number;
  aircraftId: string;
  aircraftNumber: number;
  departureId: string;
  arrivalId: string;
  alternativeId: string | null;
  alternative2Id: string | null;
  route: string;
  remarks: string;
  speed: string;
  level: string;
  flightRules: string;
  flightType: string;
  eet: number;
  endurance: number;
  departureTime: number;
  actualDepartureTime: number | null;
  peopleOnBoard: number;
  createdAt: string;
  aircraft: Aircraft;
  aircraftEquipments: string;
  aircraftTransponderTypes: string;
}

interface Pilot {
  id: number;
  userId: number;
  callsign: string;
  serverId: string;
  softwareTypeId: string;
  softwareVersion: string;
  rating: number;
  createdAt: string;
  time: number;
  pilotSession: PilotSession;
  lastTrack: LastTrack;
  flightPlan: FlightPlan;
}

interface Connections {
  total: number;
  supervisor: number;
  atc: number;
  observer: number;
  pilot: number;
  worldTour: number;
  followMe: number;
  uniqueUsers24h: number;
}

interface Server {
  id: string;
  hostname: string;
  ip: string;
  description: string;
  countryId: string;
  currentConnections: number;
  maximumConnections: number;
}

interface VoiceServer {
  id: string;
  hostname: string;
  ip: string;
  description: string;
  countryId: string;
  currentConnections: number;
  maximumConnections: number;
}

export type IVAOUsersOnline = {
  clients: {
    atcs: Array<AtcData>;
    followMe: [];
    observers: Array<Observable>;
    pilots: Array<Pilot>;
  };
  connections: Array<Connections>;
  servers: Array<Server>;
  updatedAt: string;
  voiceServers: Array<VoiceServer>;
};

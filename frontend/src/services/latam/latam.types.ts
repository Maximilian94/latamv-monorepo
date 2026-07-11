export type APILatamError = {
  message: string;
};

export type PostGenerateFlightDutyParams = {
  aircraft: Array<string>;
  numberOfFlights: number;
  // Per-leg flight-time (EET) range, in minutes.
  minEet?: number;
  maxEet?: number;
};

export enum Severity {
  StandardCompliance = 1,
  ProactiveExcellence = 2,
  ProceduralDeviation = 3,
  SafetyCompromise = 4,
}

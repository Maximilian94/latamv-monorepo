export type APILatamError = {
  message: string;
};

export type PostGenerateFlightDutyParams = {
  aircraft: Array<string>;
  numberOfFlights: number;
};

export enum Severity {
  StandardCompliance = 1,
  ProactiveExcellence = 2,
  ProceduralDeviation = 3,
  SafetyCompromise = 4,
}

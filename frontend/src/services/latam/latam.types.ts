export type APILatamError = {
  message: string;
};

export type PostGenerateFlightDutyParams = {
  aircraft: Array<string>;
  numberOfFlights: number;
};

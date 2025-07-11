import { Severity } from '../../services/latam/latam.types.ts';
import SeverityIcon from './severityIcon/severityIcon.tsx';
import { Flight } from '../../services/latam/latam.service.ts';

export type SeverityType = {
  [K in Severity]: number;
};

export default function SeverityInfo({
  flight,
  small = false,
}: {
  flight: Flight;
  small: boolean;
}): JSX.Element {
  return (
    <div className={`flex gap-2 ${small && 'text-sm'}`}>
      {!!flight.amountOfProactiveExcellence && (
        <SeverityIcon
          severity={Severity.ProactiveExcellence}
          amount={flight.amountOfProactiveExcellence}
        />
      )}
      {!!flight.amountOfStandardCompliance && (
        <SeverityIcon
          severity={Severity.StandardCompliance}
          amount={flight.amountOfStandardCompliance}
        />
      )}
      {!!flight.amountOfProceduralDeviation && (
        <SeverityIcon
          severity={Severity.ProceduralDeviation}
          amount={flight.amountOfProceduralDeviation}
        />
      )}
      {!!flight.amountOfSafetyCompromise && (
        <SeverityIcon
          severity={Severity.SafetyCompromise}
          amount={flight.amountOfSafetyCompromise}
        />
      )}
    </div>
  );
}

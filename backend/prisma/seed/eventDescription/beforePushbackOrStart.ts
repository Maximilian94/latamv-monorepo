import { SeverityId } from '../severity';

export const ACCU_PRESSURE = { [SeverityId.SafetyCompromise]: '' };
ACCU_PRESSURE[SeverityId.SafetyCompromise] = `
<p>When the ACCU (Accumulator) pressure indication is outside the green band, it means that the hydraulic pressure stored in the brake accumulators is insufficient. This has direct and critical implications for operational safety:</p>

<ul>
    <li><strong>Risk of uncontrolled aircraft movement:</strong> Low accumulator pressure limits the friction force applied to the brake discs, which can lead to unwanted aircraft movement, especially during pushback, when the engines are not yet providing full hydraulic pressure.</li>
    <li><strong>Ineffectiveness of the parking brake:</strong> The parking brake directly depends on the hydraulic pressure supplied by the accumulators when the engines are not running. If the ACCU pressure is low, the parking brake will not be able to safely hold the aircraft, allowing it to roll freely.</li>
    <li><strong>Compromised emergency braking applications:</strong> The accumulators provide a critical energy reserve for a limited number of braking applications, especially in scenarios where primary hydraulic power sources are not operational. If the ACCU pressure is already low before pushback, this safety margin is severely reduced, limiting the number of brake applications available in an emergency, such as an aborted pushback or a subsequent hydraulic failure.</li>
</ul>

<p>In summary, an indication outside the green band is not just a technical deviation, but a direct warning of compromised braking capability, which increases the risk of ground incidents and compromises overall operational safety.</p>`;

ACCU_PRESSURE[SeverityId.StandardCompliance] = 'green band';

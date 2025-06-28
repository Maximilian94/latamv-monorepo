import { SeverityId } from '../severity';

export const ACCU_PRESSURE = {};
ACCU_PRESSURE[SeverityId.SafetyCompromise] = `
<p>When the ACCU (Accumulator) pressure indication is outside the green band, it means that the hydraulic pressure stored in the brake accumulators is insufficient. This has direct and critical implications for operational safety:</p>

<ul>
    <li><strong>Risk of uncontrolled aircraft movement:</strong> Low accumulator pressure limits the friction force applied to the brake discs, which can lead to unwanted aircraft movement, especially during pushback, when the engines are not yet providing full hydraulic pressure.</li>
    <li><strong>Ineffectiveness of the parking brake:</strong> The parking brake directly depends on the hydraulic pressure supplied by the accumulators when the engines are not running. If the ACCU pressure is low, the parking brake will not be able to safely hold the aircraft, allowing it to roll freely.</li>
    <li><strong>Compromised emergency braking applications:</strong> The accumulators provide a critical energy reserve for a limited number of braking applications, especially in scenarios where primary hydraulic power sources are not operational. If the ACCU pressure is already low before pushback, this safety margin is severely reduced, limiting the number of brake applications available in an emergency, such as an aborted pushback or a subsequent hydraulic failure.</li>
</ul>

<p>In summary, an indication outside the green band is not just a technical deviation, but a direct warning of compromised braking capability, which increases the risk of ground incidents and compromises overall operational safety.</p>`;

ACCU_PRESSURE[SeverityId.StandardCompliance] = 'On the green band';

export const THRUST_LEVERS = {};
THRUST_LEVERS[SeverityId.StandardCompliance] = 'At Idle';
THRUST_LEVERS[SeverityId.SafetyCompromise] =
  '    <div class="container">\n' +
  '        <h2>A320 "THRUST LEVERS... IDLE" Check: What Happens If There\'s an Error?</h2>\n' +
  '        <hr>\n' +
  '        <p>During the **AT PUSHBACK AND START CLEARANCE** phase of the A320, a critical checklist item is to ensure the **Thrust Levers** are in the **IDLE** position. This procedure is vital for ground safety.</p>\n' +
  '\n' +
  '        <p>Airbus warns: "Engines will start, regardless of the thrust lever position; thrust will rapidly increase to the corresponding thrust lever position, causing a hazardous situation, if thrust levers are not at IDLE."</p>\n' +
  '\n' +
  '        <h3>Why Is This Dangerous?</h3>\n' +
  "        <p>The A320's **FADEC (Full Authority Digital Engine Control)** system is designed to start the engine regardless of the thrust lever position. However, if a thrust lever is in a position other than IDLE (for example, in the CLIMB or TOGA detent), the FADEC, after the engine stabilizes, will command a **rapid and uncontrolled increase** in thrust to the level corresponding to that lever position.</p>\n" +
  '\n' +
  '        <h3>Immediate Consequences of an Error:</h3>\n' +
  '        <ul>\n' +
  '            <li><strong>Unintended Aircraft Movement:</strong> Even with parking brakes set, a sudden thrust increase can cause the aircraft to lurch forward or backward, potentially leading to an uncontrolled movement.</li>\n' +
  '            <li><strong>Risk to Ground Personnel and Equipment:</strong> High thrust can blast away, damage, or throw ground support equipment (e.g., GPU, air start unit, chocks, pushback tug) and cause serious or fatal injuries to personnel working near the aircraft. Jet blast is extremely powerful.</li>\n' +
  '            <li><strong>Engine Damage:</strong> Rapid, uncontrolled acceleration can lead to engine over-temperature (EGT exceedance) or over-speed (N1/N2 exceedance), potentially damaging the engine.</li>\n' +
  '            <li><strong>Collisions:</strong> Unintended movement could result in collisions with other aircraft, vehicles, or nearby structures.</li>\n' +
  '        </ul>\n' +
  '\n' +
  '        <h3>Urgent Corrective Actions:</h3>\n' +
  '        <p>If an unexpected thrust increase occurs, immediate pilot action is essential:</p>\n' +
  '        <ul>\n' +
  '            <li>Immediately retard the thrust levers to **IDLE**.</li>\n' +
  '            <li>Apply **full brakes**.</li>\n' +
  '            <li>Consider an **engine shutdown** (ENGINE MASTER OFF) if the situation is uncontrolled or there is imminent danger.</li>\n' +
  '        </ul>\n' +
  '\n' +
  '        <h3>Importance of the Check:</h3>\n' +
  '        <p>This checklist item is a fundamental safety barrier. It ensures the aircraft remains static and safe during the engine start process, protecting everyone in the airport environment. It highlights how crucial manual pilot intervention is to complement automated systems and prevent dangerous ground incidents.</p>\n' +
  '    </div>';

export const EXTERIOR_LIGHTS_BEACON = {};

EXTERIOR_LIGHTS_BEACON[SeverityId.StandardCompliance] = 'Beacon On';
EXTERIOR_LIGHTS_BEACON[SeverityId.ProceduralDeviation] = '';

export const WINDOWS_AND_DOORS = {};
WINDOWS_AND_DOORS[SeverityId.StandardCompliance] = 'CHECK CLOSED';
WINDOWS_AND_DOORS[SeverityId.SafetyCompromise] = '';

export const SLIDES = {};
SLIDES[SeverityId.StandardCompliance] = 'CHECK ARMED';
SLIDES[SeverityId.ProceduralDeviation] = '';

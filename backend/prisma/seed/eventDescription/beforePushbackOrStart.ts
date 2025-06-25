import { SeverityId } from '../severity';

export const ACCU_PRESSURE = { [SeverityId.SafetyCompromise]: '' };
ACCU_PRESSURE[SeverityId.SafetyCompromise] = `
<p>Quando a indicação da pressão do ACCU (Acumulador) está fora da faixa verde, significa que a pressão hidráulica armazenada nos acumuladores de freio é insuficiente. Isso tem implicações diretas e críticas para a segurança operacional:</p>

<ul>
    <li><strong>Risco de movimento descontrolado da aeronave:</strong> A baixa pressão do acumulador limita a força de atrito aplicada nos discos de freio, o que pode levar a um movimento indesejado da aeronave, especialmente durante o pushback, quando os motores ainda não estão fornecendo pressão hidráulica total.</li>
    <li><strong>Ineficácia do freio de estacionamento:</strong> O freio de estacionamento depende diretamente da pressão hidráulica fornecida pelos acumuladores quando os motores não estão em funcionamento. Se a pressão do ACCU estiver baixa, o freio de estacionamento não conseguirá manter a aeronave parada com segurança, permitindo que ela role livremente.</li>
    <li><strong>Comprometimento das aplicações de frenagem de emergência:</strong> Os acumuladores fornecem uma reserva crítica de energia para um número limitado de aplicações de frenagem, especialmente em cenários onde as fontes primárias de potência hidráulica não estão operacionais. Se a pressão do ACCU já estiver baixa antes do pushback, essa margem de segurança é severamente reduzida, limitando o número de aplicações de freio disponíveis em uma emergência, como um pushback abortado ou uma falha hidráulica subsequente.</li>
</ul>

<p>Em resumo, uma indicação fora da faixa verde não é apenas um desvio técnico, mas um alerta direto para uma capacidade de frenagem comprometida, o que eleva o risco de incidentes em solo e compromete a segurança geral da operação.</p>`;

ACCU_PRESSURE[SeverityId.StandardCompliance] = 'green band';

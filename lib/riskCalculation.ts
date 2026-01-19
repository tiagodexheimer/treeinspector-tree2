
import { PhytosanitaryData, RiskProbability } from '@prisma/client';

export function calculateRiskRating(
    data: Partial<PhytosanitaryData>
): {
    rating: number,
    probability: RiskProbability,
    target: number,
    severity: number
} {
    // 1. Determine Probability (If not provided, infer from Health)
    let probability = data.risk_probability;
    if (!probability) {
        switch (data.estado_saude) {
            case 'Desvitalizada': probability = 'Extrema'; break;
            case 'Ruim': probability = 'Alta'; break;
            case 'Regular': probability = 'Moderada'; break;
            case 'Bom': default: probability = 'Baixa'; break;
        }
    }

    // Map Probability to Score (1-4)
    const probScoreMap: Record<string, number> = {
        'Baixa': 1,
        'Moderada': 2,
        'Alta': 3,
        'Extrema': 4
    };
    const probScore = probScoreMap[probability || 'Baixa'] || 1;

    // 2. Determine Target Value (1-4)
    // Default to 1 (Low) if missing.
    // In a real app, this might come from the Tree's location (e.g. near street), 
    // but for now we look at the input or default.
    const targetScore = data.target_value || 1;

    // 3. Determine Severity (1-5 in DB, we'll cap at 4 for TRAQ alignment or keep 5)
    // DB has severity_level Int?
    // Let's use it directly as score, defaulting to 1.
    const severityScore = data.severity_level || 1;

    // 4. Calculate Final Rating
    // Simple Matrix Summation Model:
    // Risco = Prob + Target + Severity
    // Min: 1+1+1 = 3
    // Max: 4+4+5 = 13 (approx)
    const rating = probScore + targetScore + severityScore;

    return {
        rating,
        probability: probability as RiskProbability,
        target: targetScore,
        severity: severityScore
    };
}

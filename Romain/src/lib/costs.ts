// Bareme kilometrique simplifie pour le partage de frais
// Base : ~0.10€/km (essence moyenne) - ce n'est PAS le bareme fiscal complet,
// juste le cout carburant pour rester dans le cadre legal du covoiturage

const COST_PER_KM = 0.10; // euros par km (carburant uniquement)

/**
 * Calcule le cout total du trajet pour le conducteur (carburant)
 */
export function calculateTripCost(distanceKm: number): number {
  return Math.round(distanceKm * COST_PER_KM * 100) / 100;
}

/**
 * Calcule le cout par passager en partageant les frais
 * Le conducteur est inclus dans le partage (il paie aussi sa part)
 */
export function calculateCostPerPassenger(
  distanceKm: number,
  totalPeople: number // conducteur + passagers
): number {
  if (totalPeople <= 1) return 0;
  const totalCost = calculateTripCost(distanceKm);
  return Math.round((totalCost / totalPeople) * 100) / 100;
}

/**
 * Estime le CO2 economise par passager qui ne prend pas sa voiture
 * ~120g CO2/km pour une voiture moyenne
 */
export function calculateCO2Saved(distanceKm: number, passengersCount: number): number {
  const CO2_PER_KM = 120; // grammes
  return Math.round(distanceKm * CO2_PER_KM * passengersCount);
}

/**
 * Formate un montant en euros
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

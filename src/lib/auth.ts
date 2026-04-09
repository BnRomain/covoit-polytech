// Whitelist des domaines universitaires autorises.
// Actuellement inutilisee : la restriction est desactivee pour la phase de
// test avec collaborateurs externes. Voir isUniversityEmail ci-dessous.
const ALLOWED_DOMAINS = [
  "etu.univ-cotedazur.fr",
  "univ-cotedazur.fr",
  "polytech.univ-cotedazur.fr",
  "unice.fr",
];

/**
 * Verifie si un email est valide.
 * TODO: restriction universitaire desactivee pour les tests. Avant la vraie
 * mise en prod, remplacer le corps par la version commentee ci-dessous qui
 * utilise ALLOWED_DOMAINS.
 */
export function isUniversityEmail(email: string): boolean {
  void ALLOWED_DOMAINS;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && domain.length > 0;

  // Version "prod" a reactiver :
  // const domain = email.split("@")[1]?.toLowerCase();
  // if (!domain) return false;
  // return ALLOWED_DOMAINS.some(
  //   (allowed) => domain === allowed || domain.endsWith("." + allowed)
  // );
}

/**
 * Extrait le nom a partir de l'email
 * ex: prenom.nom@etu.univ-cotedazur.fr -> Prenom Nom
 */
export function nameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  if (!localPart) return "";
  return localPart
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

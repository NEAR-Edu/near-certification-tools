export type ImageIngredients = {
  tokenId: string;
  date: string;
  expiration: string | null;
  programCode: string; // This will determine which background image gets used.
  programName: string;
  accountName: string;
  programDescription: string;
  instructor: string;
};

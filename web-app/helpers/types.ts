export type ImageIngredients = {
  accountName: string;
  date: string;
  expiration: string;
  instructor: string;
  programCode: string;
  programDescription: string;
  // This will determine which background image gets used.
  programName: string;
  tokenId: string;
};

export type JsonResponse =
  | {
      message: string;
      status: string;
    }
  | { error?: unknown | undefined; success: boolean };

export type NftMintResult = any;

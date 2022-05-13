export type ImageIngredients = {
  tokenId: string;
  date: string;
  expiration: string;
  programCode: string; // This will determine which background image gets used.
  programName: string;
  accountName: string;
  programDescription: string;
  instructor: string;
};

export type JsonResponse =
  | {
      status: string;
      message: string;
    }
  | { success: boolean; error?: undefined | unknown };

export type NftMintResult = any;

export class AppError extends Error {
  code: string;
  details: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
export function errorResult(error: unknown) {
  return error instanceof AppError
    ? { code: error.code, message: error.message, details: error.details }
    : {
        code: "INTERNAL_ERROR",
        message:
          "Erreur interne. Réessayez ou contactez le responsable du connecteur.",
      };
}

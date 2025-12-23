export interface sendVerificationEmail {
  to: string;
  alias: string;
  code: string;
  expiresInMinutes: number;
}

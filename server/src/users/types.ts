export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  // Demo-only plaintext storage in memory — this is a mock betting app with
  // no production auth requirements; never do this for a real account system.
  password: string;
  createdAt: string;
  balance: number;
}

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  balance: number;
}

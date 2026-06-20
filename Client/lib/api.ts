import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Transaction APIs ────────────────────────────────────────────────

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  confidence: number;
  rawText: string;
  userId: string;
  user?: {
    name: string | null;
    email: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExtractResponse {
  success: boolean;
  transaction: Transaction;
}

export async function extractTransaction(text: string): Promise<ExtractResponse> {
  const response = await api.post<ExtractResponse>("/api/transactions/extract", { text });
  return response.data;
}

export async function getTransactions(
  cursor?: string | null,
  limit: number = 20
): Promise<TransactionListResponse> {
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;
  const response = await api.get<TransactionListResponse>("/api/transactions", { params });
  return response.data;
}

// ─── Organization APIs ───────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await api.get<Organization[]>("/api/organization");
  return response.data;
}

export default api;

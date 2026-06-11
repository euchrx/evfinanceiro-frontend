import { api } from '../api/client';

export type InvestmentType =
  | 'FIXED_INCOME'
  | 'STOCK'
  | 'CRYPTO'
  | 'FUND'
  | 'TREASURY'
  | 'OTHER';

export type InvestmentStatus = 'ACTIVE' | 'REDEEMED' | 'CANCELED';

export type Investment = {
  id: string;
  name: string;
  type: InvestmentType;
  institution?: string | null;
  investedAmount: string | number;
  currentAmount?: string | number | null;
  profitability?: string | number | null;
  investedAt: string;
  redeemedAt?: string | null;
  status: InvestmentStatus;
  notes?: string | null;
};

export type CreateInvestmentPayload = {
  name: string;
  type: InvestmentType;
  institution?: string;
  investedAmount: number;
  currentAmount?: number;
  profitability?: number;
  investedAt: string;
  notes?: string;
};

export type UpdateInvestmentPayload = Partial<CreateInvestmentPayload> & {
  redeemedAt?: string;
  status?: InvestmentStatus;
};

type PaginatedInvestments = {
  items: Investment[];
  total: number;
  page: number;
  take: number;
};

export async function listInvestments() {
  const response = await api.get<PaginatedInvestments>('/investments', {
    params: {
      take: 100,
    },
  });

  return response.data.items;
}

export async function createInvestment(payload: CreateInvestmentPayload) {
  const response = await api.post<Investment>('/investments', payload);

  return response.data;
}

export async function updateInvestment(id: string, payload: UpdateInvestmentPayload) {
  const response = await api.patch<Investment>(`/investments/${id}`, payload);

  return response.data;
}

export async function deleteInvestment(id: string) {
  await api.delete(`/investments/${id}`);
}

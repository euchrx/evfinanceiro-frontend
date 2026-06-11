import { api } from '../api/client';
import type { AccountType, FinancialAccount } from '../types/finance';

export type CreateAccountPayload = {
  name: string;
  type: AccountType;
  initialBalance: number;
};

export type UpdateAccountPayload = Partial<CreateAccountPayload> & {
  active?: boolean;
};

type PaginatedAccounts = {
  items: FinancialAccount[];
  total: number;
  page: number;
  take: number;
};

export async function listAccounts() {
  const response = await api.get<PaginatedAccounts>('/accounts', {
    params: {
      take: 100,
    },
  });

  return response.data.items;
}

export async function createAccount(payload: CreateAccountPayload) {
  const response = await api.post<FinancialAccount>('/accounts', payload);

  return response.data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload) {
  const response = await api.patch<FinancialAccount>(`/accounts/${id}`, payload);

  return response.data;
}

export async function deleteAccount(id: string) {
  await api.delete(`/accounts/${id}`);
}

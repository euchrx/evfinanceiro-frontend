import { api } from '../api/client';
import type {
  FinancialTransaction,
  TransactionStatus,
  TransactionType,
} from '../types/finance';

export type TransactionFilters = {
  type?: TransactionType | '';
  status?: TransactionStatus | '';
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
};

export type CreateTransactionPayload = {
  description: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  categoryId?: string;
  accountId: string;
  transferAccountId?: string;
  status?: TransactionStatus;
};

type PaginatedTransactions = {
  items: FinancialTransaction[];
  total: number;
  page: number;
  take: number;
};

export async function listTransactions(filters?: TransactionFilters) {
  const response = await api.get<PaginatedTransactions>('/financial-transactions', {
    params: {
      ...filters,
      type: filters?.type || undefined,
      status: filters?.status || undefined,
      take: 50,
    },
  });

  return response.data;
}

export async function createTransaction(payload: CreateTransactionPayload) {
  const response = await api.post<FinancialTransaction>(
    '/financial-transactions',
    payload,
  );

  return response.data;
}

export async function payTransaction(id: string) {
  const response = await api.patch<FinancialTransaction>(
    `/financial-transactions/${id}/pay`,
  );

  return response.data;
}

export async function cancelTransaction(id: string) {
  const response = await api.patch<FinancialTransaction>(
    `/financial-transactions/${id}/cancel`,
  );

  return response.data;
}

export async function deleteTransaction(id: string) {
  await api.delete(`/financial-transactions/${id}`);
}

export async function uploadTransactionAttachment(transactionId: string, file: File) {
  const formData = new FormData();

  formData.append('file', file);

  const response = await api.post(
    `/transaction-attachments/${transactionId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

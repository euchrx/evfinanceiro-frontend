export type CategoryType = 'INCOME' | 'EXPENSE';

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT_CARD';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELED';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color?: string | null;
  active: boolean;
};

export type FinancialAccount = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: string | number;
  active: boolean;
};

export type FinancialTransaction = {
  id: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string | number;
  transactionDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  category?: Category | null;
  account?: FinancialAccount | null;
  transferAccount?: FinancialAccount | null;
};

import { api } from '../api/client';
import type { Category, CategoryType } from '../types/finance';

export type CreateCategoryPayload = {
  name: string;
  type: CategoryType;
  color?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & {
  active?: boolean;
};

type ListCategoriesParams = {
  type?: CategoryType;
  take?: number;
};

type PaginatedCategories = {
  items: Category[];
  total: number;
  page: number;
  take: number;
};

export async function listCategories(params?: ListCategoriesParams) {
  const response = await api.get<PaginatedCategories>('/categories', {
    params: {
      take: params?.take ?? 100,
      type: params?.type,
    },
  });

  return response.data.items;
}

export async function createCategory(payload: CreateCategoryPayload) {
  const response = await api.post<Category>('/categories', payload);

  return response.data;
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload) {
  const response = await api.patch<Category>(`/categories/${id}`, payload);

  return response.data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}

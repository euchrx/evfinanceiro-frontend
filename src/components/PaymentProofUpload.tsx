import { useRef, useState } from 'react';
import {
  Camera,
  FileUp,
  Loader2,
  ReceiptText,
  X,
} from 'lucide-react';

import { api } from '../api/client';

type PaymentProofUploadProps = {
  accountId?: string | null;
  categoryId?: string | null;
  type?: 'INCOME' | 'EXPENSE';
  onCreated?: () => void;
};

type UploadResult = {
  status: 'CREATED' | 'NEEDS_REVIEW' | 'DUPLICATE';
  message: string;
  parsed: {
    amount: number | null;
    transactionDate: string | null;
    payerName: string | null;
    recipientName: string | null;
    bankName: string | null;
    pixKey: string | null;
    endToEndId: string | null;
    confidence: number;
    warnings: string[];
  };
};

function money(value: number | null) {
  if (value === null) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return '-';
  }

  return `${day}/${month}/${year}`;
}

export function PaymentProofUpload({
  accountId,
  categoryId,
  type = 'EXPENSE',
  onCreated,
}: PaymentProofUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File | null) {
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append('file', file);
      formData.append('type', type);
      formData.append('autoCreate', 'true');

      if (accountId) {
        formData.append('accountId', accountId);
      }

      if (categoryId) {
        formData.append('categoryId', categoryId);
      }

      const response = await api.post<UploadResult>(
        '/financial-transactions/payment-proof/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setResult(response.data);

      if (response.data.status === 'CREATED') {
        onCreated?.();
      }
    } catch {
      setError('Não foi possível ler o comprovante. Tente outra foto ou PDF.');
    } finally {
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <ReceiptText size={20} />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-950">
                Lançar por comprovante
              </h3>
              <p className="text-xs text-slate-500">
                Envie um PDF ou tire uma foto para o sistema identificar a movimentação.
              </p>
            </div>
          </div>
        </div>

        {result ? (
          <button
            type="button"
            onClick={() => setResult(null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          Tirar foto
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
          Anexar arquivo
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3">
            <p className="text-sm font-black text-slate-950">{result.message}</p>

            <p className="mt-1 text-xs text-slate-500">
              Confiança da leitura: {result.parsed.confidence}%
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Info label="Valor" value={money(result.parsed.amount)} />
            <Info label="Data" value={formatDate(result.parsed.transactionDate)} />
            <Info label="Pagador" value={result.parsed.payerName ?? '-'} />
            <Info label="Destinatário" value={result.parsed.recipientName ?? '-'} />
            <Info label="Banco" value={result.parsed.bankName ?? '-'} />
            <Info label="Chave Pix" value={result.parsed.pixKey ?? '-'} />
          </div>

          {result.parsed.warnings.length ? (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-700">
                Conferência necessária
              </p>

              <ul className="space-y-1 text-xs text-amber-800">
                {result.parsed.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
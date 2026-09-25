'use client';

import api, { getApiError } from '@/lib/api';
import { parseMoneyInput } from '@/lib/format';
import { DollarSign, Percent, X } from 'lucide-react';
import { useState } from 'react';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  includeFreight: boolean;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type FormState = {
  code: string;
  description: string;
  type: DiscountType;
  value: string;
  minOrderAmount: string;
  maxUses: string;
  includeFreight: boolean;
  startsAt: string;
  expiresAt: string;
};

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none';

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toFormState(discount: DiscountCode | null): FormState {
  return {
    code: discount?.code ?? '',
    description: discount?.description ?? '',
    type: discount?.type ?? 'PERCENTAGE',
    value: discount ? String(discount.value) : '',
    minOrderAmount: discount?.minOrderAmount != null ? String(discount.minOrderAmount) : '',
    maxUses: discount?.maxUses != null ? String(discount.maxUses) : '',
    includeFreight: discount?.includeFreight ?? false,
    startsAt: toLocalDatetime(discount?.startsAt ?? null),
    expiresAt: toLocalDatetime(discount?.expiresAt ?? null),
  };
}

type Props = {
  discount: DiscountCode | null;
  onClose: () => void;
  onSaved: () => void;
};

export function DiscountFormModal({ discount, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => toFormState(discount));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const field = (key: 'description' | 'value' | 'minOrderAmount' | 'maxUses' | 'startsAt' | 'expiresAt') => ({
    className: inputClass,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
  });

  async function handleSave() {
    const value = parseMoneyInput(form.value);
    if (!form.code.trim()) return setError('Informe o código do cupom.');
    if (value == null || value <= 0) return setError('Informe um valor válido.');
    if (form.type === 'PERCENTAGE' && value > 100) return setError('Percentual não pode ser maior que 100%.');

    setSaving(true);
    setError(null);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      type: form.type,
      value,
      minOrderAmount: parseMoneyInput(form.minOrderAmount),
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
      includeFreight: form.includeFreight,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      if (discount) await api.patch(`/admin/discounts/${discount.id}`, payload);
      else await api.post('/admin/discounts', payload);
      onSaved();
    } catch (e) {
      setError(getApiError(e, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  }

  const typeButton = (type: DiscountType, label: string, Icon: typeof Percent) => (
    <button
      type="button"
      onClick={() => set('type', type)}
      className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
        form.type === type ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon className="mr-1 inline h-3.5 w-3.5" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 pt-12 backdrop-blur-sm">
      <div className="mb-12 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/60">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">{discount ? 'Editar Cupom' : 'Novo Cupom'}</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Label text="Código *">
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="Ex: VERAO2026"
              maxLength={50}
            />
          </Label>
          <Label text="Descrição (interna)">
            <input {...field('description')} placeholder="Opcional — visível apenas para admins" />
          </Label>

          <div className="grid grid-cols-2 gap-4">
            <Label text="Tipo de desconto">
              <div className="mt-1 flex gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                {typeButton('PERCENTAGE', 'Percentual', Percent)}
                {typeButton('FIXED', 'Valor fixo', DollarSign)}
              </div>
            </Label>
            <Label text={`Valor ${form.type === 'PERCENTAGE' ? '(%)' : '(R$)'} *`}>
              <input {...field('value')} placeholder={form.type === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 20'} inputMode="decimal" />
            </Label>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-zinc-200"
              checked={form.includeFreight}
              onChange={(e) => set('includeFreight', e.target.checked)}
            />
            <span>
              <span className="block text-sm font-bold text-zinc-200">Aplicar também ao frete</span>
              <span className="block text-xs text-zinc-500">O desconto será calculado sobre produtos + frete.</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Label text="Valor mínimo do pedido (R$)">
              <input {...field('minOrderAmount')} placeholder="Opcional" inputMode="decimal" />
            </Label>
            <Label text="Máx. de usos (total)">
              <input {...field('maxUses')} placeholder="Ilimitado" inputMode="numeric" />
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Label text="Válido a partir de">
              <input type="datetime-local" {...field('startsAt')} />
            </Label>
            <Label text="Expira em">
              <input type="datetime-local" {...field('expiresAt')} />
            </Label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full rounded-xl bg-zinc-200 py-4 font-bold text-zinc-900 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : discount ? 'Salvar alterações' : 'Criar Cupom'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-zinc-500">{text}</label>
      {children}
    </div>
  );
}

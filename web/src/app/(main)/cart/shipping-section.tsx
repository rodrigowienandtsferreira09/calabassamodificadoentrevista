'use client';

import { formatBRL } from '@/lib/format';
import { cepDigits, formatCepDisplay, lookupCep } from '@/lib/viacep';
import { useState } from 'react';

export const DELIVERY_FEE_BRL = 15;

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export type DeliveryMethod = 'DELIVERY' | 'PICKUP';

export type Recipient = { name: string; phone: string; document: string };

export type Address = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const EMPTY_ADDRESS: Address = {
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function validateShipping(method: DeliveryMethod, recipient: Recipient, address: Address): string | null {
  if (recipient.name.trim().length < 3) return 'Informe o nome completo do destinatário (mín. 3 caracteres).';
  if (recipient.phone.trim().length < 8) return 'Informe um telefone de contato válido (mín. 8 caracteres).';
  if (method === 'PICKUP') return null;
  if (cepDigits(address.zipCode).length < 8) return 'CEP inválido. Use 8 dígitos.';
  if (address.street.trim().length < 2) return 'Informe o logradouro (rua/avenida).';
  if (!address.number.trim()) return 'Informe o número. Se for sem número, use S/N.';
  if (address.neighborhood.trim().length < 2) return 'Informe o bairro.';
  if (address.city.trim().length < 2) return 'Informe a cidade.';
  if (address.state.trim().length !== 2) return 'Selecione a UF.';
  return null;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none';

function TextField({
  label,
  value,
  onChange,
  ...inputProps
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>) {
  return (
    <div>
      <label className="text-xs font-medium uppercase text-zinc-500">{label}</label>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} {...inputProps} />
    </div>
  );
}

type Props = {
  method: DeliveryMethod;
  onMethodChange: (method: DeliveryMethod) => void;
  recipient: Recipient;
  onRecipientChange: (field: keyof Recipient, value: string) => void;
  address: Address;
  onAddressChange: (address: Address) => void;
};

export function ShippingSection({ method, onMethodChange, recipient, onRecipientChange, address, onAddressChange }: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState<string | null>(null);
  const setField = (field: keyof Address) => (value: string) => onAddressChange({ ...address, [field]: value });

  async function handleLookupCep() {
    setCepHint(null);
    setCepLoading(true);
    try {
      const result = await lookupCep(address.zipCode);
      if (!result.ok) {
        setCepHint(result.message);
        return;
      }
      onAddressChange({
        ...address,
        zipCode: formatCepDisplay(address.zipCode),
        street: result.street,
        neighborhood: result.neighborhood,
        city: result.city,
        state: result.state,
      });
      if (!result.street) setCepHint('CEP encontrado. Preencha o logradouro se estiver vazio.');
    } finally {
      setCepLoading(false);
    }
  }

  const methodButton = (value: DeliveryMethod, label: string) => (
    <button
      type="button"
      onClick={() => onMethodChange(value)}
      className={`flex-1 rounded-full py-2.5 text-xs font-bold ${
        method === value ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Entrega</p>
      <p className="mt-1 text-sm text-zinc-500">Como você prefere receber o pedido?</p>

      <div className="mt-4 flex gap-2 rounded-full border border-zinc-800 bg-zinc-950 p-1">
        {methodButton('DELIVERY', 'Entrega em endereço')}
        {methodButton('PICKUP', 'Retirada no local')}
      </div>

      <div className="mt-5 space-y-4">
        <TextField
          label="Nome do destinatário"
          value={recipient.name}
          onChange={(v) => onRecipientChange('name', v)}
          placeholder="Nome completo"
          autoComplete="name"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Telefone / WhatsApp"
            value={recipient.phone}
            onChange={(v) => onRecipientChange('phone', v)}
            placeholder="(00) 00000-0000"
            autoComplete="tel"
          />
          <TextField
            label="CPF ou CNPJ (opcional)"
            value={recipient.document}
            onChange={(v) => onRecipientChange('document', v)}
            placeholder="Opcional"
          />
        </div>
      </div>

      {method === 'DELIVERY' ? (
        <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
          <p className="text-sm font-medium text-zinc-300">Endereço de entrega</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField
                label="CEP"
                value={address.zipCode}
                onChange={(v) => setField('zipCode')(formatCepDisplay(v))}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleLookupCep()}
              disabled={cepLoading || cepDigits(address.zipCode).length !== 8}
              className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-100 disabled:opacity-40"
            >
              {cepLoading ? 'Buscando…' : 'Buscar CEP'}
            </button>
          </div>
          {cepHint && <p className="text-xs text-accent/90">{cepHint}</p>}

          <TextField
            label="Logradouro"
            value={address.street}
            onChange={setField('street')}
            placeholder="Rua, avenida…"
            autoComplete="street-address"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Número" value={address.number} onChange={setField('number')} placeholder="Nº ou S/N" />
            <TextField
              label="Complemento"
              value={address.complement}
              onChange={setField('complement')}
              placeholder="Apto, bloco, casa…"
            />
          </div>
          <TextField label="Bairro" value={address.neighborhood} onChange={setField('neighborhood')} placeholder="Bairro" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Cidade" value={address.city} onChange={setField('city')} placeholder="Cidade" />
            <div>
              <label className="text-xs font-medium uppercase text-zinc-500">UF</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={address.state}
                onChange={(e) => setField('state')(e.target.value)}
              >
                <option value="">Selecione</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Frete fixo de {formatBRL(DELIVERY_FEE_BRL)} para entrega em domicílio (valor somado ao total).
          </p>
        </div>
      ) : (
        <p className="mt-4 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
          Retirada no local, combinada com a loja após a confirmação do pagamento.
        </p>
      )}
    </section>
  );
}

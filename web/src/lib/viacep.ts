export function cepDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}

export function formatCepDisplay(digits: string): string {
  const d = cepDigits(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

type ViaCepJson = {
  erro?: boolean;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function lookupCep(
  cepRaw: string
): Promise<
  | { ok: true; street: string; neighborhood: string; city: string; state: string }
  | { ok: false; message: string }
> {
  const cep = cepDigits(cepRaw);
  if (cep.length !== 8) {
    return { ok: false, message: 'Informe o CEP com 8 dígitos.' };
  }
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = (await res.json()) as ViaCepJson;
  if (!res.ok || data.erro) {
    return { ok: false, message: 'CEP não encontrado.' };
  }
  return {
    ok: true,
    street: (data.logradouro ?? '').trim(),
    neighborhood: (data.bairro ?? '').trim(),
    city: (data.localidade ?? '').trim(),
    state: (data.uf ?? '').trim().toUpperCase().slice(0, 2),
  };
}

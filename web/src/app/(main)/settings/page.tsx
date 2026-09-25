'use client';

import api, { getApiError } from '@/lib/api';
import type { User } from '@/types';
import { useAuth } from '@/context/auth-context';
import { BarChart2, FileText, Lock, Package, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function formatDocForInput(raw: string | undefined): string {
  if (!raw) return '';
  if (raw.startsWith('DOC-')) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return raw;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    if (newPw.length < 8) {
      setPwErr('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPw !== newPw2) {
      setPwErr('As senhas novas não coincidem.');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setCurrentPw('');
      setNewPw('');
      setNewPw2('');
      await signOut();
      router.replace('/auth');
    } catch (error) {
      setPwErr(getApiError(error, 'Não foi possível alterar a senha.'));
    } finally {
      setPwLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
        <p className="text-zinc-400">Faça login para acessar as configurações.</p>
        <Link href="/auth" className="mt-4 text-zinc-100">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 pt-4 md:pb-12 md:pt-6">
      <header className="mb-8 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="text-zinc-100">
          ←
        </button>
        <h1 className="text-xl font-bold text-zinc-100 md:text-2xl">Configurações</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-10">
        <ProfileSection key={user.id} user={user} />

        <section>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Lock className="h-4 w-4" />
            Segurança
          </p>
          <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Senha atual</label>
              <input
                type="password"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Nova senha</label>
              <input
                type="password"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Confirmar nova senha</label>
              <input
                type="password"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {pwErr && <p className="text-sm text-red-400">{pwErr}</p>}
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Ao alterar a senha, você será desconectado e precisará entrar de novo em todos os dispositivos.
            </p>
            <button
              type="submit"
              disabled={pwLoading || !currentPw || !newPw}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-800 py-3.5 font-bold text-zinc-100 disabled:opacity-50"
            >
              {pwLoading ? 'Alterando…' : 'Alterar senha'}
            </button>
          </form>
        </section>

        {user.role === 'ADMIN' && (
          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Administração</p>
            <div className="space-y-3">
              <Link
                href="/admin/news"
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-zinc-100"
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-zinc-100" />
                  Notícias da home
                </span>
                <span className="text-zinc-600">›</span>
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-zinc-100"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-zinc-100" />
                  Produtos do catálogo
                </span>
                <span className="text-zinc-600">›</span>
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-zinc-100"
              >
                <span className="flex items-center gap-3">
                  <BarChart2 className="h-5 w-5 text-zinc-100" />
                  Relatórios
                </span>
                <span className="text-zinc-600">›</span>
              </Link>
            </div>
          </section>
        )}

        {user.role === 'BUYER' && (
          <p className="text-center text-xs text-zinc-600">
            Como comprador, você pode atualizar seus dados e senha acima. Pedidos em &quot;Meus pedidos&quot; no
            perfil.
          </p>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phoneNumber ?? '');
  const [document, setDocument] = useState(formatDocForInput(user.document));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const docDigits = document.replace(/\D/g, '');
      await api.patch<User>('/users/me', {
        fullName: name.trim(),
        phoneNumber: phone.trim() === '' ? null : phone.trim(),
        document: docDigits === '' ? undefined : docDigits,
      });
      await refreshUser();
      setOkMsg('Dados salvos.');
      setTimeout(() => setOkMsg(null), 3000);
    } catch (error) {
      setErr(getApiError(error, 'Falha ao salvar.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        <UserIcon className="h-4 w-4" />
        Conta — {user.role === 'ADMIN' ? 'Administrador' : 'Comprador'}
      </p>
      <form onSubmit={handleSaveProfile} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Nome</label>
          <input
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">E-mail</label>
          <input
            className="w-full cursor-not-allowed rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-500"
            value={user.email}
            readOnly
          />
          <p className="mt-1 text-[11px] text-zinc-600">O e-mail de login não pode ser alterado aqui.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Telefone / WhatsApp</label>
          <input
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
            placeholder="Ex.: 51999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">CPF ou CNPJ</label>
          <input
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
            placeholder="Somente números ou com pontuação"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {okMsg && <p className="text-sm text-emerald-400">{okMsg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-200 text-zinc-900 py-3.5 font-bold text-black disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar dados'}
        </button>
      </form>
    </section>
  );
}

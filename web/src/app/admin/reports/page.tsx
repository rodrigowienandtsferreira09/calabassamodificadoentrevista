'use client';

import { Spinner } from '@/components/spinner';
import { useApi } from '@/hooks/use-api';
import { formatBRL } from '@/lib/format';
import {
  ArrowLeft,
  Award,
  BarChart3,
  FlaskConical,
  Package,
  Shirt,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Report = {
  period: 'all' | 'month' | 'year';
  totalOrders: number;
  totalSales: number;
  ordersByStatus: {
    PENDING: number;
    PAID: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELED: number;
    REFUNDED: number;
  };
  activeProducts: { coverage: number; horses: number; apparel: number };
  inactiveProducts: { coverage: number; horses: number; apparel: number };
  totalProducts: number;
};

const PERIOD_LABELS: Record<Report['period'], string> = {
  all: 'Todo o histórico',
  month: 'Mês atual',
  year: 'Ano atual',
};

const STATUS_ROWS: { key: keyof Report['ordersByStatus']; label: string; tone: string }[] = [
  { key: 'PENDING', label: 'Pendentes', tone: 'border-accent/40 bg-accent/5 text-accent' },
  { key: 'PAID', label: 'Pagos', tone: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200' },
  { key: 'SHIPPED', label: 'Enviados', tone: 'border-sky-500/40 bg-sky-500/5 text-sky-200' },
  { key: 'DELIVERED', label: 'Entregues', tone: 'border-teal-500/40 bg-teal-500/5 text-teal-200' },
  { key: 'CANCELED', label: 'Cancelados', tone: 'border-red-500/40 bg-red-500/5 text-red-200' },
  { key: 'REFUNDED', label: 'Reembolsados', tone: 'border-violet-500/40 bg-violet-500/5 text-violet-200' },
];

export default function AdminReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Report['period']>('all');
  const { data: report, loading, reload } = useApi<Report>(`/admin/reports?period=${period}`);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Painel</p>
                <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Relatórios</h1>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500">
                  Vendas, pedidos por status e visão geral do catálogo.
                </p>
              </div>
            </div>
            <div
              className="flex shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 sm:self-start"
              role="group"
              aria-label="Período"
            >
              {(['all', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                    period === p
                      ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p === 'all' ? 'Tudo' : p === 'month' ? 'Mês' : 'Ano'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <Spinner className="py-20" />
        ) : !report ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-zinc-600" />
            <p className="mt-4 text-sm text-zinc-400">Não foi possível carregar os dados.</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 text-sm font-semibold text-brand-light hover:underline"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-center text-xs font-medium text-zinc-500">
              {PERIOD_LABELS[report.period]}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 sm:p-6">
                <div className="absolute right-4 top-4 rounded-xl bg-brand/20 p-2 text-brand-light">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vendas no período</p>
                <p className="mt-3 break-words text-2xl font-bold tabular-nums tracking-tight text-zinc-100 sm:text-3xl">
                  {formatBRL(report.totalSales)}
                </p>
                <p className="mt-2 text-sm text-zinc-500">Soma dos pedidos considerados no filtro.</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 sm:p-6">
                <div className="absolute right-4 top-4 rounded-xl bg-zinc-800 p-2 text-zinc-300">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pedidos</p>
                <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-zinc-100 sm:text-3xl">
                  {report.totalOrders}
                </p>
                <p className="mt-2 text-sm text-zinc-500">Quantidade de pedidos no período.</p>
              </div>
            </div>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Pedidos por status</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATUS_ROWS.map(({ key, label, tone }) => (
                  <div
                    key={key}
                    className={`rounded-2xl border px-4 py-3 ${tone}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">{report.ordersByStatus[key]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Catálogo</h2>
              </div>
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <p className="text-xs text-zinc-500">Total de SKUs</p>
                  <p className="text-2xl font-bold tabular-nums text-zinc-100">{report.totalProducts}</p>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-400/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Ativos na loja
                  </p>
                  <ul className="space-y-2 text-sm">
                    <CatalogLine
                      icon={FlaskConical}
                      label="Coberturas"
                      value={report.activeProducts.coverage}
                    />
                    <CatalogLine icon={Award} label="Cavalos" value={report.activeProducts.horses} />
                    <CatalogLine icon={Shirt} label="Vestuário" value={report.activeProducts.apparel} />
                  </ul>
                </div>
                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    Inativos
                  </p>
                  <ul className="space-y-2 text-sm">
                    <CatalogLine
                      icon={FlaskConical}
                      label="Coberturas"
                      value={report.inactiveProducts.coverage}
                      muted
                    />
                    <CatalogLine
                      icon={Award}
                      label="Cavalos"
                      value={report.inactiveProducts.horses}
                      muted
                    />
                    <CatalogLine
                      icon={Shirt}
                      label="Vestuário"
                      value={report.inactiveProducts.apparel}
                      muted
                    />
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogLine({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof FlaskConical;
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between rounded-xl border border-zinc-800/80 px-3 py-2.5 ${
        muted ? 'bg-zinc-950/40' : 'bg-zinc-950/60'
      }`}
    >
      <span className={`flex items-center gap-2 ${muted ? 'text-zinc-500' : 'text-zinc-300'}`}>
        <Icon className="h-4 w-4 shrink-0 opacity-70" />
        {label}
      </span>
      <span className={`font-bold tabular-nums ${muted ? 'text-zinc-500' : 'text-zinc-100'}`}>{value}</span>
    </li>
  );
}

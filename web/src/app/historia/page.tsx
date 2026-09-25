import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const PARAGRAPHS = [
  'O Haras Exemplo é uma marca fictícia, criada para demonstrar este projeto. Os textos, nomes e imagens desta página são apenas ilustrativos.',
  'A ideia do criatório é unir tradição e tecnologia: um catálogo online onde é possível conhecer os cavalos à venda, reservar coberturas dos garanhões e comprar produtos oficiais da marca, com pagamento seguro e acompanhamento do pedido até a entrega.',
  'Cada animal é apresentado com genealogia, fotos e descrição, e todo o conteúdo do site é gerenciado pelo painel administrativo, sem depender de alterações no código.',
];

export default function HistoriaPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-100">Nossa história</h1>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <img src="/story-1.svg" alt="" className="aspect-video w-full rounded-xl object-cover" />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-brand">Haras Exemplo</p>
        <div className="mt-4 space-y-4 leading-relaxed text-zinc-400">
          {PARAGRAPHS.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

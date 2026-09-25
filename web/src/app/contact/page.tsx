'use client';

import api from '@/lib/api';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';

interface AdminContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface ContactsResponse {
  platformPhone: string | null;
  admins: AdminContact[];
}

function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length <= 11 && digits.length >= 10 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export default function ContactPage() {
  const [platformPhone, setPlatformPhone] = useState<string | null>(null);
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get<ContactsResponse>('/contacts').catch(() => ({
        data: { platformPhone: null, admins: [] },
      }));
      setPlatformPhone(res.data?.platformPhone ?? null);
      setContacts(Array.isArray(res.data?.admins) ? res.data.admins : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-900 px-4 py-4">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-100">Contato</h1>
      </header>

      <div className="px-6 py-8">
        {loading ? (
          <Spinner className="py-16" />
        ) : (
          <div className="space-y-6">
            {platformPhone && (
              <a
                href={whatsappUrl(platformPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-green-800/50 bg-green-950/30 p-4 text-green-400"
              >
                <Phone className="h-6 w-6" />
                <div>
                  <p className="text-xs uppercase text-zinc-500">WhatsApp da plataforma</p>
                  <p className="font-bold">{platformPhone}</p>
                </div>
              </a>
            )}
            {contacts.map((c) => (
              <div key={c.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-bold text-zinc-100">{c.name}</p>
                <p className="text-sm text-zinc-500">{c.email}</p>
                {c.phone && (
                  <a
                    href={whatsappUrl(c.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-zinc-100"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
            {!platformPhone && contacts.length === 0 && (
              <p className="text-zinc-500">Nenhum contato cadastrado no momento.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

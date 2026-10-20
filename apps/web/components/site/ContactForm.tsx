'use client';

import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/format';
import { waLink } from '@/lib/site';
import { ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';

const TOPICS = [
  'Servis AC',
  'Perbaikan kulkas / mesin cuci / TV',
  'Bantuan pesanan',
  'Kerja sama atau proyek',
  'Lainnya',
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');

  const valid = name.trim().length >= 2 && message.trim().length >= 10;
  const composed = [
    `Halo GCC Web, saya ${name.trim() || '[nama]'}.`,
    `Topik: ${topic}.`,
    phone.trim() ? `Nomor WhatsApp: ${phone.trim()}.` : null,
    '',
    message.trim() || '[tuliskan kebutuhan Anda]',
  ]
    .filter((line) => line !== null)
    .join('\n');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    window.open(waLink(composed), '_blank', 'noopener,noreferrer');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-line bg-paper p-5 sm:p-7"
      noValidate
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="meta text-teal">Tulis pesan</p>
          <h2 className="mt-2 text-[1.3rem] font-bold tracking-[-0.02em]">
            Mulai dari WhatsApp.
          </h2>
        </div>
        <span className="ticket-code border border-line px-2 py-1 text-[0.56rem] text-muted">
          GCC — MSG
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            Nama
          </label>
          <input
            id="contact-name"
            className="field-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={100}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="field-label">
            Nomor WhatsApp{' '}
            <span className="font-normal normal-case tracking-normal">(opsional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            className="field-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0812 3456 7890"
            autoComplete="tel"
            maxLength={20}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-topic" className="field-label">
            Topik
          </label>
          <select
            id="contact-topic"
            className="field-input"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className="field-label">
            Kebutuhan Anda
          </label>
          <textarea
            id="contact-message"
            className="field-input min-h-[7rem] resize-y"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Contoh: AC kamar utama tidak dingin sejak dua hari lalu. Rumah di Tebet, bisa sore hari."
            maxLength={600}
            rows={5}
            required
          />
          <div className="flex justify-between gap-4">
            <p className="field-hint">
              Minimal 10 karakter{message.trim().length < 10 && message.length > 0 ? ' — belum cukup.' : '.'}
            </p>
            <p className="field-hint tabular">{message.length}/600</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="meta text-muted">Pratinjau pesan</p>
        <p className="mt-2 whitespace-pre-line border-l border-line pl-3 text-[0.78rem] leading-relaxed text-muted">
          {composed}
        </p>
      </div>

      <button
        type="submit"
        disabled={!valid}
        className={cn(
          'btn btn-accent mt-5 w-full sm:w-auto',
          !valid && 'cursor-not-allowed opacity-45',
        )}
      >
        <WhatsAppMark className="h-4 w-4" />
        Buka WhatsApp
        <span className="btn-icon">
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </button>

      <p className="mt-3 text-[0.68rem] leading-relaxed text-muted">
        Pesan tidak terkirim otomatis. WhatsApp akan terbuka dengan teks yang sudah
        diisi; tekan kirim di aplikasi WhatsApp Anda.
      </p>
    </form>
  );
}

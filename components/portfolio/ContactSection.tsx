'use client';

import React, { useState } from 'react';
import type { ProfileData } from '@/types/portfolio';

interface ContactSectionProps {
  profile: ProfileData;
  onOpenCvModal: () => void;
}

export default function ContactSection({ profile, onOpenCvModal }: ContactSectionProps) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    service: 'Poster / Graphic Design',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setErrorMessage(json.error || 'Could not send your brief. Please try again.');
        return;
      }

      setSubmitted(true);
      setFormState({
        name: '',
        email: '',
        service: 'Poster / Graphic Design',
        message: '',
      });
    } catch {
      setErrorMessage('Network error while submitting brief. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contact = profile.contact;

  return (
    <section id="contact" className="relative w-full py-20 border-t border-[var(--line)]">
      {/* Top Split: Heading + CV Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        <div className="lg:col-span-7">
          <span
            data-ps
            className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-2"
          >
            {'// GET IN TOUCH'}
          </span>
          <h2
            data-ps
            className="text-3xl sm:text-5xl font-black text-[var(--on-surface)] tracking-tight mb-4"
          >
            Send a project brief.
          </h2>
          <p className="text-base sm:text-lg text-[var(--on-surface-dim)] max-w-xl leading-relaxed mb-8">
            Need a poster, commercial video edit, or computer &amp; network support?
            Send a brief inquiry or contact me directly via Telegram, phone, or email.
          </p>

          <div className="flex items-center gap-3 text-xs font-mono text-[var(--on-surface-dim)]">
            <span className="w-2 h-2 rounded-full bg-[var(--acid)] pulse-dot" />
            <span>Timezone: {contact.timezone}</span>
          </div>
        </div>

        {/* Framed CV Card */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface-raised)] border-2 border-[var(--line-highlight)] hover:border-[var(--acid)] transition-all shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[var(--acid)]">
                CURRICULUM VITAE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--acid)]/15 text-[var(--acid)] font-bold">
                {profile.cvUrl ? 'R2 PDF READY' : 'SUMMARY READY'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-[var(--on-surface)] mb-2">
              {profile.cvTitle}
            </h3>
            <p className="text-xs text-[var(--on-surface-dim)] leading-relaxed mb-6">
              {profile.cvDescription}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenCvModal}
                className="flex-1 py-3 rounded-xl bg-[var(--acid)] text-black text-xs font-mono font-bold hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer shadow-md"
              >
                Preview CV
              </button>

              {profile.cvUrl ? (
                <a
                  href={profile.cvUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--line)] text-xs font-mono font-bold"
                  title="Download PDF directly"
                >
                  PDF ↓
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCvModal}
                  className="px-4 py-3 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--line)] text-xs font-mono font-bold cursor-pointer"
                  title="Open CV Modal"
                >
                  PDF ↓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Direct Channels & Interactive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-xs font-mono font-bold text-[var(--on-surface-dim)] uppercase tracking-wider mb-1">
            Direct Communication Channels
          </span>

          <a
            href={`mailto:${contact.email}`}
            className="p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--acid)] transition-all group block"
          >
            <div className="text-[10px] font-mono text-[var(--on-surface-muted)] mb-1">
              PRIMARY EMAIL
            </div>
            <div className="text-sm font-bold text-[var(--on-surface)] group-hover:text-[var(--acid)] transition-colors truncate">
              {contact.email}
            </div>
          </a>

          <a
            href={`tel:${contact.phone.replace(/\s+/g, '')}`}
            className="p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--acid)] transition-all group block"
          >
            <div className="text-[10px] font-mono text-[var(--on-surface-muted)] mb-1">
              DIRECT TELEPHONE
            </div>
            <div className="text-sm font-bold text-[var(--on-surface)] group-hover:text-[var(--acid)] transition-colors">
              {contact.phone}
            </div>
          </a>

          <a
            href={contact.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--cyan)] transition-all group block"
          >
            <div className="text-[10px] font-mono text-[var(--on-surface-muted)] mb-1">
              TELEGRAM (FASTEST RESPONSE)
            </div>
            <div className="text-sm font-bold text-[var(--on-surface)] group-hover:text-[var(--cyan)] transition-colors">
              {contact.telegram}
            </div>
          </a>

          <a
            href={contact.facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--cobalt)] transition-all group block"
          >
            <div className="text-[10px] font-mono text-[var(--on-surface-muted)] mb-1">
              FACEBOOK PROFILE
            </div>
            <div className="text-sm font-bold text-[var(--on-surface)] group-hover:text-[var(--cobalt)] transition-colors">
              {contact.facebook}
            </div>
          </a>
        </div>

        {/* Interactive Project Brief Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xl">
            <h3 className="text-xl font-bold text-[var(--on-surface)] mb-2">
              Start a project brief
            </h3>
            <p className="text-xs text-[var(--on-surface-dim)] mb-8">
              Fill out the details below and I will get back to you within 24 hours.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-[#0c1c12] border border-[#10b981] text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-xl mb-4">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Brief Received!</h4>
                <p className="text-xs text-zinc-300 max-w-sm mb-6 leading-relaxed">
                  Thank you for reaching out. Your project inquiry has been saved and I will review the specifications shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs font-mono text-red-300"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="text-xs font-mono text-[var(--on-surface-dim)] block mb-2"
                    >
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="e.g. Socheat Tan"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:border-[var(--acid)] text-sm text-[var(--on-surface)] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="text-xs font-mono text-[var(--on-surface-dim)] block mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      required
                      placeholder="e.g. contact@client.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:border-[var(--acid)] text-sm text-[var(--on-surface)] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-service"
                    className="text-xs font-mono text-[var(--on-surface-dim)] block mb-2"
                  >
                    Service Required
                  </label>
                  <select
                    id="contact-service"
                    name="service"
                    value={formState.service}
                    onChange={(e) => setFormState({ ...formState, service: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:border-[var(--acid)] text-sm text-[var(--on-surface)] outline-none transition-colors cursor-pointer"
                  >
                    <option value="Poster / Graphic Design">Poster / Graphic Design</option>
                    <option value="Video Editing & Motion">Video Editing &amp; Motion</option>
                    <option value="IT & MikroTik Support">IT &amp; MikroTik Support</option>
                    <option value="Freelance / Full-Time Role">Freelance / Full-Time Role</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="text-xs font-mono text-[var(--on-surface-dim)] block mb-2"
                  >
                    Project Scope / Message *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    rows={4}
                    placeholder="Describe your deliverables, deadlines, and technical requirements..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:border-[var(--acid)] text-sm text-[var(--on-surface)] outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ember-keycap w-full py-4 rounded-xl text-sm font-mono font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <span>TRANSMITTING BRIEF...</span>
                  ) : (
                    <>
                      <span>SUBMIT PROJECT BRIEF</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

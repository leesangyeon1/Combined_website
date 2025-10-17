'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type ContactFormProps = {
  action: string;
  nextUrl: string;
  replyEmail: string;
};

export default function ContactForm({ action, nextUrl, replyEmail }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const replyRef = useRef<HTMLInputElement | null>(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const honeypotId = useMemo(() => `hp-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') === '1' && statusRef.current) {
      statusRef.current.textContent = '✅ Sent! Thanks — I will get back to you soon.';
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    const nameValue = (nameRef.current?.value || '').trim();
    const emailValue = (emailRef.current?.value || '').trim();

    if (subjectRef.current) {
      subjectRef.current.value = nameValue ? `${nameValue} — Website Contact` : 'Website Contact';
    }
    if (replyRef.current) {
      replyRef.current.value = emailValue || replyEmail;
    }

    const statusEl = statusRef.current;
    if (statusEl) {
      statusEl.textContent = 'Sending…';
    }

    const formData = new FormData(formRef.current);
    setIsSubmitting(true);

    try {
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      });

      if (response.ok) {
        formRef.current.submit();
      } else if (statusEl) {
        statusEl.textContent = '⚠️ Failed to send. Please try again or use the email link.';
      }
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = '⚠️ Network error. Please try again or use the email link.';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      className="hero-panel p-4"
      id="contactForm"
      action={action}
      method="POST"
      noValidate
      onSubmit={handleSubmit}
    >
      <input type="text" name="_honey" id={honeypotId} style={{ display: 'none' }} aria-hidden="true" />
      <input type="hidden" name="_captcha" value="true" />
      <input type="hidden" name="_next" value={nextUrl} />
      <input type="hidden" name="_template" value="table" />
      <input ref={subjectRef} type="hidden" name="_subject" value="" />
      <input ref={replyRef} type="hidden" name="_replyto" value="" />

      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="contact-name" className="form-label text-white-50 small">
            Name
          </label>
          <input
            ref={nameRef}
            id="contact-name"
            name="name"
            className="form-control form-control-dark"
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="contact-email" className="form-label text-white-50 small">
            Email
          </label>
          <input
            ref={emailRef}
            id="contact-email"
            name="email"
            type="email"
            className="form-control form-control-dark"
            placeholder="your@example.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="contact-message" className="form-label text-white-50 small">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          className="form-control form-control-dark"
          placeholder="How can I help?"
          required
          rows={5}
        />
      </div>

      <div className="d-flex flex-wrap gap-3 align-items-center mt-4">
        <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>
        <a className="btn-ghost text-decoration-none" href={`mailto:${replyEmail}`}>
          Email instead
        </a>
      </div>

      <p ref={statusRef} id="formStatus" className="text-muted-custom small mt-3" role="status" aria-live="polite"></p>
    </form>
  );
}

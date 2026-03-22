'use client';

import { useState, type FormEvent } from 'react';
import ScrollAnimation from './ScrollAnimation';

interface FormData {
  roasteryName: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  instagram: string;
  yearFounded: string;
  heardAbout: string;
  interest: string;
  notes: string;
}

const initialData: FormData = {
  roasteryName: '',
  contactName: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  instagram: '',
  yearFounded: '',
  heardAbout: '',
  interest: '',
  notes: '',
};

export default function ApplicationForm() {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.roasteryName.trim()) newErrors.roasteryName = 'Roastery name is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section id="apply" className="px-6 py-24 md:py-32">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollAnimation>
            <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] mb-6">We got you.</h2>
            <p className="font-body text-lg text-rich-black/80 mb-8">
              Expect to hear from us within 48 hours. In the meantime, grab a cup of
              something good.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="font-mono text-sm uppercase tracking-wider text-tast-pink border-b border-tast-pink pb-0.5 hover:text-tast-red hover:border-tast-red transition-colors"
            >
              Back to top
            </a>
          </ScrollAnimation>
        </div>
      </section>
    );
  }

  return (
    <section id="apply" className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] mb-4">
            Let&apos;s Talk.
          </h2>
          <p className="font-handwritten text-tast-pink text-2xl md:text-3xl">
            Tell us about your roastery.
          </p>
        </ScrollAnimation>

        <form onSubmit={handleSubmit} noValidate>
          {/* Group 1 — The Basics */}
          <ScrollAnimation>
            <fieldset className="mb-16">
              <legend className="font-mono text-xs uppercase tracking-widest text-tast-pink mb-8">
                The Basics
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="roasteryName" className="block font-body text-sm text-rich-black/60 mb-1">
                    Roastery Name <span className="text-tast-pink">*</span>
                  </label>
                  <input
                    type="text"
                    id="roasteryName"
                    name="roasteryName"
                    required
                    value={formData.roasteryName}
                    onChange={handleChange}
                    className={`form-input ${errors.roasteryName ? 'error' : ''}`}
                    aria-invalid={!!errors.roasteryName}
                    aria-describedby={errors.roasteryName ? 'roasteryName-error' : undefined}
                  />
                  {errors.roasteryName && (
                    <p id="roasteryName-error" className="text-tast-pink text-sm mt-1" role="alert">
                      {errors.roasteryName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contactName" className="block font-body text-sm text-rich-black/60 mb-1">
                    Contact Name <span className="text-tast-pink">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    required
                    value={formData.contactName}
                    onChange={handleChange}
                    className={`form-input ${errors.contactName ? 'error' : ''}`}
                    aria-invalid={!!errors.contactName}
                    aria-describedby={errors.contactName ? 'contactName-error' : undefined}
                  />
                  {errors.contactName && (
                    <p id="contactName-error" className="text-tast-pink text-sm mt-1" role="alert">
                      {errors.contactName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block font-body text-sm text-rich-black/60 mb-1">
                    Email <span className="text-tast-pink">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-tast-pink text-sm mt-1" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block font-body text-sm text-rich-black/60 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </fieldset>
          </ScrollAnimation>

          {/* Group 2 — About Your Business */}
          <ScrollAnimation>
            <fieldset className="mb-16">
              <legend className="font-mono text-xs uppercase tracking-widest text-tast-pink mb-8">
                About Your Business
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="location" className="block font-body text-sm text-rich-black/60 mb-1">
                    Location / City, State <span className="text-tast-pink">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className={`form-input ${errors.location ? 'error' : ''}`}
                    aria-invalid={!!errors.location}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                  />
                  {errors.location && (
                    <p id="location-error" className="text-tast-pink text-sm mt-1" role="alert">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="website" className="block font-body text-sm text-rich-black/60 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://"
                    value={formData.website}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="block font-body text-sm text-rich-black/60 mb-1">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-rich-black/40 font-body">@</span>
                    <input
                      type="text"
                      id="instagram"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="form-input pl-5"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="yearFounded" className="block font-body text-sm text-rich-black/60 mb-1">
                    Year Founded
                  </label>
                  <input
                    type="number"
                    id="yearFounded"
                    name="yearFounded"
                    min="1900"
                    max="2026"
                    value={formData.yearFounded}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </fieldset>
          </ScrollAnimation>

          {/* Group 3 — Your Interest */}
          <ScrollAnimation>
            <fieldset className="mb-12">
              <legend className="font-mono text-xs uppercase tracking-widest text-tast-pink mb-8">
                Your Interest
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="heardAbout" className="block font-body text-sm text-rich-black/60 mb-1">
                    How did you hear about tāst?
                  </label>
                  <select
                    id="heardAbout"
                    name="heardAbout"
                    value={formData.heardAbout}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select one...</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Word of mouth">Word of mouth</option>
                    <option value="Trade show / event">Trade show / event</option>
                    <option value="Mill City Roasters">Mill City Roasters</option>
                    <option value="Web search">Web search</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="interest" className="block font-body text-sm text-rich-black/60 mb-1">
                    What interests you most?
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select one...</option>
                    <option value="Reaching new customers">Reaching new customers</option>
                    <option value="Consumer taste data & insights">Consumer taste data &amp; insights</option>
                    <option value="Building our brand profile">Building our brand profile</option>
                    <option value="The marketplace / direct sales">The marketplace / direct sales</option>
                    <option value="All of the above">All of the above</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block font-body text-sm text-rich-black/60 mb-1">
                    Anything else you&apos;d like us to know?
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
            </fieldset>
          </ScrollAnimation>

          {status === 'error' && (
            <div className="mb-6 p-4 bg-tast-pink/10 text-rich-black font-body text-sm" role="alert">
              Something went wrong on our end. Try again, or email us directly at{' '}
              <a href="mailto:hello@tastcoffee.co" className="text-tast-pink underline">
                hello@tastcoffee.co
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full md:w-auto px-12 py-4 bg-tast-pink text-white font-mono text-sm uppercase tracking-widest hover:bg-tast-red transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

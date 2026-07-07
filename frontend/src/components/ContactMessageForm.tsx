import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'
import { whatsappUrl, CONTACT_DIAL_CODE } from '../lib/contact'

type ContactMessageFormProps = {
  embedded?: boolean
}

export default function ContactMessageForm({ embedded = false }: ContactMessageFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const dialCode = CONTACT_DIAL_CODE

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullPhone = `${dialCode} ${phone.trim()}`
    const body = t('contact.form.whatsappBody', {
      name,
      email: email.trim() || t('contact.form.notProvided'),
      phone: fullPhone,
      message,
    })
    window.open(whatsappUrl(body), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={embedded ? '' : 'mt-12'}>
      {!embedded && (
        <h2 className="text-xl font-bold text-white mb-4 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          {t('contact.form.title')}
        </h2>
      )}
      <form
        onSubmit={handleSubmit}
        className="card-elevated p-6 md:p-8 space-y-5 border-primary/10 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div>
          <label className="label" htmlFor="contact-name">{t('contact.form.name')}</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('contact.form.namePlaceholder')}
            className="input"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="contact-email">{t('contact.form.email')}</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('contact.form.emailPlaceholder')}
              className="input"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label" htmlFor="contact-phone">{t('contact.form.phone')}</label>
            <div className="input-phone-row">
              <span className="input-phone-prefix" dir="ltr">{dialCode}</span>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder={t('contact.form.phonePlaceholder')}
                className="input input-phone"
                dir="ltr"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="contact-message">{t('contact.form.message')}</label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('contact.form.messagePlaceholder')}
            rows={5}
            className="input resize-y min-h-[120px]"
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full py-3.5 text-sm gap-2 bg-[#25D366] hover:bg-[#1fb855] border-[#25D366] shadow-[0_4px_20px_rgba(37,211,102,0.2)]">
          <MessageCircle className="w-4 h-4" />
          {t('contact.sendToSupportTeam')}
        </button>
      </form>
    </div>
  )
}

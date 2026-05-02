import { useState } from 'react'
import { X, MessageCircle, Mail, Download, Phone, AtSign, Info } from 'lucide-react'
import { useT } from '../hooks/useT'

const L = {
  en: {
    title: 'Share Document',
    subtitle: 'Choose contact details and sharing method',
    phoneLabel: 'WhatsApp Phone Number',
    phonePh: '+970 59 000 0000',
    emailLabel: 'Email Address',
    emailPh: 'client@example.com',
    downloadPdf: 'Download PDF',
    whatsapp: 'Send via WhatsApp',
    email: 'Send via Email',
    cancel: 'Cancel',
    pdfNote: 'A PDF will be downloaded. Attach it in WhatsApp after it opens.',
    emailNote: 'Opens your email client with the document details pre-filled.',
    phoneRequired: 'Enter a phone number to use WhatsApp',
    emailRequired: 'Enter an email address',
    downloading: 'Preparing PDF…',
  },
  ar: {
    title: 'مشاركة المستند',
    subtitle: 'اختر بيانات الاتصال وطريقة المشاركة',
    phoneLabel: 'رقم واتساب',
    phonePh: '+970 59 000 0000',
    emailLabel: 'البريد الإلكتروني',
    emailPh: 'client@example.com',
    downloadPdf: 'تحميل PDF',
    whatsapp: 'إرسال عبر واتساب',
    email: 'إرسال بالبريد',
    cancel: 'إلغاء',
    pdfNote: 'سيتم تحميل ملف PDF. أرفقه في واتساب بعد فتحه.',
    emailNote: 'يفتح برنامج البريد الإلكتروني مع تعبئة تفاصيل المستند.',
    phoneRequired: 'أدخل رقم هاتف لاستخدام واتساب',
    emailRequired: 'أدخل عنوان البريد الإلكتروني',
    downloading: 'جاري تحضير الـ PDF...',
  },
} as const

interface Props {
  docId: string
  docTitle: string
  defaultPhone?: string
  defaultEmail?: string
  /** Called when user confirms WhatsApp. Implementor should trigger print/download, then open wa.me */
  onWhatsApp: (phone: string) => void
  /** Called when user confirms Email. Implementor should open mailto */
  onEmail: (email: string) => void
  /** Called for a plain PDF download with no messaging */
  onDownload: () => void
  onClose: () => void
}

export default function ShareModal({
  docId, docTitle,
  defaultPhone = '', defaultEmail = '',
  onWhatsApp, onEmail, onDownload, onClose,
}: Props) {
  const t = useT(L)
  const [phone, setPhone] = useState(defaultPhone)
  const [email, setEmail] = useState(defaultEmail)
  const [phoneErr, setPhoneErr] = useState(false)
  const [emailErr, setEmailErr] = useState(false)

  function handleWhatsApp() {
    if (!phone.trim()) { setPhoneErr(true); return }
    setPhoneErr(false)
    onWhatsApp(phone.trim())
  }

  function handleEmail() {
    if (!email.trim()) { setEmailErr(true); return }
    setEmailErr(false)
    onEmail(email.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="font-semibold text-white">{t.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{docId} — {docTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Phone input */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {t.phoneLabel}
            </label>
            <input
              className={`input ${phoneErr ? 'border-red-500 focus:border-red-500' : ''}`}
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneErr(false) }}
              placeholder={t.phonePh}
              dir="ltr"
            />
          </div>

          {/* Email input */}
          <div>
            <label className="label flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5" /> {t.emailLabel}
            </label>
            <input
              className={`input ${emailErr ? 'border-red-500 focus:border-red-500' : ''}`}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailErr(false) }}
              placeholder={t.emailPh}
              dir="ltr"
            />
          </div>

          {/* Divider */}
          <hr className="border-gray-700" />

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Download only */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors text-sm font-medium"
              onClick={onDownload}
            >
              <Download className="w-5 h-5 text-gray-400 shrink-0" />
              <span>{t.downloadPdf}</span>
            </button>

            {/* WhatsApp */}
            <div>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-700/30 hover:bg-green-700/50 text-green-300 border border-green-700/50 transition-colors text-sm font-medium"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>{t.whatsapp}</span>
              </button>
              <p className="flex items-start gap-1.5 text-xs text-gray-500 mt-1.5 px-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {t.pdfNote}
              </p>
            </div>

            {/* Email */}
            <div>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-700/30 hover:bg-blue-700/50 text-blue-300 border border-blue-700/50 transition-colors text-sm font-medium"
                onClick={handleEmail}
              >
                <Mail className="w-5 h-5 shrink-0" />
                <span>{t.email}</span>
              </button>
              <p className="flex items-start gap-1.5 text-xs text-gray-500 mt-1.5 px-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {t.emailNote}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button className="btn-secondary w-full" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  )
}

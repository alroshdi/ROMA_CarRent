import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageProvider'

interface SignaturePadProps {
  onSign: (data: string) => void
}

export default function SignaturePad({ onSign }: SignaturePadProps) {
  const { t } = useTranslation()
  const sigRef = useRef<SignatureCanvas>(null)

  const clear = () => sigRef.current?.clear()

  const save = () => {
    if (sigRef.current?.isEmpty()) return
    onSign(sigRef.current!.toDataURL('image/png'))
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-roma-border rounded-lg bg-white">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{ className: 'w-full h-40 rounded-lg' }}
          backgroundColor="white"
          penColor="#0a0a0a"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="btn-secondary px-4 py-2 text-sm">
          <Eraser className="w-4 h-4" /> {t('signature.clear')}
        </button>
        <button type="button" onClick={save} className="btn-primary flex-1 py-2 text-sm">
          {t('signature.confirm')}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { useTemplatePesan, useTemplatePesanMutations, type TemplatePesan } from '@/hooks/usePengaturan'

function TemplateEditor({ tpl, placeholders, canEdit }: { tpl: TemplatePesan; placeholders: string[]; canEdit: boolean }) {
  const { save, reset, preview } = useTemplatePesanMutations()
  const [isi, setIsi] = useState(tpl.isi)
  const [pesan, setPesan] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setIsi(tpl.isi) }, [tpl.isi])

  // Pratinjau diperbarui saat mengetik (ditunda), memakai data contoh dari server
  useEffect(() => {
    const t = setTimeout(() => {
      preview.mutate(isi, {
        onSuccess: (p) => { setPesan(p); setError('') },
        onError: (e: any) => setError(e?.response?.data?.error ?? 'Template tidak valid'),
      })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isi])

  async function onSave() {
    try { await save.mutateAsync({ kode: tpl.kode, isi }); setSaved(true); setTimeout(() => setSaved(false), 1500) }
    catch (e: any) { setError(e?.response?.data?.error ?? 'Gagal menyimpan') }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">{tpl.nama}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <textarea
            value={isi} onChange={(e) => setIsi(e.target.value)} disabled={!canEdit} rows={12}
            aria-label={`Isi template ${tpl.nama}`}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
          />
          <p className="mt-1 text-xs text-gray-400">
            Placeholder: {placeholders.map((p) => <code key={p} className="mr-1.5 px-1 bg-gray-100 rounded">{`{{${p}}}`}</code>)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Pratinjau (data contoh)</p>
          <pre className="whitespace-pre-wrap text-sm bg-green-50 border border-green-100 rounded-lg p-3 min-h-[12rem] font-sans">{pesan}</pre>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {canEdit && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button type="button" disabled={reset.isPending}
            onClick={() => { if (confirm('Kembalikan template ke teks bawaan?')) reset.mutate(tpl.kode) }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
            <RotateCcw size={14} /> Kembalikan ke bawaan
          </button>
          <button type="button" onClick={onSave} disabled={save.isPending || !!error || isi === tpl.isi}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
            {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>
      )}
    </div>
  )
}

export function TemplatePesanTab({ canEdit }: { canEdit: boolean }) {
  const { data, isLoading } = useTemplatePesan()
  if (isLoading || !data) return <div className="py-10 text-center text-gray-400"><Loader2 className="animate-spin inline" /></div>
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Pesan WhatsApp yang dikirim saat akun dibuat atau passwordnya direset. Alamat portal saat ini:{' '}
        <code className="px-1 bg-gray-100 rounded">{data.urlPortal}</code>
      </p>
      {data.templates.map((t) => <TemplateEditor key={t.kode} tpl={t} placeholders={data.placeholders} canEdit={canEdit} />)}
    </div>
  )
}

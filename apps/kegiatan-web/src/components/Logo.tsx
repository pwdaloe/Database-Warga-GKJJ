import clsx from 'clsx'

/** Logo GKJ dalam lingkaran putih (logo berlatar putih dan biru, tetap terbaca di atas header biru tua). */
export function Logo({ ukuran = 40, className }: { ukuran?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-gkj.jpg"
      alt="Logo GKJ"
      width={ukuran}
      height={ukuran}
      className={clsx('shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm', className)}
      style={{ width: ukuran, height: ukuran }}
    />
  )
}

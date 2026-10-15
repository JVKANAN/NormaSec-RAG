type Props = { n: number; onClick: (n: number) => void }

export function Citation({ n, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(n)}
      aria-label={`Ver evidência ${n}`}
      className="mx-1 inline-flex h-[22px] min-w-[22px] -translate-y-px items-center justify-center rounded-md bg-brand-soft px-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
    >
      {n}
    </button>
  )
}

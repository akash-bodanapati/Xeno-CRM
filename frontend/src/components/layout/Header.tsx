interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex flex-col justify-center border-b bg-white px-6 py-3.5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <span className="text-sm text-slate-400">Brew &amp; Bean</span>
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}

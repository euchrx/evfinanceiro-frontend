type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen px-5 py-7 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-violet-600">EvFinanceiro</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Esta tela será implementada na próxima etapa.
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

type ServiceUnavailablePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServiceUnavailablePage({ searchParams }: ServiceUnavailablePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const ref = typeof params?.ref === "string" ? params.ref : undefined;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Service unavailable</h1>
      <p className="text-slate-700">
        We could not reach authentication storage. Please retry in a moment.
      </p>
      {ref ? <p className="text-sm text-slate-500">Reference: {ref}</p> : null}
      <p className="text-sm">
        <Link className="font-medium text-slate-900 underline" href="/">
          Retry
        </Link>
      </p>
    </main>
  );
}

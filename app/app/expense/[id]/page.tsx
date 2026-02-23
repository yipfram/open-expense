import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReceiptPreview } from "@/app/app/expense/[id]/receipt-preview";
import { getExpenseDetailForViewer } from "@/src/lib/expenses";
import { ExpenseError } from "@/src/lib/expense-errors";
import { getUserRoles } from "@/src/lib/roles";
import { requireSession } from "@/src/lib/session";

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const session = await requireSession();
  const roles = await getUserRoles(session.user);
  const { id } = await params;
  let expense: Awaited<ReturnType<typeof getExpenseDetailForViewer>>;

  try {
    expense = await getExpenseDetailForViewer({
      expenseId: id,
      viewerUserId: session.user.id,
      viewerRoles: roles,
    });
  } catch (error) {
    if (error instanceof ExpenseError) {
      if (error.status === 404) {
        notFound();
      }

      if (error.status === 403) {
        redirect("/forbidden");
      }
    }

    throw error;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-4 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{expense.category}</h1>
        <p className="text-sm text-slate-600">Expense {expense.publicId}</p>
      </header>

      {expense.receipt && expense.receipt.mimeType.startsWith("image/") ? (
        <ReceiptPreview src={`/api/expenses/${expense.id}/receipt`} alt={`Receipt ${expense.publicId}`} />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-600">Date</dt>
            <dd className="text-slate-900">{new Date(expense.expenseDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Amount</dt>
            <dd className="text-slate-900">
              {(expense.amountMinor / 100).toFixed(2)} {expense.currencyCode}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Status</dt>
            <dd className="text-slate-900">{expense.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Payment method</dt>
            <dd className="text-slate-900">{expense.paymentMethod}</dd>
          </div>
          {expense.departmentId ? (
            <div>
              <dt className="font-medium text-slate-600">Department ID</dt>
              <dd className="break-all text-slate-900">{expense.departmentId}</dd>
            </div>
          ) : null}
          {expense.projectId ? (
            <div>
              <dt className="font-medium text-slate-600">Project ID</dt>
              <dd className="break-all text-slate-900">{expense.projectId}</dd>
            </div>
          ) : null}
          {expense.comment ? (
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-600">Comment</dt>
              <dd className="whitespace-pre-wrap text-slate-900">{expense.comment}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {expense.receipt ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Receipt file</h2>
          <p className="mt-2 break-all text-sm text-slate-700">{expense.receipt.originalFilename}</p>
          <p className="text-xs text-slate-600">
            {expense.receipt.mimeType} - {Math.ceil(expense.receipt.sizeBytes / 1024)} KB
          </p>
          <p className="mt-3">
            <a
              className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              href={`/api/expenses/${expense.id}/receipt?download=1`}
            >
              Download receipt
            </a>
          </p>
        </section>
      ) : null}

      <p className="text-sm">
        <Link className="font-medium text-slate-900 underline" href="/app?view=member">
          Back to workspace
        </Link>
      </p>
    </main>
  );
}

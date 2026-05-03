import { redirect } from "next/navigation";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default function PaymentsCallbackAliasPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }
  const q = params.toString();
  redirect(`/payment/callback${q ? `?${q}` : ""}`);
}

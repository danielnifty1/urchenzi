import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const keys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ] as const;

  const vars: Record<string, { present: boolean; length: number }> = {};
  for (const k of keys) {
    const v = process.env[k];
    vars[k] = { present: Boolean(v && String(v).trim().length > 0), length: v?.length ?? 0 };
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const domainMatchesProject =
    Boolean(projectId && authDomain) && authDomain.includes(projectId);

  return NextResponse.json({
    ok: Object.values(vars).every((x) => x.present),
    vars,
    domainMatchesProjectId: domainMatchesProject,
    hint: domainMatchesProject
      ? "authDomain contains projectId — good."
      : "authDomain should look like: YOUR_PROJECT_ID.firebaseapp.com and include your projectId.",
    identityToolkitUrl: projectId
      ? `https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=${projectId}`
      : null,
  });
}

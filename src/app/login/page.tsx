import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen">
      <LoginForm />
      <footer className="border-t border-line bg-paper px-5 py-4 text-center text-[11.5px] leading-relaxed text-ink-500">
        <p>Open Source oleh MZF - 2026 · Sistem Manajemen Panti Asuhan Harapan Bangsa</p>
        <p>
          Aplikasi gratis &amp; bebas iklan ·{" "}
          <a href="/source-code.zip" download className="font-semibold text-brand-700 hover:underline">
            Unduh source code
          </a>{" "}
          ·{" "}
          <a
            href="https://trakteer.id/perpus_opera/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-700 hover:underline"
          >
            Traktir kopi
          </a>
        </p>
      </footer>
    </div>
  );
}

import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <main className="auth-page">
      <section className="auth-intro" aria-label="Fabriq introduction">
        <p className="context-line">Fabriq · дискретно-событийная модель производства</p>
        <div className="auth-word">
          Make
          <br />
          flow
          <br />
          visible.
        </div>
        <p>Моделируйте очередь, поломки и выпуск до того, как они станут стоимостью.</p>
      </section>
      <section className="auth-panel">
        <AuthForm />
      </section>
    </main>
  );
}

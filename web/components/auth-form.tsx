"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Не удалось войти. Проверьте данные и повторите.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-panel-inner">
      <p className="eyebrow">Production simulation workspace</p>
      <h1 className="page-title">{mode === "login" ? "Войти" : "Создать доступ"}</h1>
      <p className="lede">Сценарии, расчёты и история запусков в одном рабочем контуре.</p>
      <form className="form" onSubmit={submit}>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input autoComplete="email" className="input" id="email" name="email" required type="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="input"
            id="password"
            minLength={10}
            name="password"
            required
            type="password"
          />
          <p className="field-help">Минимум 10 символов. Вставка и менеджеры паролей поддерживаются.</p>
        </div>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
      <p className="auth-switch">
        {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
        <button
          className="text-link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          type="button"
        >
          {mode === "login" ? "Зарегистрироваться" : "Войти"}
        </button>
      </p>
    </div>
  );
}

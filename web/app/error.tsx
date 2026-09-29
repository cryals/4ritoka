"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="main">
      <section className="hero">
        <div>
          <h1 className="display">
            Поток
            <br />
            прерван.
          </h1>
        </div>
        <div>
          <p>Не удалось загрузить экран. Повторите запрос.</p>
          <button className="button button-primary" onClick={reset} type="button">
            Повторить
          </button>
        </div>
      </section>
    </main>
  );
}

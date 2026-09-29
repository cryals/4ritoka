import Link from "next/link";

export default function NotFound() {
  return (
    <main className="main">
      <section className="hero">
        <div>
          <p className="eyebrow">404 / not found</p>
          <h1 className="display">
            Здесь
            <br />
            ничего.
          </h1>
        </div>
        <Link className="button button-primary" href="/dashboard">
          Вернуться в обзор
        </Link>
      </section>
    </main>
  );
}

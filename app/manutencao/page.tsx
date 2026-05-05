import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Em Manutenção | Pousada Xangrilá',
  description: 'Estamos realizando melhorias. Voltamos em breve!',
  robots: { index: false, follow: false },
};

export default function ManutencaoPage() {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Lato', sans-serif;
            background-color: #0d1f1a;
            color: #f5f0e8;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180, 140, 60, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(34, 85, 60, 0.25) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }

          .container {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 2rem;
            max-width: 560px;
            animation: fadeIn 1s ease both;
          }

          .icone-wrapper {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: rgba(180, 140, 60, 0.12);
            border: 1px solid rgba(180, 140, 60, 0.35);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulso 3s ease-in-out infinite;
          }

          .icone-wrapper svg {
            width: 36px;
            height: 36px;
            color: #c9a84c;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .linha-decorativa {
            width: 48px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c9a84c, transparent);
            margin: 1.5rem auto;
          }

          .nome-pousada {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.1rem, 3vw, 1.3rem);
            font-weight: 400;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #c9a84c;
            margin-bottom: 1.5rem;
          }

          h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(2rem, 6vw, 2.8rem);
            font-weight: 700;
            line-height: 1.2;
            color: #f5f0e8;
            margin-bottom: 1rem;
          }

          .subtitulo {
            font-size: clamp(0.95rem, 2.5vw, 1.05rem);
            font-weight: 300;
            color: rgba(245, 240, 232, 0.65);
            line-height: 1.7;
            margin-bottom: 2.5rem;
          }

          .card-contato {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(201, 168, 76, 0.2);
            border-radius: 12px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
          }

          .card-contato p {
            font-size: 0.85rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(245, 240, 232, 0.45);
            margin-bottom: 0.75rem;
          }

          .contato-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #c9a84c;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 400;
            transition: opacity 0.2s;
          }

          .contato-link:hover { opacity: 0.75; }

          .contato-link svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .rodape {
            font-size: 0.78rem;
            color: rgba(245, 240, 232, 0.25);
            letter-spacing: 0.05em;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulso {
            0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.15); }
            50%       { box-shadow: 0 0 0 12px rgba(201, 168, 76, 0); }
          }
        `}</style>
      </head>
      <body>
        <div className="container">

          <div className="icone-wrapper">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>

          <p className="nome-pousada">Pousada Xangrilá</p>

          <h1>Voltamos<br />em breve</h1>

          <div className="linha-decorativa" />

          <p className="subtitulo">
            Estamos realizando melhorias para oferecer<br />
            uma experiência ainda melhor para você.<br />
            Agradecemos sua compreensão.
          </p>

          <div className="card-contato">
            <p>Para reservas ou informações</p>
            <a
              href="https://wa.me/5598991178982"
              className="contato-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              (98) 98117-8982
            </a>
          </div>

          <p className="rodape">Morros, Maranhão — Brasil</p>

        </div>
      </body>
    </html>
  );
}

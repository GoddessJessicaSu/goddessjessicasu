export default function SignatureLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Goddess Jessica Su"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8942a" />
          <stop offset="25%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#e8d48b" />
          <stop offset="75%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#b8942a" />
        </linearGradient>
      </defs>

      {/* "Goddess" - elegant cursive */}
      <path
        d="M12 38 C12 38, 8 18, 22 14 C30 11, 34 20, 30 30 C26 40, 18 44, 18 44
           C18 44, 26 42, 30 34 C32 29, 36 22, 42 22 C46 22, 44 30, 40 36 C38 40, 34 42, 34 42"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* o */}
      <path
        d="M42 34 C42 28, 50 26, 52 30 C54 34, 50 40, 44 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* dd */}
      <path
        d="M52 36 C52 30, 58 28, 60 32 C62 36, 58 40, 54 38
           M60 18 L58 38
           M62 36 C62 30, 68 28, 70 32 C72 36, 68 40, 64 38
           M70 18 L68 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* e */}
      <path
        d="M72 33 C78 31, 80 28, 76 28 C72 28, 70 34, 74 38 C76 40, 80 38, 82 36"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* ss */}
      <path
        d="M82 30 C86 28, 88 32, 84 34 C80 36, 86 40, 90 38
           M90 30 C94 28, 96 32, 92 34 C88 36, 94 40, 98 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* "Jessica" - elegant cursive, slightly larger and flowing */}
      {/* J - large decorative capital */}
      <path
        d="M112 16 C112 16, 118 14, 120 16 C120 16, 118 16, 116 18
           M116 18 L114 38 C112 46, 106 48, 104 44"
        stroke="url(#goldGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* e */}
      <path
        d="M120 33 C126 31, 128 28, 124 28 C120 28, 118 34, 122 38 C124 40, 128 38, 130 36"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* ss */}
      <path
        d="M130 30 C134 28, 136 32, 132 34 C128 36, 134 40, 138 38
           M138 30 C142 28, 144 32, 140 34 C136 36, 142 40, 146 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* i */}
      <path
        d="M148 28 L146 38 M148 24 L148.5 24.5"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* c */}
      <path
        d="M156 30 C152 28, 150 32, 152 36 C154 40, 158 38, 160 36"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* a */}
      <path
        d="M166 30 C162 28, 158 32, 162 36 C164 38, 168 36, 168 32 L166 40"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* "Su" - elegant cursive */}
      {/* S - decorative capital */}
      <path
        d="M180 18 C188 14, 194 18, 190 24 C186 30, 178 28, 180 34 C182 40, 192 42, 196 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* u */}
      <path
        d="M198 28 C196 36, 198 40, 202 38 L204 28 C202 36, 204 40, 210 38"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Decorative flourish swash under the text */}
      <path
        d="M30 52 C30 52, 20 56, 14 54 C8 52, 6 48, 12 46
           M30 52 C60 50, 120 48, 200 50 C220 51, 210 56, 190 54"
        stroke="url(#goldGrad)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Second decorative line */}
      <path
        d="M50 56 C80 54, 140 53, 180 55"
        stroke="url(#goldGrad)"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

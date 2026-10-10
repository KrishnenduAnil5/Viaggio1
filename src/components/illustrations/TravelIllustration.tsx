import React from 'react';

interface TravelIllustrationProps {
  className?: string;
}

export const TravelIllustration: React.FC<TravelIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`relative w-full select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 640 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[420px]"
        aria-label="Illustration of a traveler with a suitcase embarking on a journey"
        role="img"
      >
        <defs>
          <style>{`
            @keyframes walkBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(1.2deg); }
            }
            @keyframes legStepLeft {
              0%, 100% { transform: rotate(-8deg); }
              50% { transform: rotate(10deg); }
            }
            @keyframes legStepRight {
              0%, 100% { transform: rotate(10deg); }
              50% { transform: rotate(-8deg); }
            }
            @keyframes scarfFlutter {
              0%, 100% { transform: rotate(0deg) skewX(0deg); }
              50% { transform: rotate(-4deg) skewX(-3deg); }
            }
            @keyframes suitcaseSway {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-3px) rotate(-3deg); }
            }
            @keyframes cloudDriftSlow {
              0% { transform: translateX(0px); }
              50% { transform: translateX(18px); }
              100% { transform: translateX(0px); }
            }
            @keyframes planeGlide {
              0% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(14px, -6px) rotate(2deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            @keyframes pinBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }

            .anim-traveller {
              animation: walkBob 2.8s ease-in-out infinite;
              transform-origin: 320px 290px;
            }
            .anim-scarf {
              animation: scarfFlutter 2.4s ease-in-out infinite;
              transform-origin: 290px 185px;
            }
            .anim-suitcase {
              animation: suitcaseSway 2.8s ease-in-out infinite;
              transform-origin: 230px 270px;
            }
            .anim-cloud-1 {
              animation: cloudDriftSlow 12s ease-in-out infinite;
            }
            .anim-cloud-2 {
              animation: cloudDriftSlow 16s ease-in-out infinite reverse;
            }
            .anim-plane {
              animation: planeGlide 6s ease-in-out infinite;
            }
            .anim-pin {
              animation: pinBounce 3.2s ease-in-out infinite;
              transform-origin: 510px 245px;
            }

            @media (prefers-reduced-motion: reduce) {
              .anim-traveller,
              .anim-scarf,
              .anim-suitcase,
              .anim-cloud-1,
              .anim-cloud-2,
              .anim-plane,
              .anim-pin {
                animation: none !important;
              }
            }
          `}</style>
        </defs>

        {/* --- SKY & DRIFTING MINIMAL CLOUDS --- */}
        <g className="anim-cloud-1" opacity="0.85">
          <path
            d="M 110 95 C 110 82 122 72 136 72 C 142 62 156 55 172 55 C 193 55 210 68 214 85 C 224 85 232 93 232 102 C 232 112 223 118 212 118 L 126 118 C 117 118 110 108 110 95 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle cloud detail lines */}
          <path d="M 138 88 C 144 80 156 76 168 78" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        <g className="anim-cloud-2" opacity="0.75">
          <path
            d="M 440 120 C 440 110 450 102 462 102 C 468 94 480 88 494 88 C 511 88 525 98 528 112 C 536 112 542 118 542 126 C 542 134 535 138 526 138 L 452 138 C 445 138 440 130 440 120 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* --- PAPER AIRPLANE WITH DASHED TRAIL --- */}
        <g className="anim-plane">
          <path
            d="M 80 210 Q 140 180 200 130 T 360 80"
            stroke="#77716B"
            strokeWidth="1.2"
            strokeDasharray="4 5"
            fill="none"
          />
          {/* Minimal folded origami airplane */}
          <g transform="translate(360, 75) rotate(-12) scale(0.9)">
            <polygon points="0,0 26,-7 14,14" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" strokeLinejoin="round" />
            <polygon points="14,14 26,-7 8,2" fill="#F7F1E9" stroke="#111111" strokeWidth="1.4" strokeLinejoin="round" />
            <line x1="0" y1="0" x2="26" y2="-7" stroke="#111111" strokeWidth="1.4" />
          </g>
        </g>

        {/* --- HORIZONTAL TRAVEL ROUTE LINE & MILESTONES --- */}
        {/* Ground baseline */}
        <line x1="40" y1="310" x2="600" y2="310" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
        
        {/* Subtle horizontal secondary dash line */}
        <line x1="70" y1="322" x2="570" y2="322" stroke="#EAE5DF" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Route milestone ticks */}
        <circle cx="100" cy="310" r="3.5" fill="#111111" />
        <circle cx="210" cy="310" r="3" fill="#EAE5DF" stroke="#111111" strokeWidth="1.5" />
        <circle cx="510" cy="310" r="4" fill="#111111" />

        {/* Destination Location Marker at right */}
        <g className="anim-pin">
          {/* Subtle dashed beacon pulse */}
          <ellipse cx="510" cy="310" rx="14" ry="4" stroke="#D8E6D5" strokeWidth="2" fill="none" strokeDasharray="3 3" />
          {/* Pin */}
          <path
            d="M 510 248 C 501 248 494 255 494 264 C 494 278 510 298 510 298 C 510 298 526 278 526 264 C 526 255 519 248 510 248 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="510" cy="263" r="4" fill="#111111" />
          {/* Small flag / label */}
          <text x="500" y="238" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="600" fill="#77716B">GATE 01</text>
        </g>

        {/* Small retro distance milestone signpost at left */}
        <g transform="translate(85, 260)">
          <line x1="15" y1="50" x2="15" y2="10" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
          <path d="M 5 10 L 25 10 L 32 18 L 25 26 L 5 26 Z" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" strokeLinejoin="round" />
          <text x="9" y="21" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="8" fontWeight="700" fill="#111111">KM 0</text>
        </g>

        {/* --- TRAVELLER CHARACTER & SUITCASE --- */}
        <g className="anim-traveller">
          {/* Shadow beneath feet & suitcase */}
          <ellipse cx="320" cy="312" rx="36" ry="4" fill="#111111" opacity="0.12" />
          <ellipse cx="236" cy="312" rx="16" ry="3.5" fill="#111111" opacity="0.1" />

          {/* TRAVELLER BODY */}
          {/* Back Leg (Left) */}
          <g>
            <path
              d="M 312 250 L 302 284 L 292 309 L 304 310"
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Front Leg (Right - stepping forward) */}
          <g>
            <path
              d="M 326 250 L 334 282 L 344 309 L 356 310"
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Trench Coat Body */}
          <path
            d="M 302 188 C 298 200 292 230 286 256 C 298 259 332 258 344 252 C 340 230 334 200 330 188 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Coat buttons & belt crease */}
          <line x1="316" y1="192" x2="313" y2="256" stroke="#111111" strokeWidth="1.4" />
          <circle cx="317" cy="204" r="1.8" fill="#111111" />
          <circle cx="316" cy="220" r="1.8" fill="#111111" />
          <circle cx="315" cy="236" r="1.8" fill="#111111" />
          
          {/* Subtle pocket line */}
          <path d="M 326 226 L 334 228" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />

          {/* Head & Beret / Travel Hat */}
          {/* Neck */}
          <path d="M 312 178 L 314 186 M 320 178 L 320 186" stroke="#111111" strokeWidth="2" />
          
          {/* Face profile */}
          <path
            d="M 314 164 C 314 157 322 154 328 158 C 333 162 334 168 333 172 C 330 176 322 177 318 175"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Eye profile */}
          <circle cx="327" cy="164" r="1.2" fill="#111111" />
          {/* Playful smile / cheek */}
          <path d="M 326 170 Q 329 171 331 169" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" />

          {/* Travel Cap / Beret */}
          <path
            d="M 310 158 C 312 149 324 144 336 146 C 342 147 344 153 340 157 C 334 160 318 162 310 158 Z"
            fill="#111111"
          />
          <circle cx="325" cy="144" r="2" fill="#111111" />

          {/* Flowing Scarf in wind */}
          <g className="anim-scarf">
            {/* Scarf knot around collar */}
            <path
              d="M 308 184 C 314 180 324 180 328 184 C 326 190 314 191 308 184 Z"
              fill="#E5EDF4"
              stroke="#111111"
              strokeWidth="2"
            />
            {/* Trailing scarf tails fluttering backwards */}
            <path
              d="M 308 184 C 294 182 278 186 264 180 C 254 176 248 184 256 190 C 274 194 290 190 306 189"
              fill="#E5EDF4"
              stroke="#111111"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Scarf fringe ticks */}
            <line x1="248" y1="184" x2="242" y2="183" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="250" y1="187" x2="243" y2="188" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Arm pulling suitcase */}
          <path
            d="M 310 194 L 280 216 L 246 252"
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Front Arm (bent gracefully or holding map) */}
          <path
            d="M 324 196 L 338 214 L 350 210"
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Folded Passport / Boarding Pass in front hand */}
          <g transform="translate(350, 204) rotate(15)">
            <rect x="0" y="0" width="12" height="16" rx="1.5" fill="#D8E6D5" stroke="#111111" strokeWidth="1.4" />
            <line x1="2" y1="4" x2="10" y2="4" stroke="#111111" strokeWidth="1" />
            <line x1="2" y1="8" x2="8" y2="8" stroke="#111111" strokeWidth="1" />
          </g>

          {/* VINTAGE SUITCASE (Bobs with movement) */}
          <g className="anim-suitcase">
            {/* Suitcase Handle extending to hand */}
            <path
              d="M 246 252 L 236 264"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Suitcase Box */}
            <rect
              x="210"
              y="262"
              width="50"
              height="38"
              rx="4"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2"
            />
            {/* Leather Straps */}
            <line x1="222" y1="262" x2="222" y2="300" stroke="#111111" strokeWidth="1.5" />
            <line x1="248" y1="262" x2="248" y2="300" stroke="#111111" strokeWidth="1.5" />
            {/* Brass corner brackets */}
            <path d="M 210 268 L 216 268 L 216 262" stroke="#111111" strokeWidth="1.2" fill="none" />
            <path d="M 260 268 L 254 268 L 254 262" stroke="#111111" strokeWidth="1.2" fill="none" />
            <path d="M 210 294 L 216 294 L 216 300" stroke="#111111" strokeWidth="1.2" fill="none" />
            <path d="M 260 294 L 254 294 L 254 300" stroke="#111111" strokeWidth="1.2" fill="none" />
            {/* Travel sticker on suitcase */}
            <circle cx="235" cy="281" r="5.5" fill="#D8E6D5" stroke="#111111" strokeWidth="1.2" />
            <text x="232" y="283" fontFamily="sans-serif" fontSize="5" fontWeight="bold" fill="#111111">V</text>
            {/* Rolling wheels */}
            <circle cx="218" cy="302" r="3" fill="#111111" />
            <circle cx="252" cy="302" r="3" fill="#111111" />
          </g>
        </g>

        {/* Small flying bird silhouette in distant background */}
        <path
          d="M 470 70 Q 476 64 482 70 Q 488 64 494 70"
          stroke="#77716B"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 488 80 Q 493 75 498 80 Q 503 75 508 80"
          stroke="#77716B"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

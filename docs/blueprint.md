# **App Name**: EdgeCipher

## Core Features:

- View Selector: Initial full-screen view selector with cards for Public Website and Admin App.
- Public Website View: Landing page view, accessible from the view selector.
- Admin App Placeholder View: Placeholder view with a 'Coming Soon' message, accessible from the view selector.
- View Persistence: Store the last chosen view in localStorage under the key 'ec_view' to auto-open on reload.
- View Switcher: Small link/button labeled 'Switch view' that clears 'ec_view' and returns to the view selector.

## Style Guidelines:

- Main background: Dark gradient from #050816 to #050b14 for a crypto-style feel.
- Elevated background: Slightly lighter than main background
- Main text: Off-white (#e4e4e7) for readability.
- Accent: Choose a bright color (avoid pure green); HSL 69, 90%, 54% converts to a good green (#23E036), or consider similar colors. Should strongly contrast background.
- Accent Soft: A softened, desaturated, lighter/darker version of the accent color.
- Font: 'Inter', a grotesque-style sans-serif, for headlines and body text
- Full viewport layout with Tailwind utility classes consistent with the dark theme (e.g., bg-slate-950, bg-slate-900, text-slate-50).
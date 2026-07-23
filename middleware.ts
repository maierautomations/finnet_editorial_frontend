import { NextResponse, type NextRequest } from "next/server";

// Zugriffsschutz fuer das Deployment: ein gemeinsames Redaktions-Passwort per Basic Auth.
// Greift nur, wenn STUDIO_PASSWORT gesetzt ist (auf Vercel), lokal ohne die Variable
// bleibt alles offen. Bewusst kein Auth-Provider und keine Nutzerverwaltung, nur ein
// Shared Secret; der Browser fragt einmal nach und schickt die Kennung danach von
// selbst bei jedem Request mit, auch bei den fetch-Aufrufen an /api.
export function middleware(request: NextRequest) {
  const passwort = process.env.STUDIO_PASSWORT;
  if (!passwort) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const entschluesselt = atob(header.slice(6));
      // Format "nutzer:passwort", der Nutzername ist frei waehlbar und egal
      const trenner = entschluesselt.indexOf(":");
      const eingabe = trenner >= 0 ? entschluesselt.slice(trenner + 1) : "";
      if (eingabe === passwort) {
        return NextResponse.next();
      }
    } catch {
      // kaputter Base64-Header, wie fehlender Header behandeln
    }
  }

  return new NextResponse("Zugriff nur mit Redaktions-Passwort", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="EI Studio"' },
  });
}

export const config = {
  // Statische Assets bleiben frei, alles andere inklusive /api ist geschuetzt
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

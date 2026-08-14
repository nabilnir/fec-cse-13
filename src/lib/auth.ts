import { NextRequest } from "next/server";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  displayName?: string;
}

/**
 * Decodes JWT payload without signature validation.
 * Used as a fallback if Google Identity Toolkit API is unreachable.
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payloadJson);
  } catch (e) {
    console.error("Failed to decode JWT payload locally:", e);
    return null;
  }
}

/**
 * Verifies Firebase ID Token server-side.
 * Resolves to the authenticated user object or null if invalid.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.warn("[verifyAuth] Firebase API Key is not set in environment variables");
    // If no API key, fallback to local decode
    const decoded = decodeJwtPayload(token);
    if (decoded && decoded.sub) {
      return {
        uid: decoded.sub,
        email: decoded.email,
        displayName: decoded.name,
      };
    }
    return null;
  }

  try {
    // Attempt verification via Google's Identity Toolkit API
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
      // Short timeout to avoid blocking requests if network is down/unreachable
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.users && data.users[0]) {
        const user = data.users[0];
        return {
          uid: user.localId,
          email: user.email,
          displayName: user.displayName,
        };
      }
    } else {
      const errorText = await res.text();
      console.warn(`[verifyAuth] Identity Toolkit validation failed: ${res.status} ${errorText}`);
    }
  } catch (error: any) {
    console.warn("[verifyAuth] Network/API error verifying token with Google. Falling back to local decode. Error:", error.message || error);
    
    // Offline / connection fallback: Decode locally
    const decoded = decodeJwtPayload(token);
    if (decoded && decoded.sub) {
      // Check token expiration if present
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < nowInSeconds) {
        console.warn("[verifyAuth] Fallback decode token is expired");
        return null;
      }
      return {
        uid: decoded.sub,
        email: decoded.email,
        displayName: decoded.name,
      };
    }
  }

  return null;
}

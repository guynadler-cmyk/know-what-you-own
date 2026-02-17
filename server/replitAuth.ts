// // Referenced from Replit Auth blueprint
// import * as client from "openid-client";
// import { Strategy, type VerifyFunction } from "openid-client/passport";

// import passport from "passport";
// import session from "express-session";
// import type { Express, RequestHandler } from "express";
// import memoize from "memoizee";
// import connectPg from "connect-pg-simple";
// import { storage } from "./storage";

// const getOidcConfig = memoize(
//   async () => {
//     return await client.discovery(
//       new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
//       process.env.REPL_ID!
//     );
//   },
//   { maxAge: 3600 * 1000 }
// );

// export function getSession() {
//   const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
//   const pgStore = connectPg(session);
//   const sessionStore = new pgStore({
//     conString: process.env.DATABASE_URL,
//     createTableIfMissing: false,
//     ttl: sessionTtl,
//     tableName: "sessions",
//   });
//   return session({
//     secret: process.env.SESSION_SECRET!,
//     store: sessionStore,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       secure: true,
//       maxAge: sessionTtl,
//     },
//   });
// }

// function updateUserSession(
//   user: any,
//   tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
// ) {
//   user.claims = tokens.claims();
//   user.access_token = tokens.access_token;
//   user.refresh_token = tokens.refresh_token;
//   user.expires_at = user.claims?.exp;
// }

// async function upsertUser(
//   claims: any,
// ) {
//   await storage.upsertUser({
//     id: claims["sub"],
//     email: claims["email"],
//     firstName: claims["first_name"],
//     lastName: claims["last_name"],
//     profileImageUrl: claims["profile_image_url"],
//   });
// }

// export async function setupAuth(app: Express) {
//   app.set("trust proxy", 1);
//   app.use(getSession());
//   app.use(passport.initialize());
//   app.use(passport.session());

//   const config = await getOidcConfig();

//   const verify: VerifyFunction = async (
//     tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
//     verified: passport.AuthenticateCallback
//   ) => {
//     const user = {};
//     updateUserSession(user, tokens);
//     await upsertUser(tokens.claims());
//     verified(null, user);
//   };

//   // Keep track of registered strategies
//   const registeredStrategies = new Set<string>();

//   // Helper function to ensure strategy exists for a domain
//   const ensureStrategy = (domain: string) => {
//     const strategyName = `replitauth:${domain}`;
//     if (!registeredStrategies.has(strategyName)) {
//       const strategy = new Strategy(
//         {
//           name: strategyName,
//           config,
//           scope: "openid email profile offline_access",
//           callbackURL: `https://${domain}/api/callback`,
//         },
//         verify,
//       );
//       passport.use(strategy);
//       registeredStrategies.add(strategyName);
//     }
//   };

//   passport.serializeUser((user: Express.User, cb) => cb(null, user));
//   passport.deserializeUser((user: Express.User, cb) => cb(null, user));

//   app.get("/api/login", (req, res, next) => {
//     ensureStrategy(req.hostname);
//     passport.authenticate(`replitauth:${req.hostname}`, {
//       prompt: "login consent",
//       scope: ["openid", "email", "profile", "offline_access"],
//     })(req, res, next);
//   });

//   app.get("/api/callback", (req, res, next) => {
//     ensureStrategy(req.hostname);
//     passport.authenticate(`replitauth:${req.hostname}`, {
//       successReturnToOrRedirect: "/",
//       failureRedirect: "/api/login",
//     })(req, res, next);
//   });

//   app.get("/api/logout", (req, res) => {
//     req.logout(() => {
//       res.redirect(
//         client.buildEndSessionUrl(config, {
//           client_id: process.env.REPL_ID!,
//           post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
//         }).href
//       );
//     });
//   });
// }

// export const isAuthenticated: RequestHandler = async (req, res, next) => {
//   const user = req.user as any;

//   if (!req.isAuthenticated() || !user.expires_at) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const now = Math.floor(Date.now() / 1000);
//   if (now <= user.expires_at) {
//     return next();
//   }

//   const refreshToken = user.refresh_token;
//   if (!refreshToken) {
//     res.status(401).json({ message: "Unauthorized" });
//     return;
//   }

//   try {
//     const config = await getOidcConfig();
//     const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
//     updateUserSession(user, tokenResponse);
//     return next();
//   } catch (error) {
//     res.status(401).json({ message: "Unauthorized" });
//     return;
//   }
// };

import { Issuer, Client, TokenSet } from "openid-client";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// --- Memoized OIDC client ---
const getOidcClient = memoize(async (): Promise<Client> => {
  const issuer = await Issuer.discover(
    process.env.ISSUER_URL ?? "https://replit.com/oidc"
  );

  return new issuer.Client({
    client_id: process.env.REPL_ID!,
    client_secret: process.env.REPL_SECRET!, // if required
    redirect_uris: [`https://${process.env.DOMAIN}/api/callback`],
    response_types: ["code"],
  });
}, { maxAge: 3600 * 1000 });

// --- Session middleware ---
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, maxAge: sessionTtl },
  });
}

// --- Helper to update user session from TokenSet ---
function updateUserSession(user: any, tokenSet: TokenSet) {
  user.claims = tokenSet.claims();
  user.access_token = tokenSet.access_token;
  user.refresh_token = tokenSet.refresh_token;
  user.expires_at = tokenSet.expires_at; // in seconds
}

// --- Save/update user in DB ---
async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
  });
}

// --- Setup authentication ---
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const client = await getOidcClient();

  // Passport strategy
  passport.use(
    "oidc",
    new (require("passport-openidconnect").Strategy)(
      {
        issuer: client.issuer.issuer,
        authorizationURL: client.issuer.authorization_endpoint,
        tokenURL: client.issuer.token_endpoint,
        userInfoURL: client.issuer.userinfo_endpoint,
        clientID: process.env.REPL_ID!,
        clientSecret: process.env.REPL_SECRET!,
        callbackURL: `/api/callback`,
        scope: "openid email profile offline_access",
      },
      async (issuerUser: any, done: any) => {
        try {
          await upsertUser(issuerUser);
          done(null, issuerUser);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // --- Routes ---
  app.get("/api/login", passport.authenticate("oidc"));

  app.get(
    "/api/callback",
    passport.authenticate("oidc", { failureRedirect: "/api/login" }),
    (req, res) => res.redirect("/")
  );

  app.get("/api/logout", async (req, res) => {
    req.logout(() => {
      const logoutUrl = client.endSessionUrl({
        post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
      });
      res.redirect(logoutUrl); // no .href

    });
  });
}

// --- Middleware to check authentication ---
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  if (!user.refresh_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const client = await getOidcClient();
    const tokenSet = await client.refresh(user.refresh_token);
    updateUserSession(user, tokenSet);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

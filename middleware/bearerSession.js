import jwt from "jsonwebtoken";

/**
 * When the session cookie is missing (e.g. SPA on localhost calling API on a dev tunnel),
 * restores req.session.userId (and related fields) from Authorization: Bearer <JWT>.
 * Cookie session wins if already present.
 */
export function bearerSessionFromJwt(req, res, next) {
    if (req.session?.userId) {
        return next();
    }
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return next();
    }
    const token = auth.slice(7).trim();
    if (!token) {
        return next();
    }
    try {
        const secret = process.env.SESSION_SECRET || "123456789";
        const payload = jwt.verify(token, secret);
        const uid = payload.userId ?? payload.id;
        if (uid == null) {
            return next();
        }
        req.session.userId = uid;
        if (payload.role != null) {
            req.session.role = payload.role;
        }
        if (payload.storeId != null) {
            req.session.storeId = payload.storeId;
        }
    } catch {
        // invalid or expired token — leave session anonymous
    }
    next();
}

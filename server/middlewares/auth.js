import { clerkClient, getAuth } from '@clerk/express';

function decodeClerkFrontendApi(publishableKey) {
  try {
    const raw = publishableKey?.split('_').slice(2).join('_') || '';
    return Buffer.from(raw, 'base64').toString('utf8').replace(/\$$/, '');
  } catch {
    return null;
  }
}

/** Fast auth — only verifies JWT / userId. No Clerk Admin API round-trips. */
export const requireAuth = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
      const fapi = decodeClerkFrontendApi(process.env.CLERK_PUBLISHABLE_KEY);
      console.warn(
        `[auth] 401 — userId missing (Bearer: ${hasBearer}, server Clerk FAPI: ${fapi || 'unknown'})`
      );
      return res.status(401).json({
        success: false,
        message:
          'Unauthorized. Please sign in and send a valid Bearer token. If this persists, ensure client and server use Clerk keys from the same application.',
      });
    }

    next();
  } catch (error) {
    console.error('[auth] error:', error?.message || error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};

/** Auth + plan / free_usage (Clerk Admin API). Use only on generation routes that need quotas. */
export const auth = async (req, res, next) => {
  try {
    const { userId, has } = getAuth(req);

    if (!userId) {
      const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
      const fapi = decodeClerkFrontendApi(process.env.CLERK_PUBLISHABLE_KEY);
      console.warn(
        `[auth] 401 — userId missing (Bearer: ${hasBearer}, server Clerk FAPI: ${fapi || 'unknown'})`
      );
      return res.status(401).json({
        success: false,
        message:
          'Unauthorized. Please sign in and send a valid Bearer token. If this persists, ensure client and server use Clerk keys from the same application.',
      });
    }

    const hasPremiumPlan = await has({ plan: 'premium' });

    if (hasPremiumPlan) {
      req.plan = 'premium';
      req.free_usage = 0;
      return next();
    }

    req.plan = 'free';

    const user = await clerkClient.users.getUser(userId);
    const freeUsage = user.privateMetadata?.free_usage;

    // Only write metadata when free_usage was never initialized.
    // Previously `if (free_usage)` treated 0 as missing and rewrote Clerk on EVERY request.
    if (typeof freeUsage === 'number') {
      req.free_usage = freeUsage;
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });
      req.free_usage = 0;
    }

    next();
  } catch (error) {
    console.error('[auth] error:', error?.message || error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};

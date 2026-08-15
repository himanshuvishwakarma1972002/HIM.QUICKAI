import { clerkClient, getAuth } from '@clerk/express';

function decodeClerkFrontendApi(publishableKey) {
  try {
    const raw = publishableKey?.split('_').slice(2).join('_') || '';
    return Buffer.from(raw, 'base64').toString('utf8').replace(/\$$/, '');
  } catch {
    return null;
  }
}

/** Require a signed-in Clerk user + attach plan / free_usage */
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
    const user = await clerkClient.users.getUser(userId);

    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free';
    next();
  } catch (error) {
    console.error('[auth] error:', error?.message || error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};

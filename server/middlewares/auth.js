import { clerkClient, getAuth } from '@clerk/express';

/** Require a signed-in Clerk user + attach plan / free_usage */
export const auth = async (req, res, next) => {
  try {
    const { userId, has } = getAuth(req);

    if (!userId) {
      const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
      console.warn(
        `[auth] 401 — userId missing (Authorization Bearer present: ${hasBearer})`
      );
      return res.status(401).json({
        success: false,
        message:
          'Unauthorized. Please sign in and send a valid Bearer token.',
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

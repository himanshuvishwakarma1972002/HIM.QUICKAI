import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";

export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const limit = Math.min(Number(req.query.limit) || 40, 100);

    // Avoid SELECT * — full article bodies make dashboard payloads huge/slow.
    // Images keep URL content; text gets a preview (expand still shows enough).
    const creations = await sql`
      SELECT
        id,
        user_id,
        prompt,
        type,
        created_at,
        publish,
        CASE
          WHEN type = 'image' THEN content
          WHEN char_length(content) > 2500 THEN left(content, 2500) || E'\n\n…'
          ELSE content
        END AS content
      FROM creations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    res.json({ success: true, creations });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const creations = await sql`
      SELECT * FROM creations
      WHERE publish = true
      ORDER BY created_at DESC
    `;

    res.json({ success: true, creations });

  } catch (error) {
    res.status(500).json({
  success: false,
  message: error.message || "Something went wrong"
});;
  }
};

export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const [creation] = await sql`
      SELECT * FROM creations WHERE id = ${id}
    `;

    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const likes = Array.isArray(creation.likes) ? creation.likes : [];
    const user = userId.toString();

    const updated = likes.includes(user)
      ? likes.filter(u => u !== user)
      : [...likes, user];

    // TEXT[] ko postgres array literal string me convert karo
    const arrayLiteral = '{' + updated.map(u => `"${u}"`).join(',') + '}';

    await sql`
      UPDATE creations 
      SET likes = ${arrayLiteral}::text[]
      WHERE id = ${id}
    `;

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({
  success: false,
  message: error.message || "Something went wrong"
});;
  }
};

export const getCreationLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const [creation] = await sql`
      SELECT id, likes, prompt, created_at, user_id
      FROM creations
      WHERE id = ${id} AND publish = true
    `;

    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const likeIds = Array.isArray(creation.likes) ? creation.likes : [];

    const likers = await Promise.all(
      likeIds.map(async (likedUserId) => {
        try {
          const user = await clerkClient.users.getUser(likedUserId);
          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "User";

          return {
            id: likedUserId,
            name,
            email: user.emailAddresses?.[0]?.emailAddress || "No email",
            image: user.imageUrl || null,
          };
        } catch {
          return {
            id: likedUserId,
            name: "Unknown user",
            email: "Unavailable",
            image: null,
          };
        }
      })
    );

    let creator = null;
    try {
      const owner = await clerkClient.users.getUser(creation.user_id);
      creator = {
        id: creation.user_id,
        name:
          [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
          owner.username ||
          "Creator",
        email: owner.emailAddresses?.[0]?.emailAddress || "No email",
        image: owner.imageUrl || null,
      };
    } catch {
      creator = {
        id: creation.user_id,
        name: "Unknown creator",
        email: "Unavailable",
        image: null,
      };
    }

    res.json({
      success: true,
      creation: {
        id: creation.id,
        prompt: creation.prompt,
        created_at: creation.created_at,
      },
      creator,
      likers,
    });
  } catch (error) {
    res.status(500).json({
  success: false,
  message: error.message || "Something went wrong"
});;
  }
};
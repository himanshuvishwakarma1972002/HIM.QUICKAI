import sql from "../configs/db.js";

export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth();

    const creations = await sql`
      SELECT * FROM creations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.json({ success: true, creations });

  } catch (error) {
    res.json({ success: false, message: error.message });
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
    res.json({ success: false, message: error.message });
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
    res.json({ success: false, message: error.message });
  }
};
import clientPromise from "../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
        console.log("Auth skipped in development");
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const client = await clientPromise;
    const db = client.db("billtracker");
    const userEmail = session?.user?.email || "local@development.com";

    try {
      switch (req.method) {
        case "GET":
          const bills = await db
            .collection("bills")
            .find({ userEmail })
            .toArray();
          res.json(bills);
          break;

        case "POST":
          const newBill = {
            ...req.body,
            userEmail,
            createdAt: new Date(),
          };
          await db.collection("bills").insertOne(newBill);
          res.json(newBill);
          break;

        case "PUT":
          const { id, ...updateData } = req.body;
          console.log("Updating bill:", { id, updateData, userEmail });

          const result = await db.collection("bills").updateOne(
            {
              id: Number(id) || id, // handle both string and number ids
              userEmail,
            },
            {
              $set: {
                ...updateData,
                updatedAt: new Date(),
              },
            }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Bill not found" });
          }

          res.json({ success: true, matchedCount: result.matchedCount });
          break;

        case "DELETE":
          const { id: billId } = req.query;
          const deleteResult = await db.collection("bills").deleteOne({
            id: Number(billId) || billId,
            userEmail,
          });

          if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "Bill not found" });
          }

          res.json({ success: true, deletedCount: deleteResult.deletedCount });
          break;

        default:
          res.status(405).json({ error: "Method not allowed" });
      }
    } catch (error) {
      console.error("Database operation failed:", error);
      res.status(500).json({
        error: "Database operation failed",
        details: error.message,
        method: req.method,
      });
    }
  } catch (error) {
    console.error("API error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}

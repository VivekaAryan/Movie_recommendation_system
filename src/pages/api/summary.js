import axios from "axios";
import { BACKEND_URL, backendErrorMessage, backendErrorStatus } from "../../lib/backend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { movie, language, score, synopsis, year } = req.body;

  try {
    const response = await axios.post(`${BACKEND_URL}/summary`, {
      movie,
      language,
      score,
      synopsis,
      year,
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(backendErrorStatus(error, 400)).json({ error: backendErrorMessage(error) });
  }
}

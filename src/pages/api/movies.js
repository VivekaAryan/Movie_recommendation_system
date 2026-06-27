import axios from "axios";
import { BACKEND_URL, backendErrorMessage, backendErrorStatus } from "../../lib/backend";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/movies`);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(backendErrorStatus(error)).json({ error: backendErrorMessage(error) });
  }
}

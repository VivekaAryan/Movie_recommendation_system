// src/pages/api/get_summary.js
import axios from 'axios';

export default async function handler(req, res) {
  const { movie, language, score, synopsis, year } = req.body;

  try {
    const response = await axios.post('http://localhost:8000/summary', { movie, language, score, synopsis, year });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.response.data.detail });
  }
}

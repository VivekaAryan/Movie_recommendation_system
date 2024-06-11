// src/pages/api/get_recommendations.js
import axios from 'axios';

export default async function handler(req, res) {
  const { title } = req.body;

  try {
    const response = await axios.post('http://localhost:8000/recommendations', { title });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.response.data.detail });
  }
}



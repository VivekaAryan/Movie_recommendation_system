// //Method 2
// import { useState } from 'react';
// import axios from 'axios';

// const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";

// const MovieRecommender = () => {
//   const [movieTitle, setMovieTitle] = useState('');
//   const [recommendations, setRecommendations] = useState([]);
//   const [summaries, setSummaries] = useState({});

//   const getRecommendations = async () => {
//     try {
//       const response = await axios.post('/api/get_recommendations', { title: movieTitle });
//       setRecommendations(response.data);
//     } catch (error) {
//       console.error('Error fetching recommendations:', error);
//     }
//   };

//   const getSummary = async (movie) => {
//     if (summaries[movie]) return; // Avoid fetching if already fetched

//     try {
//       const response = await axios.post('/api/get_summary', { movie });
//       setSummaries(prev => ({ ...prev, [movie]: response.data.summary }));
//     } catch (error) {
//       console.error('Error fetching summary:', error);
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen flex flex-col items-center bg-blue-500">
//       <div className="w-full max-w-4xl text-center">
//         <h1 className="text-4xl font-bold mb-6 text-center">Movie Recommender System</h1>
//         <input
//           type="text"
//           value={movieTitle}
//           onChange={(e) => setMovieTitle(e.target.value)}
//           placeholder="Enter movie title"
//           className="border p-2 mb-4 w-full max-w-md rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <button onClick={getRecommendations} className="bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 transition">
//           Get Recommendations
//         </button>
//         <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
//           {recommendations.map((movie, index) => (
//             <div key={index} className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
//               <div className="h-auto max-w-xs"> 
//                 <img src={BASE_POSTER_URL + movie.poster_path} alt={`${movie.movie} poster`}/>
//               </div>
//               <h4 className="font-bold text-lg mb-2 text-center">{movie.movie}</h4>
//               <p className="text-gray-700 mb-2 text-center">{movie.language} ({movie.year}) | Score: {movie.score}</p>
//               <button onClick={() => getSummary(movie.movie)} className="bg-black text-white py-1 px-2 mb-2 rounded shadow hover:bg-gray-800 transition">
//                 Summarize
//               </button>
//               {summaries[movie.movie] && (
//                 <div className="bg-gray-100 p-2 mt-2 rounded shadow-inner w-full">
//                   <h5 className="font-semibold mb-1">Summary:</h5>
//                   <p className="text-gray-700">{summaries[movie.movie]}</p>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

import { useState } from 'react';
import axios from 'axios';

const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";

const MovieRecommender = () => {
  const [movieTitle, setMovieTitle] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [summaries, setSummaries] = useState({});

  const getRecommendations = async () => {
    try {
      const response = await axios.post('/api/get_recommendations', { title: movieTitle });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const getSummary = async (movie) => {
    if (summaries[movie]) return; // Avoid fetching if already fetched

    try {
      const response = await axios.post('/api/get_summary', { movie });
      setSummaries(prev => ({ ...prev, [movie]: response.data.summary }));
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-5xl font-bold mb-8 text-center text-blue-700">Movie Recommender</h1>
      <div className="w-full max-w-lg flex flex-col items-center">
        <input
          type="text"
          value={movieTitle}
          onChange={(e) => setMovieTitle(e.target.value)}
          placeholder="Enter movie title"
          className="border p-3 mb-4 w-full rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={getRecommendations} className="bg-blue-600 text-white py-2 px-6 rounded shadow hover:bg-blue-700 transition">
          Get Recommendations
        </button>
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-7xl">
        {recommendations.slice(0, 10).map((movie, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <div className="h-auto w-full mb-4"> 
              <img src={BASE_POSTER_URL + movie.poster_path} alt={`${movie.movie} poster`} className="rounded w-full" />
            </div>
            <h4 className="font-bold text-lg text-center">{movie.movie}</h4>
            <p className="text-gray-600 mb-4 text-center">{movie.language} ({movie.year}) | Score: {movie.score}</p>
            <button onClick={() => getSummary(movie.movie)} className="bg-gray-800 text-white py-1 px-3 rounded shadow hover:bg-gray-900 transition">
              Summarize
            </button>
            {summaries[movie.movie] && (
              <div className="bg-gray-100 p-3 mt-4 rounded shadow-inner w-full">
                <h5 className="font-semibold mb-2">Summary:</h5>
                <p className="text-gray-700">{summaries[movie.movie]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieRecommender;

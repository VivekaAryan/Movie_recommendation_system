// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";
// const LOW_POLY_BACKGROUND = "https://img.freepik.com/free-vector/blue-abstract-background-polygonal-shapes-low-poly-concept_1302-5314.jpg?w=826&t=st=1718153251~exp=1718153851~hmac=2fed24d83131961d5006b62156d448afd806144845cccf2d85dd3d886b3a47e6"; // Replace with your low poly background URL

// const MovieRecommender = () => {
//   const [movieTitle, setMovieTitle] = useState('');
//   const [recommendations, setRecommendations] = useState([]);
//   const [summaries, setSummaries] = useState({});
//   const [suggestions, setSuggestions] = useState([]);
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   useEffect(() => {
//     // Fetch movie list from the backend
//     const fetchMovies = async () => {
//       try {
//         const response = await axios.get('http://127.0.0.1:8000/api/movies');
//         setSuggestions(response.data);
//       } catch (error) {
//         console.error('Error fetching movie list:', error);
//       }
//     };

//     fetchMovies();
//   }, []);

//   useEffect(() => {
//     // Reset the input field and dropdown on component mount
//     setMovieTitle('');
//     setDropdownOpen(false);
//   }, []);

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

//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     setMovieTitle(value);

//     if (value) {
//       const filteredSuggestions = suggestions.filter(movie =>
//         movie.title.toLowerCase().includes(value.toLowerCase())
//       );
//       setSuggestions(filteredSuggestions);
//       setDropdownOpen(true);
//     } else {
//       setDropdownOpen(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-blue-100 flex flex-col items-center p-6">
//       <div
//         className="w-full max-w-full flex flex-col items-center p-6 mb-8 rounded-lg shadow-lg"
//         style={{ backgroundImage: `url(${LOW_POLY_BACKGROUND})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'repeat'}}
//       >
//         <h1 className="text-4xl font-bold mb-8 text-center text-white">Movie Recommendation System</h1>
//         <input
//           type="text"
//           value={movieTitle}
//           onChange={handleInputChange}
//           placeholder="Start typing your movie here:"
//           className="border p-3 mb-5 w-full max-w-md rounded-full shadow-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
//         />
//         {dropdownOpen && (
//           <ul className="bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto w-full max-w-lg">
//             {suggestions.map((suggestion, index) => (
//               <li
//                 key={index}
//                 className="p-2 cursor-pointer hover:bg-gray-200"
//                 onClick={() => {
//                   setMovieTitle(suggestion.title);
//                   setDropdownOpen(false);
//                 }}
//               >
//                 {suggestion.title}
//               </li>
//             ))}
//           </ul>
//         )}
//         <button onClick={getRecommendations} className="bg-white text-black py-2 px-6 rounded-full shadow hover:bg-blue-400 hover:ring-1 hover:ring-black hover:font-bold transition mt-4">
//           Get Recommendations
//         </button>
//       </div>
//       {recommendations.length > 0 && (
//         <h2 className="text-2xl font-semibold mb-6">Top 10 movies similar to: <span className="font-bold">{movieTitle}</span></h2>
//       )}
//       <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-5/6 max-w-7xl">
//         {recommendations.slice(0, 10).map((movie, index) => (
//           <div key={index} className="bg-blue-400 p-4 rounded-lg shadow-md flex flex-col items-center group relative">
//             <div className="h-auto w-full mb-4 group-hover:opacity-50 transition-opacity duration-300"> 
//               <img src={BASE_POSTER_URL + movie.poster_path} alt={`${movie.movie} poster`} className="rounded w-full" />
//             </div>
//             <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//               <button onClick={() => getSummary(movie.movie)} className="bg-gray-800 text-white py-1 px-3 rounded shadow hover:bg-gray-900 transition">
//                 Generate Summary
//               </button>
//             </div>
//             <h4 className="font-bold text-lg text-center">{movie.movie}</h4>
//             <p className="text-gray-800 mb-4 text-center">{movie.language} ({movie.year}) | Score: {movie.score}</p>
//             {summaries[movie.movie] && (
//               <div className="bg-gray-100 p-3 mt-4 rounded shadow-inner w-full">
//                 <h5 className="font-semibold mb-2">Summary:</h5>
//                 <p className="text-gray-700">{summaries[movie.movie]}</p>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MovieRecommender;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";
const API_BASE_URL = "http://127.0.0.1:8000";
const LOW_POLY_BACKGROUND = "https://img.freepik.com/free-vector/blue-abstract-background-polygonal-shapes-low-poly-concept_1302-5314.jpg?w=826&t=st=1718153251~exp=1718153851~hmac=2fed24d83131961d5006b62156d448afd806144845cccf2d85dd3d886b3a47e6";

const MovieRecommender = () => {
  const [movieTitle, setMovieTitle] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch movie list from the backend
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/movies`);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching movie list:', error);
      }
    };

    fetchMovies();
  }, []);

  const getRecommendations = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/recommendations`, { title: movieTitle });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const getSummary = async (movie) => {
    if (summaries[movie.title]) return; // Avoid fetching if already fetched

    const payload = {
      movie: movie.title,
      language: movie.language || "English",
      score: movie.score.toString(),
      synopsis: movie.synopsis,
      year: movie.year.toString()
    };
    console.log("Sending payload to summary API:", payload); // Debugging line
    try {
      const response = await axios.post(`${API_BASE_URL}/summary`, payload);
      setSummaries(prev => ({ ...prev, [movie.title]: response.data.summary }));
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMovieTitle(value);

    if (value) {
      const filteredSuggestions = suggestions.filter(movie =>
        movie.title.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center p-6">
      <div
        className="w-full max-w-full flex flex-col items-center p-6 mb-8 rounded-lg shadow-lg"
        style={{ backgroundImage: `url(${LOW_POLY_BACKGROUND})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Movie Recommendation System</h1>
        <input
          type="text"
          value={movieTitle}
          onChange={handleInputChange}
          placeholder="Start typing your movie here:"
          className="border p-3 mb-5 w-full max-w-md rounded-full shadow-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
        />
        {dropdownOpen && (
          <ul className="bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto w-full max-w-md">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="p-2 cursor-pointer hover:bg-gray-200"
                onClick={() => {
                  setMovieTitle(suggestion.title);
                  setDropdownOpen(false);
                }}
              >
                {suggestion.title}
              </li>
            ))}
          </ul>
        )}
        <button onClick={getRecommendations} className="bg-white text-black py-2 px-6 rounded-full shadow hover:bg-blue-400 hover:ring-1 hover:ring-black hover:font-bold transition mt-4">
          Get Recommendations
        </button>
      </div>
      {recommendations.length > 0 && (
        <h2 className="text-2xl font-semibold mb-6">Top 10 movies similar to: <span className="font-bold">{movieTitle}</span></h2>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-5/6 max-w-7xl">
        {recommendations.slice(0, 10).map((movie, index) => (
          <div key={index} className="bg-blue-400 p-4 rounded-lg shadow-md flex flex-col items-center group relative">
            <div className="h-auto w-full mb-4 group-hover:opacity-50 transition-opacity duration-300"> 
              <img src={BASE_POSTER_URL + movie.poster_path} alt={`${movie.title} poster`} className="rounded w-full" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={() => getSummary(movie)} className="bg-gray-800 text-white py-1 px-3 rounded shadow hover:bg-gray-900 transition">
                Summarize
              </button>
            </div>
            <h4 className="font-bold text-lg text-center">{movie.title}</h4>
            <p className="text-gray-600 mb-4 text-center">{movie.language} ({movie.year}) | Score: {movie.score}</p>
            {summaries[movie.title] && (
              <div className="bg-gray-100 p-3 mt-4 rounded shadow-inner w-full">
                <h5 className="font-semibold mb-2">Summary:</h5>
                <p className="text-gray-700">{summaries[movie.title]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieRecommender;

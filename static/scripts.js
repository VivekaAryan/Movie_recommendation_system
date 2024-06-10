document.getElementById('get-recommendations').addEventListener('click', function() {
    const title = document.getElementById('movie-title').value;
    if (title.trim() === '') {
        alert('Please enter a movie title.');
        return;
    }

    fetch('/get_recommendations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title })
    })
    .then(response => response.json())
    .then(data => displayRecommendations(data))
    .catch(error => console.error('Error:', error));
});

function displayRecommendations(data) {
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = '';

    if (data.summaries.length === 0) {
        recommendationsDiv.innerHTML = '<p>No recommendations found.</p>';
        return;
    }

    data.summaries.forEach(summary => {
        const div = document.createElement('div');
        div.classList.add('recommendation');
        div.innerHTML = `
            <h3>${summary.movie}</h3>
            <p><strong>Language:</strong> ${summary.language}</p>
            <p><strong>Score:</strong> ${summary.score}</p>
            <p><strong>Year:</strong> ${summary.year}</p>
            <p>${summary.summary}</p>
        `;
        recommendationsDiv.appendChild(div);
    });
}

console.log("JavaScript loaded.");
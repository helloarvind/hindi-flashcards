// Main Application
const { useState, useEffect, useRef } = React;

// Initialize localStorage with preloaded flashcards if empty
const initializeFlashcards = () => {
  const storedCards = localStorage.getItem('flashcards');
  if (!storedCards) {
    localStorage.setItem('flashcards', JSON.stringify(preloadedFlashcards));
    return preloadedFlashcards;
  }
  return JSON.parse(storedCards);
};

// Initialize review stats if empty
const initializeStats = () => {
  const storedStats = localStorage.getItem('reviewStats');
  if (!storedStats) {
    const initialStats = { reviewCount: 0, correctCount: 0, reviewsByDate: {} };
    localStorage.setItem('reviewStats', JSON.stringify(initialStats));
    return initialStats;
  }
  return JSON.parse(storedStats);
};

// Main App Component
const App = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState({});
  const [activePage, setActivePage] = useState('review');
  
  useEffect(() => {
    setFlashcards(initializeFlashcards());
    setStats(initializeStats());
  }, []);

  const saveFlashcards = (updatedCards) => {
    setFlashcards(updatedCards);
    localStorage.setItem('flashcards', JSON.stringify(updatedCards));
  };

  const saveStats = (updatedStats) => {
    setStats(updatedStats);
    localStorage.setItem('reviewStats', JSON.stringify(updatedStats));
  };

  const updateStats = (isCorrect) => {
    const today = new Date().toISOString().split('T')[0];
    const newStats = { ...stats };
    
    newStats.reviewCount = (newStats.reviewCount || 0) + 1;
    if (isCorrect) {
      newStats.correctCount = (newStats.correctCount || 0) + 1;
    }
    
    if (!newStats.reviewsByDate) {
      newStats.reviewsByDate = {};
    }
    
    if (!newStats.reviewsByDate[today]) {
      newStats.reviewsByDate[today] = { total: 0, correct: 0 };
    }
    
    newStats.reviewsByDate[today].total += 1;
    if (isCorrect) {
      newStats.reviewsByDate[today].correct += 1;
    }
    
    saveStats(newStats);
  };

  const addFlashcard = (newCard) => {
    const newId = flashcards.length > 0 ? Math.max(...flashcards.map(card => card.id)) + 1 : 1;
    const card = {
      id: newId,
      front: newCard.front,
      back: newCard.back,
      lastReviewed: null,
      correct: 0,
      incorrect: 0
    };
    
    const updatedCards = [...flashcards, card];
    saveFlashcards(updatedCards);
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
      <div style={styles.content}>
        {activePage === 'review' && (
          <ReviewPage 
            flashcards={flashcards} 
            saveFlashcards={saveFlashcards} 
            updateStats={updateStats} 
          />
        )}
        {activePage === 'search' && (
          <SearchPage 
            flashcards={flashcards} 
          />
        )}
        {activePage === 'stats' && (
          <StatsPage 
            stats={stats} 
          />
        )}
        {activePage === 'create' && (
          <CreatePage 
            addFlashcard={addFlashcard} 
          />
        )}
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activePage, setActivePage }) => {
  return (
    <div style={styles.sidebar}>
      <h2 style={styles.sidebarTitle}>Hindi Flashcards</h2>
      <button 
        style={{
          ...styles.navButton,
          backgroundColor: activePage === 'review' ? '#4a6fa5' : '#2c3e50'
        }} 
        onClick={() => setActivePage('review')}
      >
        Review
      </button>
      <button 
        style={{
          ...styles.navButton,
          backgroundColor: activePage === 'search' ? '#4a6fa5' : '#2c3e50'
        }} 
        onClick={() => setActivePage('search')}
      >
        Search
      </button>
      <button 
        style={{
          ...styles.navButton,
          backgroundColor: activePage === 'stats' ? '#4a6fa5' : '#2c3e50'
        }} 
        onClick={() => setActivePage('stats')}
      >
        Statistics
      </button>
      <button 
        style={{
          ...styles.navButton,
          backgroundColor: activePage === 'create' ? '#4a6fa5' : '#2c3e50'
        }} 
        onClick={() => setActivePage('create')}
      >
        Create Cards
      </button>
    </div>
  );
};

// Review Page Component
const ReviewPage = ({ flashcards, saveFlashcards, updateStats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const cardRef = useRef(null);
  
  const handleKeyDown = (e) => {
    if (e.code === 'Space') {
      flipCard();
    } else if (e.code === 'ArrowRight') {
      nextCard();
    } else if (e.code === 'ArrowLeft') {
      prevCard();
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, isFlipped]);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    // Removed automatic marking as correct when moving to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const markCorrect = () => {
    if (!reviewMode) return;
    
    const updatedCards = [...flashcards];
    const card = updatedCards[currentIndex];
    card.lastReviewed = new Date().toISOString();
    card.correct += 1;
    saveFlashcards(updatedCards);
    updateStats(true);
  };

  const markIncorrect = () => {
    if (!reviewMode) return;
    
    const updatedCards = [...flashcards];
    const card = updatedCards[currentIndex];
    card.lastReviewed = new Date().toISOString();
    card.incorrect += 1;
    saveFlashcards(updatedCards);
    updateStats(false);
  };

  return (
    <div style={styles.reviewContainer}>
      <h1 style={styles.pageTitle}>Flashcard Review</h1>
      
      <div style={styles.reviewOptions}>
        <label style={styles.reviewModeLabel}>
          <input 
            type="checkbox" 
            checked={reviewMode} 
            onChange={() => setReviewMode(!reviewMode)} 
          />
          Track Results
        </label>
      </div>
      
      {flashcards.length > 0 && (
        <div style={styles.reviewContent}>
          <div 
            ref={cardRef}
            style={{
              ...styles.flashcard,
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
            onClick={flipCard}
          >
            <div style={styles.cardFront}>
              <h2>{flashcards[currentIndex].front}</h2>
            </div>
            <div style={styles.cardBack}>
              <h2>{flashcards[currentIndex].back}</h2>
            </div>
          </div>
          
          <div style={styles.navigationControls}>
            <button 
              style={styles.navControlButton} 
              onClick={prevCard}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            
            {reviewMode && isFlipped && (
              <div style={styles.feedbackButtons}>
                <button style={styles.incorrectButton} onClick={markIncorrect}>Incorrect</button>
                <button style={styles.correctButton} onClick={markCorrect}>Correct</button>
              </div>
            )}
            
            <button 
              style={styles.navControlButton} 
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
            >
              Next →
            </button>
          </div>
          
          <div style={styles.cardCounter}>
            Card {currentIndex + 1} of {flashcards.length}
          </div>
        </div>
      )}
    </div>
  );
};

// Search Page Component
const SearchPage = ({ flashcards }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = flashcards.filter(card => {
      return (
        card.front.toLowerCase().includes(query) ||
        card.back.toLowerCase().includes(query)
      );
    });
    
    setSearchResults(results);
  }, [searchQuery, flashcards]);

  return (
    <div style={styles.searchContainer}>
      <h1 style={styles.pageTitle}>Search Flashcards</h1>
      
      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="Search Hindi or English..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      
      <div style={styles.searchResults}>
        {searchResults.length > 0 ? (
          <table style={styles.resultTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Hindi</th>
                <th style={styles.tableHeader}>English</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map(card => (
                <tr key={card.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{card.front}</td>
                  <td style={styles.tableCell}>{card.back}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          searchQuery.trim() !== '' && (
            <p style={styles.noResults}>No matching flashcards found.</p>
          )
        )}
      </div>
    </div>
  );
};

// Stats Page Component
const StatsPage = ({ stats }) => {
  const canvasRef = useRef(null);
  const [accuracy, setAccuracy] = useState(0);
  
  useEffect(() => {
    if (stats && stats.reviewCount > 0) {
      setAccuracy(Math.round((stats.correctCount / stats.reviewCount) * 100));
    }
    
    // Create chart if reviews exist
    if (stats && stats.reviewsByDate && Object.keys(stats.reviewsByDate).length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      
      // Prepare data for chart
      const dates = Object.keys(stats.reviewsByDate).sort();
      const reviewData = dates.map(date => stats.reviewsByDate[date].total);
      
      // Clear previous chart if exists
      if (window.myChart) {
        window.myChart.destroy();
      }
      
      // Create new chart
      window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Cards Reviewed',
            data: reviewData,
            backgroundColor: '#4a6fa5',
            borderColor: '#2c3e50',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Reviews'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    }
  }, [stats]);

  return (
    <div style={styles.statsContainer}>
      <h1 style={styles.pageTitle}>Review Statistics</h1>
      
      <div style={styles.statsSummary}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Reviews</h3>
          <p style={styles.statValue}>{stats.reviewCount || 0}</p>
        </div>
        
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Accuracy</h3>
          <p style={styles.statValue}>{accuracy}%</p>
        </div>
      </div>
      
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Review Activity</h3>
        {stats && stats.reviewsByDate && Object.keys(stats.reviewsByDate).length > 0 ? (
          <canvas ref={canvasRef} width="600" height="300"></canvas>
        ) : (
          <p style={styles.noData}>No review data available yet. Start reviewing to see statistics.</p>
        )}
      </div>
    </div>
  );
};

// Hindi Virtual Keyboard Component
const HindiKeyboard = ({ onKeyPress }) => {
  // Hindi consonants (vyanjan)
  const hindiConsonants = [
    'क', 'ख', 'ग', 'घ', 'ङ',
    'च', 'छ', 'ज', 'झ', 'ञ',
    'ट', 'ठ', 'ड', 'ढ', 'ण',
    'त', 'थ', 'द', 'ध', 'न',
    'प', 'फ', 'ब', 'भ', 'म',
    'य', 'र', 'ल', 'व', 'श',
    'ष', 'स', 'ह',
  ];
  
  // Hindi vowels (swar)
  const hindiVowels = [
    'अ', 'आ', 'इ', 'ई', 'उ',
    'ऊ', 'ए', 'ऐ', 'ओ', 'औ',
    'अं', 'अः',
  ];
  
  // Hindi vowel signs (matra)
  const hindiMatras = [
    'ा', 'ि', 'ी', 'ु', 'ू',
    'े', 'ै', 'ो', 'ौ', 'ं', 'ः',
    '्',
  ];
  
  // Hindi numerals
  const hindiNumerals = [
    '०', '१', '२', '३', '४',
    '५', '६', '७', '८', '९',
  ];
  
  // Special characters
  const specialChars = [
    '।', '॥', ',', '.', '?', '!',
    '-', '(', ')', ' '
  ];
  
  const renderKeys = (keys, rowStyle) => {
    return (
      <div style={rowStyle}>
        {keys.map((key, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onKeyPress(key)}
            style={styles.keyboardKey}
          >
            {key}
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div style={styles.keyboardContainer}>
      <div style={styles.keyboardSection}>
        <h4 style={styles.keyboardTitle}>Vowels (स्वर)</h4>
        {renderKeys(hindiVowels, styles.keyboardRow)}
      </div>
      
      <div style={styles.keyboardSection}>
        <h4 style={styles.keyboardTitle}>Vowel Signs (मात्रा)</h4>
        {renderKeys(hindiMatras, styles.keyboardRow)}
      </div>
      
      <div style={styles.keyboardSection}>
        <h4 style={styles.keyboardTitle}>Consonants (व्यंजन)</h4>
        <div style={styles.consonantGrid}>
          {hindiConsonants.map((key, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onKeyPress(key)}
              style={styles.keyboardKey}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      
      <div style={styles.keyboardSection}>
        <h4 style={styles.keyboardTitle}>Numerals & Special</h4>
        <div style={styles.keyboardRow}>
          {renderKeys(hindiNumerals.concat(specialChars), styles.keyboardRow)}
        </div>
      </div>
      
      <div style={styles.keyboardActions}>
        <button
          type="button"
          onClick={() => onKeyPress('BACKSPACE')}
          style={{...styles.keyboardKey, width: '100px'}}
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('SPACE')}
          style={{...styles.keyboardKey, width: '100px'}}
        >
          Space
        </button>
      </div>
    </div>
  );
};

// Create Page Component
const CreatePage = ({ addFlashcard }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [message, setMessage] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleKeyPress = (key) => {
    if (key === 'BACKSPACE') {
      setFront(front.slice(0, -1));
    } else if (key === 'SPACE') {
      setFront(front + ' ');
    } else {
      setFront(front + key);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (front.trim() === '' || back.trim() === '') {
      setMessage('Both fields are required.');
      return;
    }
    
    addFlashcard({ front, back });
    setFront('');
    setBack('');
    setMessage('Flashcard created successfully!');
    
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  return (
    <div style={styles.createContainer}>
      <h1 style={styles.pageTitle}>Create New Flashcard</h1>
      
      <form onSubmit={handleSubmit} style={styles.createForm}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Hindi Word/Phrase:</label>
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onFocus={() => setShowKeyboard(true)}
            style={styles.formInput}
            placeholder="Enter Hindi word or phrase"
          />
          <button
            type="button"
            onClick={() => setShowKeyboard(!showKeyboard)}
            style={styles.keyboardToggle}
          >
            {showKeyboard ? 'Hide Hindi Keyboard' : 'Show Hindi Keyboard'}
          </button>
        </div>
        
        {showKeyboard && (
          <div style={styles.keyboardWrapper}>
            <HindiKeyboard onKeyPress={handleKeyPress} />
          </div>
        )}
        
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>English Translation:</label>
          <input
            type="text"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onFocus={() => setShowKeyboard(false)}
            style={styles.formInput}
            placeholder="Enter English translation"
          />
        </div>
        
        <button type="submit" style={styles.submitButton}>Create Flashcard</button>
        
        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

// Styles
const styles = {
  // Main Layout
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
  },
  sidebarTitle: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '0 20px',
    fontSize: '1.5rem',
  },
  navButton: {
    backgroundColor: '#2c3e50',
    color: 'white',
    border: 'none',
    padding: '15px 20px',
    fontSize: '1rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginBottom: '5px',
  },
  content: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#f5f5f5',
    overflow: 'auto',
  },
  pageTitle: {
    color: '#2c3e50',
    marginBottom: '30px',
    borderBottom: '2px solid #4a6fa5',
    paddingBottom: '10px',
  },
  
  // Review Page
  reviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  reviewContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  flashcard: {
    width: '100%',
    height: '300px',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    fontSize: '2rem',
    padding: '20px',
    boxSizing: 'border-box',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4f8',
    transform: 'rotateY(180deg)',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    fontSize: '2rem',
    padding: '20px',
    boxSizing: 'border-box',
  },
  navigationControls: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '20px',
    alignItems: 'center',
  },
  navControlButton: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  cardCounter: {
    marginTop: '20px',
    color: '#666',
  },
  reviewOptions: {
    marginBottom: '20px',
    alignSelf: 'flex-start',
  },
  reviewModeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  feedbackButtons: {
    display: 'flex',
    gap: '10px',
  },
  correctButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  incorrectButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  
  // Search Page
  searchContainer: {
    padding: '20px',
  },
  searchBox: {
    marginBottom: '30px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxSizing: 'border-box',
  },
  searchResults: {
    marginTop: '20px',
  },
  resultTable: {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    padding: '15px',
    textAlign: 'left',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '15px',
    borderBottom: '1px solid #eee',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  
  // Stats Page
  statsContainer: {
    padding: '20px',
  },
  statsSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    width: '30%',
    textAlign: 'center',
  },
  statTitle: {
    color: '#4a6fa5',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    color: '#4a6fa5',
    marginBottom: '20px',
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
  
  // Create Page
  createContainer: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  createForm: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  formInput: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxSizing: 'border-box',
  },
  submitButton: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s',
  },
  message: {
    padding: '12px',
    marginTop: '20px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  
  // Hindi Keyboard Styles
  keyboardToggle: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginTop: '8px',
    transition: 'background-color 0.3s',
  },
  keyboardWrapper: {
    marginBottom: '20px',
    maxHeight: '350px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
  },
  keyboardSection: {
    marginBottom: '15px',
  },
  keyboardTitle: {
    color: '#4a6fa5',
    marginBottom: '10px',
    fontSize: '0.9rem',
  },
  keyboardRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '5px',
  },
  consonantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
  },
  keyboardKey: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    },
  },
  keyboardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));

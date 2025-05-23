// Card and deck utilities
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Create a deck of 52 cards
const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

const isDuplicateHand = (hand1, hand2) => {
    return hand1[0].value === hand2[0].value
    || hand1[0].value === hand2[1].value
    || hand1[1].value === hand2[0].value
    || hand1[1].value === hand2[1].value;
};

// Helper to check if payoutMultiplier is less than 1.4 for either side
const isLowPayout = (odds) => {
    const masterPayout = odds.masterWinProbability > 0 ? 1 / odds.masterWinProbability : Infinity;
    const sharkPayout = odds.sharkWinProbability > 0 ? 1 / odds.sharkWinProbability : Infinity;
    // console.log(odds);
    return masterPayout < 1.4 || sharkPayout < 1.4;
};

// Card display component
const Card = ({ card, hidden, className = "", highlight = false, greyed = false }) => {
    if (hidden) {
        return <div className={`card hidden ${className}`}>?</div>;
    }
    
    let displayValue = card.value;
    let displaySuit = '';
    
    if (card.suit === 'hearts') displaySuit = '♥';
    else if (card.suit === 'diamonds') displaySuit = '♦';
    else if (card.suit === 'clubs') displaySuit = '♣';
    else if (card.suit === 'spades') displaySuit = '♠';
    
    return (
        <div className={`card ${card.suit} ${className} ${highlight ? 'winning-card' : ''} ${greyed ? 'greyed-card' : ''}`}>
            {displayValue}{displaySuit}
        </div>
    );
};

// Hand evaluation functions
const getCardValue = (value) => {
    if (value === 'A') return 14;
    if (value === 'K') return 13;
    if (value === 'Q') return 12;
    if (value === 'J') return 11;
    return parseInt(value);
};

const getRank = (hand) => {
    // Convert hand format for evaluation
    const cards = hand.map(card => ({
        value: getCardValue(card.value),
        suit: card.suit
    }));
    
    // Sort by value descending
    cards.sort((a, b) => b.value - a.value);
    
    // Count values and suits
    const valueCounts = {};
    const suitCounts = {};
    
    cards.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    
    const valueCountsArray = Object.entries(valueCounts).sort((a, b) => {
        // Sort by count first (descending)
        if (b[1] !== a[1]) return b[1] - a[1];
        // Then by value (descending)
        return parseInt(b[0]) - parseInt(a[0]);
    });
    
    const values = cards.map(card => card.value);
    
    // Check for flush
    let flushSuit = null;
    for (const suit in suitCounts) {
        if (suitCounts[suit] >= 5) {
            flushSuit = suit;
            break;
        }
    }
    const isFlush = !!flushSuit;
    
    // Check for straight
    let isStraight = false;
    let straightHighCard = 0;
    
    // Check both Ace-high and Ace-low straights
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    // Check for Ace-high straight (10-J-Q-K-A)
    if (values.includes(14)) { // If we have an Ace
        const aceHighStraight = [10, 11, 12, 13, 14];
        if (aceHighStraight.every(value => values.includes(value))) {
            isStraight = true;
            straightHighCard = 14;
        }
    }
    
    // If no Ace-high straight, check for Ace-low straight (A-2-3-4-5)
    if (!isStraight && values.includes(14) && values.includes(2) && 
        values.includes(3) && values.includes(4) && values.includes(5)) {
        isStraight = true;
        straightHighCard = 5;
    }
    
    // Check normal straights
    if (!isStraight) {
        for (let i = 0; i < uniqueValues.length - 4; i++) {
            const consecutive = uniqueValues.slice(i, i + 5);
            if (consecutive[4] - consecutive[0] === 4) {
                isStraight = true;
                straightHighCard = consecutive[4];
                break;
            }
        }
    }
    
    // Royal flush
    if (isFlush && isStraight && straightHighCard === 14) {
        // Check if the straight is in the flush suit
        const flushCards = cards.filter(card => card.suit === flushSuit);
        const flushValues = flushCards.map(card => card.value);
        const aceHighStraight = [10, 11, 12, 13, 14];
        if (aceHighStraight.every(value => flushValues.includes(value))) {
            return { rank: 9, value: 14, flushSuit, flushValues: aceHighStraight };
        }
    }
    
    // Straight flush
    if (isFlush && isStraight) {
        // Check if the straight is in the flush suit
        const flushCards = cards.filter(card => card.suit === flushSuit);
        const flushValues = flushCards.map(card => card.value);
        // Check for Ace-low straight flush
        if (straightHighCard === 5 && [14, 2, 3, 4, 5].every(v => flushValues.includes(v))) {
            return { rank: 8, value: 5, flushSuit, flushValues: [5, 4, 3, 2, 14] };
        }
        // Check for normal straight flush
        for (let i = flushValues.length - 1; i >= 4; i--) {
            const straightSlice = flushValues.slice(i - 4, i + 1);
            if (straightSlice[0] - straightSlice[4] === 4) {
                return { rank: 8, value: straightSlice[0], flushSuit, flushValues: straightSlice };
            }
        }
    }
    
    // Four of a kind
    if (valueCountsArray[0][1] === 4) {
        return { 
            rank: 7, 
            value: parseInt(valueCountsArray[0][0]),
            kicker: valueCountsArray.length > 1 ? parseInt(valueCountsArray[1][0]) : 0
        };
    }
    
    // Full house
    if (valueCountsArray[0][1] === 3 && valueCountsArray[1][1] >= 2) {
        return { 
            rank: 6, 
            value: parseInt(valueCountsArray[0][0]),
            kicker: parseInt(valueCountsArray[1][0])
        };
    }
    
    // Flush
    if (isFlush) {
        const flushCards = cards.filter(card => card.suit === flushSuit).sort((a, b) => b.value - a.value);
        const flushValues = flushCards.slice(0, 5).map(card => card.value);
        return { 
            rank: 5, 
            values: flushValues,
            flushSuit
        };
    }
    
    // Straight
    if (isStraight) {
        return { rank: 4, value: straightHighCard };
    }
    
    // Three of a kind
    if (valueCountsArray[0][1] === 3) {
        return { 
            rank: 3, 
            value: parseInt(valueCountsArray[0][0]),
            kickers: values.filter(v => v !== parseInt(valueCountsArray[0][0])).slice(0, 2)
        };
    }
    
    // Two pair
    if (valueCountsArray[0][1] === 2 && valueCountsArray[1][1] === 2) {
        return { 
            rank: 2, 
            value1: parseInt(valueCountsArray[0][0]),
            value2: parseInt(valueCountsArray[1][0]),
            kicker: valueCountsArray.length > 2 ? parseInt(valueCountsArray[2][0]) : 0
        };
    }
    
    // One pair
    if (valueCountsArray[0][1] === 2) {
        return { 
            rank: 1, 
            value: parseInt(valueCountsArray[0][0]),
            kickers: values.filter(v => v !== parseInt(valueCountsArray[0][0])).slice(0, 3)
        };
    }
    
    // High card
    return { rank: 0, values: values.slice(0, 5) };
};

const getHandName = (rank) => {
    switch (rank.rank) {
        case 9: return "Royal Flush";
        case 8: return "Straight Flush";
        case 7: return "Four of a Kind";
        case 6: return "Full House";
        case 5: return "Flush";
        case 4: return "Straight";
        case 3: return "Three of a Kind";
        case 2: return "Two Pair";
        case 1: return "Pair";
        case 0: return "High Card";
        default: return "Unknown";
    }
};

const compareHands = (hand1, hand2) => {
    const rank1 = getRank([...hand1]);
    const rank2 = getRank([...hand2]);
    
    // Compare ranks first
    if (rank1.rank !== rank2.rank) {
        return rank1.rank - rank2.rank;
    }
    
    // If ranks are the same, compare the values
    switch (rank1.rank) {
        case 9: // Royal flush - always a tie
        case 8: // Straight flush
        case 4: // Straight
            return rank1.value - rank2.value;
        
        case 7: // Four of a kind
        case 6: // Full house
        case 3: // Three of a kind
        case 1: // One pair
            if (rank1.value !== rank2.value) {
                return rank1.value - rank2.value;
            }
            // If primary values are the same, compare kickers
            if (rank1.kicker && rank2.kicker) {
                return rank1.kicker - rank2.kicker;
            }
            if (rank1.kickers && rank2.kickers) {
                for (let i = 0; i < rank1.kickers.length; i++) {
                    if (rank1.kickers[i] !== rank2.kickers[i]) {
                        return rank1.kickers[i] - rank2.kickers[i];
                    }
                }
            }
            return 0;
        
        case 2: // Two pair
            if (rank1.value1 !== rank2.value1) {
                return rank1.value1 - rank2.value1;
            }
            if (rank1.value2 !== rank2.value2) {
                return rank1.value2 - rank2.value2;
            }
            return rank1.kicker - rank2.kicker;
        
        case 5: // Flush
            for (let i = 0; i < 5; i++) {
                if (rank1.values[i] !== rank2.values[i]) {
                    return rank1.values[i] - rank2.values[i];
                }
            }
            return 0;
        case 0: // High card
            for (let i = 0; i < rank1.values.length; i++) {
                if (rank1.values[i] !== rank2.values[i]) {
                    return rank1.values[i] - rank2.values[i];
                }
            }
            return 0;
        
        default:
            return 0;
    }
};

const simulateWinProbability = (masterCards, sharkCards, communityCards, iterations = 10000) => {
    let masterWins = 0;
    let sharkWins = 0;
    let ties = 0;
    const handResults = [];
    
    // Create a deck without the known cards
    const usedCards = [...masterCards, ...sharkCards, ...communityCards];
    let remainingDeck = createDeck().filter(card => 
        !usedCards.some(usedCard => 
            usedCard.suit === card.suit && usedCard.value === card.value
        )
    );
    
    for (let i = 0; i < iterations; i++) {
        const shuffledDeck = shuffleDeck(remainingDeck);
        const simulatedCommunityCards = [...communityCards];
        const cardsNeeded = 5 - simulatedCommunityCards.length;
        
        for (let j = 0; j < cardsNeeded; j++) {
            simulatedCommunityCards.push(shuffledDeck[j]);
        }
        
        const masterHand = [...masterCards, ...simulatedCommunityCards];
        const sharkHand = [...sharkCards, ...simulatedCommunityCards];
        
        const result = compareHands(masterHand, sharkHand);
        
        if (result > 0) masterWins++;
        else if (result < 0) sharkWins++;
        else ties++;
        
        const winningHand = result > 0 ? masterHand : sharkHand;
        const handRank = getRank(winningHand);
        handResults.push(handRank);
    }
    
    return {
        masterWinProbability: masterWins / iterations,
        sharkWinProbability: sharkWins / iterations,
        tieProbability: ties / iterations,
        handResults // Return the hand results for side odds calculation
    };
};

// QuickBetButton component
const QuickBetButton = ({ value, playerMoney, onClick, className = "", isSelected, disabled }) => {
    const isDisabled = disabled || value > playerMoney;
    const isAllIn = value === 'all';
    const displayValue = isAllIn ? 'All In' : '$' + value;
    
    return (
        <button 
            className={`quick-bet-button ${className} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => onClick(isAllIn ? playerMoney : value)}
            disabled={isDisabled}
        >
            {displayValue}
        </button>
    );
};

// Add constants for side bet categories
const SIDE_BETS = {
    LOW: { name: 'High Card/One Pair', ranks: [0, 1], odds: 0 },
    MEDIUM: { name: 'Two Pair', ranks: [2], odds: 0 },
    HIGH: { name: 'Three Kind/Straight/Flush', ranks: [3, 4, 5], odds: 0 },
    VERY_HIGH: { name: 'Full House', ranks: [6], odds: 0 },
    PREMIUM: { name: 'Quads/Royal/Straight Flush', ranks: [7, 8, 9], odds: 0 }
};

// Add rake constant - house takes 5% of winnings
const RAKE = 0.95;

// RealCard component for realistic poker card rendering
const SUIT_SYMBOLS = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
};
const SUIT_COLORS = {
    spades: '#222',
    clubs: '#222',
    hearts: '#d22',
    diamonds: '#d22',
};
const PIP_LAYOUTS = {
    '2': [[1],[1]],
    '3': [[1],[1],[1]],
    '4': [[2],[2]],
    '5': [[2],[1],[2]],
    '6': [[2],[2],[2]],
    '7': [[2],[1],[2],[2]],
    '8': [[2],[1],[2],[1],[2]],
    '9': [[2],[2],[1],[2],[2]],
    '10': [[2],[1],[2],[2],[1],[2]],
};
const RealCard = ({ value, suit, size = 200, hideCorners = false }) => {
    const isFace = ['J','Q','K','A'].includes(value);
    const pipColor = SUIT_COLORS[suit] || '#222';
    const suitSymbol = SUIT_SYMBOLS[suit] || '?';
    const pipLayout = PIP_LAYOUTS[value];
    // Make pip font size even smaller for all cards
    const pipFontSize = (value === '9' || value === '10') ? size * 0.2 : size * 0.24;
    // For pip rows, distribute from top to bottom
    let pipRows = [];
    if (!isFace && pipLayout) {
        const nRows = pipLayout.length;
        for (let i = 0; i < nRows; ++i) {
            // Distribute rows from 8% to 92% of card height
            const top = 0.1 + (i / (nRows - 1)) * 0.8;
            const nPips = pipLayout[i][0] + (pipLayout[i][1] || 0);
            let justify = 'center';
            let padding = 0;
            if (nPips === 2) {
                justify = 'space-between';
                padding = size * 0.2; // balanced padding
            }
            pipRows.push({
                row: pipLayout[i],
                style: {
                    position: 'absolute',
                    top: `${top * 100}%`,
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: justify,
                    alignItems: 'center',
                    pointerEvents: 'none',
                    transform: 'translateY(-50%)',
                    paddingLeft: nPips === 2 ? padding : 0,
                    paddingRight: nPips === 2 ? padding : 0,
                }
            });
        }
    }
    // Face card icons
    const faceIcons = { J: '🥷', Q: '👸', K: '🫅' };
    return (
        <div style={{
            width: size,
            height: size * 1.5,
            background: 'white',
            borderRadius: 15,
            boxShadow: '0 0 30px rgba(0,0,0,0.2)',
            border: '2px solid #bbb',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }}>
            {/* Top left value/suit */}
            {!hideCorners && (
                <div style={{
                    position: 'absolute',
                    top: 6,
                    left: 8,
                    color: pipColor,
                    fontWeight: 'bold',
                    fontSize: size * 0.16,
                    textAlign: 'left',
                    lineHeight: 1.1,
                }}>
                    {value}<br/>{suitSymbol}
                </div>
            )}
            {/* Bottom right value/suit (rotated) */}
            {!hideCorners && (
                <div style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 8,
                    color: pipColor,
                    fontWeight: 'bold',
                    fontSize: size * 0.16,
                    textAlign: 'right',
                    lineHeight: 1.1,
                    transform: 'rotate(180deg)',
                }}>
                    {value}<br/>{suitSymbol}
                </div>
            )}
            {/* Center: pips or face */}
            <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                color: pipColor,
                fontSize: pipFontSize,
                padding: 0,
            }}>
                {isFace ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{fontSize: size * 0.7, fontWeight: 'bold'}}>
                            {value === 'A' ? suitSymbol : faceIcons[value]}
                        </span>
                    </div>
                ) : (
                    pipRows.map((rowObj, i) => (
                        <div key={i} style={rowObj.style}>
                            {Array(rowObj.row[0]).fill(0).map((_, j) => (
                                <span key={j}>{suitSymbol}</span>
                            ))}
                            {rowObj.row[1] && Array(rowObj.row[1]).fill(0).map((_, j) => (
                                <span key={j+10}>{suitSymbol}</span>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Main Game Component
const PokerGame = () => {
    const [gameState, setGameState] = React.useState('betting'); // betting, dealing, result
    const [deck, setDeck] = React.useState([]);
    const [masterCards, setMasterCards] = React.useState([]);
    const [sharkCards, setSharkCards] = React.useState([]);
    const [communityCards, setCommunityCards] = React.useState([]);
    const [revealedCommunityCards, setRevealedCommunityCards] = React.useState(0);
    const [odds, setOdds] = React.useState({ master: 0.5, shark: 0.5, tie: 0 });
    const [playerMoney, setPlayerMoney] = React.useState(10000); // Changed initial money
    const [betAmount, setBetAmount] = React.useState('');
    const [playerBet, setPlayerBet] = React.useState(null); // 'master', 'shark', or null
    const [gameResult, setGameResult] = React.useState('');
    const [cardsRevealed, setCardsRevealed] = React.useState(true); // Set to true for auto-reveal at start
    const [winner, setWinner] = React.useState(null); // 'master', 'shark', or 'tie'
    const [winnings, setWinnings] = React.useState(0);
    const [masterHandName, setMasterHandName] = React.useState('');
    const [sharkHandName, setSharkHandName] = React.useState('');
    const [masterBet, setMasterBet] = React.useState(0);
    const [sharkBet, setSharkBet] = React.useState(0);
    const [sideBets, setSideBets] = React.useState({
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        VERY_HIGH: 0,
        PREMIUM: 0
    });
    const [sideWinnings, setSideWinnings] = React.useState({});
    const [sideOdds, setSideOdds] = React.useState({ ...SIDE_BETS });
    const [previousBets, setPreviousBets] = React.useState({
        master: 0,
        shark: 0,
        sideBets: {}
    });
    const [showFinalCard, setShowFinalCard] = React.useState(false);
    const [finalCardFlipped, setFinalCardFlipped] = React.useState(false);
    const [winHistory, setWinHistory] = React.useState([]);
    const [currentX, setCurrentX] = React.useState(0);
    const [currentY, setCurrentY] = React.useState(0);
    const [autoRevealTimer, setAutoRevealTimer] = React.useState(null);
    const [selectedBetButton, setSelectedBetButton] = React.useState(null);
    const [showHistoryPopup, setShowHistoryPopup] = React.useState(false);
    const [winningCardIndices, setWinningCardIndices] = React.useState([]);
    const [playerWon, setPlayerWon] = React.useState(false);
    const [isBettingLocked, setIsBettingLocked] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = React.useState(false);
    const dragThreshold = 120; // px
    const [gameId, setGameId] = React.useState(0); // Unique id for each game
    const timeoutsRef = React.useRef([]); // Store all timeouts
    const dealButtonRef = React.useRef(); // Add ref for Deal The Cards button

    const calculateSideOdds = (results) => {
        const totalHands = results.length;
        const counts = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            VERY_HIGH: 0,
            PREMIUM: 0
        };

        results.forEach(result => {
            Object.entries(SIDE_BETS).forEach(([key, value]) => {
                if (value.ranks.includes(result.rank)) {
                    counts[key]++;
                }
            });
        });

        return Object.entries(counts).reduce((acc, [key, count]) => {
            acc[key] = { ...SIDE_BETS[key], odds: count / totalHands };
            return acc;
        }, {});
    };

    const getNextPosition = (prevWinner, newWinner) => {
        // If this is a new winner or first entry, start a new column
        if (prevWinner !== newWinner || winHistory.length === 0) {
            // Find the next empty column
            const maxX = winHistory.length > 0 ? Math.max(...winHistory.map(item => item.x)) : -1;
            return {
                x: maxX + 1,
                y: 0
            };
        }
        
        // Continue in the same column - find last entry with same winner
        const currentEntries = winHistory.filter(item => item.winner === newWinner);
        const lastEntry = currentEntries[currentEntries.length - 1];
        
        // If column is full (10 entries), start a new column
        if (lastEntry.y >= 9) {
            return {
                x: lastEntry.x + 1,
                y: 0
            };
        }
        
        // Continue in same column, next row
        return {
            x: lastEntry.x,
            y: lastEntry.y + 1
        };
    };

    const updateWinHistory = (winner) => {
        const prevWinner = winHistory.length > 0 ? winHistory[winHistory.length - 1].winner : null;
        const pos = getNextPosition(prevWinner, winner);
        
        setWinHistory(prev => [...prev, { winner, x: pos.x, y: pos.y }]);
    
        // Reset history if we reach the end (20 columns)
        if (pos.x >= 20) {
            setWinHistory([{ winner, x: 0, y: 0 }]);
        }
    };

    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
    };

    const startNewGame = () => {
        console.log('startNewGame called');
        clearAllTimeouts(); // Clear all pending timeouts
        setGameId(prev => prev + 1); // Increment gameId for new game
        // Remove any artificial delay: immediately reset state
        let newDeck, newMasterCards, newSharkCards, newCommunityCards, oddsResult, newSideOdds;
        let tries = 0;
        do {
            newDeck = shuffleDeck(createDeck());
            newMasterCards = [newDeck[0], newDeck[2]];
            newSharkCards = [newDeck[1], newDeck[3]];
            newCommunityCards = [newDeck[4], newDeck[5], newDeck[6], newDeck[7], newDeck[8]];
            oddsResult = simulateWinProbability(newMasterCards, newSharkCards, [], 10000);
            newSideOdds = calculateSideOdds(oddsResult.handResults);
            tries++;
            if (tries > 30){ alert("Cannot find good game"); break;}
        } while (
            isLowPayout(oddsResult) || isDuplicateHand(newMasterCards, newSharkCards)
        );
        setDeck(newDeck);
        setMasterCards(newMasterCards);
        setSharkCards(newSharkCards);
        setCommunityCards(newCommunityCards);
        setRevealedCommunityCards(0);
        setGameState('betting');
        setPlayerBet(null);
        setGameResult('');
        setCardsRevealed(true);
        setWinner(null);
        setWinnings(0);
        setMasterHandName('');
        setSharkHandName('');
        setBetAmount('');
        setMasterBet(0);
        setSharkBet(0);
        setSideBets({
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            VERY_HIGH: 0,
            PREMIUM: 0
        });
        setSideWinnings({});
        setPlayerWon(false);
        setSelectedBetButton(null);
        setOdds({
            master: oddsResult.masterWinProbability,
            shark: oddsResult.sharkWinProbability,
            tie: oddsResult.tieProbability
        });
        setSideOdds(newSideOdds);
        if (winHistory.length > 100) {
            setWinHistory(prev => prev.slice(-100));
        }
        setIsBettingLocked(false);
        setDragOffset({x: 0, y: 0}); // Reset drag offset for reveal
    };
    
    // Load saved data from localStorage on initial render
    React.useEffect(() => {
        console.log('PokerGame initial mount, loading saved data');
        const savedData = localStorage.getItem('sharkMasterGameData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData.playerMoney) setPlayerMoney(parsedData.playerMoney);
                if (parsedData.winHistory) setWinHistory(parsedData.winHistory);
                if (parsedData.previousBets) setPreviousBets(parsedData.previousBets);
            } catch (e) {
                console.log('Error loading saved game data:', e);
            }
        }
        startNewGame();
    }, []);
    
    // Save important data to localStorage when it changes
    React.useEffect(() => {
        const dataToSave = {
            playerMoney,
            winHistory,
            previousBets
        };
        localStorage.setItem('sharkMasterGameData', JSON.stringify(dataToSave));
    }, [playerMoney, winHistory, previousBets]);
    
    const resetGame = () => {
        if (window.confirm('Reset game? This will set your balance back to 10,000 and clear history.')) {
            setPlayerMoney(10000);
            setWinHistory([]);
            setCurrentX(0);
            setCurrentY(0);
            setPreviousBets({
                master: 0,
                shark: 0,
                sideBets: {}
            });
            startNewGame();
            localStorage.removeItem('sharkMasterGameData');
        }
    };

    const handleQuickBet = (amount) => {
        // Only allow bet selection when betting is not locked
        if (isBettingLocked) return;
        
        // Find the highest available bet amount less than or equal to the player's money
        const betAmounts = [10000, 1000, 100, 10, 1];
        let nextBestBet = null;
        
        if (amount === 'all') {
            nextBestBet = playerMoney;
        } else if (amount > playerMoney) {
            // If clicked amount is too high, find next best bet
            nextBestBet = betAmounts.find(bet => bet <= playerMoney);
        } else {
            // Set clicked amount if it's affordable
            nextBestBet = amount;
        }
        
        if (nextBestBet !== null) {
            setBetAmount(nextBestBet.toString());
            setSelectedBetButton(nextBestBet);
        }
    };
    
    const placeBet = (side) => {
        // Block placing bets if betting is locked
        if (isBettingLocked) return;
        
        const amount = parseInt(betAmount);
        if (isNaN(amount) || amount <= 0) {
            console.log('Invalid bet amount');
            return;
        }
        
        if (amount > playerMoney) {
            console.log('Not enough funds for this bet');
            return;
        }
        
        if (side === 'master') {
            setMasterBet(prev => prev + amount);
        } else {
            setSharkBet(prev => prev + amount);
        }
        
        setPlayerMoney(prevMoney => prevMoney - amount);
    };

    const placeSideBet = (category) => {
        // Block placing side bets if betting is locked
        if (isBettingLocked) return;
        
        const amount = parseInt(betAmount);
        if (isNaN(amount) || amount <= 0) {
            console.log('Invalid bet amount');
            return;
        }
        
        if (amount > playerMoney) {
            console.log('Not enough funds for this bet');
            return;
        }
        
        setSideBets(prev => ({
            ...prev,
            [category]: prev[category] + amount
        }));
        setPlayerMoney(prev => prev - amount);
    };

    const repeatLastBet = () => {
        // Block repeating bets if betting is locked
        if (isBettingLocked) return;
        
        if (previousBets.master === 0 && previousBets.shark === 0 && 
            Object.values(previousBets.sideBets).every(v => v === 0)) {
            console.log('No previous bets to repeat');
            return;
        }

        const totalPreviousBet = previousBets.master + previousBets.shark + 
            Object.values(previousBets.sideBets).reduce((a, b) => a + b, 0);
            
        if (playerMoney < totalPreviousBet) {
            console.log('Not enough money to repeat previous bets');
            return;
        }

        setMasterBet(previousBets.master);
        setSharkBet(previousBets.shark);
        setSideBets(previousBets.sideBets);
        setPlayerMoney(prev => prev - totalPreviousBet);
    };

    const takeBetsBack = () => {
        // Block taking bets back if betting is locked
        if (isBettingLocked) return;
        
        setPlayerMoney(prev => prev + masterBet + sharkBet + 
            Object.values(sideBets).reduce((a, b) => a + b, 0));
        setMasterBet(0);
        setSharkBet(0);
        setSideBets({
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            VERY_HIGH: 0,
            PREMIUM: 0
        });
    };

    const showFinalCardReveal = (thisGameId) => {
        setShowFinalCard(true);
        setFinalCardFlipped(false);
        setDragOffset({x: 0, y: 0});
    };

    const handleFinalCardFlip = (thisGameId) => {
        clearAllTimeouts();
        setFinalCardFlipped(true);
        setTimeout(() => {
            if (gameId !== thisGameId) return;
            setShowFinalCard(false);
            setFinalCardFlipped(false);
            calculateWinner();
        }, 600); // Reduced delay after reveal
    };

    const startRound = (event) => {
        console.log('startRound called', event, { gameState, isBettingLocked });
        if (gameState !== 'betting' || isBettingLocked) {
            console.log('startRound blocked by guard', { gameState, isBettingLocked });
            return;
        }
        setGameState('dealing');
        setIsBettingLocked(true);
        setRevealedCommunityCards(3);
        const thisGameId = gameId;
        // Deal turn after 1 second (slightly increased delay)
        const t1 = setTimeout(() => {
            if (gameId !== thisGameId) return;
            setRevealedCommunityCards(4);
            // Show final card reveal after another 0.6 second (slightly increased delay)
            const t2 = setTimeout(() => {
                if (gameId !== thisGameId) return;
                showFinalCardReveal(thisGameId);
            }, 1000);
            timeoutsRef.current.push(t2);
        }, 1000);
        timeoutsRef.current.push(t1);
    };

    const calculateWinner = () => {
        // Reveal all community cards
        setRevealedCommunityCards(5);
        
        const masterHand = [...masterCards, ...communityCards];
        const sharkHand = [...sharkCards, ...communityCards];
        
        // Get hand rankings and find the best 5-card combination
        const masterRank = getRank(masterHand);
        const sharkRank = getRank(sharkHand);
        
        // Get hand names
        setMasterHandName(getHandName(masterRank));
        setSharkHandName(getHandName(sharkRank));
        
        const result = compareHands(masterHand, sharkHand);
        
        // Find winning cards
        const winningIndices = findWinningCardIndices(
            result > 0 ? masterCards : sharkCards, 
            communityCards, 
            result > 0 ? masterRank : sharkRank
        );
        setWinningCardIndices(winningIndices);
        
        let mainWinAmount = 0;  // Track main bet winnings separately
        let resultText = '';
        let totalWinnings = 0;

        if (result > 0) { // Master wins
            setWinner('master');
            updateWinHistory('master');
            
            // Calculate main bet winnings - pay BOTH sides if bet on winner
            if (masterBet > 0) { // If player bet on master, they win
                const payoutMultiplier = odds.master > 0 ? (1 / odds.master) : 1;
                mainWinAmount = Math.floor(masterBet * payoutMultiplier * RAKE);
                totalWinnings += mainWinAmount;
                setPlayerWon(true);
            }
        } else if (result < 0) { // Shark wins
            setWinner('shark');
            updateWinHistory('shark');
            
            // Calculate main bet winnings - pay BOTH sides if bet on winner
            if (sharkBet > 0) { // If player bet on shark, they win
                const payoutMultiplier = odds.shark > 0 ? (1 / odds.shark) : 1;
                mainWinAmount = Math.floor(sharkBet * payoutMultiplier * RAKE);
                totalWinnings += mainWinAmount;
                setPlayerWon(true);
            }
        } else { // Tie
            setWinner('tie');
            updateWinHistory('tie');
            
            // Return all main bets in a tie
            mainWinAmount = masterBet + sharkBet;
            totalWinnings += mainWinAmount;
            if (mainWinAmount > 0) {
                setPlayerWon(true);
            }
        }

        // Calculate side bet winnings
        const winningRank = getRank(result > 0 ? masterHand : sharkHand);
        const sideWinnings = {};
        let totalSideWinnings = 0;

        Object.entries(SIDE_BETS).forEach(([category, { ranks }]) => {
            if (ranks.includes(winningRank.rank) && sideBets[category] > 0) {
                const payoutMultiplier = sideOdds[category].odds > 0 ? 
                    Math.round((1 / sideOdds[category].odds) * 100) / 100 : 1;
                const sideWinAmount = Math.floor(sideBets[category] * payoutMultiplier * RAKE);
                sideWinnings[category] = sideWinAmount;
                totalSideWinnings += sideWinAmount;
            }
        });

        setSideWinnings(sideWinnings);
        
        // Only show numbers if there are winnings
        if (totalWinnings + totalSideWinnings > 0) {
            resultText = `+ $${totalWinnings + totalSideWinnings}`;
        } else {
            resultText = 'You lose.';
        }

        // Update player money
        if (mainWinAmount > 0) {
            setPlayerMoney(prev => prev + mainWinAmount);
        }
        if (totalSideWinnings > 0) {
            setPlayerMoney(prev => prev + totalSideWinnings);
        }
        
        setWinnings(mainWinAmount); // Store only main bet winnings in winnings state
        setGameResult(resultText);
        setGameState('result');
    };

    const findWinningCardIndices = (playerCards, communityCards, handRank) => {
        const allCards = [...playerCards, ...communityCards];
        const indices = [];
        
        switch (handRank.rank) {
            case 9: // Royal Flush
            case 8: // Straight Flush 
            case 5: // Flush
                // Find all cards of the same suit
                const flushSuit = findFlushSuit(allCards);
                // First get all cards of the matching suit
                const suitedCards = allCards
                    .map((card, index) => ({ card, index }))
                    .filter(item => item.card.suit === flushSuit)
                    .sort((a, b) => getCardValue(b.card.value) - getCardValue(a.card.value));

                // Take top 5 cards of that suit
                suitedCards.slice(0, 5).forEach(item => {
                    indices.push(item.index);
                });
                break;
                
            case 7: // Four of a kind
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (cardValue === handRank.value || cardValue === handRank.kicker) {
                        indices.push(index);
                    }
                });
                break;
                
            case 6: // Full house
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (cardValue === handRank.value || cardValue === handRank.kicker) {
                        indices.push(index);
                    }
                });
                break;
                
            case 4: // Straight
                // Get all unique values first, sorted ascending
                const sortedCards = allCards
                    .map((card, index) => ({ card, index, value: getCardValue(card.value) }))
                    .sort((a, b) => a.value - b.value); // Sort ascending for straights

                // Remove duplicates keeping the first occurrence
                const uniqueSortedCards = [];
                const seenValues = new Set();
                for (const card of sortedCards) {
                    if (!seenValues.has(card.value)) {
                        seenValues.add(card.value);
                        uniqueSortedCards.push(card);
                    }
                }

                // For Ace-low straight (A-2-3-4-5)
                if (handRank.value === 5 && seenValues.has(14)) {
                    const wheelStraight = uniqueSortedCards.filter(card => 
                        [2, 3, 4, 5, 14].includes(card.value)
                    );
                    wheelStraight.forEach(card => indices.push(card.index));
                }
                // For all other straights
                else {
                    // Find the start of our straight
                    for (let i = 0; i < uniqueSortedCards.length - 4; i++) {
                        const consecutive = uniqueSortedCards.slice(i, i + 5);
                        if (consecutive[4].value - consecutive[0].value === 4) {
                            // If this is our straight (matches the high card)
                            if (consecutive[4].value === handRank.value) {
                                consecutive.forEach(card => indices.push(card.index));
                                break;
                            }
                        }
                    }
                }
                break;
                
            case 3: // Three of a kind
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (cardValue === handRank.value || handRank.kickers?.includes(cardValue)) {
                        indices.push(index);
                    }
                });
                break;
                
            case 2: // Two pair
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (cardValue === handRank.value1 || cardValue === handRank.value2 || cardValue === handRank.kicker) {
                        indices.push(index);
                    }
                });
                break;
                
            case 1: // Pair
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (cardValue === handRank.value || handRank.kickers?.includes(cardValue)) {
                        indices.push(index);
                    }
                });
                break;
                
            case 0: // High card
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    if (handRank.values.includes(cardValue)) {
                        indices.push(index);
                    }
                });
                break;
        }
        
        // Convert indices to their correct positions relative to the hand being checked
        return indices.map(idx => {
            if (idx < 2) {
                // Player card indices stay the same (0,1)
                return idx;
            } else {
                // Community card indices need to be offset
                return idx;
            }
        }).slice(0, 5);
    };

    const findFlushSuit = (cards) => {
        const suitCounts = {};
        cards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });
        
        let flushSuit = null;
        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) flushSuit = suit;
        });
        
        return flushSuit;
    };

    const toggleHistoryPopup = () => {
        setShowHistoryPopup(prev => !prev);
    };

    React.useEffect(() => {
        return () => {
            if (autoRevealTimer) {
                clearTimeout(autoRevealTimer);
            }
        };
    }, [gameState]);
    
    // Add global listeners to always end drag
    React.useEffect(() => {
        const handleUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);
    
    React.useEffect(() => {
        console.log('PokerGame rendered', { gameState, isBettingLocked });
    });
    React.useEffect(() => {
        console.log('gameState changed:', gameState);
    }, [gameState]);
    React.useEffect(() => {
        console.log('isBettingLocked changed:', isBettingLocked);
    }, [isBettingLocked]);
    
    return (
        <div className="game-container">
            <div className="header">
                <h1>Shark or Master</h1>
                <span className="source-note"><a href="https://github.com/pwn2ooown/Shark_Or_Master" target="_blank">Source Code</a>. If you have any problems, just open an issue.</span>
            </div>
            
            <div className="game-layout">
                <div 
                    className={`player-section master ${gameState === 'betting' && !isBettingLocked ? 'clickable' : ''}`}
                    onClick={() => gameState === 'betting' && !isBettingLocked && betAmount && placeBet('master')}
                >
                    <img src="static/master.png" alt="Master" className="player-character" />
                    <div className={`player ${winner === 'master' ? 'winner-highlight' : ''}`}>
                        <h2>Master {masterHandName && gameState === 'result' && `(${masterHandName})`}</h2>
                        <div className="player-cards">
                            {masterCards.map((card, index) => {
                                let highlight = false, greyed = false;
                                if (gameState === 'result') {
                                    if (winner === 'master') {
                                        highlight = winningCardIndices.includes(index);
                                        greyed = !highlight;
                                    } else if (winner === 'shark') {
                                        greyed = true;
                                    }
                                }
                                return (
                                    <Card 
                                        key={`master-${card.suit}-${card.value}-${index}`}
                                        card={card} 
                                        hidden={!cardsRevealed && gameState !== 'result'} 
                                        className="card-reveal-animation"
                                        highlight={highlight}
                                        greyed={greyed}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    {(gameState === 'betting' || gameState === 'dealing') && (
                        <div className="player-bet-info">
                            <h3>${masterBet}</h3>
                            <p className="odds-display">× {odds.master > 0 ? (1 / odds.master).toFixed(2) : 'N/A'}</p>
                        </div>
                    )}
                    {gameState === 'result' && winner === 'master' && masterBet > 0 && (
                        <div className="player-bet-info">
                            <p className="winning-amount">+ ${Math.floor(masterBet * (1/odds.master) * RAKE)}</p>
                        </div>
                    )}
                </div>

                <div className="community-section">
                    <div className="community-cards">
                        <h2>Board</h2>
                        <div className="card-container">
                            {communityCards.slice(0, revealedCommunityCards).map((card, index) => {
                                const actualIndex = index + 2; // Add offset for player cards
                                let highlight = false, greyed = false;
                                if (gameState === 'result') {
                                    highlight = winningCardIndices.includes(actualIndex);
                                    greyed = !highlight;
                                }
                                return (
                                    <Card 
                                        key={`community-${card.suit}-${card.value}-${index}`}
                                        card={card} 
                                        hidden={false} 
                                        className="card-reveal-animation"
                                        highlight={highlight}
                                        greyed={greyed}
                                    />
                                );
                            })}
                            {revealedCommunityCards < 5 && Array(5 - revealedCommunityCards).fill(0).map((_, index) => (
                                <Card key={`hidden-${index}`} card={{}} hidden={true} />
                            ))}
                        </div>
                    </div>
                </div>

                <div 
                    className={`player-section shark ${gameState === 'betting' && !isBettingLocked ? 'clickable' : ''}`}
                    onClick={() => gameState === 'betting' && !isBettingLocked && betAmount && placeBet('shark')}
                >
                    <img src="static/shark.png" alt="Shark" className="player-character" />
                    <div className={`player ${winner === 'shark' ? 'winner-highlight' : ''}`}>
                        <h2>Shark {sharkHandName && gameState === 'result' && `(${sharkHandName})`}</h2>
                        <div className="player-cards">
                            {sharkCards.map((card, index) => {
                                let highlight = false, greyed = false;
                                if (gameState === 'result') {
                                    if (winner === 'shark') {
                                        highlight = winningCardIndices.includes(index);
                                        greyed = !highlight;
                                    } else if (winner === 'master') {
                                        greyed = true;
                                    }
                                }
                                return (
                                    <Card 
                                        key={`shark-${card.suit}-${card.value}-${index}`}
                                        card={card} 
                                        hidden={!cardsRevealed && gameState !== 'result'} 
                                        className="card-reveal-animation"
                                        highlight={highlight}
                                        greyed={greyed}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    {(gameState === 'betting' || gameState === 'dealing') && (
                        <div className="player-bet-info">
                            <h3>${sharkBet}</h3>
                            <p className="odds-display">× {odds.shark > 0 ? (1 / odds.shark).toFixed(2) : 'N/A'}</p>
                        </div>
                    )}
                    {gameState === 'result' && winner === 'shark' && sharkBet > 0 && (
                        <div className="player-bet-info">
                            <p className="winning-amount">+ ${Math.floor(sharkBet * (1/odds.shark) * RAKE)}</p>
                        </div>
                    )}
                </div>
            </div>

            {(gameState === 'betting' || gameState === 'dealing' || gameState === 'result') && (
                <>
                    <div className="side-bets">
                        <h3>Side Bets</h3>
                        <div className="side-bet-container">
                            {Object.entries(sideOdds).map(([category, { name, odds }]) => (
                                <div 
                                    key={category} 
                                    className={`side-bet-box ${gameState === 'betting' && !isBettingLocked ? 'clickable' : ''} 
                                        ${sideWinnings[category] ? 'winning-side-bet' : ''}`}
                                    onClick={() => gameState === 'betting' && !isBettingLocked && betAmount && placeSideBet(category)}
                                >
                                    <h4>{name}</h4>
                                    <p>${sideBets[category]}</p>
                                    <p>× {odds > 0 ? (1 / odds).toFixed(2) : 'N/A'}</p>
                                    {sideWinnings[category] && (
                                        <p className="green">+ ${sideWinnings[category]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {(gameState === 'betting' || gameState === 'dealing' ) && (
                        <div className="betting-area">
                            <div className="player-balance">
                                Balance: ${playerMoney}
                                <button className="reset-button" onClick={resetGame}>Reset Game</button>
                            </div>
                            
                            <div className="betting-buttons-wrapper">
                                <div className="quick-bet-buttons">
                                    <QuickBetButton 
                                        value={1} 
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className={`small ${isBettingLocked ? 'locked' : ''}`}
                                        isSelected={selectedBetButton === 1}
                                        disabled={isBettingLocked}
                                    />
                                    <QuickBetButton 
                                        value={10} 
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className={`small ${isBettingLocked ? 'locked' : ''}`}
                                        isSelected={selectedBetButton === 10}
                                        disabled={isBettingLocked}
                                    />
                                    <QuickBetButton 
                                        value={100} 
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className={`medium ${isBettingLocked ? 'locked' : ''}`}
                                        isSelected={selectedBetButton === 100}
                                        disabled={isBettingLocked}
                                    />
                                    <QuickBetButton 
                                        value={1000} 
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className={`large ${isBettingLocked ? 'locked' : ''}`}
                                        isSelected={selectedBetButton === 1000}
                                        disabled={isBettingLocked}
                                    />
                                    <QuickBetButton 
                                        value={10000} 
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className={`max ${isBettingLocked ? 'locked' : ''}`}
                                        isSelected={selectedBetButton === 10000}
                                        disabled={isBettingLocked}
                                    />
                                    <QuickBetButton 
                                        value={'all'}
                                        playerMoney={playerMoney} 
                                        onClick={handleQuickBet} 
                                        className="all-in"
                                        isSelected={selectedBetButton === playerMoney}
                                        disabled={isBettingLocked}
                                    />
                                </div>
                                <div className="controls-container">
                                    <button 
                                        className={`repeat-bet ${isBettingLocked ? 'locked' : ''}`} 
                                        onClick={repeatLastBet}
                                        disabled={isBettingLocked}
                                    >
                                        Repeat Last Bet
                                    </button>
                                    <button 
                                        ref={dealButtonRef} 
                                        className="start-game" 
                                        onClick={e => {
                                            console.log('Deal The Cards button clicked', e);
                                            startRound(e);
                                        }} 
                                        disabled={isBettingLocked}
                                        onFocus={() => console.log('Deal The Cards button focused')}
                                        onBlur={() => console.log('Deal The Cards button blurred')}
                                    >
                                        {isBettingLocked ? "Dealing..." : "Deal The Cards"}
                                    </button>
                                    <button 
                                        className={`take-back ${isBettingLocked ? 'locked' : ''}`} 
                                        onClick={takeBetsBack}
                                        disabled={isBettingLocked}
                                    >
                                        Take Back Bets
                                    </button>
                                </div>
                            </div>
                            
                            {gameState === 'betting' && parseInt(betAmount) > playerMoney && (
                                <></>
                            )}
                            
                            {isBettingLocked && gameState === 'betting' && (
                                <div className="betting-locked-message">
                                    Bets are locked. Dealing in progress...
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            
            {playerWon && gameState === 'result' && (
                <div className="winning-message-container">
                    <div className="winning-message">
                        {gameResult}
                    </div>
                </div>
            )}
            
            <button className="history-button" onClick={toggleHistoryPopup}>
                Click to Show History
            </button>
            
            <div className="disclaimer-container">
                <div className="disclaimer">
                    For entertainment purposes only.
                    All money in this game are virtual and have no real-world value.
                    Please play responsibly.
                    <span className="rake-note">A 5% rake is taken from all winnings.</span>
                </div>
            </div>
            
            {showHistoryPopup && (
                <div className="history-popup">
                    <div className="history-popup-content">
                        <button className="close-button" onClick={toggleHistoryPopup}>×</button>
                        <h3>Win History</h3>
                        <div className="history-grid">
                            {Array.from({ length: 10 }).map((_, row) => (
                                <React.Fragment key={row}>
                                    {Array.from({ length: 20 }).map((_, col) => {
                                        const historyItem = winHistory.find(
                                            item => item.x === col && item.y === row
                                        );
                                        return (
                                            <div
                                                key={`${row}-${col}`}
                                                className={`history-cell ${historyItem?.winner || ''}`}
                                            >
                                                {historyItem?.winner?.[0]?.toUpperCase()}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {showFinalCard && (
                <div className="final-card-container">
                    <div style={{ position: 'relative', width: 200, height: 300 }}>
                        {/* Bottom card: the real final card */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 200,
                                height: 300,
                                zIndex: 1,
                            }}
                        >
                            {communityCards[4] && (
                              <RealCard
                                value={communityCards[4].value}
                                suit={communityCards[4].suit}
                                size={200}
                                hideCorners={!finalCardFlipped}
                              />
                            )}
                        </div>
                        {/* Top card: card back, draggable */}
                        {!finalCardFlipped && (
                            <div
                                className="final-card-back"
                                style={{
                                    position: 'absolute',
                                    top: dragOffset.y || 0,
                                    left: dragOffset.x || 0,
                                    width: 200,
                                    height: 300,
                                    zIndex: 2,
                                    backgroundImage: "url('static/cardback.png')",
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: 15,
                                    boxShadow: '0 0 30px rgba(255,255,255,0.3)',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    transition: isDragging ? 'none' : 'top 0.3s, left 0.3s',
                                }}
                                onMouseDown={e => {
                                    setIsDragging(true);
                                    setDragOffset({ x: 0, y: 0 });
                                    window._dragStart = { x: e.clientX, y: e.clientY };
                                }}
                                onMouseMove={e => {
                                    if (!isDragging || !window._dragStart) return;
                                    const dx = e.clientX - window._dragStart.x;
                                    const dy = e.clientY - window._dragStart.y;
                                    setDragOffset({ x: dx, y: dy });
                                    // Reveal if card is dragged far enough (e.g., 120px in any direction)
                                    if (Math.abs(dx) > 120 || Math.abs(dy) > 180) {
                                        setIsDragging(false);
                                        handleFinalCardFlip(gameId);
                                    }
                                }}
                                onMouseUp={e => {
                                    setIsDragging(false);
                                    window._dragStart = null;
                                }}
                                onMouseLeave={e => {
                                    setIsDragging(false);
                                    window._dragStart = null;
                                }}
                                onTouchStart={e => {
                                    setIsDragging(true);
                                    setDragOffset({ x: 0, y: 0 });
                                    if (e.touches && e.touches[0]) {
                                        window._dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                                    }
                                }}
                                onTouchMove={e => {
                                    if (!isDragging || !window._dragStart || !e.touches[0]) return;
                                    const dx = e.touches[0].clientX - window._dragStart.x;
                                    const dy = e.touches[0].clientY - window._dragStart.y;
                                    setDragOffset({ x: dx, y: dy });
                                    if (Math.abs(dx) > 120 || Math.abs(dy) > 180) {
                                        setIsDragging(false);
                                        handleFinalCardFlip(gameId);
                                    }
                                }}
                                onTouchEnd={e => {
                                    setIsDragging(false);
                                    window._dragStart = null;
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
            
            {gameState === 'result' && (
                <div className="controls">
                    <button className="new-game" onClick={startNewGame}>New Game</button>
                </div>
            )}
        </div>
    );
};

// Render the app
ReactDOM.render(
    <PokerGame />,
    document.getElementById('root')
);

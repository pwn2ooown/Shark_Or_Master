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
    const isFlush = Object.values(suitCounts).some(count => count >= 5);
    
    // Check for straight
    let isStraight = false;
    let straightHighCard = 0;
    
    // Handle Ace low straight (A-5-4-3-2)
    if (values.includes(14) && values.includes(5) && values.includes(4) && 
        values.includes(3) && values.includes(2)) {
        isStraight = true;
        straightHighCard = 5;
    } else {
        // Check normal straights
        const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
        for (let i = 0; i <= uniqueValues.length - 5; i++) {
            if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
                isStraight = true;
                straightHighCard = uniqueValues[i];
                break;
            }
        }
    }
    
    // Royal flush
    if (isFlush && isStraight && straightHighCard === 14) {
        return { rank: 9, value: 14 }; // Royal Flush
    }
    
    // Straight flush
    if (isFlush && isStraight) {
        return { rank: 8, value: straightHighCard }; // Straight Flush
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
        return { 
            rank: 5, 
            values: values.slice(0, 5) // Keep top 5 cards for comparison
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

const formatPercentage = (value) => {
    return (value * 100).toFixed(2) + '%';
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
    const [startX, setStartX] = React.useState(null);
    const [showHistoryPopup, setShowHistoryPopup] = React.useState(false);
    const [winningCardIndices, setWinningCardIndices] = React.useState([]);
    const [playerWon, setPlayerWon] = React.useState(false);
    const [isBettingLocked, setIsBettingLocked] = React.useState(false);
    const [revealProgress, setRevealProgress] = React.useState(0);
    const [swipeInfo, setSwipeInfo] = React.useState({ startX: null, currentX: null });

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

    const getNextPosition = (prevWinner) => {
        // Find the last entry in current column if exists
        const currentColumn = winHistory.filter(item => item.x === currentX);
        const nextY = currentColumn.length;
        
        // If column is full or winner changed, move to next column
        if (nextY >= 10 || (prevWinner !== null && prevWinner !== winner)) {
            return {
                x: currentX + 1,
                y: 0
            };
        }
        
        // Stay in same column, next row
        return {
            x: currentX,
            y: nextY
        };
    };

    const updateWinHistory = (winner) => {
        const prevWinner = winHistory.length > 0 ? winHistory[winHistory.length - 1].winner : null;
        const pos = getNextPosition(prevWinner);
        
        setWinHistory(prev => [...prev, { winner, x: pos.x, y: pos.y }]);
        setCurrentX(pos.x);
        setCurrentY(pos.y);

        // Reset to first column if we reach the end
        if (pos.x >= 20) {
            setWinHistory([]);
            setCurrentX(0);
            setCurrentY(0);
        }
    };

    // Helper to check if both players have the same two card values (regardless of suit)
    const isDuplicateHand = (hand1, hand2) => {
        const values1 = hand1.map(card => card.value).sort();
        const values2 = hand2.map(card => card.value).sort();
        return values1[0] === values2[0] && values1[1] === values2[1];
    };

    // Helper to check if payoutMultiplier is less than 1.4 for either side
    const isLowPayout = (odds) => {
        const masterPayout = odds.master > 0 ? 1 / odds.master : 0;
        const sharkPayout = odds.shark > 0 ? 1 / odds.shark : 0;
        return masterPayout < 1.4 || sharkPayout < 1.4;
    };

    const startNewGame = () => {
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
            // Prevent infinite loop in rare case (should never happen in practice)
            if (tries > 20) break;
        } while (
            isDuplicateHand(newMasterCards, newSharkCards) ||
            isLowPayout(oddsResult)
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
    };
    
    // Load saved data from localStorage on initial render
    React.useEffect(() => {
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

    const showFinalCardReveal = () => {
        setShowFinalCard(true);
        setRevealProgress(0);
        // Start 5 second timer for auto-reveal
        const timer = setTimeout(() => {
            if (!finalCardFlipped) {
                handleFinalCardFlip();
            }
        }, 5000);
        setAutoRevealTimer(timer);
    };

    const handleFinalCardFlip = () => {
        // Clear auto-reveal timer
        if (autoRevealTimer) {
            clearTimeout(autoRevealTimer);
            setAutoRevealTimer(null);
        }
        setFinalCardFlipped(true);
        setRevealProgress(100);
        setTimeout(() => {
            setShowFinalCard(false);
            setFinalCardFlipped(false);
            setRevealProgress(0);
            calculateWinner();
        }, 1500);
    };

    // Add a simple click handler for the final card
    const handleCardClick = () => {
        if (!finalCardFlipped) {
            handleFinalCardFlip();
        }
    };

    const handleTouchStart = (e) => {
        setSwipeInfo({
            startX: e.touches[0].clientX,
            currentX: e.touches[0].clientX
        });
    };

    const handleTouchMove = (e) => {
        if (!swipeInfo.startX) return;
        
        const touchX = e.touches[0].clientX;
        setSwipeInfo(prev => ({ ...prev, currentX: touchX }));
        
        // Calculate reveal progress based on swipe distance
        const cardWidth = 200; // Width of the card
        const maxSwipeDistance = cardWidth; // Reduced distance needed for full reveal
        const swipeDistance = swipeInfo.startX - touchX;
        
        if (swipeDistance > 0) { // Only process left swipes
            // Ensure progress is between 0 and 100
            const progress = Math.min(100, Math.max(0, (swipeDistance / maxSwipeDistance) * 100));
            setRevealProgress(progress);
            
            // Auto-flip when revealing more than 50%
            if (progress > 50 && !finalCardFlipped) {
                handleFinalCardFlip();
            }
        }
    };

    const handleTouchEnd = () => {
        if (revealProgress < 50 && !finalCardFlipped) {
            // Reset to hidden if not revealed enough
            setRevealProgress(0);
        }
        setSwipeInfo({ startX: null, currentX: null });
    };

    const handleMouseDown = (e) => {
        setSwipeInfo({
            startX: e.clientX,
            currentX: e.clientX
        });
    };

    const handleMouseMove = (e) => {
        if (!swipeInfo.startX) return;
        
        setSwipeInfo(prev => ({ ...prev, currentX: e.clientX }));
        
        // Calculate reveal progress based on swipe distance
        const cardWidth = 200; // Width of the card
        const maxSwipeDistance = cardWidth; // Reduced distance needed for full reveal
        const swipeDistance = swipeInfo.startX - e.clientX;
        
        if (swipeDistance > 0) { // Only process left swipes
            // Ensure progress is between 0 and 100
            const progress = Math.min(100, Math.max(0, (swipeDistance / maxSwipeDistance) * 100));
            setRevealProgress(progress);
            
            // Auto-flip when revealing more than 50%
            if (progress > 50 && !finalCardFlipped) {
                handleFinalCardFlip();
            }
        }
    };

    const handleMouseUp = () => {
        if (revealProgress < 50 && !finalCardFlipped) {
            // Reset to hidden if not revealed enough
            setRevealProgress(0);
        }
        setSwipeInfo({ startX: null, currentX: null });
    };

    const startRound = () => {
        // Check if there's at least one bet placed (either main bet or side bet)
        const totalBets = masterBet + sharkBet + Object.values(sideBets).reduce((sum, bet) => sum + bet, 0);
        
        if (totalBets === 0) {
            console.log('Please place at least one bet');
            return;
        }
        
        // Save current bets as previous bets
        setPreviousBets({
            master: masterBet,
            shark: sharkBet,
            sideBets: {...sideBets}
        });
        
        // Determine main bet (if both main bets are 0 but side bets exist)
        if (masterBet === 0 && sharkBet === 0) {
            // Set a default player bet when only side bets are placed
            setPlayerBet(Math.random() > 0.5 ? 'master' : 'shark');
        } else {
            setPlayerBet(masterBet > sharkBet ? 'master' : 'shark');
        }
        
        setGameState('dealing');
        
        // Lock betting when round starts
        setIsBettingLocked(true);
        
        // Deal first three cards (flop) immediately
        setRevealedCommunityCards(3);
        
        // After 1 second, deal turn
        setTimeout(() => {
            setRevealedCommunityCards(4);
            // After another second, show final card reveal
            setTimeout(() => {
                showFinalCardReveal();
            }, 1000);
        }, 1000);
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
        
        let winAmount = 0;
        let resultText = '';
        let totalSideWinnings = 0; // Track side bet winnings separately
        
        if (result > 0) { // Master wins
            setWinner('master');
            updateWinHistory('master');
            resultText = `Master wins with ${getHandName(masterRank)}!`;
            if (playerBet === 'master') {
                const payoutMultiplier = odds.master > 0 ? Math.round((1 / odds.master) * 100) / 100 : 1;
                // Apply rake to winnings
                winAmount = Math.floor(masterBet * payoutMultiplier * RAKE);
                resultText += ` You win $${winAmount} on main bet! (5% rake applied)`;
                setPlayerWon(true);
            } else if (playerBet === 'shark') {
                resultText += ' You lose your main bet.';
                setPlayerWon(false);
            }
        } else if (result < 0) { // Shark wins
            setWinner('shark');
            updateWinHistory('shark');
            resultText = `Shark wins with ${getHandName(sharkRank)}!`;
            if (playerBet === 'shark') {
                const payoutMultiplier = odds.shark > 0 ? Math.round((1 / odds.shark) * 100) / 100 : 1;
                // Apply rake to winnings
                winAmount = Math.floor(sharkBet * payoutMultiplier * RAKE);
                resultText += ` You win $${winAmount} on main bet! (5% rake applied)`;
                setPlayerWon(true);
            } else if (playerBet === 'master') {
                resultText += ' You lose your main bet.';
                setPlayerWon(false);
            }
        } else { // Tie
            setWinner('tie');
            updateWinHistory('tie');
            resultText = `It's a tie! Both players have ${getHandName(masterRank)}.`;
            if (playerBet) {
                // Return bet on tie
                winAmount = masterBet + sharkBet;
                resultText += ' Your bet is returned.';
            }
        }
        
        // Calculate side bet winnings
        const winningRank = getRank(result > 0 ? masterHand : sharkHand);
        const sideWinnings = {};

        Object.entries(SIDE_BETS).forEach(([category, { ranks }]) => {
            if (ranks.includes(winningRank.rank) && sideBets[category] > 0) {
                const payoutMultiplier = sideOdds[category].odds > 0 ? 
                    Math.round((1 / sideOdds[category].odds) * 100) / 100 : 1;
                // Apply rake to side bet winnings
                const sideWinAmount = Math.floor(sideBets[category] * payoutMultiplier * RAKE);
                sideWinnings[category] = sideWinAmount;
                totalSideWinnings += sideWinAmount;
            }
        });

        setSideWinnings(sideWinnings);
        
        // Add side bet details to result text if any side bets won
        if (totalSideWinnings > 0) {
            resultText += ` You also won $${totalSideWinnings} on side bets!`;
            setPlayerMoney(prev => prev + totalSideWinnings);
        }
        
        // Set total winnings (main bet + side bets)
        const totalWinnings = winAmount + totalSideWinnings;
        if (winAmount > 0) {
            setPlayerMoney(prevMoney => prevMoney + winAmount);
        }
        
        setWinnings(totalWinnings);
        setGameResult(resultText);
        setGameState('result');
    };

    const findWinningCardIndices = (playerCards, communityCards, handRank) => {
        const allCards = [...playerCards, ...communityCards];
        const indices = [];
        
        // Based on hand type, find the cards that form the winning hand
        switch (handRank.rank) {
            case 9: // Royal Flush
            case 8: // Straight Flush 
            case 5: // Flush
                // Find all cards of the same suit
                const flushSuit = findFlushSuit(allCards);
                allCards.forEach((card, index) => {
                    if (card.suit === flushSuit) {
                        // For straight flush, check if it's part of the straight
                        if (handRank.rank === 8 || handRank.rank === 9) {
                            const cardValue = getCardValue(card.value);
                            const highCard = handRank.value;
                            // For 5-high straight (A-5-4-3-2), special case
                            if (highCard === 5 && card.value === 'A') {
                                indices.push(index);
                            } else if (cardValue <= highCard && cardValue > highCard - 5) {
                                indices.push(index);
                            }
                        } else {
                            // For regular flush, take top 5 cards
                            const cardValue = getCardValue(card.value);
                            if (handRank.values.includes(cardValue)) {
                                indices.push(index);
                            }
                        }
                    }
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
                allCards.forEach((card, index) => {
                    const cardValue = getCardValue(card.value);
                    const highCard = handRank.value;
                    // For 5-high straight (A-5-4-3-2), special case
                    if (highCard === 5 && card.value === 'A') {
                        indices.push(index);
                    } else if (cardValue <= highCard && cardValue > highCard - 5) {
                        indices.push(index);
                    }
                });
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
        
        // Limit to 5 cards and make sure we include player cards
        return indices.slice(0, 5);
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
    
    return (
        <div className="game-container">
            <div className="header">
                <h1>Shark or Master</h1>
                <span className="source-note">Source code is at <a href="https://github.com/pwn2ooown/Shark_Or_Master" target="_blank">GitHub</a>. If you have any problems, just open an issue.</span>
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
                                        key={`master-${index}`} 
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
                </div>

                <div className="community-section">
                    <div className="community-cards">
                        <h2>Community Cards</h2>
                        <div className="card-container">
                            {communityCards.slice(0, revealedCommunityCards).map((card, index) => {
                                const actualIndex = masterCards.length + index;
                                let highlight = false, greyed = false;
                                if (gameState === 'result') {
                                    highlight = winningCardIndices.includes(actualIndex);
                                    greyed = !highlight;
                                }
                                return (
                                    <Card 
                                        key={`community-${index}`} 
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
                                        key={`shark-${index}`} 
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
                </div>
            </div>

            {(gameState === 'betting' || gameState === 'dealing') && (
                <>
                    <div className="side-bets">
                        <h3>Side Bets</h3>
                        <div className="side-bet-container">
                            {Object.entries(sideOdds).map(([category, { name, odds }]) => (
                                <div 
                                    key={category} 
                                    className={`side-bet-box ${gameState === 'betting' && !isBettingLocked ? 'clickable' : ''}`}
                                    onClick={() => gameState === 'betting' && !isBettingLocked && betAmount && placeSideBet(category)}
                                >
                                    <h4>{name}</h4>
                                    <p>${sideBets[category]}</p>
                                    <p>× {odds > 0 ? (1 / odds).toFixed(2) : 'N/A'}</p>
                                    {sideWinnings[category] && (
                                        <p className="green">Won ${sideWinnings[category]}!</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

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
                                <button className="start-game" onClick={startRound}>
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
                </>
            )}
            
            {playerWon && winnings > 0 && gameState === 'result' && (
                <div className="winning-message-container">
                    <div className="winning-message">
                        You Win ${winnings}!
                    </div>
                </div>
            )}
            
            <button className="history-button" onClick={toggleHistoryPopup}>
                Click to Show History
            </button>
            
            <div className="disclaimer-container">
                <div className="disclaimer">
                    For entertainment purposes only.
                    All money and bets in this game are virtual and have no real-world value.
                    Please gamble responsibly.
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
                    <div className="swipe-instruction">← Swipe or click to reveal</div>
                    <div 
                        className={`final-card ${finalCardFlipped ? 'flipped' : ''}`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={handleCardClick}
                        style={{ transform: finalCardFlipped ? 'rotateY(180deg)' : `rotateY(${revealProgress * 1.8}deg)` }}
                    >
                        <div className="final-card-front">
                            <Card 
                                card={communityCards[4]} 
                                hidden={false} 
                                className="big-final-card"
                            />
                        </div>
                        <div className="final-card-back" style={{ backgroundImage: `url('static/cardback.png')`, backgroundSize: 'cover' }}>
                        </div>
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

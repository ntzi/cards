import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let aceCount = 0;

  hand.forEach((card) => {
    let value: number;

    switch (card.rank) {
      case CardRank.Ace:
        value = 11;
        break;
      case CardRank.King:
      case CardRank.Queen:
      case CardRank.Jack:
      case CardRank.Ten:
        value = 10;
        break;
      default:
        value = parseInt(card.rank, 10);
    }

    score += value;

    if (card.rank === CardRank.Ace) {
      aceCount += 1;
    }
  });

  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount -= 1;
  }

  return score;
};

// Determine if a hand has a blackjack
const hasBlackJack = (hand: Hand): boolean => {
  if (hand.length !== 2) {
    return false;
  }

  const firstCardIsAce = hand[0].rank === CardRank.Ace;
  const secondCardIsAce = hand[1].rank === CardRank.Ace;
  const firstCardIsFaceOrTen =
    parseInt(hand[0].rank) === 10 ||
    hand[0].rank === CardRank.King ||
    hand[0].rank === CardRank.Queen ||
    hand[0].rank === CardRank.Jack;
  const secondCardIsFaceOrTen =
    parseInt(hand[1].rank) === 10 ||
    hand[1].rank === CardRank.King ||
    hand[1].rank === CardRank.Queen ||
    hand[1].rank === CardRank.Jack;

  return (
    (firstCardIsAce && secondCardIsFaceOrTen) ||
    (firstCardIsFaceOrTen && secondCardIsAce)
  );
};

const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);

  if (playerScore > 21) {
    return "dealer_win";
  } else if (dealerScore > 21) {
    return "player_win";
  } else if (
    hasBlackJack(state.playerHand) &&
    !hasBlackJack(state.dealerHand)
  ) {
    return "player_win";
  } else if (
    hasBlackJack(state.dealerHand) &&
    !hasBlackJack(state.playerHand)
  ) {
    return "dealer_win";
  } else if (playerScore === dealerScore) {
    return "draw";
  } else if (playerScore > dealerScore) {
    return "player_win";
  } else {
    return "dealer_win";
  }
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  const dealerScore = calculateHandScore(state.dealerHand);

  if (state.turn === "player_turn" && dealerScore <= 16) {
    const { card, remaining } = takeCard(state.cardDeck);
    return {
      ...state,
      cardDeck: remaining,
      dealerHand: [...state.dealerHand, card],
      turn: "dealer_turn",
    };
  } else {
    return {
      ...state,
      turn: "dealer_turn",
    };
  }
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>
          Reset
        </button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};

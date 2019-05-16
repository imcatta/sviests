const _ = require('lodash');
const data = require('../data.json');
const Datastore = require('./datastore.js');

class Round {
    constructor(gameId, players = {}, whiteCardsUsed = [], blackCardsUsed = [], previousJudge) {
        this.gameId = gameId;
        this.id = _.uniqueId(Math.floor(Date.now() / 1000));
        this.players = players;
        this.playerIds = _.map(this.players, (p => p.id));
        this.whiteCardsUsed = [...whiteCardsUsed];
        this.blackCardsUsed = [...blackCardsUsed];
        this.previousJudge = previousJudge;

        // Temporary fix to avoid crashing
        this.gameInterrupt = false;

        this.whiteCard = {};
        this.chosenWhiteCards = {};
        this.winnerId = null;
        this.judgeId = null;

        this.allocateWhiteCards();
        this.allocateBlackCard();/* .then(() => {
            this.assignJudge();
        }); */
        this.assignJudge();

        // TODO: Use a more elegant way to resolve this promise
        this.saveGame().then(() => { });
    }

    get _blackCardIndex() {
        return this.blackCard.index;
    }

    playerLeft(playerId) {
        console.log("playerLeft " + playerId);
        this.gameInterrupt = true;

        const player = this.players[playerId];
        console.log('gameID' + this.gameId);
        // if (!player && !player.cards) { return; }
        //delete this.chosenWhiteCards[playerId];
        //
        // player.cards.forEach((card) => {
        //  const cardIndex = _.findIndex(this.whiteCardsUsed, { index: card.index });
        //  this.whiteCardsUsed.splice(cardIndex, 1);
        //});
        //
        delete this.players[playerId];
        this.playerIds = _.map(this.players, (p => p.id));

        console.log('playerIDs that are left ' + this.playerIds);

        if (this.judgeId === playerId) {
            this.judgeId = null;
            this.assignJudge();
        }
    }

    playerJoined(player) {
        console.log("playerJoined: " + JSON.stringify(player));

        // Temporary fix
        //if (!this.gameInterrupt) {
        this.players[player.id] = player;
        this.playerIds.push(player.id);
        this.allocateWhiteCards();
        //}
    }

    assignJudge() {
        if (!this.previousJudge) {
            this.judgeId = this.playerIds[0];
        } else {
            const nextJudgeIndex = this.playerIds.indexOf(this.previousJudge) + 1;
            if (this.playerIds[nextJudgeIndex]) {
                this.judgeId = this.playerIds[nextJudgeIndex];
            } else {
                this.judgeId = this.playerIds[0];
            }
        }
    }

    getWhiteCard() {
        const whiteCards = data.whiteCards;
        const index = _.random(0, whiteCards.length - 1)

        if (this.whiteCardsUsed.includes(index)) {
            return this.getWhiteCard();
        }

        return index;
    }

    allocateBlackCard() {
        const blackCards = data.blackCards;
        const index = _.random(0, blackCards.length - 1)

        if (this.blackCardsUsed.includes(index)) {
            return this.allocateBlackCard();
        }

        this.blackCardsUsed.push(index);
        this.blackCard = {
            index: index,
            text: blackCards[index].text,
            pick: blackCards[index].pick
        }

        // Datastore.set(this.gameId, JSON.stringify({ blackCard: this.blackCard}))
        //     .then(result => console.log(`Saving cards to datastore: ${result}`))
        //     .catch(err => console.error(err));
    }

    saveGame() {
        // Retrieve data for update
        const parseData = (_rawGameData) => {
            let rawGameData = _rawGameData;
            if (!rawGameData) {
                rawGameData = '[]';
            }

            const gameData = JSON.parse(rawGameData);

            const latestRound = {
                whiteCards: this.whiteCard,
                blackCards: this.blackCard,
            };

            // Append the data
            gameData.push(latestRound);

            return gameData;
        };

        const saveData = (gameData) => Datastore.set(this.gameId, JSON.stringify(gameData));

        const displayResult = (result) => {
            console.log(`Saving cards to datastore: ${result}`);
        };

        return Datastore.get(this.gameId)
            .then(parseData)
            .then(saveData)
            .then(displayResult)
            .catch(err => console.error(err));
    }

    playerSubmitted(playerId, choices) {
        this.chosenWhiteCards[playerId] = choices;
    }

    winnerChosen(playerId) {
        this.winnerId = playerId;

        _.forEach(this.chosenWhiteCards, (choices, playerId) => {
            const player = this.players[playerId];
            choices.forEach((choice) => {
                const choiceIndex = _.findIndex(player.cards, { index: choice });
                player.cards.splice(choiceIndex, 1);
            });
        });
    }

    allocateWhiteCards() {
        _.forEach(this.players, this.allocateWhiteCardsForPlayer.bind(this));
    }

    allocateWhiteCardsForPlayer(player, playerId) {
        const whiteCards = data.whiteCards;
        if (!player && !player.cards) { player.cards = []; }
        //if (this.gameInterrupt) { player.cards = []; }

        while (player.cards.length < 10) {
            const cardIndex = this.getWhiteCard();
            this.whiteCardsUsed.push(cardIndex);

            const card = {
                index: cardIndex,
                text: whiteCards[cardIndex]
            }

            if (this.whiteCard[playerId]) {
                this.whiteCard[playerId].push(card);
            } else {
                this.whiteCard[playerId] = [];
            }

            player.addWhiteCard(card);
        }
    }
}

module.exports = Round;

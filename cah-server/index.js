const _ = require('lodash');
const Room = require('./room.js');
const Player = require('./player.js');
const { cleanString, urlifyText } = require('../utils');

class CahServer {
    constructor(io) {
        this.io = io;
        this.rooms = {};
    }

    init(socket) {
        this.socket = socket;
        socket.on('join', this.userJoined.bind(this));
        socket.on('disconnect', this.userLeft.bind(this));
        socket.on('respond', this.userClosed.bind(this));
        socket.on('adduser', this.addPlayer.bind(this));
        socket.on('sendchat', this.sendChat.bind(this));
        socket.on('start-game', this.startGame.bind(this));
        socket.on('player-submission', this.playerSubmitted.bind(this));
        socket.on('winner-chosen', this.winnerChosen.bind(this));
        socket.on('next-round', this.nextRound.bind(this));
    }

    userJoined(roomName) {
        console.log("userJoined room " + roomName);
        this.rooms[roomName] = this.rooms[roomName] || new Room(roomName);
        this.socket.room = this.rooms[roomName];
        this.socket.join(roomName);
        this.updateRoom();
    }

    userClosed(data) {
        console.log('userclosed ran!!!!!!');
        this.socket.room.newMessage({
            username: 'Server',
            text: `
        ${ data.username} has left\n
        (player count: ${ this.socket.room._playerCount})`,
            type: 'server'
        });
        this.updateRoom();
    }

    userLeft(reason) {
        //console.log('DISCONNECT from ' + this.socket.room.player);

        console.log('reason: ' + reason);
        //const { room, player } = this.socket;

        if (this.socket.room && this.socket.player && this.socket.player.username !== undefined) {
            console.log('ROOMNAME ' + this.socket.room.name);
            console.log('PLAYERNAME ' + this.socket.player.username);

            this.socket.room.playerLeft(this.socket.player.id);


            console.log('userLeft::: ' + this.socket.player.username + ' left room ' + this.socket.room.name);

            //this.socket.disconnect();

            this.updateRoom();

            /* this.socket.room.newMessage({
              username: 'Server',
              text: `
              ${ this.socket.player.username } has left\n
              (player count: ${ this.socket.room._playerCount })`,
              type: 'server'
            });
            this.socket.player = [];
            this.updateRoom(); */

            //this.socket.emit('disconnected');
            //this.socket.player.disconnect();

            // if(this.socket.room._playerCount > 2) {
            // NOTE : Restart the game if there are less than three remaining players.
            // Otherwise, continue as usual. 
            if (this.socket.room._playerCount < 3) {
                console.log('Restarting the game because lack of players (min. 3)');

                this.updateRoom();

                this.socket.room.newMessage({
                    username: 'Server',
                    text: `<strong>A player left, starting a new game.</strong>`,
                    type: 'server'
                });

                this.startGame();
            }
        }
    }

    addPlayer(player) {
        let { id, username } = player;

        if (username === null || username === "") {
            username = `Guest${id}`;
        } else {
            username = cleanString(username);
        }

        //this.socket.currentUserName = username;


        if (this.socket.room) {
            const newPlayer = new Player(id, username);

            this.socket.player = newPlayer;
            //console.log('addPlayer ' + this.socket.room.name);
            try {
                this.socket.room.addPlayer(newPlayer);
                // NOTE: If a player joins a game in progress, let him join but deal cards after current round.
                console.log(username + ' joined ' + this.socket.room.name)
            }

            catch (error) {
                console.log(error);
            }

            this.socket.room.newMessage({
                username: 'Server',
                text: `${username} has joined (player count: ${this.socket.room._playerCount})`,
                type: 'server'
            });

            this.updateRoom();
            //console.log('socketroom ' + JSON.stringify(this.socket.room));
        }

        this.updateRoom();

        if (this.socket.room._currentGame) {
            // Temporary fix, maybe disable joining to prevent crashes?

            //this.socket.room._currentGame.playerJoined(player);
        }
    }

    sendChat(data, username) {
        this.socket.room.newMessage({
            //username: this.socket.player.username,
            username: username,
            text: urlifyText(cleanString(data)),
            type: 'chat'
        });

        this.updateRoom();
    }

    startGame() {
        this.socket.room.newGame();
        this.displayNextJudge();
        this.updateRoom();
    }

    displayNextJudge() {
        const { room } = this.socket;
        room.newMessage({
            username: 'Server',
            text: `Round ${room._currentGame.rounds.length} - ${room._currentJudge.username} is the judge`,
            type: 'server'
        });

    }

    nextRound(gameId) {
        const { room } = this.socket;
        const game = room.getGameById(gameId);
        game.newRound(room.players);
        this.displayNextJudge();

        this.updateRoom();
    }

    playerSubmitted(gameId, roundId, playerId, choices) {
        const game = this.socket.room.getGameById(gameId);

        if (game && game.getRoundById(roundId)) {
            const round = game.getRoundById(roundId);
            round.playerSubmitted(playerId, choices);

            this.updateRoom();
        }

    }

    winnerChosen(playerId, gameId, roundId) {
        const game = this.socket.room.getGameById(gameId);

        if (game && game.getRoundById(roundId)) {
            const round = game.getRoundById(roundId);
            const roundIndex = _.findIndex(game.rounds, { id: roundId });
            round.winnerChosen(playerId);
            this.socket.room.newMessage({
                username: 'Server',
                text: `Round ${roundIndex + 1} - ${round.players[playerId].username} is the winner`,
                type: 'server'
            });

            this.updateRoom();
        }



    }

    updateRoom() {
        const { player, room } = this.socket;

        if (player && room) {
            const update = {
                name: room.name,
                messages: room.messages,
                games: room.games,
                players: room.players,
                thisPlayer: player,
                playerCount: room._playerCount,
                whiteCardsUsed: room._whiteCardsUsed,
                currentGame: room._currentGame,
                currentRound: room._currentGame ? room._currentGame._currentRound : null,
                //gameStarted: true
            };
            this.io.to(room.name).emit('updateroom', update);

        }


        //console.log('thisplayer ' + update.thisPlayer.id);

    }
}

module.exports = CahServer;

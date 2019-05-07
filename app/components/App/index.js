import React from 'react';
import _ from 'lodash';
import styles from './style.scss';
import { ChatBox, Stage } from '../';

const App = React.createClass({
  getInitialState() {
    return {
      name: '',
      messages: [],
      games: [],
      players: {},
      playerCount: 0,
      whiteCardsUsed: [],
      currentGame: {},
      currentRound: null,
      gameStarted: false,
      currentUser: '',
      currentUserName: ''
    };
  },

  componentWillMount() {
    const { socket, data } = this.props;
    socket.on('connect', this.connect);
    socket.on('updateroom', this.updateRoom);

    if (localStorage.user) {
      setTimeout(() => {
        socket.emit('adduser', JSON.parse(localStorage.user));
        //console.table(JSON.parse(localStorage.user));
        this.user();
        //this.updateRoom();
      }, 300);
      //console.log(this.state.currentRound);
    }
    if (this.state.currentRound !== null) {
      //console.log('round in progress');
      //console.log(this.state.currentRound);
      //alert('round in progress');
    }
    window.addEventListener("beforeunload", (ev) =>
    {
      ev.preventDefault();
      //socket.emit('disconnect');
      socket.emit('greet', localStorage.user);
      //socket.emit('updateroom');
      return ev.returnValue = 'Are you sure you want exit the game?';

    });
  },



  componentWillUnMount() {
    //localStorage.clear();
  },

  getCurrentRound() {
    return JSON.stringify(this.state.currentRound);
  },

  getCurrentGame() {
    return JSON.stringify(this.state.currentGame);
  },

  getGames() {
    return JSON.stringify(this.state.games);
  },

  user() {
    let user = localStorage.user ? JSON.parse(localStorage.user) : { id: null };

    if (this.state.players[user.id]) {
      //console.log('Return from user():');
      //console.table(this.state.players[user.id]);
      //console.log('current round: ' + this.getCurrentRound());
      //console.log('current game: ' + this.getCurrentGame());
      //console.log('games: ' + this.getGames());
      return this.state.players[user.id];
    }

    this.state.currentUserName = user.username;
    this.state.currentUser = user;


    //console.log('NO USER!');
    return {};
  },

  updateRoom(update) {
    this.setState(update);
  },

  connect() {
    this.props.socket.emit('join', window.location.pathname.substring(1));
  },

  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const username = input.value;

    const user = {
      id: _.uniqueId(`${ username }-${ Math.floor(Date.now() / 1000) }`),
      username
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.state.currentUser = user;
    this.state.currentUserName = user.username;

    this.props.socket.emit('adduser', user);
  },

  renderContent() {
    const { socket, data, currentUser } = this.props;

    if (!localStorage.user && !currentUser) {
      return (
        <form onSubmit={ this.onSubmit } className={ styles.form }>
          <input type="text" ref="input" placeholder="Enter your name" />
        </form>
      );
    }

    // Here goes code if game in progress..

    return (
      <main className={ styles.main }>
        <Stage { ...this.state } user={ this.user() } socket={ socket } data={ data } />
        <ChatBox user={ this.user() } socket={ socket } { ...this.state } />
      </main>
    );
  },

  render() {
    return this.renderContent();
  }
});

export default App;

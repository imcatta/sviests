import React from 'react';
import styles from './style.scss';
import Messages from './Messages';
import Form from './Form';

const ChatBox = React.createClass({
  onSubmit(message, username) {
    this.props.socket.emit('sendchat', message, username);
  },

  render() {
    return (
      <div className="chatbox">
        <Messages user={ this.props.user } currentUserName={ this.props.currentUserName } messages={ this.props.messages } />
        <Form onSubmit={ this.onSubmit }/>
      </div>
    );
  }
});

export default ChatBox;

import React from 'react';
import styles from './style.scss';
import Messages from './Messages';
import Form from './Form';

const ChatBox = React.createClass({
  onSubmit(message, sender) {
    setTimeout(() => {
      this.props.socket.emit('sendchat', message, sender);
      //this.props.socket.emit('updateroom');
    }, 250);
  },

  render() {
    return (
      <div className={ this.props.chatVisible ? 'chatbox' : 'hide' }>
        <Messages user={ this.props.user } currentUserName={ this.props.currentUserName } messages={ this.props.messages } />
        <Form onSubmit={ this.onSubmit } currentUserName={ this.props.currentUserName } />
      </div>
    );
  }
});

export default ChatBox;

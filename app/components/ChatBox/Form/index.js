import React from 'react';
import styles from './style.scss';

const Form = React.createClass({
  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const message = input.value;
    const tmp_user = JSON.parse(localStorage.getItem('user'));
    const username = tmp_user.username;
    input.value = '';
    if(message !== '') {
      this.props.onSubmit(message, username);
    }
  },

  render() {
    return (
      <form onSubmit={ this.onSubmit } className="chatbox-form">
        <input type="text" placeholder="Your message ..." ref="input" />
        <button type="submit">Send</button>
      </form>
    );
  }
});

export default Form;

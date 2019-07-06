import React from 'react';
import styles from './style.scss';

const Form = React.createClass({
  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const message = input.value;
    //let tmp_user = JSON.parse(localStorage.getItem('user'));
    let sender = this.props.currentUserName;
    input.value = '';
    if(message !== '') {
      this.props.onSubmit(message, sender);
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

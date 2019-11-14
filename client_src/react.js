import React, { Component } from "react"
var localizer = require("./localizer.js");

export default class ReactRoot extends Component {
	constructor(props) {
		super(props)

		this.state = {
			// Control what is displayed
			display: "none",
			register: "none"
		}
	}

	componentDidMount() {
		ReactRoot.toggleDisplay = name => {
			let current = this.state
			let val = current.display
			if (val === name) { current.display = "none" }
			else { current.display = name }
			this.setState(current)
		};
		ReactRoot.turnOnDisplay = name => {
			let current = this.state
			{ current.display = name }
			this.setState(current)
		};
		ReactRoot.turnOffDisplay = name => {
			let current = this.state
			{ current.display = "none" }
			this.setState(current)
		};
		ReactRoot.turnOnRegister = name => {
			let current = this.state
			{ current.register = "Register" }
			this.setState(current)
		};
		ReactRoot.turnOffRegister = name => {
			let current = this.state
			{ current.register = "none" }
			this.setState(current)
		};
	}

	render() {
		return (
			<span>
				<Chat />
				<MuteButton toggleAudio={this.props.data.toggleAudio} />
				<MusicButton toggleMusic={this.props.data.toggleMusic} />
				<LoginOverlay display={this.state.display === "LoginOverlay"} />
				<Register register={this.state.register === "Register"} />
			</span>
		)
	}
}

class MuteButton extends Component {
	constructor(props) {
		super(props)

		this.state = {
			muted: false,
		}
	}

	click() {
		this.setState({ muted: this.props.toggleAudio() })
	}

	render() {
		return (
			<div className="mute-button" onClick={this.click.bind(this)}>
				{!this.state.muted ?
					<span><img src="img/soundOn.png" /></span> :
					<span><img src="img/soundOff.png" /></span>
				}
			</div>
		)
	}
}

class MusicButton extends Component {
	constructor(props) {
		super(props)

		this.state = {
			musicMuted: false,
		}
	}

	click() {
		this.setState({ musicMuted: this.props.toggleMusic() })
	}

	render() {
		return (
			<div className="music-button" onClick={this.click.bind(this)}>
				{!this.state.musicMuted ?
					<span><img src="img/musicOn.png" /></span> :
					<span><img src="img/musicOff.png" /></span>
				}
			</div>
		)
	}
}

class Register extends Component {
	constructor() {
		super()

		this.state = {
			user: "",
			pass: ""
		}
	}

	turnOn() {
		this.setState({ on: true })
	}
	turnOff() {
		this.setState({ off: true })
	}
	handleChangeU = (event) => {
		this.setState({ user: event.target.value, pass: this.state.pass });
	}
	handleChangeP = (event) => {
		this.setState({ user: this.state.user, pass: event.target.value });
	}

	render() {
		return (
			this.props.register ? (
				<div className="register-menu">
					<center>
						<h3>Create an account!</h3><br />
						<input className="overlay-input" type="text" onChange={this.handleChangeU} placeholder="Username" maxLength="16" style={{ margin: 8 }} />
						<input className="overlay-input" type="password" onChange={this.handleChangeP} placeholder="Password" maxLength="32" style={{ margin: 8 }} />
						<br /><button className="register" onClick={this.register}>Register!</button>
						<br />
						<br />
						By registering, you agree to our terms of service, available at torn.space/tos.
					<br />
						Remember, never give your password to anyone!!
				</center>
				</div>
			) : null
		)
	}

	register = () => {
		var user = this.state.user;
		var pass = this.state.pass;
		if (typeof ReactRoot.socket !== "undefined")
			ReactRoot.socket.emit('register', { user: user, pass: pass });
	}
}

class LoginOverlay extends Component {
	constructor() {
		super()

		this.state = {
			// Control what is displayed
			user: "",
			pass: "",
			seed: Math.random()
		}
	}
	handleChangeU = (event) => {
		this.setState({ user: event.target.value, pass: this.state.pass });
	}
	handleChangeP = (event) => {
		this.setState({ user: this.state.user, pass: event.target.value });
	}
	render() {
		{/*
		const video = (this.state.seed * 2 % 1 < 0.25) ?
			(<iframe width="368" height="207" src="https://www.youtube.com/embed/iLlFIS1PLOo" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>)
			: (<iframe width="368" height="207" src="https://www.youtube.com/embed/44MIPle7pwQ" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>);
		*/}

		const buttonOrder = (this.state.seed < 0.5) ? (
			<div>
				<button id="registerA" onClick={this.registerA}>Join Alien Team!</button>
				<button id="registerH" onClick={this.registerH}>Join Human Team!</button>
			</div>
		) : (
				<div>
					<button id="registerH" onClick={this.registerH}>Join Human Team!</button>
					<button id="registerA" onClick={this.registerA}>Join Alien Team!</button>
				</div>
			);


		return !this.props.display ? null : (
			<div>
				<div className="overlay-menu">
					<div className="container">
						<div className="guests">
							<center><h3>New Players</h3>
								{buttonOrder}
							</center>
						</div>
						<div className="video">
							{/*
							<center><h3>Featured Video!</h3>
								{video}
								<br /><a href="youtubers/">Have a channel?</a></center>
							*/}
							<center><img src="img/harrlogo.png" alt="Logo" width="340"/></center>
						</div>
						<div className="login">
							<center><h3>Returning Players</h3>
								<input className="overlay-input" type="text" id="usernameid" onChange={this.handleChangeU} placeholder="Username" />
								<input className="overlay-input" type="password" id="passid" onChange={this.handleChangeP} placeholder="Password" />
								<button className="overlay-button" id="loginButton" onClick={this.login}>Login</button></center>
						</div>
					</div>
				</div>
				<div className="discord">
					<a onClick={this.langEng} >Eng|</a>
					<a onClick={this.langEsp} >Esp|</a>
					<a onClick={this.langFrn} >Frn|</a>
					<a onClick={this.langDeu} >Deu|</a>
					<a onClick={this.langPyc} >Pyc</a>
				</div>
			</div>)
	}
	login = () => {
		var user = this.state.user;
		var pass = this.state.pass;

		if (user == "" || pass == "") {
			return;
		}

		connect();
		if (typeof ReactRoot.socket !== "undefined")
			ReactRoot.socket.emit('login', { user: user, pass: pass, amNew: false , version: VERSION });
	}
	registerH = () => {
		connect();
		if (typeof ReactRoot.socket !== "undefined")
			ReactRoot.socket.emit('lore', { alien: false });
	}
	registerA = () => {
		connect();
		if (typeof ReactRoot.socket !== "undefined")
			ReactRoot.socket.emit('lore', { alien: true });
	}

	langEng = () => {
		setLang("eng");
	}

	langEsp = () => {
		setLang("esp");
	}

	langFrn = () => {
		setLang("frn");
	}

	langPyc = () => {
		setLang("pyc");
	}

	langDeu = () => {
		setLang("deu");
	}
}

class Chat extends Component {
	constructor() {
		super()

		this.state = {
			msgs: []
		}

		ReactRoot.chat = data => {
			let current = this.state
			current.msgs.push(new ChatMessage(data))
			this.setState(current)
		}

		Chat.fadeOut = id => {
			let current = this.state
			current.msgs.forEach((e, i) => {
				if (e.id === id) {
					current.msgs[i].fadeOut = true
				}
			})
			this.setState(current)
		}

		Chat.remove = id => {
			let current = this.state
			current.msgs.forEach((e, i) => {
				if (e.id === id) {
					current.msgs.splice(i, 1)
				}
			})
			this.setState(current)
		}
	}

	render() {
		return (
			<div className="chat">
				{
					this.state.msgs.map((e, i) => {
						return <div maxLength="128"
							className={`chat-msg ${e.fadeOut ? `chat-msg-fadeout` : ``}`}
							key={i}
							style={{ "color": e.color === "red" ? "pink" : e.color === "blue" ? "cyan" : "white" }}
						>{e.msg}</div>
					})
				}
				<ChatInput />
			</div>
		)
	}
}

class ChatMessage {
	constructor(data) {
		this.msg = data.msg
		this.color = data.color
		this.id = Math.random()
		this.fadeOut = false

		setTimeout(() => {
			Chat.fadeOut(this.id)

			setTimeout(() => {
				Chat.remove(this.id)
			}, 2000)
		}, 60000)
	}
}

class ChatInput extends Component {
	constructor() {
		super()

		this.state = {
			value: "",
			activated: false
		}
	}

	componentDidMount() {
		ReactRoot.focusChat = () => {
			this.refs.chat.focus();
		}
		ReactRoot.unfocusChat = () => {
			this.refs.chat.blur()
		}
		ReactRoot.init = (data) => {
			this.setState(data);
		}
		ReactRoot.activate = () => {
			this.setState({ value: this.state.value, activated: true });
		}
	}

	keypress(event) {
		if (event.key === "Enter") {
			ReactRoot.unfocusChat();
			let val = this.state.value;
			ReactRoot.socket.emit("chat", { msg: val });
			this.setState({ value: "", activated: this.state.activated });
			// The keypress events in react and index
			// fire at the same time but we want the
			// typing=false one to dominate
			setTimeout(global.stopTyping, 50)
		}
	}

	change(event) {
		this.setState({ value: event.target.value, activated: this.state.activated })
	}

	render() {
		return this.state.activated ? (
			<input
				className="chat-input"
				ref={"chat"}
				maxLength="128"
				onKeyDown={this.keypress.bind(this)}
				onChange={this.change.bind(this)}
				value={this.state.value}
				placeholder="Press enter to chat!"
				type="text" />
		) : null
	}
}
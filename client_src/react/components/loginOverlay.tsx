/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as React from 'react';

import socket from '../../utils/socket';
import sendAPI from '../../utils/sendAPI';
import core from '../../core';

class LoginOverlay extends React.Component<{ display: boolean }, { user: string, pass: string, seed: number }> {
    constructor (props) {
        super(props);

        this.state = {
            user: ``,
            pass: ``,
            seed: Math.random()
        };
    }

    // langEng = () => {
    //     setLang(`eng`);
    // }

    // langEsp = () => {
    //     setLang(`esp`);
    // }

    // langTki = () => {
    //     setLang(`tki`);
    // }

    // langChn = () => {
    //     setLang(`chn`);
    // }

    changeUsername = (event) => {
        this.setState({
            user: event.target.value,
            pass: this.state.pass
        });
    }

    changePassword = (event) => {
        this.setState({
            user: this.state.user,
            pass: event.target.value
        });
    }

    registerR = () => {
        socket.connect();
        socket.emit(`lore`, { team: `red` });
    }

    registerB = () => {
        socket.connect();
        socket.emit(`lore`, { team: `blue` });
    }

    registerG = () => {
        socket.connect();
        socket.emit(`lore`, { team: `green` });
    }

    login = async () => {
        const user = this.state.user;
        const pass = this.state.pass;

        if (user === `` || pass === ``) return;

        const playCookie = await sendAPI(`/login`, `${user}%${pass}`);

        if (playCookie.status === 403) {
            core.login = {
                credentials: 1,
                progress: false
            };
            return;
        } else if (playCookie.status !== 200) {
            alert(`Failed to connect to Torn Account Services.`);

            core.login.progress = false;
            return;
        }

        const playCookieData = await playCookie.text();
        console.log(`[NETWORK] Got PlayCookie: ${playCookieData}`);

        socket.emit(`login`, { cookie: playCookie, version: core.version });
    }

    render = () => (Element) => {
        const buttonOrder = (this.state.seed < 0.66)
            ? ((this.state.seed < 0.33)
                ? (
                    <div>
                        <button id="registerR" onClick={this.registerR}>Join Alien Team!</button>
                        <button id="registerB" onClick={this.registerB}>Join Human Team!</button>
                        <button id="registerG" onClick={this.registerG}>Join Cyborg Team!</button>
                    </div>
                )
                : (
                    <div>
                        <button id="registerG" onClick={this.registerG}>Join Cyborg Team!</button>
                        <button id="registerR" onClick={this.registerR}>Join Alien Team!</button>
                        <button id="registerB" onClick={this.registerB}>Join Human Team!</button>
                    </div>
                ))
            : (
                <div>
                    <button id="registerB" onClick={this.registerB}>Join Human Team!</button>
                    <button id="registerG" onClick={this.registerG}>Join Cyborg Team!</button>
                    <button id="registerR" onClick={this.registerR}>Join Alien Team!</button>
                </div>
            );

        return !this.props.display
            ? null
            : (
                <div>
                    <div className="overlay-menu">
                        <div className="container">
                            <div className="guests">
                                {/* <center> */}
                                <h3>New Players</h3>
                                {buttonOrder}
                                {/* </center> */}
                            </div>
                            <div className="video">
                                {/*
                            <center><h3>Featured Video!</h3>
                                {video}
                                <br /><a href="youtubers/">Have a channel?</a></center>
                            */}

                                {/* <center> */}
                                <img src="img/harrlogo.png" alt="Logo" width="340"/>
                                {/* </center> */}

                            </div>
                            <div className="login">
                                {/* <center> */}
                                <h3>Returning Players</h3>
                                <input className="overlay-input" type="text" id="usernameid" onChange={this.changeUsername} placeholder="Username" />
                                <input className="overlay-input" type="password" id="passid" onChange={this.changePassword} placeholder="Password" />
                                <button className="overlay-button" id="loginButton" onClick={this.login}>Login</button>
                                {/* </center> */}
                            </div>
                        </div>
                    </div>

                    <div className="discord">
                        <a href="legal/privacy_policy.pdf"> Privacy Policy | </a>
                        <a href="legal/tos.pdf"> Terms of Service </a><br/>

                        {/* <a onClick={this.langEng}>Eng | </a>
                        <a onClick={this.langEsp}>Esp | </a>
                        <a onClick={this.langTki}>Tki | </a>
                        <a onClick={this.langChn}>Chn</a> */}
                    </div>
                </div>);
    }
}

export default LoginOverlay;

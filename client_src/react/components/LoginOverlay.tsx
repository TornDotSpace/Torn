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

import React from 'react';

import sendAPI from '../../utils/sendAPI';
import socket from '../../modules/socket';

declare const VERSION: string;
declare const loadLang: any;

declare let credentialState: number;
declare let loginInProgress: boolean;

class LoginOverlay extends React.Component<{ display: boolean }, { user: string, pass: string, seed: number }> {
    constructor (props: { display: boolean }) {
        super(props);

        this.state = {
            user: ``,
            pass: ``,
            seed: Math.random()
        };
    }

    langEng = () => {
        loadLang(`eng`);
    };

    langEsp = () => {
        loadLang(`esp`);
    };

    langTki = () => {
        loadLang(`tki`);
    };

    langChn = () => {
        loadLang(`chn`);
    };

    changeUsername = (event) => {
        this.setState({
            user: event.target.value,
            pass: this.state.pass
        });
    };

    changePassword = (event) => {
        this.setState({
            user: this.state.user,
            pass: event.target.value
        });
    };

    registerR = () => {
        socket.open();
        socket?.emit(`lore`, { team: `red` });
    };

    registerB = () => {
        socket.open();
        socket?.emit(`lore`, { team: `blue` });
    };

    registerG = () => {
        socket.open();
        socket?.emit(`lore`, { team: `green` });
    };

    login = async (e: React.FormEvent) => {
        e.preventDefault();

        const user = this.state.user;
        const pass = this.state.pass;

        if (user === `` || pass === ``) return;
        if (loginInProgress) return;
        loginInProgress = true;

        const playCookie = await sendAPI(`/login/`, `${user}%${pass}`);

        if (playCookie.status === 403) {
            credentialState = 1;
            loginInProgress = false;
            return;
        } else if (playCookie.status !== 200) {
            alert(`Failed to connect to Torn Account Services.`);

            loginInProgress = false;
            return;
        }

        const playCookieData = await playCookie.text();
        socket.open();

        console.log(`:TornNetRepository: Got PlayCookie: ${playCookieData}`);
        socket?.emit(`login`, { cookie: playCookieData, version: VERSION });
    };

    render = () => {
        const buttonOrder = (this.state.seed < 0.66)
            ? ((this.state.seed < 0.33)
                ? (
                    <div className="text-center">
                        <button id="registerR" onClick={this.registerR}>Join Alien Team!</button>
                        <button id="registerB" onClick={this.registerB}>Join Human Team!</button>
                        <button id="registerG" onClick={this.registerG}>Join Cyborg Team!</button>
                    </div>
                )
                : (
                    <div className="text-center">
                        <button id="registerG" onClick={this.registerG}>Join Cyborg Team!</button>
                        <button id="registerR" onClick={this.registerR}>Join Alien Team!</button>
                        <button id="registerB" onClick={this.registerB}>Join Human Team!</button>
                    </div>
                ))
            : (
                <div className="text-center">
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
                                <h3 className="text-center">New Players</h3>
                                {buttonOrder}
                            </div>
                            <div className="video">
                                <div className="text-center">
                                    <img src="img/harrlogo.png" alt="Logo" width="340"/>
                                </div>
                            </div>
                            <div className="login">
                                <h3 className="text-center">Returning Players</h3>

                                <form action="/" onSubmit={((e => this.login(e)))} className="text-center">
                                    <input className="login-input" type="text" id="usernameid" autoComplete="username" onChange={this.changeUsername} placeholder="Username" />
                                    <input className="login-input" type="password" id="passid" autoComplete="current-password" onChange={this.changePassword} placeholder="Password" />

                                    <input className="login-btn" type="submit" value="Login" id="loginButton" />
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="link-container">
                        <div className="link-legal">
                            <a href="legal/privacy_policy.pdf">Privacy Policy</a>
                            <a href="legal/tos.pdf">Terms of Service</a>
                        </div>
                        <div className="link-lang">
                            <a onClick={this.langEng}>Eng</a>
                            <a onClick={this.langEsp}>Esp</a>
                            <a onClick={this.langTki}>Tki</a>
                            <a onClick={this.langChn}>Chn</a>
                        </div>
                    </div>
                </div>
            );
    };
}

export default LoginOverlay;

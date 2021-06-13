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

class Register extends React.Component<{ register: boolean }, { user: string, pass: string, display: boolean }> {
    constructor (props) {
        super(props);

        this.state = {
            user: ``,
            pass: ``,
            display: false
        };
    }

    turnOn = () => {
        this.setState({ display: true });
    }

    turnOff = () => {
        this.setState({ display: false });
    }

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

    register = () => {
        const user = this.state.user;
        const pass = this.state.pass;

        socket.emit(`register`, {
            user,
            pass
        });
    }

    render = () => (Element) => (
        this.props.register
            ? (
                <div className="register-menu">
                    {/* <center> */}
                    <h3>Create an account!</h3>
                    <br />

                    <input className="overlay-input" type="text" onChange={this.changeUsername} placeholder="Username" maxLength={16} style={{ margin: 8 }} />
                    <input className="overlay-input" type="password" onChange={this.changePassword} placeholder="Password" maxLength={32} style={{ margin: 8 }} />

                    <br />
                    <button className="register" onClick={this.register}>Register!</button>

                    <br />
                    <br />

                        By registering, you agree to follow our terms of service and abide by our privacy policy.

                    <a href="legal/privacy_policy.pdf" > Privacy Policy | </a>
                    <a href="legal/tos.pdf">Terms of Service</a>
                    <br/>

                    <br />
                        Remember, never give your password to anyone!!
                    {/* </center> */}
                </div>
            )
            : null
    );
}

export default Register;

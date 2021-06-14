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
import { Socket } from 'socket.io-client';

declare const socket: Socket;
declare const stopTyping: any;

let ChatState: { init: any, activate: any, focusChat: any, unfocusChat: any };

class ChatInput extends React.Component<{}, { value: string, activated: boolean }> {
    constructor (props) {
        super(props);

        this.state = {
            value: ``,
            activated: false
        };
    }

    init = (data: { value: string, activated: boolean }) => {
        this.setState(data);
    }

    activate = () => {
        this.setState({ value: this.state.value, activated: true })
    }

    focusChat = () => {
        (this.refs.chat as any).focus();
    }

    unfocusChat = () => {
        (this.refs.chat as any).blur();
    }

    keypress = (event) => {
        if (event.key === `Enter`) {
            const val = this.state.value;
            this.unfocusChat();

            socket?.emit(`chat`, { msg: val });            
            this.setState({ value: ``, activated: this.state.activated });

            // The keypress events in React and index.js fire at the same time,
            // but we want the typing=false event to dominate.
            setTimeout(stopTyping, 50);
        }
    }

    change = (event) => {
        this.setState({
            value: event.target.value,
            activated: this.state.activated
        });
    }

    componentDidMount = () => {
        // Pass internal states to the exportable object.
        ChatState = {
            init: (data: { value: string, activated: boolean }) => this.init(data),
            activate: () => this.activate(),
            focusChat: () => this.focusChat(),
            unfocusChat: () => this.unfocusChat()
        };
    }

    render = () => {
        return this.state.activated
            ? (
                <input
                    className="chat-input"
                    ref={`chat`}
                    maxLength={128}
                    onKeyDown={this.keypress.bind(this)}
                    onChange={this.change.bind(this)}
                    value={this.state.value}
                    placeholder="Press enter to chat!"
                    type="text" />
            )
            : null;
    }
}

export {
    ChatInput,
    ChatState
};

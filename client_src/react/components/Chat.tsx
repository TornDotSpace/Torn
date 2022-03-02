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

import { ChatInput } from './ChatInput';

class ChatMessage {
    msg: string;
    color: string;

    id: number;
    fadeOut: boolean;

    constructor (data) {
        this.msg = data.msg;
        this.color = data.color;

        this.id = data.id;
        this.fadeOut = false;
    }
}

class Chat extends React.Component<{}, { messages: any[] }> {
    constructor (props: {}) {
        super(props);

        this.state = {
            messages: []
        };
    }

    fadeOut = (id: number) => {
        this.setState({ messages: this.state.messages.map(message => (message.id === id ? { ...message, fadeOut: true } : message)) });
    };

    addMsg = (data: any) => {
        data.id = Math.floor(Math.random() * 999);
        this.setState({ messages: this.state.messages.concat(new ChatMessage(data)) });

        setTimeout(() => {
            this.fadeOut(data.id);
            setTimeout(() => this.removeMsg(data.id), 2e3);
        }, 6e4);
    };

    removeMsg = (id: number) => {
        this.setState({ messages: this.state.messages.filter(message => message.id !== id) });
    };

    render = () => (
        <div className="chat">
            {
                this.state.messages.map((message, i) =>
                    <div className={`chat-msg ${message.fadeOut ? `chat-msg-fadeout` : ``}`}
                        key={i}
                        style={{
                            color:
                                    message.color === `red`
                                        ? `pink`
                                        : message.color === `blue`
                                            ? `cyan`
                                            : `white`
                        }}
                    >{message.msg}</div>)
            }

            <ChatInput />
        </div>
    );
}

export default Chat;

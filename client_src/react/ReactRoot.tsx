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

import Chat from './components/Chat';
import MuteButton from './components/MuteButton';
import MusicButton from './components/MusicButton';
import LoginOverlay from './components/LoginOverlay';
import Register from './components/Register';

let RootState: {
    toggleDisplay: any,
    turnOnDisplay: any,
    turnOffDisplay: any,
    turnOnRegister: any,
    turnOffRegister: any
};

class ReactRoot extends React.Component<{}, { display: string, register: string }> {
    constructor (props: {}) {
        super(props);

        this.state = {
            // Control what is displayed.
            display: `none`,
            register: `none`
        };
    }

    toggleDisplay = () => {
        if (this.state.display === `display`) this.turnOffDisplay();
        else this.turnOnDisplay();
    };

    turnOnDisplay = () => {
        this.setState({ display: `LoginOverlay` });
    };

    turnOffDisplay = () => {
        this.setState({ display: `none` });
    };

    turnOnRegister = () => {
        this.setState({ register: `Register` });
    };

    turnOffRegister = () => {
        this.setState({ register: `none` });
    };

    componentDidMount = () => {
        // Pass internal states to the exportable object.
        RootState = {
            toggleDisplay: () => this.toggleDisplay(),

            turnOnDisplay: () => this.turnOnDisplay(),
            turnOffDisplay: () => this.turnOffDisplay(),

            turnOnRegister: () => this.turnOnRegister(),
            turnOffRegister: () => this.turnOffRegister()
        };
    };

    render = () => (
        <span>
            <Chat />

            <div className="sfx-wrapper">
                <MuteButton />
                <MusicButton />
            </div>

            <LoginOverlay display={this.state.display === `LoginOverlay`} />
            <Register display={this.state.register === `Register`} />

            <canvas id="ctx"></canvas>
        </span>
    );
}

export {
    ReactRoot,
    RootState
};

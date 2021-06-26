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
class MuteButton extends React.Component<{ toggleSFX: any }, { muted: boolean }> {
    constructor (props: { toggleSFX: any }) {
        super(props);

        this.state = {
            muted: false
        };
    }

    click = () => {
        this.setState({ muted: this.props.toggleSFX() });
    }

    render = () => (
        <div className="mute-button" onClick={this.click.bind(this)}>
            {<span><img src={`/img/sound/sound${!this.state.muted ? `On` : `Off`}.png`} alt="SFX Mute button"/></span>}
        </div>
    )
}

export default MuteButton;

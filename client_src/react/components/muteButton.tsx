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

import core from '../../core';
import { toggleAudio } from '../../utils/audio';

class MuteButton extends React.Component<{ toggleSFX: boolean }, { muted: boolean }> {
    constructor (props) {
        super(props);

        this.state = {
            muted: false
        };
    }

    click = () => {
        toggleAudio();
        this.setState({ muted: core.muted.sfx });
    }

    render = () => (Element) => (
        <div className="mute-button" onClick={this.click.bind(this)}>
            {<span><img src={`img/sound/sound${!this.state.muted ? `on` : `off`}`} alt="Mute button"/></span>}
        </div>
    )
}

export default MuteButton;

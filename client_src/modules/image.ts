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

declare let Img: any;
declare let Img_prgs: number[];

declare let redShips: any;
declare let blueShips: any;
declare let greenShips: any;

/**
 * Load an image.
 * @param name The name of the image to load.
 * @param src The absolute path to the image to load.
 */
const loadImage = (name: string, src: string) => {
    const imageExists = Img[name];
    if (imageExists) return console.error(`Image already loaded: ${name}`);

    const img = new Image();
    img.src = src;

    img.addEventListener(`load`, () => {
        Img_prgs[0]++;
    });

    Img[name] = img;
    Img_prgs[1]++;
};

/**
 * Load a ship image.
 * @param team The team of the ship to load.
 * @param rank The rank of the ship to load.
 */
const loadShipImage = (color: string, rank: number) => {
    const img = new Image();

    if (color === `red`) {
        img.src = `/img/red/r${rank + 1}.png`;
        redShips[rank] = img;
    } else if (color === `blue`) {
        img.src = `/img/blue/b${rank + 1}.png`;
        blueShips[rank] = img;
    } else {
        img.src = `/img/green/g${rank + 1}.png`;
        greenShips[rank] = img;
    }
};

export {
    loadImage,
    loadShipImage
};

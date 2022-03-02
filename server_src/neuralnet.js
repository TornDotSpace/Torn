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

const fs = require(`fs`);
const path = require(`path`);

// Low change of high variability, high chance of low.
const mutate = () => Math.tan(Math.random() * Math.PI * 2) / 100;

// Softsign activation function.
const activate = (x) => x / (Math.abs(x) + 1);

class NeuralNet {
    constructor () {
        this.genes = {};
        this.id = -1;
    }

    randomWeights = () => {
        for (let i = 0; i < 300; i++) this.genes[i] = mutate();
    };

    passThrough = (input) => {
        // Biases.
        layer1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
        layer2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
        layer3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
        out = [0, 0, 0, 0, 0, 0];

        let counter = 0;

        for (let a = 0; a < input.length; a++) for (let b = 0; b < layer1.length - 1; b++) layer1[b] += input[a] * this.genes[counter++];
        for (let i = 0; i < layer1.length; i++) layer1[i] = activate(layer1[i]);

        for (let a = 0; a < layer1.length; a++) for (let b = 0; b < layer2.length - 1; b++) layer2[b] += layer1[a] * this.genes[counter++];
        for (let i = 0; i < layer2.length; i++) layer2[i] = activate(layer2[i]);

        for (let a = 0; a < layer2.length; a++) for (let b = 0; b < layer3.length - 1; b++) layer3[b] += layer2[a] * this.genes[counter++];
        for (let i = 0; i < layer3.length; i++) layer3[i] = activate(layer3[i]);

        for (let a = 0; a < layer3.length; a++) for (let b = 0; b < out.length; b++) out[b] += layer3[a] * this.genes[counter++];
        for (let i = 0; i < out.length; i++) out[i] = out[i] > 0;

        return out;
    };

    save = (k) => {
        const source = path.resolve(__dirname, `../server/neuralnets/${k}.bot`);
        if (fs.existsSync(source)) fs.unlinkSync(source);

        let str = ``;
        for (let i = 0; i < 300; i++) str += `${this.genes[i]}\n`;

        fs.writeFileSync(source, str, { encoding: `utf8` });
    };

    load = () => {
        this.id = Math.floor(Math.random() * neuralFiles);
        this.randomWeights();

        const parentCount = Math.floor(Math.random() * 3 + 1);
        for (let p = 0; p < parentCount; p++) {
            const source = path.resolve(__dirname, `../server/neuralnets/${Math.floor(Math.random() * neuralFiles)}`);
            if (fs.existsSync(source)) {
                const fileData = fs.readFileSync(source, `utf8`).split(`\n`);
                for (let i = 0; i < 300; i++) this.genes[i] += parseFloat(fileData[i]) / parentCount;
            }
        }
    };
}

module.exports = NeuralNet;

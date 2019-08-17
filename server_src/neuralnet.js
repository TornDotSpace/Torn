var mutate = function(){ // Low change of high variability, high chance of low.
	return Math.tan(Math.random()*Math.PI*2)/100;
}
var activate = function(x){ // Softsign activation function. See wikipedia.
	return x/(1+Math.abs(x));
}

module.exports = function NeuralNet(){
	var self = {
		genes: {},
		id:-1
	};
	self.randomWeights = function(){
		for(var i = 0; i < 300; i++) self.genes[i] = mutate();
	};
	self.passThrough = function(input){
		
		//biases
		layer1 = [0,0,0,0,0,0,0,0,0,0,0,0,1];
		layer2 = [0,0,0,0,0,0,0,0,0,0,1];
		layer3 = [0,0,0,0,0,0,0,0,0,1];
		out = [0,0,0,0,0,0];
		
		var counter = 0;

		for(var a = 0; a < input.length; a++)
			for(var b = 0; b < layer1.length - 1; b++)
				layer1[b] += input[a] * self.genes[counter++];

		for(var i = 0; i < layer1.length; i++) layer1[i] = activate(layer1[i]);
		
		for(var a = 0; a < layer1.length; a++)
			for(var b = 0; b < layer2.length - 1; b++)
				layer2[b] += layer1[a] * self.genes[counter++];

		for(var i = 0; i < layer2.length; i++) layer2[i] = activate(layer2[i]);
		
		for(var a = 0; a < layer2.length; a++)
			for(var b = 0; b < layer3.length - 1; b++)
				layer3[b] += layer2[a] * self.genes[counter++];

		for(var i = 0; i < layer3.length; i++) layer3[i] = activate(layer3[i]);
		
		for(var a = 0; a < layer3.length; a++)
			for(var b = 0; b < out.length; b++)
				out[b] += layer3[a] * self.genes[counter++];

		for(var i = 0; i < out.length; i++) out[i]=out[i]>0;
		
		return out;
	};
	self.save = function(k){
		var source = 'server/neuralnets/' + k + '.bot';
		if (fs.existsSync(source)) fs.unlinkSync(source);
		var str = "";
		for(var i = 0; i < 300; i++) str += self.genes[i] + "\n";
		fs.writeFileSync(source, str, {"encoding":'utf8'});
	};
	self.load = function(){
		self.id = Math.floor(Math.random()*neuralFiles);
		self.randomWeights();

		var parentCount = Math.floor(Math.random()*3+1);
		for(var p = 0; p < parentCount; p++){
			var source = 'server/neuralnets/' + Math.floor(Math.random()*neuralFiles) + '.bot';
			if (fs.existsSync(source)) {
				var fileData = fs.readFileSync(source, "utf8").split('\n');
				for(var i = 0; i < 300; i++) self.genes[i] += parseFloat(fileData[i])/parentCount;
			}
		}
	};
	return self;
};
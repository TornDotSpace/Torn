module.exports = function Blast(ownr, i, weaponID){
	var self = {
		type:"Blast",
		id:i, // unique identifier
		dmg:wepns[weaponID].Damage,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:ownr.angle,
		bx:ownr.x,
		by:ownr.y,
		wepnID:weaponID,
		time:0, // since spawn
	}
	self.tick = function(){
		self.time++;
		if(self.time>11) delete blasts[self.sy][self.sx][self.id];
		if(self.time == 1){
			
			for(var i in players[self.sy][self.sx]){
				var player = players[self.sy][self.sx][i];
				if((self.bx-player.x) * Math.cos(self.angle) + (self.by-player.y) * Math.sin(self.angle) > 0) continue;
				var pDist = Math.hypot(player.x - self.bx, player.y - self.by);
				var fx = player.x - Math.cos(self.angle) * pDist; // all this ugly math is just to check collision of a player with a ray
				var fy = player.y - Math.sin(self.angle) * pDist;
				if(Math.hypot(fx-self.bx,fy-self.by) < ships[player.ship].width*2/3) self.hit(player);
			}
			
			/*for(var i in asts[self.sy][self.sx]){
				var ast = asts[self.sy][self.sx][i];
				if((self.bx-ast.x) * Math.cos(self.angle) + (self.by-ast.y) * Math.sin(self.angle) > 0) continue;
				var pDist = Math.hypot(ast.x - self.bx, ast.y - self.by);
				var fx = ast.x - Math.cos(self.angle) * pDist;
				var fy = ast.y - Math.sin(self.angle) * pDist;
				if(Math.hypot(fx-self.bx,fy-self.by) < 64*2/3) self.hit(ast);
			} // not using this atm */
			
			var base = bases[self.sy][self.sx];
			if(base.color == self.owner.color || !base.turretLive) return;
			if((self.bx-base.x) * Math.cos(self.angle) + (self.by-base.y) * Math.sin(self.angle) > 0) return;
			var pDist = Math.hypot(base.x - self.bx, base.y - self.by);
			var fx = base.x - Math.cos(self.angle) * pDist;
			var fy = base.y - Math.sin(self.angle) * pDist;
			if(Math.hypot(fx-self.bx,fy-self.by) < 128*2/3) self.hit(base);
		}
	}
	self.hit = function(b){
		if(self.wepnID == 25 && self.owner.color !== b.color) b.EMP(wepns[25].Charge*.6); // emp blast
		else if(self.wepnID == 34 && self.owner.color !== b.color) b.dmg(self.dmg, self); // muon
		else if(self.wepnID == 41) b.brainwashedBy = self.owner.id; // brainwashing laser
	}
	return self;
};
MODULES["buildings"] = {};
//These can be changed (in the console) if you know what you're doing:
MODULES["buildings"].nursCostRatio = 0.05; //nursery to warpstation/collector cost ratio. Also for extra gems.
MODULES["buildings"].storageMainCutoff = 0.8; //when to buy more storage. (80%)
MODULES["buildings"].storageLowlvlCutoff1 = 0.7; //when to buy more storage at zone 1
MODULES["buildings"].storageLowlvlCutoff2 = 0.5; //when to buy more storage from zone 2-10   (more leeway so it doesnt fill up)

var housingList = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector', 'Warpstation'];

//An error-resilient function that will actually purchase buildings and return a success status
function safeBuyBuilding(building){
    if(isBuildingInQueue(building))
        return false;
    //check if building is locked, or else it can buy 'phantom' buildings and is not exactly safe.
    if (game.buildings[building].locked)
        return false;
    var oldBuy = preBuy2();
    //build 2 at a time if we have the mastery for it.
    //Note: Bypasses any "Max" caps by 1 if they are odd numbers and we can afford the 2nd one.
    if(game.talents.doubleBuild.purchased) {
        game.global.buyAmt = 2;
        if(game.talents.deciBuild.purchased){
            game.global.buyAmt = 10;
            if (!canAffordBuilding(building))
                game.global.buyAmt = 2;
        }
        if(!canAffordBuilding(building)) {
            game.global.buyAmt = 1;
            if(!canAffordBuilding(building)){
                postBuy2(oldBuy);
                return false;
            }
        }
    }else {
        game.global.buyAmt = 1;
        if(!canAffordBuilding(building)){
            postBuy2(oldBuy);
            return false;
        }
    }
    game.global.firing = false;
    //buy max warpstations when we own <2 (ie: after a new giga)
    //thereafter, buy only 1 warpstation
    
    if (building == 'Warpstation'){
        if (game.buildings.Warpstation.owned < 2 || getPageSetting('MoreFarming')){
            game.global.buyAmt = 'Max';
            game.global.maxSplit = 1;
        }else
            game.global.buyAmt = 1;
        
        buyBuilding(building, true, true);
        debug('Building ' + game.global.buyAmt + ' ' + building + 's', "buildings", '*rocket');
        postBuy2(oldBuy);
        return;
    }
    debug('Building ' + building, "buildings", '*hammer2');
    buyBuilding(building, true, true);
    postBuy2(oldBuy);
    return true;
}

//Decision function to buy best "Food" Buildings
function buyFoodEfficientHousing() {
    var foodHousing = ["Hut", "House", "Mansion", "Hotel", "Resort"];
    var unlockedHousing = [];
    for (var house in foodHousing) {
        if (game.buildings[foodHousing[house]].locked === 0 && getPageSetting("Max"+foodHousing[house]) !== 0) {
            unlockedHousing.push(foodHousing[house]);
        }
    }
    if(unlockedHousing.length === 0)
        return;
        
    var buildorder = [];
    for (var house in unlockedHousing) {
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "food", false, 1);
        var ratio = cost / building.increase.by;
        buildorder.push({
            'name': unlockedHousing[house],
            'ratio': ratio
        });
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    buildorder.sort(function (a, b) {
        return a.ratio - b.ratio;
    });
    var bestfoodBuilding = null;
    //if this building is first, its best.
    var bb = buildorder[0];
    var max = getPageSetting('Max' + bb.name);
    if (game.buildings[bb.name].owned < max || max == -1) {
        bestfoodBuilding = bb.name;
    }
    //if we found something make it green and buy it
    if (bestfoodBuilding) {
        document.getElementById(bestfoodBuilding).style.border = "1px solid #00CC01";
        safeBuyBuilding(bestfoodBuilding);
    }
}

function buyGemEfficientHousing(){
    var gemHousing = ["Hotel", "Resort", "Gateway", "Collector", "Warpstation"];
    var unlockedHousing = [];

    for (var house in gemHousing){
        if (game.buildings[gemHousing[house]].locked === 0 && (house == 4 || getPageSetting("Max"+gemHousing[house]) !== 0)){
            unlockedHousing.push(gemHousing[house]);
        }
    }
    if(unlockedHousing.length === 0)
        return;
    
    var obj = {};
    for (var house in unlockedHousing){
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "gems", false, 1);
        var ratio = cost / building.increase.by;
        //don't consider Gateway if we can't afford it right now - hopefully to prevent game waiting for fragments to buy gateway when collector could be bought right now
        if (unlockedHousing[house] == "Gateway" && !canAffordBuilding('Gateway'))
            continue;
        obj[unlockedHousing[house]] = ratio;
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    var keysSorted = Object.keys(obj).sort(function (a, b){
            return obj[a] - obj[b];
        });
    bestBuilding = null;
    //loop through the array and find the first one that isn't limited by max settings
    for (var best in keysSorted){
        var max = getPageSetting('Max' + keysSorted[best]);
        if (max === false) max = -1;
        if (game.buildings[keysSorted[best]].owned < max || max == -1){
            bestBuilding = keysSorted[best];
            //WarpStation Cap:
            
            if (getPageSetting('WarpstationCap') && bestBuilding == "Warpstation"){
                //Warpstation Cap - if we are past the basewarp+deltagiga level, "cap" and just wait for next giga.
                if ((game.buildings.Warpstation.owned >= (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')))
                    && (!getPageSetting('MoreFarming') || game.global.world >= 230) //if morefarming mode is enabled, always buy warpstations below zone 230
                    ) 
                    continue;
            }
            //WarpStation Wall:
            var warpwallpct = getPageSetting('WarpstationWall3');
            if (warpwallpct > 1 && bestBuilding == "Warpstation"){
                //Warpstation Wall - allow only warps that cost 1/n'th less then current metal (try to save metal for next prestige)
                if (getBuildingItemPrice(game.buildings.Warpstation, "metal", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) > (game.resources.metal.owned / warpwallpct))
                    continue;
            }
            
            //if we found something make it green and buy it
            if (bestBuilding)
                safeBuyBuilding(bestBuilding);
            
        }
    }
}

function buyBuildings() {
    var customVars = MODULES["buildings"];
    var oldBuy = preBuy2();
    game.global.buyAmt = 1;
    var perTrap = 1 + game.portal.Bait.level;
    var trapFlag = perTrap > game.resources.trimps.owned / (game.global.challengeActive == "Trapper" ? 1000 : 100); //if trap produces more than 1/100th of our population (1/1000th in trapper), use traps
    if(trapFlag && game.resources.trimps.owned < trimpsRealMax - 1 && canAffordBuilding('Trap') && game.global.buildingsQueue.length === 0 && game.buildings.Trap.owned === 0)
        safeBuyBuilding('Trap');
    
    buyFoodEfficientHousing();  //["Hut", "House", "Mansion", "Hotel", "Resort"];
    if ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist"))
        return;
    buyGemEfficientHousing();   //["Hotel", "Resort", "Gateway", "Collector", "Warpstation"];
    //WormHoles:
    if ((game.buildings.Wormhole.owned < getPageSetting('MaxWormhole') || getPageSetting('MaxWormhole') < 0) && !game.buildings.Wormhole.locked) {
        safeBuyBuilding('Wormhole');
    }
    //Buy non-housing buildings:
    //Gyms:
    if (!game.buildings.Gym.locked) {
        var skipGym = false;
        if(game.upgrades.Gymystic.allowed > game.upgrades.Gymystic.done)
            skipGym = true; //dont spend wood on gyms when we need gymystic upgrade. should add a check to buy gyms until they cost some percentage of gymystic
        //ShieldBlock cost Effectiveness:
        if (game.equipment['Shield'].blockNow) {
            var gymEff = evaluateEquipmentEfficiency('Gym');
            var shieldEff = evaluateEquipmentEfficiency('Shield');
            if ((gymEff.Wall) || (gymEff.Factor <= shieldEff.Factor && !gymEff.Wall))
                skipGym = true;
        }
        if(buyCoords && game.upgrades.Coordination.done < game.upgrades.Coordination.allowed)
            skipGym = true;
        if (!skipGym)
            safeBuyBuilding('Gym');
    }
    //Tributes:
    var tributes = getPageSetting('MaxTribute');
    if (!game.buildings.Tribute.locked && tributes !== 0 && (tributes > game.buildings.Tribute.owned || tributes < 0)){
        safeBuyBuilding('Tribute');
    }
    
    if(game.global.spireActive && !isActiveSpireAT() && getPageSetting('NurseriesSurvive')){
        var howMany = calcCurrSendHealth(true, true, false, game.global.world);
        if(howMany > 0){
            safeBuyBuilding('Nursery');
            postBuy2(oldBuy);
            return;
        }
    }
    
    var nursminlvl = getPageSetting('NoNurseriesUntil');
    var maxNursery = (isActiveSpireAT() ? getPageSetting('PreSpireNurseries') : getPageSetting('MaxNursery'));
    if (((game.global.world < nursminlvl || nursminlvl < 0) && !isActiveSpireAT()) || (game.buildings.Nursery.owned >= maxNursery && maxNursery >= 0) || maxNursery === 0 || (getPageSetting('NoNurseriesIce') && (getEmpowerment() == "Ice") && game.global.world > nursminlvl+5)) {
        postBuy2(oldBuy);
        return;
    }
    
    /*var nwr = customVars.nursCostRatio; //nursery to warpstation/collector cost ratio. Also for extra gems.
    var nursCost = getBuildingItemPrice(game.buildings.Nursery, "gems", false, 1);
    var warpCost = getBuildingItemPrice(game.buildings.Warpstation, "gems", false, 1);
    var collCost = getBuildingItemPrice(game.buildings.Collector, "gems", false, 1);
    var resomod = Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level); //need to apply the resourceful mod when comparing anything other than building vs building.
    //buy nurseries irrelevant of warpstations (after we unlock them) - if we have enough extra gems that its not going to impact anything. note:(we will be limited by wood anyway - might use a lot of extra wood)
    var buyWithExtraGems = (!game.buildings.Warpstation.locked && nursCost * resomod < nwr * game.resources.gems.owned);
    if ((buyWithExtraGems ||
         ((nursCost < nwr * warpCost || game.buildings.Warpstation.locked) &&
          (nursCost < nwr * collCost || game.buildings.Collector.locked || !game.buildings.Warpstation.locked)))) {*/
           safeBuyBuilding('Nursery');
    //}
    postBuy2(oldBuy);
}

//Buys more storage if resource is over 85% full (or 50% if Zone 2-10) (or 70% if zone==1)
function buyStorage() {
    var customVars = MODULES["buildings"];
    var packMod = 1 + game.portal.Packrat.level * game.portal.Packrat.modifier;
    var Bs = {
        'Barn': 'food',
        'Shed': 'wood',
        'Forge': 'metal'
    };
    for (var B in Bs) {
        var owned = game.resources[Bs[B]].owned;
        var max = game.resources[Bs[B]].max * packMod;
        if (game.heirlooms.Shield.storageSize.currentBonus > 0)
            max *= (100 + game.heirlooms.Shield.storageSize.currentBonus);
        if ((game.global.world == 1 && owned > max * customVars.storageLowlvlCutoff1) ||
            (game.global.world >= 2 && game.global.world < 10 && owned > max * customVars.storageLowlvlCutoff2) ||
            (owned > max * customVars.storageMainCutoff)) {
            if (canAffordBuilding(B) && game.triggers[B].done) {
                safeBuyBuilding(B);
            }
        }
    }
}

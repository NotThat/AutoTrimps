MODULES["equipment"] = {};
//These can be changed (in the console) if you know what you're doing:
MODULES["equipment"].capDivisor = 10; //Your Equipment cap divided by this will give you the lower cap for liquified and overkilled zones
var verbose = false;
var buyWeaponsMode; //0: dont buy anything, only prestige once if it lowers damage. 1: prestige till -1 and level 2: 2: buy levels only, prestige if level > 81 or another weapon is higher prestige 3: get all 4: get max levels at current prestiges only

var equipmentList = { 
    'Dagger': {
        Upgrade: 'Dagadder',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Mace': {
        Upgrade: 'Megamace',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Polearm': {
        Upgrade: 'Polierarm',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Battleaxe': {
        Upgrade: 'Axeidic',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Greatsword': {
        Upgrade: 'Greatersword',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Boots': {
        Upgrade: 'Bootboost',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Helmet': {
        Upgrade: 'Hellishmet',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Pants': {
        Upgrade: 'Pantastic',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shoulderguards': {
        Upgrade: 'Smoldershoulder',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Breastplate': {
        Upgrade: 'Bestplate',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Arbalest': {
        Upgrade: 'Harmbalest',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Gambeson': {
        Upgrade: 'GambesOP',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shield': {
        Upgrade: 'Supershield',
        Stat: 'health',
        Resource: 'wood',
        Equip: true
    },
    'Gym': {
        Upgrade: 'Gymystic',
        Stat: 'block',
        Resource: 'wood',
        Equip: false
    }
};
var mapresourcetojob = {"food": "Farmer", "wood": "Lumberjack", "metal": "Miner", "science": "Scientist"};  //map of resource to jobs

//Returns the amount of stats that the equipment (or gym) will give when bought.
function equipEffect(gameResource, equip) {
    if (equip.Equip) {
        return gameResource[equip.Stat + 'Calculated'];
    } else {
        //Gym
        var oldBlock = gameResource.increase.by * gameResource.owned;
        var Mod = game.upgrades.Gymystic.done ? (game.upgrades.Gymystic.modifier + (0.01 * (game.upgrades.Gymystic.done - 1))) : 1;
        var newBlock = gameResource.increase.by * (gameResource.owned + 1) * Mod;
        return newBlock - oldBlock;
    }
}
//Returns the cost after Artisanistry of a piece of equipment.
function equipCost(gameResource, equip) {
    var price = parseFloat(getBuildingItemPrice(gameResource, equip.Resource, equip.Equip, 1));
    if (equip.Equip)
        price = Math.ceil(price * (Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level)));
    else
        price = Math.ceil(price * (Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level)));
    return price;
}
//Returns the amount of stats that the prestige will give when bought.
function PrestigeValue(what) {
    var name = game.upgrades[what].prestiges;
    var equipment = game.equipment[name];
    var stat;
    if (equipment.blockNow) stat = "block";
    else stat = (typeof equipment.health !== 'undefined') ? "health" : "attack";
    var toReturn = Math.round(equipment[stat] * Math.pow(1.19, ((equipment.prestige) * game.global.prestige[stat]) + 1));
    return toReturn;
}

//evaluateEquipmentEfficiency: Back end function to determine most cost efficient items, and what color they should be.
function evaluateEquipmentEfficiency(equipName) {
    var equip = equipmentList[equipName];
    var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
    if (equipName == 'Shield') {
        if (gameResource.blockNow) {
            equip.Stat = 'block';
        } else {
            equip.Stat = 'health';
        }
    }
    var Effect = equipEffect(gameResource, equip);
    var Cost = equipCost(gameResource, equip);
    var Factor = Effect / Cost;
    var StatusBorder = 'white';
    var Wall = false;

    if (!game.upgrades[equip.Upgrade].locked) {
        //Evaluating upgrade!
        var CanAfford = canAffordTwoLevel(game.upgrades[equip.Upgrade]);
        if (equip.Equip) {
            var NextEffect = PrestigeValue(equip.Upgrade);
            //Scientist 3 and 4 challenge: set metalcost to Infinity so it can buy equipment levels without waiting for prestige. (fake the impossible science cost)
            //also Fake set the next cost to infinity so it doesn't wait for prestiges if you have both options disabled.
            if ((game.global.challengeActive == "Scientist" && getScientistLevel() > 2) || (!BuyWeaponUpgrades && !BuyArmorUpgrades))
                var NextCost = Infinity;
            else
                var NextCost = Math.ceil(getNextPrestigeCost(equip.Upgrade) * Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level));
            Wall = (NextEffect / NextCost > Factor);
            if (buyWeaponsMode === 3) { //eventhough we allow prestiging of equipment, defer it until levels become expensive.
                if(Cost * 100 < game.resources.metal.owned)
                    Wall = false;
            }
            else if (buyWeaponsMode == 2 || buyWeaponsMode == 4) Wall = false; //prestiging equipment isnt allowed, so allow buying levels
            
            //buyWeaponsMode; //1: prestige till -1 and level 2: buy levels only 3: get all

            if (verbose) debug("equipname " + equipName + " " + game.upgrades[equipmentList[equipName].Upgrade].done + "/" + game.equipment[equipName].level + " wall " + Wall + " buyWeaponsMode " + buyWeaponsMode);
            var done = game.upgrades[equipmentList[equipName].Upgrade].done;
            var allowed = game.upgrades[equipmentList[equipName].Upgrade].allowed;
            if(getPageSetting('AutoStance')==1 && getPageSetting('DelayWeaponsForWind') && buyWeaponsMode === 1 && done === allowed - 1) //1: prestige till 1 before max prestige and level 2: prestige only 3: buy everything
                Wall = false;
        }

        //white - Upgrade is not available
        //yellow - Upgrade is not affordable
        //orange - Upgrade is affordable, but will lower stats
        //red - Yes, do it now!

        if (!CanAfford) {
            StatusBorder = 'yellow';
        } else {
            if (!equip.Equip) {
                //Gymystic is always cool, f*** shield - lol
                StatusBorder = 'red';
            } else {
                var CurrEffect = gameResource.level * Effect;
                var NeedLevel = Math.ceil(CurrEffect / NextEffect);
                var Ratio = gameResource.cost[equip.Resource][1];
                var NeedResource = NextCost * (Math.pow(Ratio, NeedLevel) - 1) / (Ratio - 1);
                if (game.resources[equip.Resource].owned > NeedResource) {
                    StatusBorder = 'red';
                } else {
                    StatusBorder = 'orange';
                }
            }
        }
    }
    //what this means:
    //wall (don't buy any more equipment, buy prestige first)
    //Factor = 0 sets the efficiency to 0 so that it will be disregarded. if not, efficiency will still be somenumber that is cheaper,
    //      and the algorithm will get stuck on whatever equipment we have capped, and not buy other equipment.
    if (game.jobs[mapresourcetojob[equip.Resource]].locked && (game.global.challengeActive != 'Metal')){
        //cap any equips that we haven't unlocked metal for (new/fresh game/level1/no helium code)
        Factor = 0;
        Wall = true;
    }
    if (gameResource.level < 25 && equip.Stat != "attack") {
        Factor = 999 - gameResource.prestige;
    }
    //skip buying shields (w/ shieldblock) if we need gymystics
    if (equipName == 'Shield' && gameResource.blockNow &&
        game.upgrades['Gymystic'].allowed - game.upgrades['Gymystic'].done > 0)
        {
            needGymystic = true;
            Factor = 0;
            Wall = true;
            StatusBorder = 'orange';
        }
    return {
        Stat: equip.Stat,
        Factor: Factor,
        StatusBorder: StatusBorder,
        Wall: Wall,
        Cost: Cost
    };
}

var resourcesNeeded;
var Best;
function autoLevelEquipment(lowerDamage, buyDamage, fastMode, colorStyle) {
    var boughtSomething = false;
    resourcesNeeded = {"food": 0, "wood": 0, "metal": 0, "science": 0, "gems": 0};  //list of amount of resources needed for stuff we want to afford
    Best = {};
    var keys = ['healthwood', 'healthmetal', 'attackmetal', 'blockwood'];
    for (var i = 0; i < keys.length; i++) {
        Best[keys[i]] = {
            Factor: 0,
            Name: '',
            Wall: false,
            StatusBorder: 'white',
            Cost: 0
        };
    }

//PRESTIGE SECTION:
    for (var equipName in equipmentList) {
        var equip = equipmentList[equipName];
        if(buyDamage){
            if(equip.Stat !== "attack")
                continue;
        }
        else{ //buy health only
            if(equip.Stat === "attack")
                continue;
        }
        var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
        if (!gameResource.locked) {
            var $equipName = document.getElementById(equipName);
            if(colorStyle) $equipName.style.color = 'white';   //reset
            //var evaluation = evaluateEquipmentEfficiency(equipName);
            var evaluation = evalObjAT[equipName];
            var BKey = equip.Stat + equip.Resource;

            if (Best[BKey].Factor === 0 || Best[BKey].Factor < evaluation.Factor) {
                Best[BKey].Factor = evaluation.Factor;
                Best[BKey].Name = equipName;
                Best[BKey].Wall = evaluation.Wall;
                Best[BKey].StatusBorder = evaluation.StatusBorder;
            }
            Best[BKey].Cost = evaluation.Cost;
            //add up whats needed:
            resourcesNeeded[equip.Resource] += Best[BKey].Cost;
            
            //Apply colors from before:
            //white - Upgrade is not available
            //yellow - Upgrade is not affordable (or capped)
            //orange - Upgrade is affordable, but will lower stats
            //red - Yes, do it now!
            if (evaluation.Wall)
                if(colorStyle) $equipName.style.color = 'yellow';
            if(colorStyle) $equipName.style.border = '1px solid ' + evaluation.StatusBorder;

            var $equipUpgrade = document.getElementById(equip.Upgrade);
            if (evaluation.StatusBorder != 'white' && evaluation.StatusBorder != 'yellow' && $equipUpgrade)
                if(colorStyle) $equipUpgrade.style.color = evaluation.StatusBorder;
            if (evaluation.StatusBorder == 'yellow' && $equipUpgrade) 
                if(colorStyle) $equipUpgrade.style.color = 'white';
            if (equipName == 'Gym' && needGymystic) {
                if(colorStyle) $equipName.style.color = 'white';
                if(colorStyle) $equipName.style.border = '1px solid white';
                if ($equipUpgrade) {
                    if(colorStyle) $equipUpgrade.style.color = 'red';
                    if(colorStyle) $equipUpgrade.style.border = '2px solid red';
                }
            }

            if (evaluation.StatusBorder == 'red') {
                if ((BuyWeaponUpgrades && equipmentList[equipName].Stat == 'attack') || (BuyWeaponUpgrades && equipmentList[equipName].Stat == 'block') || (BuyArmorUpgrades && equipmentList[equipName].Stat == 'health'))
                {
                    var allow = true;
                    if(equipmentList[equipName].Stat == 'attack' && getPageSetting('AutoStance')==1 && getPageSetting('DelayWeaponsForWind')){
                        if(buyWeaponsMode === 0){ 
                            allow = false;
                            if(lowerDamage && game.equipment[equipName].level >= 9) //only buy prestige if it lowers our damage
                                allow = true;
                        }
                        else if(buyWeaponsMode === 1){ //dont buy the last prestige
                            var done = game.upgrades[equipmentList[equipName].Upgrade].done;
                            var allowed = game.upgrades[equipmentList[equipName].Upgrade].allowed;
                            if (done === allowed - 1)
                                allow = false;
                        }
                        else if(buyWeaponsMode === 2){ //dont prestige, unless other weapon is higher prestige
                            if(game.upgrades[equipmentList[equipName].Upgrade].done >= highestPrestigeOwned){
                                allow = false;
                            }
                            //if (game.equipment[equipName].level > 81 && !(game.global.world == 400 && game.global.challengeActive == "Daily")) //spire3 special case on dailies, grab every level we can afford so hopefully we prestige+1 after and farm low 400s more easier
                            if (game.global.gridArray[0].name == "Liquimp" && game.equipment[equipName].level > 9) //fast on liquidated
                                allow = true;
                            else if (game.global.world == 300 && game.equipment[equipName].level > 40)
                                allow = true;
                            else if (game.global.world == 400 && getPageSetting('Spire3Time') < 6 && game.equipment[equipName].level > 40)
                                allow = true;
                        }
                        else if(buyWeaponsMode === 3){
                            //if (game.upgrades[upgrade].done === highestPrestigeOwned){
                                if(equipCost(gameResource, equip)*100 < game.resources.metal.owned && !fastMode) //keep buying levels until they cost 0.1% of total metal
                                    allow = false;
                            //}
                        }
                        else if(buyWeaponsMode == 4)
                            allow = false;
                        if(game.upgrades[equipmentList[equipName].Upgrade].done > highestPrestigeOwned)
                            highestPrestigeOwned = game.upgrades[equipmentList[equipName].Upgrade].done;
                    }
       
                    var upgrade = equipmentList[equipName].Upgrade;
                    if (upgrade != "Gymystic" && allow)
                        debug('Upgrading ' + upgrade + " - Prestige " + game.equipment[equipName].prestige, "equips", '*upload');
                    if(allow){ //we want to prioritize buying levels over buying prestiges. only buy prestige if next weapon level isnt trivially affordeed
                        preBuy();
                        debug('Upgrading ' + upgrade + " # " + game.upgrades[upgrade].allowed + " buyWeaponsMode " + buyWeaponsMode, "equips", '*upload');
                        buyUpgrade(upgrade, true, true);
                        postBuy();
                        evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName); //update equipment eval
                        boughtSomething = true;
                    }
                }
                else {
                    if(colorStyle) $equipName.style.color = 'orange';
                    if(colorStyle) $equipName.style.border = '2px solid orange';
                }
            }
        }
    }

    //LEVELING EQUIPMENT SECTION:
    preBuy();
    game.global.buyAmt = 1; //needed for buyEquipment()
    var BuyWeaponLevels = ((getPageSetting('BuyWeaponsNew')==1) || (getPageSetting('BuyWeaponsNew')==3));
    var BuyArmorLevels = ((getPageSetting('BuyArmorNew')==1) || (getPageSetting('BuyArmorNew')==3));
    for (var stat in Best) {
        var equipName = Best[stat].Name;
        var $eqName = document.getElementById(equipName);
        if (equipName !== '') {
            var DaThing = equipmentList[equipName];
            if (equipName == 'Gym' && needGymystic) {
                if(colorStyle) $eqName.style.color = 'white';
                if(colorStyle) $eqName.style.border = '1px solid white';
                continue;
            } else {
                if(colorStyle) $eqName.style.color = Best[stat].Wall ? 'orange' : 'red';
                if(colorStyle) $eqName.style.border = '2px solid red';
            }
            if(equipName != 'Gym')
                if (verbose) debug("leveling Z" + game.global.world + " " + equipName + "("+game.upgrades[equipmentList[equipName].Upgrade].done + "/" + game.equipment[equipName].level+") buyWeaponsMode " + buyWeaponsMode); 
            //If we're considering an attack item, we want to buy weapons if we don't have enough damage, or if we don't need health (so we default to buying some damage)
            if (buyDamage && BuyWeaponLevels && DaThing.Stat == 'attack'){ 
                if (DaThing.Equip && canAffordBuilding(equipName, null, null, true)) {
                    var allow = true;
                    if(getPageSetting('AutoStance')==1 && getPageSetting('DelayWeaponsForWind') && (buyWeaponsMode === 0)){
                        allow = false;
                    }
                    if(allow){
                        buyEquipment(equipName, null, true);
                        evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
                        boughtSomething = true;
                    }
                }
            }
            //If we're considering a health item, buy it if we don't have enough health, otherwise we default to buying damage
            if (!buyDamage && BuyArmorLevels && (DaThing.Stat == 'health' || DaThing.Stat == 'block') && game.global.soldierHealth < wantedHP && game.global.soldierHealth > 1) {
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(equipName, null, null, true)) {
                    buyEquipment(equipName, null, true);
                    //debug("bought " + equipName, "equips");
                    evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
                    boughtSomething = true; 
                }
            }
            //Always LVL 25:
            if (!buyDamage && BuyArmorLevels && (DaThing.Stat == 'health') && game.equipment[equipName].level < 25){
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(equipName, null, null, true)) {
                    buyEquipment(equipName, null, true);
                    evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
                    boughtSomething = true;
                }
            }
        }
    }
    postBuy();
    
    if(boughtSomething)
        calcBaseDamageinB();
    return boughtSomething;
}

function getDamageLoop(dmg, lowerDamage, noCrit, maxLoop){
    var dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    var dmgLast = 0;
    
    while (dmgLast != dmgToCheck && maxLoop-- > 0){
        //if(game.global.soldierHealth < wantedHP && game.global.soldierHealth > 1)
            autoLevelEquipment(lowerDamage, false, true); //buy health only
        
        if (dmgToCheck*8 >= dmg) //have enough damage
            return true;
        
        dmgLast = dmgToCheck;
        autoLevelEquipment(lowerDamage, true, true); //buy damage only autoLevelEquipment(lowerDamage, buyDamage, fastMode, colorStyle)
        dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    }
    return false;
}

function getDamage(dmg, lowerDamage, noCrit){
    var dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    var maxLoop = 500;
            
    if (baseDamageHigh < 0 || game.global.soldierCurrentAttack < 0) {
        debug("error: getDamage: damage " + game.global.soldierCurrentAttack + " " + baseDamageHigh);
        if (baseDamageHigh < 0 || game.global.soldierCurrentAttack < 0)
            return;
    }
    else if(baseDamageHigh === 0){
        calcBaseDamageinB();
        if(baseDamageHigh === 0)
            debug("error: baseDamageHigh is zero. Buying damage.");
    }
    
    if(game.global.runningChallengeSquared){
        buyWeaponsMode = 3;
        if(getDamageLoop(dmg, lowerDamage, noCrit, maxLoop))
            return;
    }
    
    if (!game.global.spireActive && game.options.menu.liquification.enabled && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        if(dmgToCheck*8 >= dmg) buyWeaponsMode = 0;
        else buyWeaponsMode = 3;
        //autoLevelEquipment(lowerDamage, true, true);
        getDamageLoop(dmg, lowerDamage, noCrit, maxLoop);
        return;
    }
    
    buyWeaponsMode = 0;
    if(getDamageLoop(dmg, lowerDamage, noCrit, maxLoop))
        return;
    
    buyWeaponsMode = 2; //allow buying equipment levels but not prestige
    if(getDamageLoop(dmg, lowerDamage, noCrit, maxLoop))
        return;
    
    if(game.upgrades.Coordination.done < game.upgrades.Coordination.allowed){
        if (game.global.mapsActive) AutoMapsCoordOverride = true;
        else allowBuyingCoords = true;
        
        var wantHowManyCoords = log1point25(dmgToCheck*8/dmg); //how many coords we want for desired damage
        var newMaxCoords = game.upgrades.Coordination.done + Math.ceil(wantHowManyCoords);
        if(maxCoords < newMaxCoords){
            maxCoords = newMaxCoords;
            debug("Autostance3: allowing buying coord Wind #" + maxCoords + " on " + ((game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1), "equips");
        }
    }
    
    buyWeaponsMode = 3; //allow buying equipment levels and prestiges
    if(getDamageLoop(dmg, lowerDamage, noCrit, maxLoop))
        return;
}

var evalObjAT = {};
var BuyWeaponUpgrades = ((getPageSetting('BuyWeaponsNew')==1) || (getPageSetting('BuyWeaponsNew')==2));
var BuyArmorUpgrades = ((getPageSetting('BuyArmorNew')==1) || (getPageSetting('BuyArmorNew')==2));
function getDamageCaller(dmg, lowerDamage, noCrit){
    BuyWeaponUpgrades = ((getPageSetting('BuyWeaponsNew')==1) || (getPageSetting('BuyWeaponsNew')==2));
    BuyArmorUpgrades = ((getPageSetting('BuyArmorNew')==1) || (getPageSetting('BuyArmorNew')==2));
    calcEnemyDamage();
    
    for (var equipName in equipmentList) //update equipment evaluations
        evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
    
    getDamage(dmg, lowerDamage, noCrit);
    
    if (game.global.world === 400 && game.global.challengeActive === "Daily" && getPageSetting('Spire3Time') > 1){
        var backup = buyWeaponsMode;
        buyWeaponsMode = 4;
        var maxLoop = 50;
        var dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
        var dmgLast = 0;
        while (dmgLast != dmgToCheck && maxLoop-- > 0){
            dmgLast = dmgToCheck;
            autoLevelEquipment();
            dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
        }
        buyWeaponsMode = backup;
    }
}

//these get updated whenever calcBaseDamageinB() is called
function dmgToCompare(good, noCrit){
    if(good){
        if(noCrit) return baseDamageHighNoCrit;
        else       return baseDamageHigh;
    }
    else{
        if(noCrit) return baseDamageLowNoCrit;
        else       return baseDamageLow;            
    }
}

var wantedHP = 1;
function calcEnemyDamage(){ //enemy damage calculation and sets enoughHealthE
    //EQUIPMENT HAS ITS OWN DAMAGE CALC SECTION:
    //spire is a special case.
    var enemyDamage = 0;
    if (isActiveSpireAT()) {
        var exitcell;
        if(game.global.challengeActive == "Daily")
            exitcell = getPageSetting('ExitSpireCellDailyC2');
        else
            exitcell = getPageSetting('ExitSpireCell');
        var cell = (!game.global.mapsActive && !game.global.preMapsActive) ? game.global.lastClearedCell : 50;
        if (exitcell > 1)
            cell = exitcell;
        cell = 100;
        enemyDamage = getSpireStats(cell, "Snimp", "attack");
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
    }
    else{
        enemyDamage = getEnemyMaxAttack(game.global.world + 1, 50, 'Snimp', 1.2);
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
    }

    //below challenge multiplier not necessarily accurate, just fudge factors
    if(game.global.challengeActive == "Toxicity") {
        //ignore damage changes (which would effect how much health we try to buy) entirely since we die in 20 attacks anyway?
        if(game.global.world < 61)
            enemyDamage *= 2;
    }
    else if(game.global.challengeActive == 'Lead') {
        enemyDamage *= 2.5;
    }
    
    //chilled
    if (getEmpowerment() == "Ice"){
        enemyDamage *= game.empowerments.Ice.getCombatModifier();
    }
    enemyDamage *= getCorruptScale("attack");

    var safetyNet = 2.65;
    if(!game.global.preMapsActive && (getCurrentEnemy(1).corrupted == "corruptBleed" || getCurrentEnemy(1).corrupted == "healthyBleed"))
        safetyNet = 3.65;
    
    wantedHP = safetyNet*enemyDamage;
}
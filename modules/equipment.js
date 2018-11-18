//MODULES["equipment"] = {};
var buyWeaponsMode; //0: dont buy levels, only prestige once if it lowers damage. 2: buy levels, prestige if leveling costs more than 1% of total resources, or another weapon is higher prestige 3: get all 4: buy levels only

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
    //if (gameResource.level < 25 && equip.Stat != "attack") {
    //    Factor = 999 - gameResource.prestige;
    //}
    //skip buying shields (w/ shieldblock) if we need gymystics
    if (equipName == 'Shield' && gameResource.blockNow &&
        game.upgrades['Gymystic'].allowed - game.upgrades['Gymystic'].done > 0)
        {
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
function autoLevelEquipment(buyDamage, colorStyle) {
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
            if (equipName == 'Gym'){
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
                            if(game.equipment[equipName].level >= 9) //only buy prestige if it lowers our damage
                                allow = true;
                        }
                        else if(buyWeaponsMode === 2){ //prestige if costs more than 1% of total metal
                            allow = false;
                            if(equipCost(gameResource, equip)*100 > game.resources.metal.owned){ //keep buying levels until they cost 1% of total metal
                                allow = true;
                                buyWeaponsMode = 4;
                            }
                        }
                        else if(buyWeaponsMode === 3){
                            allow = true;
                            buyWeaponsMode = 4;
                        }
                        else if(buyWeaponsMode == 4)
                            allow = false;
                        
                        if(buyWeaponsMode !== 0 && game.upgrades[equipmentList[equipName].Upgrade].done < highestPrestigeOwned)
                            allow = true; 
                    }
       
                    var upgrade = equipmentList[equipName].Upgrade;
                    if(allow){ //we want to prioritize buying levels over buying prestiges. only buy prestige if next weapon level isnt trivially affordeed
                        preBuy();
                        buyUpgrade(upgrade, true, true);
                        postBuy();
                        evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName); //update equipment eval
                        if(buyDamage)
                            debug('Upgrading ' + " #" + game.equipment[equipName].prestige + " " + upgrade + " buyWeaponsMode " + buyWeaponsMode, "equips", '*upload');
                        boughtSomething = true;
                    }
                    if(equipmentList[equipName].Stat == 'attack' && game.upgrades[equipmentList[equipName].Upgrade].done > highestPrestigeOwned)
                        highestPrestigeOwned = game.upgrades[equipmentList[equipName].Upgrade].done;
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
        if (equipName !== '') {
            var $eqName = document.getElementById(equipName);
            var DaThing = equipmentList[equipName];
            if (equipName == 'Gym') {
                if(colorStyle) $eqName.style.color = 'white';
                if(colorStyle) $eqName.style.border = '1px solid white';
                continue;
            } else {
                if(colorStyle) $eqName.style.color = Best[stat].Wall ? 'orange' : 'red';
                if(colorStyle) $eqName.style.border = '2px solid red';
            }
            //If we're considering an attack item, we want to buy weapons if we don't have enough damage, or if we don't need health (so we default to buying some damage)
            if (buyDamage && BuyWeaponLevels && DaThing.Stat == 'attack'){ 
                if (DaThing.Equip && canAffordBuilding(equipName, null, null, true) && (metalNeeded === 0 || game.global.totalHeliumEarned > 50000)){
                    var allow = true;
                    if(getPageSetting('AutoStance')==1 && getPageSetting('DelayWeaponsForWind') && (buyWeaponsMode === 0)){
                        allow = false;
                    }
                    if(allow){
                        //buy multiple weapon levels at once
                        var howMany = calculateMaxAfford(game.equipment[equipName], false, true, false, false, 0.01); //1% of available resources
                        if(howMany === 0)
                            howMany = calculateMaxAfford(game.equipment[equipName], false, true, false, false, 0.1); //10% of available resources
                        if(howMany === 0)
                            howMany = calculateMaxAfford(game.equipment[equipName], false, true, false, false, 1); //100% of available resources
                        if(howMany === 0){
                            if(buyWeaponsMode === 3) //if we prestiged is allowed and we cant buy a single level of what we want, we can't get any more damage.
                                return false;
                            buyWeaponsMode = 3; //cant afford to buy 1 level of the equipment, so allow prestiging and restart.
                            return autoLevelEquipment(buyDamage, colorStyle);
                        }
                        game.global.buyAmt = howMany;
                        //debug('Buying ' + game.global.buyAmt + " levels " + game.equipment[equipName].prestige + "-" + game.equipment[equipName].level + " " + equipName + " buyWeaponsMode " + buyWeaponsMode, "equips", '*upload');
                        buyEquipment(equipName, null, true);
                        evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
                        boughtSomething = true;
                    }
                }
            }
            //If we're considering a health item, buy it if we don't have enough health, otherwise we default to buying damage
            if (!buyDamage && BuyArmorLevels && (DaThing.Stat == 'health' || DaThing.Stat == 'block') && game.global.soldierHealth < wantedHP && game.global.soldierHealth > 1) {
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(equipName, null, null, true) && ((metalNeeded === 0 && woodNeeded === 0) || game.global.totalHeliumEarned > 50000)){ //only buy if we dont need metal for upgrades
                    var ratio = (game.resources.metal.owned - metalNeeded) / (game.resources.metal.owned * 2)
                    var howMany = calculateMaxAfford(game.equipment[equipName], false, true, false, false, ratio); //20% of available resources
                    game.global.buyAmt = Math.min(25, howMany);
                    buyEquipment(equipName, null, true);
                    evalObjAT[equipName] = evaluateEquipmentEfficiency(equipName);
                    boughtSomething = true; 
                }
            }
            //Always LVL 25:
            if (!buyDamage && BuyArmorLevels && (DaThing.Stat == 'health') && game.equipment[equipName].level < 25){
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(equipName, null, null, true) && ((metalNeeded === 0 && woodNeeded === 0)  || game.global.totalHeliumEarned > 50000)) {
                    var ratio = (game.resources.metal.owned - metalNeeded) / (game.resources.metal.owned * 10)
                    var howMany = calculateMaxAfford(game.equipment[equipName], false, true, false, false, ratio); //1% of available resources
                    game.global.buyAmt = Math.min(24, howMany);
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

function getDamageLoop(dmg, noCrit){
    var dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    var dmgLast = 0;
    var maxLoop = 50;
    var boughtHP = false;
    
    while ((boughtHP || dmgLast != dmgToCheck) && maxLoop-- > 0){
        //if(game.global.soldierHealth < wantedHP && game.global.soldierHealth > 1)
            boughtHP = autoLevelEquipment(false); //buy health only
        
        if (dmgToCheck*8 >= dmg && buyWeaponsMode !== 0) //have enough damage and we arent trying to lower damage
            return true;
        
        dmgLast = dmgToCheck;
        autoLevelEquipment(true); //buy damage only autoLevelEquipment(buyDamage, colorStyle)
        dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    }
    if (dmgToCheck*8 >= dmg) //have enough damage
        return true;
    else
        return false;
}

function getDamage(dmg, lowerDamage, noCrit){
    var dmgToCheck = dmgToCompare(wantGoodShield, noCrit);
    
    if (baseDamageHigh < 0 || game.global.soldierCurrentAttack < 0) {
        debug("error: getDamage: damage " + game.global.soldierCurrentAttack + " " + baseDamageHigh);
        if (baseDamageHigh < 0 || game.global.soldierCurrentAttack < 0)
            return false;
    }
    else if(baseDamageHigh === 0){
        calcBaseDamageinB();
        if(baseDamageHigh === 0)
            debug("error: baseDamageHigh is zero. Buying damage.");
    }
    
    if(lowerDamage)
        buyWeaponsMode = 0;
    else
        buyWeaponsMode = 4;
    
    if(game.global.runningChallengeSquared)
        buyWeaponsMode = 3;    
    
    //if (dmgToCheck*8 < dmg && !game.global.spireActive && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp")
    //    buyWeaponsMode = 3;
    
    if(getDamageLoop(dmg, noCrit))
        return true;
    
    buyWeaponsMode = 2; //allow buying equipment levels but not prestige
    if(getDamageLoop(dmg, noCrit))
        return true;
    
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
    if(getDamageLoop(dmg, noCrit))
        return true;
    
    return false;
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
    
    if (getPageSetting('AutoStance') > 1 || game.global.runningChallengeSquared) //2 - DE mode 3 - push mode
        holdingBack = getDamage(Number.MAX_VALUE, lowerDamage, noCrit); //buy max damage
    else
        holdingBack = getDamage(dmg, lowerDamage, noCrit);
    
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
function calcEnemyDamage(){
    //calculate the attack of cell 99 current zone enemy
    var enemyDamage = calcEnemyAttack(game.global.gridArray[99].mutation, game.global.gridArray[99].corrupted, game.global.gridArray[99].name, 99,  game.global.world, true);
    
    var safetyNet = 2.65;
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    
    if(!game.global.preMapsActive && (cell.corrupted == "corruptBleed" || cell.corrupted == "healthyBleed"))
        safetyNet = 3.65;
    
    wantedHP = safetyNet*enemyDamage;
}
/* 4 main functions:
 * player damage
 * player health
 * each handles 2 cases: current game and a calculation of next potential game (called by auto allocate)
 * 
 * enemy damage
 * enemy health
 * these are always invoked on a future enemy, either later in current zone or in future game. our current enemy we can just pull his numbers live.
 * 
 */

function calcArmyDamage(printout, currentGame, zone, dailyObj, armySizeUncapped, battleGUBonus, amalgamators, gearDamage, sharpBonusMult){
    if(typeof zone === 'undefined') zone = game.global.world;
    var dmg = 6;
    if (printout) debug("base damage:" + dmg);
    
    //equipment
    if(currentGame){
        var equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var attackBonus = game.equipment[equipmentList[i]].attackCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            dmg += attackBonus*level;
        }
    }
    else dmg += gearDamage;
    if (printout) debug("damage after gear: " + dmg.toExponential(2));
    
    //soldiers
    var soldiers = currentGame ? game.resources.trimps.maxSoldiers : armySizeUncapped;
    dmg *= soldiers;
    if (printout) debug("max soldiers " + soldiers.toExponential(2) + " dmg " + dmg.toExponential(2));
    
    //achievements
    var achievements = 1 + (game.global.achievementBonus / 100);
    dmg *= achievements;
    if (printout) debug("achievements " + achievements + " dmg " + dmg.toExponential(2));
    
    //power 1 and 2
    var power1level = currentGame ? game.portal.Power.level    : AutoPerks.perksByName.Power.level;
    var power2level = currentGame ? game.portal.Power_II.level : AutoPerks.perksByName.Power_II.level;
    if (power1level > 0) {
        var power = power1level * game.portal.Power.modifier;
        dmg *= 1 + power;
        if (printout) debug("power " + power + " dmg" + dmg.toExponential(2));
    }
    if (power2level > 0) {
        var power2 = power2level * game.portal.Power_II.modifier;
        dmg *= 1 + power2;
        if (printout) debug("power2 " + power2 + " dmg" + dmg.toExponential(2));
    }
    
    var antiStacks = currentGame ? game.global.antiStacks : AutoPerks.AntiStacks;
    if (antiStacks > 0) {
        var anticipationLevel = currentGame ? game.portal.Anticipation.level : AutoPerks.perksByName.Anticipation.level;
        var anti = 1 + antiStacks * anticipationLevel * game.portal.Anticipation.modifier;
        dmg *= anti;
        if (printout) debug("anti " + anti + " dmg " + dmg.toExponential(2));
    }
    var formation = currentGame ? game.global.formation : 2;
    if (formation !== 0){
        var form = formation == 2 ? 4 : 0.5;
        dmg *= form;
        if (printout) debug("formation " + form + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && game.global.titimpLeft > 1 && game.global.mapsActive){
        dmg *= 2;
        if (printout) debug("titimpbonus " + "2" + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && !game.global.mapsActive && game.global.mapBonus > 0){
        var mapbonus = ((game.global.mapBonus * .2) + 1);
        dmg *= mapbonus;
        if (printout) debug("mapbonus " + mapbonus.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.roboTrimpLevel > 0){
        var robo = ((0.2 * game.global.roboTrimpLevel) + 1);
        dmg *= robo;
        if (printout) debug("robo " + robo.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    
    var shield = highATK;
    dmg *= shield;
    if (printout) debug("shield " + shield.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    var battle = currentGame ? game.goldenUpgrades.Battle.currentBonus + 1: battleGUBonus;
    if (battle > 1){
        dmg *= battle;
        if (printout) debug("battle "  + battle.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && game.talents.voidPower.purchased && game.global.voidBuff){
        var vpAmt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        dmg *= ((vpAmt / 100) + 1);
        if (printout) debug("void power " + ((vpAmt / 100) + 1).toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && isScryhardActive()){
        dmg *= 2;
        if (printout) debug("scryhard1 " + "2" + " dmg " + dmg.toExponential(2));
    }
    var challengeName = currentGame ? game.global.challengeActive : AutoPerks.ChallengeName;
    if (game.talents.daily.purchased && challengeName == "Daily"){
        dmg *= 1.5;
        if (printout) debug("legs for days " + "1.5" + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && game.talents.magmamancer.purchased){
        var magmamancers = game.jobs.Magmamancer.getBonusPercent();
        dmg *= magmamancers;
        if (printout) debug("magmamancers " + magmamancers.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.stillRowing2.purchased){
        var rows = currentGame ? game.global.spireRows : 10*Math.floor((zone-100)/100);
        var rowing = 1 + rows * 0.06;
        dmg *= rowing;
        if (printout) debug("rowing " + rowing + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.healthStrength.purchased){
        var healthyCount = currentGame ? mutations.Healthy.cellCount() : (zone > 300 ? 2 + Math.floor((zone - 300)/15) : 0);
        var str = 1 + healthyCount * 0.15;
        dmg *= str;
        if (printout) debug("strength in health " + str.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    
    //Sugar Rush
    if(game.global.sugarRush > 0 || (!currentGame && sugarEventAT)){ //remaining time on sugar rush
        var sugar = 2 + Math.floor((zone - 200) / 100);
         dmg *= Math.max(1,sugar);
         if(printout) debug("sugar rush x" + sugar + " dmg " + dmg.toExponential(2));
    }
    
    if (currentGame && game.global.mapsActive && game.talents.bionic2.purchased && currMap.level > zone){
        dmg *= 1.5;
        if (printout) debug("Bionic Magnet II + 50% dmg " + dmg.toExponential(2));
    }
    
    if (zone >= 230){
        var magMult = Math.pow(0.8, zone-230+1);
        dmg *= magMult;
        if (printout) debug("magma " + magMult.toExponential(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.totalSquaredReward > 0){
        var sqr = ((game.global.totalSquaredReward / 100) + 1);
        dmg *= sqr;
        if (printout) debug("sqr " + sqr + " dmg " + dmg.toExponential(2));
    }
    if (currentGame && getEmpowerment() == "Ice"){
        var ice = 1 + (1 - game.empowerments.Ice.getCombatModifier());
        dmg *= ice;
        if (printout) debug("ice " + ice.toExponential(2) + " dmg " + dmg.toExponential(2));
    }
    if (Fluffy.isActive()){
        var fluff = lastFluffDmg;
        dmg *= fluff;
        if (printout) debug("fluffy " + fluff.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    var amalCount = currentGame ? game.jobs.Amalgamator.owned : amalgamators;
    if (amalCount > 0){
        var amal = game.talents.amalg.purchased ? Math.pow(1.5, amalCount) : 1 + 0.5*amalCount;
        dmg *= amal;
        if (printout) debug("amal " + amal + " dmg " + dmg.toExponential(2));
    }
    var sharp = currentGame ? (game.singleRunBonuses.sharpTrimps.owned ? 1.5 : 1) : sharpBonusMult;
    if (sharp > 1){
        dmg *= sharp;
        if (printout) debug("sharp " + sharp + " dmg " + dmg.toExponential(2));
    }
    
    var min = 1;
    var max = 1.2;
       
    //if we are currently in a damily with crit chance up/down, and are in portal screen, dont include those in the calculation
    var currCritUp   = typeof game.global.dailyChallenge.trimpCritChanceUp   != 'undefined' ? dailyModifiers.trimpCritChanceUp.getMult(game.global.dailyChallenge.trimpCritChanceUp.strength) : 0;
    var currCritDown = typeof game.global.dailyChallenge.trimpCritChanceDown != 'undefined' ? dailyModifiers.trimpCritChanceDown.getMult(game.global.dailyChallenge.trimpCritChanceDown.strength) : 0;
    var currDailyToNewPortalMod = (currentGame ? 0 : - currCritUp + currCritDown);
    
    var lowCritChanceTmp  = lowCritChance  + currDailyToNewPortalMod;
    var highCritChanceTmp = highCritChance + currDailyToNewPortalMod;
    
    if (challengeName == "Daily"){
        var theDailyObj = currentGame ? game.global.dailyChallenge : dailyObj;
        if (typeof theDailyObj.weakness !== 'undefined'){
            var weak = 1;
            if(currentGame) 
                weak = dailyModifiers.weakness.getMult(theDailyObj.weakness.strength, theDailyObj.weakness.stacks);
            else
                weak = 1 - theDailyObj.weakness.stacks * 0.09; //9 stacks, capped
            
            dmg *= weak;
            if (printout) debug("daily weak " + weak.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof theDailyObj.oddTrimpNerf !== 'undefined' && ((zone % 2) == 1)){
            var nerf = dailyModifiers.oddTrimpNerf.getMult(theDailyObj.oddTrimpNerf.strength);
            dmg *= nerf;
            if (printout) debug("daily nerf " + nerf.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof theDailyObj.evenTrimpBuff !== 'undefined' && ((zone % 2) == 0)){
            var buff = dailyModifiers.evenTrimpBuff.getMult(theDailyObj.evenTrimpBuff.strength);
            dmg *= buff;
            if (printout) debug("daily buff " + buff.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof theDailyObj.rampage !== 'undefined'){
            var stacks = currentGame ? theDailyObj.rampage.stacks : dailyModifiers.rampage.getMaxStacks(theDailyObj.rampage.strength);
            var ramp = dailyModifiers.rampage.getMult(theDailyObj.rampage.strength, stacks);
            dmg *= ramp;
            if (printout) debug("daily ramp " + ramp.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof theDailyObj.minDamage !== 'undefined'){
            min = 1 - dailyModifiers.minDamage.getMult(theDailyObj.minDamage.strength);
            if (printout) debug("daily min " + min.toFixed(2));
        }
        if (typeof theDailyObj.maxDamage !== 'undefined'){   
            max = 1.2 + dailyModifiers.maxDamage.getMult(theDailyObj.maxDamage.strength);
            if (printout) debug("daily max " + max.toFixed(2));
        }
        if (typeof theDailyObj.trimpCritChanceUp !== 'undefined'){   
            var delta = dailyModifiers.trimpCritChanceUp.getMult(theDailyObj.trimpCritChanceUp.strength);
            lowCritChanceTmp  += delta;
            highCritChanceTmp += delta;
            if (printout) debug("daily +"+delta+" crit");
        }
        if (typeof theDailyObj.trimpCritChanceDown !== 'undefined'){   
            var delta = dailyModifiers.trimpCritChanceDown.getMult(theDailyObj.trimpCritChanceDown.strength);
            lowCritChanceTmp  -= delta;
            highCritChanceTmp -= delta;
            if (printout) debug("daily -"+delta+" crit");
        } 
    }
    
    var baseModifier = currentGame ? formationToBModifier() : 1; //current game only, we want all damage expressed in B stance
    dmg *= baseModifier;
    if(currentGame && printout) debug("x"+baseModifier+ " multiplier to B stance. new damage: " + dmg.toExponential(2));
    
    var dmgLow = dmg / highATK * lowATK;
    
    //calculate unlucky non crit and lucky crit only versions of the damages for each of the shields
    var lowNoCritTmp    = dmgLow * ATgetPlayerCritDamageMult(Math.floor(lowCritChanceTmp),  lowCritDamage);
    var lowCritOnlyTmp  = dmgLow * ATgetPlayerCritDamageMult( Math.ceil(lowCritChanceTmp),  lowCritDamage);
    var highNoCritTmp   = dmg    * ATgetPlayerCritDamageMult(Math.floor(highCritChanceTmp), highCritDamage);
    var highCritOnlyTmp = dmg    * ATgetPlayerCritDamageMult( Math.ceil(highCritChanceTmp), highCritDamage);
    
    lowNoCritTmp  *= min;
    highNoCritTmp *= min;
    
    var avgRange = (max + min) / 2;
    
    //calculate average damage
    var critMultLow  = calcCritModifier(lowCritChanceTmp, lowCritDamage);
    var critMultHigh = calcCritModifier(highCritChanceTmp, highCritDamage);
    dmgLow *= critMultLow;
    dmg    *= critMultHigh;
    if (printout) debug ("critchance " + highCritChanceTmp + " critMult " + highCritDamage + " final " + critMultHigh.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    dmgLow *= avgRange;
    dmg    *= avgRange;
    if (printout) debug("avgRange " + avgRange.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    if(currentGame){ //save values for use
        baseDamageLowNoCrit     = lowNoCritTmp;
        baseDamageLowCritOnly   = lowCritOnlyTmp;
        baseDamageHighNoCrit    = highNoCritTmp;
        baseDamageHighCritOnly  = highCritOnlyTmp;

        baseDamageLow  = dmgLow;
        baseDamageHigh = dmg;
        goodBadShieldRatio = baseDamageHigh / baseDamageLow;
    }
    if(isNaN(dmg)) throw "calcArmyDamage error: dmg is NaN";
    
    return dmg;
}

function corruptHealthyStatScaleAT(base, zone){
    var scales = Math.floor((zone - 150) / 6);
    base *= Math.pow(1.05, scales);
    return base;
}

//health if we send a new army right this moment, or used by auto allocate for next game
function calcCurrSendHealth(currentGame, getNurseCount, printout, zone, dailyObj, armySizeUncapped, battleGUBonus, amalgamators, gearHealth, breedMult){
    var base = 50;
    if(printout) debug("base health: " + base);
        
    if(currentGame){
        var equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var healthBonus = game.equipment[equipmentList[i]].healthCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            base += healthBonus*level;
        }
    }
    else base += gearHealth;// / AutoPerks.gearLevels * 25;
    if(printout) debug("after gear: " + base.toExponential(2));
    
    var soldiers = currentGame ? game.resources.trimps.maxSoldiers : armySizeUncapped;
    base *= soldiers;
    if(printout) debug("soldiers: " + soldiers.toExponential(2) + " after: " + base.toExponential(2));
    
    var battle = currentGame ? game.goldenUpgrades.Battle.currentBonus + 1: battleGUBonus;
    if (battle > 1) {
        base *= battle;
        if(printout) debug("battle: " + battle.toExponential(2) + " after: " + base.toExponential(2));
    }
    
    var resilPerk      = currentGame ? game.portal["Resilience"]   : AutoPerks.perksByName.Resilience;
    var toughness1Perk = currentGame ? game.portal["Toughness"]    : AutoPerks.perksByName.Toughness;
    var toughness2Perk = currentGame ? game.portal["Toughness_II"] : AutoPerks.perksByName.Toughness_II;
    
    base *= (1 + 0.05*toughness1Perk.level) * (1 + 0.01*toughness2Perk.level)*Math.pow(1.1, resilPerk.level);
    if(printout) debug("after toughness1/2/resil: " + base.toExponential(2));
    
    var formation = 0.5;
    base *= formation;
    if(printout) debug("formation: " + formation + " after: " + base.toExponential(2));
    
    if(zone >= 230){
        var magMult = Math.pow(0.8, zone-229);
        base *= magMult;
        if(printout) debug("magMult: " + magMult.toExponential(2) + " after: " + base.toExponential(2));
    }
    
    if (game.global.totalSquaredReward > 0){
        var sqr = 1 + game.global.totalSquaredReward / 100;
        base *= sqr;
        if(printout) debug("sqr: " + sqr.toExponential(2) + " after: " + base.toExponential(2));
    }
    
    var amalCount = currentGame ? game.jobs.Amalgamator.owned : amalgamators;
    if (amalCount > 0){
        var amal = Math.pow(40, amalCount);
        base *= amal;
        if(printout) debug("amal: " + amal.toExponential(2) + " after: " + base.toExponential(2));
    }
    
    //current run health affects from dailies are here. some health effects for future dailies are built in to the variables passed over to us by Auto Allocate.
    var challengeName = currentGame ? game.global.challengeActive : AutoPerks.ChallengeName;
    if (challengeName == "Daily"){
        var theDailyObj = currentGame ? game.global.dailyChallenge : dailyObj;
        
        if(typeof theDailyObj.pressure !== 'undefined'){
            var stacks = currentGame ? theDailyObj.pressure.stacks : 600/dailyModifiers.pressure.timePerStack(theDailyObj.pressure.strength);
            var pressure = dailyModifiers.pressure.getMult(theDailyObj.pressure.strength, stacks);
            base *= pressure;
        }  
    }
    
    //geneticists bonus
    if(getNurseCount){ //we want to calculate how many nurseries are needed to match damage of cell 99
        //calcCurrSendHealth(true, true, false, game.global.world)
        
        if(worldArray.length < 100) return 0;
        var armySize = game.portal.Coordinated.currentSend * Math.pow(1000, game.jobs.Amalgamator.owned);
        var breed =   0.0085        //how many trimps are bred each second before geneticists.
                * trimpsRealMax/2
                * Math.pow(1.1, game.upgrades.Potency.done)//Math.pow(1.1, Math.floor(zone / 5))
                * Math.pow(1.003, game.unlocks.impCount.Venimp)
                * 0.1           //broken planet
                * (1 + 0.1*game.portal["Pheromones"].level);
                
                //* Math.pow(1.01, nurseries)
                //* AutoPerks.DailyBreedingMult; //toxic daily modifier
        
        var desiredBreedRate = (armySize / 45) / breed; //breed per sec
        var geneticists = Math.floor(Math.log(desiredBreedRate) / Math.log(0.98)); //geneticists amount
        //debug(geneticists);
        var damage = 1.5*worldArray[98].attack * 0.15; //cell 98 damage*15% pierces block
        var health = base*Math.pow(1.01, geneticists); //our health
        var genNeeded = Math.floor(Math.log(damage/health) / Math.log(1.01));
        var genDiff = Math.max(0,genNeeded);
        var nurseNeeded = Math.ceil(genDiff * Math.log(1.02) / Math.log(1.01));
        //debug("health:" + health.toExponential(2) + " attack:" + damage.toExponential(2) + " genNeeded:" + genNeeded + " nurseNeeded:" + nurseNeeded + " genDiff:"+genDiff);
        return nurseNeeded;
    }
    else{
        base *= currentGame ? (game.global.breedBack > 0 ? 1 : Math.pow(1.01, game.global.lowestGen)) : breedMult; //breedMult includes 1/5 max nurseries built
        if(printout) debug("after geneticists: " + base.toExponential(2));

        return base;
    }
}

//helper functions to check our accuracy
function currEnemyDamage(){
    //if(game.global.mapsActive || game.global.preMapsActive) return;
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var ret = game.global.mapsActive ? currMap.difficulty * calcEnemyAttack(cell.mutation, cell.corrupted, cell.name, cellNum, currMap.level, true) : calcEnemyAttack(cell.mutation, cell.corrupted, cell.name, cellNum, game.global.world, true);

    return ret.toExponential(2);
}

function currEnemyHealth(){
    //if(game.global.mapsActive || game.global.preMapsActive) return;
    if(game.global.mapsActive) mapMult = currMap.difficulty;
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    
    var ret = game.global.mapsActive ? currMap.difficulty * calcEnemyHealth(cell.mutation, cell.corrupted, cell.name, cellNum, currMap.level, true) : calcEnemyHealth(cell.mutation, cell.corrupted, cell.name, cellNum, game.global.world, true);
    return ret.toExponential(2);
}

function calcEnemyAttack(mutation, corrupted, name, level, zone, currentGame, dailyObj){
    var isSpire = false;
    if(currentGame && game.global.spireActive) isSpire = true;
    else if (zone !== game.global.world && zone >= 200 && zone % 100 === 0) isSpire = true;
    
    var atkScale = 1;
    if(mutation == "Healthy") atkScale = corruptHealthyStatScaleAT(5, zone);
    else if(mutation == "Corruption" || level == 99) atkScale = corruptHealthyStatScaleAT(3, zone);
    
    var ignoreImpStats = isSpire || mutation == "Corruption" || mutation == "Healthy";
    var attack = isSpire ? getSpireStatsAT(zone, level+1, name, "attack")*1.2 : getEnemyAttackAT(zone, level+1, name, ignoreImpStats) * atkScale * 1.2; //1.2 for max damage (hopefully)
    
    if (corrupted == "corruptStrong") attack *= 2; 
    if (corrupted == "healthyStrong") attack *= 2.5;
    
    if (currentGame && getEmpowerment() == "Ice") //chilled
        attack *= game.empowerments.Ice.getCombatModifier();
    
    var challenge = currentGame ? game.global.challengeActive : AutoPerks.ChallengeName;
    if (challenge != ""){
        if (challenge == "Obliterated")         attack *= currentGame ? oblitMultAT : AutoPerks.OblitMod;
        else if (challenge == "Coordinate")     attack *= currentGame ? coordMultAT : AutoPerks.CoordMod;
        else if (challenge == "Life")           attack *= 6;
        else if (challenge == "Toxicity")       attack *= 5;
        else if (challenge == "Balance")        attack *= (game.global.mapsActive) ? 2.35 : 1.17;
        else if (challenge == "Meditate")       attack *= 1.5;
        else if (challenge == 'Lead')           attack *= 2.5;
        else if (challenge == "Watch")          attack *= 1.25;
        else if (challenge == "Scientist" && getScientistLevel() == 5) attack *= 10;
        
        else if (challenge == "Daily"){
            var theDailyObj = currentGame ? game.global.dailyChallenge : dailyObj;
            if (typeof theDailyObj.badStrength !== 'undefined')
                attack *= dailyModifiers.badStrength.getMult(theDailyObj.badStrength.strength);
            
            if (typeof theDailyObj.crits !== 'undefined'){
                var critMult = dailyModifiers.crits.getMult(theDailyObj.crits.strength);
                attack *= 1 + 0.25 * critMult;
            }
                            
            if (typeof theDailyObj.badMapStrength !== 'undefined' && game.global.mapsActive)
              attack *= dailyModifiers.badMapStrength.getMult(theDailyObj.badMapStrength.strength);
            
            if(currentGame){
                if (typeof theDailyObj.empower !== 'undefined' && !game.global.mapsActive)
                    attack *= dailyModifiers.empower.getMult(theDailyObj.empower.strength, theDailyObj.empower.stacks);
                
                if (typeof theDailyObj.bloodthirst !== 'undefined')
                    attack *= dailyModifiers.bloodthirst.getMult(theDailyObj.bloodthirst.strength, theDailyObj.bloodthirst.stacks);
            }
            
            if (typeof theDailyObj.mirrored !== 'undefined'){
                var ourDamage = currentGame ? calcArmyDamage(false, true, game.global.world) : calcArmyDamage(false, false, zone, AutoPerks.dailyObj, AutoPerks.fullSoldiers, AutoPerks.battleGUMult, AutoPerks.currAmalgamators, AutoPerks.equipmentAttack, AutoPerks.sharpBonusMult);
                attack += ourDamage * dailyModifiers.mirrored.getMult(theDailyObj.mirrored.strength) * (1 + dailyModifiers.mirrored.getReflectChance(theDailyObj.mirrored.strength));
            }
        }
    }
    //debug(attack.toExponential(2));
    return attack;
}

function calcEnemyHealth(mutation, corrupted, name, level, zone, currentGame, dailyObj){
    var isSpire = false;
    if(currentGame && game.global.spireActive) isSpire = true;
    else if (zone !== game.global.world && zone >= 200 && zone % 100 === 0) isSpire = true;
    
    var healthScale = 1;
    if(mutation == "Healthy") healthScale = corruptHealthyStatScaleAT(14, zone);
    else if(mutation == "Corruption" || level == 99) healthScale = corruptHealthyStatScaleAT(10, zone);

    var ignoreImpStats = isSpire || mutation == "Corruption" || mutation == "Healthy";
    var amt = isSpire ? getSpireStatsAT(zone, level+1, name, "health") : getEnemyHealthAT(zone, level+1, name, ignoreImpStats) * healthScale;
    
    if (corrupted == "corruptTough")         amt *= 5;
    else if (corrupted == "healthyTough")    amt *= 7.5;
    
    var challenge = currentGame ? game.global.challengeActive : AutoPerks.ChallengeName;
    if (challenge !== ""){
        if (challenge == "Obliterated")         amt *= currentGame ? oblitMultAT : AutoPerks.OblitMod;
        else if (challenge == "Coordinate")     amt *= currentGame ? coordMultAT : AutoPerks.CoordMod;
        else if (challenge == "Toxicity")       amt *= 2;
        
        if(challenge == "Daily"){
            var theDailyObj   = currentGame ? game.global.dailyChallenge : dailyObj;
            if(typeof theDailyObj.badHealth !== 'undefined')
                amt *= dailyModifiers.badHealth.getMult(theDailyObj.badHealth.strength);
            
            if (typeof theDailyObj.badMapHealth !== 'undefined' && game.global.mapsActive)
                amt *= dailyModifiers.badMapHealth.getMult(theDailyObj.badMapHealth.strength);

            if(currentGame){
                if(typeof theDailyObj.empower !== 'undefined')
                    amt *= dailyModifiers.empower.getMult(theDailyObj.empower.strength, theDailyObj.empower.stacks);
            }
        }
    }
    
    return Math.floor(amt);
}

function getSpireStatsAT(zone, cellNum, name, what){
    var base = (what == "attack") ? getEnemyAttackAT(zone, 100, null, true) : (getEnemyHealthAT(zone, 100, null, true) * 2);
    var mod = (what == "attack") ? 1.17 : 1.14;
    //var spireNum = checkIfSpireWorld(true);
    var spireNum = Math.floor((zone-100)/100);
    if (spireNum > 1){
        var modRaiser = 0;
        modRaiser += ((spireNum - 1) / 100);
        if (what == "attack") modRaiser *= 8;
        if (what == "health") modRaiser *= 2;
        mod += modRaiser;
    }
    base *= Math.pow(mod, cellNum);
    base *= game.badGuys[name][what];
    return base;
}

function getEnemyHealthAT(zone, level, name, ignoreImpStat){
    var world = zone;
    var amt = 0;
    amt += 130 * Math.sqrt(world) * Math.pow(3.265, world / 2);
    amt -= 110;
    if (world == 1 || world == 2 && level < 10){
        amt *= 0.6;
        amt = (amt * 0.25) + ((amt * 0.72) * (level / 100));
    }
    else if (world < 60)
        amt = (amt * 0.4) + ((amt * 0.4) * (level / 110));
    else{
        amt = (amt * 0.5) + ((amt * 0.8) * (level / 100));
        amt *= Math.pow(1.1, world - 59);
    }
    if (world < 60) amt *= 0.75;
    if (!ignoreImpStat)
        amt *= game.badGuys[name].health;
    
    return amt;
}

//helper function copied from game, allowing us to input a zone.
function getEnemyAttackAT(zone, level, name, ignoreImpStat){
    var amt = 0;
    var world = zone;
    amt += 50 * Math.sqrt(world) * Math.pow(3.27, world / 2);
    amt -= 10;
    if (world == 1){
        amt *= 0.35;
        amt = (amt * 0.20) + ((amt * 0.75) * (level / 100));
    }
    else if (world == 2){
        amt *= 0.5;
        amt = (amt * 0.32) + ((amt * 0.68) * (level / 100));
    }
    else if (world < 60)
        amt = (amt * 0.375) + ((amt * 0.7) * (level / 100));
    else{
        amt = (amt * 0.4) + ((amt * 0.9) * (level / 100));
        amt *= Math.pow(1.15, world - 59);
    }
    if (world < 60) amt *= 0.85;
    //if (world > 6 && game.global.mapsActive) amt *= 1.1;
    if (!ignoreImpStat)
        amt *= game.badGuys[name].attack;
    return Math.floor(amt);
}

function dmgNeededToOK(cellNum){
    if(game.global.mapsActive){ //we dont generate map grid
        debug("error: dmgNeededToOK in map");
        return -1;
    }
    var requiredDmgToOK = dmgNeededToOKHelper(cellNum, game.global.gridArray[cellNum].health); //how much dmg we need to fully OK on this attack
    var requiredDmgToOKNext = 1; //calculate damage to OK next attack. this number is more important since our damage on current attack is mostly locked, we need to predict the next attack/cell
    var maxOverkillCells = 1 + Fluffy.isRewardActive("overkiller") + (game.talents.overkill.purchased ? 1 : 0);
    for (var i = maxOverkillCells; i >= 1; i--){
        if(cellNum + i >= 100)
            continue;
        var tmp = dmgNeededToOKHelper(cellNum+i, worldArray[cellNum+i].maxHealth);
        if (tmp > requiredDmgToOKNext)
            requiredDmgToOKNext = tmp;
    }
    
    return Math.max(requiredDmgToOK, requiredDmgToOKNext);
}

//calculates how much dmg we need to fully overkill starting on cellNum which has HP health remaining
function dmgNeededToOKHelper(cellNum, HP){
    var overkillCells = 1 + Fluffy.isRewardActive("overkiller") + (game.talents.overkill.purchased ? 1 : 0); //0 / 1 / 2
    var overkillPercent = game.portal.Overkill.level * 0.005;
    var requiredDmgToOK = 0;
    var maxCells = (game.global.mapsActive) ? game.global.mapGridArray.length : 100;
    for(var i = overkillCells; i>=1; i--){
        if(cellNum + i >= maxCells)
            continue;
        if(game.global.mapsActive)
            requiredDmgToOK += game.global.mapGridArray[0].maxHealth; //TODO actually build maparray?
        else
        requiredDmgToOK += worldArray[cellNum + i].maxHealth;
        requiredDmgToOK = requiredDmgToOK / overkillPercent;
    }
    requiredDmgToOK += HP;
    if(poisonZone())
        requiredDmgToOK -= Math.min(game.empowerments.Poison.currentDebuffPower, HP);
    
    return requiredDmgToOK;
}

function aboutToDie(){
    if(game.global.mapsActive){ //we dont generate map grid
        debug("error: aboutToDie in map");
        return false;
    }
    var cellNum = game.global.lastClearedCell + 1;
    
    var enemyAttack = game.global.gridArray[cellNum].attack * dailyModifiers.empower.getMult(game.global.dailyChallenge.empower.strength, game.global.dailyChallenge.empower.stacks);
    var ourHP = game.global.soldierHealth;

    if (getEmpowerment() == "Ice")
        enemyAttack *= game.empowerments.Ice.getCombatModifier();

    var baseBlock = game.global.soldierCurrentBlock;
    if (game.global.formation == 3) baseBlock /= 4; //B stance
    else if (game.global.formation != "0") baseBlock *= 2;
    
    if(baseBlock > game.global.gridArray[cellNum].attack)
        enemyAttack *= getPierceAmt();
    else
        enemyAttack -= baseBlock*(1 - getPierceAmt());

    if(game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.crits !== 'undefined')
        enemyAttack *= dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength);
    
    if (typeof game.global.dailyChallenge.bogged != 'undefined') //fixed %dmg taken every attack
        ourHP -= game.global.soldierHealthMax * dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
    
    if (typeof game.global.dailyChallenge.plague != 'undefined')
        ourHP -= game.global.soldierHealthMax * dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, game.global.dailyChallenge.plague.stacks);
                 
    if(game.global.challengeActive == "Electricity") //%dmg taken per stack, 1 stack every attack
        ourHP -= game.global.soldierHealth -= game.global.soldierHealthMax * (game.challenges.Electricity.stacks * 0.1);

    if (game.global.gridArray[cellNum].corrupted == "corruptCrit")
        enemyAttack *= 5;
    else if (game.global.gridArray[cellNum].corrupted == "healthyCrit")
        enemyAttack *= 7;
    else if (game.global.gridArray[cellNum].corrupted == "corruptBleed")
        ourHP *= 0.8;
    else if (game.global.gridArray[cellNum].corrupted == "healthyBleed")
        ourHP *= 0.7;
    
    ourHP -= enemyAttack;

    if (ourHP <= 1000)
        return true;
    else
        return false;
}

function checkForGoodCell(cellNum){
    var foundGoodFlag = false;
    for(var i = cellNum; i < cellNum+10; i++){
        if(i > 99)
            break;
        if(worldArray[i].finalWorth > 1){
            foundGoodFlag = true;
            break;
        }
    }
    return foundGoodFlag;
}

function isScryhardActive(){
    return isScryerBonusActive() && game.talents.scry.purchased && !game.global.mapsActive && (getCurrentWorldCell().mutation == "Corruption" || getCurrentWorldCell().mutation == "Healthy");
}

function timeEstimator(currentGame, fromCell, zone, dailyObj, toText){
    var totalHP = 0;
    var time = 0;
    
    var stanceMult = zone > 70 ? 8 : 4; //D stance unlocked
    var dmgToUse = currentGame ? baseDamageHigh*stanceMult : calcArmyDamage(false, false, zone, AutoPerks.dailyObj, AutoPerks.fullSoldiers, AutoPerks.battleGUMult, AutoPerks.currAmalgamators, AutoPerks.equipmentAttack, AutoPerks.sharpBonusMult);
    
    if(currentGame && game.global.antiStacks !== handleGA(true)) //if dont have max anti stacks, force them to
        dmgToUse = dmgToUse * (1 + 0.2*handleGA(true)) / (1 + 0.2*game.global.antiStacks);
    
    dmgToUse *= 4; //~4 attacks a second
    
    var isPoison = poisonZone(zone); //TODO: implement poison

    if(currentGame) totalHP = sumCurrZoneHP(fromCell);
    else            totalHP = approxZoneHP(zone);
    
    if (typeof dailyObj.slippery !== 'undefined') //dodge daily
        totalHP = totalHP / (1+dailyModifiers.slippery.getMult(dailyObj.slippery.strength));

    var damageDone = 0;
    if(totalHP / dmgToUse > 200){ //if longer than 200s, get max map bonus
        time = 200;
        damageDone += 200 * dmgToUse; //rough estimate of running 10 -3 FA maps 40s maps, 90s zone 270s prezone
        dmgToUse *= 3;
        time + (totalHP - damageDone) / dmgToUse;
    }
    else {
        time = totalHP / dmgToUse;
        damageDone = totalHP;
    }
    
    if((time + (totalHP - damageDone) / dmgToUse) > 300){ //magmanmancer bonus kicks in
        damageDone -= 300 * dmgToUse;
        var magmamancerStacks = 0;
        var magmaDmgMult = 1;
        var time = -300;
        var sugarRemoved = false;
        do{
            if(sugarEventAT && time >= 1500 && !sugarRemoved){
                dmgToUse = dmgToUse / Math.max(1,(2 + Math.floor((zone - 200) / 100))); //if zone lasts >25m we lose the damage buff
                sugarRemoved = true;
            }
            if(magmamancerStacks > 12) break;
            magmaDmgMult = zone >= 230 ? getBonusPercentAT(false, magmamancerStacks) : 1;
            magmamancerStacks++;
            damageDone += 600 * dmgToUse * magmaDmgMult;
            time += 600;
        } while(damageDone < totalHP);
        if(damageDone < totalHP) time += (totalHP - damageDone) / (dmgToUse * magmaDmgMult);
        else{
            damageDone -= 600 * dmgToUse * magmaDmgMult;
            time += (totalHP - damageDone) / (dmgToUse * magmaDmgMult);
        }
    }
    
    var OC = 1 + Fluffy.isRewardActive("overkiller") + (game.talents.overkill.purchased ? 1 : 0);
    var minTime = Math.ceil(100 / 4 / OC);
    var ret = Math.max(minTime, time);
    
    if(toText){
        if(!isFinite(dmgToUse) || !isFinite(totalHP)) return "Infinity";
        var timeText = "";
        if(ret < 60) timeText = Math.floor(ret) + "s";
        else if (ret < 3600)  timeText = Math.floor(ret/60) + "m" + Math.floor(ret % 60) + "s";
        else if (ret < 86400) timeText = Math.floor(ret / 3600) + "h" + Math.floor((ret % 3600)/60) + "m";
        else if (ret < 3.154e7) timeText = Math.floor(ret / 86400) + "d" + Math.floor((ret % 86400)/3600) + "h";
        else timeText = prettify(Math.floor(ret / 3.154e7)) + "y" + Math.floor((ret % 3.154e7)/86400) + "d";
        return timeText;
    }
    else if(!isFinite(dmgToUse) || !isFinite(totalHP)) return Number.MAX_VALUE;
    else return ret;
}

function getBonusPercentAT(justStacks, forceTime, count){
    var boostMult = 0.9999;
    var boostMax = 3;
    var expInc = 1.2;
    var timeOnZone;
    var howMany = typeof count === 'undefined' ? AutoPerks.magmamancers : count; //TODO: calculate actual magmamancers count based on gems
    if (typeof forceTime === 'undefined'){
        var timeOnZone = getGameTime() - game.global.zoneStarted;
        if (game.talents.magmamancer.purchased) timeOnZone += 300000;
        timeOnZone = Math.floor(timeOnZone / 600000);

        if (timeOnZone > 12) timeOnZone = 12;
        else if (timeOnZone <= 0) return 1;
    }
    else timeOnZone = Math.min(12,forceTime);
    if (justStacks) return timeOnZone;
    return 1 + ((((1 - Math.pow(boostMult, howMany)) * boostMax)) * (Math.pow(expInc, timeOnZone) - 1));
}

function sumCurrZoneHP(fromCell){
    var start = typeof fromCell === 'undefined' ? 0 : fromCell;
    var sum = 0;
    for (var i = start; i < worldArray.length; i++)
        sum += worldArray[i].maxHealth;
    return sum;
}

function approxZoneHP(zoneNum){
    var zone = typeof zoneNum === 'undefined' ? game.global.world : zoneNum;
    var healthyCells = zone > 300 ? 2 + Math.floor((zone - 300)/15): 0;
    
    var corruptionStart = AutoPerks.ChallengeName == "Corrupted" ? 60 : (game.talents.headstart.purchased && !game.global.runningChallengeSquared) ? ((game.talents.headstart2.purchased) ? ((game.talents.headstart3.purchased) ? 151 : 166) : 176) : 181;
    var corruptedCells = zone < corruptionStart ? 0 : Math.max(0, Math.min(80, Math.floor((zone - corruptionStart) / 3) + 2) - healthyCells);
    
    var nonColoredCells = 99 - corruptedCells - healthyCells;
    
    var array = [];
    var corrupteds = [];
    for (var w = 0; w < 100; w++){
            corrupteds.push("");
    }
    //if(healthyCells > 0) corrupteds   = healthyPattern(corrupteds, healthyCells);
    //if(corruptedCells > 0) corrupteds = corruptionPattern(corrupteds, corruptedCells);
    //debug(corrupteds);
    //corruptDbl,corruptCrit,corruptBleed,corruptStrong,corruptTough,corruptDodge,healthyDbl,healthyCrit,healthyBleed, healthyStrong, healthyTough, none
    var corruptMult = (3 + 5 + 1.3) / 6; //1.3 for dodge, 5 for tough
    var healthyMult = (4 + 7.5) / 5; //7.5 for tough
    
    var healthyMid = Math.floor(healthyCells / 2);
    var corruptMid = healthyCells + Math.floor(corruptedCells / 2);
    var emptyMid   = healthyCells + corruptedCells + Math.floor((100 - healthyCells - corruptedCells) / 2);
    
    //debug("healthy " + healthyCells + " corrupt " + corruptedCells);
    var amt = calcEnemyHealth("Healthy",    null, 'Snimp',       healthyMid, zone, false, AutoPerks.dailyObj) * healthyCells   * healthyMult
        +     calcEnemyHealth("Corruption", null, 'Snimp',       corruptMid, zone, false, AutoPerks.dailyObj) * corruptedCells * corruptMult
        +     calcEnemyHealth(null,         null, 'Snimp',       emptyMid, zone, false, AutoPerks.dailyObj) * nonColoredCells
        +     calcEnemyHealth(null,         null, "Omnipotrimp", 99, zone, false, AutoPerks.dailyObj);
    return amt;
}

/*function healthyPattern(currentArray, possible){
    var spread = (Math.floor(possible / 6) + 1) * 10;
    if (spread > 100) spread = 100;
    var corruptions = [];
    for (var x = 0; x < currentArray.length; x++){
            if (currentArray[x] == "Corruption") corruptions.push(x);
            if (corruptions.length >= spread) break;
    }
    var addCorrupteds = getAmountInRange(corruptions.length, possible);
    for (var a = 0; a < currentArray.length; a++){
     currentArray[corruptions[addCorrupteds[a]]] = "Healthy";
    }
    return currentArray;
}

function corruptionPattern(currentArray, possible){
    var spread = (Math.floor(possible / 6) + 1) * 10;
    if (spread > 100) spread = 100;
    var addCorrupteds = getAmountInRange(spread, possible);
    for (var a = 0; a < addCorrupteds.length; a++){
        if (currentArray[addCorrupteds[a]] != "") continue;
        currentArray[addCorrupteds[a]] = "Corruption";
    }
    return currentArray;
}


function buildGridAT(zone) {
    var world = typeof zone === 'undefined' ? game.global.world : zone;


    for (var i = 0; i < 100; i++) {
        var newCell = {
            level: i + 1,
            maxHealth: -1,
            health: -1,
            attack: -1,
            name: "Snimp"//getRandomBadGuy(null, i + 1, 100, world, imports, corrupteds[i], vms[i])
        };
		if (corrupteds[i] != "") {
			newCell.mutation = corrupteds[i];
			if ((typeof mutations[corrupteds[i]].effects !== 'undefined'))
				newCell.corrupted = getSeededRandomFromArray(game.global.mutationSeed++, mutations[corrupteds[i]].effects);
		}
		array.push(newCell);
    }
    return array;
}*/


function getMaxBattleGU(zoneNum){
    var zone = typeof zoneNum === 'undefined' ? game.global.world : zoneNum;
    var howManyGU = countExtraAchievementGoldens(); //starting GUs
    var freq = getGoldenFrequency(getAchievementStrengthLevel());
    var str = 3;
    var totalPct = 0;
    howManyGU += Math.floor(zone / freq);
    for(var i = 0; i < howManyGU; i++){
        totalPct += str;
        str += 3;
    }
    return 1 + totalPct/100;
}

//assumes 60% Void GU from level 1, and 80% VDMC on shield
//numbers from https://grabarz19.github.io/TrimpsVoidCalculator/
function expectedVMsAmount(zoneInput){
    var zone = typeof zoneInput === 'undefined' ? autoTrimpSettings.APValueBoxes.maxZone : zoneInput;
    //round down last poison zone 
    var cycle = cycleZone(zone);
    if(cycle > 19) zone = zone - cycle + 19; 
    else if(cycle > 4 && cycle < 15) zone = zone - cycleZone(zone) + 4;
    
    var total = Math.round(zone * 0.09653);                        //calculated based on z1000 1000 iterations
    total += Fluffy.isRewardActive("voidance")     === 1 ? 4  : 0; //Each Portal, start with two double stacked Void Maps.
    total += Fluffy.isRewardActive("voidelicious") === 1 ? 16 : 0; //Start each Portal with 1 of each uniquely named Void Map (16 total).
    total += game.talents.voidSpecial.purchased ? Math.floor(autoTrimpSettings.APValueBoxes.maxZone / 100) : 0;
    total += game.talents.voidSpecial2.purchased ? Math.floor((autoTrimpSettings.APValueBoxes.maxZone-50) / 100) : 0;
    return total;
}

//efficiencies taken from https://www.reddit.com/r/Trimps/comments/9nf77n/helium_calculator_for_49/
function VMsEfficiencyMult(VMAmount){
    //varies depending on max void map stack size. Either 1, 2, 3, 6, 7
    if(VMAmount < 1) VMAmount = 1;
    var arr = [];
    var arr1 = [1];
    var arr2 = [1,1.02,1.03,1.04,1.06,1.07,1.08,1.09,1.09,1.1,1.11,1.12,1.12,1.13,1.13,1.14,1.14,1.15,1.15,1.16,1.16,1.16,1.17,1.17,1.17,1.18,1.18,1.18,1.18,1.18,1.19,1.19,1.19,1.19,1.19,1.19,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.21,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22,1.22];
    var arr3 = [1,1.02,1.03,1.05,1.07,1.08,1.1,1.12,1.13,1.15,1.17,1.18,1.2,1.22,1.23,1.24,1.26,1.27,1.29,1.3,1.31,1.32,1.33,1.34,1.35,1.36,1.37,1.38,1.39,1.4,1.41,1.41,1.42,1.43,1.44,1.44,1.45,1.45,1.46,1.46,1.47,1.47,1.48,1.48,1.49,1.49,1.49,1.5,1.5,1.51,1.51,1.51,1.51,1.52,1.52,1.52,1.53,1.53,1.53,1.53,1.54,1.54,1.54,1.54,1.54,1.55,1.55,1.55,1.55,1.55,1.55,1.56,1.56,1.56,1.56,1.56];
    var arr6 = [1,1.02,1.03,1.05,1.07,1.08,1.1,1.12,1.14,1.16,1.18,1.2,1.22,1.25,1.27,1.29,1.31,1.34,1.36,1.38,1.41,1.43,1.45,1.48,1.5,1.53,1.55,1.58,1.6,1.63,1.65,1.68,1.7,1.73,1.75,1.77,1.8,1.82,1.85,1.87,1.89,1.92,1.94,1.96,1.98,2.01,2.03,2.05,2.07,2.09,2.11,2.13,2.15,2.17,2.19,2.21,2.23,2.24,2.26,2.28,2.29,2.31,2.33,2.34,2.36,2.37,2.38,2.4,2.41,2.42,2.44,2.45,2.46,2.47,2.48,2.49];
    var arr7 = [1,1.02,1.03,1.05,1.07,1.08,1.1,1.12,1.14,1.16,1.18,1.2,1.22,1.25,1.27,1.29,1.31,1.34,1.36,1.38,1.41,1.43,1.46,1.48,1.51,1.53,1.56,1.58,1.61,1.63,1.66,1.68,1.71,1.74,1.76,1.79,1.82,1.84,1.87,1.89,1.92,1.95,1.97,2,2.02,2.05,2.07,2.1,2.12,2.15,2.17,2.2,2.22,2.25,2.27,2.29,2.32,2.34,2.36,2.39,2.41,2.43,2.45,2.47,2.49,2.51,2.53,2.55,2.57,2.59,2.61,2.63,2.64,2.66,2.68,2.69];
    var maxVoidStack = Fluffy.getVoidStackCount();
    if(typeof maxVoidStack === 'undefined') maxVoidStack = 1;
    switch(maxVoidStack){
        case 2:
            arr = arr2;
            break;
        case 3:
            arr = arr3;
            break;
        case 6:
            arr = arr6;
            break;
        case 7:
            arr = arr7;
            break;
        default:
            arr = arr1;
    }
    if(VMAmount > arr.length) VMAmount = arr.length;
    return arr[VMAmount-1];
}

function singleVMWorth(zoneInput, currentPortal, useHeliumGU){
    var zone = typeof zoneInput === 'undefined' ? autoTrimpSettings.APValueBoxes.maxZone : zoneInput;
    if(zone >= 240){//round down last poison zone 
        var cycle = cycleZone(zone);
        if(cycle > 19) zone = zone - cycle + 19; 
        else if(cycle > 4 && cycle < 15) zone = zone - cycleZone(zone) + 4;
    }
    
    var AA = 1.35*(zone-19);
    var AAA = Math.pow(1.23, Math.sqrt(AA));
    var a = Math.floor(AA+AAA);
    var b = 15;
    var c = 2;
    var d = Math.pow(1.005, zone);
    var e = 1;
    var f = 1 + (useHeliumGU ? (getMaxBattleGU(zone)-1)/3-0.3 : 0); //assumes full helium GU after 60% void
    var g = 1 + 0.05   * (currentPortal ? game.portal.Looting.level    : AutoPerks.perksByName.Looting.level);
    var h = 1 + 0.0025 * (currentPortal ? game.portal.Looting_II.level : AutoPerks.perksByName.Looting_II.level);
    var spireRowBonus = game.talents.stillRowing.purchased ? 0.03 : 0.02;
    var spireRows = Math.floor((zone - 100)/100) * 10;
    var i = 1 + (spireRows * spireRowBonus);
    var j = 1;
    var k = (game.global.totalSquaredReward / 1000) + 1;
    var fluffyBonus = Fluffy.isRewardActive("helium");
    var l = 1 + (fluffyBonus * 0.25);
    var heliumy = game.singleRunBonuses.heliumy.owned ? 1.25 : 1;
    var scryHard2 = game.talents.scry2.purchased ? 1.5 : 1;
    
    var healthAmount = zone > 300 ? 2 + Math.floor((zone-300)/15) : 0;
    var maxCorrupted = Math.max(0,Math.min(80,Math.floor((zone - 151) / 3) + 2));
    var corrAmount   = maxCorrupted - healthAmount; //assumes full zone corruption
    var corruptionValue = corrAmount   * 0.15;
    var healthValue     = healthAmount * 0.45;
    var mutationTotal   = corruptionValue + healthValue + 1;
    var lastPortalZone  = currentPortal ? game.global.lastPortal : autoTrimpSettings.APValueBoxes.maxZone;
    var VS = 1 + game.talents.voidSpecial.purchased ? 0.0025 * lastPortalZone : 0;
    
    var worth = a*b*c*d*e*f*g*h*i*j*k*l*heliumy*scryHard2*2*mutationTotal*VS; //1 VM helium
    
    return worth;
}

//returns damage in B
function formationToBModifier(){
    switch (game.global.formation){
        case 0: //X
            return 0.5;
        case 2: //D
            return 0.125;
        case 4: //S
            var ret = (isScryhardActive()) ? 0.5 : 1;
            return ret;
        case 3: //B
        case 1: //H
        default:
            return 1;
    }
}

function ATgetPlayerCritDamageMult(critChance, critDamage){ //this multiplies ATgetPlayerNonCritDamageMult() for total crit mult
    var base = 5;
    if (game.talents.crit.purchased) base += 1;
    if (Fluffy.isRewardActive("megaCrit")) base += 2;
    if     (critChance < 0)   return 0.2;
    else if(critChance === 0) return 1;
    else if(critChance === 1) return critDamage;
    else if(critChance === 2) return critDamage * Math.pow(base, 1);
    else if(critChance >= 3)  return critDamage * Math.pow(base, 2); //triple crit highest in game ATM, red crit
    else throw "error in ATgetPlayerCritDamageMult: unexpected crit chance " + critChance;
}

function calcCritModifier(critChance, critDamage){
    var base = 5;
    if(game.talents.crit.purchased) base += 1;
    if(Fluffy.isRewardActive("megaCrit")) base += 2;
    if(critChance > 3) critChance = 3; //triple crit highest in game ATM, red crit
    
    if(critChance < 0 ) return 0.2*calcCritModifier(critChance+1, critDamage);
    if(critChance <= 1) return critChance * critDamage + (1-critChance);
    if(critChance <= 2) return (base*(critChance-1) + (2-critChance))*critDamage;
    else                return base*calcCritModifier(critChance-1, critDamage);
}

function calcBaseDamageinB(){
    calcArmyDamage(false, true, game.global.world); //this returns our damage, also factoring in the new damage from prestige/levels/coordinations that the game will only calculate on the next cell.
}
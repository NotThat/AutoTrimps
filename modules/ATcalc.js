function calcCritModifier(critChance, critDamage){
    var base = 5;
    if (Fluffy.isRewardActive("megaCrit")) base += 2;
    if (game.talents.crit.purchased) base += 1;
    if(critChance < 1)
        return critChance * critDamage + (1-critChance);
    else if(critChance <= 2)
        return (base*(critChance-1) + (2-critChance))*critDamage;
    else 
        return base*calcCritModifier(critChance-1, critDamage);
}

function calcDmgManual(printout){
    var dmg = 6;
    if (printout) debug("base " + dmg);

    var daggerAtk = game.equipment["Dagger"].attackCalculated;
    var daggerLvl = game.equipment["Dagger"].level;
    dmg += daggerAtk * daggerLvl;
    if (printout) debug("dagger " + daggerAtk.toExponential(2) + " " + daggerLvl + " dmg " + dmg.toExponential(2));
    //mace
    var MaceAtk = game.equipment["Mace"].attackCalculated;
    var MaceLvl = game.equipment["Mace"].level;
    dmg += MaceAtk * MaceLvl;
    if (printout) debug("Mace " + MaceAtk.toExponential(2) + " " + MaceLvl + " dmg " + dmg.toExponential(2));
    //polearm
    var polearmAtk = game.equipment["Polearm"].attackCalculated;
    var polearmLvl = game.equipment["Polearm"].level;
    dmg += polearmAtk * polearmLvl;
    if (printout) debug("polearm " + polearmAtk.toExponential(2) + " " + polearmLvl + " dmg " + dmg.toExponential(2));
    //battleaxe
    var BattleaxeAtk = game.equipment["Battleaxe"].attackCalculated;
    var BattleaxeLvl = game.equipment["Battleaxe"].level;
    dmg += BattleaxeAtk * BattleaxeLvl;
    if (printout) debug("Battleaxe " + BattleaxeAtk.toExponential(2) + " " + BattleaxeLvl + " dmg " + dmg.toExponential(2));
    //greatsword
    var GreatswordAtk = game.equipment["Greatsword"].attackCalculated;
    var GreatswordLvl = game.equipment["Greatsword"].level;
    dmg += GreatswordAtk * GreatswordLvl;
    if (printout) debug("Greatsword " + GreatswordAtk.toExponential(2) + " " + GreatswordLvl + " dmg " + dmg.toExponential(2));
    //arbalest
    var ArbalestAtk = game.equipment["Arbalest"].attackCalculated;
    var ArbalestLvl = game.equipment["Arbalest"].level;
    dmg += ArbalestAtk * ArbalestLvl;
    if (printout) debug("Arbalest " + ArbalestAtk.toExponential(2) + " " + ArbalestLvl + " dmg " + dmg.toExponential(2));
    
    var soldiers = game.resources.trimps.maxSoldiers;
    dmg *= soldiers;
    if (printout) debug("max soldiers " + soldiers.toExponential(2) + " dmg " + dmg.toExponential(2));
    var achievements = 1 + (game.global.achievementBonus / 100);
    dmg *= achievements;
    if (printout) debug("achievements " + achievements + " dmg " + dmg.toExponential(2));
    if (game.portal.Power.level > 0) {
        var power = game.portal.Power.level * game.portal.Power.modifier;
        dmg *= 1 + power;
        if (printout) debug("power " + power + " dmg" + dmg.toExponential(2));
    }
    if (game.portal.Power_II.level > 0) {
        var power2 = game.portal.Power_II.level * game.portal.Power_II.modifier;
        dmg *= 1 + power2;
        if (printout) debug("power2 " + power2 + " dmg" + dmg.toExponential(2));
    }
    if (game.global.antiStacks > 0) {
        var anti = ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1);
        dmg *= anti;
        if (printout) debug("anti " + anti + " dmg " + dmg.toExponential(2));
    }
    if (game.global.formation !== 0){
        var form = (game.global.formation == 2) ? 4 : 0.5;
        dmg *= form;
        if (printout) debug("formation " + form + " dmg " + dmg.toExponential(2));
    }
    if (game.global.titimpLeft > 1 && game.global.mapsActive){
        dmg *= 2;
        if (printout) debug("titimpbonus " + "2" + " dmg " + dmg.toExponential(2));
    }
    if (!game.global.mapsActive && game.global.mapBonus > 0){
        var mapbonus = ((game.global.mapBonus * .2) + 1);
        dmg *= mapbonus;
        if (printout) debug("mapbonus " + mapbonus.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.roboTrimpLevel > 0){
        var robo = ((0.2 * game.global.roboTrimpLevel) + 1);
        dmg *= robo;
        if (printout) debug("robo " + robo.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    
    //var shield = calcHeirloomBonus("Shield", "trimpAttack", 1);
    var shield = highATK;
    dmg *= shield;
    if (printout) debug("shield " + shield.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    if (game.goldenUpgrades.Battle.currentBonus > 0){
        var battle = game.goldenUpgrades.Battle.currentBonus + 1;
        dmg *= battle;
        if (printout) debug("battle "  + battle.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.voidPower.purchased && game.global.voidBuff){
        var vpAmt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        dmg *= ((vpAmt / 100) + 1);
        if (printout) debug("void power " + ((vpAmt / 100) + 1).toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (isScryhardActive()){
        dmg *= 2;
        if (printout) debug("scryhard1 " + "2" + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.daily.purchased && game.global.challengeActive == "Daily"){
        dmg *= 1.5;
        if (printout) debug("legs for days " + "1.5" + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.magmamancer.purchased){
        var magmamancers = game.jobs.Magmamancer.getBonusPercent();
        dmg *= magmamancers;
        if (printout) debug("magmamancers " + magmamancers.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.stillRowing2.purchased){
        var rowing = ((game.global.spireRows * 0.06) + 1);
        dmg *= rowing;
        if (printout) debug("rowing " + rowing + " dmg " + dmg.toExponential(2));
    }
    if (game.talents.healthStrength.purchased && mutations.Healthy.active()){
        var str = ((0.15 * mutations.Healthy.cellCount()) + 1);
        dmg *= str;
        if (printout) debug("strength in health " + str.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.mapsActive && game.talents.bionic2.purchased && currMap.level > game.global.world){
        dmg *= 1.5;
        if (printout) debug("Bionic Magnet II + 50% dmg " + dmg.toExponential(2));
    }
    if (mutations.Magma.active()){
        var magMult = mutations.Magma.getTrimpDecay();
        dmg *= magMult;
        if (printout) debug("magma " + magMult.toExponential(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.totalSquaredReward > 0){
        var sqr = ((game.global.totalSquaredReward / 100) + 1);
        dmg *= sqr;
        if (printout) debug("sqr " + sqr + " dmg " + dmg.toExponential(2));
    }
    if (getEmpowerment() == "Ice"){
        var ice = 1 + (1 - game.empowerments.Ice.getCombatModifier());
        dmg *= ice;
        if (printout) debug("ice " + ice.toExponential(2) + " dmg " + dmg.toExponential(2));
    }
    if (Fluffy.isActive()){
        var fluff = lastFluffDmg;
        dmg *= fluff;
        if (printout) debug("fluffy " + fluff.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.jobs.Amalgamator.owned > 0){
        var amal = game.jobs.Amalgamator.getDamageMult();
        dmg *= amal;
        if (printout) debug("amal " + amal + " dmg " + dmg.toExponential(2));
    }
    if (game.singleRunBonuses.sharpTrimps.owned){
        var sharp = 1.5;
        dmg *= sharp;
        if (printout) debug("sharp " + sharp + " dmg " + dmg.toExponential(2));
    }
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.weakness !== 'undefined'){
            var weak = dailyModifiers.weakness.getMult(game.global.dailyChallenge.weakness.strength, game.global.dailyChallenge.weakness.stacks);
            dmg *= weak;
            if (printout) debug("daily weak " + weak.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)){
            var nerf = dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
            dmg *= nerf;
            if (printout) debug("daily nerf " + nerf.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)){
            var buff = dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
            dmg *= buff;
            if (printout) debug("daily buff " + buff.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
        if (typeof game.global.dailyChallenge.rampage !== 'undefined'){
            var ramp = dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
            dmg *= ramp;
            if (printout) debug("daily ramp " + ramp.toFixed(2) + " dmg " + dmg.toExponential(2));
        }
    }
    
    var baseModifier = formationToBModifier();
    var dmgLow = dmg / highATK * lowATK;
    
    baseDamageLowNoCrit    = dmgLow * ATgetPlayerNonCritDamageMult(lowCritChance, lowCritDamage) * baseModifier;
    baseDamageLowCritOnly  = baseDamageLowNoCrit * ATgetPlayerCritDamageMult(lowCritChance, lowCritDamage);
    
    baseDamageHighNoCrit   = dmg * ATgetPlayerNonCritDamageMult(highCritChance, highCritDamage) * baseModifier;
    baseDamageHighCritOnly = baseDamageHighNoCrit * ATgetPlayerCritDamageMult(highCritChance, highCritDamage);
    
    var min = 1;
    var max = 1.2;
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.minDamage !== 'undefined'){
            min = (1-dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength));
            baseDamageLowNoCrit  *= min;
            baseDamageHighNoCrit *= min;
            if (printout) debug("daily min " + min.toFixed(2));
        }
        if (typeof game.global.dailyChallenge.maxDamage !== 'undefined'){   
            max = 1.2 + dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
            if (printout) debug("daily max " + max.toFixed(2));
        }
    }
    
    var avgRange = (max + min) / 2;
    
    var critMultLow = calcCritModifier(lowCritChance, lowCritDamage);
    dmgLow *= critMultLow;
    var critMultHigh = calcCritModifier(highCritChance, highCritDamage);
    dmg *= critMultHigh;
    if (printout) debug ("critchance " + highCritChance + " critMult " + highCritDamage + " final " + critMultHigh.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    dmgLow *= avgRange;
    dmg *= avgRange;
    if (printout) debug("avgRange " + avgRange.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    baseDamageLow = dmgLow * baseModifier;
    baseDamageHigh = dmg * baseModifier;
    goodBadShieldRatio = baseDamageHigh / baseDamageLow;
    
    return baseDamageHigh;
}

//base includes gear, amalgamators, power1 and power2
//TODO: golden battle, sharp trimps, daily bonuses, 
function calcEndDamageAA(base, zone){
    var coords = zone + 99;
    var soldiers = calcCoords(0, coords);
    base *= soldiers;
    
    var achievements = 1 + (game.global.achievementBonus / 100);
    base *= achievements;
    
    var anti = ((45 * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1);
    base *= anti;    
    
    var form = 4;
    base *= form;   
    
    if (game.global.roboTrimpLevel > 0){
        var robo = ((0.2 * game.global.roboTrimpLevel) + 1);
        base *= robo;
    }
    
    var shield = highATK;
    base *= shield;
    
    if (game.talents.stillRowing2.purchased){
        var rowing = (10*Math.floor((zone-100)/100) * 0.06 + 1);
        base *= rowing;
    }
    if (game.talents.healthStrength.purchased){
        var healthy = zone > 300 ? 2 + Math.floor((zone - 301)/15) : 0;
        var str = (0.15 * healthy + 1);
        base *= str;
    }
    
    if(AutoPerks.dailyObj != null && AutoPerks.dailyObj != AutoPerks.Squared && game.talents.daily.purchased) //legs for days
        base *= 1.5;
    
    base *= AutoPerks.sharpBonusMult;
    base *= AutoPerks.battleGUMult;
    
    var magMult = Math.pow(0.8, zone-230+1);
    base *= magMult;
        
    if (game.global.totalSquaredReward > 0){
        var sqr = ((game.global.totalSquaredReward / 100) + 1);
        base *= sqr;
    }
    if (Fluffy.isActive()){
        var fluff = lastFluffDmg;
        base *= fluff;
    }
    
    var min = 1;
    var max = 1.2;
    
    var avgRange = (max + min) / 2;
    
    var critMultHigh = calcCritModifier(highCritChance, highCritDamage);
    base *= critMultHigh;
    
    base *= avgRange;
    
    return base;
}



function calcEnemyAttack(mutation, corrupted, atkScale, name, level, oblitMult){
    var attack;
    
    attack = game.global.getEnemyAttack(level, name) * atkScale * 1.2; //1.2 for max damage (hopefully)
    
    if (game.global.spireActive && checkIfSpireWorld()){// && !game.global.mapsActive){
        attack = getSpireStats(level, name, "attack");
    }
    if (corrupted == "corruptStrong") attack *= 2;
    if (corrupted == "healthyStrong") attack *= 2.5;
    /*if (name.includes("Toxic") || name.includes("Gusty") || name.includes("Frozen")){ //token enemy. expensive to calculate and does it really matter?
        if (mutation != "Corruption"){
            attack = mutations.Corruption.attack(level, name);
        }
        attack *= 1.2;
    }*/

    if (game.global.challengeActive){
        if (game.global.challengeActive == "Obliterated"){
            attack *= oblitMult;
        }
        if (game.global.challengeActive == "Life") {
            attack *= 6;
        }
        else if (game.global.challengeActive == "Toxicity"){
            attack *= 5;
        }
        else if (game.global.challengeActive == "Balance"){
            attack *= (game.global.mapsActive) ? 2.35 : 1.17;
        }
        if (game.global.challengeActive == "Coordinate"){
            attack *= getBadCoordLevel();
        }
        else if (game.global.challengeActive == "Meditate"){
            attack *= 1.5;
        }
        else if (game.global.challengeActive == "Watch") {
            attack *= 1.25;
        }
        else if (game.global.challengeActive == "Scientist" && getScientistLevel() == 5) {
            attack *= 10;
        }
        else if (game.global.challengeActive == "Corrupted"){
            attack *= 3;
        }
        if (game.global.challengeActive == "Daily"){
            if (typeof game.global.dailyChallenge.badStrength !== 'undefined'){
                attack *= dailyModifiers.badStrength.getMult(game.global.dailyChallenge.badStrength.strength);
            }
            if (typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.mapsActive){
                attack *= dailyModifiers.empower.getMult(game.global.dailyChallenge.empower.strength, game.global.dailyChallenge.empower.stacks);
            }
        }
    }
    return attack;
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

function getEnemyHealthAT(level, name, ignoreImpStat, zone) {
    var world = (zone) ? zone : game.global.world;
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
    //if (world > 5 && game.global.mapsActive) amt *= 1.1;
    if (!ignoreImpStat)
        amt *= game.badGuys[name].health;
    return Math.floor(amt);
}

function timeEstimator(currZoneFlag, fromCell, zone, isPoison, toText){
    var totalHP = 0;
    var time = 0;
    var dmgToUse = (currZoneFlag ? baseDamageHigh*8 : calcEndDamageAA(AutoPerks.benefitHolderObj.Attack.benefit, zone))*4;
    if(currZoneFlag)
        for (var i = fromCell; i<100; i++)
            totalHP += worldArray[i].maxHealth;
    else{
        totalHP = approxZoneHP(zone);
    }
    
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
        do{
            if(magmamancerStacks > 12) break;
            magmaDmgMult = getBonusPercentAT(false, magmamancerStacks++);
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
        if(!isFinite(dmgToUse)) return "Infinity";
        var timeText = "";
        if(ret < 60) timeText = Math.floor(ret) + "s";
        else if (ret < 3600)  timeText = Math.floor(ret/60) + "m" + Math.floor(ret % 60) + "s";
        else if (ret < 86400) timeText = Math.floor(ret / 3600) + "h" + Math.floor((ret % 3600)/60) + "m";
        else timeText = Math.floor(ret / 86400) + "d" + Math.floor((ret % 86400)/3600) + "h";
        return timeText;// + " " + Math.floor(ret);
    }
    else if(!isFinite(dmgToUse)) return Number.MAX_VALUE;
    else return ret;
}

function getBonusPercentAT(justStacks, forceTime, count){
    var boostMult = 0.9999;
    var boostMax = 3;
    var expInc = 1.2;
    var timeOnZone;
    var howMany = typeof count === 'undefined' ? 31500 : count;
    if (typeof forceTime === 'undefined'){
        var timeOnZone = getGameTime() - game.global.zoneStarted;
        if (game.talents.magmamancer.purchased) timeOnZone += 300000;
        timeOnZone = Math.floor(timeOnZone / 600000);

        if (timeOnZone > 12) timeOnZone = 12;
        else if (timeOnZone <= 0) return 1;
    }
    else timeOnZone = forceTime;
    if (justStacks) return timeOnZone;
    //return 1 + ((((1 - Math.pow(boostMult, this.owned)) * boostMax)) * (Math.pow(expInc, timeOnZone) - 1));
    return 1 + ((((1 - Math.pow(boostMult, howMany)) * boostMax)) * (Math.pow(expInc, timeOnZone) - 1));
}

function approxZoneHP(zoneNum){
    var zone = typeof zoneNum === 'undefined' ? game.global.world : zoneNum;
    var healthy = zone > 300 ? 2 + Math.floor((zone - 300)/15): 0;
    var corrupt = 99 - healthy; //assumes full zone corruption which happens in zone 430ish?
    
    //corruptDbl,corruptCrit,corruptBleed,corruptStrong,corruptTough,corruptDodge,healthyDbl,healthyCrit,healthyBleed, healthyStrong, healthyTough, none
    var corruptMult = (3 + 5 + 1.3) / 6; //1.3 for dodge, 5 for tough
    var healthyMult = (4 + 7.5) / 5; //7.5 for tough
    
    var amt = 1;
    if(typeof AutoPerks.DailyHousingMult !== 'undefined') amt *= AutoPerks.DailyHousingMult;
    amt *= getEnemyHealthAT(50, 'Snimp', true, zone)       *(healthy*healthyMult*corruptHealthyStatScaleAT(14, zone) + (corrupt*corruptMult)*corruptHealthyStatScaleAT(10, zone))
         + getEnemyHealthAT(99, "Omnipotrimp", false, zone)*corruptHealthyStatScaleAT(10, zone);
    return amt;
}

function corruptHealthyStatScaleAT(base, zone){
    var scales = Math.floor((zone - 150) / 6);
    base *= Math.pow(1.05, scales);
    return base;
}

function sumCurrZoneHP(){
    var sum = 0;
    for (var i = 0; i < 100; i++)
        sum += worldArray[i].maxHealth;
    return sum;
}

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
    var zone = typeof zoneInput === 'undefined' ? AutoPerks.maxZone : zoneInput;
    //round down last poison zone 
    var cycle = cycleZone(zone);
    if(cycle > 19) zone = zone - cycle + 19; 
    else if(cycle > 4 && cycle < 15) zone = zone - cycleZone(zone) + 4;
    
    var total = Math.round(zone * 0.09653);                        //calculated based on z1000 1000 iterations
    total += Fluffy.isRewardActive("voidance")     === 1 ? 4  : 0; //Each Portal, start with two double stacked Void Maps.
    total += Fluffy.isRewardActive("voidelicious") === 1 ? 16 : 0; //Start each Portal with 1 of each uniquely named Void Map (16 total).
    total += game.talents.voidSpecial.purchased ? Math.floor(AutoPerks.maxZone / 100) : 0;
    total += game.talents.voidSpecial2.purchased ? Math.floor((AutoPerks.maxZone-50) / 100) : 0;
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

function singleVMWorth(zoneInput, currentPortal){
    var zone = typeof zoneInput === 'undefined' ? AutoPerks.maxZone : zoneInput;
    //round down last poison zone 
    var cycle = cycleZone(zone);
    if(cycle > 19) zone = zone - cycle + 19; 
    else if(cycle > 4 && cycle < 15) zone = zone - cycleZone(zone) + 4;
    
    var AA = 1.35*(zone-19);
    var AAA = Math.pow(1.23, Math.sqrt(AA));
    var a = Math.floor(AA+AAA);
    var b = 15;
    var c = 2;
    var d = Math.pow(1.005, zone);
    var e = 1;
    var f = (getMaxBattleGU(zone)-1)/3-0.3+1; //assumes full helium GU after 60% void
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
    var maxCorrupted = Math.min(80,Math.floor((zone - 151) / 3) + 2);
    var corrAmount   = maxCorrupted - healthAmount; //assumes full zone corruption
    var corruptionValue = corrAmount   * 0.15;
    var healthValue     = healthAmount * 0.45;
    var mutationTotal   = corruptionValue + healthValue + 1;
    var lastPortalZone  = currentPortal ? game.global.lastPortal : AutoPerks.maxZone;
    var VS = game.talents.voidSpecial.purchased ? 1 + 0.0025 * lastPortalZone : 1;
    
    var worth = a*b*c*d*e*f*g*h*i*j*k*l*heliumy*scryHard2*2*mutationTotal*VS; //1 VM helium
    
    return worth;
}
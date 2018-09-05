function calcCritModifier(critChance, critDamage){
    ret = 0;
    if(critChance < 1){
        ret = critChance * critDamage + 1-critChance;
        return ret;
    }
    if(critChance <=2){
        ret = (5*(critChance-1) + (2-critChance))*critDamage;
        return ret;
    }
    return 5*calcCritModifier(critChance-1, critDamage);
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
    if (!game.global.mapsActive && game.global.mapBonus > 0){
        var mapbonus = ((game.global.mapBonus * .2) + 1);
        dmg *= mapbonus;
        if (printout) debug("mapbonus " + mapbonus.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.global.formation !== 0){
        var form = (game.global.formation == 2) ? 4 : 0.5;
        dmg *= form;
        if (printout) debug("formation " + form + " dmg " + dmg.toExponential(2));
    }
    if (game.global.roboTrimpLevel > 0){
        var robo = ((0.2 * game.global.roboTrimpLevel) + 1);
        dmg *= robo;
        if (printout) debug("robo " + robo.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    
    var shield = calcHeirloomBonus("Shield", "trimpAttack", 1);
    dmg *= shield;
    if (printout) debug("shield " + shield.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    if (game.talents.voidPower.purchased && game.global.voidBuff){
        var vpAmt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        dmg *= ((vpAmt / 100) + 1);
        if (printout) debug("void power " + ((vpAmt / 100) + 1).toFixed(2) + " dmg " + dmg.toExponential(2));
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
    if (game.goldenUpgrades.Battle.currentBonus > 0){
        var battle = game.goldenUpgrades.Battle.currentBonus + 1;
        dmg *= battle;
        if (printout) debug("battle "  + battle.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (getEmpowerment() == "Ice"){
        var ice = 1 + (1 - game.empowerments.Ice.getCombatModifier());
        dmg *= ice;
        if (printout) debug("ice " + ice.toExponential(2) + " dmg " + dmg.toExponential(2));
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
    if (Fluffy.isActive()){
        var fluff = Fluffy.getDamageModifier();
        dmg *= fluff;
        if (printout) debug("fluffy " + fluff.toFixed(2) + " dmg " + dmg.toExponential(2));
    }
    if (game.jobs.Amalgamator.owned > 0){
        var amal = game.jobs.Amalgamator.getDamageMult();
        dmg *= amal;
        if (printout) debug("amal " + amal + " dmg " + dmg.toExponential(2));
    }
    
    baseDamageNoCrit = dmg*ATgetPlayerNonCritDamageMult();
    baseDamageCritOnly = baseDamageNoCrit*ATgetPlayerCritDamageMult();
    
    var min = 1;
    var max = 1.2;
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.minDamage !== 'undefined'){
            min = (1-dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength));
            baseDamageNoCrit *= min;
            if (printout) debug("daily min " + min.toFixed(2));
        }
        if (typeof game.global.dailyChallenge.maxDamage !== 'undefined'){   
            max = 1.2 + dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
            if (printout) debug("daily max " + max.toFixed(2));
        }
    }
    
    var critMult = calcCritModifier(getPlayerCritChance(), getPlayerCritDamageMult());
    dmg *= critMult;
    if (printout) debug ("critchance " + getPlayerCritChance() + " critMult " + getPlayerCritDamageMult() + " final " + critMult.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    var avgRange = (max + min) / 2;
    dmg *= avgRange;
    if (printout) debug("avgRange " + avgRange.toFixed(2) + " dmg " + dmg.toExponential(2));
    return dmg;
}
function dmgNeededToOK(cellNum){
    if(game.global.mapsActive){ //we dont generate map grid
        debug("error: dmgNeededToOK in map");
        return -1;
    }
    var requiredDmgToOK = dmgNeededToOKHelper(cellNum, game.global.gridArray[cellNum].health); //how much dmg we need to fully OK on this attack
    var requiredDmgToOKNext = 1; //calculate damage to OK next attack. this number is more important since our damage on current attack is mostly locked, we need to predict the next attack/cell
    for (var i = 1+Fluffy.isRewardActive("overkiller"); i >= 1; i--){
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
    var overkillCells = 1+Fluffy.isRewardActive("overkiller"); //0 / 1 / 2
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

function getShieldStats(){
    var original = highDamageHeirloom;
    if(!getPageSetting('HeirloomSwapping')){
        goodShieldAtkMult = 1;
        return;
    }
    equipMainShield();
    goodShieldAtkMult = calcHeirloomBonus("Shield", "trimpAttack", 1);
    equipLowDmgShield();
    lowShieldPB = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
    if(original)
        equipMainShield();
    calcBaseDamageinS();
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

    if (game.global.gridArray[cellNum].corrupted == "corruptCrit")
        enemyAttack *= 5;
    else if (game.global.gridArray[cellNum].corrupted == "healthyCrit")
        enemyAttack *= 7;
    else if (game.global.gridArray[cellNum].corrupted == "corruptBleed")
        ourHP *= 0.8;
    else if (game.global.gridArray[cellNum].corrupted == "healthyBleed")
        ourHP *= 0.7;

    ourHP -= enemyAttack;

    if (ourHP <= 1000){ 
        debug("Trimpiciding to prevent empowering e:" + enemyAttack.toExponential(2) + " us:" + game.global.soldierHealth.toExponential(2) + " ourHP:" + ourHP.toExponential(2));
       if (!game.global.switchToMaps){
            mapsClicked();
        }
        mapsClicked();

        return true;
    }
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
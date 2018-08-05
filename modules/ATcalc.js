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

function calcDmgManual(printout, figureOutShield, number){
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
    
    var shield = 1;
    if(figureOutShield) //used to check which shield the game uses for current cell/trimps army
        shield = calcHeirloomBonus("Shield", "trimpAttack", 1);
    else
        shield = goodShieldActuallyEquipped ? goodShieldAtkMult : 1;
        
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
    
    if(figureOutShield){
        var num = number;
        num = num / (baseDamageNoCrit / shield);
        //debug("num is " + num.toFixed(2));

        if(num > 0.9 && num < 2)
            goodShieldActuallyEquipped = false;
        else if(isNaN(num))
            debug("num is NaN " + num);
        else{
            goodShieldActuallyEquipped = true;
            //if (num >= 10.8 || num <= 10)
            //    debug("error shield atk num = " + num.toFixed(2));
        }
        effectiveShieldAtkMult = num;
    }
    
    var critMult = calcCritModifier(getPlayerCritChance(), getPlayerCritDamageMult());
    dmg *= critMult;
    if (printout) debug ("critchance " + getPlayerCritChance() + " critMult " + getPlayerCritDamageMult() + " final " + critMult.toFixed(2) + " dmg " + dmg.toExponential(2));
    
    var avgRange = (max + min) / 2;
    dmg *= avgRange;
    if (printout) debug("avgRange " + avgRange.toFixed(2) + " dmg " + dmg.toExponential(2));
    return dmg;
}

//calculates how much dmg we need to fully overkill starting on cellNum which has HP health remaining
function dmgNeededToOK(cellNum, HP){
    var overkillCells = 1+Fluffy.isRewardActive("overkiller"); //0 / 1 / 2
    var overkillPercent = game.portal.Overkill.level * 0.005;
    var requiredDmgToOK = 0;
    for(var i = overkillCells; i>=1; i--){
        if(cellNum + i >= 100)
            continue;
        requiredDmgToOK += worldArray[cellNum + i].maxHealth;
        requiredDmgToOK = requiredDmgToOK / overkillPercent;
    }
    requiredDmgToOK += HP;
    if(poisonZone())
        requiredDmgToOK -= Math.min(game.empowerments.Poison.currentDebuffPower, HP);
    
    return requiredDmgToOK;
}

function calcGoodShieldAtkMult(){
    var original = highDamageHeirloom;
    if(!getPageSetting('HeirloomSwapping')){
        goodShieldAtkMult = 1;
        return;
    }
    equipMainShield();
    goodShieldAtkMult = calcHeirloomBonus("Shield", "trimpAttack", 1);
    if(!original)
        equipLowDmgShield();
}

function checkShield(){
    if (game.global.soldierHealth <= 0) //damage may or may not be accurate if army is dead
        return;
    
    var str = calculateDamage(game.global.soldierCurrentAttack, true, true);
    str = str.substr(0,str.indexOf('-'));
    var min = parseFloat(str) / ((game.global.titimpLeft > 0 && game.global.mapsActive) ? 2 : 1); // *we dont care about titimp damage;
    if(isNaN(min))
        return false; //no displayed damage, we're probably in premaps.
    calcDmgManual(false, true, min);
    shieldCheckedFlag = true;
    //debug("goodShieldActuallyEquipped = " + goodShieldActuallyEquipped + " highDamageHeirloom = " + highDamageHeirloom);
    calcBaseDamageinS(); //need to redo damage calculations in case we realized we use different shield
}
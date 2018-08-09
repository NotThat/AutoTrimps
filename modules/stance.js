//MODULES["stance"] = {};
var currentBadGuyNum;
var lastZoneGridded = -1;
var coordBuyThreshold;
var buyWeaponsModeAS3 = (getPageSetting('DelayWeaponsForWind') ? 0 : 3); //0: buy nothing, only prestige if it lowers our damage. 1: prestige till 1 before max prestige and level 2: prestige only 3: buy everything
var maxCoords = -1;
var trimpicide = false;
var minAnticipationStacks;
var worldArray = [];
var lastHealthy = 0;
var lastCorrupt = 0;
var stanceStats = [];
var dailyMult = 1;
var Goal = 0.005;
var pctTotal;
var OmniThreshhold;
var minHP;
var maxHP = -1;
var desiredDamage;
var m;
var hr;
var highDamageHeirloom = true;
var avgGravyRemaining = 1;
var avgGravyFull = 1;
var maxStacksBaseDamageD;
var baseDamageNoCrit;
var baseDamageCritOnly;
var maxDesiredRatio;
var lastDebug;
var cellLastHealth = 0;
var holdingBack = true;
var originallyEquippedShield = true;
var goodShieldAtkMult = 1;
var goodShieldActuallyEquipped; //bugfix
var lastMobHP = -1;

var lastHiddenBreedTimer = -1;
var shieldCheckedFlag = false;
var desiredShield;
var negativeDamageCounter = 0;
var effectiveShieldAtkMult = 1;

function formationToSModifier(){
    switch (game.global.formation){
        case 0:
            return 0.5;
        case 2:
            return 0.125;
        case 4:
            return  1;
    }
}

function ATgetPlayerNonCritDamageMult(){
    var base = 5;
    if (Fluffy.isRewardActive("megaCrit")) base += 2;
    if(getPlayerCritChance() < 0)
        return 0.2;
    else if(getPlayerCritChance() < 1)
        return 1;
    else if (getPlayerCritChance() < 2)
        return getPlayerCritDamageMult();
    else if (getPlayerCritChance() < 3)
        return Math.pow(base, 1)*getPlayerCritDamageMult();
    else if (getPlayerCritChance() < 3)
        return Math.pow(base, 2)*getPlayerCritDamageMult();
    else if (getPlayerCritChance() < 4)
        return Math.pow(base, 3)*getPlayerCritDamageMult();
    debug("error getPlayerCritChance() too large " + getPlayerCritChance());
    return 1;
}

function ATgetPlayerCritDamageMult(){ //this multiplies ATgetPlayerNonCritDamageMult() for total crit mult
    var base = 5;
    if (Fluffy.isRewardActive("megaCrit")) base += 2;
    if(getPlayerCritChance() < 1)
        return getPlayerCritDamageMult();
    else if (getPlayerCritChance() < 2)
        return Math.pow(base,1);
    else if (getPlayerCritChance() < 3)
        return Math.pow(base, 2);
    else if (getPlayerCritChance() < 3)
        return Math.pow(base, 3);
    else if (getPlayerCritChance() < 4)
        return Math.pow(base, 4);
    debug("error getPlayerCritChance() too large " + getPlayerCritChance());
    return 1;
}

function calcBaseDamageinS() {
    var baseModifier = formationToSModifier();
    
    var critMult = calcCritModifier(getPlayerCritChance(), getPlayerCritDamageMult());
		
    var trimpATKOld = calculateDamage(game.global.soldierCurrentAttack, true, true, true) * critMult; //this is without shield, without crit modifiers, 
    trimpATKOld *= baseModifier;
    baseDamageOld = parseFloat(trimpATKOld);
    
    var trimpATK = calcDmgManual(); //this returns our damage, also factoring in the new damage from prestige/levels/coordinations that the game will only calculate on the next cell.
    trimpATK *= baseModifier;
    baseDamageNoCrit *= baseModifier;
    
    //if(getPlayerCritChance() > 1) baseDamageNoCrit *= getPlayerCritDamageMult();
    //if(getPlayerCritChance() > 2) baseDamageNoCrit *= 5;
    //if(getPlayerCritChance() > 3) baseDamageNoCrit *= 5;
    
    baseDamage = parseFloat(trimpATK);
    
    //baseBlock
    baseBlock = game.global.soldierCurrentBlock;
    //baseHealth
    baseHealth = game.global.soldierHealthMax;

    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.

    //B stance
    if (game.global.formation == 3)
        baseBlock /= 4;
    else if (game.global.formation != "0")
        baseBlock *= 2;

    //H stance 
    if (game.global.formation == 1)
        baseHealth /= 4;
    else if (game.global.formation != "0")
        baseHealth *= 2;
}

function autoStance() {
    if (game.global.gridArray.length === 0) //zone didnt initialize yet
        return false;
    
    if (game.global.world == getPageSetting('VoidMaps') || BWRaidNowLogic() || PRaidingActive || !getPageSetting('DelayWeaponsForWind'))
        buyWeaponsModeAS3 = 3; //buy everything
    else
        buyWeaponsModeAS3 = 0; //buy nothing
    
    if(trimpicide)
        if (!getTargetAntiStack(minAnticipationStacks, false))
            return;
    
    checkShield(); //if not expensive, lets do it always
    
    goDefaultStance(); //D if we have it, X otherwise
    equipMainShield(); //TODO: maybe we want to not do this
    calcBaseDamageinS();
    updateAllBattleNumbers(true);
    switchOnGA(); //under normal uses getTargetAntiStack should turn autoGA back on, but if loading from a save it could stay off
    desiredShield = "";
    
    if(baseDamage <= 0 || game.global.soldierCurrentAttack <= 0){
        var wrongDamage = game.global.soldierCurrentAttack;
        if(!game.global.preMapsActive){
            if (!game.global.switchToMaps){
                mapsClicked();
            }
        }
        mapsClicked();
        calcBaseDamageinS();
        checkShield();
        
        //debug("Damage error! " + baseDamageNoCrit.toExponential(2) + " baseDamage " + game.global.soldierCurrentAttack.toExponential(2) + " game.global.soldierCurrentAttack!");
        debug("Damage error! Negative damage " + wrongDamage.toExponential(2));
        debug("Trimpiciding to set things straight.");
        return; 
    }
    
    var stackSpire = (game.global.world == 500) && getPageSetting('StackSpire4') && (game.global.spireDeaths <= 8);
    if(game.global.spireActive && !stackSpire){
        allowBuyingCoords = true;
        getDamageCaller(getSpireStats(99, "Snimp", "health")*30, false);
        return;
    }
    
    if (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        getDamageCaller(maxHP*1000000, false);
        allowBuyingCoords = true;
        if (game.global.soldierHealth <= 0)
            fightManual();
        return;
    }

    updateOmniThreshhold();
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var nextCell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum + 1] : game.global.gridArray[cellNum + 1];

    var enemyHealth = cell.health;  //current health
    var enemyMaxHealth = cell.maxHealth; //in future can do some prediction with plaguebringer and expected minimum enemy max health of world zone
    
    if(enemyHealth == -1){ //game didnt generate first enemy yet, so use our own
        enemyHealth = worldArray[cellNum].maxHealth;
        enemyMaxHealth = enemyHealth;
    }
    worldArray[cellNum].health = enemyHealth; //is there a reason why we should calculate this earlier?
    
    allowBuyingCoords = !getPageSetting('DelayCoordsForWind'); //dont buy coords unless we explicitly permit it. automaps() can also allow it if player runs a map for ratio.

    if (game.global.soldierHealth <= 0){ 
        if (game.global.challengeActive == "Trapper" || (game.global.breedBack <= 0 && (hiddenBreedTimer > wantedAnticipation || DHratio > 1)))
            fightManual();
        return;
    }
    
    if(game.global.mapsActive){
        return;
    }
    
    var requiredDmgToOK = dmgNeededToOK(cellNum, enemyHealth); //how much dmg we need to fully OK on this attack
    var requiredDmgToOKNext = 1; //calculate damage to OK next attack. this number is more important since our damage on current attack is mostly locked, we need to predict the next attack/cell
    for (var i = 1+Fluffy.isRewardActive("overkiller"); i >= 1; i--){
        if(cellNum + i >= 100)
            continue;
        var tmp = dmgNeededToOK(cellNum+i, worldArray[cellNum+i].maxHealth);
        if (tmp > requiredDmgToOKNext)
            requiredDmgToOKNext = tmp;
    }
    
    if (typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.preMapsActive && !game.global.mapsActive){ //dont die in world on empowered dailies
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
            
            return;
        }
    }
    
    //non wind zone or poor wind zone, max speed
    //if(!windZone() || avgGravyRemaining < 0.001){ 
    if(!windZone()){ 
        desiredShield = "good";
        if(game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting) == 0)
            switchOnGA(); //in rare cases we leave GA disabled, so make sure to turn it back on
        
        allowBuyingCoords = true;
        if(windZone(game.global.world + 1) && cellNum > 50) //if next zone is a wind zone, dont instantly buy the coordination in case we want to save it.
            allowBuyingCoords = false;
        
        getDamageCaller(1.5*Math.max(requiredDmgToOK, requiredDmgToOKNext), false, true);
        
        //consider trimpicide for max stacks / equip high damage heirloom
        if(hiddenBreedTimer > maxAnti && !holdingBack && (game.global.antiStacks < maxAnti-1 || (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')))){
           debug("Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')) ? "" : " equip good shield");
            wantedAnticipation = maxAnti;
            if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
                if (!game.global.switchToMaps){
                    mapsClicked();
                }
                mapsClicked();
            }
        }
        
        return;
    }
    
    var maxDesiredStacks = ((game.global.challengeActive == "Daily") ? 196 : 192); //overshooting is really bad, so take a safety margin on non dailies. note that with plaguebringer the script will overshoot this by quite a bit on occasions so a big safety margin is recommended
    if((cell.corrupted !== undefined && cell.corrupted.includes("healthy")) || cellNum == 99)
        maxDesiredStacks = 196; //still want max stacks for healthy/end cells
    
    var stacks = game.empowerments.Wind.currentDebuffPower;
    var missingStacks = Math.max(maxDesiredStacks-stacks, -5);
    
    var ourAvgDmgS = baseDamage;
    var ourAvgDmgX = ourAvgDmgS * 2;
    var ourAvgDmgD = ourAvgDmgS * 8;
    
    var expectedNumHitsS = enemyHealth / ourAvgDmgS;
    var expectedNumHitsX = enemyHealth / ourAvgDmgX;
    var expectedNumHitsD = enemyHealth / ourAvgDmgD;
    
    var expectedNumHitsDNextCell = Math.ceil((cellNum < 99 ? worldArray[cellNum+1].health : 1) / ourAvgDmgD);
    
    //dont wanna worry about last cell all the time, so keep it simple
    var nextPBDmgtmp = (cellNum == 99 || nextCell.plaguebringer === undefined ? 0 : nextCell.plaguebringer);
    var pbHitstmp = (cellNum == 99 || nextCell.plagueHits === undefined ? 0 : Math.ceil(nextCell.plagueHits));
    var corruptedtmp = (cell.corrupted === undefined ? "none" : cell.corrupted);
    
    //figure out what attacking the current cell is worth
    var pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0); //weaker shield should have more PB. PB isnt that good of a damage modifier.
    if(cellNum < 99)
        worldArray[cellNum].PBWorth = pbMult * worldArray[cellNum+1].geoRelativeCellWorth;
    else
        worldArray[cellNum].PBWorth = 0;
    
    if(cellNum < 99){
        worldArray[cellNum+1].health = Math.max(worldArray[cellNum+1].maxHealth - nextPBDmgtmp, 0.05*worldArray[cellNum+1].maxHealth); //extra damage on next cell from PB
        worldArray[cellNum+1].pbHits = pbHitstmp; //extra wind stacks on next cell from PB
        var nextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind") + pbHitstmp + 1.2 * expectedNumHitsD * (pbMult + getRetainModifier("Wind")) + Math.ceil(worldArray[cellNum+1].health/ourAvgDmgD)), 200);
        var nextStartingStacksCurrent = Math.min(1 + Math.ceil((stacks+1) * getRetainModifier("Wind") + pbHitstmp), 200);
    }
    else var nextStartingStacks = "";
    
    worldArray[cellNum].stacks = stacks;
    
    var chosenFormation;
    
    var cmp = ((stacks < 200 ? worldArray[cellNum].geoRelativeCellWorth : 0) + (nextStartingStacks < 190 ? worldArray[cellNum].PBWorth : 0)) * game.empowerments.Wind.getModifier() * dailyMult; //this uses nextStartingStacks which includes an approximation of how many more hits we need
    var cmpActual = ((stacks < 200 ? worldArray[cellNum].geoRelativeCellWorth : 0) + (nextStartingStacksCurrent < 200 ? worldArray[cellNum].PBWorth : 0)) * game.empowerments.Wind.getModifier() * dailyMult; //this is precise (used for display and record-keeping purposes)
    var cmpNextCapped = (stacks < 200 ? worldArray[cellNum].geoRelativeCellWorth : 0) * game.empowerments.Wind.getModifier() * dailyMult;
    if(worldArray[cellNum].corrupted == "corruptDodge") cmp *= 0.7; //dodge cells are worth less
    if(worldArray[cellNum].corrupted == "corruptDodge") cmpNextCapped *= 0.7; //dodge cells are worth less
    cmp = cmp / OmniThreshhold; //cmp is in OmniThreshhold units
    cmpActual = cmpActual / OmniThreshhold;
    cmpNextCapped = cmpNextCapped / OmniThreshhold; //cmp is in OmniThreshhold units
    
    calculateGravy(cellNum); //updates avgGravyRemaining left for zone
    
    var rushFlag = (worldArray[cellNum].corrupted == "healthyBleed" || worldArray[cellNum].corrupted == "corruptBleed" || worldArray[cellNum].corrupted == "corruptDodge");
    if(expectedNumHitsD > missingStacks || cmp < 1 || (cmpNextCapped < 1 && nextStartingStacks + expectedNumHitsDNextCell > 190) || rushFlag){ //we need more damage, or this cell isnt worth our time                
        chosenFormation = 2;
        
        if(avgGravyFull < 0.1) //wind zone suxxx full OK
            getDamageCaller(1.5*Math.max(requiredDmgToOK, requiredDmgToOKNext), false, true);
        else
            getDamageCaller(worldArray[cellNum].health/10, false);
        
        var wantToSwapShieldFlag = (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping'));
        if(wantToSwapShieldFlag)
            desiredShield = "good"; 
        
        //consider trimpicide for max stacks / equipping main shield. 2 scenarios: we're in a high zone where killing anything is hard and we need more damage, or we're in a semi hard zone thats not worth much and we wanna speed it up
        
        //shared requirements:
        if(hiddenBreedTimer > maxAnti && (effectiveShieldAtkMult < 3 || game.global.antiStacks < maxAnti-1) && !stackSpire && typeof game.global.dailyChallenge.bogged === 'undefined'){
            //scenario 1:
            if(DHratio < 3 && !holdingBack){
                if(wantToSwapShieldFlag)
                    shieldCheckedFlag = false;
                debug("Zone is hard. Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (wantToSwapShieldFlag ? " equip good shield" : ""));
                wantedAnticipation = maxAnti;
                stackConservingTrimpicide();
            }

            //scenario 2:
            var goodCellFlag = false;
            for (var i = cellNum; i < cellNum+10; i++){ //check if theres a single good cell in the next 10 cells
                if(i > 99)
                    continue
                if(worldArray[i].finalWorth > 1){
                    goodCellFlag = true;
                    break;
                }
            }
            var timeEstimate = timeEstimator(cellNum, true); //rough estimate of how long it will take to finish zone
            var nextZoneDHratio = parseFloat(DHratio) / (game.jobs.Magmamancer.getBonusPercent() * ((game.global.mapBonus * .2) + 1) * 2); //if this is low, we'll want to map at next zone, 
            var careAboutArmyReadyFlag = (game.global.world % 5 === 0 || nextZoneDHratio <= poisonMult * windMult);
            var timeFlag = timeEstimate > 50 || !careAboutArmyReadyFlag;
            if(!goodCellFlag && timeFlag){
                if(wantToSwapShieldFlag)
                    shieldCheckedFlag = false;
                debug("timeEstimate = " + timeEstimate);
                debug("Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (wantToSwapShieldFlag ? " equip good shield" : ""));
                wantedAnticipation = maxAnti;
                stackConservingTrimpicide();
                return;
            }        
            
        }
    }
    else if (expectedNumHitsX > missingStacks)
        chosenFormation = '0';
    else {
        chosenFormation = 4;
        setFormation(4);
        
        if (expectedNumHitsS < missingStacks-5){ //we have too much damage, lower our damage
            if(equipLowDmgShield()){
                //need to recalculate damages
                calcBaseDamageinS();
                updateAllBattleNumbers(true);
                ourAvgDmgS = baseDamage;
                ourAvgDmgD = ourAvgDmgS * 8;
                ourAvgDmgX = ourAvgDmgS * 2;

                expectedNumHitsS = enemyHealth / ourAvgDmgS;
                expectedNumHitsX = enemyHealth / ourAvgDmgX;
                expectedNumHitsD = enemyHealth / ourAvgDmgD;

                maxS = enemyMaxHealth / ourAvgDmgS;
                maxX = enemyMaxHealth / ourAvgDmgX;
                maxD = enemyMaxHealth / ourAvgDmgD;
                
                if (expectedNumHitsD > missingStacks)
                    chosenFormation = 2;
                else if (expectedNumHitsX > missingStacks)
                    chosenFormation = '0';
                else
                    chosenFormation = 4;
            }
            
            if(chosenFormation == 4 && (maxDesiredRatio > 1 || stackSpire)){
                if(stackSpire)
                    getDamageCaller(enemyMaxHealth/300, true); //attempt to lower our damage
                else
                    getDamageCaller(baseDamage/maxDesiredRatio, true); //attempt to lower our damage
                
                var wantToSwapShieldFlag = (goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping') && (maxDesiredRatio > 2 || stackSpire));
                if(wantToSwapShieldFlag)
                    desiredShield = "low";
                
                if (DHratio >= 3 && !stackSpire && (worldArray[cellNum].mutation == "Corruption" || worldArray[cellNum].mutation == "Healthy" || cellNum == 99) && typeof game.global.dailyChallenge.bogged === 'undefined'){ //if we still need less damage, consider trimpicide to remove anticipation stacks. never trimpicide against non colored cell
                    minAnticipationStacks = Math.ceil(Math.max(1, (5 + maxAnti)/maxDesiredRatio - 5)); //find desired stacks to reach maxDesiredRatio
                    var ourNewLowDamage = baseDamage*(1 + 0.2 * minAnticipationStacks)/((1 + 0.2 * game.global.antiStacks) * (wantToSwapShieldFlag ? 5 : 1));
                    var before = Math.min(stacks      + expectedNumHitsS, 200); //stacks if we dont trimpicide
                    var after  = Math.min(0.85*stacks + enemyHealth / ourNewLowDamage, 200); //stacks if we do trimpicide
                    //debug("before " + before.toFixed(0) + " after " + after.toFixed(0));
                    if(before <= after+10 && (game.global.antiStacks - minAnticipationStacks > 1 || effectiveShieldAtkMult > 3)){ 
                        
                            if(wantToSwapShieldFlag)
                                shieldCheckedFlag = false;
                            debug("trimpiciding " + minAnticipationStacks + " wantToSwapShield " + wantToSwapShieldFlag);
                            wantedAnticipation = minAnticipationStacks;
                            getTargetAntiStack(minAnticipationStacks, true);
                            return;
                        
                    }
                }
            }
        }
    }

    if (chosenFormation == '0' && game.global.soldierHealth < 0.66 * game.global.soldierHealthMax){ //dont swap to X if it will kill/almost kill us
        chosenFormation = 4;
    }
    
    goDefaultStance(chosenFormation);
    
    //check dmg last atk
    var lastDamageDealt = -1; //yes
    var critSpan = document.getElementById("critSpan").textContent;
    if(worldArray[cellNum].health !== lastMobHP){
        var lastDamageDealt = lastMobHP - worldArray[cellNum].health;
        lastMobHP = worldArray[cellNum].health;
    }
    
    stancePrintout(cellNum, stacks, nextStartingStacksCurrent, cmpActual, expectedNumHitsS, expectedNumHitsX, expectedNumHitsD, corruptedtmp, lastDamageDealt, critSpan);
}

function stancePrintout(cellNum, stacks, nextStartingStacks, cmp, expectedNumHitsS, expectedNumHitsX, expectedNumHitsD, corruptedtmp, lastDamageDealt, critSpan){
    var cellNumA = (cellNum === undefined ? 0 : cellNum);
    var stacksA = (stacks === undefined ? 0 : stacks);
    var nextStartingStacksA = (nextStartingStacks === undefined ? 0 : nextStartingStacks);
    var cmpA = (cmp === undefined ? 0 : cmp);
    var expectedNumHitsSA = (expectedNumHitsS === undefined ? 0 : expectedNumHitsS);
    var expectedNumHitsXA = (expectedNumHitsX === undefined ? 0 : expectedNumHitsX);
    var expectedNumHitsDA = (expectedNumHitsD === undefined ? 0 : expectedNumHitsD);
    var corruptedtmpA = (corruptedtmp === undefined ? 0 : corruptedtmp);
    var lastDamageDealtA = (lastDamageDealt === undefined ? 0 : lastDamageDealt);
    var critSpanA = (critSpan === "" ? 0 : critSpan);
    var critText;
    /*
     * if (critTier == -1) critSpan.innerHTML = "<span style='color: cyan'>Weak!</span>";
	if (critTier == 1) critSpan.innerHTML = "Crit!";
	if (critTier == 2) critSpan.innerHTML = "<span style='color: orange'>CRIT!</span>";
	if (critTier == 3){
		 critSpan.innerHTML = "<span style='color: red'>CRIT!!</span>";
    */
    
    if (critSpan === "")
        critText = "0";
    else if (critSpanA === "Crit!")
        critText = "1";
    else if (critSpanA === "CRIT!")
        critText = "2";
   
    var letter = " ";
    var displayDmg = baseDamage;
    switch (game.global.formation) {
        case 0:
            letter = 'X';
            displayDmg *= 2;
            break;
        case 2:
            letter = 'D';
            displayDmg *= 8;
            break;
        case 4:
            letter = 'S';
            break;
    }
    var shield = (highDamageHeirloom ? "+" : "-");
    var actualShield = (goodShieldActuallyEquipped ? "+" : "-");
    if(lastDamageDealtA > 0){
        var msg = shield+actualShield+game.global.world + "." + cellNumA + " " + stacksA+"W"+"("+nextStartingStacksA+") "+cmpA.toFixed(2)+" " + critText +"C " + expectedNumHitsSA.toFixed(0)+"/" + expectedNumHitsXA.toFixed(0)+"/" + expectedNumHitsDA.toFixed(0) + " " + game.global.antiStacks + letter + " " + corruptedtmpA + " " + effectiveShieldAtkMult.toFixed(2);
        if (!(lastDebug == msg))
            debug(msg, "general");
        lastDebug = msg;
    }
}

function getTargetAntiStack(target, firstRun){
    if(target < 1 || target > 45){
        debug("error target anti stacks out of bounds " + target);
        switchOnGA();
        trimpicide = false;
        return true;
    }

    var wantToSwap = ((desiredShield == "good" && !goodShieldActuallyEquipped) || (desiredShield == "low" && goodShieldActuallyEquipped))
    if (Math.abs(game.global.antiStacks-target) <= 1 && !wantToSwap){
        trimpicide = false;
        switchOnGA();
        return true;
    }
    
    if(firstRun){
        debug("desiredShield " + desiredShield + " goodShieldActuallyEquipped " + goodShieldActuallyEquipped);
        trimpicide = true;
        var deltaGenes = getDeltaGenes(minAnticipationStacks); //calculates how many geneticists we need to fire to be below minAnticipationStacks
        if(deltaGenes > 0){ //if we need to fire geneticists
            switchOffGA(); //pause autogeneticist  
            debug("Trimpiciding " + game.global.antiStacks + "->"+ minAnticipationStacks+ ". Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes));
            fireGeneticists(deltaGenes);
        }
        stackConservingTrimpicide();
        return false;
    }

    if(game.global.preMapsActive){
       if (!game.global.switchToMaps){
            mapsClicked();
        }
    }
    
    if(game.global.breedBack <= 0){ //breedback keeps track of our bred trimps. it starts from armysize/2 and counts down. when breedback trimps have been bred the geneticist bonus kicks in. that's what we're after.
        trimpicide = false; //we're done here
        switchOnGA();
        setFormation(4);
        fightManual();
        return true;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
        if (!game.global.switchToMaps){
            mapsClicked();
        }
        mapsClicked();
    }
    return false;
}

function getDeltaGenes(target){
    var timeLeft = getBreedTime(true);  //how much time untill we're full on trimps
    if (timeLeft < 1) timeLeft = maxAnti; //lets just assume GA sets this to maximum anticipation stacks
    var ratio = timeLeft / target;      
    
    var deltaGenes = -1 * Math.floor(Math.log(ratio) / Math.log(0.98)); //we need to fire this many genes to reach our target breed timer
    return deltaGenes;
}

function switchOnGA(){
    var steps = game.global.GeneticistassistSteps;
    var currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    if (currentStep == 3){
        //debug("switchOnGA: already on");
        return;
    }
    while(currentStep != 3){ //get to the last active GA mode
        toggleGeneticistassist();
        currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    }
    debug("Turned on AutoGeneticist");
}

function switchOffGA(){
    var steps = game.global.GeneticistassistSteps;
    var currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    if (currentStep == '0'){
        debug("switchOffGA: already off");
        return;
    }
    while(currentStep != '0'){ //get to the last active GA mode
        toggleGeneticistassist();
        currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    }
    debug("Turned off AutoGeneticist");
}

function stackConservingTrimpicide(){
    if ((game.global.formation == '0' && game.global.soldierHealth < 0.499 * game.global.soldierHealthMax) || (game.global.formation == 1 && game.global.soldierHealth < 0.249 * game.global.soldierHealthMax))
        goDefaultStance();
    else
        trimpicideNow();
}

function trimpicideNow(){
    if(!game.global.preMapsActive){
        if (!game.global.switchToMaps){
            mapsClicked();
        }
    }
    mapsClicked();
}

function fireGeneticists(howMany){
    if (howMany > game.jobs.Geneticist.owned){
        debug("error! not enough geneticists to fire " + howMany + " current" + game.jobs.Geneticist.owned);
        return;
    }
    game.global.buyAmt = Math.floor(howMany);
    game.global.firing = true;
    buyJob('Geneticist', true, true); 
    game.global.firing = false;
    
    //since we are directly handling game memory to fire geneticists, we have to call the breed() function to update both game.global.lastLowGen and game.global.lowestGen through updateStoredGenInfo(breeding)
    //if we don't do this we may as well be cheating.
    //TODO: fire the geneticists through more conventional means
    breed();
}

function buildWorldArray(){
    if (game.global.gridArray.length === 0){
        debug("grid is empty");
        return false;
    }
    
    worldArray = []; //create a world array that's safe to write to
    lastHealthyCell = -1;
    currentBadGuyNum = -1;
    
    calcGoodShieldAtkMult(); //bugfix for the game. we store the good shield's atk mult so we can later add it manually
    
    var dailyHPMult = 1;
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badHealth !== 'undefined')
                dailyHPMult *= dailyModifiers.badHealth.getMult(game.global.dailyChallenge.badHealth.strength);
        if (typeof game.global.dailyChallenge.empower !== 'undefined')
            dailyHPMult *= dailyModifiers.empower.getMult(game.global.dailyChallenge.empower.strength, game.global.dailyChallenge.empower.stacks);
    }
    
    minHP = game.global.getEnemyHealth(90, "", true) * mutations.Healthy.statScale(14) * 7.5 * dailyHPMult; //initialize to healthyTough enemy on cell 90, because why not
    maxHP = -1;
    
    for (var i = 0; i < 100; i++){
        var enemy = {mutation : "", finalWorth : "", corrupted : "", name : "", health : "", maxHealth : "", stacks : "", pbHits : "", nextPBDmg : "", baseWorth : "", geoRelativeCellWorth : "", PBWorth : ""};
        enemy.name = game.global.gridArray[i].name;
        enemy.mutation = game.global.gridArray[i].mutation;
        if(enemy.mutation == "Healthy") 
            lastHealthy = i;
        else if(enemy.mutation == "Corruption") 
            lastCorrupt = i;
        enemy.corrupted = game.global.gridArray[i].corrupted;
        
        var mutationMult;
        switch(enemy.mutation){
            case "Corruption":
                mutationMult = mutations.Corruption.statScale(10);
                enemy.baseWorth = 0.15;
                break;
            case "Healthy":
                mutationMult = mutations.Healthy.statScale(14);
                enemy.baseWorth = 0.45;
                break;
            default:
                mutationMult = 1;
                enemy.baseWorth = (enemy.name == "Omnipotrimp" ? 1 : 0);
        }
        
        enemy.maxHealth = game.global.getEnemyHealth(i, enemy.name, true) * mutationMult; //ignore imp stat = true. corrupted/healthy enemies get their health from mutation not their baseimp
        if(game.global.spireActive)
            enemy.maxHealth = getSpireStats(i+1, enemy.name, "health");
        enemy.maxHealth *= dailyHPMult;
        
        if (enemy.corrupted == "corruptTough") enemy.maxHealth *= 5;
        if (enemy.corrupted == "healthyTough") enemy.maxHealth *= 7.5;
        
        if (game.global.challengeActive == "Obliterated"){
            var oblitMult = Math.pow(10,12);
            var zoneModifier = Math.floor(game.global.world / 10);
            oblitMult *= Math.pow(10, zoneModifier);
            enemy.maxHealth *= oblitMult;
        }
 
        enemy.health = enemy.maxHealth;
        if(maxHP < enemy.maxHealth)
            maxHP = enemy.maxHealth;
        
        if(enemy.mutation != undefined && (enemy.mutation == "Corruption" || enemy.mutation == "Healthy") && game.global.world >= mutations.Corruption.start(true)){
            if(minHP > enemy.maxHealth)
                minHP = enemy.maxHealth;
        }

        worldArray.push(enemy);
    }
    worldArray[99].maxHealth = game.global.getEnemyHealth(99, "Omnipotrimp", false) * mutations.Corruption.statScale(10) * dailyHPMult; //ignore imp stat = false
    if(game.global.spireActive)
        worldArray[99].maxHealth = getSpireStats(i+1, worldArray[99].name, "health") * dailyHPMult;
    worldArray[99].health = worldArray[99].maxHealth;
    
    if (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        minHP = game.global.gridArray[0].maxHealth;
        maxHP = game.global.gridArray[0].maxHealth;
        for (var i = 1; i < 100; i++)
            worldArray[i].finalWorth = 0;
        return;
    }
    
    if(minHP == game.global.getEnemyHealth(50, "", true) * mutations.Healthy.statScale(14) * 7.5 || maxHP == -1)
        debug("error! minHP = " + minHP + " maxHP = " + maxHP);
    
    equipLowDmgShield();
    calcBaseDamageinS();
    
    var pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0); //weaker shield should have more PB. PB isnt that good of a damage modifier.
    
    equipMainShield();
    calcBaseDamageinS();
    updateAllBattleNumbers(true);
    
    var baseDamageGood = baseDamage;
    if(!goodShieldActuallyEquipped)
        baseDamageGood *= effectiveShieldAtkMult;
    
    //debug("heirloom diff is " + (baseDamageGood / baseDamageBad).toFixed(2), "general");
    
    maxStacksBaseDamageD = 8 * baseDamageGood * (1+0.2*maxAnti) / (1 + 0.2*game.global.antiStacks); //45 stacks D stance good heirloom damage. The most damage we can dish out right now
    maxDesiredRatio = maxStacksBaseDamageD/(maxHP * 0.2); //we use this number to figure out coordination purchases and weapon prestige/leveling to balance our damage
    
    //next we want to calculate a value for each cell based on the healthy/corrupted/empty/omni distribution of the zone. this will be used to decide if a cell is worth spending any attacks on

    if(game.global.world % 5 > 0){ //on wind zones that arent the last
        //if we will map on next zone, dont give omni credit for next zone stacks because we'll lose them anyway from entering maps
        var nextZoneDHratio = parseFloat(DHratio) / (game.jobs.Magmamancer.getBonusPercent() * ((game.global.mapBonus * .2) + 1) * 2);
        if(nextZoneDHratio > poisonMult * windMult)
            worldArray[99].geoRelativeCellWorth = (1 + 0.2*mutations.Healthy.cellCount()) * game.empowerments.Wind.getModifier(); //we want to reflect the worth of the starting cells in next zone. in high zones this is worth a lot due to healthy cells. in low zones very little
        else
            worldArray[99].geoRelativeCellWorth = game.empowerments.Wind.getModifier();
    }   
    else
        worldArray[99].geoRelativeCellWorth = game.empowerments.Wind.getModifier(); //we want to reflect the worth of the starting cells in next zone. in high zones this is worth a lot due to healthy cells. in low zones very little    
    worldArray[99].PBWorth = 0; //PB doesnt get carried over to next zone
    worldArray[99].finalWorth = worldArray[99].geoRelativeCellWorth * dailyMult;
    for(var i = 98; i >= 0; i--){
        worldArray[i].geoRelativeCellWorth = (worldArray[i].baseWorth + getRetainModifier("Wind") * worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].PBWorth = pbMult * worldArray[i+1].geoRelativeCellWorth;
        worldArray[i].finalWorth = (worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier() * dailyMult; //this is in Omnipotrimps units
    }
        
    stanceStats = {OmnisPerAttack : 0, attacks : 0, enemyLastHP : -1, lastCell : "", OmnisWorths : 0, lastStacks : 0, wastedStacks : 0, lastNextStartingStacks : 0, wastedPBs : 0, trimpicides : 0}; //keep track of how well we're doing
    calcOmniHelium();
    
    calculateGravy(0);
    
    if(!isNaN(m) && !game.global.runningChallengeSquared)
        debug("Zone " + game.global.world + " Omni/atk Goal: "+OmniThreshhold.toFixed(2)+" ("+ m.toExponential(2)+ ") zone worth = " + avgGravyFull.toFixed(2));
    else
        debug("Zone " + game.global.world);
    
    return true;
}

function calcOmniHelium(){ //rewardResource()
    var zone = game.global.world;
    var AA = 1.35*(zone-19);
    var AAA = Math.pow(1.23, Math.sqrt(AA));
    var a = Math.floor(AA+AAA);
    var b = 15;
    var c = 2;
    var d = Math.pow(1.005, zone);
    var e = 1;
    var f = game.goldenUpgrades.Helium.currentBonus + 1;
    var g = 1+0.05*game.portal.Looting.level;
    var h = 1+0.0025*game.portal.Looting_II.level;
    var spireRowBonus = (game.talents.stillRowing.purchased) ? 0.03 : 0.02;
    var i = 1 + (game.global.spireRows * spireRowBonus);
    var j = 1;
    var k = (game.global.totalSquaredReward / 1000) + 1;
    var fluffyBonus = Fluffy.isRewardActive("helium");
    var l = 1 + (fluffyBonus * 0.25);
    var heliumy = game.singleRunBonuses.heliumy.owned ? 1.25 : 1;
    
    m = a*b*c*d*e*f*g*h*i*j*k*l*heliumy; //Omnipotrimp helium
    hr = m * 60 * 60 * 1/(Math.pow(0.95, 20) - 0.1); //if we kill Omni every attack how much he/hr we'll have

    updateOmniThreshhold();
}

function updateOmniThreshhold() {
    pctTotal = (100*hr/game.global.totalHeliumEarned); //which is this much he/hr% out of our total helium
    
    if (getDailyHeliumValue(countDailyWeight()) / 100 == 2) //no daily
        dailyMult = 1;
    else
        dailyMult = 1 + getDailyHeliumValue(countDailyWeight()) / 100;
    
    //if(dailyMult > 1){
    //    pctTotal = pctTotal*dailyMult;
    //}
    Goal = getPageSetting('WindStackingPctHe');
    if(Goal == -1) Goal = 0.5;
    OmniThreshhold = Goal/pctTotal; //this is how many Omnis' worth of helium we need to get on each attack in order to meet our he%/hr quota
}

function calculateGravy(fromCellNum){
    var sum = 0;
    var sumFull = 0;
    if(windZone()){
        for (var i = fromCellNum; i <= 99; i++)
            if(worldArray[i].finalWorth/OmniThreshhold > 1)
                sum += worldArray[i].finalWorth/OmniThreshhold - 1;
        for (var i = 0; i <= 99; i++)
            if(worldArray[i].finalWorth/OmniThreshhold > 1)
                sumFull += worldArray[i].finalWorth/OmniThreshhold - 1;    
    }
    avgGravyFull = sumFull / 100;
    avgGravyRemaining = sum / (100 - fromCellNum + 1);
}

//var buyWeaponsModeAS3; //1: prestige till -1 and level 2: 2: buy levels only 3: get all
function getDamage(dmg, lowerDamage, noCrit){
    equipMainShield(); //always start calculations with the good shield
    calcBaseDamageinS(); //this incoorperates damage that will only be updated on next cell
    var modifier = 1;
    //if(!goodShieldActuallyEquipped)
    //    modifier = goodShieldAtkMult; //calculate automaps damage as though we were wearing our good shield, because we can always trimpicide and swap to it
    
    updateAllBattleNumbers(true);
    var dmgToCheck = (noCrit ? baseDamageNoCrit : baseDamage) * modifier;
    
    holdingBack = true;
    
    if (baseDamage <= 0) {
        debug("getDamage baseDamage is 0");
        return;
    }
    
     if(game.global.runningChallengeSquared){
        buyWeaponsModeAS3 = 3;
        autoLevelEquipmentCaller(lowerDamage, true); 
        holdingBack = false;
        return;
    }
    
    if (!game.global.spireActive && game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        if(dmgToCheck*8 >= dmg){
            buyWeaponsModeAS3 = 0;
        }
        else
            buyWeaponsModeAS3 = 3;
        autoLevelEquipmentCaller(lowerDamage, true);
        return;
    }
    
    if (dmgToCheck*8 >= dmg) //we have enough damage, run autoLevelEquipment once for armor/gyms only
        buyWeaponsModeAS3 = 0;
    
    var dmgLast = 0;
    var maxLoop = 50;
    
    while (dmgLast != dmgToCheck && maxLoop-- > 0){
        dmgLast = dmgToCheck;
        autoLevelEquipmentCaller(lowerDamage);
        calcBaseDamageinS(); 
        dmgToCheck = (noCrit ? baseDamageNoCrit : baseDamage) * modifier;
        if (dmgToCheck*8 >= dmg) //have enough damage
            return;
    }
    
    if (buyWeaponsModeAS3 < 2){
        buyWeaponsModeAS3 = 2; //allow buying equipment levels but not prestige
        getDamage(dmg, lowerDamage, noCrit)
    }
    
    if (dmgToCheck*8 >= dmg) //have enough damage
        return;
    
    if (buyWeaponsModeAS3 < 3){
        buyWeaponsModeAS3 = 3; //allow buying equipment levels and prestiges
        getDamage(dmg, lowerDamage, noCrit)
    }
    
    if (dmgToCheck*8 >= dmg) //have enough damage
        return;
    
    if(maxLoop > 0 && windZone()){// && currentBadGuyNum != cellNum){ //need more damage, buy coordinates
        //currentBadGuyNum = cellNum; //newly bought coordination doesnt take effect until next enemy, so only buy 1 coordination per enemy.
        allowBuyingCoords = true;
        maxCoords = game.upgrades.Coordination.done + 1;
        if(game.upgrades.Coordination.done == maxCoords)
            debug("Autostance3: allowing buying coord Wind #" + maxCoords + " on " + game.global.world + "." + cellNum);
        maxCoords = game.upgrades.Coordination.done + 1;
    }
    
    holdingBack = false;
}

//returns us to our original heirloom after calling getDamage
function getDamageCaller(dmg, lowerDamage, noCrit){
    originallyEquippedShield = highDamageHeirloom;
    if(!highDamageHeirloom){
        equipMainShield(); //always start calculations with the good shield
        calcBaseDamageinS(); //this incoorperates damage that will only be updated on next cell
    }
    
    getDamage(dmg, lowerDamage, noCrit);
    
    if (!originallyEquippedShield){
        equipLowDmgShield(); //always start calculations with the good shield
        calcBaseDamageinS(); //this incoorperates damage that will only be updated on next cell
        updateAllBattleNumbers(true);
    }
}

function goDefaultStance(chosenFormation){
    var formation = 2;
    if(chosenFormation !== undefined)
        formation = chosenFormation;
    
    if(getPageSetting('UseScryerStance')){ //TODO: implement the rest of scryer settings behavior
        setFormation(4);
        return;
    }
    //if(!game.global.spireActive)
    if(game.upgrades.Dominance.done)
        setFormation(formation);
    else
        setFormation("0");
}
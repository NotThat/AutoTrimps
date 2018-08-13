//MODULES["stance"] = {};
var currentBadGuyNum;
var lastZoneGridded = -1;
var coordBuyThreshold;
//var buyWeaponsMode = (getPageSetting('DelayWeaponsForWind') ? 0 : 3); //0: buy nothing, only prestige if it lowers our damage. 1: prestige till 1 before max prestige and level 2: prestige only 3: buy everything
var maxCoords = -1;
var trimpicide = false;
var minAnticipationStacks;
var worldArray = [];
var lastHealthy = 0;
var lastCorrupt = 0;

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
var zoneWorth = 0;
var maxStacksBaseDamageD;
var baseDamageNoCrit;
var baseDamageCritOnly;
var maxDesiredRatio;
var lastDebug;
var cellLastHealth = 0;
var holdingBack = true;
var originallyEquippedShield = true;
var goodShieldAtkMult = 1;
var effectiveShieldAtkMult = 1;
var lowShieldPB = 0;
var goodShieldActuallyEquipped; //bugfix
var lastMobHP = -1;
var stackSpireNoMoreDamageCell = -1;

//stats keeping
var stanceStats = [];
setEmptyStats();

var stacksAtDeath = 0;
var wastedStacksAtEnd = 0;
var wastedStacksAtStart = 0;
var shieldUsedAtCellDeath = 0;
var trimpicides = 0;
var timeDead = 0;
var lastNextStartingStacksCurrent = 0;
var wantLessDamage = false;
var wantMoreDamage = false;

var lastHiddenBreedTimer = -1;
var shieldCheckedFlag = false;
var desiredShield;
var negativeDamageCounter = 0;
var easyRatioThreshold = 10;

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
    
    baseDamage = parseFloat(trimpATK);
    
    baseBlock = game.global.soldierCurrentBlock;
    baseHealth = game.global.soldierHealthMax;

    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.

    if (game.global.formation == 3) baseBlock /= 4; //B stance
    else if (game.global.formation != "0") baseBlock *= 2;
    if (game.global.formation == 1) baseHealth /= 4; //H stance 
    else if (game.global.formation != "0") baseHealth *= 2;
}

function autoStance() {
    if (game.global.gridArray.length === 0) return false; //zone didnt initialize yet
    if(game.global.autoBattle && game.global.pauseFight) pauseFight(); //autofight on
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var nextCell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum + 1] : game.global.gridArray[cellNum + 1];
    
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 5);

    if(lastCell == -1){ //new save load or new zone
        setEmptyStats(); //also clears graph data
        lastCell = cellNum; 
    }
    
    if(lastCell != cellNum && !game.global.mapsActive && windZone()){ //new enemy
        if(cellNum != 0)
            saveStats(cellNum);
        
        if(windZone() && getPageSetting('ForceUpdateGraph') && document.getElementById('graphParent').style.display === "block"){ //graph window is open    
            if(!chart1 || !chart1.series[0] || chart1.series[0].points.length === 0)
                drawGraph(); //draw initial graph
            updateLastPoint(lastCell);
        }
        
        /*if(stackSpire){
            debug("Spire Bonus should be: " + checkSpireValue(lastCell, stanceStats.stacks[lastCell], true).toExponential(2));
            debug("Regular should be: " + checkSpireValue(lastCell, stanceStats.stacks[lastCell], false).toExponential(2));
        }*/
        lastCell = cellNum;
    }
    
    if (game.global.world == getPageSetting('VoidMaps') || BWRaidNowLogic() || PRaidingActive || !getPageSetting('DelayWeaponsForWind'))
        buyWeaponsMode = 3; //buy everything
    else
        buyWeaponsMode = 0; //buy nothing
    
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
    
    var enemyHealth = cell.health;  //current health
    var enemyMaxHealth = cell.maxHealth; //in future can do some prediction with plaguebringer and expected minimum enemy max health of world zone
    
    if(baseDamage < 0 || game.global.soldierCurrentAttack < 0){
        var wrongDamage = game.global.soldierCurrentAttack;
        if(!game.global.preMapsActive && !game.global.switchToMaps)
            mapsClicked();
        if(!game.global.preMapsActive)
            mapsClicked();
        if(game.global.preMapsActive)
            mapsClicked();
        calcBaseDamageinS();
        checkShield();
        trimpicides++;
        debug("Damage error! Negative damage " + wrongDamage.toExponential(2));
        debug("Trimpiciding to set things straight.");
        return; 
    }
    /*if(effectiveShieldAtkMult > goodShieldAtkMult*1.05){
        debug("Game damage bug. We currently have " + (100*effectiveShieldAtkMult/goodShieldAtkMult).toFixed(2) +"% of the damage that we should.");
        debug("Trimpiciding to make things straight.");
        if(!game.global.preMapsActive && !game.global.switchToMaps)
            mapsClicked();
        if(!game.global.preMapsActive)
            mapsClicked();
        if(game.global.preMapsActive)
            mapsClicked();        
    }*/
    
    
    if(game.global.spireActive && !stackSpire){ //in spire and we arent stacking it
        if(game.global.mapsActive || game.global.preMapsActive)
            return;
        if(game.global.spireDeaths === 0 && hiddenBreedTimer > maxAnti && (game.global.antiStacks < maxAnti-1 || (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')))){ //1 death if we need stacks and/or heirloom swap
            if(!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping'))
                debug("game damage bug. current applied shield attack is " + effectiveShieldAtkMult.toFixed(2) + ", should be " + goodShieldAtkMult.toFixed(2));
            debug("Spire: Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + ((!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')) ? " equip good shield" : ""));
            wantedAnticipation = maxAnti;
            if (!game.global.switchToMaps)
                mapsClicked();
            if(!game.global.preMapsActive)
                mapsClicked();
            if(game.global.preMapsActive)
                mapsClicked();
            trimpicides++;
        }
        if (game.global.soldierHealth <= 0 && game.global.spireDeaths <= 2 && !isActiveSpireAT()) //if not activespireAT, we can give 2 deaths for speedup. probably wont need the lives
            fightManual();
        
        allowBuyingCoords = true;
        if(game.global.world == 400 && game.global.challengeActive == "Daily"){ //spire3 special case in dailies. a bit more conservative here so we can more easily farm low 400s
            var timeGoal = getPageSetting('Spire3Time'); //how long we wish to spend in spire3
            if (timeGoal < 1 || isNaN(timeGoal)) timeGoal = 1;
            var totalHealth = 0;
            for (var i = 0; i < 100; i++)
                totalHealth += worldArray[i].maxHealth;
            var desiredDamage = Math.min(totalHealth/(8*timeGoal), 1.5*dmgNeededToOK(cellNum));
            getDamageCaller(desiredDamage, false);
        }
        else
            getDamageCaller(1.5*dmgNeededToOK(cellNum), false, true);
        
        //spire gets its own fightManual() condition
        if (game.global.soldierHealth <= 0 && game.global.challengeActive == "Trapper" || (game.global.breedBack <= 0 && (hiddenBreedTimer > wantedAnticipation || typeof game.global.dailyChallenge.empower === 'undefined')))
            fightManual();
        
        if(windZone())
            stacksAtDeath = game.empowerments.Wind.currentDebuffPower; //bookkeeping
        
        return; //beyond this point, only spire is a stacked spire4
    }
    
    if (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        getDamageCaller(maxHP*1000000, false);
        allowBuyingCoords = true;
        if (game.global.soldierHealth <= 0)
            fightManual();
        return;
    }

    updateOmniThreshhold();
    
    if(enemyHealth == -1){ //new zone, game didnt generate first enemy yet, so use our own
        enemyHealth = worldArray[cellNum].maxHealth;
        enemyMaxHealth = enemyHealth;
    }
    worldArray[cellNum].health = enemyHealth; //is there a reason why we should calculate this earlier?
    
    allowBuyingCoords = !getPageSetting('DelayCoordsForWind'); //dont buy coords unless we explicitly permit it. automaps() can also allow it if player runs a map for ratio.

    if (game.global.soldierHealth <= 0){ 
        if (game.global.challengeActive == "Trapper" || (game.global.breedBack <= 0 && (hiddenBreedTimer > wantedAnticipation || typeof game.global.dailyChallenge.empower === 'undefined')) || (DHratio > easyRatioThreshold && !stackSpire)){
            if(typeof game.global.dailyChallenge.bogged !== 'undefined' && parseFloat(DHratio) > 10 && !stackSpire){ //bogged is special because death occurs all the time
                equipLowDmgShield();
            }
            fightManual();
        }
        else
            timeDead += 0.1;
        return;
    }
    
    if(game.global.mapsActive)
        return;
    
    var requiredDmgToOK = dmgNeededToOK(cellNum); //how much dmg we need to fully OK on this/next attack
    
    if (typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.preMapsActive && !game.global.mapsActive)
        if(aboutToDie()) //dont die in world on empowered dailies
            return;
    
    if(game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting) == 0)
        switchOnGA(); //in rare cases we leave GA disabled, so make sure to turn it back on
    
    if(!windZone()){ 
        desiredShield = "good";
        
        allowBuyingCoords = true;
        if(windZone(game.global.world + 1) && cellNum > 50) //if next zone is a wind zone, dont instantly buy the coordination in case we want to save it.
            allowBuyingCoords = false;
        
        //here we need to decide how much damage we want in non wind zones.
        //this depends on zoneWorth. if its low we want full overkill
        //if its high, we aim to reach the first wind zone with limit DHratio.
        if(zoneWorth < 1 || game.global.world < 236)
            getDamageCaller(1.5*requiredDmgToOK, false, true);
        else{
            var limit = 20;
            var zonesToWind = (150000 - game.global.world) % 15 + 1; //how many zones to go until we hit wind
            var maxDHratio = limit * Math.pow(2, zonesToWind); //maximum DHratio we want right now
            var currDHratio = parseFloat(DHratio);
            
            //debug("eff " + effectiveShieldAtkMult.toFixed(2) + " / " + goodShieldAtkMult);
            var wantDmg = 8*baseDamage*maxDHratio/currDHratio * goodShieldAtkMult/effectiveShieldAtkMult; //unfortunately we can not hit exact damages because of the game bug
            var parsedMaxDHratio = (maxDHratio > 10000 ? maxDHratio.toExponential(2) : maxDHratio.toFixed(0))
            if(local)
                debug(game.global.world + " maxDHratio: " + parsedMaxDHratio + " wantDmg: " + wantDmg.toExponential(2) + " current: " + (8*baseDamage).toExponential(2));
            getDamageCaller(wantDmg, false, true);
        }
        
        //consider trimpicide for max stacks / equip high damage heirloom
        var timeEstimate = timeEstimator(cellNum, true); //rough estimate of how long it will take to finish zone
        var timeFlag = timeEstimate > 50 || parseFloat(DHratio)*2 < easyRatioThreshold;
        if(timeFlag && hiddenBreedTimer > maxAnti && (game.global.antiStacks < maxAnti-1 || (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')))){
            debug("Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + ((!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping')) ? " get correct shield bonus" : ""));
            wantedAnticipation = maxAnti;
            if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){
                if (!game.global.switchToMaps){
                    mapsClicked();
                }
                if(!game.global.preMapsActive)
                    mapsClicked();
                if(game.global.preMapsActive)
                    mapsClicked();
            }
            trimpicides++;
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
    
    //dont wanna worry about last cell all the time, so keep it simple
    var nextPBDmgtmp = (cellNum == 99 || nextCell.plaguebringer === undefined ? 0 : nextCell.plaguebringer);
    var pbHitstmp = (cellNum == 99 || nextCell.plagueHits === undefined ? 0 : Math.ceil(nextCell.plagueHits));
    var corruptedtmp = (cell.corrupted === undefined ? "none" : cell.corrupted);
    
    var pbMult = lowShieldPB;
    if(cellNum < 99){
        worldArray[cellNum+1].health = Math.max(worldArray[cellNum+1].maxHealth - nextPBDmgtmp, 0.05*worldArray[cellNum+1].maxHealth); //extra damage on next cell from PB
        worldArray[cellNum+1].pbHits = pbHitstmp; //extra wind stacks on next cell from PB
        var nextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind") + pbHitstmp + expectedNumHitsD * (pbMult + getRetainModifier("Wind")) + Math.ceil(worldArray[cellNum+1].health/ourAvgDmgD)), 200);
        var nextStartingStacksCurrent = Math.min(1 + Math.ceil((stacks+1) * getRetainModifier("Wind") + pbHitstmp), 200);
        if(cellNum == 80){
            if(nextZoneDHratio <= poisonMult * windMult && worldArray[99].geoRelativeCellWorth > 0){
                worldArray[99].geoRelativeCellWorth = 0; //need to update previous cells as well
                if(local)
                    debug("cell 99 not worth for next zone");
                for(var i = 98; i>80; i++){
                    worldArray[i].geoRelativeCellWorth = getRetainModifier("Wind") * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
                    worldArray[i].PBWorth = pbMult * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
                    worldArray[i].finalWorth = (worldArray[i].baseWorth + worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshhold; //this is in Omnipotrimps units
                }
            }
        }
    }
    else {
        var nextStartingStacks = 2+Math.ceil(stacks * getRetainModifier("Wind"));
        var nextStartingStacksCurrent = 2+Math.ceil(stacks * getRetainModifier("Wind"));
        if(game.global.world % 5 === 0){nextStartingStacks = 0; nextStartingStacksCurrent = 0};
    }
    
    var chosenFormation;
    
    var cmp = 0; //cmp uses nextStartingStacks which includes an approximation of how many more hits we need
    var cmpActual = 0; //this is precise (used for display)
    
    if(stacks < 192)
        cmp += worldArray[cellNum].baseWorth;
    if(nextStartingStacks < 194)
        cmp += worldArray[cellNum].PBWorth;
    if(stacks < 192 && nextStartingStacks < 194)
        cmp += worldArray[cellNum].geoRelativeCellWorth;
    
    if(stacks < 200)
        cmpActual += worldArray[cellNum].baseWorth;
    if(nextStartingStacksCurrent < 200)
        cmpActual += worldArray[cellNum].PBWorth;
    if(stacks < 200 && nextStartingStacksCurrent < 200)
        cmpActual += worldArray[cellNum].geoRelativeCellWorth;
    
    //var cmp = (worldArray[cellNum].baseWorth + (stacks < 200 ? worldArray[cellNum].geoRelativeCellWorth : 0) + (nextStartingStacks < 190 ? worldArray[cellNum].PBWorth : 0)) * game.empowerments.Wind.getModifier() * dailyMult; //this uses nextStartingStacks which includes an approximation of how many more hits we need
    //var cmpActual = (worldArray[cellNum].baseWorth + (stacks < 200 ? worldArray[cellNum].geoRelativeCellWorth : 0) + (nextStartingStacksCurrent < 200 ? worldArray[cellNum].PBWorth : 0)) * game.empowerments.Wind.getModifier() * dailyMult; //this is precise (used for display and record-keeping purposes)
    
    if(worldArray[cellNum].corrupted == "corruptDodge" && !stackSpire) {cmp *= 0.7; cmpActual *= 0.7;} //dodge cells are worth less
    cmp       *= game.empowerments.Wind.getModifier() * dailyMult / OmniThreshhold; //cmp is in OmniThreshhold units
    cmpActual *= game.empowerments.Wind.getModifier() * dailyMult / OmniThreshhold;
    
    calculateZoneWorth(cellNum);
    
    //we have high shield here
    var currRatio = parseFloat(DHratio);
    var limit = 10;
    if(stackSpire){ //getDamageCaller(worldArray[(game.global.lastClearedCell + 1)].maxHealth / 500, true, false);
        if(cellNum < 99){
            if(checkForGoodCell(cellNum))
                getDamageCaller(worldArray[cellNum+1].maxHealth / 200, true, false);
            else{
                getDamageCaller(worldArray[cellNum+1].maxHealth*2, true, false);
                maxCoords = game.upgrades.Coordination.done + 1;
            }
        }
        else
            getDamageCaller(worldArray[cellNum].maxHealth / 20, true, false);
        
        //stackSpire trimpicide
        var needDamageFlag = baseDamage < worldArray[cellNum].maxHealth / 400;
        var wantToSwapShieldFlag = (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping'));
        if(needDamageFlag && hiddenBreedTimer > maxAnti && (wantToSwapShieldFlag || game.global.antiStacks < maxAnti-1) && typeof game.global.dailyChallenge.bogged === 'undefined'){
            debug("Need more damage for spire. Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (wantToSwapShieldFlag ? " equip good shield" : ""));
            wantedAnticipation = maxAnti;
            stackConservingTrimpicide();
            trimpicides++;
        }
    }
    else if (currRatio < limit) //if DHratio falls below limit, we allow buying of gear and coordinates to get it
        getDamageCaller(8*baseDamage * limit / currRatio * goodShieldAtkMult/effectiveShieldAtkMult, false);
    
    wantMoreDamage = false; //book keeping
    wantLessDamage = false; //book keeping
    
    if(stacks < 185 && nextStartingStacks < 180 && zoneWorth > 0.8 && expectedNumHitsS < missingStacks-5 && (stackSpire ? worldArray[cellNum].finalWorth > 1 : worldArray[cellNum].baseWorth > 0 && cmp > 1))
        wantLessDamage = true;
    
    var boggedFlag = (typeof game.global.dailyChallenge.bogged !== 'undefined' && parseFloat(DHratio) > 10);
    var rushFlag = !stackSpire && !boggedFlag && (worldArray[cellNum].corrupted == "healthyBleed" || worldArray[cellNum].corrupted == "corruptBleed" || worldArray[cellNum].corrupted == "corruptDodge");
    if(expectedNumHitsD > missingStacks || cmp < 1 || rushFlag){ //we need more damage, or this cell isnt worth our time                
        
        //when we use high damage shield to hit a cell it could lower its cmp a bit if our main shield has less plaguebringer than our low shield. lets adjust cell PBWorth accordingly.
        /*pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
        if(cellNum < 99)
            worldArray[cellNum].PBWorth = pbMult * (worldArray[cellNum+1].baseWorth + worldArray[cellNum+1].geoRelativeCellWorth);
        else
            worldArray[cellNum].PBWorth = 0;*/
        
        //if(stacks >= 200 || nextStartingStacks >= 200)
        if(stacks >= 200)
            wantMoreDamage = true;
        
        chosenFormation = 2;
        
        //consider trimpicide for max stacks / equipping main shield. 2 scenarios: we're in a high zone where killing anything is hard and we need more damage, or we're in a semi hard zone thats not worth much and we wanna speed it up
        var wantToSwapShieldFlag = (!goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping'));
        if(wantToSwapShieldFlag)
            desiredShield = "good"; 
        //shared requirements:
        if(hiddenBreedTimer > maxAnti && (wantToSwapShieldFlag || game.global.antiStacks < maxAnti-1) && !stackSpire && typeof game.global.dailyChallenge.bogged === 'undefined'){
            //scenario 1:
            if(DHratio < 3){
                if(wantToSwapShieldFlag)
                    shieldCheckedFlag = false;
                debug("Zone is hard. Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (wantToSwapShieldFlag ? " equip good shield" : ""));
                wantedAnticipation = maxAnti;
                stackConservingTrimpicide();
                trimpicides++;
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
            var careAboutArmyReadyFlag = (game.global.world % 5 === 0 || nextZoneDHratio <= poisonMult * windMult);
            var timeFlag = timeEstimate > 50 || parseFloat(DHratio)/2 > easyRatioThreshold || !careAboutArmyReadyFlag;
            if(!goodCellFlag && timeFlag && zoneWorth >= 0.1){
                if(wantToSwapShieldFlag)
                    shieldCheckedFlag = false;
                debug("timeEstimate = " + timeEstimate.toFixed(0) +"s");
                debug("Trimpiciding to" + (game.global.antiStacks < maxAnti-1 ? " get max stacks" : "") + (wantToSwapShieldFlag ? " equip good shield" : ""));
                wantedAnticipation = maxAnti;
                stackConservingTrimpicide();
                trimpicides++;
                return;
            }        
        }
        
        if(zoneWorth < 0.1) //wind zone suxxx full OK
            getDamageCaller(1.5*requiredDmgToOK, false, true);
        if(stackSpire && expectedNumHitsD > missingStacks && stackSpireNoMoreDamageCell != cellNum){
            getDamageCaller(1.2*8*baseDamage, false, true);
            stackSpireNoMoreDamageCell = cellNum;
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
                
                //update cell PBWorth to current plaguebringer value
                /*pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
                if(cellNum < 99)
                    worldArray[cellNum].PBWorth = pbMult * (worldArray[cellNum+1].baseWorth + worldArray[cellNum+1].geoRelativeCellWorth);
                else
                    worldArray[cellNum].PBWorth = 0;*/
            }
            
            if(chosenFormation == 4 && (maxDesiredRatio > 1 || stackSpire)){
                
                getDamageCaller(baseDamage * limit / currRatio * effectiveShieldAtkMult, true); //attempt to lower our damage
                
                var wantToSwapShieldFlag = (goodShieldActuallyEquipped && getPageSetting('HeirloomSwapping') && (maxDesiredRatio > 2 || stackSpire));
                if(wantToSwapShieldFlag)
                    desiredShield = "low";
                
                if (zoneWorth > 0.8 && game.global.antiStacks > 1 && DHratio >= 3 && !stackSpire && (worldArray[cellNum].mutation == "Corruption" || worldArray[cellNum].mutation == "Healthy" || cellNum == 99) && typeof game.global.dailyChallenge.bogged === 'undefined'){ //if we still need less damage, consider trimpicide to remove anticipation stacks. never trimpicide against non colored cell
                    minAnticipationStacks = Math.ceil(Math.max(1, (5 + maxAnti)/maxDesiredRatio - 5)); //find desired stacks to reach maxDesiredRatio
                    var ourNewLowDamage = baseDamage*(1 + 0.2 * minAnticipationStacks)/((1 + 0.2 * game.global.antiStacks) * (wantToSwapShieldFlag ? 5 : 1));
                    var before = Math.min(stacks      + expectedNumHitsS, 200); //stacks if we dont trimpicide
                    var after  = Math.min(0.85*stacks + enemyHealth / ourNewLowDamage, 200); //stacks if we do trimpicide
                    //debug("before " + before.toFixed(0) + " after " + after.toFixed(0));
                    if(before <= after+10 && (game.global.antiStacks - minAnticipationStacks > 1 || effectiveShieldAtkMult > 3)){ 
                        
                        if(wantToSwapShieldFlag)
                            shieldCheckedFlag = false;
                        wantedAnticipation = minAnticipationStacks;
                        getTargetAntiStack(minAnticipationStacks, true);
                        trimpicides++;
                        return;
                        
                    }
                }
            }
        }
    }

    if (chosenFormation == '0' && game.global.soldierHealth < 0.66 * game.global.soldierHealthMax) //dont swap to X if it will kill/almost kill us
        chosenFormation = 4;
    
    goDefaultStance(chosenFormation);
    
    //check dmg last atk
    var lastDamageDealt = -1;
    var critSpan = document.getElementById("critSpan").textContent;
    
    //bookkeeping
    if(worldArray[cellNum].health !== lastMobHP){ //an attack has occured, 1 "turn"
        var lastDamageDealt = lastMobHP - worldArray[cellNum].health;
        lastMobHP = worldArray[cellNum].health;
        if(stacksAtDeath == 200) wastedStacksAtEnd++;
        if(lastNextStartingStacksCurrent == 200) wastedStacksAtStart++;
    }
    stacksAtDeath = stacks;
    shieldUsedAtCellDeath = (highDamageHeirloom ? 1 : 0);
    lastNextStartingStacksCurrent = nextStartingStacksCurrent;
    
    //if(zoneWorth > 0)
        stancePrintout(cellNum, stacks, nextStartingStacksCurrent, cmpActual, expectedNumHitsS, expectedNumHitsX, expectedNumHitsD, corruptedtmp, lastDamageDealt, critSpan);
}

function saveStats(cellNum){
    stanceStats.cmp[lastCell] = parseFloat(worldArray[lastCell].finalWorth.toFixed(2));
    stanceStats.stacks[lastCell] = stacksAtDeath;
    stanceStats.wastedStacksAtEnd[lastCell] = wastedStacksAtEnd;
    stanceStats.wastedStacksAtStart[lastCell] = wastedStacksAtStart;
    stanceStats.shieldUsedAtCellDeath[lastCell] = shieldUsedAtCellDeath;
    stanceStats.trimpicides[lastCell] = trimpicides;
    stanceStats.wantLessDamage[lastCell] = wantLessDamage;
    stanceStats.wantMoreDamage[lastCell] = wantMoreDamage;
    
    stanceStats.timeDead = timeDead;
    if(cellNum > lastCell + 1){ //we overkilled some cells
        var stacks = Math.min(lastNextStartingStacksCurrent, 200);
        for(var i = lastCell + 1; i < cellNum; i++){
            stanceStats.cmp[i] = parseFloat(worldArray[i].finalWorth.toFixed(2));
            
            stanceStats.stacks[i] = stacks;
            stacks = Math.ceil(stacks * getRetainModifier("Wind"));
            stanceStats.wastedStacksAtEnd[i] = 0;
            stanceStats.wastedStacksAtStart[i] = 0;
            stanceStats.shieldUsedAtCellDeath[i] = shieldUsedAtCellDeath;
            stanceStats.trimpicides[i] = 0;
            if(stanceStats.stacks[i]<190 && worldArray[i].baseWorth > 0 && worldArray[i].finalWorth > 1)
                stanceStats.wantLessDamage[i] = true;
            else
            stanceStats.wantLessDamage[i] = false;
            stanceStats.wantMoreDamage[i] = false;
        }
    }
    stacksAtDeath = 0;
    wastedStacksAtEnd = 0;
    wastedStacksAtStart = 0;
    shieldUsedAtCellDeath = 1;
    wantLessDamage = false;
    wantMoreDamage = false;
    //trimpicides = 0; //reset this every zone
    //timeDead = 0; //reset this every zone
}

//game was loaded from a save mid-zone, set all previous values to 0 for the graph
function setEmptyStats(){
    //debug("clearing zone data");
    stanceStats = {cmp: [], stacks: [], wastedStacksAtEnd: [], wastedStacksAtStart: [], shieldUsedAtCellDeath: [], trimpicides: [], wantLessDamage: [], wantMoreDamage: [], timeDead: 0}; //keep track of how well we're doing
    for(var i = 0; i < game.global.lastClearedCell+1; i++){
        stanceStats.cmp[i] = 0;
        stanceStats.stacks[i] = 0;
        stanceStats.wastedStacksAtEnd[i] = 0;
        stanceStats.wastedStacksAtStart[i] = 0;
        stanceStats.shieldUsedAtCellDeath[i] = 1;
        stanceStats.trimpicides[i] = 0;
        stanceStats.wantLessDamage[i] = false;
        stanceStats.wantMoreDamage[i] = false;
        stanceStats.timeDead = 0;
    }
    //chart1 = null;
    allSaveData[allSaveData.length-1].cmp = stanceStats.cmp;
    allSaveData[allSaveData.length-1].stacks = stanceStats.stacks;
    if(getPageSetting('ForceUpdateGraph') && document.getElementById('graphParent').style.display === "block")
        drawGraph();  
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
        //debug("desiredShield " + desiredShield + " goodShieldActuallyEquipped " + goodShieldActuallyEquipped);
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

    if(game.global.preMapsActive)
        mapsClicked();
    
    if(game.global.breedBack <= 0){ //breedback keeps track of our bred trimps. it starts from armysize/2 and counts down. when breedback trimps have been bred the geneticist bonus kicks in. that's what we're after.
        trimpicide = false; //we're done here
        switchOnGA();
        setFormation(4);
        fightManual();
        return true;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
        if (!game.global.switchToMaps)
            mapsClicked();
        if(!game.global.preMapsActive)
            mapsClicked();
        if(game.global.preMapsActive)
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
    //debug("Turned on AutoGeneticist");
}

function switchOffGA(){
    var steps = game.global.GeneticistassistSteps;
    var currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    if (currentStep == '0'){
        debug("switchOffGA: already off");
        return;
    }
    while(currentStep != '0'){ //get to the last active GA mode
        ctrlPressed = false;
        toggleGeneticistassist(); 
        currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    }
    //debug("Turned off AutoGeneticist");
}

function stackConservingTrimpicide(){
    if ((game.global.formation == '0' && game.global.soldierHealth < 0.499 * game.global.soldierHealthMax) || (game.global.formation == 1 && game.global.soldierHealth < 0.249 * game.global.soldierHealthMax))
        goDefaultStance();
    else
        trimpicideNow();
}

function trimpicideNow(){
    if(!game.global.preMapsActive && !game.global.switchToMaps)
        mapsClicked();
    if(!game.global.preMapsActive)
        mapsClicked();
    if(game.global.preMapsActive)
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
        //debug("grid is empty");
        return false;
    }
    
    worldArray = []; //create a world array that's safe to write to
    lastHealthyCell = -1;
    currentBadGuyNum = -1;
    
    getShieldStats(); //store some shield stats for later
    
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
        var enemy = {mutation: "", finalWorth: "", corrupted: "", name: "", health: "", maxHealth: "", baseHelium: "", spireBonus: "", pbHits: "", nextPBDmg: "", baseWorth: "", geoRelativeCellWorth: "", PBWorth: ""};
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
    //we want to save pb of weak shield
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
    
    calcOmniHelium();

    if(game.global.world == 500){ //special case
        var heliumAmount = 0; //spire bonus helium
        var regularHelium = 0; //normal helium from corrupted/healthy/omni(omni?)
        
        var spireRowBonus = (game.talents.stillRowing.purchased) ? 0.03 : 0.02;
        
        for(var i = 1; i <= 100; i++){
            if(worldArray[i-1].mutation == "Magma" || worldArray[i-1].mutation === undefined)
                regularHelium = 0;
            else if(worldArray[i-1].mutation == "Corruption")
                regularHelium = m * 0.15 * (1 + spireRowBonus * (30+Math.floor(i/10))) / (1 + spireRowBonus * 30);
            else if(worldArray[i-1].mutation == "Healthy")
                regularHelium = m * 0.45 * (1 + spireRowBonus * (30+Math.floor(i/10))) / (1 + spireRowBonus * 30);
            if(i == 100) //omni
                regularHelium = m * (1 + spireRowBonus * (30+Math.floor(i/10))) / (1 + spireRowBonus * 30);
            if(i == 20 || i == 50 || i == 60 || i == 70 || i == 80)
                heliumAmount = 0;
            else if (i == 40)
                heliumAmount = rewardResourceAT("helium", 15, 99, i);
            else if (i == 90)
                heliumAmount = rewardResourceAT("helium", 30, 99, i);
            else if (i == 100)
                heliumAmount = rewardResourceAT("helium", 100, 99, i);
            else
                heliumAmount = rewardResourceAT("helium", 0.5*Math.pow(1.01,i), 99, i);
            var totalMNormalized = (regularHelium + heliumAmount) / m;
            //debug("Cell " + i + " spire bonus: " + heliumAmount.toExponential(2) + " regularHelium: " + regularHelium.toExponential(2) + " m normalized " + totalMNormalized.toFixed(2));
            worldArray[i-1].baseHelium = regularHelium;
            worldArray[i-1].spireBonus = heliumAmount;
            worldArray[i-1].baseWorth = totalMNormalized;
        }
    }

    worldArray[99].geoRelativeCellWorth = (game.global.world % 5 === 0 ? 0 : 1); //approximation of stack transfer worth into next zone    
    worldArray[99].PBWorth = 0; //PB doesnt get carried over to next zone
    worldArray[99].finalWorth = (worldArray[99].baseWorth + worldArray[99].geoRelativeCellWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshhold; //this is in Omnipotrimps units
    for(var i = 98; i >= 0; i--){
        worldArray[i].geoRelativeCellWorth = getRetainModifier("Wind") * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].PBWorth = pbMult * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].finalWorth = (worldArray[i].baseWorth + worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshhold; //this is in Omnipotrimps units
    }

    stanceStats = {cmp: [], stacks: [], wastedStacksAtEnd: [], wastedStacksAtStart: [], shieldUsedAtCellDeath: [], trimpicides: [], wantLessDamage: [], wantMoreDamage: [], timeDead: 0}; //keep track of how well we're doing
    
    calculateZoneWorth(0);
    
    if(!isNaN(m) && !game.global.runningChallengeSquared)
        debug("Zone " + game.global.world + " Omni/atk Goal: "+OmniThreshhold.toFixed(2)+" ("+ m.toExponential(2)+ ") zone worth: " + zoneWorth.toFixed(2));
    else
        debug("Zone " + game.global.world);
    
    return true;
}

function checkSpireValue(cellNum, stacks, bonus){
    if(game.global.world != 500)
        return 0;
    var windMult = (1 + 0.001 * game.empowerments.Wind.level * stacks);
    if(bonus)
        return worldArray[cellNum].spireBonus * windMult;
    else
        return worldArray[cellNum].baseHelium * windMult;
}

function rewardResourceAT(what, baseAmt, level, cellNum){ //before wind stacks, after spire row bonus. same calculation as the game, only without actually giving helium.
    var amt = 0;
    level = scaleLootLevel(level);
    
    level = Math.round((level - 1900) / 100);
    level *= 1.35;
    if (level < 0) level = 0;
    amt += Math.round(baseAmt * Math.pow(1.23, Math.sqrt(level)));
    amt += Math.round(baseAmt * level);
	
    //Add Looting
    if (game.portal.Looting.level) amt += (amt * game.portal.Looting.level * game.portal.Looting.modifier);
    if (game.portal.Looting_II.level) amt *= (1 + (game.portal.Looting_II.level * game.portal.Looting_II.modifier));
    var spireRowBonus = (game.talents.stillRowing.purchased) ? 0.03 : 0.02;
    if (game.global.spireRows > 0) amt *= 1 + (spireRowBonus * (30 + Math.floor(cellNum/10)));
    if (game.global.totalSquaredReward > 0 && what == "helium") amt *= ((game.global.totalSquaredReward / 1000) + 1);
    if (game.global.challengeActive == "Toxicity"){
            var toxMult = (game.challenges.Toxicity.lootMult * game.challenges.Toxicity.stacks) / 100;
            amt *= (1 + toxMult);
    }

    /*if (getEmpowerment() == "Wind"){
        if (what == "helium"){
            if (!game.global.mapsActive){
                amt *= (1 + game.empowerments.Wind.getCombatModifier());
            }
        }
    }*/
    if (game.singleRunBonuses.heliumy.owned) amt *= 1.25;
    if (game.global.sLevel >= 5) amt *= Math.pow(1.005, game.global.world);
    if (game.goldenUpgrades.Helium.currentBonus > 0) amt *= 1 + game.goldenUpgrades.Helium.currentBonus;
    var fluffyBonus = Fluffy.isRewardActive("helium");
    amt += (amt * (fluffyBonus * 0.25));
    amt = Math.floor(amt);
    return amt;
};

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
    var i;
    if(game.global.world == 500 && game.global.spireRows >= 30) //always calculate m in spire4 with base rows of 30, so it will always be accurate whether we enter zone 500 or load a save from the middle
        i = 1 + (30 * spireRowBonus);
    else
        i = 1 + (game.global.spireRows * spireRowBonus);
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
    
    Goal = getPageSetting('WindStackingPctHe');
    if(Goal == -1) Goal = 0.5;
    OmniThreshhold = Goal/pctTotal; //this is how many Omnis' worth of helium we need to get on each attack in order to meet our he%/hr quota
}

function calculateZoneWorth(fromCellNum){
    var sumFull = 0;
    for (var i = 0; i <= 99; i++)
        if(worldArray[i].finalWorth > 1)
            sumFull += worldArray[i].finalWorth - 1;    
    zoneWorth = sumFull;
}

function goDefaultStance(chosenFormation){
    var formation = 2;
    if(chosenFormation !== undefined)
        formation = chosenFormation;
    
    if(getPageSetting('UseScryerStance')){ //TODO: implement the rest of scryer settings behavior
        setFormation(4);
        return;
    }
    if(game.upgrades.Dominance.done)
        setFormation(formation);
    else
        setFormation("0");
}
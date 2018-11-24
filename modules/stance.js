//MODULES["stance"] = {};
var currentBadGuyNum;
var lastZoneGridded = -1;
var coordBuyThreshold;
var maxCoords = -1;
var trimpicide = false;
var minAnticipationStacks;
var worldArray = [];

var dailyMult = 1;
var Goal = 0.005;
var pctTotal;
var OmniThreshold;
var m;
var hr;
var highDamageHeirloom = true;
var zoneWorth = 0;
var maxStacksBaseDamageD;
var baseDamageNoCrit; //in B stance
var baseDamageCritOnly; //in B stance
var lastDebug;
var cellLastHealth = 0;
var originallyEquippedShield = true;
var lowPB = -1;
var lastMobHP = -1;
var stackSpireNoMoreDamageCell = -1;

//stats keeping
var stanceStats = [];

var stacksAtDeath = 0;
var wastedStacksAtEnd = 0;
var wastedStacksAtStart = 0;
var shieldUsedAtCellDeath = 0;
var trimpicides = 0;
var timeDead = 0;
var lastNextStartingStacksCurrent = 0;
var wantLessDamage = false;
var wantMoreDamage = false;

var negativeDamageCounter = 0;
var easyRatioThreshold = 10;

var ATmaxWind = game.empowerments.Wind.maxStacks;
//game.empowerments.Wind.retainLevel

function autoStance(){
    ATmaxWind = game.empowerments.Wind.maxStacks;
    if(game.global.autoBattle && game.global.pauseFight) pauseFight(); //autofight on
    if (game.resources.trimps.owned == trimpsRealMax && game.global.soldierHealth === 0)
            fightManualAT(); //for when we dont have auto battle upgraded
    if (game.global.gridArray.length === 0) return false; //zone didnt initialize yet
    getDamageCaller(0); //buys health if we need it
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var nextCell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum + 1] : game.global.gridArray[cellNum + 1];
    var chosenFormation = 2; //default to D stance
    
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 5) && (game.global.challengeActive ? typeof game.global.dailyChallenge.bogged === 'undefined' : true);

    if(lastCell == -1){ //new save load or new zone
        if(!aWholeNewWorld)
            setEmptyStats(); //the reason to have this here is if we load a save on same zone, aWholeNewWorld wont clear graph data thinking its same zone. at least with this both world and cell# must match for this to happen
        lastCell = cellNum; 
    }
    
    if(lastCell != cellNum && !game.global.mapsActive && windZone()){ //new enemy
        if(cellNum != 0)
            saveStats(cellNum);
        
        if(windZone() && getPageSetting('ForceUpdateGraph') && !ATmakeUp && document.getElementById('graphParent').style.display === "block"){ //graph window is open    
            if(!chart1 || !chart1.series[0] || chart1.series[0].points.length === 0)
                drawGraph(); //draw initial graph
            
            if(cellNum > lastCell + 1){ //we overkilled some cells
                //for(var i = lastCell + 1; i < cellNum; i++)
                for(var i = lastCell; i < cellNum; i++)
                    updateLastPoint(i);
            }
            else
                updateLastPoint(lastCell);
        }
        
        /*if(stackSpire){
            debug("Spire Bonus should be: " + checkSpireValue(lastCell, stanceStats.stacks[lastCell], true).toExponential(2));
            debug("Regular should be: " + checkSpireValue(lastCell, stanceStats.stacks[lastCell], false).toExponential(2));
        }*/
        lastCell = cellNum;
    }
    
    if(trimpicide && !getTargetAntiStack(minAnticipationStacks, false))
        return;
    
    wantGoodShield = true;
    calcBaseDamageinB();
            
    handleGA(true); //controlls GA (when settings allow) and activates GA #3
    
    var enemyHealth = cell.health;  //current health
    //var enemyMaxHealth = cell.maxHealth; //in future can do some prediction with plaguebringer and expected minimum enemy max health of world zone
    
    if(baseDamageHigh < 0 || game.global.soldierCurrentAttack < 0){
        var wrongDamage = game.global.soldierCurrentAttack;
        if(!game.global.preMapsActive)
            mapsClicked(true);
        mapsClicked(true);
        calcBaseDamageinB();
        trimpicides++;
        debug("Negative damage error! You should probably let somebody know at https://discord.gg/W2Ajv4j " + wrongDamage.toExponential(2));
        debug("Trimpiciding to set things straight.");
        return; 
    }
    
    if(getPageSetting('EmpowerTrimpicide') && game.global.soldierHealth > 0 && typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.preMapsActive && !game.global.mapsActive){
        if(aboutToDie()){ //dont die in world on empowered dailies
            if((typeof game.global.dailyChallenge.bogged === 'undefined' && typeof game.global.dailyChallenge.plague === 'undefined') || zoneWorth <= 2){
                debug("Trimpiciding to prevent empowering.", "trimpicide");
                mapsClicked(true);
                return;
            }
        }
    }
    
    if (!game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        goDefaultStance(); //D if we have it, X otherwise
        getDamageCaller(game.global.gridArray[0].maxHealth*10000, false);
        allowBuyingCoords = true;
        if (game.global.soldierHealth <= 0)
            fightManualAT();
        return;
    }

    if(game.global.spireActive && !stackSpire){ //in spire and we arent stacking it
        if(game.global.mapsActive || game.global.preMapsActive)
            return;
        goDefaultStance(); //D if we have it, X otherwise
        if(game.global.spireDeaths === 0 && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1){ //1 death if we need stacks
            debug("Spire: Trimpiciding to get max stacks.", "trimpicide");
            wantedAnticipation = maxAnti;
            mapsClicked(true);
            if(game.global.preMapsActive)
                mapsClicked(true);
            trimpicides++;
        }
        if (game.global.soldierHealth <= 0 && game.global.spireDeaths <= 1 && !isActiveSpireAT()) //if not activespireAT, we can give 2 deaths for speedup. probably wont need the lives
            fightManualAT();
        
        allowBuyingCoords = true;
        if(game.global.world == 400 && game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.bogged === 'undefined'){ //spire3 special case in dailies. a bit more conservative here so we can more easily farm low 400s
            var timeGoal = getPageSetting('Spire3Time'); //how long we wish to spend in spire3
            if (timeGoal < 1 || isNaN(timeGoal)) timeGoal = 1;
            var totalHealth = 0;
            for (var i = 0; i < 100; i++)
                totalHealth += worldArray[i].maxHealth;
            var desiredDamage = Math.min(totalHealth/(8*timeGoal), 1.5*dmgNeededToOK(cellNum));
            getDamageCaller(desiredDamage, false);
        }
        else
            getDamageCaller(3*dmgNeededToOK(cellNum), false, true);
        
        //spire gets its own fightManual() condition
        if (game.global.soldierHealth <= 0 && game.global.challengeActive == "Trapper" || (game.global.breedBack <= 0 && (hiddenBreedTimer > wantedAnticipation || typeof game.global.dailyChallenge.empower === 'undefined')))
            fightManualAT();
        
        if(windZone())
            stacksAtDeath = game.empowerments.Wind.currentDebuffPower; //bookkeeping
        
        return; //beyond this point, only spire is a stacked spire4
    }

    updateOmniThreshold();
    
    allowBuyingCoords = !getPageSetting('DelayCoordsForWind'); //dont buy coords unless we explicitly permit it. automaps() can also allow it if player runs a map for ratio.

    if (game.global.soldierHealth <= 0){
        if (game.global.challengeActive == "Trapper" || (game.global.breedBack <= 0 && (hiddenBreedTimer > wantedAnticipation || typeof game.global.dailyChallenge.empower === 'undefined')) || (DHratio > easyRatioThreshold && !stackSpire)){
            if(typeof game.global.dailyChallenge.bogged !== 'undefined' && DHratio > 10 && !stackSpire){ //bogged is special because death occurs all the time
                wantGoodShield = false;
            }
            fightManualAT();
        }
        else
            timeDead += 0.1;
        return;
    }
    
    if(game.global.mapsActive)
        return;
    
    if(game.global.world >= getPageSetting('NoCoordBuyStartZ') && game.jobs.Amalgamator.owned < getPageSetting('TillWeHaveAmalg') && game.global.challengeActive != "Trapper"){ //we're expecting an amalg, so check if we can get it by trimpiciding
        var popArmyRatio = trimpsRealMax/game.resources.trimps.getCurrentSend();
        var spiresBeaten = Math.floor((game.global.spireRows-10) / 10);
        var needed = 1e10 / Math.pow(10, spiresBeaten);
        if(popArmyRatio > needed){
            debug("Trimpiciding to pick up amalgamator #" + (game.jobs.Amalgamator.owned+1), "trimpicide");
            mapsClicked(true);
            if(game.global.preMapsActive)
                mapsClicked(true);
            return;
        }
    }
        
    if(enemyHealth == -1) //new zone, game didnt generate first enemy yet, so use our own
        enemyHealth = worldArray[cellNum].maxHealth;
    
    worldArray[cellNum].health = enemyHealth; //is there a reason why we should calculate this earlier?
    worldArray[cellNum].corrupted = cell.corrupted;
    
    if(game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting) == 0)
        switchOnGA(); //in rare cases we leave GA disabled, so make sure to turn it back on
    
    var requiredDmgToOK = dmgNeededToOK(cellNum); //how much dmg we need to fully OK on this/next attack
    
    if(windZone()){
        var stacks = game.empowerments.Wind.currentDebuffPower;
               var maxDesiredStacks = ((game.global.challengeActive == "Daily") ? ATmaxWind-4 : ATmaxWind-8); //overshooting is really bad, so take a safety margin on non dailies. note that with plaguebringer the script will overshoot this by quite a bit on occasions so a big safety margin is recommended
        if((cell.corrupted !== undefined && cell.corrupted.includes("healthy")) || cellNum == 99)
            maxDesiredStacks = ATmaxWind-4; //still want max stacks for healthy/end cells
        
        var missingStacks = Math.max(maxDesiredStacks-stacks, -5);

        var ourAvgDmgS = baseDamageHigh;
        var ourAvgDmgX = ourAvgDmgS * 2;
        var ourAvgDmgD = ourAvgDmgS * 8;

        var expectedNumHitsS = enemyHealth / ourAvgDmgS;
        var expectedNumHitsX = enemyHealth / ourAvgDmgX;
        var expectedNumHitsD = enemyHealth / ourAvgDmgD;

        //dont wanna worry about last cell all the time, so keep it simple
        var nextPBDmgtmp = (cellNum == 99 || nextCell.plaguebringer === undefined ? 0 : nextCell.plaguebringer);
        var pbHitstmp = (cellNum == 99 || nextCell.plagueHits === undefined ? 0 : Math.ceil(nextCell.plagueHits));
        var corruptedtmp = (cell.corrupted === undefined ? "none" : cell.corrupted);

        var pbMult = lowPB;
        if(cellNum < 99){
            worldArray[cellNum+1].health = Math.max(worldArray[cellNum+1].maxHealth - nextPBDmgtmp, 0.05*worldArray[cellNum+1].maxHealth); //extra damage on next cell from PB
            worldArray[cellNum+1].pbHits = pbHitstmp; //extra wind stacks on next cell from PB
            var nextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind") + pbHitstmp + expectedNumHitsD * (pbMult + getRetainModifier("Wind")) + Math.ceil(worldArray[cellNum+1].health/ourAvgDmgD)), ATmaxWind);
            var nextStartingStacksCurrent = Math.min(1 + Math.ceil((stacks+1) * getRetainModifier("Wind") + pbHitstmp), ATmaxWind);
            if(cellNum == 80){
                if(nextZoneDHratio <= poisonMult * windMult && worldArray[99].geoRelativeCellWorth > 0){
                    worldArray[99].geoRelativeCellWorth = 0; //need to update previous cells as well
                    for(var i = 98; i>80; i--){
                        worldArray[i].geoRelativeCellWorth = getRetainModifier("Wind") * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
                        worldArray[i].PBWorth = pbMult * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
                        worldArray[i].finalWorth = (worldArray[i].baseWorth + worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshold; //this is in Omnipotrimps units
                    }
                }
            }
        }
        else {
            var nextStartingStacks = 2+Math.ceil(stacks * getRetainModifier("Wind"));
            var nextStartingStacksCurrent = 2+Math.ceil(stacks * getRetainModifier("Wind"));
            if(game.global.world % 5 === 0){nextStartingStacks = 0; nextStartingStacksCurrent = 0};
        }
        
        wantMoreDamage = false; //book keeping
        wantLessDamage = false; //book keeping
    }
    
    if (getPageSetting('AutoStance') > 1){ //2 - DE mode 3 - push mode
        //consider trimpicide for max stacks
        var timeEstimate = timeEstimator(true, cellNum, game.global.world, game.global.dailyChallenge); //rough estimate of how long it will take to finish zone
        var timeFlag = timeEstimate > 50 || DHratio < easyRatioThreshold;
        if(timeFlag && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1){
            wantedAnticipation = maxAnti;
            if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){
                debug("Trimpiciding to get max stacks", "trimpicide");
                mapsClicked(true);
                if(game.global.preMapsActive)
                    mapsClicked(true);
            }
            trimpicides++;
        }
        getDamageCaller(10*requiredDmgToOK, false, true);
        var remainingDrops = countRemainingEssenceDrops(); //how many cells with De remaining
        if(getPageSetting('AutoStance') == 2){ //DE mode
            if(remainingDrops > 0)
                chosenFormation = 4;
            else
                chosenFormation = 2;
        }
        else{
            if(getPageSetting('AutoStance') == 3)  //push mode
                chosenFormation = 2; //D if we have it, X otherwise
            else{ //hybrid mode
            if(poisonZone()){
                if(remainingDrops > 0)
                    chosenFormation = 4;
                else
                    chosenFormation = 2;
            }
            else
                chosenFormation = 2;
            }
        }
    }
    else if(!windZone()){
        goDefaultStance(); //D if we have it, X otherwise
        
        if(windZone(game.global.world + 1) && cellNum > 50 && zoneWorth > 0.5) //if next zone is a wind zone, dont instantly buy the coordination in case we want to save it.
            allowBuyingCoords = false;
        
        //here we need to decide how much damage we want in non wind zones.
        //this depends on zoneWorth. if its low we want full overkill
        //if its high, we aim to reach the first wind zone with limit DHratio.
        if(zoneWorth < 1 || game.global.world < 236){
            allowBuyingCoords = true;
            getDamageCaller(1.5*requiredDmgToOK, false, true);
        }
        else{
            var limit = 20 * (goodBadShieldRatio / 20);
            var zonesToWind = (150000 - game.global.world) % 15 + 1; //how many zones to go until we hit wind
            var maxDHratio = limit * Math.pow(2, zonesToWind); //maximum DHratio we want right now
            var currDHratio = DHratio;
            
            var wantDmg = 8*baseDamageHigh*maxDHratio/currDHratio; //unfortunately we can not hit exact damages because of the game bug
            //if(local) debug("wanted now: " + maxDHratio.toExponential(2) + " goal 1st wind: " + limit.toFixed(0));
            
            if(DHratio > maxDHratio)
                allowBuyingCoords = false;
            else
                allowBuyingCoords = true;
            
            getDamageCaller(wantDmg, false, true);
        }
        
        //consider trimpicide for max stacks
        var timeEstimate = timeEstimator(true, cellNum, game.global.world, game.global.dailyChallenge); //rough estimate of how long it will take to finish zone
        var timeFlag = timeEstimate > 50 || DHratio < easyRatioThreshold*2;
        if(timeFlag && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1){
            debug("Trimpiciding to get max stacks", "trimpicide");
            wantedAnticipation = maxAnti;
            if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){
                mapsClicked(true);
                if(game.global.preMapsActive)
                    mapsClicked(true);
            }
            trimpicides++;
        }
        return;
    }
    else{ //wind zone with helium mode
        var cmp = 0; //cmp uses nextStartingStacks which includes an approximation of how many more hits we need
        var cmpActual = 0; //this is precise (used for display)

        if(stacks < ATmaxWind-8)
            cmp += worldArray[cellNum].baseWorth;
        if(nextStartingStacks < ATmaxWind-6)
            cmp += worldArray[cellNum].PBWorth;
        if(stacks < ATmaxWind-8 && nextStartingStacks < ATmaxWind-6)
            cmp += worldArray[cellNum].geoRelativeCellWorth;

        if(stacks < ATmaxWind)
            cmpActual += worldArray[cellNum].baseWorth;
        if(nextStartingStacksCurrent < ATmaxWind)
            cmpActual += worldArray[cellNum].PBWorth;
        if(stacks < ATmaxWind && nextStartingStacksCurrent < ATmaxWind)
            cmpActual += worldArray[cellNum].geoRelativeCellWorth;

        if(worldArray[cellNum].corrupted == "corruptDodge" && !stackSpire) {cmp *= 0.7; cmpActual *= 0.7;} //dodge cells are worth less
        cmp       *= game.empowerments.Wind.getModifier() * dailyMult / OmniThreshold; //cmp is in OmniThreshold units
        cmpActual *= game.empowerments.Wind.getModifier() * dailyMult / OmniThreshold;

        calculateZoneWorth(0);

        var limit = 10;
        if(stackSpire){
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
            var needDamageFlag = baseDamageHigh < worldArray[cellNum].maxHealth / 400;
            if(needDamageFlag && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1 && typeof game.global.dailyChallenge.bogged === 'undefined'){
                debug("Need more damage for spire. Trimpiciding to get max stacks", "trimpicide");
                wantedAnticipation = maxAnti;
                stackConservingTrimpicide();
                trimpicides++;
            }
        }
        else if (DHratio < limit) //if DHratio falls below limit, we allow buying of gear and coordinates to get it
            getDamageCaller(8*baseDamageHigh * limit / DHratio, false);

        if(stacks < ATmaxWind-15 && nextStartingStacks < ATmaxWind-20 && zoneWorth > 0.8 && expectedNumHitsS < missingStacks-5 && (stackSpire ? worldArray[cellNum].finalWorth > 1 : worldArray[cellNum].baseWorth > 0 && cmp > 1))
            wantLessDamage = true;

        var boggedFlag = (typeof game.global.dailyChallenge.bogged !== 'undefined' && DHratio > 10);
        var rushFlag = !stackSpire && !boggedFlag && (worldArray[cellNum].corrupted == "healthyBleed" || worldArray[cellNum].corrupted == "corruptBleed" || worldArray[cellNum].corrupted == "corruptDodge");
        if(expectedNumHitsD > missingStacks || cmp < 1 || rushFlag){ //we need more damage, or this cell isnt worth our time                
            //when we use high damage shield to hit a cell it could lower its cmp a bit if our main shield has less plaguebringer than our low shield. lets adjust cell PBWorth accordingly.
            /*pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
            if(cellNum < 99)
                worldArray[cellNum].PBWorth = pbMult * (worldArray[cellNum+1].baseWorth + worldArray[cellNum+1].geoRelativeCellWorth);
            else
                worldArray[cellNum].PBWorth = 0;*/

            if(stacks >= ATmaxWind) //stats keeping
                wantMoreDamage = true;

            chosenFormation = 2;

            //consider trimpicide for max stacks. 2 scenarios: we're in a high zone where killing anything is hard and we need more damage, or we're in a semi hard zone thats not worth much and we wanna speed it up

            //shared requirements:
            if(hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1 && !stackSpire && typeof game.global.dailyChallenge.bogged === 'undefined'){
                //scenario 1:
                if(DHratio < 3){
                    debug("DHratio < 3. Trimpiciding to get max stacks", "trimpicide");
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
                var timeEstimate = timeEstimator(true, cellNum, game.global.world, game.global.dailyChallenge); //rough estimate of how long it will take to finish zone
                var careAboutArmyReadyFlag = (game.global.world % 5 === 0 || nextZoneDHratio <= poisonMult * windMult);
                var timeFlag = timeEstimate > 50 || DHratio/2 > easyRatioThreshold || !careAboutArmyReadyFlag;
                if(!goodCellFlag && timeFlag){
                    //debug("timeEstimate = " + timeEstimate.toFixed(0) +"s", "trimpicide");
                    debug("Trimpiciding to get max stacks", "trimpicide");
                    wantedAnticipation = maxAnti;
                    stackConservingTrimpicide();
                    trimpicides++;
                    return;
                }        
            }

            if(zoneWorth < 0.4){ //wind zone suxxx full OK
                allowBuyingCoords = true;
                getDamageCaller(1.5*requiredDmgToOK, false, true);
            }
            else if(cmp >= 1 && !stackSpire){//we are rushing a cell that's worth farming. we want just enough damage to kill current cell (assuming no crit).
                chosenFormation = 2;

                if(enemyHealth < baseDamageHighNoCrit*2)
                    chosenFormation = 4;
                if(enemyHealth < baseDamageHighNoCrit){
                    chosenFormation = 3;
                    if(enemyHealth < baseDamageLowNoCrit*8){ //we will hold onto low shield, so recalc values
                        wantGoodShield = false;
                        chosenFormation = 2;
                        //debug("enemyHealth " + enemyHealth.toExponential(2) + " baseDamageNoCrit " + baseDamageNoCrit.toExponential(2));
                        ourAvgDmgS = baseDamageLow;
                        ourAvgDmgD = ourAvgDmgS * 8;
                        ourAvgDmgX = ourAvgDmgS * 2;

                        expectedNumHitsS = enemyHealth / ourAvgDmgS;
                        expectedNumHitsX = enemyHealth / ourAvgDmgX;
                        expectedNumHitsD = enemyHealth / ourAvgDmgD;
                        if(enemyHealth < baseDamageLowNoCrit*2)
                            chosenFormation = 4;
                        if(enemyHealth < baseDamageLowNoCrit)
                            chosenFormation = 3;
                    }
                    else
                        wantGoodShield = true;
                }
            }
            if(stackSpire && expectedNumHitsD > missingStacks && stackSpireNoMoreDamageCell != cellNum){
                getDamageCaller(1.2*8*baseDamageHigh, false, true);
                stackSpireNoMoreDamageCell = cellNum;
            }
        }
        else if (expectedNumHitsX > missingStacks){
            if (isScryhardActive())
                chosenFormation = 4; //scryhard active
            else
                chosenFormation = '0';
        }
        else {
            chosenFormation = 3;

            if (expectedNumHitsS < missingStacks-5){ //we have too much damage, lower our damage
                 wantGoodShield = false;

                ourAvgDmgS = baseDamageLow;
                ourAvgDmgD = ourAvgDmgS * 8;
                ourAvgDmgX = ourAvgDmgS * 2;

                expectedNumHitsS = enemyHealth / ourAvgDmgS;
                expectedNumHitsX = enemyHealth / ourAvgDmgX;
                expectedNumHitsD = enemyHealth / ourAvgDmgD;

                if (expectedNumHitsD > missingStacks)
                    chosenFormation = 2;
                else if (expectedNumHitsX > missingStacks){
                    if (isScryhardActive())
                        chosenFormation = 4; //scryhard active
                    else
                        chosenFormation = '0';
                }
                else
                    chosenFormation = 3;

                //update cell PBWorth to current plaguebringer value
                /*pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
                if(cellNum < 99)
                    worldArray[cellNum].PBWorth = pbMult * (worldArray[cellNum+1].baseWorth + worldArray[cellNum+1].geoRelativeCellWorth);
                else
                    worldArray[cellNum].PBWorth = 0;*/

                if(chosenFormation == 3 && (DHratio > 10 || stackSpire)){
                    var currDmg = baseDamageLow; //we're going to call getDamageCaller and maybe get damage, but DHratio wont update until next automaps. so keep track our damage changes from here on out

                    getDamageCaller(baseDamageLow * limit / DHratio, true); //attempt to lower our damage

                    var currRatio = DHratio * currDmg / baseDamageLow; //baseDamageLow maybe higher than currDmg, so adjust currRatio down accordingly

                    if (zoneWorth > 0.8 && game.global.antiStacks > 1 && DHratio >= 3 && !stackSpire && (worldArray[cellNum].mutation == "Corruption" || worldArray[cellNum].mutation == "Healthy" || cellNum == 99) && typeof game.global.dailyChallenge.bogged === 'undefined'){ //if we still need less damage, consider trimpicide to remove anticipation stacks. never trimpicide against non colored cell
                        var noStacks = 1/(1+0.2*game.global.antiStacks); //modifier for having no stacks
                        var noStacksCurrRatio = currRatio * noStacks; //our ratio without stacks
                        var ratio = limit / noStacksCurrRatio;
                        var wantedStacks = (ratio - 1) / 0.2; //how many stacks to get to what we want

                        minAnticipationStacks = Math.ceil(Math.max(1, wantedStacks));
                        var ourNewLowDamage = baseDamageLow*(1 + 0.2 * minAnticipationStacks)/(1 + 0.2 * game.global.antiStacks);
                        var before = Math.min(stacks      + expectedNumHitsS, ATmaxWind); //stacks if we dont trimpicide
                        var after  = Math.min(getRetainModifier("Wind")*stacks + enemyHealth / ourNewLowDamage, ATmaxWind); //stacks if we do trimpicide
                        //debug("before " + before.toFixed(0) + " after " + after.toFixed(0));
                        if(before <= after+10 && game.global.antiStacks - minAnticipationStacks > 1){ 
                            wantedAnticipation = minAnticipationStacks;
                            getTargetAntiStack(minAnticipationStacks, true);
                            trimpicides++;
                            return;
                        }
                    }
                }
            }
        }
    }

    if (chosenFormation == '0' && game.global.soldierHealth < 0.66 * game.global.soldierHealthMax) //dont swap to X if it will kill/almost kill us
        chosenFormation = 3;
    
    goDefaultStance(chosenFormation);
    
    //check dmg last atk
    var lastDamageDealt = -1;
    var critSpan = document.getElementById("critSpan").textContent;
    
    //bookkeeping
    if(worldArray[cellNum].health !== lastMobHP){ //an attack has occured, 1 "turn"
        var lastDamageDealt = lastMobHP - worldArray[cellNum].health;
        lastMobHP = worldArray[cellNum].health;
        if(stacksAtDeath == ATmaxWind) wastedStacksAtEnd++;
        if(lastNextStartingStacksCurrent == ATmaxWind) wastedStacksAtStart++;
    }
    stacksAtDeath = stacks;
    shieldUsedAtCellDeath = (highDamageHeirloom ? 1 : 0);
    lastNextStartingStacksCurrent = nextStartingStacksCurrent;
    
    if(windZone() && getPageSetting('SpamWind'))
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
        var stacks = Math.min(lastNextStartingStacksCurrent, ATmaxWind);
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
    
    if (!game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp")
        return; //dont redraw every zone in liquification zones since redrawing graph makes mouseover tooltips flicker 
    
    if(getPageSetting('ForceUpdateGraph') && !ATmakeUp && document.getElementById('graphParent') && document.getElementById('graphParent').style.display === "block")
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
    
    /*if (critSpan === "")            critText = "0";
    else if (critSpanA === "Crit!") critText = "1";
    else if (critSpanA === "CRIT!") critText = "2";
    else if (critSpanA === "CRIT!!") critText = "3";
    else critText = "?";*/
   
    var letter = " ";
    switch (game.global.formation) {
        case 0:
            letter = 'X';
            break;
        case 2:
            letter = 'D';
            break;
        case 3:
            letter = 'B';
            break;
        case 4:
            letter = 'S';
            break;
    }
    //var shield = (highDamageHeirloom ? "+" : "-");
    var want = (wantGoodShield ? "+" : "-");
    if(lastDamageDealtA > 0){
        var msg = want+game.global.world + "." + cellNumA + " " + stacksA+"W"+"("+nextStartingStacksA+") "+cmpA.toFixed(2)+" " + /*critText +"C " +*/ expectedNumHitsSA.toFixed(0)+"/" + expectedNumHitsXA.toFixed(0)+"/" + expectedNumHitsDA.toFixed(0) + " " + game.global.antiStacks + letter + " " + corruptedtmpA;
        if (!(lastDebug == msg))
            debug(msg, "wind");
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

    if (Math.abs(game.global.antiStacks-target) <= 1){
        trimpicide = false;
        switchOnGA();
        return true;
    }
    
    if(firstRun){
        trimpicide = true;
        var deltaGenes = getDeltaGenes(minAnticipationStacks); //calculates how many geneticists we need to fire to be below minAnticipationStacks
        if(deltaGenes > 0){ //if we need to fire geneticists
            switchOffGA(); //pause autogeneticist  
            debug("Trimpiciding " + game.global.antiStacks + "->"+ minAnticipationStacks+ ". Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes), "trimpicide");
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
        goDefaultStance(3);
        fightManual();
        return true;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
        mapsClicked(true);
        if(game.global.preMapsActive)
            mapsClicked(true);
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
    if(game.global.world < 71 || !game.global.Geneticistassist){
        //debug("AutoGeneticist isnt unlocked yet!");
        return;
    }
    var steps = game.global.GeneticistassistSteps;
    var currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    var stepsInitial = steps;
    var currentStepInitial = currentStep;
    if (currentStep == 3){
        //debug("switchOnGA: already on");
        return;
    }
    var maxTries = 10;
    while(currentStep != 3 && maxTries > 0){ //get to the last active GA mode
        maxTries--;
        //cancelTooltip(); //in case its on
        //toggleGeneticistassist(true);
        toggleGeneticistassist();
        currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    }
    if(maxTries <= 0)
        debug("Error switchOnGA  " + stepsInitial + " " + currentStepInitial + " " + steps + " " + currentStep);
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
    if(!game.global.preMapsActive)
        mapsClicked(true);
    if(game.global.preMapsActive)
        mapsClicked(true);
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
    worldArray = []; //create a world array that's safe to write to
    currentBadGuyNum = -1;
    
    if (game.global.gridArray.length === 0){
        //debug("grid is empty. retrying.", "other");
        setTimeout(buildWorldArray, 100);
        return false;
    } 
    
    if (!game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp"){
        var atk    = calcEnemyAttack(game.global.gridArray[0].mutation, game.global.gridArray[0].corrupted, game.global.gridArray[0].name, 0, game.global.world, true);
        var health = calcEnemyHealth(game.global.gridArray[0].mutation, game.global.gridArray[0].corrupted, game.global.gridArray[0].name, 0, game.global.world, true);
        worldArray[0] = {health: health, maxHealth: health, attack: atk};
        return;
    }
    
    for (var i = 0; i < 100; i++){
        var enemy = {mutation: "", finalWorth: "", corrupted: "", name: "", health: "", maxHealth: "", attack: 0, baseHelium: "", spireBonus: "", pbHits: "", nextPBDmg: "", baseWorth: "", geoRelativeCellWorth: "", PBWorth: ""};
        
        enemy.name    = game.global.gridArray[i].name; //the player has no access to imp names before reaching them, so neither do we
        enemy.mutation  = game.global.gridArray[i].mutation;
        enemy.corrupted = game.global.gridArray[i].corrupted;
        
        if(enemy.mutation == "Corruption")   enemy.baseWorth = 0.15;
        else if(enemy.mutation == "Healthy") enemy.baseWorth = 0.45;
        else                                 enemy.baseWorth = 0;
        
        enemy.attack    = calcEnemyAttack(enemy.mutation, enemy.corrupted, enemy.name, i, game.global.world, true);
        enemy.maxHealth = calcEnemyHealth(enemy.mutation, enemy.corrupted, enemy.name, i, game.global.world, true);
        enemy.health    = enemy.maxHealth;

        worldArray.push(enemy);
    }
    //last cell special case
    worldArray[99].baseWorth = 1;
    
    var pbMult = (lowPB > -1 ? lowPB : game.heirlooms.Shield.plaguebringer.currentBonus / 100); //weaker shield should have more PB. PB isnt that good of a damage modifier.    
    
    calcOmniHelium();

    if(game.global.world == 500){ //special case
        var heliumAmount = 0; //spire bonus helium
        var regularHelium = 0; //normal helium from corrupted/healthy/omni
        
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
    worldArray[99].finalWorth = (worldArray[99].baseWorth + worldArray[99].geoRelativeCellWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshold; //this is in Omnipotrimps units
    for(var i = 98; i >= 0; i--){
        worldArray[i].geoRelativeCellWorth = getRetainModifier("Wind") * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].PBWorth = pbMult * (worldArray[i+1].baseWorth + worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].finalWorth = (worldArray[i].baseWorth + worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier() * dailyMult / OmniThreshold; //this is in Omnipotrimps units
    }

    stanceStats = {cmp: [], stacks: [], wastedStacksAtEnd: [], wastedStacksAtStart: [], shieldUsedAtCellDeath: [], trimpicides: [], wantLessDamage: [], wantMoreDamage: [], timeDead: 0}; //keep track of how well we're doing
    
    calculateZoneWorth(0);
    
    if(!isNaN(m) && !game.global.runningChallengeSquared)
        debug("Zone " + game.global.world + " Omni/atk Goal: "+OmniThreshold.toFixed(2)+" ("+ m.toExponential(2)+ ") zone worth: " + zoneWorth.toFixed(2));
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

    updateOmniThreshold();
}

function updateOmniThreshold() {
    pctTotal = (100*hr/game.global.totalHeliumEarned); //which is this much he/hr% out of our total helium
    updateDailyMult();
    Goal = getPageSetting('WindStackingPctHe');
    if(Goal == -1) Goal = 0.5;
    OmniThreshold = Goal/pctTotal; //this is how many Omnis' worth of helium we need to get on each attack in order to meet our he%/hr quota
}

function updateDailyMult(){
    if (countDailyWeight() === 0) //no daily
        dailyMult = 1;
    else
        dailyMult = 1 + getDailyHeliumValue(countDailyWeight()) / 100;
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
    
    //check formation is unlocked
    if(formation == 2 && !game.upgrades.Dominance.done)
        formation = '0';
    else if (formation == 3 && !game.upgrades.Barrier.done)
        formation = '0';
    else if (formation == 4 && !(game.global.world >= 60 && game.global.highestLevelCleared >= 180))
        formation = '0';
    
    if(formation != game.global.formation)
        setFormation(formation);
}
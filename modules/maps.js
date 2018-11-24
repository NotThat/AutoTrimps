var remainingCells = 100;
var doVoids = false;
var BWRaidingStatus = false;
var needToVoid = false;
var needPrestige = false;
var ourBaseDamage = 0;
var ourBaseDamagePlusOne = 0;
var shouldDoMaps = false;
var mapTimeEstimate = 0;
var preSpireFarming = false;
var spireMapBonusFarming = false;
var stackSpireOneTime = true;
var spireTime = 0;

var baseLevel;
var sizeSlider;
var diffSlider;
var lootSlider;
var specialMod;
var perfect;
var extraLevels;
var type;
var cost;

var maxDesiredLevel;
var minDesiredLevel;
var lastMsg; //stores last message, stops spam to console
var AutoMapsCoordOverride = false;
var PRaidingActive = false; //used for coordination purchase during praids
var enoughDamage = true;

var moreFarmingReset = false;
var nextCacheCounter = "";
var LMCDone = 0;
var LSCDone = 0;
var LWCDone = 0;
var LWCDoneAmount = 0;
var LWCLastCell = -1;

var prestigeState = 0;

function autoMap(){
    AutoMapsCoordOverride = false;
    calcDmg(); //checks dmg to decide going after map bonus. calculating it here so we can display hd ratio in world screen
    
    if(getPageSetting('AutoMaps') === 0 || !game.global.mapsUnlocked || game.global.challengeActive == "Mapology") return;
    
    //dont enter maps before cell 90 in last poison zone, except in spire or for map bonus
    if((enoughDamage || game.global.mapBonus >= 10) && game.global.world >= 236 && (cycleZone() === 4 || cycleZone() === 19 || (game.global.world % 10 === 9 && game.global.challengeActive == "Obliterated")) && game.global.lastClearedCell + 1 < 90 && !game.global.spireActive){
        if(game.global.preMapsActive)
            mapsClicked(true);
        return;
    }
    
    //check if we want to trimpicide for stacks
    if(game.global.mapsActive && game.global.soldierHealth > 0 && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1 && typeof game.global.dailyChallenge.bogged === 'undefined'){
        debug("Maps: Trimpiciding to get max stacks", "trimpicide");
        if(currMap.location == "Void"){
            mapsClicked(true);
            cancelTooltip()
        }
        else
            mapsClicked();
        trimpicides++;
    }
    
    if (!enoughDamage) AutoMapsCoordOverride = true; //if automaps thinks we need damage, override helium mode coord delay (not amalgamators' coord delay)
    //are we behind on prestige? ignores last gambesop on portal zone
    needPrestige = (getScientistLevel() >= 5 ? 
    ((lastPrestigeZone() < lastDropZone()) || (lastPrestigeZone() == lastDropZone() && prestigeState != 2 && game.global.world !== expectedPortalZone)) :
    preScience5NeedPrestige());
    
    shouldDoMaps = (!enoughDamage && game.global.mapBonus < 10) || needPrestige;
    
    doVoids = checkNeedToVoid();
    //if(doVoids && game.options.menu.repeatVoids.enabled != 1) toggleSetting('repeatVoids');
    if(doVoids && game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids'); //toggle repeat all voids off. theres no benefit in running with 'finish all voids' enabled since you lose titimp bonus upon void clear anyway, and by having it off we can go do prestige raid we didnt have frags for earlier
    else if(!doVoids && game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    
    //force equip first mode
    if (game.global.mapsActive && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    //Control in-map right-side-buttons.
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    
    //PRaidStartZone = getPageSetting('PRaidSetting') ? Math.min(PRaidStartZone, praidAutoStart()) : getPageSetting('PRaidingZoneStart'); //from this zone we prestige raid
    //if (!needPrestige && (getPageSetting('PRaidingZoneStart') > 0 || getPageSetting('PRaidSetting'))){
    PRaidStartZone = getPageSetting('PRaidingZoneStart'); //from this zone we prestige raid
    if (!needPrestige){
        if(!PrestigeRaid()){ //not done yet so we'll return to it in the next visit to autoMaps() function. until then go back to main AT so we can purchase prestiges and stuff
            PRaidingActive = true; //tells buyUpgrades() that we should buy coords
            return; 
        }
    }
    
    //BW Raiding
    if ((enoughDamage || game.global.mapBonus >= 10) && !needPrestige && BWRaidNowLogic() && !BWraiding()){
        PRaidingActive = true;
        return;
    }
    
    PRaidingActive = false;
    
    //this code prevents automaps from killing our army and going into map screen under certain conditions:    
    if (game.global.soldierHealth > 1000 && !getPageSetting('MoreFarming')){//if we have an army currently fighting
        if(!doVoids){ //and we dont need to voids
            if(!game.global.mapsActive && !game.global.preMapsActive){ //and we are in the world screen
                if (game.resources.trimps.owned < trimpsRealMax){ //and we dont have another army ready, then we may as well stay in the world until another army is ready. may not be true for some dailies
                    if (getEmpowerment() == "Poison"){
                        if(game.global.world % 10 != 5 && game.global.world % 10 != 0) //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                            return;
                    }
                    else //ice/wind/no empowerment: always stay in world if army isnt ready
                        return;
                }
            }
        }
    }
    
    /* logic order:
     * check if we need to run a unique map
     * check if we need to run void maps
     * otherwise, determine what map we want to do, lmc, lws, fa, what level, cheap/nocheap, and frag limit
     * if we're in a map, determine if its the same type & level that we want or not and handle the buttons
     * if we arent in a map, create one
     */
    
    //Look through all the maps we have and figure out, find and Run Uniques if we need to
    var selectedMap = false;
    for (var map in game.global.mapsOwnedArray){
        var theMap = game.global.mapsOwnedArray[map];
        if (theMap.noRecycle){
            if (theMap.name == 'The Wall' && game.upgrades.Bounty.allowed == 0 && !game.talents.bounty.purchased){
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 15 + theMapDifficulty) continue;
                selectedMap = theMap;
                break;
            }
            if (theMap.name == 'Dimension of Anger' && !game.global.portalActive){
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 20 + theMapDifficulty) continue;
                selectedMap = theMap;
                break;
            }
            if (theMap.name == 'The Block' && !game.upgrades.Shieldblock.allowed && ((game.global.challengeActive == "Scientist" || game.global.challengeActive == "Trimp") && !game.global.runningChallengeSquared || getPageSetting('BuyShieldblock'))){
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 11 + theMapDifficulty) continue;
                selectedMap = theMap;
                break;
            }
            if (!game.global.runningChallengeSquared){
                var treasure = getPageSetting('TrimpleZ');
                if (theMap.name == 'Trimple Of Doom' && (game.global.challengeActive == "Meditate" || game.global.challengeActive == "Trapper") && game.mapUnlocks.AncientTreasure.canRunOnce && game.global.world >= treasure){
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if ((game.global.world < 33 + theMapDifficulty) || treasure > -33 && treasure < 33) continue;
                    selectedMap = theMap;
                    if (treasure < 0) // need to reset
                        setPageSetting('TrimpleZ', 0);
                    break;
                }
                //run the prison only if we are 'cleared' to run level 80 + 1 level per 200% difficulty. Could do more accurate calc if needed
                if (theMap.name == 'The Prison' && (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse")){
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 80 + theMapDifficulty) continue;
                    selectedMap = theMap;
                    break;
                }
                if (theMap.name == 'Bionic Wonderland' && game.global.challengeActive == "Crushed"){
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 125 + theMapDifficulty) continue;
                    selectedMap = theMap;
                    break;
                }
            }
        }
    }
    
    if (doVoids && !needPrestige){
        selectedMap = findFirstVoidMap(); //returns map object or false
        statusMsg = 'VMs Left: ' + game.global.totalVoidMaps + "<br>";
    }
    
    //spire specific
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 8);
    var stackSpireGetMinDamage = stackSpire && stackSpireOneTime && (game.global.lastClearedCell + 1 === 0) && (checkForGoodCell(0));
    spireTime = (getGameTime() - game.global.zoneStarted) / 1000 / 60;
    preSpireFarming = isActiveSpireAT() && getPageSetting('MinutestoFarmBeforeSpire') !== 0 && (spireTime < getPageSetting('MinutestoFarmBeforeSpire') || getPageSetting('MinutestoFarmBeforeSpire') < 0);
    spireMapBonusFarming = getPageSetting('MaxStacksForSpire') && isActiveSpireAT() && game.global.mapBonus < 10;

    if (preSpireFarming || spireMapBonusFarming || stackSpireGetMinDamage)
        shouldDoMaps = true;

    if (spireMapBonusFarming) 
        statusMsg = 'Spire Bonus<br>';

    var moreFarmingFlag = false;
    var desiredLMC = game.global.world < 60 ? getPageSetting('Pre60LMC') : getPageSetting('Post60LMC');
    var desiredLSC = game.global.world < 60 ? getPageSetting('Pre60LSC') : getPageSetting('Post60LSC');
    var desiredLWC = game.global.world < 60 ? getPageSetting('Pre60LWC') : getPageSetting('Post60LWC');
    if(nextCacheCounter == "lmc" && game.global.lastClearedMapCell == -1){
        nextCacheCounter = "";
        LMCDone++;
    }
    if(nextCacheCounter == "lsc" && game.global.lastClearedMapCell == -1){
        nextCacheCounter = "";
        LSCDone++;
    }
    if(nextCacheCounter == "lwc" && game.global.lastClearedMapCell == -1){
        nextCacheCounter = "";
        LWCDone++;
    }
    if(getPageSetting('MoreFarming') && (LMCDone < desiredLMC || LSCDone < desiredLSC || LWCDone < desiredLWC)){
        shouldDoMaps = true;
        moreFarmingFlag = true;
    }
    if(!moreFarmingReset && AutoPerks.gigaStations.indexOf(game.global.world) != -1 && game.global.lastClearedCell >= 22){
        resetMoreFarming();
        moreFarmingReset = true;
    }

    var SpireLWCFlag = false;
    if(isActiveSpireAT() && getPageSetting('SpireLWCAmount') !== 0 && (LWCDoneAmount < getPageSetting('SpireLWCAmount') || getPageSetting('SpireLWCAmount') < 0)){
        shouldDoMaps = true;
        SpireLWCFlag = true;
    }

    //Allow automaps to work with in-game Map at Zone option:
    var shouldDoMapsVanillaRepeat = false;
    if (game.options.menu.mapAtZone.enabled && game.global.canMapAtZone && !isActiveSpireAT())
        for (var x = 0; x < game.options.menu.mapAtZone.setZone.length; x++){
             if (game.global.world == game.options.menu.mapAtZone.setZone[x]){
                 shouldDoMaps = true;
                 shouldDoMapsVanillaRepeat = true; 
                 break;
             }
        }
    
    var preferFAMaps = false;

    if(game.equipment["Dagger"].level > 100 && game.equipment["Greatsword"].level > 100 && !windZone())
        preferFAMaps = true;

    if(game.talents.hyperspeed2.purchased && game.global.world <= Math.floor((game.global.highestLevelCleared+1)/2))
        preferFAMaps = false; //FA and hyper2 do not stack. if hyper2 is active no reason to use fa

    var siphlvl = game.global.world - game.portal.Siphonology.level;
    var desiredMapLevel = siphlvl;
    var desiredMapType  = preferFAMaps ? "fa" : (game.global.highestLevelCleared < 185 ? "" : "lmc"); //havent unlocked LMC yet
    var desiredMapCheap = enoughDamage;
    var desiredMapFrags = 0.5;
    
    if(!selectedMap && shouldDoMaps){ //if we want to run a unique map or void, selectedMap is already pointing at the map object.
        if(SpireLWCFlag){
            desiredMapLevel = game.global.world - (game.talents.mapLoot.purchased ? 1 : 0);
            desiredMapType  = "lwc";
            desiredMapFrags = 0.8;
        }
        else if(moreFarmingFlag){
            desiredMapLevel = game.global.world + 10;
            desiredMapCheap = false;
            desiredMapFrags = 0.5;
            if(LMCDone < desiredLMC)      desiredMapType = "lmc";
            else if(LSCDone < desiredLSC) desiredMapType = "lsc";
            else if(LWCDone < desiredLWC) desiredMapType = "lwc";
        }
        else if(needPrestige){
            desiredMapLevel = getScientistLevel() >= 5 ? lastPrestigeZone(true) : game.global.world;
            desiredMapType  = "p";
            desiredMapFrags = 0.7;
            statusMsg = "Prestige" + (getScientistLevel() >= 5 ? ": " + addSpecialsAT(game.global.world) : "");
        }
        else if(preSpireFarming){
            desiredMapLevel = game.global.world - (game.talents.mapLoot.purchased ? 1 : 0);
            desiredMapType  = "lmc";
            desiredMapCheap = false;
            desiredMapFrags = 1;
            
            var minSp = getPageSetting('MinutestoFarmBeforeSpire');
            if(getPageSetting('MinutestoFarmBeforeSpire') < 0){ //farm for infinity
                var hours = Math.floor(spireTime / 60).toFixed(2);    
                var mins = Math.floor(spireTime - 60*hours).toFixed(0);
                var secs = Math.floor((spireTime - mins) * 60 % 60).toFixed(0)
            }
            else{
                var secs = Math.floor(60 - (spireTime * 60) % 60).toFixed(0)
                var mins = Math.floor(minSp - spireTime).toFixed(0);
                var hours = minSp - (spireTime / 60).toFixed(2);
            }
            var spiretimeStr = (spireTime >= 60) ?
                (hours + 'h') : (mins + 'm:' + (secs >= 10 ? secs : ('0' + secs)) + 's');
            if(getPageSetting('MinutestoFarmBeforeSpire') < 0) //farm for infinity
                statusMsg = spiretimeStr + '<br>';
            else
                statusMsg = spiretimeStr + ' left<br>';
            
        }
        else if(shouldDoMapsVanillaRepeat){
            desiredMapLevel = game.global.world;
            desiredMapType  = "lmc";
            desiredMapCheap = false;
            desiredMapFrags = 1;
            statusMsg = "Mapping at z" + game.global.world;
        }

        //now we know desired map level and type, lets check if we already have such a map
        for (var map in game.global.mapsOwnedArray)
            if(!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == desiredMapLevel && (desiredMapType == "" || game.global.mapsOwnedArray[map].bonus == desiredMapType)){
                selectedMap = game.global.mapsOwnedArray[map];
                break;
            }
    }
    
    /*
    3 cases based on where we are: 
    1) in a map - decide what to do with repeat button
    2) in the world - do we need to enter the map screen?
    3) in premap screen - create/select a map and run it, or go back to world*/
    
    //#1 in a map, figure out repeat button
    if (game.global.mapsActive){
        if (game.global.soldierHealth <= 0)
            fightManualAT(); //smart enough to only attack early if our army can survive for decent chunk of time

        if(currMap.location == "Void"){
            AutoMapsCoordOverride = true;
            if(doVoids && !game.global.repeatMap)
                repeatClicked(); //enable repeat
            if(!doVoids && game.global.repeatMap)
                repeatClicked(); //disable repeat
            if(useScryhard2())
                goDefaultStance(4);
        }
        else if(selectedMap != currMap){ //if we are not where we want to be, then disable repeat
            if (game.global.repeatMap)
                repeatClicked();
        }
        else{
            if(currMap.bonus == "lmc" && game.global.lastClearedMapCell > 0) nextCacheCounter = "lmc";
            else if(currMap.bonus == "lsc" && game.global.lastClearedMapCell > 0) nextCacheCounter = "lsc";
            else if(currMap.bonus == "lwc" && game.global.lastClearedMapCell > 0) nextCacheCounter = "lwc";

            if (!game.global.repeatMap) //start with repeat button on
                repeatClicked();

            var repeatChoice = 1; //0 - forever 1 - map bonus 2 - items 3 - any
                        
            if((DHratio / ourBaseDamage * ourBaseDamagePlusOne) > threshold)
                repeatChoice = 2; //psuedo 'repeat off' if we dont need more damage
            
            if(addSpecialsAT(currMap.level) > 0){ //we still need prestige from our current map
                repeatChoice = 2;
                statusMsg = "Prestige: " + addSpecialsAT(game.global.world);//specials;
            }
            
            if(preSpireFarming){
                repeatChoice = 0;
                statusMsg = "Pre Spire Farming";
            }
            
            if(SpireLWCFlag && (LWCDoneAmount < getPageSetting('SpireLWCAmount') || getPageSetting('SpireLWCAmount') < 0) && currMap.bonus == "lwc"){ //in a wooden cache map farming wood for spire
                repeatChoice = 0;
                if(LWCLastCell > game.global.lastClearedMapCell + 1) //if LWCLastCell is smaller, that means we've finished a map, so increase the wooden maps done count by 1
                    LWCDoneAmount++;
                LWCLastCell = game.global.lastClearedMapCell + 1;
                var txt = getPageSetting('SpireLWCAmount') < 0 ? "∞" : getPageSetting('SpireLWCAmount');
                statusMsg = "Spire LWC " + LWCDoneAmount + " / " + txt;
            }
            
            if(moreFarmingFlag){
                goDefaultStance(4); //S
                statusMsg = "More Farming"+"</br>"+LMCDone+"/"+desiredLMC+" "+LSCDone+"/"+desiredLSC+" "+LWCDone+"/"+desiredLWC;
            }
            else
                goDefaultStance(); //D if we have it, X otherwise
            
            if(shouldDoMapsVanillaRepeat)
                repeatChoice = 0;
            
            //turn off repeat if we're running a unique map that isnt BW, or we're in more farming mode (1 map of each type)
            if ((currMap.noRecycle && currMap.name != 'Bionic Wonderland') || moreFarmingFlag)
                repeatClicked();
            
            if(repeatChoice == 1)  statusMsg = "Map Bonus ";
            while (game.options.menu.repeatUntil.enabled != repeatChoice){ //select the correct repeat until option
                toggleSetting('repeatUntil');
            }
        }
        return;
    }
    
    //#2 in the world
    else if (!game.global.preMapsActive && !game.global.mapsActive){
        if (selectedMap || shouldDoMaps){ //we want to run a map
            //before we go into premap screen, lets see that we are able to run a map that we want
            decideMapParams(desiredMapLevel, desiredMapType, desiredMapCheap, desiredMapFrags);
            var desiredMapLevelBackup = desiredMapLevel;
            if(extraLevels > 0) desiredMapLevel = game.global.world;

            //search for existing map in our maps
            for (var map in game.global.mapsOwnedArray)
                if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == desiredMapLevel+extraLevels && (specialMod == "" || game.global.mapsOwnedArray[map].bonus == specialMod)){
                    selectedMap = game.global.mapsOwnedArray[map];
                    break;
                }
            if(!selectedMap && cost > game.resources.fragments.owned) //if we dont have a map we want to run and cant afford one, dont go to premap screen
                return;
            desiredMapLevel = desiredMapLevelBackup; //return to previous since we are about to go into next premaps part
            mapsClicked(true);
        }
    } 
    
    //#3 in premap screen
    if (game.global.preMapsActive){
        if (!selectedMap && !shouldDoMaps)
            mapsClicked(); //go back to world
        else{
            if (!selectedMap){
                var flag = decideMapParams(desiredMapLevel, desiredMapType, desiredMapCheap, desiredMapFrags);
                if(extraLevels > 0) desiredMapLevel = game.global.world;
                
                //before we create a map, search for existing one in our maps
                for (var map in game.global.mapsOwnedArray)
                    if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == desiredMapLevel+extraLevels && (specialMod == "" || game.global.mapsOwnedArray[map].bonus == specialMod)){
                        selectedMap = game.global.mapsOwnedArray[map];
                        break;
                    }
                if(!selectedMap){ //make a new map
                    var flag2 = createAMap(desiredMapLevel, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                    selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1]; //the map we just created
                    if(!flag || !flag2 || !selectedMap){
                        debug("Can't afford map with parameters. level: " + desiredMapLevel + " specialMod: " + specialMod, "maps");
                        debug("error in creating map process. Can't afford it? Exiting maps.", "maps");
                        return;
                    }
                }
            }
            if(typeof selectedMap === 'undefined' || !selectedMap){
                debug("no selected map, exiting.");
                mapsClicked(true);
                return;
            }
            selectMap(selectedMap.id);
            if(!spireMapBonusFarming && stackSpireGetMinDamage){ //enter map, go to premaps. enter map - manual fight - go to premaps - exit to world - manual fight
                debug("Lowering damage for Spire IV");
                var deltaGenes = getDeltaGenes(1);
                if(deltaGenes > 0 && game.global.antiStacks >= 3){ //if we need to fire geneticists
                    switchOffGA(); //pause autogeneticist  
                    debug("Automaps: Trimpiciding " + game.global.antiStacks + "->1. Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes));
                    fireGeneticists(deltaGenes);
                    
                    runMap();                           //--enter map
                    fightManual();                      //--fight
                    mapsClicked(true);                  //--exit map

                    var start = getGameTime();
                    while(game.global.breedBack > 0){
                        var current = getGameTime();
                        if(current-start > 1000){
                            debug("error: took too long to breed back army. exiting.");
                            break;
                        }
                    }
                    runMap();                           //--enter map
                    fightManual();                      //--fight
                    switchOnGA();
                    mapsClicked(true);                  //--exit map
                    recycleMap();                    
                }
                
                mapsClicked();                      //--exit to world
                fightManual();                      //--fight
                stackSpireOneTime = false;
                return;
            }
            else{
                var levelText = " Level: " + selectedMap.level;
                var voidorLevelText = selectedMap.location == "Void" ? " Void: " : levelText;
                var stanceText = "";
                if(selectedMap.location == "Void" && useScryhard2()){
                    goDefaultStance(4);
                    stanceText = " in S";
                }
                else {
                    //goDefaultStance(2);
                    if (selectedMap.location == "Void")
                        stanceText = " not in S";
                }
                debug("Running selected " + selectedMap.id + voidorLevelText + " Name: " + selectedMap.name + stanceText, "maps", 'th-large');
                runMap();
                currMap = selectedMap;
            }
        }
    }
}

//update the UI with stuff from automaps.
function updateAutoMapsStatus(get, msg, final){
    var status;
    if (msg === "" || msg === undefined || msg.length === 0) 
        status = "";
    else
        status = msg;

    //hider he/hr% status
    var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    var hiderStatus = 'He/hr: ' + getPercent.toFixed(4) + '%';// + '%<br>&nbsp;&nbsp;&nbsp;He: ' + lifetime.toFixed(3) + '%';

    if (get) {
        if (doVoids) return 'VMs Left: ' + game.global.totalVoidMaps;
        else return statusMsg;
    } 
    else if(final && !ATmakeUp){
        var elemA = document.getElementById('autoMapStatus');
        if(status != elemA.innerHTML)
            elemA.innerHTML = status;
        var b1 = "Ratio: " + formattedRatio;
        var b2 = hiderStatus;
        var elemB1 = document.getElementById('hiderStatus1');
        if(b1 !== elemB1.textContent) elemB1.textContent = b1;
        var elemB2 = document.getElementById('hiderStatus2');
        if(b2 !== elemB2.textContent) elemB2.textContent = b2;
    }
}

function praidAutoStartHelper(){
    var score = 1;
    if(game.global.challengeActive == "Obliterated") score = score / 400;
    
    if(game.global.world < 236) return score;
    var cycle = cycleZone();
    if(cycle < 5)        return score*0.003;  //xx6-xx0 poison
    else if (cycle < 10) return score*0.6;    //xx1-xx5 wind
    else if (cycle < 15) return score*0.5;    //xx6-xx0 ice
    else if (cycle < 20) return score*0.003;  //xx1-xx5 poison
    else if (cycle < 25) return score*5;      //xx6-xx0 wind
    else                 return score*1;      //xx1-xx5 ice
}

function praidAutoStart(){
    var zonesToEndOf5 = game.global.world % 5 === 0 ? 0 : 5 - game.global.world % 5;
    var HPMultTill5 = Math.pow(2, zonesToEndOf5);
    var DHRatioIn5 = DHratio / HPMultTill5;
    var score = DHRatioIn5 * praidAutoStartHelper();
    if(score < 100 && calculateMaxAfford(game.equipment["Dagger"], false, true, false, false, 1) < 4)
        return game.global.world;
    else 
        return 999;
}

//returns true when done
function PrestigeRaid() {
    if(game.global.highestLevelCleared < 210) //locked until hze 210
        return true;
    
    var PAggro = getPageSetting('PAggression'); //0 - light 1 - aggressive. 
    var PRaidMax = getPageSetting('PRaidingMaxZones'); //max zones to plus map
    
    if (PRaidMax > 10){
        PRaidMax = 10;
        setPageSetting('PRaidingMaxZones', 10);
    }
    else if (PRaidMax < 0){
        PRaidMax = 0;
        setPageSetting('PRaidingMaxZones', 0);
    }
    
    //at the zone where we BW, we want the most gear from normal maps that is possible.
    if (BWRaidNowLogic())
        PRaidMax = 10;
    else if (getPageSetting('PRaidingZoneStart') <= 0 || PRaidStartZone === -1 || game.global.world < PRaidStartZone || PRaidMax <= 0){
        //normal raiding setting are kicking us out, but first check for spire raiding specific settings:
        if(!game.global.spireActive) return true; //not in spire, leave
        if(getPageSetting('PRaidSpireMulti') == 0) return true; //spire raiding off, leave
        var spireMinus1Level = Math.ceil(getPageSetting('IgnoreSpiresUntil')/100)*100-100; //1 spire before first active spire
        if(game.global.world < spireMinus1Level) return true; //we're below spire minus 1, leave
        if(!isActiveSpireAT() && getPageSetting('PRaidSpireMulti') != 2) return true; //we're at spire minus 1, but spire raiding is only in active spires
    }
    
    var havePrestigeUpTo = lastPrestigeZone(); // check currently owned prestige levels
    findDesiredMapLevel(PRaidMax, PAggro, havePrestigeUpTo); //finds min and max levels we want to raid
    
    if(havePrestigeUpTo > maxDesiredLevel) //have all the prestige levels that we want.
        return true; 
    if(havePrestigeUpTo === maxDesiredLevel && prestigeState === 2) //have all
        return true; 
    var aboutToSpire = game.global.world % 100 === 0 || game.global.world % 100 >= 95; //when spire is coming up, we want that last gambesome prestige as well
    if(havePrestigeUpTo === maxDesiredLevel && prestigeState === 1 && !aboutToSpire && !BWRaidNowLogic() && (maxDesiredLevel >= expectedPortalZone || bsZone >= maxDesiredLevel)) //when to skip last gambes
    //if(havePrestigeUpTo === maxDesiredLevel && prestigeState === 1 && game.global.world % 100 !== 0 && !BWRaidNowLogic() && (maxDesiredLevel >= expectedPortalZone || bsZone >= maxDesiredLevel)) //when to skip last gambes
        return true;
    if(expectedPortalZone == game.global.world && !doVoids && !isActiveSpireAT()) //last zone and we dont need any void maps
        return true;
    
    if (game.global.mapsActive){ //if we are in a map
        //do we need prestige from this map?
        if(addSpecialsAT(currMap.level) > 0){
            var map = currMap;
            if(currMap.location === "Bionic")
                statusMsg = "BW Raiding: " + addSpecialsAT(currMap.level);
            else
                statusMsg = "Prestige Raid: " + addSpecialsAT(maxDesiredLevel);
            
            //if this is last run we need of the map, turn off repeat button
            var levelFromThisRun = Math.max(Math.floor(dropsAtZone(game.global.mapGridArray[game.global.mapGridArray.length-1].special, true)), Math.floor(dropsAtZone(game.global.mapGridArray[game.global.mapGridArray.length-2].special, true)))
            if (levelFromThisRun == currMap.level && game.global.repeatMap) 
                repeatClicked();
        }
        else{
            if (game.global.repeatMap) //make sure repeat button is turned off 
                repeatClicked();
            statusMsg = "Prestige Raid: " + addSpecialsAT(maxDesiredLevel);
        }
        return false;
    }
    
    //this code prevents us from killing our army and going into map screen under certain conditions:    
    if (game.global.soldierHealth > 1000){//if we have an army currently fighting
        if(!game.global.mapsActive && !game.global.preMapsActive){ //and we are in the world screen
            if (game.resources.trimps.owned < trimpsRealMax){ //and we dont have another army ready, then we may as well stay in the world until another army is ready. may not be true for some dailies
                if (getEmpowerment() == "Poison"){
                    if(game.global.world % 10 != 5 && game.global.world % 10 != 0){ //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                        if(!doVoids)
                            return false; //we'll want to keep revisiting prestigeRaid until something changes
                        else //need to run void maps
                            return true;
                    }
                }
            }
        }
    }
    
    //first, lets create maps for each level between minDesiredLevel and maxDesiredLevel
    var map = false;
    for(var lvl = maxDesiredLevel; lvl >= minDesiredLevel; lvl--){
        if(lvl % 10 > 5 || lvl % 10 === 0)
            continue;
        map = findMap(lvl); //ignores uniques
        if(!map){ //if we don't have a map, create one using 80% of our available fragments
            if(decideMapParams(lvl, "p", true, 0.8)){ //this also sets the variables that createAMap uses
                if (!game.global.preMapsActive && !game.global.mapsActive) //in world, get to map screen
                    mapsClicked(true);
                var flag = createAMap(game.global.world, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                if (!flag){
                    debug("error in creating map process");
                    return true;
                }
            }
            else if (lvl == maxDesiredLevel){ //we really want ANY map of the highest level, even if its a bad one. if we cant buy it with 80% frag, try with 100%
                if(decideMapParams(lvl, "p", true)){
                    if (!game.global.preMapsActive && !game.global.mapsActive) //in world, get to map screen
                        mapsClicked(true);
                    var flag = createAMap(game.global.world, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                    if (!flag){
                        debug("error in creating map process");
                        return true;
                    }
                }
            }    
        }
    }
    
    //Let's see if we already own a map of suitable level
    var map = false;
    for(var i = minDesiredLevel; i <= maxDesiredLevel; i++){
        map = findMap(i); //ignores uniques
        if(map)
            break;
    }
    
    if(!map)
        return true;

    selectMap(map.id);
    
    //debug("havePrestigeUpTo = " + havePrestigeUpTo + " | minDesiredLevel = " + minDesiredLevel + " | maxDesiredLevel = " + maxDesiredLevel);
    runMap();
    goDefaultStance(); //D if we have it, X otherwise
    currMap = map;
    statusMsg = "Prestige Raid: " + addSpecialsAT(maxDesiredLevel);

    if (!game.global.repeatMap) {
        repeatClicked();
    } 
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
    
    return false;
}

function findNextBionic() {
    var highestBionicMap = null;
    var maxLevel = game.global.world + getPageSetting('BWraidingmaxLevel');
    var cap = getPageSetting('BWraidingmax');
    if(maxLevel > cap)
        maxLevel = cap;

    for (var map of game.global.mapsOwnedArray){
        if (map.level > maxLevel || map.location !== "Bionic")
            continue;
        
        if(highestBionicMap == null){
            highestBionicMap = map;
            continue;
        }
        
        if (addSpecialsAT(highestBionicMap.level) > 0){ //if we need prestiges from our map, only take a lower bionic if we need prestiges from it as well
            if(highestBionicMap.level > map.level && addSpecialsAT(map.level) > 0)
                highestBionicMap = map;
        }
        else if(highestBionicMap.level < map.level)//we dont need anything from our bionic, so look for a higher one
            highestBionicMap = map;
    }
        
    if (highestBionicMap == null)
        return false;
    if (highestBionicMap.level > maxLevel)
    	return false;
    if (addSpecialsAT(highestBionicMap.level, true) === 0) //if we already at max level and dont need gear, stop
    	return false;
    return highestBionicMap;
}

function BWRaidNowLogic(){
    var setting = getPageSetting('BWRaidSetting');
    if(setting === 0)                                                                                        return false; //never
    else if(setting === 1 && !game.global.runningChallengeSquared)                                           return false; //c2 only
    else if(setting === 2 && !game.global.runningChallengeSquared && game.global.challengeActive != "Daily") return false; //c2 + dailies
    else if(game.global.world < getPageSetting('BWraidingmin') || (game.global.challengeActive != "Trimp" && game.global.world >= 236 && !((cycleZone() == 4 || cycleZone() == 19) || (game.global.world % 10 === 9 && game.global.challengeActive == "Obliterated")))) return false;
    return true;                                                                                                                
}

//returns true when done
function BWraiding() {
    if(!BWRaidNowLogic())
        return true;
    
    //find the lowest bionic map that still has items for us
    var nextBionicMap = findNextBionic();
    if(!nextBionicMap){
        //debug("could not find a bionic map to run. are you zone 125 yet?");
        return true;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive)  //if we are in world, get to map screen
        mapsClicked(true);
    
    if(game.global.mapsActive){ //already in a map
        if(nextBionicMap == currMap){ //doing our BW map
            if (!game.global.repeatMap) {
                repeatClicked();
            } 
            while (game.options.menu.repeatUntil.enabled != 2) {
                toggleSetting('repeatUntil'); //repeat for all items
            }
            statusMsg = "BW Raid " + nextBionicMap.level + ": "+ addSpecialsAT(currMap.level);
        }
        else { //we're in another map
            if (game.global.repeatMap) {
                repeatClicked();
            } 
            statusMsg = "Finishing map";
        }
        return false;
    }

    selectMap(nextBionicMap.id);
    runMap();
    goDefaultStance(); //D if we have it, X otherwise
    currMap = nextBionicMap;
    if (!game.global.repeatMap) {
        repeatClicked();
    } 
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
    statusMsg = "BW Raiding: "+ addSpecialsAT(currMap.level);
    return false;
 }

function createAMap(baseLevel, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect){
    if (!game.global.preMapsActive && !game.global.mapsActive)
        mapsClicked(true);
    
    while (game.options.menu.repeatUntil.enabled != 2)
        toggleSetting('repeatUntil'); //repeat for all items
                
    if (game.global.preMapsActive){ 
        document.getElementById("mapLevelInput").value = baseLevel;
        if (baseLevel != game.global.world)
            extraLevels = 0;
        
        //sets the map sliders before buying the map for prestige
        document.getElementById("biomeAdvMapsSelect").value = type;
        document.getElementById('advExtraLevelSelect').value = extraLevels; //returns delta map for all prestige
        if(specialMod == "p")
            document.getElementById('advSpecialSelect').value = "p"; 
        else if(specialMod == "fa")
            document.getElementById('advSpecialSelect').value = "fa"; 
        else if(specialMod == "lmc")
            document.getElementById('advSpecialSelect').value = "lmc"; 
        else if(specialMod == "lwc")
            document.getElementById('advSpecialSelect').value = "lwc"; 
        else if(specialMod == "lsc")
            document.getElementById('advSpecialSelect').value = "lsc"; 
        else
            document.getElementById('advSpecialSelect').value = "0";
        document.getElementById("lootAdvMapsRange").value = lootSlider;
        document.getElementById("difficultyAdvMapsRange").value = diffSlider;
        document.getElementById("sizeAdvMapsRange").value = sizeSlider;

        var perfBox = document.getElementById('advPerfectCheckbox');
        if(readNiceCheckbox(perfBox) !== perfect) swapNiceCheckbox(perfBox, perfect);
        updateMapCost();        
        
        var perfectText = (perfect ? "Perfect" : "");
        var specialModText = (specialMod ? specialMod : "vanilla");
        var typeText = (type == "Plentiful" ? "Garden" : type);
        if(cost != updateMapCost(true)) 
            debug( "createAMap: cost " + cost.toExponential(2) + " mismatch updateMapCost(true) " + updateMapCost(true).toExponential(2));
        debug("Level = "+(baseLevel+extraLevels)+"|"+parseFloat(lootSlider)+"|"+parseFloat(sizeSlider)+"|"+parseFloat(diffSlider)+"|"+specialModText+"|"+perfectText+"|"+typeText+" cost: " + cost.toPrecision(3) + " / " + game.resources.fragments.owned.toPrecision(3) + " fragments.", "maps");
        
        if ((updateMapCost(true) <= game.resources.fragments.owned)){
            var result = buyMap();
            if (result == -2) {
                debug("Too many maps, recycling now: ", "maps", 'th-large');
                recycleBelow(true);
                debug("Retrying, Buying a Map, level: #" + (baseLevel+extraLevels), "maps", 'th-large');
                buyMap();
            }
            return true;
        }
        else{
            debug("Can't afford map. Map level: " + (game.global.world+extraLevels) + ", " + prettify(game.resources.fragments.owned) + " / " + prettify(updateMapCost(true)) + " frags.");
            return false;
        }
    }
    else
        debug("error: not in premap screen");
    return false;
}

//searches for a map of at least minimum level
function findMap(level){
    var map1 = false;
    var map2 = false;
    for (var map in game.global.mapsOwnedArray)
        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == level){
            map1 = game.global.mapsOwnedArray[map];
            break;
        }
    
    //prestigeState: 0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    if(!map1 || addSpecialsAT(map1.level) > 1) //if no map of level - nothing to run. if it has multiple items in it, run it
        return map1;
    
    //map has 1 item remaining. we can either run it, or run a prestigious map of 1 level higher
    for (var map in game.global.mapsOwnedArray)
        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == level+1 && game.global.mapsOwnedArray[map].bonus == "p"){
            map2 = game.global.mapsOwnedArray[map];
            break;
        }
    if(map2)
        return map2;
    return map1;
}

function decideMapParams(baseLevel, special, cheap, fragCap){
    var fragments = game.resources.fragments.owned * (fragCap === undefined ? 1 : fragCap);
    var sizeLast=0, diffLast=0, lootLast=0, specialModLast="", perfectLast=false, typeLast="Random";
    var extraLevelsLast = baseLevel > game.global.world ? baseLevel - game.global.world : 0;
    if(baseLevel > game.global.world) baseLevel = game.global.world;
    var fragments = game.resources.fragments.owned * (fragCap === undefined ? 1 : fragCap);

    cost = calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast);
    if(cost > fragments){
        debug("can't afford map level " + baseLevel + " " + cost.toExponential(2));
        return false;
    }

    var mostExpensiveType;
    if (cheap)
        mostExpensiveType = "Random";
    else{
        if(!getPageSetting('PreferMetal') && game.global.decayDone)
            mostExpensiveType = "Plentiful";
        else
            mostExpensiveType = "Mountain";
    }
    
    var backupSpecial = special;
    if(special == "lmc" || special == "lwc" || special == "lsc") //shoe-horning lwc and lsc maps to fit lmc logic. they cost the same so store in backup and restore later
        specialModLast = "lmc";

    cost = calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast);
    if(cost > fragments){ //we cant afford our special mod, so revert to vanilla
        //debug("can't afford map level " + baseLevel + " mod " + special + " " + cost.toExponential(2));
        specialModLast = "";
    }
    
    //order of importance for prestigious maps (prestige mode):
    //size > prestigious > difficulty > perfect
    //order of importance for LMC maps (map bonus/metal):
    //LMC (must have) > size  > difficulty > loot > perfect > Garden
    
    //iterate over all values in order of priority to find the best map we can afford.
    //at all times the 'Last' variables hold affordable configuration.
    
    //while(true){
        for(lootEnum = 0; lootEnum <= 9; lootEnum++){
            if(calcMapCost(baseLevel, sizeLast, diffLast, lootEnum, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                lootLast = lootEnum;
            else
                break;            
            
            for(diffEnum = 0; diffEnum <= 9; diffEnum++){
                if(calcMapCost(baseLevel, sizeLast, diffEnum, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                    diffLast = diffEnum;
                else
                    break;

                if(special != "lmc"){ //LMC never skip. prestigious maybe skip
                    if(calcMapCost(baseLevel, sizeLast, diffLast, lootLast, special, perfectLast, extraLevelsLast, typeLast) < fragments){
                         specialModLast = special;
                    }
                    else
                        specialModLast = "";
                }

                for(sizeEnum = 0; sizeEnum <= 9; sizeEnum++){
                    if(calcMapCost(baseLevel, sizeEnum, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                        sizeLast = sizeEnum;
                    else
                        break;
                }
            }
        }
        
        if(sizeLast+diffLast+lootLast < 27)
            perfectLast=false;
        else{
            if(calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, true, extraLevelsLast, typeLast) < fragments)
                perfectLast = true;
            else
                perfectLast = false;
        }
        
        if(2 * calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
            typeLast = mostExpensiveType;
        else
            typeLast = "Random";
        
        sizeSlider = sizeLast;
        diffSlider = diffLast;
        lootSlider = lootLast;
        specialMod = specialModLast;
        extraLevels = extraLevelsLast;
        perfect = perfectLast;
        type = typeLast;
        
        /*if(extraLevelsLast+1 > maxLevel-baseLevel)
            break;
        
        if(specialModLast == "lmc"){
            if(calcMapCost(baseLevel, 0, 0, 0, "lmc", false, extraLevelsLast+1, "Random") < fragments){
                sizeLast=0; diffLast=0; lootLast=0; specialModLast="lmc"; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
            }
            else
                break;
        }
        else if(calcMapCost(baseLevel, 0, 0, 0, specialModLast, false, extraLevelsLast+1, "Random") < fragments){
             sizeLast=0; diffLast=0; lootLast=0; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
        }
        else
            break;
    }*/
    
    if(specialMod == "lmc") specialMod = backupSpecial;
    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type); //this last calcMapCost call also sets the special map type (lmc/lwc/lsc) to the correct type
    
    if(cheap && cost > fragments * 0.1 && getPageSetting('PAggression') < 2){ //perfect map costs <10% frags, or endgame praid mode
        lootSlider = 0;
        perfect = false;
        type = "Random";
    }
    
    //check if specialMod is unlocked already
    if(specialMod == "p" && game.global.highestLevelCleared < 135) specialMod = "";
    if(specialMod == "lmc" && game.global.highestLevelCleared < 185) specialMod = "";
    
    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
    
    if(fragments >= cost)
        return true;
    else //something went wrong, revert to base
    {
        debug("decideMapParams error - cant afford map");
        specialMod = "";
        cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
        if(fragments >= cost)
            return true;
        else
            return false;
    }
}

function findDesiredMapLevel(PRaidMax, PAggro, havePrestigeUpTo){
    var empowerment = getEmpowerment();
    var lastDigitZone = game.global.world % 10;
    
    if(game.global.spireActive){
        maxDesiredLevel = game.global.world + 5;
        minDesiredLevel = game.global.world + 1;
    }
    //there are 7 cases: poison/wind/ice (each 2 cases depending on zones xx1-xx5 or xx6-x10), and 7th case for no empowerment before zone 236.
    else if (empowerment == "Ice"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5 here aggressive is same as light because poison zones are coming up
            maxDesiredLevel = game.global.world - lastDigitZone + 5; 
            minDesiredLevel = game.global.world - lastDigitZone + 1; 
        }
        else if (lastDigitZone > 5){ //xx6-xx9
            if(PAggro == 0){
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
            else{ //PAggro == 1
                maxDesiredLevel = game.global.world - lastDigitZone + 13;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
        else { //xx0
            if(PAggro == 0){
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
            else{
                maxDesiredLevel = game.global.world + 3;
                minDesiredLevel = game.global.world + 1;
            }
        }
    }
    else if (empowerment == "Poison"){
        if(PAggro == 0){ //low aggro poison is fairly straightforward; get to last poison zone and farm 5 or 6 zones higher
            if(lastDigitZone == 0){
                maxDesiredLevel = game.global.world + 5;
                minDesiredLevel = game.global.world + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = game.global.world + 6;
                minDesiredLevel = game.global.world + 6;
            }
            else{
                maxDesiredLevel = game.global.world - lastDigitZone + 5;
                minDesiredLevel = game.global.world - lastDigitZone + 5;
            }
        }
        else {//PAggro == 1
            if(lastDigitZone == 0){
                maxDesiredLevel = game.global.world + 5; //most available
                minDesiredLevel = game.global.world + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = game.global.world + 10; //most available
                minDesiredLevel = game.global.world + 6;
            }
            else if(lastDigitZone < 5){
                maxDesiredLevel = game.global.world - lastDigitZone + 5;
                minDesiredLevel = game.global.world + 1; //+1 level is still fine, just dont get xx6
            }
            else{ //xx6-xx9 special case, we want to run xx1 then xx2 then xx3 for faster clear
                var mod = (getPageSetting('PAggression') == 2) ? 2 : 0; //upto xx5 in endgame praid mode
                maxDesiredLevel = game.global.world - lastDigitZone + 15;
                if(maxDesiredLevel > game.global.world + 7 + mod)
                    maxDesiredLevel = game.global.world+7 + mod;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
    }
    else if (empowerment == "Wind"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5, fairly conservative because ice is coming up
            maxDesiredLevel = game.global.world - lastDigitZone + 5;
            minDesiredLevel = game.global.world - lastDigitZone + 1;
        }
        else if (lastDigitZone == 0){
            if(PAggro == 0){
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
            else{
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
        }
        else{ //xx6-xx9
            if(PAggro == 0){ 
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
            else {
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
    }
    else{ //no empowerment, pre 236
        if (lastDigitZone <= 5){
            maxDesiredLevel = game.global.world - lastDigitZone + 5;
            minDesiredLevel = game.global.world + 1;
        }
        else if(lastDigitZone == 9){
            maxDesiredLevel = game.global.world - lastDigitZone + 15;
            minDesiredLevel = game.global.world - lastDigitZone + 11;
        }
        else{
            maxDesiredLevel = game.global.world;
            minDesiredLevel = game.global.world;
        }
    }
    
    if (maxDesiredLevel > game.global.world + PRaidMax)
        maxDesiredLevel = game.global.world + PRaidMax; //dont go above user defined max
    if(maxDesiredLevel % 10 == 0) //bring 540 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - 5;
    else if (maxDesiredLevel % 10 > 5) //bring 536 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - maxDesiredLevel % 10 + 5;
    if(lastDigitZone <= 5 && minDesiredLevel < game.global.world) //always want to keep prestige at least upto current zone
        minDesiredLevel = game.global.world;
    
    //prestigeState: 0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    if(prestigeState === 2){
        if(minDesiredLevel < havePrestigeUpTo + 1)
            minDesiredLevel = havePrestigeUpTo + 1;    
    }
    else{
        if(minDesiredLevel < havePrestigeUpTo)
            minDesiredLevel = havePrestigeUpTo;
    }
    
    if(minDesiredLevel > maxDesiredLevel)
        minDesiredLevel = maxDesiredLevel;
}

function calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type){
    var baseCost = sizeSlider + diffSlider + lootSlider;
    baseCost = baseCost * (baseLevel >= 60 ? 0.74 : 1);
    if(specialMod == "p")
        baseCost += 10;
    else if(specialMod == "lmc" || specialMod == "lwc" || specialMod == "lsc")
        baseCost += 18;
    else if(specialMod == "fa")
        baseCost += 7;
    baseCost += (perfect ? 6 : 0);
    baseCost += 10 * extraLevels;
    baseCost += baseLevel;
    baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost  - 1))) * baseLevel  * 2) * Math.pow((1.03 + (baseLevel / 50000)), baseLevel))* (type == "Random" ? 1 : 2);
    return baseCost;
}

function updateMapCost(getValue){
	var mapLevel =  parseInt(document.getElementById("mapLevelInput").value, 10);
	var baseCost = 0;
	baseCost += getMapSliderValue("size");
	baseCost += getMapSliderValue("loot");
	baseCost += getMapSliderValue("difficulty");
	baseCost *= (game.global.world >= 60) ? 0.74 : 1;
	var specialModifier = getSpecialModifierSetting();
	if (specialModifier != "0")
            baseCost += mapSpecialModifierConfig[specialModifier].costIncrease;
	
	//Perfect Checkbox
	if (checkPerfectChecked())
            baseCost += 6;
	
	//Extra Levels
	var extraLevels = getExtraMapLevels();
	if (extraLevels > 0)
            baseCost += (10 * extraLevels);
	
	baseCost += mapLevel;
	baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost - 1))) * mapLevel * 2) * Math.pow((1.03 + (mapLevel / 50000)), mapLevel));
	if (document.getElementById("biomeAdvMapsSelect").value != "Random") baseCost *= 2;
	if (getValue) return baseCost;
	document.getElementById("mapCostFragmentCost").innerHTML = prettify(baseCost);
}

function lastPrestigeZone(getMin){
    var max = 1;
    var min = 999;
    var tmp;
    
    var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
    for (var i in prestigeList){
        tmp = dropsAtZone(prestigeList[i], false);
        var dropAt = (game.upgrades[prestigeList[i]].allowed+1)/2*10;
        
        if (tmp>max)
            max=tmp;
        if (dropAt < min)
            min = dropAt;
    }
    if(getMin) return Math.min(game.global.world, Math.floor(min/10)*10+5);
    
    prestigeState = 0;
    if(max % 1 > 0.35 && max % 1 < 0.45){
        //debug("only missing 1 armor prestige " + max);
        prestigeState = 1; //0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    }
    else if(max % 1 > 0.45){
        //debug("have everything from zone " + max);
        prestigeState = 2;
    }
    //if(prestigeState === 0)
        //debug("have 1-2 things from zone " + max);

    return Math.floor(max);
}

function dropsAtZone(itemName, nextLevel){
    var slotModifier=0;
    var calcNext;
    if(nextLevel === undefined)
        calcNext = false;
    else
        calcNext = nextLevel;
    switch(itemName){
        case "Dagadder":
                slotModifier=1.4;
                break;
            case "Bootboost": 
                slotModifier=1.5;
                break;
            case "Megamace":
                slotModifier=2.4;
                break;
            case "Hellishmet":
                slotModifier=2.5;
                break;
            case "Polierarm": 
                slotModifier=3.4;
                break;
            case "Pantastic": 
                slotModifier=3.5;
                break;
            case "Axeidic": 
                slotModifier=4.4;
                break;
            case "Smoldershoulder": 
                slotModifier=4.5;
                break;
            case "Greatersword": 
                slotModifier=5.2;
                break;
            case "Bestplate": 
                slotModifier=5.3;
                break;
            case "Harmbalest": 
                slotModifier=5.4;
                break;
            case "GambesOP": 
                slotModifier=5.5;
                break;
            default:
                return 0;
    }
    
    return (game.upgrades[itemName].allowed+1)/2*10-(calcNext ? 0 : 10)+slotModifier;
}

function lastDropZone(zone) {
    lastPrestigeZone(); //sets prestigeState which indicates how many drops we already have of possible drops in our last prestige zone
    var lastPrestigeZ;
    if (zone == null)
        zone = game.global.world;
    if (zone % 10 > 5)
        lastPrestigeZ = zone - (zone % 10) + 5;
    else if (zone % 10 == 0)
        lastPrestigeZ = zone-5;
    else
        lastPrestigeZ = zone;
    
    return lastPrestigeZ;
}

function preScience5NeedPrestige(){
    var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
    for (var i in prestigeList){
        if((prestigeList[i] == "Harmbalest" || prestigeList[i] == "GambesOP") && !game.global.slowDone) //not available yet
            continue;
        
        //calculate maximum allowed prestiges for each gear if we create and raid a map of world level
        var zoneModifier = 1;
        switch(prestigeList[i]){
        case "Dagadder":
                zoneModifier = 1;
                break;
            case "Bootboost": 
                zoneModifier = 1;
                break;
            case "Megamace":
                zoneModifier = 2;
                break;
            case "Hellishmet":
                zoneModifier = 2;
                break;
            case "Polierarm": 
                zoneModifier = 3;
                break;
            case "Pantastic": 
                zoneModifier = 3;
                break;
            case "Axeidic": 
                zoneModifier = 4;
                break;
            case "Smoldershoulder": 
                zoneModifier = 4;
                break;
            case "Greatersword": 
                zoneModifier = 5;
                break;
            case "Bestplate": 
                zoneModifier = 5;
                break;
            case "Harmbalest": 
                zoneModifier = 5;
                break;
            case "GambesOP": 
                zoneModifier = 5;
                break;
            default:
                zoneModifier = 1;
        }
        
        var maxAllowed = Math.floor((game.global.world - zoneModifier) / 5);
        if(game.upgrades[prestigeList[i]].allowed < maxAllowed) 
            return true;
    }
    return false;
}

function checkNeedToVoid(){
    if(game.global.totalVoidMaps === 0) return false;
    //if(game.global.world >= 300 && !poisonZone()) return false;
    var voidMapZone = getPageSetting('VoidMaps');
    
    //Add your daily zone mod onto the void maps level
    if (game.global.challengeActive === "Daily"){
        var dailyVoidMod = getPageSetting('VoidMapsDailyMod');
        if (dailyVoidMod === 999){
            dailyVoidMod = getPageSetting('AutoFinishDailyNew');
            if(dailyVoidMod === 999)
                dailyVoidMod = 0;
        }
        voidMapZone += dailyVoidMod;
    }
    
    if(voidMapZone <= 0 || voidMapZone > game.global.world) return false;
    
    var voidsuntil = getPageSetting('RunNewVoidsUntilNew');
    if(voidsuntil === 0 && voidMapZone !== game.global.world) return false;
    if(voidsuntil > 0 && voidMapZone + voidsuntil < game.global.world) return false;
    
    return game.global.lastClearedCell + 1 >= 90;
}

function findFirstVoidMap(){
    for (var map in game.global.mapsOwnedArray){
        if(game.global.mapsOwnedArray[map].location === "Void")
            return game.global.mapsOwnedArray[map];
    }
    return false;
}

function windZone(value){
    if(value !== undefined && value > 0)
        return (value-241) % 15 <= 4 && value > 240;
    else
        return (game.global.world-241) % 15 <= 4 && game.global.world > 240;
}

function poisonZone(zoneNum){
    var zone = typeof zoneNum === 'undefined' ? game.global.world : zoneNum;
    return ((zone-236) % 15 <= 4);
}

function cycleZone(zoneNum){ //poizon - wind - ice
    var zone = typeof zoneNum === 'undefined' ? game.global.world : zoneNum;
    return (zone + 3000 - 236) % 30;
}

function getRemainingSpecials(maxZone){
    if (typeof maxZone === 'undefined' || maxZone < 6)
        return -1;
    
    var highestMap = null;
    for (var mapIterator of game.global.mapsOwnedArray){
        if(mapIterator.noRecycle || mapIterator.level > maxZone)
            continue;
        if(highestMap == null)
            highestMap = mapIterator;
        else if(mapIterator.level > highestMap.level)
            highestMap = mapIterator;
    }
    if(highestMap == null)
        return 0;
    else
        return addSpecialsAT(highestMap.level);
}

function useScryhard2(){
    return game.talents.scry2.purchased && !game.global.runningChallengeSquared;
}

function addSpecialsAT(mapLevel, isBionic){
    var count = 0;
    var allowedPres;
    var prestigeList1 = ['Supershield', 'Dagadder', 'Bootboost'];
    var prestigeList2 = ['Megamace', 'Hellishmet'];
    var prestigeList3 = ['Polierarm', 'Pantastic'];
    var prestigeList4 = ['Axeidic', 'Smoldershoulder'];
    var prestigeList5 = ['Greatersword', 'Bestplate', 'Harmbalest', 'GambesOP'];

    allowedPres = Math.floor((mapLevel-1)/10) + 1;
    for (var i in prestigeList1){
        var tmp = (game.upgrades[prestigeList1[i]].allowed+1)/2;
        if(tmp < allowedPres)
            count += (allowedPres - tmp);
    }
    
    allowedPres = Math.floor((mapLevel-2)/10) + 1;
    for (var i in prestigeList2){
         var tmp = (game.upgrades[prestigeList2[i]].allowed+1)/2;
        if(tmp < allowedPres)
            count += (allowedPres - tmp);
    }
    
    allowedPres = Math.floor((mapLevel-3)/10) + 1;
    for (var i in prestigeList3){
        var tmp = (game.upgrades[prestigeList3[i]].allowed+1)/2;
        if(tmp < allowedPres)
            count += (allowedPres - tmp);
    }
    
    allowedPres = Math.floor((mapLevel-4)/10) + 1;
    for (var i in prestigeList4){
        var tmp = (game.upgrades[prestigeList4[i]].allowed+1)/2;
        if(tmp < allowedPres)
            count += (allowedPres - tmp);
    }
    
    allowedPres = Math.floor((mapLevel-5)/10) + 1;
    for (var i in prestigeList5){
        var tmp = (game.upgrades[prestigeList5[i]].allowed+1)/2;
        if(tmp < allowedPres)
            count += (allowedPres - tmp);
    }
    
    if(isBionic && (game.global.bionicOwned - Math.floor((mapLevel-125) / 15)) <= 1)
        count++;
    
    return count;
}

function calcAttacksPerSecond(){
    var agility = Math.pow(0.95, game.portal.Agility.level);
    var hyper1  = (game.talents.hyperspeed.purchased ? 0.1 : 0);
    var hyper2  = (game.talents.hyperspeed2.purchased && game.global.world <= Math.floor((game.global.highestLevelCleared+1)/2) ? 0.1 : 0);
    var fa      = (game.global.mapsActive && currMap.bonus == "fa" ? 0.1 : 0);
    return 1 / (agility - hyper1 - Math.max(hyper2, fa)); //hyper2 and fa do not stack
}

function calcDmg(){
    calcBaseDamageinB();
    
    if (game.global.gridArray.length === 0 || worldArray.length === 0) return; //world grid not created yet
    
    //automaps has its own damage getting settings, run these first.
    //getDamageCaller() will also call calcBaseDamageinB() if damage is bought.
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 8) && checkForGoodCell(0);
    if(game.global.mapsActive && !stackSpire){
        if(BWRaidNowLogic()){ //bwraid, buy all
            getDamageCaller(cell.health*8*9999, false, true);
        }
        else if(game.global.spireActive){ //mapping for prestige in spire4 without spire stacking. we probably want all the damage.
            var requiredDmgToOK = dmgNeededToOKHelper(80, worldArray[80].maxHealth);
            getDamageCaller(requiredDmgToOK*3, false, true);
        }
        else{   
            if(currMap.location == "Void"){
                var requiredDmgToOK = dmgNeededToOKHelper(cellNum, cell.health);
                getDamageCaller(requiredDmgToOK*30*8, false, true); //doing voids in S stance
            }
            if(poisonZone() && game.global.world % 10 === 5 && zoneWorth > 1){ //xx5 poison zone potentially mapping +10. if zones worth is high we dont wanna overshoot damage or we wont be able to stack properly next zone(s)
                var limit = 20;
                getDamageCaller(8*baseDamageHigh * 3*limit / DHratio, false);
            }
            else{
                var requiredDmgToOK = dmgNeededToOKHelper(cellNum, cell.health);
                getDamageCaller(requiredDmgToOK*3, false, true);
            }
        }
    }
    
    ourBaseDamage = baseDamageHigh*8;
    
    if(getPageSetting('AutoStance') === 2) //when in DE farming mode, we climb in S
        ourBaseDamage = ourBaseDamage / (game.talents.scry.purchased ? 4 : 8);

    //calculate dmg with max anticipation in autogen setting #3 (so if its lower than max, our max is lower than max
    if(game.global.antiStacks < maxAnti){
        var max = Math.min(game.global.GeneticistassistSteps[3], maxAnti);
        ourBaseDamage = ourBaseDamage * (1+0.2*max) / (1+0.2 * game.global.antiStacks);
    }
    
    //if autostance forces not to buy coordinations, factor those in. otherwise we'll enter maps for more damage thinking that we dont have enough.
    if(buyCoords == false && game.upgrades.Coordination.done < game.upgrades.Coordination.allowed && getPageSetting('AutoStance')){
        //calculate how many coordinations we could buy if we wanted to.
        var coordinationMult = 1 + 0.25 * Math.pow(0.98, game.portal["Coordinated"].level);
        var armySize = game.portal.Coordinated.currentSend;
        var population = trimpsRealMax;
        var missingCoords = 0;
        for(var i = game.upgrades.Coordination.done; i < game.upgrades.Coordination.allowed; i++){
            var tmp = Math.ceil(armySize * coordinationMult);
            if(tmp*3 >= population) break;
            missingCoords++;
            armySize = tmp;
        }
        ourBaseDamage = ourBaseDamage * Math.pow(1.25, missingCoords);
    }
    
    if(game.global.mapsActive){
        if (game.global.titimpLeft > 1)
            ourBaseDamage *= 0.5; //remove titimp bonus
        if (game.talents.bionic2.purchased && currMap.level > game.global.world)
            ourBaseDamage = ourBaseDamage / 1.5; //remove bionic2
        
        ourBaseDamagePlusOne = (ourBaseDamage * (1 + (0.2 * (game.global.mapBonus >= 10 ? game.global.mapBonus : (game.global.mapBonus + 1)))));
        ourBaseDamage *= 1 + (0.2 * game.global.mapBonus); //add map bonus
    }
    
    if (windZone() && getPageSetting('AutoStance') == 1 && !game.global.runningChallengeSquared && zoneWorth > 1)
        windMult = 0.125; //in windstacking zones, we want less dmg since more attacks is not as bad
    else
        windMult = 1;
    
    poisonMult = (getEmpowerment() == "Poison" ? poisonMultFixed : 1);
    
    var zoneRemainingHealth = sumCurrZoneHP(game.global.lastClearedCell + 1);
    var zoneHP = sumCurrZoneHP();
    
    threshold = poisonMult * windMult * zoneRemainingHealth / zoneHP * 1;
    
    DHratio = (ourBaseDamage*0.25*100) / zoneHP;
    nextZoneDHratio = DHratio / (game.jobs.Magmamancer.getBonusPercent() * ((game.global.mapBonus * .2) + 1) * 2);
    enoughDamage = DHratio > threshold;
    
    if(DHratio < 0.0001)
        formattedRatio = DHratio.toExponential(2);
    else formattedRatio = prettify(DHratio);
}
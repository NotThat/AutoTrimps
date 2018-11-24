//Create blank AutoPerks object
var AutoPerks = {};
AutoPerks.Squared = "ChallengeSquared";

//someday might implement presets back
AutoPerks.makeDefaultValueBoxes = function(){
    return presetObj("default", 2200, 333, 11, 1500, 55, 0, 605, 7, 522, 21, 0);
}

function presetObj(header, Helium, Attack, Health, Fluffy, DG, Income, maxZone, amalGoal, amalZone, coordsBehind, maxPrestigeZ){
    if(typeof autoTrimpSettings.APValueBoxes === 'undefined') autoTrimpSettings.APValueBoxes = {};
    var preset = {header:header, 
        Helium:      typeof autoTrimpSettings.APValueBoxes.Helium       !== 'undefined' ? autoTrimpSettings.APValueBoxes.Helium       : Helium,
        Attack:      typeof autoTrimpSettings.APValueBoxes.Attack       !== 'undefined' ? autoTrimpSettings.APValueBoxes.Attack       : Attack,
        Health:      typeof autoTrimpSettings.APValueBoxes.Health       !== 'undefined' ? autoTrimpSettings.APValueBoxes.Health       : Health,
        Fluffy:      typeof autoTrimpSettings.APValueBoxes.Fluffy       !== 'undefined' ? autoTrimpSettings.APValueBoxes.Fluffy       : Fluffy,
        DG:          typeof autoTrimpSettings.APValueBoxes.DG           !== 'undefined' ? autoTrimpSettings.APValueBoxes.DG           : DG,
        Income:      typeof autoTrimpSettings.APValueBoxes.Income       !== 'undefined' ? autoTrimpSettings.APValueBoxes.Income       : Income,
        maxZone:     typeof autoTrimpSettings.APValueBoxes.maxZone      !== 'undefined' ? autoTrimpSettings.APValueBoxes.maxZone      : maxZone,
        amalGoal:    typeof autoTrimpSettings.APValueBoxes.amalGoal     !== 'undefined' ? autoTrimpSettings.APValueBoxes.amalGoal     : amalGoal,
        amalZone:    typeof autoTrimpSettings.APValueBoxes.amalZone     !== 'undefined' ? autoTrimpSettings.APValueBoxes.amalZone     : amalZone,
        coordsBehind:typeof autoTrimpSettings.APValueBoxes.coordsBehind !== 'undefined' ? autoTrimpSettings.APValueBoxes.coordsBehind : coordsBehind,
        maxPrestigeZ:typeof autoTrimpSettings.APValueBoxes.maxPrestigeZ !== 'undefined' ? autoTrimpSettings.APValueBoxes.maxPrestigeZ : maxPrestigeZ
    };
    return preset;
}

AutoPerks.makeDefaultCheckBoxes = function(){
    return presetCheckObj("default", false, false, false, false, false);
}

function presetCheckObj(header, userMaxFuel, userBattleGU, userMaintainMode, userSharpTrimps, userSaveATSettings){
    if(typeof autoTrimpSettings.APCheckBoxes === 'undefined') autoTrimpSettings.APCheckBoxes = {};
    var preset = {header:header, 
        userMaxFuel:        typeof autoTrimpSettings.APCheckBoxes.userMaxFuel         !== 'undefined' ? autoTrimpSettings.APCheckBoxes.userMaxFuel         : userMaxFuel,
        userBattleGU:       typeof autoTrimpSettings.APCheckBoxes.userBattleGU        !== 'undefined' ? autoTrimpSettings.APCheckBoxes.userBattleGU        : userBattleGU, 
        userSharpTrimps:    typeof autoTrimpSettings.APCheckBoxes.userSharpTrimps     !== 'undefined' ? autoTrimpSettings.APCheckBoxes.userSharpTrimps     : userSharpTrimps, 
        userMaintainMode:   typeof autoTrimpSettings.APCheckBoxes.userMaintainMode    !== 'undefined' ? autoTrimpSettings.APCheckBoxes.userMaintainMode    : userMaintainMode, 
        userSaveATSettings: typeof autoTrimpSettings.APCheckBoxes.userSaveATSettings  !== 'undefined' ? autoTrimpSettings.APCheckBoxes.userSaveATSettings  : userSaveATSettings
    };
    return preset;
}

//Custom Creation for all perk customRatio boxes in Trimps Perk Window
AutoPerks.createInput = function(name,div, isCheckBox) {
    var input = document.createElement("Input");
    if(isCheckBox) input.setAttribute("type", "checkbox");
    input.id = name + (isCheckBox ? '' : 'Ratio');
    input.name = name;

    var oldstyle = 'text-align: center; width: calc(100vw/25); font-size: 1.0vw; ';
    if(game.options.menu.darkTheme.enabled != 2) input.setAttribute("style", oldstyle + " color: black;");
    else input.setAttribute('style', oldstyle);
    input.setAttribute('class', 'perkRatios');
    isCheckBox ? input.setAttribute('onchange', 'AutoPerks.UpdateCustomCheckBox(this.name, this.checked)') : input.setAttribute('onchange', 'AutoPerks.UpdateCustomValueBox(this.name, this.value)');
    input.setAttribute("onmouseout", 'tooltip("hide")');
    var label = document.createElement("Label");
    label.id = name + 'Label';
    label.innerHTML = name;
    label.setAttribute('style', 'margin-right: 0.7vw; width: calc(100vw/18); color: white; font-size: 0.9vw; font-weight: lighter; margin-left: 0.3vw; ');
    //add to the div.
    div.appendChild(input);
    div.appendChild(label);
    return input;
};

AutoPerks.GUI = {};
AutoPerks.initializeGUI = function() {
    let apGUI = AutoPerks.GUI;
    //Create Allocator button and add it to Trimps Perk Window
    var $buttonbar = document.getElementById("portalBtnContainer");
    apGUI.$allocatorBtn1 = document.createElement("DIV");
    apGUI.$allocatorBtn1.id = 'allocatorBtn1';
    apGUI.$allocatorBtn1.setAttribute('class', 'btn inPortalBtn settingsBtn settingBtntrue');
    apGUI.$allocatorBtn1.setAttribute('onclick', 'AutoPerks.clickAllocate()');
    apGUI.$allocatorBtn1.setAttribute('style', 'color: #ffffff;');
    apGUI.$allocatorBtn1.textContent = 'Allocate Perks';
    $buttonbar.appendChild(apGUI.$allocatorBtn1);
    $buttonbar.setAttribute('style', 'margin-bottom: 0.8vw;');
    apGUI.$customRatios = document.createElement("DIV");
    apGUI.$customRatios.id = 'customRatios';
    //Line 1 of the UI
    apGUI.$ratiosLine1 = document.createElement("DIV");
    apGUI.$ratiosLine1.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    
    var heliumBox = AutoPerks.createInput("Helium",apGUI.$ratiosLine1);
    heliumBox.setAttribute("onmouseover", 'tooltip("Helium Weight", "customText", event, "How much you value helium")');
    
    var attackBox = AutoPerks.createInput("Attack",apGUI.$ratiosLine1);
    attackBox.setAttribute("onmouseover", 'tooltip("Attack Weight", "customText", event, "How much you value attack")');
    
    var healthBox = AutoPerks.createInput("Health",apGUI.$ratiosLine1);
    healthBox.setAttribute("onmouseover", 'tooltip("Health Weight", "customText", event, "How much you value health")');
    
    var fluffyBox = AutoPerks.createInput("Fluffy",apGUI.$ratiosLine1);
    fluffyBox.setAttribute("onmouseover", 'tooltip("Fluffy Weight", "customText", event, "How much you value fluffy")');
    
    var dgBox = AutoPerks.createInput("DG",apGUI.$ratiosLine1);
    dgBox.setAttribute("onmouseover", 'tooltip("DG Weight", "customText", event, "How much you value dg")');
    
    var incomeBox = AutoPerks.createInput("Income",apGUI.$ratiosLine1);
    incomeBox.setAttribute("onmouseover", 'tooltip("Income Weight", "customText", event, "This should normally be kept at 0. Only increase this when using More Farming mode and attempting to increase early game population (pre z230) for the big C2s and intending to use a respec later.")');

    apGUI.$customRatios.appendChild(apGUI.$ratiosLine1);
    //Line 2 of the UI
    apGUI.$ratiosLine2 = document.createElement("DIV");
    apGUI.$ratiosLine2.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    
    var portalZone   = AutoPerks.createInput("maxZone",apGUI.$ratiosLine2);
    portalZone.setAttribute("onmouseover", 'tooltip("Portal Zone", "customText", event, "The zone you intend to portal on.")');
    
    var amalGoal     = AutoPerks.createInput("amalGoal",apGUI.$ratiosLine2);
    amalGoal.setAttribute("onmouseover", 'tooltip("Amalgamator Goal", "customText", event, "How many Amalgamators do you want to get.")');
    
    var amalZone     = AutoPerks.createInput("amalZone",apGUI.$ratiosLine2);
    amalZone.setAttribute("onmouseover", 'tooltip("Amalgamator Zone", "customText", event, "On which zone do you wish to hit your Amalgamator goal. 1-20 zones after a spire is generally a good place, starting spire 2.")');
    
    var coordsBehind = AutoPerks.createInput("coordsBehind",apGUI.$ratiosLine2);
    coordsBehind.setAttribute("onmouseover", 'tooltip("Coordinations Behind", "customText", event, "How many unspent Coordination upgrades will you have at your Amalgamator Zone. Pick an amount that doesnt slow you down. If first equals amalZone (you wish to amal without buying a single Coordination) will force coordinated to level 0.")');
    
    var maxPrestigeZ = AutoPerks.createInput("maxPrestigeZ",apGUI.$ratiosLine2);
    maxPrestigeZ.setAttribute("onmouseover", 'tooltip("Maximum Prestige Zone", "customText", event, "If you plan on running Bionic Warfare, put the highest level BW map you intend to raid here. Otherwise leave at 0.")');    
    
    //check boxes line
    apGUI.$checkBoxesLine3 = document.createElement("DIV");
    apGUI.$checkBoxesLine3.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    
    var checkBoxMaxFuel = AutoPerks.createInput("MaxFuel", apGUI.$checkBoxesLine3, true);
    checkBoxMaxFuel.setAttribute("onmouseover", 'tooltip("Max Fuel", "customText", event, "Force use max fuel, even after Amalgamator goal has been reached.")');
    
    var checkBoxBattleGU = AutoPerks.createInput("BattleGU", apGUI.$checkBoxesLine3, true);
    checkBoxBattleGU.setAttribute("onmouseover", 'tooltip("Use Battle Golden Upgrades", "customText", event, "Will calculate using Battle Golden Upgrades instead of 60% Void + Helium.")');
    
    var sharpTrimps = AutoPerks.createInput("SharpTrimps", apGUI.$checkBoxesLine3, true);
    sharpTrimps.setAttribute("onmouseover", 'tooltip("Calculate Sharp Trimps +50% Damage", "customText", event, "Will calculate using the extra 50% damage from purchasing Sharp Trimps for 25 bones.")');
    
    var checkBoxMaintainMode = AutoPerks.createInput("MaintainMode", apGUI.$checkBoxesLine3, true);
    checkBoxMaintainMode.setAttribute("onmouseover", 'tooltip("Maintain Amalgamator only", "customText", event, "Check this box if you in the middle of a run and already have Amalgamator Goal and wish to respec to minimum Carp1 / 2 / Coordinated to maintain it until Portal Zone. Assumes fueling until the end of the run.")');
    
    var checkBoxSaveSettings = AutoPerks.createInput("SaveATSettings", apGUI.$checkBoxesLine3, true);
    checkBoxSaveSettings.setAttribute("onmouseover", 'tooltip("Save Run Settings to AT", "customText", event, "Will save Fuel Start / Fuel End / Disables Fuel until Amalgamator / Start no Buy Coords / Amalgamator Goal to AT settings. Only occurs when the confirm button is pressed.")');
    
    //create text allocate area
    apGUI.$textArea = document.createElement("DIV");
    apGUI.$textArea.setAttribute('style', 'display: inline-block; text-align: left; width: 100%; background-color: #ffffff; font-size: 15px; color: #000000'); //black on white background                       ";
    apGUI.$textArea.id ='textAreaAllocate';
    
    apGUI.$customRatios.appendChild(apGUI.$ratiosLine2);
    apGUI.$customRatios.appendChild(apGUI.$checkBoxesLine3);
    apGUI.$customRatios.appendChild(apGUI.$textArea);

    //Add it all to the perk/portal screen
    var $portalWrapper = document.getElementById("portalWrapper");
    $portalWrapper.appendChild(apGUI.$customRatios);
};

//a value box has changed
AutoPerks.UpdateCustomValueBox = function(name, value){
    autoTrimpSettings.APValueBoxes = AutoPerks.makeDefaultValueBoxes(); //make sure datastructure intact
    
    //update new value
    if(isNaN(value) || value == "" || !jQuery.isNumeric(parseFloat(value))) value = 0;
    autoTrimpSettings.APValueBoxes[name] = parseFloat(value);
    if(typeof AutoPerks.benefitHolderObj[name] !== 'undefined') //helium, attack, health, fluffy, dg
        AutoPerks.benefitHolderObj[name].weightUser = Math.max(0, autoTrimpSettings.APValueBoxes[name]);
    
    saveSettings(); //save to local storage
};

//a check box has changed
AutoPerks.UpdateCustomCheckBox = function(name, value){
    autoTrimpSettings.APCheckBoxes = AutoPerks.makeDefaultCheckBoxes(); //make sure datastructure intact
    
    //update new value
    autoTrimpSettings.APCheckBoxes["user"+name] = value;

    saveSettings(); //save to local storage
};

//update UI from datastructures
AutoPerks.updateBoxesUI = function() {
    var $perkRatioBoxes = document.getElementsByClassName("perkRatios");
    
    for(var i = 0; i < 11; i++) //set ratio boxes values from currently selected preset
        $perkRatioBoxes[i].value = autoTrimpSettings.APValueBoxes[$perkRatioBoxes[i].name];
    
    for(var i = 11; i < 16; i++) //set ratio boxes values from currently selected preset
        $perkRatioBoxes[i].checked = autoTrimpSettings.APCheckBoxes["user"+$perkRatioBoxes[i].name];
};

AutoPerks.resetPerks = function(){
    for (var i in AutoPerks.perkHolder){
        AutoPerks.perkHolder[i].level = 0;
        AutoPerks.perkHolder[i].spent = 0;
        AutoPerks.perkHolder[i].efficiency = 1;
    }
};

AutoPerks.resetBenefits = function(){
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++){
        AutoPerks.benefitHolder[i].benefit     = 1;
        AutoPerks.benefitHolder[i].benefitBak  = 1;
    }
};

//Calculate price of buying *next* level
AutoPerks.calculatePrice = function(perk, level) { 
    if(perk.priceLinearScaling === 'linear') return perk.baseCost + perk.increase * level;
    
    //exponential type calculation is an approximation, however it is what the game uses for price, and therefore the calculation we use
    else if(perk.priceLinearScaling === 'exponential') return Math.ceil(level/2 + perk.baseCost * Math.pow(1.3, level));
};

//Calculate Total Price
AutoPerks.calculateTotalPrice = function(perk, finalLevel) {
    if(perk.priceLinearScaling === 'linear') return AutoPerks.calculateTIIprice(perk, finalLevel);
    
    var totalPrice = 0;
    for(var i = 0; i < finalLevel; i++)
        totalPrice += AutoPerks.calculatePrice(perk, i);
    
    return totalPrice;
};

//Calculate Tier 2 Total Price - based on Trimps getAdditivePrice()
AutoPerks.calculateTIIprice = function(perk, finalLevel) {
    return (finalLevel - 1) * finalLevel / 2 * perk.increase + perk.baseCost * finalLevel;
};

//Fluffy is special
AutoPerks.calculateFluffyTotalPrice = function(perk, level){
    var price = 0;
    for (var i = 0; i < level; i++)
        price += perk.baseCost * Math.pow(10, i);
    return price;
};

//calcs helium like the game does
AutoPerks.getHelium = function() {
    //portal screen and the perk screen have differing helium amount to spend
    var respecMax = game.global.heliumLeftover + (game.global.viewingUpgrades ? 0 : game.resources.helium.owned);
    for (var item in game.portal){
        if (game.portal[item].locked) continue;
        var portUpgrade = game.portal[item];
        if (typeof portUpgrade.level === 'undefined') continue;
        respecMax += portUpgrade.heliumSpent;
    }
    return respecMax;
};

AutoPerks.heliumInaccuracy = function(checkTemp){
    var ret = countHeliumSpent(checkTemp) + game.global.heliumLeftover + game.resources.helium.owned - game.global.totalHeliumEarned;
    debug("countHeliumSpent("+checkTemp+") " + prettify(countHeliumSpent(checkTemp)) + " game.global.heliumLeftover " + prettify(game.global.heliumLeftover) + " game.resources.helium.owned " + prettify(game.resources.helium.owned) + " game.global.totalHeliumEarned " + prettify(game.global.totalHeliumEarned) + " = " + prettify(ret));
    return ret;
};

//green "Allocate Perks" button:
AutoPerks.clickAllocate = function() {
    try{
        if(!game.global.canRespecPerks){
            var $text = document.getElementById("textAreaAllocate");
            var msg = "A respec is needed to Auto Allocate. Portal or use a Bone Portal to get a respec.";
            debug(msg);
            $text.innerHTML = msg;
            return;
        }
        if(typeof attacksPerSecondAT === 'undefined') attacksPerSecondAT = calcAttacksPerSecond();
        AutoPerks.useLivePerks = false; //use perk setup as calculated by AutoPerks. used by GU currently.
        AutoPerks.totalHelium = AutoPerks.getHelium(); //differs whether we're in the portal screen or mid run respec
        AutoPerks.gearLevels  = 1;
        AutoPerks.breedMult   = 1;
        AutoPerks.gearLevels  = 0;
        AutoPerks.magmamancers = 31500;
        AutoPerks.compoundingImp = Math.pow(1.003, autoTrimpSettings.APValueBoxes.maxZone * 3 - 1);
        AutoPerks.windMod = 1 + (autoTrimpSettings.APValueBoxes.maxZone >= 241 ? 13 * game.empowerments.Wind.getModifier() * 10 : 0); //13 minimum stacks

        /* benefitStat captures how much of a stat we have, and what the change will be from increasing a perk.
         * increasing a weight by a factor of 2 means we are willing to spend twice as much helium for the same increase.
         * finally, perk.efficiency equals perk.calculateBenefit() / perk.cost
         */
        
        autoTrimpSettings.APValueBoxes = AutoPerks.makeDefaultValueBoxes(); //create fresh
        autoTrimpSettings.APCheckBoxes = AutoPerks.makeDefaultCheckBoxes(); //create fresh
        AutoPerks.initializePerks(); //do this every click, this way we update locked perks etc.
        
        AutoPerks.updateDailyMods(); // current (or selected) challenge modifiers
        AutoPerks.useMaxFuel = autoTrimpSettings.APCheckBoxes.userMaxFuel || AutoPerks.dailyObj != "";//use max fuel in dailies and c2
        
        AutoPerks.resetPerks();      // set all perks to level 0
        AutoPerks.resetBenefits();   // benefit and benefitBak = 1;
        AutoPerks.initializeAmalg(); // calculates amalgamator related variables. also pumps carp1/2/coord. doing this every allocate instead of 
                                     // on firstRun() because DG stats and helium mightve changed
        //calculates attack / health of non tough cell 50 corrupted enemy at autoTrimpSettings.APValueBoxes.maxZone
        AutoPerks.zoneHealth = approxZoneHP(autoTrimpSettings.APValueBoxes.maxZone); //this is health approx of the entire zone
        
        var helium = AutoPerks.totalHelium;

        // Get fixed perks
        var preSpentHe = 0;
        var perks = AutoPerks.perkHolder;
        for (var i in perks) {
            if(perks[i].isLocked || !perks[i].isFixed)
                continue;
            //Maintain your existing fixed perks levels.
            perks[i].level = game.portal[perks[i].name].level;
            perks[i].spent = perks[i].getTotalPrice(perks[i].level);
            preSpentHe += perks[i].spent;
        }

        if (preSpentHe)
            debug("AutoPerks: Your existing fixed-perks reserve Helium: " + prettify(preSpentHe), "perks");

        preSpentHe = 0;
        for (var i in AutoPerks.perkHolder)
            preSpentHe += AutoPerks.perkHolder[i].spent;
        
        var remainingHelium = helium - preSpentHe;
        if (Number.isNaN(remainingHelium))
            throw "error reading your Helium amount. " + remainingHelium;

        // determine how to spend helium
        var result = AutoPerks.spendHelium(remainingHelium);
        if (result == false)
            throw "error: Make sure all ratios are set properly.";

        var missing = -AutoPerks.applyCalculations(true);
        if(missing >= 0){ //theres some issues with large helium number inaccuracies. if missing is 0, remove 1 level just in case
            if(missing > 0) debug("missing " + prettify(missing) + " helium. attempting to correct");
            //try removing 1 from T2 perk
            var lowest = Number.MAX_VALUE;
            var perk;
            var perksAdditive = AutoPerks.additivePerks;
            for (i = 0; i < perksAdditive.length; i++){
                if(perksAdditive[i].level > 0){
                    var lastCost = perksAdditive[i].baseCost + perksAdditive[i].increase * (perksAdditive[i].level-1);
                    if (lastCost > missing && lastCost < lowest){
                        lowest = lastCost;
                        perk = perksAdditive[i];
                    }
                }
            }
            if(lowest < Number.MAX_VALUE && lowest > missing){
                if(missing > 0) debug("removing 1 level from " + perk.name + " worth " + lowest + " helium");
                remainingHelium += lowest;
                perk.spent -= lowest;
                perk.level--;
            }
        }
        
        var ret = AutoPerks.applyCalculations(true);
        if(ret < 0)
            throw "setup not affordable, missing " + prettify(-ret) + " helium.";
        AutoPerks.applyCalculations(); //re-arrange perk points
        debug("AutoPerks: Auto-Allocate Finished.","perks");
    }
    catch(err){
        debug("AutoPerks Critical Error: " + err);
        var $text = document.getElementById("textAreaAllocate");
        $text.innerHTML += 'Error: ' + err + '<br>' + '<a href="https://discord.gg/W2Ajv4j" target="_blank">Report it on the Trimps Discord</a>';
    }
    finally{
        //numTab(1, true); //refresh all helium displays. without this at the very least Helium Left Over would show wrong until user manually adds/removes a level to something
    }
};

AutoPerks.spendHelium = function(helium) {
    debug("Calculating how to spend " + prettify(helium) + " Helium...","perks");
    if(helium < 0) 
        throw "Not enough helium to buy fixed perks.";
    
    if (Number.isNaN(helium)) 
        throw "Helium is Not a Number!";

    AutoPerks.workPerks = AutoPerks.perkHolder.slice(); //create a copy of perkHolder which holds all perks we are currently leveling
    
    // Calculate base efficiency of all perks
    for(var i = 0; i < AutoPerks.workPerks.length; i++){
        if(AutoPerks.workPerks[i].isLocked || AutoPerks.workPerks[i].isFixed || AutoPerks.workPerks[i].isT2){ //skip unowned, fixed, and T2 perks.
            AutoPerks.workPerks.splice(i, 1); //remove from array
            i--;
        }
    }
    if (AutoPerks.workPerks.length === 0)
        throw "All Perk Ratios were 0, or some other error.";
    
    calcZeroState(); //calculates efficiency of benefits, and sums benefitBak for every perk
    for(var i = 0; i < AutoPerks.workPerks.length; i++){ //next we calculate the efficiency of leveling each perk
        var inc = AutoPerks.workPerks[i].getBenefit();
        var price = AutoPerks.workPerks[i].getPrice();
        AutoPerks.workPerks[i].efficiency = inc/price;
        if(AutoPerks.workPerks[i].efficiency < 0 || isNaN(AutoPerks.workPerks[i].efficiency))
            throw "Setup: " + AutoPerks.workPerks[i].name + " " + AutoPerks.workPerks[i].level + " efficiency is " + prettify(AutoPerks.workPerks[i].efficiency);
    }

    var mostEff, price, inc;
    var packPrice,packLevel;
    var loopCounter=0;
    
    //iterate and find highest efficiency perk
    var effQueue;
    function iterateArr(roundTwo){
        calcZeroState();
        effQueue = new PriorityQueue(function(a,b) { return a.efficiency > b.efficiency; } ); // Queue that keeps most efficient purchase at the top
        
        for(var i = 0; i < AutoPerks.workPerks.length; i++){
            price = AutoPerks.workPerks[i].getPrice();
            if (helium <= price || AutoPerks.workPerks[i].level >= AutoPerks.workPerks[i].max){ //can no longer afford a level of this perk, so remove it from AutoPerks.workPerks
                if (AutoPerks.workPerks[i].level > AutoPerks.workPerks[i].max) throw AutoPerks.workPerks[i].name + " over max level.";
                AutoPerks.workPerks.splice(i, 1); //remove from array
                if(AutoPerks.workPerks.length === 0) return false; //all done
                i--;
                continue;
            }
            AutoPerks.workPerks[i].efficiency = AutoPerks.workPerks[i].getBenefit()/price;
            if(AutoPerks.workPerks[i].efficiency < 0)
                throw AutoPerks.workPerks[i].name + " " + AutoPerks.workPerks[i].level + " efficiency is negative " + prettify(AutoPerks.workPerks[i].efficiency);
            
            if(roundTwo && AutoPerks.workPerks[i].efficiency === 0) continue; //in round 1 we keep 0 efficiency in array because other perks might increase this efficiency above 0. round 2 is finishing touchups so it won't happen anymore.
            
            effQueue.add(AutoPerks.workPerks[i]);
        }
        if(AutoPerks.workPerks.length === 0) return false; //all done
        return effQueue.poll();
    }
    
    while(mostEff = iterateArr()){
        loopCounter++;
        price = mostEff.getPrice();
        helium -= price;
        mostEff.buyLevel();
        mostEff.spent += price;            

        //when we level a T1 perk that has a T2 version, level the T2 alongside the T1 perk.
        //childLevelFunc() tells us how many levels we want in T2.
        //if we cant afford enough levels, proceed to next phase of the algorithm.
        if(mostEff.child && !mostEff.child.isLocked){
            var child = mostEff.child;
            var childLevelTarget = mostEff.childLevelFunc();
            if(isNaN(childLevelTarget)) throw "childLevelTarget NaN mostEff " + mostEff.name + " level " + mostEff.level;
            var childNewLevel = Math.max(0, childLevelTarget);
            if(childNewLevel > child.level){
                packLevel = childNewLevel - child.level;
                packPrice = child.getTotalPrice(childNewLevel) - child.spent;
                if (packPrice <= helium) {
                    helium -= packPrice;
                    child.level += packLevel;
                    child.spent += packPrice;
                }
                else
                    break; //as soon as we cant afford T2 to match T1, break and continue with a more fine tuned calculation
            }
        }
    }
    debug("AutoPerks2: Pass One Complete. Loops ran: " + loopCounter, "perks");
    
    //printBenefitsPerks(true);
    var calcHe = AutoPerks.applyCalculations(true);
    if(calcHe < 0) throw "loop1 error: negative helium remaining " + prettify(calcHe) + " expected: " + prettify(helium);
    if(calcHe !== helium) //this can (and will) happen due to large number rounding errors. thought about using bigInt, but since the game doesnt there's no point.
        helium = calcHe;
    
    //add T2 perks into queue
    for (var i = 0; i < AutoPerks.additivePerks.length; i++){
        if(!AutoPerks.additivePerks[i].isLocked)
            AutoPerks.workPerks.push(AutoPerks.additivePerks[i]);
    }

    debug("Spending remainder " + prettify(helium), "perks");
    loopCounter = 0;
    var loopT2 = 0;
    //Repeat the process for spending round 2.
    var pct = 0.01; //when a T2 perk is most efficient, buy as many as we can afford with helium * pct of our total helium (min 1 level)
    while (mostEff = iterateArr(true)){
        if(mostEff.isT2){
            var extraLevels = Math.max(1,mostEff.getBulkAmountT2(helium * pct)); //returns how many additional levels of this perk we can afford with helium.;
            var newCost = mostEff.getTotalPrice(mostEff.level + extraLevels);
            var oldCost = mostEff.spent;
            var packPrice = newCost-oldCost;
            if(packPrice > helium)
                throw "cant afford " + extraLevels + " " + mostEff.name;

            helium-= packPrice;
            mostEff.buyLevel(extraLevels);
            mostEff.spent += packPrice;
            loopT2++;
        }
        else{ //T1
            price = mostEff.getPrice();
            helium -= price;
            mostEff.buyLevel();
            mostEff.spent += price;
        }
        loopCounter++;
    }
    
    debug("AutoPerks2: Pass Two Complete. Loops ran " + loopT2 + "/" + loopCounter + " T2/Total. Leftover Helium: " + prettify(helium),"perks");
    
    minMaxMi(); //recalculate mi efficiency
    
    var fluffyGrowth = (game.global.fluffyExp === 0 ? 0 : 100*AutoPerks.benefitHolderObj.Fluffy.benefit / game.global.fluffyExp);
    var heliumMod = AutoPerks.benefitHolderObj.Helium.benefit.toExponential(2);
    var timeText = timeEstimator(false, 0, autoTrimpSettings.APValueBoxes.maxZone, AutoPerks.dailyObj, true);
    
    var healthMod = calcCurrSendHealth(false, false, false, autoTrimpSettings.APValueBoxes.maxZone, AutoPerks.dailyObj, AutoPerks.fullSoldiers, AutoPerks.battleGUMult, AutoPerks.currAmalgamators, AutoPerks.equipmentHealth, AutoPerks.breedMult);
    var corrupt = autoTrimpSettings.APValueBoxes.maxZone >= mutations.Corruption.start(true) ? "Corruption" : null;
    AutoPerks.enemyDamage = calcEnemyAttack(corrupt, null, 'Snimp', 98, autoTrimpSettings.APValueBoxes.maxZone, false, AutoPerks.dailyObj);
    var healthToDamageRatio = (healthMod / AutoPerks.enemyDamage);
    if(AutoPerks.useMaxFuel) AutoPerks.fuelEndZone = autoTrimpSettings.APValueBoxes.maxZone;
    
    var VMs             = expectedVMsAmount(); //how many VMs we expect to have
    var VMsEffMult      = VMsEfficiencyMult(VMs);
    var singleVM        = singleVMWorth(autoTrimpSettings.APValueBoxes.maxZone, false, AutoPerks.battleGUMult == 1);
    var heliumFromVMs   = VMs*VMsEffMult*singleVM;
    var totalHelium     = AutoPerks.totalHelium;
    var heliumGrowth    = (heliumFromVMs*1.4*AutoPerks.DailyWeight/totalHelium*100).toFixed(3) + '%'; //1.4 to account for non VM helium. TODO
    var missingCoords   = (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 99 : -1) + autoTrimpSettings.APValueBoxes.maxZone - AutoPerks.calcCoordsCoordsPurchased;
    
    var spireText = autoTrimpSettings.APValueBoxes.maxZone >= 200 && autoTrimpSettings.APValueBoxes.maxZone % 100 === 0 ? "Spire " : "Zone ";
    var msg2 = spireText + autoTrimpSettings.APValueBoxes.maxZone + " will take approx " + timeText + ". Army Health / Enemy Damage: " + prettify(healthToDamageRatio)+ (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? " Start Fuel: " + AutoPerks.fuelStartZone + " End Fuel: " + AutoPerks.fuelEndZone : "") + " Carp1/2/Coord: " + AutoPerks.getPct().toFixed(2)+"%" + (missingCoords === 0 ? "" : " Missing Coords: " + missingCoords);
    var msg3 = (AutoPerks.dailyObj === AutoPerks.Squared ? "" : "Helium Growth: " + heliumGrowth + " ") + (fluffyGrowth.toFixed(3) > 0 ? "Fluffy Growth: " + fluffyGrowth.toFixed(3) + "%" : "") + (AutoPerks.DGGrowthRun > 0 ? " DG Growth: " + (AutoPerks.DGGrowthRun*100).toFixed(3) + "% ("+AutoPerks.totalMi + " Mi)" : "");
    var $text = document.getElementById("textAreaAllocate");
    $text.innerHTML += msg2 + '<br>' + msg3;
};

AutoPerks.applyCalculations = function(testValidOnly){
    game.global.lockTooltip = true;

    if(!game.global.canRespecPerks && !portalWindowOpen){
        debug("AutoPerks - A Respec is required but no respec available. Try again on next portal.");
        return;
    }
    if(!game.global.viewingUpgrades && !portalWindowOpen) //we need some sort of screen open to do this.. right?
        viewPortalUpgrades(); //open 'view perks'
    
    if(!testValidOnly){ //only actually clear perks in the final go
        //Pushes the respec button, then the Clear All button
        if (game.global.canRespecPerks && !portalWindowOpen)
            respecPerksAT(); //without drawing
        if(!game.global.respecActive){
            game.global.lockTooltip = false;
            return;
        }
        clearPerks();
    }
    
    var ret = useQuickImportAT(testValidOnly); //uses adapted code from export/import
    
    game.global.lockTooltip = false;
    return ret;
};

function useQuickImportAT(testValidOnly){
    var levels = {};
    for (var item in AutoPerks.perkHolder){
        //For smaller strings and backwards compatibility, perks not added to the object will be treated as if the perk is supposed to be level 0.
        if (AutoPerks.perkHolder[item].isLocked || AutoPerks.perkHolder[item].level <= 0) continue;
        //Add the perk to the object with the desired level
        levels[AutoPerks.perkHolder[item].name] = AutoPerks.perkHolder[item].level;
    }

    if (!levels){
            debug("This doesn't look like a valid perk string.");
            return;
    }
    if (levels.global){
            debug("This looks like a save string, rather than a perk string. To import a save string, use the Import button on the main screen.");
            return;
    }
    // Check that everything is in order. Don't touch anything yet.
    var respecNeeded = false;
    var heNeeded = 0;
    var changeAmt = {};
    var price = {};

    for (var perk in game.portal) {
        if (!levels[perk]){
            if (game.portal[perk].locked) continue;
            if (game.portal[perk].level + game.portal[perk].levelTemp == 0) continue;
            levels[perk] = 0;
        }
        // parseInt parses "1e6" as 1, so we use parseFloat then floor as a replacement
        var level = Math.floor(parseFloat(levels[perk]));

        if (game.portal[perk].locked || level > game.portal[perk].max || isNumberBad(level)){
            debug("Cannot set " + perk + " to level " + level + ".");
            return;
        }

        if (level < game.portal[perk].level)
            respecNeeded = true;

        changeAmt[perk] = level - game.portal[perk].level - game.portal[perk].levelTemp;
        price[perk] = changeAmt[perk] > 0 ? getPortalUpgradePrice(perk, false, changeAmt[perk]) :
                      changeAmt[perk] < 0 ? -getPortalUpgradePrice(perk, true, -changeAmt[perk]) : 0;
        heNeeded += price[perk];
    }
    if (heNeeded > game.resources.helium.respecMax - game.resources.helium.totalSpentTemp){
        if(!testValidOnly) debug("You don't have enough Helium to afford this perk setup. " + prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded));
        if(!testValidOnly) debug(levels);
        return game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded;
    }
    if(testValidOnly) return game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded;

    if (respecNeeded && !game.global.canRespecPerks){
        debug("This perk setup would require a respec, but you don't have one available.");
        return;
    }

    // Okay, now we can actually set the perks.
    cancelTooltip();
    if (respecNeeded && !game.global.respecActive)
        respecPerks();

    for (perk in changeAmt) {
        game.portal[perk].levelTemp += changeAmt[perk];
        game.resources.helium.totalSpentTemp += price[perk];
        game.portal[perk].heliumSpentTemp += price[perk];
        updatePerkLevel(perk);
    }

    document.getElementById("portalHeliumOwned").innerHTML = prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp);
    enablePerkConfirmBtn();
    updateAllPerkColors();
    document.getElementById("totalHeliumSpent").innerHTML = prettify(countHeliumSpent(true));
}

//copied from main.js with displayPortalUpgrades and numTab commented for speed
function respecPerksAT(){
    if (!game.global.canRespecPerks) return;
    //if (!game.global.viewingUpgrades) return;
    game.global.respecActive = true;
    //displayPortalUpgrades(true);
    //numTab(1, true);
    game.resources.helium.respecMax = (game.global.viewingUpgrades) ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
    document.getElementById("portalHeliumOwned").innerHTML = prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp);
    document.getElementById("respecPortalBtn").style.display = "none";
    document.getElementById("portalStory").innerHTML = "You can only respec once per run. Clicking cancel will not consume this use.";
    document.getElementById("portalTitle").innerHTML = "Respec Perks";
    document.getElementById("ptabRemove").style.display = "table-cell";
    document.getElementById("clearPerksBtn").style.display = "inline-block";
    if (selectedPreset)
        swapClass('tab', 'tabNotSelected', document.getElementById('presetTabLoad'));
}

//internal test function
function testPerks(){
    for (var i in AutoPerks.perkHolder){
        var diff = AutoPerks.perkHolder[i].getTotalPrice() - AutoPerks.perkHolder[i].spent;
        if(diff !== 0)
            debug("Discrepency perk " + AutoPerks.perkHolder[i].name + " diff " + diff);
    }
}

//used for all non T2 perks. returns price of next level at usedLevel
function compoundingPriceFunc(atLevel){
    var usedLevel = (typeof atLevel === 'undefined' ? this.level : atLevel);
    return Math.ceil(usedLevel/2 + this.baseCost * Math.pow(1.3, usedLevel));
}


function compoundingTotalPriceFunc(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    var totalPrice = 0;
    for(var i = 0; i < usedLevel; i++)
        totalPrice += this.getPrice(i);
    return totalPrice;
}

//used for all T2 perks. returns price of next level at usedLevel
function linearPriceFunc(atLevel){
    var usedLevel = (typeof atLevel === 'undefined' ? this.level : atLevel);
    return this.baseCost + this.increase * usedLevel;
}

function linearTotalPriceFunc(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    return (usedLevel - 1) * usedLevel / 2 * this.increase + this.baseCost * usedLevel;
}

//returns how many additional levels of this perk we can afford using hel helium.
function getBulkT2(hel){
    var helium = hel+this.spent;
    return Math.floor((Math.sqrt(Math.pow(this.increase-2*this.baseCost,2)+ 8*this.increase*helium) + this.increase - 2*this.baseCost)/(2*this.increase)) - this.level;
}

//capable perk only
function calculateFluffyTotalPrice(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    var price = 0;
    for (var i = 1; i <= usedLevel; i++)
        price += this.baseCost * Math.pow(10, i-1);
    return price;
}

function buyLevel(howMany){
    var amt = (typeof howMany === 'undefined' ? 1: howMany);
    this.level+= amt;
}

function calcBenefits(){ //calculate the benefits of raising a perk by 1 
    this.level++;
    var sum = 0;
    this.benefits.forEach((benefit) => {
        if(benefit.benefitBak !== 0){
            var delta = (benefit.calc(false, this.incomeFlag, this.popBreedFlag)/benefit.benefitBak - 1) * benefit.weightUser;
            if(delta < 0) 
                throw "calcBenefits " + this.name + " negative delta " + prettify(delta);

            sum += delta;
        }
    });
    this.level--;
    return sum;
}

function getBenefitValue(){
    return this.benefit;
}

function calcZeroState(){
    minMaxMi();
    
    if(autoTrimpSettings.APCheckBoxes.userMaintainMode) AutoPerks.basePopAtMaxZ = calcBasePopMaintain();
    else AutoPerks.basePopAtMaxZ = AutoPerks.basePopAtAmalZ * (AutoPerks.currAmalgamators > 0 ? Math.pow(1.009, autoTrimpSettings.APValueBoxes.maxZone-autoTrimpSettings.APValueBoxes.amalZone) : 1);
    
    AutoPerks.basePopToUse  = AutoPerks.useMaxFuel ? AutoPerks.maxFuelBasePopAtMaxZ : AutoPerks.basePopAtMaxZ;
    
    calcIncome(3);
    calcPopBreed(3);
    
    for (var i = 0; i < AutoPerks.benefitHolder.length; i++)
        AutoPerks.benefitHolder[i].benefitBak = AutoPerks.benefitHolder[i].calc(false, false, false); //with all perks' levels frozen, calculate the benefits, and store each in that benefit's benefitBak.
}

function benefitIncomeCalc(){
    if(autoTrimpSettings.APValueBoxes.Income === 0) return 1;
    var looting1 = AutoPerks.useLivePerks ? game.portal["Looting"] : AutoPerks.perksByName.Looting;
    var looting2 = AutoPerks.useLivePerks ? game.portal["Looting_II"] : AutoPerks.perksByName.Looting_II;
    var motivation1Perk = AutoPerks.useLivePerks ? game.portal["Motivation"] : AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.useLivePerks ? game.portal["Motivation_II"] : AutoPerks.perksByName.Motivation_II;
    var resourcefulPerk = AutoPerks.useLivePerks ? game.portal["Resourceful"] : AutoPerks.perksByName.Resourceful;
            
    this.benefit =  popMultiplier() * 
                    (1 + 0.05*motivation1Perk.level) * (1 + 0.01*motivation2Perk.level) * 
                    (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level) * AutoPerks.DailyResourceMult / Math.pow(0.95, resourcefulPerk.level);
    
    if(isNaN(this.benefit)) throw "Income NaN benefit";
    
    return this.getValue();
}

function benefitHeliumCalc(){
    var looting1 = AutoPerks.useLivePerks ? game.portal["Looting"] : AutoPerks.perksByName.Looting;
    var looting2 = AutoPerks.useLivePerks ? game.portal["Looting_II"] : AutoPerks.perksByName.Looting_II;

    this.benefit = (AutoPerks.dailyObj === AutoPerks.Squared) ? 1 : (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level) * AutoPerks.DailyWeight;
    
    if(isNaN(this.benefit)) throw "Helium NaN benefit";
    
    return this.getValue();
}

function benefitAttackCalc(commit, incomeFlag){
    var power1Perk = AutoPerks.useLivePerks ? game.portal["Power"] : AutoPerks.perksByName.Power;
    var power2Perk = AutoPerks.useLivePerks ? game.portal["Power_II"] : AutoPerks.perksByName.Power_II;
    var amalToUse  = AutoPerks.useLivePerks ? autoTrimpSettings.APValueBoxes.amalGoal : AutoPerks.currAmalgamators;
    var coordPerk  = AutoPerks.useLivePerks ? game.portal["Coordinated"] : AutoPerks.perksByName.Coordinated;
    calcCoords(coordPerk.level) * Math.pow(1000, amalToUse); //updates AutoPerks.fullSoldiers

    var income;
    if(incomeFlag || AutoPerks.useLivePerks){
        if(commit){ //we leveled a perk, so update AutoPerks.equipmentAttack and AutoPerks.equipmentHealth
            calcIncome(3); //saves values
            income = AutoPerks.equipmentAttack;
        }
        else
            income = calcIncome(1); //run calculation but do not store values.
    }
    else{
        income = AutoPerks.equipmentAttack;
        //if(income !== calcIncome(1))
        //    throw "error";
    }
    
    var amalBonus = game.talents.amalg.purchased ? Math.pow(1.5, amalToUse) : (1 + 0.5*amalToUse);
    this.benefit = (1 + 0.05*power1Perk.level) * (1 + 0.01*power2Perk.level) * income * amalBonus * AutoPerks.fullSoldiers;
    
    if(isNaN(this.benefit)) throw "Attack NaN benefit";
    
    return this.getValue();
}

function benefitHealthCalc(commit, incomeFlag, popBreedFlag){
    var resilPerk      = AutoPerks.useLivePerks ? game.portal["Resilience"] : AutoPerks.perksByName.Resilience;
    var toughness1Perk = AutoPerks.useLivePerks ? game.portal["Toughness"] : AutoPerks.perksByName.Toughness;
    var toughness2Perk = AutoPerks.useLivePerks ? game.portal["Toughness_II"] : AutoPerks.perksByName.Toughness_II;
    var resourceful    = AutoPerks.useLivePerks ? game.portal["Resourceful"] : AutoPerks.perksByName.Resourceful; //resourceful isnt useless, but hard to capture its value. so use this for now. TODO.
    var amalToUse      = AutoPerks.useLivePerks ? autoTrimpSettings.APValueBoxes.amalGoal : AutoPerks.currAmalgamators;
    var coordPerk      = AutoPerks.useLivePerks ? game.portal["Coordinated"] : AutoPerks.perksByName.Coordinated;
    calcCoords(coordPerk.level) * Math.pow(1000, amalToUse); //updates AutoPerks.fullSoldiers
    
    var income;
    if(incomeFlag){
        if(commit){ //we leveled a perk, so update AutoPerks.equipmentAttack and AutoPerks.equipmentHealth
            calcIncome(3); //saves values
            income = AutoPerks.equipmentHealth;
        }
        else
            income = calcIncome(2); //run calculation but do not store values.
    }
    else{
        income = AutoPerks.equipmentHealth;
        //if(income !== calcIncome(2))
        //    throw "error";
    }
    
    var popBreed;
    if(popBreedFlag){
        if(commit)
            popBreed = calcPopBreed(3);
        else
            popBreed = calcPopBreed();
    }
    else{
        popBreed = AutoPerks.breedMult;
        //if(popBreed !== calcPopBreed())
        //    throw "error";
    }
    
    var ResourcefulFudgeFactor = resourceful.level; //resourceful isnt useless, but hard to capture its value. so use this for now. TODO.
    this.benefit = (1 + 0.05*toughness1Perk.level) * (1 + 0.01*toughness2Perk.level)*Math.pow(1.1, resilPerk.level) * income * popBreed * Math.pow(40, amalToUse) * (1 + 0.001*ResourcefulFudgeFactor) * AutoPerks.fullSoldiers;
    
    if(isNaN(this.benefit)) throw "Health NaN benefit";
    
    return this.getValue();
}

function benefitFluffyCalc(){
    var curiousPerk = AutoPerks.useLivePerks ? game.portal["Curious"] : AutoPerks.perksByName.Curious;
    var cunningPerk = AutoPerks.useLivePerks ? game.portal["Cunning"] : AutoPerks.perksByName.Cunning;
    var classyPerk  = AutoPerks.useLivePerks ? game.portal["Classy"] : AutoPerks.perksByName.Classy;
    
    var flufffocus = (game.talents.fluffyExp.purchased ? 1 + (0.25 * game.global.fluffyPrestige) : 1);
    var staffBonusXP = 1 + game.heirlooms.Staff.FluffyExp.currentBonus / 100;
    var cunningCuriousMult = (50 + curiousPerk.level * 30) * (1 + cunningPerk.level * 0.25);
    var startZone = 301 - 2*classyPerk.level;
    
    var sumBenefit = autoTrimpSettings.APValueBoxes.maxZone < startZone + 1 ? 0 : (1 - Math.pow(1.015, autoTrimpSettings.APValueBoxes.maxZone - startZone + 1)) / (-0.015); //sum of a geometric series
    for(var zone = 400; zone <= autoTrimpSettings.APValueBoxes.maxZone; zone += 100)
        sumBenefit += 2*Math.pow(1.015,zone - startZone); //spire 3+ c50 rewards 2x zone reward
    
    this.benefit = sumBenefit * cunningCuriousMult * flufffocus * staffBonusXP * AutoPerks.DailyWeight;

    if(isNaN(this.benefit)) throw "Fluffy NaN benefit";
    if(this.benefit < 0) throw "Fluffy negative benefit";
    
    return this.getValue();
}

function benefitDGCalc(){
    if(autoTrimpSettings.APCheckBoxes.userMaintainMode) return 1; //using max fuel for amalg maintain mode
    
    //when we change DG perks, we potentially change the amount of Mi we get and DG growth. if Mi changed we need to recalculate AutoPerks.benefitDG
    minMaxMi(); //calculates maximum Mi using carp1/carp2/coordinated to maintain amalgamator goal
    this.benefit = MiToDGGrowth(); //Mi changed, update benefit
    
    if(isNaN(this.benefit)) throw "DG NaN benefit";

    return this.getValue();
}

function calcIncome(toRet){ //returns: 1 - equipment attack, 2 - equipment health
    var artisanPerk     = AutoPerks.useLivePerks ? game.portal["Artisanistry"] : AutoPerks.perksByName.Artisanistry;
    var motivation1Perk = AutoPerks.useLivePerks ? game.portal["Motivation"] : AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.useLivePerks ? game.portal["Motivation_II"] : AutoPerks.perksByName.Motivation_II;

    var staffBonusMining= 1 + game.heirlooms.Staff.MinerSpeed.currentBonus / 100;
    var staffBonusDrop  = 1 + game.heirlooms.Staff.metalDrop.currentBonus / 100;
    
    AutoPerks.gatheredResources =   0.5 *                   //base
                        AutoPerks.basePopToUse *
                        popMultiplier() *
                        Math.pow(1.25, 60) *                //basic books
                        Math.pow(1.6, autoTrimpSettings.APValueBoxes.maxZone-60) * //advanced books
                        2 *                                 //bounty
                        AutoPerks.compoundingImp *          //same bonus as whipimp
                        (1 + 0.05*motivation1Perk.level) * 
                        (1 + 0.01*motivation2Perk.level) *
                        AutoPerks.windMod *
                        staffBonusMining *
                        2 *                                 //sharing food
                        AutoPerks.DailyResourceMult;          //daily         

    AutoPerks.cacheResources = calcCacheReward() * AutoPerks.DailyResourceMult; //LMC

    AutoPerks.baseZoneLoot = baseZoneDrop() * AutoPerks.DailyResourceMult;
    var tBonus = 1.166;
    if (game.talents.turkimp4.purchased) tBonus = 1.333;
    else if (game.talents.turkimp3.purchased) tBonus = 1.249;
    AutoPerks.lootedResources = calcLootedResources() * AutoPerks.DailyResourceMult;
    
    AutoPerks.totalResources = (AutoPerks.cacheResources + AutoPerks.gatheredResources + tBonus * staffBonusDrop * AutoPerks.lootedResources); //out of these 3, AutoPerks.cacheResources is the predominent one (from LMC maps)
    
    var baseCost = 1315 * Math.pow(0.95, artisanPerk.level); //total all gear level 1 basecost
    
    var cycleModifier = 0;
    var cycle = autoTrimpSettings.APValueBoxes.maxZone >= 236 ? cycleZone(autoTrimpSettings.APValueBoxes.maxZone) : -1;
    if(cycle <= 4 || (cycle >= 15 && cycle <= 24)) cycleModifier = 2;
    var normalRaidingPrestige = (autoTrimpSettings.APValueBoxes.maxZone >= 236 && AutoPerks.ChallengeName != "Trimp") ? //trimp challenge we raid from 236 to max
                                Math.floor((autoTrimpSettings.APValueBoxes.maxZone-1)/10) * 2 + 2 + cycleModifier : //roundup to next xx5 zone for prestige, anticipating praid cycles
                                Math.ceil(autoTrimpSettings.APValueBoxes.maxPrestigeZ/10) * 2; //do not use praid logic below zone 236
    var userInputPrestige     = Math.ceil(autoTrimpSettings.APValueBoxes.maxPrestigeZ/10) * 2; //user entered prestige zone
    if(autoTrimpSettings.APValueBoxes.maxPrestigeZ <= 0)
        AutoPerks.prestiges = normalRaidingPrestige
    else
        AutoPerks.prestiges = Math.max(normalRaidingPrestige, userInputPrestige);
    
    var prestigeMod = (AutoPerks.prestiges - 3) * 0.85 + 2;
    AutoPerks.gearCost = baseCost * Math.pow(1.069, prestigeMod * 53 + 1) * AutoPerks.DailyEquipmentMult * (AutoPerks.ChallengeName == "Obliterated" ? 1e12 : 1); //this is the cost of all gear at max prestige level 1
    
    var minimumLevels = 20;
    if(AutoPerks.totalResources >= AutoPerks.gearCost*minimumLevels)
        AutoPerks.gearLevels = Math.log(AutoPerks.totalResources/AutoPerks.gearCost) / Math.log(1.2);
    else{
        //since we cant afford enough levels, lets go down in prestiges until we can.
        var prestigesDropped = 0;
        var maxLoops = 500;
        while(AutoPerks.totalResources < AutoPerks.gearCost*minimumLevels && maxLoops-- > 0){
            prestigesDropped++;
            AutoPerks.prestiges--;
            prestigeMod = (AutoPerks.prestiges - 3) * 0.85 + 2;
            AutoPerks.gearCost = baseCost * Math.pow(1.069, prestigeMod * 53 + 1) * AutoPerks.DailyEquipmentMult * (AutoPerks.ChallengeName == "Obliterated" ? 1e12 : 1);
        }
        if(maxLoops === 0)
            throw "Error: calcIncome() maxLoops is 0.";

        AutoPerks.gearLevels = Math.log(AutoPerks.totalResources/AutoPerks.gearCost) / Math.log(1.2);
    }
    
    var atk    = Math.round(40 * Math.pow(1.19, ((AutoPerks.prestiges - 1) * 13) + 1)) * AutoPerks.gearLevels; //40 is prestige 0 level 0 total attack values
    var health = Math.round(152 * Math.pow(1.19, ((AutoPerks.prestiges - 1) * 14) + 1)) * AutoPerks.gearLevels; //152 is prestige 0 level 0 total health values
    if(isNaN(atk)) throw "calcIncome NaN attack";
    if(isNaN(health)) throw "calcIncome NaN health";
    if(toRet === 1) return atk;
    else if(toRet === 2) return health;
    else if(toRet === 3){ //save values
        AutoPerks.equipmentAttack = atk;
        AutoPerks.equipmentHealth = health;
    }
}

function calcLootedResources(){
    var looting1        = AutoPerks.useLivePerks ? game.portal["Looting"] : AutoPerks.perksByName.Looting;
    var looting2        = AutoPerks.useLivePerks ? game.portal["Looting_II"] : AutoPerks.perksByName.Looting_II;
    var spireBonus = 1 + 10 * Math.floor((autoTrimpSettings.APValueBoxes.maxZone - 100) / 100) * (game.talents.stillRowing.purchased ? 0.03 : 0.02);
    var looted                = AutoPerks.baseZoneLoot *
                                AutoPerks.basePopToUse *
                                popMultiplier() *
                                (1 + 0.05*looting1.level) * 
                                (1 + 0.0025*looting2.level) * 
                                AutoPerks.compoundingImp * 
                                spireBonus * 
                                AutoPerks.windMod;
    return looted;
}

function calcCacheReward(){
    var looting1        = AutoPerks.useLivePerks ? game.portal["Looting"] : AutoPerks.perksByName.Looting;
    var looting2        = AutoPerks.useLivePerks ? game.portal["Looting_II"] : AutoPerks.perksByName.Looting_II;
    
    var pop = (AutoPerks.ChallengeName == "Trapper" && !portalWindowOpen) ? game.jobs.Miner.owned : (AutoPerks.basePopToUse * popMultiplier() / 2); //in trapper, our current population is fixed (minus some losses to armies)
    var amt = pop * getJobModifierAT() * 20; //includes motivation!
    amt *= AutoPerks.windMod;
    amt = calcHeirloomBonus("Staff", "MinerSpeed", amt);

    if (game.talents.turkimp4.purchased)
        amt *= 2;
    
    amt += getPlayerModifierAT() * 20; //tiny effect
    
    if (Fluffy.isRewardActive("lucky"))
        amt *= 1.25;
    
    //if (game.portal.Meditation.level > 0) amt *= (1 + (game.portal.Meditation.getBonusPercent() * 0.01));
    //if (game.jobs.Magmamancer.owned > 0 && what == "metal") amt *= game.jobs.Magmamancer.getBonusPercent();
    
    //whats left of scaleToCurrentMap()
    amt *= 0.64; //low level map -2 levels penalty
    amt *= 1.85; //perfect map loot
    
    amt *= AutoPerks.compoundingImp; //magnimp
    amt *= (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level);
    
    return amt;
}

function getJobModifierAT(){
    var motivation1Perk = AutoPerks.useLivePerks ? game.portal["Motivation"] : AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.useLivePerks ? game.portal["Motivation_II"] : AutoPerks.perksByName.Motivation_II;
    
    var base = 0.5 *
    Math.pow(1.25, 60) *                //basic books
    Math.pow(1.6, autoTrimpSettings.APValueBoxes.maxZone-60) * //advanced books
    2 *                                     //bounty
    AutoPerks.compoundingImp *
    (1 + 0.05*motivation1Perk.level) *
    (1 + 0.01*motivation2Perk.level)*
    (1 + 14 * game.empowerments.Wind.getModifier() * 10); //wind around 14 stacks assuming 1shots
    return base;
}

function getPlayerModifierAT(){
    var base = 10;
    base = base * Math.pow(2, Math.floor(autoTrimpSettings.APValueBoxes.maxZone / 2));
    return base;
}

function baseZoneDrop(){
    var amt = 0;
    var tempModifier = 0.5 * Math.pow(1.25, (autoTrimpSettings.APValueBoxes.maxZone >= 59) ? 59 : autoTrimpSettings.APValueBoxes.maxZone);
    //Mega books
    if (autoTrimpSettings.APValueBoxes.maxZone >= 60) {
        if (game.global.frugalDone) tempModifier *= Math.pow(1.6, autoTrimpSettings.APValueBoxes.maxZone - 59);
        else tempModifier *= Math.pow(1.5, autoTrimpSettings.APValueBoxes.maxZone - 59);
    }
    //Bounty
    if (autoTrimpSettings.APValueBoxes.maxZone >= 15) tempModifier *= 2;
    
    tempModifier *= AutoPerks.compoundingImp;
    
    var avgSec = tempModifier;
    if (autoTrimpSettings.APValueBoxes.maxZone < 100)
        amt = avgSec * 3.5;
    else
        amt = avgSec * 5;
    return (amt * .8) + ((amt * .002) * (50 + 2));
}

function calcPopBreed(toRet){
    //we want the value of breeding translated into health.
    var coordPerk = AutoPerks.useLivePerks ? game.portal["Coordinated"] : AutoPerks.perksByName.Coordinated;
    var pheroPerk = AutoPerks.useLivePerks ? game.portal["Pheromones"] : AutoPerks.perksByName.Pheromones;
    var amalToUse = AutoPerks.useLivePerks ? autoTrimpSettings.APValueBoxes.amalGoal : AutoPerks.currAmalgamators;
    var armySize  = calcCoords(coordPerk.level) * Math.pow(1000, amalToUse);
    
    var finalPopSize  = AutoPerks.basePopToUse * popMultiplier();
    
    var lumberjackEff = getJobModifierAT();
    var lumberjacks = finalPopSize * 0.001;
    var gatheredResources = lumberjacks * lumberjackEff * AutoPerks.DailyResourceMult;
    AutoPerks.lootedResources = calcLootedResources() * AutoPerks.DailyResourceMult;
    var nurseries = calculateMaxNurseries(AutoPerks.lootedResources + gatheredResources) / (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 5 : 1); //use all nurseries below 230
    
    if(AutoPerks.ChallengeName == "Trapper"){
        AutoPerks.breedMult = 1;
        AutoPerks.maxNurseries = 1;
        return 1;
    }
    if(autoTrimpSettings.APValueBoxes.maxZone < 70){
        AutoPerks.breedMult = 1;
        AutoPerks.maxNurseries = nurseries;
        return 1;
    }
    
    var breed =   0.0085        //how many trimps are bred each second before geneticists.
                * finalPopSize/2
                * Math.pow(1.1, Math.floor(autoTrimpSettings.APValueBoxes.maxZone / 5)) //potency
                * AutoPerks.compoundingImp
                * 0.1           //broken planet
                * (1 + 0.1*pheroPerk.level)
                * Math.pow(1.01, nurseries)
                * AutoPerks.DailyBreedingMult; //toxic daily modifier
    
    var desiredAmalMult = (armySize / (AutoPerks.AntiStacks === 0 ? 1 : AutoPerks.AntiStacks)) / breed;
    var geneticists = Math.log(desiredAmalMult) / Math.log(0.98);
    var genHealthBonus = Math.pow(1.01, geneticists);
    breed = genHealthBonus;
    if(toRet === 3){ //also save
        AutoPerks.breedMult = breed;
        AutoPerks.maxNurseries = nurseries;
    }
    if(isNaN(breed)) throw "calcPopBreed NaN breed";
    return breed;
}

function calculateMaxNurseries(resourcesAvailable){ 
    var resourcefulPerk = AutoPerks.useLivePerks ? game.portal["Resourceful"] : AutoPerks.perksByName.Resourceful;
    var mostAfford = -1;

    var price = game.buildings.Nursery.cost.wood;
    var start = price[0];
    start *= Math.pow(0.95, resourcefulPerk.level);
    var toBuy = log10(resourcesAvailable / start * (price[1] - 1) + 1) / log10(price[1]);
    
    if (mostAfford === -1 || mostAfford > toBuy) mostAfford = toBuy;
    
    if (mostAfford > 1000000000) return 1000000000;
    if (mostAfford <= 0) return 1;
    return mostAfford;
}

AutoPerks.initializePerks = function () {
    var bHel   = {calc: benefitHeliumCalc, weightUser:autoTrimpSettings.APValueBoxes.Helium};
    var bAtk   = {calc: benefitAttackCalc, weightUser:autoTrimpSettings.APValueBoxes.Attack};
    var bHlth  = {calc: benefitHealthCalc, weightUser:autoTrimpSettings.APValueBoxes.Health};
    var bFluff = {calc: benefitFluffyCalc, weightUser:autoTrimpSettings.APValueBoxes.Fluffy};
    var bDG    = {calc: benefitDGCalc,     weightUser:autoTrimpSettings.APValueBoxes.DG};
    var bIncome= {calc: benefitIncomeCalc, weightUser:autoTrimpSettings.APValueBoxes.Income};
     
    
    AutoPerks.benefitHolderObj = {Helium:bHel, Attack:bAtk, Health:bHlth, Fluffy:bFluff, DG:bDG};
    AutoPerks.benefitHolder    = [bHel, bAtk, bHlth, bFluff, bDG, bIncome];
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++)
        AutoPerks.benefitHolder[i].getValue   = getBenefitValue;
    
    //Fixed perks: These perks do not get changed by autoperks.
    var siphonology     = {name: "Siphonology",     baseCost: 100000};
    var anticipation    = {name: "Anticipation",    baseCost: 1000};
    var meditation      = {name: "Meditation",      baseCost: 75};
    var relentlessness  = {name: "Relentlessness",  baseCost: 75};
    var range           = {name: "Range",           baseCost: 1};
    var agility         = {name: "Agility",         baseCost: 4};
    var bait            = {name: "Bait",            baseCost: 4};
    var trumps          = {name: "Trumps",          baseCost: 3};
    var packrat         = {name: "Packrat",         baseCost: 3};
    var overkill        = {name: "Overkill",        baseCost: 1e6};   
    var capable         = {name: "Capable",         baseCost: 1e8};
    
    //the rest of the perks
    var cunning      = {name: "Cunning",      benefits: [bFluff],            baseCost: 1e11};
    var curious      = {name: "Curious",      benefits: [bFluff],            baseCost: 1e14};
    var classy       = {name: "Classy",       benefits: [bFluff],            baseCost: 1e17};
    var pheromones   = {name: "Pheromones",   benefits: [bHlth],             baseCost: 3,       popBreedFlag:true};
    var artisanistry = {name: "Artisanistry", benefits: [bHlth, bAtk],       baseCost: 15,      incomeFlag: true};
    var resilience   = {name: "Resilience",   benefits: [bHlth],             baseCost: 100};
    var coordinated  = {name: "Coordinated",  benefits: [bHlth, bAtk, bDG],  baseCost: 150000,  popBreedFlag:true};
    var resourceful  = {name: "Resourceful",  benefits: [bHlth, bIncome],            baseCost: 50000,   incomeFlag: true, popBreedFlag:true};
    
    var carpentry    = {name: "Carpentry",    benefits: [bHlth, bAtk, bDG ,bIncome], baseCost: 25, childLevelFunc: carp2LevelFunc,      incomeFlag: true, popBreedFlag:true};
    var looting      = {name: "Looting",      benefits: [bHlth, bAtk, bHel,bIncome], baseCost: 1,  childLevelFunc: looting2LevelFunc,   incomeFlag: true, popBreedFlag:true};
    var toughness    = {name: "Toughness",    benefits: [bHlth],             baseCost: 1,  childLevelFunc: toughness2LevelFunc};
    var power        = {name: "Power",        benefits: [bAtk],              baseCost: 1,  childLevelFunc: power2LevelFunc};
    var motivation   = {name: "Motivation",   benefits: [bHlth, bAtk, bIncome],       baseCost: 2,  childLevelFunc: motivation2LevelFunc,incomeFlag: true, popBreedFlag:true};
    
    //Tier2 perks
    var carpentry_II = {name: "Carpentry_II", benefits: [bHlth, bAtk, bDG,  bIncome], baseCost: 100000, increase: 10000, incomeFlag: true, popBreedFlag:true};
    var looting_II   = {name: "Looting_II",   benefits: [bHlth, bAtk, bHel, bIncome], baseCost: 100000, increase: 10000, incomeFlag: true, popBreedFlag:true};
    var toughness_II = {name: "Toughness_II", benefits: [bHlth],             baseCost: 20000,  increase: 500};
    var power_II     = {name: "Power_II",     benefits: [bAtk],              baseCost: 20000,  increase: 500};
    var motivation_II= {name: "Motivation_II",benefits: [bHlth, bAtk, bIncome],       baseCost: 50000,  increase: 1000,  incomeFlag: true, popBreedFlag:true};
           
    //gather these into an array of objects
    AutoPerks.fixedPerks = [siphonology, anticipation, meditation, relentlessness, range, agility, bait, trumps, packrat, overkill, capable];
    AutoPerks.perkHolder = [siphonology, anticipation, meditation, relentlessness, range, agility, bait, trumps, packrat, overkill, capable, looting, toughness, power, motivation, pheromones, artisanistry, carpentry, resilience, coordinated, resourceful, cunning, curious, classy, toughness_II, power_II, motivation_II, carpentry_II, looting_II];
    AutoPerks.additivePerks = [looting_II, toughness_II, power_II, motivation_II, carpentry_II];
    AutoPerks.perksByName = {};
    
    //initialize basics on all.
    for(var i in AutoPerks.perkHolder){
        AutoPerks.perkHolder[i].getPrice      = compoundingPriceFunc;
        AutoPerks.perkHolder[i].getTotalPrice = compoundingTotalPriceFunc;
        AutoPerks.perkHolder[i].getBenefit    = calcBenefits;
        AutoPerks.perkHolder[i].buyLevel      = buyLevel;
        AutoPerks.perkHolder[i].isLocked      = game.portal[AutoPerks.perkHolder[i].name].locked;
        AutoPerks.perkHolder[i].max           = typeof game.portal[AutoPerks.perkHolder[i].name].max === 'undefined' ? Number.MAX_VALUE : game.portal[AutoPerks.perkHolder[i].name].max;
        AutoPerks.perksByName[AutoPerks.perkHolder[i].name] = AutoPerks.perkHolder[i];
    }
    
    for (var i in AutoPerks.fixedPerks)
        AutoPerks.fixedPerks[i].isFixed = true;
    
    for(var i in AutoPerks.additivePerks){
        AutoPerks.additivePerks[i].getBulkAmountT2 = getBulkT2;
        AutoPerks.additivePerks[i].getPrice        = linearPriceFunc;
        AutoPerks.additivePerks[i].getTotalPrice   = linearTotalPriceFunc;
        AutoPerks.additivePerks[i].isT2            = true;
    }
    
    if(!carpentry_II.isLocked)  carpentry.child  = carpentry_II;
    if(!looting_II.isLocked)    looting.child    = looting_II;
    if(!toughness_II.isLocked)  toughness.child  = toughness_II;
    if(!power_II.isLocked)      power.child      = power_II;
    if(!motivation_II.isLocked) motivation.child = motivation_II;
    
    capable.getTotalPrice = calculateFluffyTotalPrice; //capable has a unique getTotalPrice function
    
    AutoPerks.resetBenefits();
    AutoPerks.resetPerks();
};

carp2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/100*(Math.sqrt(5)*Math.sqrt(x + Math.pow(2,1-x)*Math.pow(5,2-x)*Math.pow(13,x)+76050000)-20500));
};

looting2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/25*(Math.pow(2,-x-5/2)*Math.sqrt(Math.pow(2,2*x) * Math.pow(x,2) + Math.pow(2,x + 1) * Math.pow(13/5,x)*x + 5*Math.pow(2,2*x + 2)*x + Math.pow(2,x + 3) * Math.pow(5,1 - x) * Math.pow(13,x) + 23765625 * Math.pow(2,2*x + 5)) - 5125));
};

toughness2LevelFunc = function(){
    var x = this.level;
    return Math.floor(0.0005*Math.pow(2,-x)*(Math.sqrt(125*Math.pow(2,2*x + 5)*Math.pow(x,2) + 8000*Math.pow(5.2,x)*x + 625*Math.pow(2,2*x + 7)*x + Math.pow(2,x + 8)*Math.pow(5,4 - x)*Math.pow(13,x) + 3515625*Math.pow(2,2*x + 10)) - 4375*Math.pow(2,x + 5)));
};

motivation2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/25*(Math.sqrt(5)* Math.pow(2,-x - 2) * Math.sqrt( Math.pow(2,2* x)*Math.pow(x,2)+Math.pow(2,x + 2)*Math.pow(13/5,x)*x + 5*Math.pow(2,2*x + 2)*x + Math.pow(2,x + 4)*Math.pow(5,1 - x)*Math.pow(13,x)+ 78125*Math.pow(2,2* x + 4) ) - 1875));
};

power2LevelFunc = function(){
    var x = this.level;
    return Math.floor(0.0005*Math.pow(2,-x)*(Math.sqrt(125*Math.pow(2,2*x + 5)*Math.pow(x,2) + 8000*Math.pow(5.2,x)*x + 625*Math.pow(2,2*x + 7)*x + Math.pow(2,x + 8)*Math.pow(5,4 - x)*Math.pow(13,x) + 3515625*Math.pow(2,2*x + 10)) - 4375*Math.pow(2,x + 5)));
};

function calcStartingPop(){ //this is pre carp1/2 population
    //simplification, assume 10 of each building. the purpose is mostly to have something other than 1
    var zone = autoTrimpSettings.APValueBoxes.maxZone > 230 ? 230 : autoTrimpSettings.APValueBoxes.maxZone; //beyond 230, pop comes from DG.
    var startingPop = 10;
    var howMany = 150;
    startingPop += (getPageSetting('MaxHut') <= 0 ? howMany : getPageSetting('MaxHut')) * 6;  //huts
    startingPop += (getPageSetting('MaxHouse') <= 0 ? howMany : getPageSetting('MaxHouse')) * 10; //houses
    if(zone >= 8) startingPop  += (getPageSetting('MaxMansion')   <= 0 ? howMany : getPageSetting('MaxMansion')) * 20;    //mansions
    if(zone >= 14) startingPop += (getPageSetting('MaxHotel')     <= 0 ? howMany : getPageSetting('MaxHotel')) * 40;      //hotel
    if(zone >= 25) startingPop += (getPageSetting('MaxResort')    <= 0 ? howMany : getPageSetting('MaxResort')) * 80;     //resort
    if(zone >= 30) startingPop += (getPageSetting('MaxGateway')   <= 0 ? howMany : getPageSetting('MaxGateway')) * 100;   //gateway
    if(zone >= 37) startingPop += (getPageSetting('MaxCollector') <= 0 ? howMany : getPageSetting('MaxCollector')) * 5000;//collector

    var gigasUnlocked = 0;
    var amt   = Math.max(1, getPageSetting('FirstGigastation'));
    var delta = Math.max(0, getPageSetting('DeltaGigastation'));
    while(zone >= AutoPerks.gigaStations[gigasUnlocked]){
        startingPop += Math.floor(amt * 10000 * Math.pow(1.2, gigasUnlocked));
        gigasUnlocked++;
        amt += delta;
        if(gigasUnlocked >= AutoPerks.gigaStations.length) break;
    }
    
    return startingPop;
}

function calcBasePopArr(){
    AutoPerks.startingPop = calcStartingPop();
    AutoPerks.basePopArr = [];
    AutoPerks.startingFuelArr = [];
    for (AutoPerks.fuelMaxZones = 0; AutoPerks.fuelMaxZones <= (autoTrimpSettings.APValueBoxes.amalGoal > 0 ? autoTrimpSettings.APValueBoxes.amalZone : autoTrimpSettings.APValueBoxes.maxZone) - 230; AutoPerks.fuelMaxZones += 1)
        AutoPerks.basePopArr[AutoPerks.fuelMaxZones] = calcBasePop();
    
    AutoPerks.fuelMaxZones = Math.max(0,(autoTrimpSettings.APValueBoxes.amalGoal > 0 ? autoTrimpSettings.APValueBoxes.amalZone : autoTrimpSettings.APValueBoxes.maxZone) - 230);
    AutoPerks.maxFuelBasePopAtMaxZ = AutoPerks.fuelMaxZones > 0 ? AutoPerks.basePopArr[AutoPerks.fuelMaxZones] : AutoPerks.startingPop; //basepop if we fuel from 230 to maxZ
    
    return AutoPerks.basePopArr;
}

//base pop only depends on DG stats and fuel zones.
function calcBasePop(useMaxFuel){
    //fuel and tauntimps
    var eff = game.generatorUpgrades["Efficiency"].upgrades;
    var fuelCapacity = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var supMax = 0.2 + 0.02 * game.generatorUpgrades["Supply"].upgrades;
    var OCEff = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var magmaCells = game.talents.magmaFlow.purchased ? 18 : 16;
    var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    
    var popTick = Math.floor(Math.sqrt(fuelCapacity)* 500000000 * (1 + 0.1*eff) * OCEff);
    var endZone = (autoTrimpSettings.APValueBoxes.amalGoal > 0 ? autoTrimpSettings.APValueBoxes.amalZone : autoTrimpSettings.APValueBoxes.maxZone);
    
    var maxPopFound = 0;
    var maxPopFuelStart = 230;
    
    AutoPerks.fuelStartZone = 230;
    
    for(AutoPerks.fuelStartZone = 230; AutoPerks.fuelStartZone <= endZone - AutoPerks.fuelMaxZones + 1; AutoPerks.fuelStartZone++){
        AutoPerks.fuelEndZone = Math.min((autoTrimpSettings.APValueBoxes.amalGoal > 0 ? autoTrimpSettings.APValueBoxes.amalZone : autoTrimpSettings.APValueBoxes.maxZone), AutoPerks.fuelStartZone + AutoPerks.fuelMaxZones - 1);
        
        var pop = AutoPerks.startingPop;
        var currFuel = 0;
        for (var i = AutoPerks.fuelStartZone; i < endZone; i++){
            pop *= Math.pow(1.003, 2.97); //tauntimp average increase

            if(i <=  AutoPerks.fuelEndZone){
                var fuelFromMagmaCell = Math.min(0.2 + (i-230) * 0.01, supMax);
                var fuelFromZone = magmaCells * fuelFromMagmaCell;
                currFuel += fuelFromZone;
                if(currFuel > 2*fuelCapacity){
                    var ticks = Math.ceil((currFuel - 2*fuelCapacity) / burn);
                    pop += ticks * popTick;
                    currFuel -= burn * ticks;
                }
            }
        }
        if(maxPopFound < pop){
            maxPopFound = pop;
            maxPopFuelStart = AutoPerks.fuelStartZone;
        }
    }
    
    AutoPerks.totalMi = (game.talents.magmaFlow.purchased ? 18 : 16) * (autoTrimpSettings.APValueBoxes.maxZone - 230 - AutoPerks.fuelMaxZones);
    AutoPerks.startingFuelArr[AutoPerks.fuelMaxZones] = maxPopFuelStart;
    return Math.floor(maxPopFound * AutoPerks.DailyHousingMult);
}

//base pop at maxZ, used for respec
function calcBasePopMaintain(){
    var eff = game.generatorUpgrades["Efficiency"].upgrades;
    var fuelCapacity = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var supMax = 0.2 + 0.02 * game.generatorUpgrades["Supply"].upgrades;
    var OCEff = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var magmaCells = (game.talents.magmaFlow.purchased ? 18 : 16);
    var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    
    var currCarp1Bonus = Math.pow(1.1, game.portal["Carpentry"].level);
    var currCarp2Bonus = 1 + 0.0025 * game.portal["Carpentry_II"].level;
    var basePop = trimpsRealMax / currCarp1Bonus / currCarp2Bonus;
    var currFuel = game.global.magmaFuel;
    
    var popTick = Math.floor(Math.sqrt(fuelCapacity)* 500000000 * (1 + 0.1*eff) * OCEff);
    
    for (var i = game.global.world; i < autoTrimpSettings.APValueBoxes.maxZone; i++){
        basePop *= 1.009; //tauntimp average increase        
        var fuelFromMagmaCell = Math.min(0.2 + (i-230) * 0.01, supMax);
        var fuelFromZone = magmaCells * fuelFromMagmaCell;
        currFuel += fuelFromZone;
        if(currFuel > 2*fuelCapacity){
            var ticks = Math.ceil((currFuel - 2*fuelCapacity) / burn);
            basePop += ticks * popTick;
            currFuel -= burn * ticks;
        }
    }
    
    return Math.floor(basePop);
}

function popMultiplier(){
    var carp1Perk = AutoPerks.useLivePerks ? game.portal["Carpentry"] : AutoPerks.perksByName.Carpentry;
    var carp2Perk = AutoPerks.useLivePerks ? game.portal["Carpentry_II"] : AutoPerks.perksByName.Carpentry_II;
    
    var carp1 = Math.pow(1.1, carp1Perk.level);
    var carp2 = 1 + 0.0025 * carp2Perk.level;
    return carp1 * carp2;
}

function calcCoords(coordinated, coordinations){
    var coordPerk = AutoPerks.useLivePerks ? game.portal["Coordinated"] : AutoPerks.perksByName.Coordinated;
    var coordsToUse = typeof coordinations === 'undefined' ? AutoPerks.coordsUsed : coordinations;
    
    var population = AutoPerks.basePopToUse * popMultiplier();
    var coordsUsed = 0;
    
    var armySize = 1;
    var level = (typeof coordinated === 'undefined' ? coordPerk.level : coordinated);
    
    //quite expensive for how often this runs, so store previous calculation in memory for each coordination level and amount
    //if(AutoPerks.calcCoordsLastLevel === level && AutoPerks.calcCoordsLastCoords === coordsToUse && AutoPerks.calcCoordsCoordsPurchased === coordsToUse && population >= 3*AutoPerks.calcCoordsLastArmy)
    //    return AutoPerks.calcCoordsLastArmy;
    AutoPerks.fullSoldiers = 1;
    
    if(AutoPerks.ChallengeName == "Trimp" || (autoTrimpSettings.APValueBoxes.amalGoal > 0 && autoTrimpSettings.APValueBoxes.amalZone == autoTrimpSettings.APValueBoxes.coordsBehind + (autoTrimpSettings.APValueBoxes.amalZone >= 230 ? 100 : 0))){
        AutoPerks.calcCoordsCoordsPurchased = 0;
        AutoPerks.calcCoordsLastLevel  = level;
        AutoPerks.calcCoordsLastCoords = coordsToUse;
        AutoPerks.calcCoordsLastArmy   = 1;
        return 1;
    }
    
    var coordMult = 1 + 0.25 * Math.pow(0.98, level);
    for(var i = 0; i < coordsToUse; i++){
        var tmp = Math.ceil(armySize * coordMult);
        if(tmp*3 > population) break; //cant afford next coordination
        AutoPerks.fullSoldiers = Math.ceil(AutoPerks.fullSoldiers * 1.25);
        coordsUsed++;
        armySize = tmp;
        //armySize = Math.ceil(armySize * coordMult);
    }
    
    //AutoPerks.calcCoordsPopulation = population;
    
    AutoPerks.calcCoordsCoordsPurchased = coordsUsed;
    AutoPerks.calcCoordsLastLevel  = level;
    AutoPerks.calcCoordsLastCoords = coordsToUse;
    AutoPerks.calcCoordsLastArmy   = armySize;
    return armySize;
}

function getAmalFinal(basePopAtZ){
    return basePopAtZ * AutoPerks.popMult / AutoPerks.finalArmySize / AutoPerks.amalMultPre / AutoPerks.RatioToAmal;
}

function minMaxMi(){
    //for a given carp1/2/coordinated/amalgamator, figure out min fuel zones in 1 fuel zone decreases
    AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
    AutoPerks.calcArmySizes(); //calculates AutoPerks.armySizeAmalZ and AutoPerks.armySizeMaxZ
    var amalZToMaxZ = AutoPerks.currAmalgamators > 0 ? Math.pow(1.009, autoTrimpSettings.APValueBoxes.maxZone - autoTrimpSettings.APValueBoxes.amalZone) : 1;
    
    if(AutoPerks.useMaxFuel)
        AutoPerks.fuelMaxZones = Math.max(0,autoTrimpSettings.APValueBoxes.maxZone - 230);
    else
        AutoPerks.fuelMaxZones = Math.max(0,(autoTrimpSettings.APValueBoxes.amalGoal > 0 ? autoTrimpSettings.APValueBoxes.amalZone : autoTrimpSettings.APValueBoxes.maxZone) - 230);

    if(AutoPerks.fuelMaxZones <= 0){
        AutoPerks.totalMi = 0;
        return 0;
    }
    
    if(AutoPerks.benefitHolderObj.DG.weightUser > 0 && !AutoPerks.useMaxFuel && !autoTrimpSettings.APCheckBoxes.userMaintainMode){ //if DG weight is 0, always use max fuel
        var maxLoops = 500;
        while(maxLoops--){
            if(AutoPerks.fuelMaxZones <= 1) break;
            AutoPerks.fuelMaxZones -= 1;
            
            //we need to check 2 things: hitting amalgoal at amalzone and maintaining it by maxzone
            //check pop goal at amalZ
            AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[AutoPerks.fuelMaxZones]; //must be called before every getAmalFinal
            AutoPerks.RatioToAmal    = Math.pow(10, 10-AutoPerks.clearedSpiresBonus);
            AutoPerks.finalArmySize  = AutoPerks.armySizeAmalZ;
            AutoPerks.finalAmalRatio = getAmalFinal(AutoPerks.basePopAtAmalZ);
            
            //check pop goal at maxZ
            AutoPerks.basePopAtMaxZ   = AutoPerks.basePopAtAmalZ * amalZToMaxZ;
            AutoPerks.RatioToAmal     = 1000000; //x1000 to preserve amal, x1000 to "reach" next one (forces loop amal loop to fit maintain mode)
            AutoPerks.finalArmySize   = AutoPerks.armySizeMaxZ;
            AutoPerks.finalAmalRatio2 = getAmalFinal(AutoPerks.basePopAtMaxZ);
            
            if(AutoPerks.finalAmalRatio < 1.05 || (AutoPerks.currAmalgamators > 0 && AutoPerks.finalAmalRatio2 < 1.05)){ //below threshold, undo last
                AutoPerks.fuelMaxZones += 1;
                AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[AutoPerks.fuelMaxZones]; //must be called before every getAmalFinal
                AutoPerks.finalAmalRatio = getAmalFinal(AutoPerks.basePopAtAmalZ); //probably not needed
                break;
            }
        }
    }
    
    AutoPerks.fuelStartZone = AutoPerks.startingFuelArr[Math.min(AutoPerks.startingFuelArr.length-1, AutoPerks.fuelMaxZones)];
    AutoPerks.fuelEndZone = AutoPerks.fuelStartZone + AutoPerks.fuelMaxZones - 1;
    AutoPerks.totalMi = (game.talents.magmaFlow.purchased ? 18 : 16) * (autoTrimpSettings.APValueBoxes.maxZone - 230 - AutoPerks.fuelMaxZones);
    if(AutoPerks.useMaxFuel) AutoPerks.totalMi = 0;
}

//printout
function printBenefitsPerks(levels, shush){
    if(!shush){
        debug("benefits:");
        for(var i = 0; i < AutoPerks.benefitHolder.length; i++)
            debug(AutoPerks.benefitHolder[i].getValue());
        debug("Perks:");
    }
    var sumSpent = 0;
    var sumTotalPrices = 0;
    for(var i = 0; i < AutoPerks.perkHolder.length; i++){
        if(AutoPerks.perkHolder[i].isFixed) continue;
        sumSpent += AutoPerks.perkHolder[i].spent;
        sumTotalPrices += AutoPerks.perkHolder[i].getTotalPrice();
        //if(!shush) debug(AutoPerks.perkHolder[i].name + " - " + AutoPerks.perkHolder[i].level + " - " + prettify(AutoPerks.perkHolder[i].getBenefit()));
        if(!shush) debug(AutoPerks.perkHolder[i].name + " - " + AutoPerks.perkHolder[i].level + " - " + prettify(AutoPerks.perkHolder[i].getTotalPrice()));
    }
    debug("sumSpent " + prettify(sumSpent) + " sumtotalprices " + prettify(sumTotalPrices));
    
}

//we care about DG growth, not straight Mi numbers, so convert the two based off how fast we can expect our DG to grow.
function MiToDGGrowth(){
    var MiPerRun = AutoPerks.totalMi;
    if(MiPerRun === 0) return AutoPerks.DGGrowthRun = 0;
    
    //get levels
    var effCurr         = game.generatorUpgrades["Efficiency"].upgrades;
    var effPlusOne      = game.generatorUpgrades["Efficiency"].upgrades + 1;
    var capacityCurr    = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var capacityPlusOne = 3 + game.generatorUpgrades["Capacity"].baseIncrease * (game.generatorUpgrades["Capacity"].upgrades+1);
    var OCNow           = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var OCPlusOne       = 1 - game.generatorUpgrades["Overclocker"].nextModifier();
    
    //costs in absolute Mi
    var effCost         = game.generatorUpgrades["Efficiency"].cost();
    var capCost         = game.generatorUpgrades["Capacity"].cost();
    var OCCost          = game.generatorUpgrades["Overclocker"].cost();
    
    //Mi decays and what we actually care about is how long is takes us to afford an upgrade. translate costs into #runs needed
    var effRuns = runsToGetMi(effCost, MiPerRun);
    var capRuns = runsToGetMi(capCost, MiPerRun);
    var OCRuns  = runsToGetMi(OCCost , MiPerRun);
    
    //base population, population if we increase efficiency, capacity and OC
    var popCurr         = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effCurr)    * OCNow);
    var effPopPlusOne   = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effPlusOne) * OCNow);
    var capPopPlusOne   = Math.floor(Math.sqrt(capacityPlusOne)* 500000000 * (1 + 0.1*effCurr)    * OCNow);
    var OCPopPlusOne    = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effCurr)    * OCPlusOne);
    
    //efficiency expressed as pop increase divided by number of runs to get it. the more Mi per run we get, the greater these values will be
    var effEff = (effPopPlusOne/popCurr - 1) / effRuns;
    var capEff = (capPopPlusOne/popCurr - 1) / capRuns;
    var OCEff  = (OCPopPlusOne /popCurr - 1) / OCRuns;
    
    AutoPerks.DGGrowthRun = Math.max(effEff, capEff, OCEff);
    /*if(AutoPerks.DGGrowthRun == effEff) AutoPerks.DGWhat = "efficiency";
    if(AutoPerks.DGGrowthRun == capEff) AutoPerks.DGWhat = "cap";
    if(AutoPerks.DGGrowthRun == OCEff)  AutoPerks.DGWhat = "OC";
    AutoPerks.DGWhat2 = (effEff*10000).toFixed(2) + "/" + (capEff*10000).toFixed(2) + "/" + (OCEff*10000).toFixed(2);*/
    return AutoPerks.DGGrowthRun;
}

//how many runs to afford upgrade
function runsToGetMi(MiCost, MiPerRun){
    var runsForUpgrade = 0;
    var currMi = 0;
    var decay = ((game.permanentGeneratorUpgrades.Shielding.owned) ? 0.2 : 0.3);
    if(MiPerRun >= MiCost)
        runsForUpgrade = MiCost/MiPerRun; //this is an approximation because decay still plays a role
    else while (runsForUpgrade <= 20){
        currMi += MiPerRun;
        
        if(currMi >= MiCost){
            currMi -= MiCost;
            currMi *= 1 - decay;
            runsForUpgrade += 1-currMi/MiCost; //factor in any leftover Mi we'll be taking over to our next run
            break;
        }
        currMi *= 1 - decay;
        runsForUpgrade++;
    }
    return runsForUpgrade;
}

AutoPerks.getPct = function(){
    return (AutoPerks.perksByName.Carpentry.spent + AutoPerks.perksByName.Carpentry_II.spent + AutoPerks.perksByName.Coordinated.spent) / AutoPerks.totalHelium * 100;
};

AutoPerks.calcArmySizes = function(){
    var coordperk = AutoPerks.perksByName.Coordinated;
    AutoPerks.armySizeAmalZ = calcCoords(coordperk.level, (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 99 : -1) + autoTrimpSettings.APValueBoxes.amalZone-autoTrimpSettings.APValueBoxes.coordsBehind);
    AutoPerks.armySizeMaxZ  = calcCoords(coordperk.level, (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 99 : -1) + autoTrimpSettings.APValueBoxes.maxZone);
};

//get ready / initialize
AutoPerks.initializeAmalg = function(){
    AutoPerks.MAXPCT = 85;        //maximum helium we're willing to spend in carp1/2/coordinated
    AutoPerks.DGGrowthRun = 0;    //initialize
    //input checks
    //if(autoTrimpSettings.APValueBoxes.amalZone < 230) autoTrimpSettings.APValueBoxes.amalZone = 230;
    if(autoTrimpSettings.APValueBoxes.amalZone > 999) autoTrimpSettings.APValueBoxes.amalZone = 999;
    if(autoTrimpSettings.APValueBoxes.amalGoal < 0) autoTrimpSettings.APValueBoxes.amalGoal = 0;
    if(autoTrimpSettings.APValueBoxes.maxZone > 999) autoTrimpSettings.APValueBoxes.maxZone = 999;
    if(autoTrimpSettings.APValueBoxes.maxZone < autoTrimpSettings.APValueBoxes.amalZone) autoTrimpSettings.APValueBoxes.maxZone = autoTrimpSettings.APValueBoxes.amalZone;
    if(autoTrimpSettings.APValueBoxes.coordsBehind < 0) autoTrimpSettings.APValueBoxes.coordsBehind = 0;
    AutoPerks.updateBoxesUI();        //populate UI boxes based on selected preset. also updates userWeights from box values
    
    //army calc
    AutoPerks.coordsUsed = (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 99 : -1) + (autoTrimpSettings.APCheckBoxes.userMaintainMode ? autoTrimpSettings.APValueBoxes.maxZone : autoTrimpSettings.APValueBoxes.amalZone-autoTrimpSettings.APValueBoxes.coordsBehind);
    AutoPerks.finalArmySize = calcCoords(); //uses coordinated
    
    //step 1: find max amalgamators we can afford. calculate carp1/2/coordinated along the way
    var carp1perk = AutoPerks.perksByName.Carpentry;
    var carp2perk = AutoPerks.perksByName.Carpentry_II;
    var coordperk = AutoPerks.perksByName.Coordinated;
    var pct = AutoPerks.getPct();
    var carp1 = 0;
    var carp2 = 0;
    var coordinated = 0;
    var carp1cost = 0;
    var carp2cost = 0;
    var coordinatedcost = 0;
    var finalMsg = '';
    
    //AutoPerks.fuelMaxZones = Math.max(0, autoTrimpSettings.APValueBoxes.amalZone - 230); //max possible fuel
    
    //calcBasePop only needs to be calculated once for each AutoPerks.fuelMaxZones and autoTrimpSettings.APValueBoxes.amalZone
    //we can save the results and pull the previously calculated values for speed
    calcBasePopArr();
    
    AutoPerks.basePopAtAmalZ = AutoPerks.fuelMaxZones === 0 ? AutoPerks.startingPop : AutoPerks.basePopArr[AutoPerks.fuelMaxZones];
    if(autoTrimpSettings.APCheckBoxes.userMaintainMode){ //only need to maintain our amalg at maxZone
        AutoPerks.currAmalgamators = autoTrimpSettings.APValueBoxes.amalGoal;
        AutoPerks.RatioToAmal = 1000000; //x1000 to preserve amal, x1000 to "reach" next one (forces loop amal loop to fit maintain mode)
        var basePopAtZToUse = calcBasePopMaintain();
    }
    else{
        AutoPerks.currAmalgamators = 0;
        AutoPerks.clearedSpiresBonus = Math.max(0,Math.min(4, Math.floor((autoTrimpSettings.APValueBoxes.amalZone - 200) / 100)));
        AutoPerks.RatioToAmal = Math.pow(10, 10-AutoPerks.clearedSpiresBonus);
        var basePopAtZToUse = AutoPerks.basePopAtAmalZ;
    }
    
    var safety = 1.05; //5% to account for tauntimps rng
    while(AutoPerks.currAmalgamators <= autoTrimpSettings.APValueBoxes.amalGoal){
        if(autoTrimpSettings.APValueBoxes.amalGoal === 0) break;
        
        AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
        AutoPerks.popMult = popMultiplier(); //carp1/2 multiplier
        AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
        while(AutoPerks.finalAmalRatio < safety && pct < AutoPerks.MAXPCT){
            //we cant reach our amalgamators, so increase carp1/coordinated/carp2 until we can
            //we calculate the efficiency (amal goal divided by helium cost) of leveling coordinated and compare it to the efficiency of leveling carp1&carp2
            var carp1Price = carp1perk.getPrice();
            var carp1Increase = 1.1;
            
            //we may not always buy carp2 for low levels of carp1
            var carp2Price = 0;
            var carp2Increase = 1;
            if(!carp2perk.isLocked){
                //carp2 level func
                var x = carp1perk.level;
                var levelTarget = Math.floor(1/100*(Math.sqrt(5)*Math.sqrt(x + Math.pow(2,1-x)*Math.pow(5,2-x)*Math.pow(13,x)+76050000)-20500));
                var newLevel = Math.max(0, levelTarget);
                if(newLevel > carp2perk.level){
                    var packLevel = newLevel - carp2perk.level;
                    carp2Price = carp2perk.getTotalPrice(newLevel) - carp2perk.spent;
                    carp2Increase = (1 + 0.0025 * newLevel) / (1 + 0.0025 * carp2perk.level)
                }
            }
            
            var carp12Price = carp1Price + carp2Price;
            var carp12Increase = carp1Increase * carp2Increase;
            var carp12Eff = carp12Increase / carp12Price;
            
            var coordPrice = coordperk.getPrice();
            var coordIncrease = calcCoords(coordperk.level+1) / AutoPerks.finalArmySize;
            var coordEff = coordIncrease / coordPrice;
            if(carp12Eff >= coordEff || autoTrimpSettings.APValueBoxes.amalZone == autoTrimpSettings.APValueBoxes.coordsBehind + (autoTrimpSettings.APValueBoxes.amalZone >= 230 ? 100 : 0)){ //level up carp1 and maybe carp2. if coordsbehind equals amal zone that means we dont buy any coordinations so hardcap coord to level 0
                carp1perk.buyLevel();
                carp1perk.spent+= carp1Price;
                pct = AutoPerks.getPct();
                AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
                AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
                if(AutoPerks.finalAmalRatio >= safety || pct >= AutoPerks.MAXPCT)
                    break;
                
                //calculate carp2 based off of carp1.
                if(!carp2perk.isLocked){
                    var levelTarget = carp1perk.childLevelFunc();
                    var newLevel = Math.max(0, levelTarget);
                    if(newLevel > carp2perk.level){
                        var packLevel = newLevel - carp2perk.level;
                        var packPrice = carp2perk.getTotalPrice(newLevel) - carp2perk.spent;
                        carp2perk.level += packLevel;
                        carp2perk.spent += packPrice;
                    }

                    pct = AutoPerks.getPct();
                    AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
                    AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
                    if(AutoPerks.finalAmalRatio >= safety || pct >= AutoPerks.MAXPCT)
                        break;
                }
            }
            else{ //level up coord
                coordperk.buyLevel();
                coordperk.spent += coordPrice;
                pct = AutoPerks.getPct();
                AutoPerks.finalArmySize = calcCoords(); //uses coordinated //recalculate army size
                AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
                if(AutoPerks.finalAmalRatio >= safety || pct >= AutoPerks.MAXPCT)
                    break;
            }
        }
        if(AutoPerks.finalAmalRatio >= safety){
            //store successful carp1/2/coordinated
            carp1 =             carp1perk.level;
            carp2 =             carp2perk.level;
            coordinated =       coordperk.level;
            carp1cost =         carp1perk.spent;
            carp2cost =         carp2perk.spent;
            coordinatedcost =   coordperk.spent;
            var runMode = "";
            if(AutoPerks.dailyObj === AutoPerks.Squared) runMode = AutoPerks.ChallengeName+" (Battle GU, max fuel, helium weight 0): ";
            else if(AutoPerks.dailyObj != ""){
                var mods = "";
                for(var propertyName in AutoPerks.dailyObj){
                    if(propertyName == "seed") continue;
                    mods += propertyName.charAt(0).toUpperCase() + propertyName.substr(1) + ",";
                }
                
                runMode = "Daily: " + mods + " (max fuel, x" + (AutoPerks.DailyWeight).toFixed(2) + " bonus): ";
            }
            
            var msg = runMode + "Amalgamator #"+AutoPerks.currAmalgamators+(autoTrimpSettings.APCheckBoxes.userMaintainMode ? " maintained. " : " found. ");
            finalMsg = msg + '<br>';
            if(AutoPerks.currAmalgamators === autoTrimpSettings.APValueBoxes.amalGoal)
                break;
            else
                AutoPerks.currAmalgamators++;
        }
        else{
            var msg1 = "Could not reach Amalgamator #"+AutoPerks.currAmalgamators+". Carp1: " + carp1perk.level + " Carp2: " + carp2perk.level.toExponential(2) + " Coordinated: " + coordperk.level + " "+pct.toFixed(2)+"% of total helium used. Pop/Army Goal: " + (AutoPerks.finalAmalRatio).toFixed(2);
            finalMsg = msg1 + '<br>' + finalMsg;
            
            AutoPerks.currAmalgamators--;
            break;
        }
    }
    
    document.getElementById("textAreaAllocate").innerHTML = finalMsg;
    if(AutoPerks.currAmalgamators < 0) AutoPerks.currAmalgamators = 0;
    AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
    
    AutoPerks.coordsUsed = (autoTrimpSettings.APValueBoxes.maxZone >= 230 ? 99 : -1) + autoTrimpSettings.APValueBoxes.maxZone;
    carp1perk.level = carp1;
    carp2perk.level = carp2;
    coordperk.level = coordinated;
    carp1perk.spent = carp1cost;
    carp2perk.spent = carp2cost;
    coordperk.spent = coordinatedcost;
    
    AutoPerks.calcArmySizes();
    var amalZToMaxZ = AutoPerks.currAmalgamators > 0 ? Math.pow(1.009, autoTrimpSettings.APValueBoxes.maxZone - autoTrimpSettings.APValueBoxes.amalZone) : 1;
    AutoPerks.basePopAtMaxZ = AutoPerks.basePopAtAmalZ * amalZToMaxZ;
    AutoPerks.RatioToAmal = 1000000; //x1000 to preserve amal, x1000 to "reach" next one (forces loop amal loop to fit maintain mode)
    AutoPerks.finalArmySize = AutoPerks.armySizeMaxZ;
    AutoPerks.finalAmalRatio2 = getAmalFinal(AutoPerks.basePopAtMaxZ);
};

//Auto Dump into Looting II
function lootdump() {
    viewPortalUpgrades();
    numTab(6, true);  
    if (getPortalUpgradePrice("Looting_II")+game.resources.helium.totalSpentTemp <= game.resources.helium.respecMax){
        var before = game.portal.Looting_II.level;
        game.global.lockTooltip = true;
        buyPortalUpgrade('Looting_II'); 
        game.global.lockTooltip = false;
        activateClicked();
        var after = game.portal.Looting_II.level;
        debug("Bought " + prettify(after-before) + " levels of Looting_II");
    }
    cancelPortal();
}

AutoPerks.updateDailyMods = function(){
    AutoPerks.dailyObj = "";
    AutoPerks.ChallengeName = game.global.challengeActive;
    if(portalWindowOpen){ //we are respecting to enter a new portal
        if(game.global.selectedChallenge == "Daily")
            AutoPerks.dailyObj = getDailyChallenge(readingDaily, true, false);
        else if(challengeSquaredMode && game.global.selectedChallenge != "")
            AutoPerks.dailyObj = AutoPerks.Squared;
        AutoPerks.ChallengeName = game.global.selectedChallenge;
    }
    else if(game.global.challengeActive == "Daily")
        AutoPerks.dailyObj = game.global.dailyChallenge;
    else if(game.global.runningChallengeSquared)
        AutoPerks.dailyObj = AutoPerks.Squared;
    
    AutoPerks.AntiStacks = handleGA(false, AutoPerks.dailyObj);
    AutoPerks.OblitMod   = AutoPerks.ChallengeName == "Obliterated" ? calcOblitMult(autoTrimpSettings.APValueBoxes.maxZone) : 1;
    AutoPerks.CoordMod   = AutoPerks.ChallengeName == 'Coordinate'  ? calcCoordMult(autoTrimpSettings.APValueBoxes.maxZone) : 1;
    AutoPerks.DailyHousingMult  =     (AutoPerks.dailyObj.hasOwnProperty("large")         ? dailyModifiers.large.getMult(AutoPerks.dailyObj.large.strength) : 1);
    AutoPerks.DailyResourceMult = 1 * (AutoPerks.dailyObj.hasOwnProperty("famine")        ? dailyModifiers.famine.getMult(AutoPerks.dailyObj.famine.strength) : 1)
                                    * (AutoPerks.dailyObj.hasOwnProperty("karma")         ? dailyModifiers.karma.getMult(AutoPerks.dailyObj.karma.strength, 150) : 1) //150 stacks (1 per cell kill)
                                    * (AutoPerks.dailyObj.hasOwnProperty("dedication")    ? dailyModifiers.dedication.getMult(AutoPerks.dailyObj.dedication.strength) : 1); 
    AutoPerks.DailyBreedingMult = 1 * (AutoPerks.dailyObj.hasOwnProperty("toxic")         ? dailyModifiers.toxic.getMult(AutoPerks.dailyObj.toxic.strength, 150) : 1) //150 stacks (1 per cell kill)
                                    * (AutoPerks.dailyObj.hasOwnProperty("dysfunctional") ? dailyModifiers.dysfunctional.getMult(AutoPerks.dailyObj.dysfunctional.strength) : 1); 
    AutoPerks.DailyEquipmentMult =    (AutoPerks.dailyObj.hasOwnProperty("metallicThumb") ? dailyModifiers.metallicThumb.getMult(AutoPerks.dailyObj.metallicThumb.strength) : 1);
    
    AutoPerks.battleGUMult   = autoTrimpSettings.APCheckBoxes.userBattleGU || AutoPerks.dailyObj == AutoPerks.Squared ? getMaxBattleGU(autoTrimpSettings.APValueBoxes.maxZone) : 1; //we force battle GU in C2 mode
    AutoPerks.sharpBonusMult = autoTrimpSettings.APCheckBoxes.userSharpTrimps ? 1.5 : 1;
    AutoPerks.DailyWeight = 1;
    if(AutoPerks.dailyObj != "" && AutoPerks.dailyObj != AutoPerks.Squared)
        AutoPerks.DailyWeight = 1 + (portalWindowOpen ? getDailyHeliumValue(countDailyWeight(getDailyChallenge(readingDaily, true)))/100 : getDailyHeliumValue(countDailyWeight())/100);    
};

AutoPerks.firstRun = function(){
    autoTrimpSettings.APValueBoxes = AutoPerks.makeDefaultValueBoxes(); //create fresh
    autoTrimpSettings.APCheckBoxes = AutoPerks.makeDefaultCheckBoxes(); //create fresh
    
    AutoPerks.useLivePerks = false; //by default, use perk setup as calculated by AutoPerks.
    AutoPerks.updateDailyMods();    // current (or selected) challenge modifiers
    AutoPerks.initializePerks();    //create data structures
    AutoPerks.initializeGUI();      //create UI elements
    AutoPerks.updateBoxesUI();      //populate UI boxest
    
    //these are also calculated here for time estimate function
    AutoPerks.windMod = 1 + (autoTrimpSettings.APValueBoxes.maxZone >= 241 ? 13 * game.empowerments.Wind.getModifier() * 10 : 0); //13 minimum stacks
    AutoPerks.compoundingImp = Math.pow(1.003, autoTrimpSettings.APValueBoxes.maxZone * 3 - 1);
    AutoPerks.gigaStations = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 72, 74, 76, 78, 81, 84, 87, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 180, 190, 200, 210, 220];
}



const topPQ = 0;
const parentPQ = i => ((i + 1) >>> 1) - 1;
const leftPQ = i => (i << 1) + 1;
const rightPQ = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[topPQ];
  }
  add(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  poll() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > topPQ) {
      this._swap(topPQ, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[topPQ] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > topPQ && this._greater(node, parentPQ(node))) {
      this._swap(node, parentPQ(node));
      node = parentPQ(node);
    }
  }
  _siftDown() {
    let node = topPQ;
    while (
      (leftPQ(node) < this.size() && this._greater(leftPQ(node), node)) ||
      (rightPQ(node) < this.size() && this._greater(rightPQ(node), node))
    ) {
      let maxChild = (rightPQ(node) < this.size() && this._greater(rightPQ(node), leftPQ(node))) ? rightPQ(node) : leftPQ(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}
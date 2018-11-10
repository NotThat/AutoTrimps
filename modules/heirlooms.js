////MODULES["heirlooms"] = {};
////////////////////////////////////////
//Heirloom Functions////////////////////
////////////////////////////////////////
var worth = {'Shield': {}, 'Staff': {}};
function sortHeirlooms(){
    worth = {'Shield': {}, 'Staff': {}};
    for (var loom in game.global.heirloomsExtra) {
        var theLoom = game.global.heirloomsExtra[loom];
        worth[theLoom.type][loom] = theLoom.rarity;
    }

    //sort high to low value, priority on rarity, followed by mod evaluation
    for (var x in worth){
        worth[x] = Object.keys(worth[x]).sort(function(a, b) {
            if(worth[x][b] == worth[x][a]) {
                return evaluateHeirloomMods(b, 'heirloomsExtra') - evaluateHeirloomMods(a, 'heirloomsExtra');
            }
            else
                return worth[x][b] - worth[x][a];
        });
    }
}


//NEW:
//makes an array of heirlooms sitting in the temporary extra area to indicate to the autoHeirlooms() function which to Carry/Drop
var worth2 = {'Shield': [], 'Staff': []};
function worthOfHeirlooms(){
    worth2 = {'Shield': [], 'Staff': []};
    for (var index in game.global.heirloomsExtra) {
        var theLoom = game.global.heirloomsExtra[index];
        var data = {'location': 'heirloomsExtra', 'index': index, 'rarity': theLoom.rarity, 'eff': evaluateHeirloomMods(index, 'heirloomsExtra')};
        worth2[theLoom.type].push(data);
    }
    //sort algorithm: high to low value, priority on rarity, followed by mod evaluation
    var valuesort = function(a, b) {
        if(b.rarity == a.rarity) {
            return b.eff - a.eff;
        }
        else
            return b.rarity - a.rarity;
    };
    // sort shield
    worth2['Shield'].sort(valuesort);
    // sort staff
    worth2['Staff'].sort(valuesort);

    //Output each carried Heirlooms worth to console (or say heirloomsExtra instead)
    /*
    for(var index in game.global.heirloomsCarried) {
        console.log(evaluateHeirloomMods(index, 'heirloomsCarried'));
    }
    */
}

//Automatically evaluate and carry the best heirlooms, and recommend upgrades for equipped items. 
//AutoHeirlooms will only change carried items when the heirlooms window is not open. 
//Carried items will be compared and swapped with the types that are already carried. 
//If a carry spot is empty, it will be filled with the best shield (if available). 
//Evaluation is based ONLY on the following mods (listed in order of priority, high to low): Void Map Drop Chance/Trimp Attack, 
//Crit Chance/Crit Damage, Miner Efficiency/Metal Drop, Gem Drop/Dragimp Efficiency, Farmer/Lumberjack Efficiency. 
//For the purposes of carrying, rarity trumps all of the stat evaluations. Empty mod slots are valued at the average value of the best missing mod.
//NEW:
function autoHeirlooms(){
    if(!heirloomsShown){
        //start by dropping ALL carried heirlooms
        var originalLength = game.global.heirloomsCarried.length;
        for(var index=0; index < originalLength; index++) {
            selectHeirloom(0, 'heirloomsCarried', true);
            newStopCarryHeirloom();
        }
        //immediately begin carrying any protected heirlooms.
        var originalLength = game.global.heirloomsExtra.length;
        for(var index=0; index < originalLength; index++) {
            var theLoom = game.global.heirloomsExtra[index];
            if ((theLoom.protected) && (game.global.heirloomsCarried.length < game.global.maxCarriedHeirlooms)){
                selectHeirloom(index, 'heirloomsExtra', true);
                newCarryHeirloom();
                index--; originalLength--;  //stop index-skipping/re-ordering (idk how else to do it).
            }
        }
        //selectively decide which heirlooms to carry
        if(!getPageSetting('HeirloomEvalNew')) valueLoomsOld(); //uses old heirloom valuing method
        else valueLoomsNew(); //only care about plagued heirlooms, and only 5/5 staves/shields and 2/5 shields.
        
        if(getPageSetting('HeirloomEvalNew')){
            //protect all heirlooms in our carried slots
            for(var index=0; index < game.global.heirloomsCarried.length; index++) 
                game.global.heirloomsCarried[index].protected = true;
        }
    }
    /*else if(heirloomsShown && game.global.selectedHeirloom.length > 0){
        heirloomUpgradeHighlighting();
    }*/
}

function valueLoomsNew(){
    var counter = 0;
    for(loom of game.global.heirloomsExtra){
        counter++;
        if(game.global.heirloomsCarried.length >= game.global.maxCarriedHeirlooms){ //can't carry any more
            debug("Can't carry any more heirlooms.", "heirlooms");
            return;
        }
        if(loom.rarity < 8) //not plagued, ignore it
            continue;
        var keepMetalStaves = isValidMetalStaff(loom, true) && getPageSetting('HeirloomMetalStaves');
        var keepWoodStaves  = isValidWoodStaff(loom, true)  && getPageSetting('HeirloomWoodStaves');
        var keepHighShield  = isValidHighShield(loom, true) && getPageSetting('HeirloomHighShield');
        var keepLowShield   = isValidLowShield(loom, true)  && getPageSetting('HeirloomLowShield');
        var keepPushShield  = isValidPushShield(loom, true) && getPageSetting('HeirloomPushShield');
        var keepHighPush    = isValidHighShield(loom, true) && isValidPushShield(loom, true) && getPageSetting('HeirloomHighPushShield');
        
        if(keepLowShield || keepHighShield || keepPushShield || keepMetalStaves || keepWoodStaves || keepHighPush){
            //debug("carrying heirloom " + loom);
            selectHeirloom(game.global.heirloomsExtra.indexOf(loom), 'heirloomsExtra', true);
            newCarryHeirloom(); //this reshuffles game.global.heirloomsExtra, so lets recall the function for the new array
            valueLoomsNew();
            return;
        }
    }
    //debug("counter " + counter);
}

function valueLoomsOld(){
    worthOfHeirlooms();
    //now start by re-filling any empty carried slots with the most highly evaluated heirlooms
    //Alternates EQUALLY between Shield and Staff, putting the best ones of each.
    //PART 3:
    while ((game.global.heirloomsCarried.length < game.global.maxCarriedHeirlooms) && game.global.heirloomsExtra.length > 0){
        //re-evaluate their worth (needed to refresh the worth array since we for sure re-arranged everything.)
        worthOfHeirlooms();
        if (worth2["Shield"].length > 0){
            var carryshield = worth2["Shield"].shift();
            selectHeirloom(carryshield.index, 'heirloomsExtra', true);
            newCarryHeirloom();
        }
        worthOfHeirlooms();
        if (worth2["Staff"].length > 0){
            var carrystaff = worth2["Staff"].shift();
            selectHeirloom(carrystaff.index, 'heirloomsExtra', true);
            newCarryHeirloom();
        }
    }
    sortHeirlooms();
    // Doing the Alternating Shield/Staff method above can cause good heirlooms to remain un-carried, just because the above was trying to hard to balance.
    // example: It picks up 4 ethereal shields and 2 ethereal staffs and 2 bad rare staffs, but there was actually a 5th good ethereal shield that it skipped.
    //          this will replace the lesser rarity or stat with the higher rarity or stat, either shield or staff.
    //PART 4:
    //Check each carried heirloom....
    for(var carried in game.global.heirloomsCarried) {
        var theLoom = game.global.heirloomsCarried[carried];
        //... against the Opposite type
        var opposite = {"Shield":"Staff", "Staff":"Shield"};
        if(worth[opposite[theLoom.type]].length == 0) continue; //end loop quick if absolutely nothin to swap in
        var index = worth[opposite[theLoom.type]][0];
        //... and compare the carried against the best worth opposite type in the extra pile. (since part 3 above took care of the bests of each same type)
        if(theLoom.rarity < game.global.heirloomsExtra[index].rarity) {
            if (!theLoom.protected){
                selectHeirloom(carried, 'heirloomsCarried', true);
                newStopCarryHeirloom();
                selectHeirloom(index, 'heirloomsExtra', true);
                newCarryHeirloom();
                sortHeirlooms();
            }
            //do nothing if the carried thing was protected.
        }
    }
}

//common to both autoheirloom1 and 2
//Shows you which Mod you would be best off upgrading in the heirloom window by highlighting it in blueish gray and a tooltip.
function heirloomUpgradeHighlighting() {
    var bestUpgrade;
    if(game.global.selectedHeirloom[1].includes('Equipped')) {
        var loom = game.global[game.global.selectedHeirloom[1]];
        bestUpgrade = evaluateHeirloomMods(0, game.global.selectedHeirloom[1], true);
        if(bestUpgrade.index) {
            bestUpgrade.effect *= getModUpgradeCost(loom, bestUpgrade.index);
            bestUpgrade.effect = bestUpgrade.effect.toFixed(6);
            var styleIndex = 4 + (bestUpgrade.index * 3);
            //enclose in backtic ` for template string $ stuff
            document.getElementById('selectedHeirloom').childNodes[0].childNodes[styleIndex].style.backgroundColor = "lightblue";
            document.getElementById('selectedHeirloom').childNodes[0].childNodes[styleIndex].setAttribute("onmouseover", `tooltip(\'Heirloom\', \"customText\", event, \'<div class=\"selectedHeirloomItem heirloomRare${loom.rarity}\"> AutoTrimps recommended upgrade for this item. </div>\'         )`);
            document.getElementById('selectedHeirloom').childNodes[0].childNodes[styleIndex].setAttribute("onmouseout", 'tooltip(\'hide\')');
            //lightblue = greyish
            //swapClass("tooltipExtra", "tooltipExtraHeirloom", document.getElementById("tooltipDiv"));
            //document.getElementById("tooltipDiv");
        }
    }
}

//Automatically upgrades the best mod on the equipped shield and equipped staff. Runs until you run out of nullifium.
function autoNull(){
    try {
        for(var e,d=[game.global.ShieldEquipped,game.global.StaffEquipped],o=0;2>o;o++){
            var l=d[o];
            if(e=evaluateHeirloomMods(0, l.type + "Equipped", !0),e.index){
                selectedMod=e.index;
                var a=getModUpgradeCost(l,selectedMod);
                if(game.global.nullifium < a)
                    continue;
                game.global.nullifium -= a;
                var i=getModUpgradeValue(l,selectedMod),t=l.mods[selectedMod];
                t[1]=i,"undefined"!=typeof t[3] ? t[3]++ : (t[2]=0,t[3]=1),game.heirlooms[l.type][l.mods[selectedMod][0]].currentBonus=i
            }
        }
    } 
    catch (err){
        debug("AutoSpendNull Error encountered, no Heirloom detected?: " + err.message,"general");
    }
}

//Heirloom helper function
function checkForMod(what, loom, location){
    var heirloom = game.global[location][loom];
    for (var mod in heirloom.mods){
        if (heirloom.mods[mod][0] == what) return true;
    }
    return false;
}

//Determines the best heirloom mods
function evaluateHeirloomMods(loom, location, upgrade) {
    var index = loom;
    var bestUpgrade = {
        'index': null,
        'name': '',
        'effect': 0
    };
    var tempEff;
    var steps;
    if(location.includes('Equipped'))
        loom = game.global[location];
    else
        loom = game.global[location][loom];
    //  return loom.rarity;
    var eff = 0;
    for(var m in loom.mods) {
        var critmult = getPlayerCritDamageMult();
        var critchance = getPlayerCritChance();
        var cmb = (critmult - game.heirlooms.Shield.critDamage.currentBonus/100);
        var ccb = (critchance - game.heirlooms.Shield.critChance.currentBonus/100);
        switch(loom.mods[m][0]) {
            case 'critChance':
                tempEff = ((loom.mods[m][1]/100) * cmb)/(ccb * cmb + 1 - ccb);
                eff += tempEff;
                if(upgrade){
                    if(loom.mods[m][1] >= 30) break;
                    steps = game.heirlooms.Shield.critChance.steps[loom.rarity];
                    tempEff = ((steps[2]/100) * critmult)/((critchance * critmult) + 1 - critchance);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'critChance';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'critDamage':
                tempEff = ((loom.mods[m][1]/100) * ccb)/(cmb * ccb + 1 - ccb);
                eff += tempEff;
                if(upgrade){
                    steps = game.heirlooms.Shield.critDamage.steps[loom.rarity];
                    tempEff = ((steps[2]/100)* critchance)/((critchance * critmult) + 1 - critchance);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'critDamage';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'trimpAttack':
                tempEff = loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade){
                    steps = game.heirlooms.Shield.trimpAttack.steps[loom.rarity];
                    tempEff = (steps[2]/100)/((game.heirlooms.Shield.trimpAttack.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'trimpAttack';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'voidMaps':
                tempEff = loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade){
                    steps = game.heirlooms.Shield.voidMaps.steps[loom.rarity];
                    tempEff = (steps[2]/100)/((game.heirlooms.Shield.voidMaps.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'voidMaps';
                        bestUpgrade.index = m;
                    }
                }
                break;

            case 'plaguebringer':
                tempEff = loom.mods[m][1]*1000000;
                eff += tempEff;
                if(upgrade){
                    steps = game.heirlooms.Shield.plaguebringer.steps[loom.rarity];
                    tempEff = (steps[2]/1)/((game.heirlooms.Shield.plaguebringer.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'plaguebringer';
                        bestUpgrade.index = m;
                    }
                }
                break;

            case 'MinerSpeed':
                tempEff = 0.75*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.75*steps[2]/100)/((game.heirlooms.Staff.MinerSpeed.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'MinerSpeed';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'metalDrop':
                tempEff = 0.75*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.75*steps[2]/100)/((game.heirlooms.Staff.metalDrop.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'metalDrop';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'DragimpSpeed':
                tempEff = 0.75*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.75*steps[2]/100)/((game.heirlooms.Staff.DragimpSpeed.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'DragimpSpeed';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'gemsDrop':
                tempEff = 0.75*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.75*steps[2]/100)/((game.heirlooms.Staff.gemsDrop.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'gemsDrop';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'FarmerSpeed':
                tempEff = 0.5*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.5*steps[2]/100)/((game.heirlooms.Staff.FarmerSpeed.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'FarmerSpeed';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'LumberjackSpeed':
                tempEff = 0.5*loom.mods[m][1]/100;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.5*steps[2]/100)/((game.heirlooms.Staff.LumberjackSpeed.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'LumberjackSpeed';
                        bestUpgrade.index = m;
                    }
                }
            case 'FluffyExp':
                tempEff = 0.5*loom.mods[m][1]*100000;
                eff += tempEff;
                if(upgrade) {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    tempEff = (0.5*steps[2]/1)/((game.heirlooms.Staff.FluffyExp.currentBonus/100) + 1);
                    tempEff = tempEff / getModUpgradeCost(loom, m);
                    if(tempEff > bestUpgrade.effect) {
                        bestUpgrade.effect = tempEff;
                        bestUpgrade.name = 'FluffyExp';
                        bestUpgrade.index = m;
                    }
                }
                break;
            case 'empty':
                var av;
                if(upgrade) break;
                //value empty mod as the average of the best mod it doesn't have. If it has all good mods, empty slot has no value
                if(loom.type == 'Shield') {
                    if(!checkForMod('trimpAttack', index, location)){
                        steps = game.heirlooms[loom.type].trimpAttack.steps[loom.rarity];
                        av = steps[0] + ((steps[1] - steps[0])/2);
                        tempEff = av/10;
                        eff += tempEff;
                    }
                    else if(!checkForMod('voidMaps', index, location)){
                        steps = game.heirlooms[loom.type].voidMaps.steps[loom.rarity];
                        av = steps[0] + ((steps[1] - steps[0])/2);
                        tempEff = (steps[2]/10);
                        eff += tempEff;
                    }
                    else if(!checkForMod('critChance', index, location)){
                        steps = game.heirlooms[loom.type].critChance.steps[loom.rarity];
                        av = steps[0] + ((steps[1] - steps[0])/2);
                        tempEff = (av * cmb)/(ccb * cmb + 1 - ccb);
                        eff += tempEff;
                    }
                    else if(!checkForMod('critDamage', index, location)){
                        steps = game.heirlooms[loom.type].critDamage.steps[loom.rarity];
                        av = steps[0] + ((steps[1] - steps[0])/2);
                        tempEff = (av * ccb)/(cmb * ccb + 1 - ccb);
                        eff += tempEff;
                    }
                    else if(!checkForMod('plaguebringer', index, location)){
                        steps = game.heirlooms[loom.type].plaguebringer.steps[loom.rarity];
                        av = steps[0] + ((steps[1] - steps[0])/2);
                        tempEff = av/1;
                        eff += tempEff;
                    }
                }
                if(loom.type == 'Staff') {
                    steps = game.heirlooms.defaultSteps[loom.rarity];
                    av = steps[0] + ((steps[1] - steps[0])/2);
                    if(!checkForMod('MinerSpeed', index, location) || !checkForMod('metalDrop', index, location) || !checkForMod('fragmentsDrop', index, location) || !checkForMod('ExplorerSpeed', index, location) || !checkForMod('FluffyExp', index, location)){
                        eff += 0.75*av/100;
                    }
                    else if(!checkForMod('FarmerSpeed', index, location) || !checkForMod('LumberjackSpeed', index, location)) {
                        eff += 0.5*av/100;
                    }
                }
                break;
                //trimpHealth?
        }
    }
    if(upgrade) return bestUpgrade;
    return eff;
}

var hrlmProtBtn1 = document.createElement("DIV");
hrlmProtBtn1.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn1.setAttribute('onclick', 'protectHeirloom(this, true)');
hrlmProtBtn1.innerHTML = 'Protect/Unprotect';  //since we cannot detect the selected heirloom on load, ambiguous name
hrlmProtBtn1.id='protectHeirloomBTN1';
var hrlmProtBtn2 = document.createElement("DIV");
hrlmProtBtn2.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn2.setAttribute('onclick', 'protectHeirloom(this, true)');
hrlmProtBtn2.innerHTML = 'Protect/Unprotect';
hrlmProtBtn2.id='protectHeirloomBTN2';
var hrlmProtBtn3 = document.createElement("DIV");
hrlmProtBtn3.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn3.setAttribute('onclick', 'protectHeirloom(this, true)');
hrlmProtBtn3.innerHTML = 'Protect/Unprotect';
hrlmProtBtn3.id='protectHeirloomBTN3';
document.getElementById('equippedHeirloomsBtnGroup').appendChild(hrlmProtBtn1);
document.getElementById('carriedHeirloomsBtnGroup').appendChild(hrlmProtBtn2);
document.getElementById('extraHeirloomsBtnGroup').appendChild(hrlmProtBtn3);


function protectHeirloom(element, modify){
    var selheirloom = game.global.selectedHeirloom;  //[number, location]
    var heirloomlocation = selheirloom[1];
    var heirloom = game.global[heirloomlocation];
    if (selheirloom[0] != -1)
        heirloom = heirloom[selheirloom[0]];
    //hard way ^^, easy way>>
    //var heirloom = getSelectedHeirloom();
    if (modify)    //sent by onclick of protect button, to toggle the state.
        heirloom.protected = !heirloom.protected;

    if (!element) { //then we came from newSelectHeirloom
        if (heirloomlocation.includes("Equipped"))
            element = document.getElementById('protectHeirloomBTN1');
        else if (heirloomlocation == "heirloomsCarried")
            element = document.getElementById('protectHeirloomBTN2');
        else if (heirloomlocation == "heirloomsExtra")
            element = document.getElementById('protectHeirloomBTN3');
    }
    if (element)
        element.innerHTML = heirloom.protected ? 'UnProtect' : 'Protect';
}

//wrapper for selectHeirloom, to handle the protect button
function newSelectHeirloom(number, location, noScreenUpdate){
    selectHeirloom(number, location, noScreenUpdate);
    //game.global.selectedHeirloom = [number, location];
    //getSelectedHeirloom()
    
    protectHeirloom();
}

function newCarryHeirloom(){
	var heirloom = getSelectedHeirloom();
	if (game.global.heirloomsCarried.length >= game.global.maxCarriedHeirlooms) return;
	game.global.heirloomsExtra.splice(game.global.selectedHeirloom[0], 1);
	game.global.heirloomsCarried.push(heirloom);
	//populateHeirloomWindow();
}

function newStopCarryHeirloom(){
	var heirloom = getSelectedHeirloom();
	game.global.heirloomsCarried.splice(game.global.selectedHeirloom[0], 1);
	game.global.heirloomsExtra.push(heirloom);
	//populateHeirloomWindow();
}

function equipMainShield(){
    if(!getPageSetting('HeirloomSwapping') || !getPageSetting('AutoHeirlooms')) {
        highDamageHeirloom = true;
        return false;
    }
    if(game.global.ShieldEquipped.name == highShieldName){
        highDamageHeirloom = true;
        return true;
    }
    if(isValidHighShield(game.global.ShieldEquipped, true)){
        highDamageHeirloom = true;
        return true;
    }
    if(heirloomsShown) //dont do anything while heirlooms window is open. under rate circumstances bad things could happen if both user and AT are handling heirlooms at the same time
        return false;
    var loom = findMainShield();
    if (loom == null) return false;
    
    newSelectHeirloom(game.global.heirloomsCarried.indexOf(loom), "heirloomsCarried", true); //noScreenUpdate skips UI code for faster execution
    equipHeirloom(true); //noScreenUpdate skips UI code for faster execution
    highCritChance      = getPlayerCritChance();
    highCritDamage      = getPlayerCritDamageMult();
    highATK             = calcHeirloomBonus("Shield", "trimpAttack", 1);
    highPB              = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
    highDamageHeirloom  = true;
    updateAllBattleNumbers(true);
    return true;
}
equipMainShield();

function equipLowDmgShield(){
    if(!getPageSetting('HeirloomSwapping') || !getPageSetting('AutoHeirlooms')) {
        highDamageHeirloom = true;
        return false;
    }
    if(game.global.ShieldEquipped.name == lowShieldName){
        highDamageHeirloom = false;
        return true;
    }
    if(isValidLowShield(game.global.ShieldEquipped, true)){
        highDamageHeirloom = false;
        lowPB = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
        return true;
    }
    if(heirloomsShown) //dont do anything while heirlooms window is open. under rate circumstances bad things could happen if both user and AT are handling heirlooms at the same time
        return false;
    var loom = findLowDmgShield();
    if (loom == null) return false;
    
    newSelectHeirloom(game.global.heirloomsCarried.indexOf(loom), "heirloomsCarried", true);
    equipHeirloom(true);
    lowCritChance       = getPlayerCritChance();
    lowCritDamage       = getPlayerCritDamageMult();
    lowATK              = calcHeirloomBonus("Shield", "trimpAttack", 1);
    lowPB               = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
    highDamageHeirloom  = false;
    updateAllBattleNumbers(true);
    return true;
}

function equipSelectedShield(good){
    if(good == undefined)
        debug("error: equipSelectedShield good is undefined!");
    if(highDamageHeirloom == undefined)
        debug("error: equipSelectedShield highDamageHeirloom undefined!");
    if(good)
        equipMainShield();
    else
        equipLowDmgShield();
}

function findMainShield(){
    for (loom of game.global.heirloomsCarried){
        if(loom.name == highShieldName)
            return loom;
    }
    for (loom of game.global.heirloomsCarried){
        if(isValidHighShield(loom, false)){ //find a shield that's 5/5 (ignoring empty slots)
            loom.name = highShieldName;
            return loom;
        }
    }
    for (loom of game.global.heirloomsCarried){
        if(isValidHighShield(loom, true)){ //find a shield that could be 5/5 (accept empty slots)
            loom.name = highShieldName;
            return loom;
        }
    }
    return null;
}    

//looks for a shield with just PB and void maps and zero damage mods or breed speed on it
function findLowDmgShield(){
    for (loom of game.global.heirloomsCarried){
        if(loom.name == lowShieldName)
            return loom;
    }
    for (loom of game.global.heirloomsCarried){
        if(isValidLowShield(loom, false)){ //find a shield that's 2/5 (ignoring empty slots)
            loom.name = lowShieldName;
            return loom;
        }
    }
    for (loom of game.global.heirloomsCarried){
        if(isValidLowShield(loom, true)){ //find a shield that could be 2/5 (accept empty slots)
            loom.name = lowShieldName;
            return loom;
        }
    }
    return null;
}

function isValidLowShield(loom, acceptEmpty){
    if(loom.type != "Shield")
        return false;
    var matchCounter = 0;
    for (mod of loom.mods){
        switch (mod[0]) {
            case "voidMaps":
                matchCounter++;
                break;
            case "plaguebringer":
                matchCounter++;
                break;
            case "critChance":
                matchCounter+=100;
                break;
            case "critDamage":
                matchCounter+=100;
                break;
            case "trimpAttack":
                matchCounter+=100;
                break;
            //case "breedSpeed":
            //    matchCounter+=100;
            //    break;
            case "empty":
                if(acceptEmpty)
                    matchCounter++;
                break;
        }
    }
    return (matchCounter === 2);
}

function isValidHighShield(loom, acceptEmpty){
    if(loom.type != "Shield")
        return false;
    var matchCounter = 0;
    for (mod of loom.mods){
        switch (mod[0]) {
            case "critChance":
                matchCounter++;
                break;
            case "critDamage":
                matchCounter++;
                break;
            case "plaguebringer":
                matchCounter++;
                break;
            case "trimpAttack":
                matchCounter++;
                break;
            case "voidMaps":
                matchCounter++;
                break;
            case "empty":
                if(acceptEmpty)
                    matchCounter++;
                break;
        }
    }
    return (matchCounter === 5);
}

function isValidPushShield(loom, acceptEmpty){
    if(loom.type != "Shield")
        return false;
    var matchCounter = 0;
    for (mod of loom.mods){
        switch (mod[0]) {
            case "critChance":
                matchCounter++;
                break;
            case "critDamage":
                matchCounter++;
                break;
            case "plaguebringer":
                matchCounter++;
                break;
            case "trimpAttack":
                matchCounter++;
                break;
            case "trimpHealth":
                matchCounter++;
                break;
            case "empty":
                if(acceptEmpty)
                    matchCounter++;
                break;
        }
    }
    return (matchCounter === 5);
}

function isValidMetalStaff(loom, acceptEmpty){
    if(loom.type != "Staff")
        return false;
    var matchCounter = 0;
    for (mod of loom.mods){
        switch (mod[0]) {
            case "FluffyExp":
                matchCounter++;
                break;
            case "ExplorerSpeed":
                matchCounter++;
                break;
            case "fragmentsDrop":
                matchCounter++;
                break;
            case "metalDrop":
                matchCounter++;
                break;
            case "MinerSpeed":
                matchCounter++;
                break;
            case "empty":
                if(acceptEmpty)
                    matchCounter++;
                break;
        }
    }
    return (matchCounter === 5);
}

function isValidWoodStaff(loom, acceptEmpty){
    if(loom.type != "Staff")
        return false;
    var matchCounter = 0;
    for (mod of loom.mods){
        switch (mod[0]) {
            case "FluffyExp":
                matchCounter++;
                break;
            case "ExplorerSpeed":
                matchCounter++;
                break;
            case "fragmentsDrop":
                matchCounter++;
                break;
            case "LumberjackSpeed":
                matchCounter++;
                break;
            case "MinerSpeed":
                matchCounter++;
                break;
            case "empty":
                if(acceptEmpty)
                    matchCounter++;
                break;
        }
    }
    return (matchCounter === 5);
}

//replacement function that inserts a new onclick action into the heirloom icons so it can populate the proper Protect icon. (yes this is the best way to do it.)
function generateHeirloomIcon(heirloom, location, number){
    if (typeof heirloom.name === 'undefined') return "<span class='icomoon icon-sad3'></span>";
    var icon = (heirloom.type == "Shield") ? 'icomoon icon-shield3' : 'glyphicon glyphicon-grain';
    var html = '<span class="heirloomThing heirloomRare' + heirloom.rarity;
    if (location == "Equipped") html += ' equipped';
    var locText = "";
    if (location == "Equipped") locText += '-1,\'' + heirloom.type + 'Equipped\'';
    else locText += number + ', \'heirlooms' + location + '\'';
    html += '" onmouseover="tooltip(\'Heirloom\', null, event, null, ' + locText + ')" onmouseout="tooltip(\'hide\')" onclick="newSelectHeirloom(';
    html += locText + ', this)"> <span class="' + icon + '"></span></span>';
    return html;
}

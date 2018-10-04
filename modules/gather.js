MODULES["gather"] = {};
//These can be changed (in the console) if you know what you're doing:

//OLD: "Auto Gather/Build"
function manualLabor() {
    //else if (!game.global.trapBuildToggled && (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1')){
    //    setGather('buildings');
    //}
    //var hasTurkimp = game.talents.turkimp4.purchased || game.global.turkimpTimer > 0;
    
    var desired = 'metal';
    if (!game.talents.foreman.purchased && (game.global.buildingsQueue.length ? (game.global.buildingsQueue.length > 1 || game.global.autoCraftModifier == 0 || (getPlayerModifier() > 1000 && game.global.buildingsQueue[0] != 'Trap.1')) : false))
        desired = 'buildings';
    
    //newbie code
    else if (game.global.world <=3 && game.global.totalHeliumEarned<=5000)
        desired = 'food';
    //if we have some upgrades sitting around which we don't have enough science for, gather science
    else if ((game.resources.science.owned < scienceNeeded || game.resources.science.owned < 100) && document.getElementById('scienceCollectBtn').style.display == 'block')
        desired = 'science';
    else
        desired = 'metal';
    
    if(game.global.playerGathering != desired)
        setGather(desired);
}

//NEW: #2 "Auto Gather/Build"
function manualLabor2() {
    if (getPageSetting('ManualGather2')==0) return;
    //vars
    var breedingTrimps = game.resources.trimps.owned - game.resources.trimps.employed;
    var lowOnTraps = game.buildings.Trap.owned < 100;
    var notFullPop = game.resources.trimps.owned < trimpsRealMax;
    var targetBreed = getPageSetting('GeneticistTimer');
    var trapperTrapUntilFull = game.global.challengeActive == "Trapper" && notFullPop;
    var watchJumpstartTraps  = game.global.challengeActive == "Watch"  && notFullPop;
    var hasTurkimp = game.talents.turkimp4.purchased || game.global.turkimpTimer > 0;

    //FRESH GAME LOWLEVEL NOHELIUM CODE.
    if (game.global.world <=3 && game.global.totalHeliumEarned<=5000) {
        if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)){
            if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned)) {
                setGather('food');
                return;
            }
            else {
                setGather('wood');
                return;
            }
        }
    }

    //Buildings:
    var manualBuildSpeedAdvantage = getPlayerModifier() / game.global.autoCraftModifier;
        //pre-requisites for all: have something in the build queue, and playerCraftmod does actually speed it up.
    if ((game.global.buildingsQueue.length && manualBuildSpeedAdvantage > 1) && //AND:
    //if we have 2 or more buildings in queue, and playerCraftmod is high enough (>3x autoCraftmod) to speed it up.
    ((game.global.buildingsQueue.length >= 2 && manualBuildSpeedAdvantage > 3) ||
    //Prioritize Storage buildings when they hit the front of the queue (in case they are the only object in the queue).
    (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1'))){
        setGather('buildings');//buildBuildings = true;
        return;
    }
    //Sciencey:
    //if we have some upgrades sitting around which we don't have enough science for, gather science
    if (document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
        //if we have less than (100) science or less than a minute of science
        if (game.resources.science.owned < 100 ||
           (game.resources.science.owned < getPsString('science', true) * 60 && game.global.turkimpTimer < 1))
            if (getPageSetting('ManualGather2') != 3) {
                setGather('science');
                return;
            }
        if (game.resources.science.owned < scienceNeeded) {
            //if manual is less than science production and turkimp, metal. (or science is set as disallowed)
            if ((getPlayerModifier() < getPerSecBeforeManual('Scientist') && hasTurkimp) || getPageSetting('ManualGather2') == 3)
                setGather('metal');
            else if (getPageSetting('ManualGather2') != 3) {
                setGather('science');
                return;
            }
        }
    }

    //If we got here, without exiting, gather Normal Resources:
    var manualResourceList = {
        'food': 'Farmer',
        'wood': 'Lumberjack',
        'metal': 'Miner',
    };
    var lowestResource = 'food';
    var lowestResourceRate = -1;
    var haveWorkers = true;
    for (var resource in manualResourceList) {
        var job = manualResourceList[resource];
        var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
        // debug('Current rate for ' + resource + ' is ' + currentRate + ' is hidden? ' + (document.getElementById(resource).style.visibility == 'hidden'));
        if (document.getElementById(resource).style.visibility != 'hidden') {
            //find the lowest resource rate
            if (currentRate === 0) {
                currentRate = game.resources[resource].owned;
                // debug('Current rate for ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                if ((haveWorkers) || (currentRate < lowestResourceRate)) {
                    // debug('New Lowest1 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
                    haveWorkers = false;
                    lowestResource = resource;
                    lowestResourceRate = currentRate;
                }
            }
            if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
                // debug('New Lowest2 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                lowestResource = resource;
                lowestResourceRate = currentRate;
            }
        }
        // debug('Current Stats ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
    }
    if (game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {
        if (hasTurkimp)
            setGather('metal');
        else
            setGather(lowestResource);//gather the lowest resource
    } else if (hasTurkimp)
        setGather('metal');
    else
        setGather(lowestResource);
    //ok
    return true;
}

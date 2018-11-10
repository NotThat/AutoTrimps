MODULES["gather"] = {};
//These can be changed (in the console) if you know what you're doing:

//OLD: "Auto Gather/Build"
function manualLabor() {
    var desired = 'metal';
    
    //newbie code
    if(game.global.world <= 5 && game.global.totalHeliumEarned<=5000){
        if(game.jobs.Farmer.owned <= 10)
            desired = 'food';
        else if(game.jobs.Scientist.owned < 10 && scienceNeeded > 0)
            desired = 'science';
        else
            desired = 'metal';
    }
    
    if(game.talents.turkimp4.purchased || game.global.turkimpTimer > 0){
        var maxWorkers = Math.max(game.jobs.Farmer.owned, game.jobs.Lumberjack.owned, game.jobs.Miner.owned);
        if(maxWorkers == game.jobs.Farmer.owned) desired = 'food';
        else if(maxWorkers == game.jobs.Lumberjack.owned) desired = 'wood';
        else if(maxWorkers == game.jobs.Miner.owned) desired = 'metal';
    }
    
    if (!game.talents.foreman.purchased && game.global.buildingsQueue.length >= 1 && (game.global.autoCraftModifier == 0 || game.global.buildingsQueue[0].indexOf("Trap") == -1))
        desired = 'buildings';
    
    //if we have some upgrades sitting around which we don't have enough science for, gather science
    if ((game.resources.science.owned < scienceNeeded || game.resources.science.owned < 100) && document.getElementById('scienceCollectBtn').style.display == 'block')
        desired = 'science';
    
    if(game.global.playerGathering != desired)
        setGather(desired);
}
var tierMagmamancers = 0;

function getMaxWorkers(){
    var trimps = game.resources.trimps;
    if(game.global.challengeActive == "Trapper") //in trapper, make sure we leave enough free trimps for next army
        return Math.floor(trimps.owned - 1.001 * trimps.getCurrentSend() - trimps.employed);
    
    return Math.floor(Math.min(trimpsRealMax / 2, Math.max(0,trimps.owned - 0.2 * trimpsRealMax)));
}

function safeBuyJob(jobTitle, amount){
    if (!Number.isFinite(amount) || amount === 0 || typeof amount === 'undefined' || Number.isNaN(amount)) {
        debug("Exiting out of safeBuyJob early " + jobTitle + " " + amount);
        return false;
    }
    var old = preBuy2();
    var result;
    if (amount < 0) {
        amount = Math.abs(amount);
        game.global.firing = true;
        game.global.buyAmt = amount;
        result = true;
    } else{
        game.global.firing = false;
        game.global.buyAmt = amount;
        //if can afford, buy what we wanted,
        result = canAffordJob(jobTitle, false) && (getMaxWorkers() > 0 || (trimpsRealMax == trimpsRealMax - amount && jobTitle == "Explorer")); //fix for large number rounding errors
        if (!result) {
            game.global.buyAmt = 'Max';
            game.global.maxSplit = 1;
            //if we can't afford it, try to use 'Max' and try again.
            result = canAffordJob(jobTitle, false) && getMaxWorkers() > 0;
        }
    }
    if (result) {
        debug((game.global.firing ? 'Firing ' : 'Hiring ') + (game.global.buyAmt == 'Max' ? 'Max' : prettify(game.global.buyAmt)) + ' ' + jobTitle + (game.global.buyAmt == 1 ? '' : 's'), "jobs", "*users");
        buyJob(jobTitle, true, true);
    }
    postBuy2(old);
    return true;
}

function safeFireJob(jobTitle,amount) {
   if (!Number.isFinite(amount) || amount === 0 || typeof amount === 'undefined' || Number.isNaN(amount)) {
        debug("Exiting out of safeFireJob early " + jobTitle + " " + amount);
        return false;
    }
    //do some jiggerypokery in case jobs overflow and firing -1 worker does 0 (java integer overflow)
    var workers = game.jobs[jobTitle].owned;
    if(typeof workers === 'undefined')
        debug("oldjob is undefined"); 
    if (workers == 0 || amount == 0)
        return 0;
    
    var x = Math.min(workers, amount);
    var old = preBuy2();
    game.global.firing = true;
    game.global.buyAmt = x;
    buyJob(jobTitle, true, true);
    
    postBuy2(old);
    return x/2;
}

//Hires and Fires all workers (farmers/lumberjacks/miners/scientists/trainers/explorers)
function buyJobs(){
    var farmerRatio     = parseInt(getPageSetting('FarmerRatio'));
    var lumberjackRatio = game.jobs.Lumberjack.locked ? 0 : parseInt(getPageSetting('LumberjackRatio'));
    var minerRatio      = (game.jobs.Miner.locked || game.global.challengeActive === 'Metal') ? 0 : parseInt(getPageSetting('MinerRatio'));
    
    if(game.global.mapsActive){ //want to shift workers in cache maps
        if(currMap.bonus == "lmc") minerRatio *= 1e12;
        if(currMap.bonus == "lwc") lumberjackRatio *= 1e12;
        if(currMap.bonus == "lsc") farmerRatio *= 1e12;
    }
    
    var totalRatio = farmerRatio + lumberjackRatio + minerRatio;
    var scientistRatio = totalRatio / 15;
    if (game.jobs.Farmer.owned < 100)
        scientistRatio = totalRatio / 7;
    if(game.jobs.Scientist.locked) scientistRatio = 0;
    
    if(typeof farmerRatio === 'undefined' || typeof lumberjackRatio === 'undefined' || typeof minerRatio === 'undefined'){
        debug("error - undefined worker ratio");
        return;
    }
    
    //1) calculate how many of each worker we want
    //2) fire excess workers in each category
    //3) hire workers to hit worker goals
    
    //1) calculate how many of each worker we want
    var magmamancerGoal = game.jobs.Magmamancer.locked ? 0 : game.jobs.Magmamancer.owned + calculateMaxAfford(game.jobs['Magmamancer'], false, false, true);
    
    var maxExplorer = getPageSetting('MaxExplorers');
    var explorerCanGet = game.jobs.Explorer.owned + calculateMaxAfford(game.jobs['Explorer'], false, false, true);
    var explorerGoal    = (game.jobs.Explorer.locked || maxExplorer === 0) ? 0 : explorerCanGet;
    if(maxExplorer > 0) 
        explorerGoal = Math.min(maxExplorer, explorerCanGet);
    
    var maxTrainer     = getPageSetting('MaxTrainers');
    var trainerCanGet  = game.jobs.Trainer.owned + calculateMaxAfford(game.jobs['Trainer'], false, false, true);
    var trainerGoal    = (game.jobs.Trainer.locked  || maxTrainer === 0 ) ? 0 : trainerCanGet;
    if(maxTrainer > 0)
        trainerGoal    = Math.min(maxTrainer, trainerCanGet);

    var totalDistributableWorkers = getMaxWorkers() - trainerGoal - explorerGoal - magmamancerGoal;
    
    //normalize the 4 ratios
    var tmpRemainingMaxWorkers = totalDistributableWorkers;
    
    var scientistGoal  = Math.floor(tmpRemainingMaxWorkers * scientistRatio / (farmerRatio + lumberjackRatio + minerRatio + scientistRatio));
    if(getPageSetting('MaxScientists') >= 0) scientistGoal = Math.min(getPageSetting('MaxScientists'), scientistGoal);
    tmpRemainingMaxWorkers -= scientistGoal;
    
    var farmerGoal     = Math.floor(tmpRemainingMaxWorkers * farmerRatio / (farmerRatio + lumberjackRatio + minerRatio));
    tmpRemainingMaxWorkers -= farmerGoal;
    
    var lumberjackGoal = Math.floor(tmpRemainingMaxWorkers * lumberjackRatio / (lumberjackRatio + minerRatio));
    tmpRemainingMaxWorkers -= lumberjackGoal;
    
    var minerGoal      = Math.floor(tmpRemainingMaxWorkers);
    tmpRemainingMaxWorkers -= minerGoal;
    
    //2) fire excess workers in each category
    if(game.jobs.Scientist.owned > scientistGoal)
        safeFireJob('Scientist', game.jobs.Scientist.owned - scientistGoal);
    
    if(game.jobs.Farmer.owned > farmerGoal)
        safeFireJob('Farmer', game.jobs.Farmer.owned - farmerGoal);
    
    if(game.jobs.Lumberjack.owned > lumberjackGoal)
        safeFireJob('Lumberjack', game.jobs.Lumberjack.owned - lumberjackGoal);
    
    if(game.jobs.Miner.owned > minerGoal)
        safeFireJob('Miner', game.jobs.Miner.owned - minerGoal);
    
    //exit if we are havent bred to at least 90% breedtimer yet...
    if (game.global.challengeActive != "Trapper" && game.resources.trimps.owned < trimpsRealMax * 0.9)
        return;
    
    //3) hire workers to hit worker goals
    if(game.jobs.Farmer.owned < farmerGoal){
        safeBuyJob('Farmer', farmerGoal - game.jobs.Farmer.owned);
        if(game.jobs.Farmer.owned != farmerGoal) return; //dont do anything else until we have our farmer goal
    }
    if(game.jobs.Lumberjack.owned < lumberjackGoal)
        safeBuyJob('Lumberjack', lumberjackGoal - game.jobs.Lumberjack.owned);
    
    if(game.jobs.Miner.owned < minerGoal)
        safeBuyJob('Miner', minerGoal - game.jobs.Miner.owned);
    
    if(game.jobs.Scientist.owned < scientistGoal)
        safeBuyJob('Scientist', scientistGoal - game.jobs.Scientist.owned);
        
    //fix for large number rounding error: if maxscientist is positive number but much smaller than total population, the game will round maxscientists down to zero.
    //make sure we actually get our scientists no matter what
    var maxScientists = getPageSetting('MaxScientists')
    if(!game.jobs.Scientist.locked && maxScientists > 0 && maxScientists !== game.jobs.Scientist.owned && calculateMaxAfford(game.jobs["Scientist"], false, false, true) >= maxScientists){
        //find a job with enough workers and fire all of them
        if(game.jobs.Farmer.owned > maxScientists)          safeFireJob('Farmer', game.jobs.Farmer.owned);
        else if(game.jobs.Lumberjack.owned > maxScientists) safeFireJob('Lumberjack', game.jobs.Lumberjack.owned);
        else if(game.jobs.Miner.owned > maxScientists)      safeFireJob('Miner', game.jobs.Miner.owned);
        safeBuyJob('Scientist', scientistGoal - game.jobs.Scientist.owned);
    }
    
    //Trainers:
    if(getPageSetting('MaxTrainers') > game.jobs.Trainer.owned || getPageSetting('MaxTrainers') == -1){
        // capped to tributes percentage.
        var trainerpercent = getPageSetting('TrainerCaptoTributes');
        if (trainerpercent > 0 && !game.buildings.Tribute.locked) {
            var curtrainercost = game.jobs.Trainer.cost.food[0]*Math.pow(game.jobs.Trainer.cost.food[1], game.jobs.Trainer.owned);
            var curtributecost = getBuildingItemPrice(game.buildings.Tribute, "food", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level);
            if (curtrainercost < curtributecost * (trainerpercent/100))
                subtract = checkFireandHire('Trainer');
        }
        else // regular
            subtract = checkFireandHire('Trainer');
    }
    //Explorers:
    if (getPageSetting('MaxExplorers') > game.jobs.Explorer.owned){
        subtract = checkFireandHire('Explorer');
    }
    else if (getPageSetting('MaxExplorers') == -1){
        subtract = checkFireandHire('Explorer', calculateMaxAfford(game.jobs["Explorer"], false, false, true));
    }
    
    //Magmamancers code:
    if (game.jobs.Magmamancer.locked) return;
    var timeOnZone = Math.floor((getGameTime() - game.global.zoneStarted) / 60000);
    if (game.talents.magmamancer.purchased)
        timeOnZone += 5;
    var stacks2 = Math.floor(timeOnZone / 10);
    if (stacks2 > tierMagmamancers) {
        var old = preBuy2();
        game.global.firing = false;
        game.global.buyAmt = 'Max';
        game.global.maxSplit = 1;
        //fire workers to make room
        var firesomedudes = calculateMaxAfford(game.jobs['Magmamancer'], false, false, true);

        if (game.jobs.Farmer.owned > firesomedudes)
            safeFireJob('Farmer', firesomedudes);
        else if (game.jobs.Lumberjack.owned > firesomedudes)
            safeFireJob('Lumberjack', firesomedudes);
        else if (game.jobs.Miner.owned > firesomedudes)
            safeFireJob('Miner', firesomedudes);
        //buy the Magmamancers
        game.global.firing = false;
        game.global.buyAmt = 'Max';
        game.global.maxSplit = 1;
        buyJob('Magmamancer', true, true);
        postBuy2(old);
        debug("Bought Magmamancers.", "jobs");
        tierMagmamancers += 1;
    }
    else if (stacks2 < tierMagmamancers)
        tierMagmamancers = 0;
    
    //Some kind of Protection or error checking. not needed much?
    if ((game.resources.trimps.owned - game.resources.trimps.employed) < 2) {
        var a = (game.jobs.Farmer.owned > 2)
        if (a)
            safeFireJob('Farmer', 2);
        var b = (game.jobs.Lumberjack.owned > 2)
        if (b)
            safeFireJob('Lumberjack', 2);
        var c = (game.jobs.Miner.owned > 2)
        if (c)
            safeFireJob('Miner', 2);
        if (a || b || c)
            debug("Job Protection Triggered, Number Rounding Error: [f,l,m]= " + a + " " + b + " " + c,"other");
    }
}

function checkFireandHire(job,amount) {
    var amt = typeof amount === 'undefined' ? 1 : amount;
    var subtract = 0;
    if (canAffordJob(job, false, amt) && !game.jobs[job].locked) {
        var jobToFire = findJobWithWorker();
        if(!jobToFire) return;
        if (getMaxWorkers() < amt)
            subtract = safeFireJob(jobToFire, amt);
        safeBuyJob(job, amt);
    }
    return subtract;
}

function findJobWithWorker(){
    if(game.jobs["Farmer"].owned > 0)          return "Farmer";
    else if(game.jobs["Lumberjack"].owned > 0) return "Lumberjack";
    else if(game.jobs["Miner"].owned > 0)      return "Miner";
    else if(game.jobs["Scientist"].owned > 0)  return "Scientist";
    else return null;
}

//Buy Farmers:
//Buy/Fire Miners:
//Buy/Fire Lumberjacks:
function ratiobuy(job, jobratio, totalRatio, subtract) {
    if(!game.jobs[job].locked) {
        totalDistributableWorkers = getMaxWorkers();// + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
        var toBuy = Math.floor((jobratio / totalRatio) * totalDistributableWorkers) - game.jobs[job].owned - subtract;
        var canBuy = Math.floor(game.resources.trimps.owned - game.resources.trimps.employed);
        var amount = toBuy <= canBuy ? toBuy : canBuy;
        if (amount != 0) {
            safeBuyJob(job, amount);
            //debug("Ratio Buying Job: " + job + " " + amount + " " + jobratio, "jobs"); 
        }
        return true;
    }
    else
        return false;
}
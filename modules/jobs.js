var theScientistRatio = 15;        //ratio for scientists. (totalRatios / this)
var theScientistRatio2 = 7;       //used for lowlevel and Watch challenge
var tierMagmamancers = 0;

function getFreeWorkers(){
    return (game.global.challengeActive !== "Trapper" ? Math.ceil(trimpsRealMax / 2) : game.resources.trimps.owned - 1.001*game.resources.trimps.getCurrentSend()) - game.resources.trimps.employed;
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
        result = canAffordJob(jobTitle, false) && (getFreeWorkers() > 0 || (trimpsRealMax == trimpsRealMax - amount && jobTitle == "Explorer")); //fix for large number rounding errors
        if (!result) {
            game.global.buyAmt = 'Max';
            game.global.maxSplit = 1;
            //if we can't afford it, try to use 'Max' and try again.
            result = canAffordJob(jobTitle, false) && getFreeWorkers() > 0;
        }
    }
    if (result) {
        debug((game.global.firing ? 'Firing ' : 'Hiring ') + prettify(game.global.buyAmt) + ' ' + jobTitle + 's', "jobs", "*users");
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

function buyJobsEarlyGame(){
    if (game.resources.food.owned > 5 && getFreeWorkers()){
        if (game.jobs.Farmer.owned == game.jobs.Lumberjack.owned)
            safeBuyJob('Farmer', 1);
        else if (game.jobs.Farmer.owned > game.jobs.Lumberjack.owned && !game.jobs.Lumberjack.locked)
            safeBuyJob('Lumberjack', 1);
    }
    if (game.resources.food.owned > 20 && getFreeWorkers()){
        if (game.jobs.Farmer.owned == game.jobs.Lumberjack.owned && !game.jobs.Miner.locked)
            safeBuyJob('Miner', 1);
    }
}

//Hires and Fires all workers (farmers/lumberjacks/miners/scientists/trainers/explorers)
function buyJobs(){
    var breeding = (game.resources.trimps.owned - game.resources.trimps.employed);
    var totalDistributableWorkers = getFreeWorkers() + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
    
    var farmerRatio     = parseInt(getPageSetting('FarmerRatio'));
    var lumberjackRatio = game.jobs.Lumberjack.locked !== 0 ? 0 : parseInt(getPageSetting('LumberjackRatio'));
    var minerRatio      = (game.jobs.Miner.locked !== 0 || game.global.challengeActive === 'Metal') ? 0 : parseInt(getPageSetting('MinerRatio'));
    
    if(game.global.mapsActive){ //want to shift workers in cache maps
        if(currMap.bonus == "lmc") minerRatio *= 1e12;
        if(currMap.bonus == "lwc") lumberjackRatio *= 1e12;
        if(currMap.bonus == "lsc") farmerRatio *= 1e12;
    }
    
    var totalRatio = farmerRatio + lumberjackRatio + minerRatio;
    var scientistRatio = totalRatio / theScientistRatio;
    if (game.jobs.Farmer.owned < 100)
        scientistRatio = totalRatio / theScientistRatio2;

    if(typeof farmerRatio === 'undefined' || typeof lumberjackRatio === 'undefined' || typeof minerRatio === 'undefined'){
        debug("error - undefined worker ratio");
        return;
    }

    //FRESH GAME LOWLEVEL NOHELIUM CODE.
    if (game.global.world == 1 || game.global.totalHeliumEarned <= 5000){
        if (game.resources.trimps.owned < trimpsRealMax * 0.9) 
            return buyJobsEarlyGame();
        else if (game.resources.trimps.owned == trimpsRealMax && game.global.soldierHealth === 0)
            fightManualAT();
    }
    
    if (game.jobs.Farmer.owned == 0 && game.jobs.Lumberjack.locked && getFreeWorkers())
        safeBuyJob('Farmer', 1);
    else if (getPageSetting('MaxScientists') != 0 && game.jobs.Scientist.owned < 10 && !game.jobs.Scientist.locked && scienceNeeded >= 60 && getFreeWorkers() && game.jobs.Farmer.owned >= 10)
        safeBuyJob('Scientist', 1);
    
    if(game.jobs.Scientist.owned > getPageSetting('MaxScientists'))
        safeFireJob('Scientist', game.jobs.Scientist.owned - getPageSetting('MaxScientists'));
    
    totalDistributableWorkers = getFreeWorkers() + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
 
   //exit if we are havent bred to at least 90% breedtimer yet...
    var breeding = (game.resources.trimps.owned - game.resources.trimps.employed);
    if (!(game.global.challengeActive == "Trapper") && game.resources.trimps.owned < trimpsRealMax * 0.9) {
        if (breeding > trimpsRealMax * 0.33) {
            //only hire if we have less than 300k trimps (dont spam up the late game with meaningless 1's)
            if (getFreeWorkers() && trimpsRealMax <= 3e5) {
                //do Something tiny, so earlygame isnt stuck on 0 (down to 33% trimps. stops getting stuck from too low.)
                safeBuyJob('Miner', 1);
                safeBuyJob('Farmer', 1);
                safeBuyJob('Lumberjack', 1);
            }
        }
        //standard quit routine if <90% breed:
        return;
    }
    //continue if we have >90% breedtimer:
    
    var subtract = 0;
    //Scientists:
    totalDistributableWorkers = getFreeWorkers() + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
    var ms = getPageSetting('MaxScientists');
    if (ms != 0 && !game.jobs.Scientist.locked) {
        var buyScientists = Math.floor((scientistRatio / totalRatio) * totalDistributableWorkers) - game.jobs.Scientist.owned - subtract;
        var sci = game.jobs.Scientist.owned;
        if((buyScientists > 0 && getFreeWorkers()) && (ms > sci || ms == -1)) {
            var n = ms - sci;
            if (ms == -1)
                n=buyScientists;
            else if (n < 0)
                n=0;
            if (buyScientists > n)
                buyScientists = n;
            safeBuyJob('Scientist', buyScientists);
        }
    }
    
    //Trainers:
    if (getPageSetting('MaxTrainers') > game.jobs.Trainer.owned || getPageSetting('MaxTrainers') == -1) {
        // capped to tributes percentage.
        var trainerpercent = getPageSetting('TrainerCaptoTributes');
        if (trainerpercent > 0 && !game.buildings.Tribute.locked) {
            var curtrainercost = game.jobs.Trainer.cost.food[0]*Math.pow(game.jobs.Trainer.cost.food[1], game.jobs.Trainer.owned);
            var curtributecost = getBuildingItemPrice(game.buildings.Tribute, "food", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level);
            if (curtrainercost < curtributecost * (trainerpercent/100))
                subtract = checkFireandHire('Trainer');
        }
        // regular
        else
            subtract = checkFireandHire('Trainer');
    }
    //Explorers:
    if (getPageSetting('MaxExplorers') > game.jobs.Explorer.owned){
        subtract = checkFireandHire('Explorer');
    }
    else if (getPageSetting('MaxExplorers') == -1){
        subtract = checkFireandHire('Explorer', calculateMaxAfford(game.jobs["Explorer"], false, false, true));
    }
 
    ratiobuy('Farmer', farmerRatio, totalRatio, subtract);
    if (!game.jobs.Miner.locked && !ratiobuy('Miner', minerRatio, totalRatio, subtract) && game.global.turkimpTimer === 0)
        safeBuyJob('Miner', game.jobs.Miner.owned * -1);
    if (!game.jobs.Lumberjack.locked && !ratiobuy('Lumberjack', lumberjackRatio, totalRatio, subtract))
        safeBuyJob('Lumberjack', game.jobs.Lumberjack.owned * -1);
    
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
        if (getFreeWorkers() < amt)
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
        totalDistributableWorkers = getFreeWorkers() + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
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
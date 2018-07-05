//MODULES["stance"] = {};
var currentBadGuyNum;
var lastZoneGridded = -1;
var coordBuyThreshold;
var allowBuyingCoords = true;
var buyWeaponsModeAS3 = (getPageSetting('DelayWeaponsForWind') ? 0 : 3); //0: buy nothing, only prestige if it lowers our damage. 1: prestige till 1 before max prestige and level 2: prestige only 3: buy everything
var maxCoords = -1;
var trimpicide = false;
var minAnticipationStacks;
var worldArray = [];
var lastHealthy = 0;
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
var avgWorthZone = 0;
var highestAvgWorthZone = -1;
var maxStacksBaseDamageD;
var maxDesiredRatio;

function calcBaseDamageinS() {
    //baseDamage
    baseDamage = calculateDamageAT();
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

//goes to battlecalc.js which came from Trimps "updates.js" line 1103
function calcBaseDamageinX2() {
    //baseDamage
    //baseDamage = getBattleStats("attack", false, true);
    //baseDamage = calcOurDmg(game.global.soldierCurrentAttack,true,true,true);
    //baseBlock
    baseBlock = getBattleStats("block");
    //baseHealth
    baseHealth = getBattleStats("health");
    //stances are not needed, if you do need it, call the function with (,true)
}
//Autostance - function originally created by Belaith (in 1971)
//Automatically swap formations (stances) to avoid dying
function autoStance() {
    //get back to a baseline of no stance (X)
    calcBaseDamageinS();
    //no need to continue
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.
    if (!getPageSetting('AutoStance')) return;
    if (!game.upgrades.Formations.done) return;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth/2;
    var xHealth = baseHealth;
    var bHealth = baseHealth/2;
    var enemy;
    var corrupt = game.global.world >= mutations.Corruption.start();
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") && game.global.challengeActive != "Coordinate"));
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for world Corruption
        if (enemy && enemy.mutation == "Corruption"){
            enemyHealth *= getCorruptScale("health");
            enemyDamage *= getCorruptScale("attack");
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined'){
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var pierceMod = getPierceAmt();
        var dDamage = enemyDamage - baseBlock / 2 > enemyDamage * pierceMod ? enemyDamage - baseBlock / 2 : enemyDamage * pierceMod;
        var xDamage = enemyDamage - baseBlock > enemyDamage * pierceMod ? enemyDamage - baseBlock : enemyDamage * pierceMod;
        var bDamage = enemyDamage - baseBlock * 4 > enemyDamage * pierceMod ? enemyDamage - baseBlock * 4 : enemyDamage * pierceMod;

    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") || game.global.voidBuff == "doubleAttack") && game.global.challengeActive != "Coordinate");
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for voidmap Corruption
        if (getCurrentMapObject().location == "Void" && corrupt) {
            enemyDamage *= getCorruptScale("attack");
            enemyHealth *= getCorruptScale("health");
            //halve if magma is not active (like it was before)
            if (!mutations.Magma.active()) {
                enemyDamage /= 2;
                enemyHealth /= 2;
            }
        }
        //check for z230 magma map corruption
        else if (getCurrentMapObject().location != "Void" && mutations.Magma.active()) {
            enemyHealth *= (getCorruptScale("health") / 2);
            enemyDamage *= (getCorruptScale("attack") / 2);
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined'){
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var dDamage = enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : 0;
        var dVoidCritDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        var xDamage = enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : 0;
        var xVoidCritDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
        var bDamage = enemyDamage - baseBlock * 4 > 0 ? enemyDamage - baseBlock * 4 : 0;
    }

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');

    if (drainChallenge) {
        dDamage += dHealth/20;
        xDamage += xHealth/20;
        bDamage += bHealth/20;
        var drainChallengeOK = dHealth - missingHealth > dHealth/20;
    } else if (dailyPlague) {
        drainChallenge = true;
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
        var drainChallengeOK = dHealth - missingHealth > dHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
        var drainChallengeOK = dHealth - missingHealth > dHealth * hplost;
    } else if (game.global.challengeActive == "Crushed") {
        if(dHealth > baseBlock /2)
            dDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        if(xHealth > baseBlock)
            xDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
    }
    //^dont attach^.
    if (game.global.voidBuff == "bleed" || (enemy && enemy.corrupted == 'corruptBleed')) {
        dDamage += game.global.soldierHealth * 0.2;
        xDamage += game.global.soldierHealth * 0.2;
        bDamage += game.global.soldierHealth * 0.2;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    //double attack is OK if the buff isn't double attack, or we will survive a double attack. see main.js @ 7197-7217 https://puu.sh/ssVNP/95f699a879.png (cant prevent the 2nd hit)
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy && enemy.corrupted == 'corruptDbl');
    // quality bugfix by uni @ 2.1.5.4u5
    var doubleAttackOK = true; // !isDoubleAttack || ((newSquadRdy && dHealth > dDamage * 2) || dHealth - missingHealth > dDamage * 2);
    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var leadDamage = game.challenges.Lead.stacks * 0.0003;
    var leadAttackOK = game.global.challengeActive != 'Lead' || enemyHealth <= baseDamage || ((newSquadRdy && dHealth > dDamage + (dHealth * leadDamage)) || (dHealth - missingHealth > dDamage + (dHealth * leadDamage)));
    //added voidcrit.
    //voidcrit is OK if the buff isn't crit-buff, or we will survive a crit, or we are going to one-shot them (so they won't be able to crit)
    const ignoreCrits = getPageSetting('IgnoreCrits'); // or if ignored
    var isCritVoidMap = ignoreCrits == 2 ? false : (!ignoreCrits && game.global.voidBuff == 'getCrit') || (enemy && enemy.corrupted == 'corruptCrit');
    var voidCritinDok = !isCritVoidMap || (!enemyFast ? enemyHealth <= baseDamage : false) || (newSquadRdy && dHealth > dVoidCritDamage) || (dHealth - missingHealth > dVoidCritDamage);
    var voidCritinXok = !isCritVoidMap || (!enemyFast ? enemyHealth <= baseDamage : false) || (newSquadRdy && xHealth > xVoidCritDamage) || (xHealth - missingHealth > xVoidCritDamage);

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        if (!enemyFast && game.upgrades.Dominance.done && enemyHealth <= baseDamage && (newSquadRdy || (dHealth - missingHealth > 0 && !drainChallenge) || (drainChallenge && drainChallengeOK))) {
            setFormation(2);
            //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        } else if (game.upgrades.Dominance.done && ((newSquadRdy && dHealth > dDamage) || dHealth - missingHealth > dDamage) && doubleAttackOK && leadAttackOK && voidCritinDok ) {
            setFormation(2);
            //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritVoidMap && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xVoidCritDamage < game.global.soldierHealthMax/2){
                if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                    setFormation(3);
            }
                //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
                // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xVoidCritDamage == 0 || ((game.global.formation == 2 || game.global.formation == 4) && voidCritinXok)){
                setFormation("0");
            }
                //otherwise, stuff:
            else {
                if (game.global.formation == "0"){
                    if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                        setFormation(3);
                    else
                        setFormation(1);
                }
                else if (game.upgrades.Barrier.done && (game.global.formation == 2 || game.global.formation == 4))
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && ((newSquadRdy && xHealth > xDamage) || xHealth - missingHealth > xDamage)) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && ((newSquadRdy && bHealth > bDamage) || bHealth - missingHealth > bDamage)) {
            setFormation(3);    //does this ever run?
        } else if (game.upgrades.Formations.done) {
            setFormation(1);
        } else
            setFormation("0");
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp :P
}

function autoStance2() {
    //get back to a baseline of no stance (X)
    calcBaseDamageinS();
    //no need to continue
    if (game.global.gridArray.length === 0) return true;
    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.
    if (!getPageSetting('AutoStance')) return true;
    if (!game.upgrades.Formations.done) return true;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth/2;
    var xHealth = baseHealth;
    var bHealth = baseHealth/2;
    //COMMON:
    var corrupt = game.global.world >= mutations.Corruption.start();
    var enemy = getCurrentEnemy();
    if (typeof enemy === 'undefined') return true;
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy,null,true,true);
    //crits
    var critMulti = 1;
    const ignoreCrits = getPageSetting('IgnoreCrits');
    var isCrushed = false;
    var isCritVoidMap = false;
    var isCritDaily = false;
    if (ignoreCrits == 2) { // Ignore all!
        (isCrushed = (game.global.challengeActive == "Crushed") && game.global.soldierHealth > game.global.soldierCurrentBlock)
            && (critMulti *= 5);
        (isCritVoidMap = (!ignoreCrits && game.global.voidBuff == 'getCrit') || (enemy.corrupted == 'corruptCrit'))
            && (critMulti *= 5);
        (isCritDaily = (game.global.challengeActive == "Daily") && (typeof game.global.dailyChallenge.crits !== 'undefined'))
            && (critMulti *= dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength));
        enemyDamage *= critMulti;
    }
    //double attacks
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl');
    //fast
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;
    //
    if (enemy.corrupted == 'corruptStrong')
        enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough')
        enemyHealth *= 5;

    //calc X,D,B:
    var xDamage = (enemyDamage - baseBlock);
    var dDamage = (enemyDamage - baseBlock / 2);
    var bDamage = (enemyDamage - baseBlock * 4);
    var dDamageNoCrit = (enemyDamage/critMulti - baseBlock/2);
    var xDamageNoCrit = (enemyDamage/critMulti - baseBlock);
    var pierce = 0;
    if (game.global.brokenPlanet && !game.global.mapsActive) {
        pierce = getPierceAmt();
        var atkPierce = pierce * enemyDamage;
        var atkPierceNoCrit = pierce * (enemyDamage/critMulti);
        if (xDamage < atkPierce) xDamage = atkPierce;
        if (dDamage < atkPierce) dDamage = atkPierce;
        if (bDamage < atkPierce) bDamage = atkPierce;
        if (dDamageNoCrit < atkPierceNoCrit) dDamageNoCrit = atkPierceNoCrit;
        if (xDamageNoCrit < atkPierceNoCrit) xDamageNoCrit = atkPierceNoCrit;
    }
    if (xDamage < 0) xDamage = 0;
    if (dDamage < 0) dDamage = 0;
    if (bDamage < 0) bDamage = 0;
    if (dDamageNoCrit < 0) dDamageNoCrit = 0;
    if (xDamageNoCrit < 0) xDamageNoCrit = 0;
    var isdba = isDoubleAttack ? 2 : 1;
    xDamage *= isdba;
    dDamage *= isdba;
    bDamage *= isdba;
    dDamageNoCrit *= isdba;
    xDamageNoCrit *= isdba;

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var leadChallenge = game.global.challengeActive == 'Lead';
    if (drainChallenge) {
        var hplost = 0.20;  //equals 20% of TOTAL health
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (dailyPlague) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (leadChallenge) {
        var leadDamage = game.challenges.Lead.stacks * 0.0003;  //0.03% of their health per enemy stack.
        var added = game.global.soldierHealthMax * leadDamage;
        dDamage += added;
        xDamage += added;
        bDamage += added;
    }
    //^dont attach^.
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed')) {
        //20% of CURRENT health;
        var added = game.global.soldierHealth * 0.20;
        dDamage += added;
        xDamage += added;
        bDamage += added;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    baseDamage *= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //consider mapbonus

    //handle Daily Challenge explosion/suicide
    var xExplosionOK = true;
    var dExplosionOK = true;
    if (typeof game.global.dailyChallenge['explosive'] !== 'undefined') {
        var explosionDmg = 0;
        var explosiveDamage = 1 + game.global.dailyChallenge['explosive'].strength;

        var playerCritMult = getPlayerCritChance() ? getPlayerCritDamageMult() : 1;
        var playerDCritDmg = (baseDamage*4) * playerCritMult;
        var playerXCritDmg = (baseDamage) * playerCritMult;

        // I don't know if I have to use x or d damage or just the base damage multiplier for this calculation.
        explosionDmg = calcBadGuyDmg(enemy,null,true,true) * explosiveDamage;
        xExplosionOK = ((xHealth - missingHealth > explosionDmg) || (enemyHealth > playerXCritDmg));
        dExplosionOK = (newSquadRdy || (dHealth - missingHealth > explosionDmg) || (enemyHealth > playerDCritDmg));
    }

    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var oneshotFast = enemyFast ? enemyHealth <= baseDamage : false;
    var surviveD = ((newSquadRdy && dHealth > dDamage) || (dHealth - missingHealth > dDamage));
    var surviveX = ((newSquadRdy && xHealth > xDamage) || (xHealth - missingHealth > xDamage));
    var surviveB = ((newSquadRdy && bHealth > bDamage) || (bHealth - missingHealth > bDamage));
    var leadAttackOK = !leadChallenge || oneshotFast || surviveD;
    var drainAttackOK = !drainChallenge || oneshotFast || surviveD;
    var isCritThing = isCritVoidMap || isCritDaily || isCrushed;
    var voidCritinDok = !isCritThing || oneshotFast || surviveD;
    var voidCritinXok = !isCritThing || oneshotFast || surviveX;

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        if (game.upgrades.Dominance.done && surviveD && leadAttackOK && drainAttackOK && voidCritinDok && dExplosionOK) {
            setFormation(2);
        //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritThing && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xDamage < bHealth){
                if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
                    setFormation(3);
            }
            //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
            // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xDamage == 0 || ((game.global.formation == 2 || game.global.formation == 4) && voidCritinXok)){
                setFormation("0");
            }
            //otherwise, stuff: (Try for B again)
            else {
                if (game.global.formation == "0"){
                    if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
                        setFormation(3);
                    else
                        setFormation(1);
                }
                else if (game.upgrades.Barrier.done && (game.global.formation == 2 || game.global.formation == 4))
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && !xExplosionOK) {
            // Set to H if killing badguys will cause your trimps to die
            setFormation(1);
        } else if (game.upgrades.Formations.done && surviveX) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && surviveB) {
            if (game.global.formation != 3) {
                setFormation(3);    //does this ever run?
                //TODO Check this with analytics instead.
                debug("AutoStance B/3","other");
            }
        } else {
            if (game.global.formation != 1)
                setFormation(1);    //the last thing that runs
        }
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp
    baseDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //unconsider mapbonus
    return true;
}

function autoStanceCheck(enemyCrit) {
    if (game.global.gridArray.length === 0) return [true,true];
    //baseDamage              //in stance attack,              //min, //disable stances, //enable flucts
    var ourDamage = calcOurDmg(game.global.soldierCurrentAttack,true,true,true);
    //baseBlock
    var ourBlock = game.global.soldierCurrentBlock;
    //baseHealth
    var ourHealth = game.global.soldierHealthMax;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;

    //COMMON:
    var corrupt = game.global.world >= mutations.Corruption.start();
    var enemy = getCurrentEnemy();
    if (typeof enemy === 'undefined') return [true,true];
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy,null,true,true,true);   //(enemy,attack,daily,maxormin,disableFlucts)
    //crits
    var critMulti = 1;
    const ignoreCrits = getPageSetting('IgnoreCrits');
    var isCrushed = false;
    var isCritVoidMap = false;
    var isCritDaily = false;
    if (ignoreCrits == 2) { // Ignored all!
        (isCrushed = game.global.challengeActive == "Crushed" && game.global.soldierHealth > game.global.soldierCurrentBlock)
            && enemyCrit && (critMulti *= 5);
        (isCritVoidMap = game.global.voidBuff == 'getCrit' || enemy.corrupted == 'corruptCrit')
            && enemyCrit && (critMulti *= 5);
        (isCritDaily = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.crits !== 'undefined')
            && enemyCrit && (critMulti *= dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength));
        if (enemyCrit)
            enemyDamage *= critMulti;
    }
    //double attacks
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl');
    //fast
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;
    if (enemy.corrupted == 'corruptStrong')
        enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough')
        enemyHealth *= 5;
    //calc X,D,B:
    enemyDamage -= ourBlock;
    var pierce = 0;
    if (game.global.brokenPlanet && !game.global.mapsActive) {
        pierce = getPierceAmt();
        var atkPierce = pierce * enemyDamage;
        if (enemyDamage < atkPierce) enemyDamage = atkPierce;
    }
    if (enemyDamage < 0) enemyDamage = 0;
    var isdba = isDoubleAttack ? 2 : 1;
    enemyDamage *= isdba;
    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var leadChallenge = game.global.challengeActive == 'Lead';
    if (drainChallenge) {
        var hplost = 0.20;  //equals 20% of TOTAL health
        enemyDamage += ourHealth * hplost;
    } else if (dailyPlague) {
        drainChallenge = true;
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        //x% of TOTAL health;
        enemyDamage += ourHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        //x% of TOTAL health;
        enemyDamage += ourHealth * hplost;
    } else if (leadChallenge) {
        var leadDamage = game.challenges.Lead.stacks * 0.0003;
        enemyDamage += game.global.soldierHealthMax * leadDamage;
    }
    //^dont attach^.
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed')) {
        enemyDamage += game.global.soldierHealth * 0.2;
    }
    ourDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    ourDamage *= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //consider mapbonus

    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var oneshotFast = enemyFast ? enemyHealth <= ourDamage : false;
    var survive = ((newSquadRdy && ourHealth > enemyDamage) || (ourHealth - missingHealth > enemyDamage));
    var leadAttackOK = !leadChallenge || oneshotFast || survive;
    var drainAttackOK = !drainChallenge || oneshotFast || survive;
    var isCritThing = isCritVoidMap || isCritDaily || isCrushed;
    var voidCritok = !isCritThing || oneshotFast || survive;

    if (!game.global.preMapsActive) {
        var enoughDamage2 = enemyHealth <= ourDamage;
        var enoughHealth2 = survive && leadAttackOK && drainAttackOK && voidCritok;
        // } else {
            // var ourCritMult = getPlayerCritChance() ? getPlayerCritDamageMult() : 1;
            // var ourDmg = (ourDamage)*ourCritMult;
            // var enoughDamage2 = enemyHealth <= ourDmg;
            // var surviveOneShot = enemyFast ? ourHealth > xDamageNoCrit : enemyHealth < ourDmg;
            // var enoughHealth2 = surviveOneShot && leadAttackOK && drainAttackOK && voidCritok;
        // }
        ourDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp
        ourDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //unconsider mapbonus
        return [enoughHealth2,enoughDamage2];
    } else
        return [true,true];
}






























function autoStance3() {
    equipMainShield(); //always start calculations with the good shield
    calcBaseDamageinS(); //this finds our displayed damage in S 'baseDamage'
    
    if (isActiveSpireAT() || game.global.world == getPageSetting('VoidMaps') || BWRaidNowLogic() || PRaidingActive)
        buyWeaponsModeAS3 = 3; //buy everything
    else
        buyWeaponsModeAS3 = 0; //buy nothing
    
    if(baseDamage <= 0){
        debug("Error Stance3: " + baseDamage + " damage!");
        if(!game.global.preMapsActive){
            if (!game.global.switchToMaps){
                mapsClicked();
            }
        }
        mapsClicked();
        return; 
    }
    if (lastZoneGridded != game.global.world || lastrunworld != currentworld){ 
        buildWorldArray();
        lastZoneGridded = game.global.world;
    }
    else
        updateOmniThreshhold();
    
    if (game.global.world < 81) return;//no D stance, no wind stacks, nothing to do here
    if (game.global.gridArray.length === 0) return;
    
    if(isActiveSpireAT()){
        if(game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting) == 0)
            switchOnGA();
        setFormation(2);
        return;
    }
    
    if(game.global.mapsActive){
        setFormation(2);
        return;
    }
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var nextCell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum + 1] : game.global.gridArray[cellNum + 1];

    
    allowBuyingCoords = !getPageSetting('DelayCoordsForWind'); //dont buy coords unless we explicitly permit it. automaps() can also allow it if player runs a map for ratio.
    buyWeaponsModeAS3 = (getPageSetting('DelayWeaponsForWind') ? 0 : 3); //0: buy nothing, only prestige if it lowers our damage. 1: prestige till 1 before max prestige and level 2: prestige only 3: buy everything
        
    if(trimpicide)
        getTargetAntiStack(minAnticipationStacks, false);

    if (game.global.soldierHealth <= 0){ 
        if(game.global.breedBack <= 0 && hiddenBreedTimer > wantedAnticipation)
            fightManual();
        else
            return;
    }
    
    //calculate how much dmg we need to fully overkill on next attack
    var overkillCells = 1+Fluffy.isRewardActive("overkiller"); //0 / 1 / 2
    var overkillPercent = game.portal.Overkill.level * 0.005;
    var requiredDmgToOK = 0;
    for(var i = overkillCells; i>=1; i--){
        if(cellNum + i >= 100)
            continue;
        requiredDmgToOK += worldArray[cellNum + i].maxHealth;
        requiredDmgToOK = requiredDmgToOK / overkillPercent;
    }
    requiredDmgToOK += game.global.gridArray[cellNum].health;
    if(poisonZone())
        requiredDmgToOK -= Math.min(game.empowerments.Poison.currentDebuffPower, game.global.gridArray[cellNum].health);
    

    if(!windZone()){ 
        if(game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting) == 0)
            switchOnGA(); //in rare cases we leave GA disabled, so make sure to turn it back on
        
        buyWeaponsModeAS3 = 1; //1: prestige till 1 before max prestige and level weapons as much as possible
        setFormation(2);
        
        if(requiredDmgToOK / maxStacksBaseDamageD > 0.8 && currentBadGuyNum != cellNum){ //get coords
            currentBadGuyNum = cellNum;
            allowBuyingCoords = true;
            maxCoords = game.upgrades.Coordination.done + 1;
            //if(game.upgrades.Coordination.done < maxCoords)
                debug("Zone " + game.global.world + "."+cellNum+" Buying Coord");
        }
        
        if(requiredDmgToOK / maxStacksBaseDamageD > 1 && game.upgrades.Coordination.done == game.upgrades.Coordination.allowed)
            buyWeaponsModeAS3 = 3; //buy weapon prestiges+levels
        
        if (isActiveSpireAT() || doVoids || BWRaidNowLogic() || PRaidingActive){
            buyWeaponsModeAS3 = 3;
        }
        
        return;
    }
    
    var maxDesiredStacks = ((game.global.challengeActive == "Daily") ? 198 : 192); //overshooting is really bad, so take a safety margin on non dailies. note that with plaguebringer the script will overshoot this by quite a bit on occasions so a big safety margin is recommended
    if((cell.corrupted !== undefined && cell.corrupted.includes("healthy")) || cellNum == 99)
        maxDesiredStacks = 198; //still want max stacks for healthy/end cells
    
    var stacks = game.empowerments.Wind.currentDebuffPower;
    var missingStacks = Math.max(maxDesiredStacks-stacks, -5);
    
    var enemyHealth = cell.health;  //current health
    var enemyMaxHealth = cell.maxHealth; //in future can do some prediction with plaguebringer and expected minimum enemy max health of world zone
    
    var ourAvgDmgS = baseDamage;
    var ourAvgDmgX = ourAvgDmgS * 2;
    var ourAvgDmgD = ourAvgDmgS * 8;
    
    var expectedNumHitsS = enemyHealth / ourAvgDmgS;
    var expectedNumHitsX = enemyHealth / ourAvgDmgX;
    var expectedNumHitsD = enemyHealth / ourAvgDmgD;
    
    var maxS = enemyMaxHealth / ourAvgDmgS;
    var maxX = enemyMaxHealth / ourAvgDmgX;
    var maxD = enemyMaxHealth / ourAvgDmgD;
    
    //dont wanna worry about last cell all the time, so keep it simple
    var nextPBDmgtmp = (cellNum == 99 || nextCell.plaguebringer === undefined ? 0 : nextCell.plaguebringer);
    var pbHitstmp = (cellNum == 99 || nextCell.plagueHits === undefined ? 0 : Math.ceil(nextCell.plagueHits));
    var corruptedtmp = (cell.corrupted === undefined ? "none" : cell.corrupted);
    
    if(cellNum < 99){
        worldArray[cellNum+1].health = Math.max(worldArray[cellNum+1].maxHealth - nextPBDmgtmp, 0.05*worldArray[cellNum+1].maxHealth); //extra damage on next cell from PB
        worldArray[cellNum+1].pbHits = pbHitstmp; //extra wind stacks on next cell from PB
        var nextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind")) + pbHitstmp, 200);
    }
    else var nextStartingStacks = "";
    
    //var enemy = {finalWorth : "", name : "", mutation : "", corrupted : "", health : "", maxHealth : "", stacks : "", pbHits : "", nextPBDmg : "", baseWorth : "", geoRelativeCellWorth : "", PBWorth : ""};
    worldArray[cellNum].health = enemyHealth;
    worldArray[cellNum].stacks = stacks;
    
    //stanceStats = {efficiency : 0, attacks : 0, enemyLastHP : -1, lastCell : "", OmnisWorths : 0, lastStacks : 0, wastedStacks : 0, lastNextStartingStacks : 0, wastedPBs : 0, trimpicides : 0}; //keep track of how well we're doing
    //keep statistics
    /*if(stanceStats.enemyLastHP != worldArray[cellNum].health){ //we attacked
        stanceStats.attacks++;
        stanceStats.enemyLastHP = worldArray[cellNum].health;
        if(stanceStats.lastCell == cellNum && stanceStats.lastStacks > stacks){ //we trimpicided
            stanceStats.trimpicides++;
            stanceStats.wastedStacks += stanceStats.lastStacks - stacks;
        }
        if(stanceStats.lastCell == 98 && cellNum == 99){ //lets print stats on last cell
            debug("atks " + stanceStats.attacks + " OmnisPerAttack " + stanceStats.OmnisPerAttack.toFixed(2) + " trimpicides: "+stanceStats.trimpicides + " wastedStacks " + stanceStats.wastedStacks + " wastedPBs " + stanceStats.wastedPBs);
        }
        if(stanceStats.lastCell != "" && stanceStats.lastCell != cellNum){ //we killed an enemy
            stanceStats.OmnisWorths += worldArray[stanceStats.lastCell].baseWorth * stanceStats.lastStacks * game.empowerments.Wind.getModifier();
            stanceStats.lastCell = cellNum;
        }
        if(stanceStats.lastStacks == 200) //we had 200 stacks, means we wasted a stack
            stanceStats.wastedStacks++;
        stanceStats.lastStacks = stacks;
        if(stanceStats.lastNextStartingStacks >= 200) //we had 200 stacks on next target, means we wasted a PB stack
            stanceStats.wastedPBs++;
        stanceStats.lastNextStartingStacks = nextStartingStacks;
    }
    stanceStats.lastCell = cellNum;
    stanceStats.OmnisPerAttack = stanceStats.OmnisWorths / stanceStats.attacks; //we can measure our windstacking farm efficiency in Omnis equivalent per attack.
    */
    var chosenFormation;
    
    //var pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100: 0);
    //var projectedNextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind")) + pbHitstmp + expectedNumHitsD*pbMult, 200); //projected stacks on next enemy
    var nextStartingStacks = Math.min(1 + Math.ceil(stacks * getRetainModifier("Wind")) + pbHitstmp, 200); //current stacks on next enemy
    
    var cmp = 0; 
    //figure out what attacking the current cell is worth. 3 cases:
    if (stacks < 200) //we dont have max stacks
        cmp += worldArray[cellNum].geoRelativeCellWorth;
    if (nextStartingStacks < 195) //next cell doesnt have max stacks
        cmp += worldArray[cellNum].PBWorth;
    if(stacks < 200 && nextStartingStacks >= 195){ //current cell isnt capped but next one is
        if(cellNum < 99)
            cmp -= worldArray[cellNum+1].geoRelativeCellWorth;
    }
    if(worldArray[cellNum].corrupted == "corruptDodge") cmp *= 0.7; //dodge cells are worth less
    cmp = cmp / OmniThreshhold; //cmp is in OmniThreshhold units
    
    //cmp *= 1000; avgWorthZone *= 1000;
    //cmp *= 0.001; avgWorthZone *= 1000;
    
    //maxStacksBaseDamageD
    //highestAvgWorthZone
    //if(avgWorthZone < 0.2) //if avg zone value too low, buy all weapons so we can overkill more
    //    buyWeaponsModeAS3 = 3; //buy/get everything
    
    //maxStacksBaseDamageD
    //maxDesiredRatio
    //highestAvgWorthZone
    //requiredDmgToOK
    //debug("ratio to OK " + (requiredDmg / maxStacksBaseDamageD).toFixed(2));
    
    if(expectedNumHitsD > missingStacks+2 || cmp < 1 || maxDesiredRatio > 8000){ //we need more damage, or this cell isnt worth our time, or we do far too much damage anyway so dont even try and risk losing an extra overkill
        setFormation(2);
        chosenFormation = 2;
        
        if (requiredDmgToOK / maxStacksBaseDamageD > 1 && avgWorthZone < 0.2){ //we need more damage to OK in a poor zone
            buyWeaponsModeAS3 = 3;
            debug("Buying more dmg to OK");
            if(requiredDmgToOK / maxStacksBaseDamageD > 1.2 && currentBadGuyNum != cellNum){
                currentBadGuyNum = cellNum; //newly bought coordination doesnt take effect until next enemy, so only buy 1 coordination per enemy.
                allowBuyingCoords = true;
                maxCoords = game.upgrades.Coordination.done + 1;
                //if(game.upgrades.Coordination.done < maxCoords)
                    debug("Autostance3: allowing buying coord Wind #" + maxCoords + " on " + game.global.world + "." + cellNum);
            }
        }

        if(maxDesiredRatio < 1){ //need more damage, get it
            buyWeaponsModeAS3 = 3; //buy /get everything
        }
        
        if(maxDesiredRatio < 0.9 && currentBadGuyNum != cellNum && game.global.antiStacks >= maxAnti-1){ //need more damage, get it, but only if we're at near max stacks.
            currentBadGuyNum = cellNum; //newly bought coordination doesnt take effect until next enemy, so only buy 1 coordination per enemy.
            allowBuyingCoords = true;
            maxCoords = game.upgrades.Coordination.done + 1;
            //if(game.upgrades.Coordination.done < maxCoords)
                debug("Autostance3: allowing buying coord Wind #" + maxCoords + " on " + game.global.world + "." + cellNum);
        }
        
        //consider trimpicide for max stacks
        var before = Math.min(stacks + expectedNumHitsD, 200); //how many stacks we'll get currently
        var after = Math.min(stacks*0.75 + enemyHealth / maxStacksBaseDamageD, 200); //how many stacks we'll end up with after max stacks trimpicide
        //if(game.global.antiStacks < maxAnti-1 && game.resources.trimps.owned == game.resources.trimps.realMax() && hiddenBreedTimer > maxAnti){
        if(game.global.antiStacks < maxAnti-1 && hiddenBreedTimer > maxAnti){
            if((maxDesiredRatio > 4000 || maxDesiredRatio*(5+maxAnti)/(5+game.global.antiStacks) < 1) || (avgWorthZone < 0.7 && cellNum < 90 && cellNum > lastHealthy)) { 
                debug("Trimpiciding to get max stacks.");
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
        
        if (expectedNumHitsS < missingStacks && expectedNumHitsS > 0.1){ //we have too much damage so try to fix it, but if it's too much then dont even try (we want to lee[ main shield as much as possible)
            if(equipLowDmgShield()){
                //need to recalculate damages
                calcBaseDamageinS();
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
            
            if(chosenFormation == 4 && (worldArray[cellNum].mutation == "Corruption" || worldArray[cellNum].mutation == "Healthy" || cellNum == 99)){ //if we still need less damage, consider trimpicide to remove anticipation stacks. never trimpicide against non colored cell
                minAnticipationStacks = 1;
                var ourLowestDamage = baseDamage*(1 + 0.2 * minAnticipationStacks)/(1 + 0.2 * game.global.antiStacks);
                var before = Math.min(stacks      + expectedNumHitsS, 200); //stacks if we dont trimpicide
                var after  = Math.min(0.5*stacks + enemyHealth / ourLowestDamage + (avgWorthZone-1) * 15, 200); //stacks if we do trimpicide. the more a zone is worth the more we are willing to trimpicide if we need less damage.
                
                if(before <= after && game.global.antiStacks > minAnticipationStacks && maxDesiredRatio*(5+minAnticipationStacks)/(5+game.global.antiStacks) > 1){ //trimpiciding costs 25% stacks twice.
                    wantedAnticipation = minAnticipationStacks;
                    getTargetAntiStack(minAnticipationStacks, true);
                    return;
                }
            }
        }
    }

    if (chosenFormation == '0' && game.global.soldierHealth < 0.66 * game.global.soldierHealthMax){ //dont swap to X if it will kill/almost kill us
        chosenFormation = 4;
    }
    
    //sharp enemies
    if (worldArray[cellNum].corrupted == "healthyBleed" || worldArray[cellNum].corrupted == "corruptBleed"){
        //if(cmp < 3){ //only stack against them if they're worthwhile
            equipMainShield();
            chosenFormation = 2;
        //}
    }
    
    setFormation(chosenFormation); 
    
    var shield = (highDamageHeirloom ? "+" : "-");
    
        //maxStacksBaseDamageD
    //highestAvgWorthZone
    //requiredDmgToOK
    //(requiredDmgToOK/maxStacksBaseDamageD).toFixed(2)
    
    //debug(shield+game.global.world + "." + cellNum + " " + stacks+"W"+"("+nextStartingStacks+") "+cmp.toFixed(2)+" S/X/D " + expectedNumHitsS.toFixed(0)+"/" + expectedNumHitsX.toFixed(0)+"/" + expectedNumHitsD.toFixed(0) + " " + game.global.formation + "-" + game.global.antiStacks + " " + corruptedtmp + " " + enemyHealth.toExponential(1) + "("+nextMaxHealthtmp.toExponential(1)+")", "spam");
    debug(shield+game.global.world + "." + cellNum + " " + stacks+"W"+"("+nextStartingStacks+") "+cmp.toFixed(2)+" " + expectedNumHitsS.toFixed(0)+"/" + expectedNumHitsX.toFixed(0)+"/" + expectedNumHitsD.toFixed(0) + " " + game.global.formation + "-" + game.global.antiStacks + " x" + maxDesiredRatio.toExponential(2) +" desired " + (requiredDmgToOK/maxStacksBaseDamageD).toFixed(2) + " ToOK " + corruptedtmp, "general");
}

function getTargetAntiStack(target, firstRun){
    if(target < 1 || target > 45){
        debug("error target anti stacks out of bounds " + target);
        switchOnGA();
        trimpicide = false;
        return;
    }

    if (game.global.antiStacks <= target){
        trimpicide = false;
        switchOnGA();
        return;
    }
    
    if(firstRun){
        trimpicide = true;
        var deltaGenes = getDeltaGenes(minAnticipationStacks); //calculates how many geneticists we need to fire to be below minAnticipationStacks
        if(deltaGenes > 0){ //if we need to fire geneticists
            switchOffGA(); //pause autogeneticist  
            debug("Trimpicide for less stacks " + game.global.antiStacks + "->"+ minAnticipationStacks+ ". Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes));
            fireGeneticists(deltaGenes);
        }
        stackConservingTrimpicide();
        return;
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
        return;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
        if (!game.global.switchToMaps){
            mapsClicked();
        }
        mapsClicked();
    }
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
        setFormation(2);
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
    
    //toggleSetting('pauseGame');
    //tooltip('Export', null, 'update');
    //console.log(document.getElementById("exportArea").value);
    //cancelTooltip();
    
    worldArray = []; //create a world array that's safe to write to
    lastHealthyCell = -1;
    currentBadGuyNum = -1;
    
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
        enemy.maxHealth = game.global.getEnemyHealth(i, enemy.name, true) * mutationMult * dailyHPMult; //ignore imp stat = true. corrupted/healthy enemies get their health from mutation not their baseimp
        
        if (enemy.corrupted == "corruptTough") enemy.maxHealth *= 5;
        if (enemy.corrupted == "healthyTough") enemy.maxHealth *= 7.5;
        
        if(enemy.mutation != undefined && (enemy.mutation == "Corruption" || enemy.mutation == "Healthy")){
            if(maxHP < enemy.maxHealth)
                maxHP = enemy.maxHealth;
            if(minHP > enemy.maxHealth)
                minHP = enemy.maxHealth;
        }

        worldArray.push(enemy);
    }
    worldArray[99].maxHealth = game.global.getEnemyHealth(99, "Omnipotrimp", false) * mutations.Corruption.statScale(10) * dailyHPMult; //ignore imp stat = false
    
    if(minHP == game.global.getEnemyHealth(50, "", true) * mutations.Healthy.statScale(14) * 7.5 || maxHP == -1)
        debug("error! minHP = " + minHP + " maxHP = " + maxHP);
    
    equipLowDmgShield();
    calcBaseDamageinS();
    var baseDamageBad = baseDamage;
    equipMainShield();
    calcBaseDamageinS();
    var baseDamageGood = baseDamage;
    var heirloomDiff = baseDamageGood / baseDamageBad;
    debug("heirloom diff is " + heirloomDiff, "general");
    
    maxStacksBaseDamageD = 8 * baseDamage * (1+0.2*maxAnti) / (1 + 0.2*game.global.antiStacks); //45 stacks D stance good heirloom damage. The most damage we can dish out right now
    maxDesiredRatio = maxStacksBaseDamageD/maxHP; //we use this number to figure out coordination purchases and weapon prestige/leveling to balance our damage
    
    debug("our dmg = " + (maxDesiredRatio).toExponential(2) + " of desired");
    
    //next we want to calculate a value for each cell based on the healthy/corrupted/empty/omni distribution of the zone. this will be used to decide if a cell is worth spending any attacks in
    var pbMult = (game.heirlooms.Shield.plaguebringer.currentBonus > 0 ? game.heirlooms.Shield.plaguebringer.currentBonus / 100 : 0);
    if(game.global.world % 5 > 0) //on wind zones that arent the last
        worldArray[99].geoRelativeCellWorth = (1 + 0.2*mutations.Healthy.cellCount()) * game.empowerments.Wind.getModifier(); //we want to reflect the worth of the starting cells in next zone. in high zones this is worth a lot due to healthy cells. in low zones very little
    else
        worldArray[99].geoRelativeCellWorth = game.empowerments.Wind.getModifier(); //we want to reflect the worth of the starting cells in next zone. in high zones this is worth a lot due to healthy cells. in low zones very little    
    worldArray[99].PBWorth = 0; //PB doesnt get carried over to next zone
    worldArray[99].finalWorth = worldArray[99].geoRelativeCellWorth;
    for(var i = 98; i >= 0; i--){
        worldArray[i].geoRelativeCellWorth = (worldArray[i].baseWorth + getRetainModifier("Wind") * worldArray[i+1].geoRelativeCellWorth);
        worldArray[i].PBWorth = pbMult * worldArray[i+1].geoRelativeCellWorth;
        worldArray[i].finalWorth = (worldArray[i].geoRelativeCellWorth + worldArray[i].PBWorth) * game.empowerments.Wind.getModifier(); //this is in Omnipotrimps units
    }
        
    stanceStats = {OmnisPerAttack : 0, attacks : 0, enemyLastHP : -1, lastCell : "", OmnisWorths : 0, lastStacks : 0, wastedStacks : 0, lastNextStartingStacks : 0, wastedPBs : 0, trimpicides : 0}; //keep track of how well we're doing
    calcOmniHelium();
    
    //calculate avg zone worth. if its low buy weapons so we can more reliably fully overkill
    var sum = 0;
    for (var i  = 0; i <= 99; i++)
        sum += worldArray[i].finalWorth;
    avgWorthZone = dailyMult * sum / (100 * OmniThreshhold);
    
    if(game.global.world < 230)
        highestAvgWorthZone = 0;
    else if (windZone())
        highestAvgWorthZone = avgWorthZone;
    
    return true;
}

function  calcOmniHelium(){ //rewardResource()
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
    
    //debug("Omni gives " + m.toExponential(2) + " he, " + hr.toExponential(2) + " he/hr, he/hr/total " + pctTotal.toFixed(3) + "% ("+OmniThreshhold.toFixed(2)+")");
    debug("Goal: "+OmniThreshhold.toFixed(2)+" Omni/s avg zone " + avgWorthZone.toFixed(2));
}

function updateOmniThreshhold() {
    pctTotal = (100*hr/game.global.totalHeliumEarned); //which is this much he/hr% out of our total helium
    
    if (getDailyHeliumValue(countDailyWeight()) / 100 == 2) //no daily
        dailyMult = 1;
    else
        dailyMult = 1 + getDailyHeliumValue(countDailyWeight()) / 100;
    
    if(dailyMult > 1){
        pctTotal = pctTotal*dailyMult;
        //debug("You are also running a daily with a multiplier of " + dailyMult.toFixed(2) + ". Omni he/hr/total = "+ pctTotal.toFixed(3) + "%");
    }
    Goal = getPageSetting('WindStackingPctHe');
    if(Goal == -1) Goal = 0.5;
    OmniThreshhold = Goal/pctTotal;
}
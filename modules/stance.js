//MODULES["stance"] = {};
var currentBadGuyNum;
var lastZoneGridded = -1;
var coordBuyThreshold;
var allowBuyingCoords = true;
var maxCoords = -1;
var trimpicide = false;
var oldGeneAssistIndexOfStep;
var minAnticipationStacks;
var worldArray = [];
var lastHealthyCell = -1;

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
    windStackZone = getPageSetting('WindStackingMin'); 
    if((windStackZone > 0) && ((windStackZone - 241) % 15 > 4)) 
        windStackZone += 15 - ((windStackZone - 241) % 15); //raise windStackZone to first wind zone
    
    calcBaseDamageinS();
    allowBuyingCoords = false; //dont buy coords unless we explicitly permit it
    
    if (game.global.world < 81) return;//no D stance, no wind stacks, nothing to do here
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) { //dont calculate stances when dead, the "current" numbers are not updated when dead.
        if(trimpicide)
            getTargetAntiStack(minAnticipationStacks, false);
        return;
    } 
    
    if(windStackZone < 0 || game.global.world < windStackZone || game.global.spireActive || !windZone()) {
        if(game.global.soldierHealth > 0 && game.global.antiStacks <= minAnticipationStacks) //we probably left our army with low stacks from wind stacking. lets kill it
            stackConservingTrimpicide();
        
        allowBuyingCoords = true;
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
    
    var ourAvgDmgS = baseDamage;
    var ourAvgDmgD = ourAvgDmgS * 8;
    var ourAvgDmgX = ourAvgDmgS * 2;
    
    var enemyHealth = cell.health;  //current health
    var enemyMaxHealth = cell.maxHealth; //in future can do some prediction with plaguebringer and expected minimum enemy max health of world zone
    var enemyPercentHealthRemaining = cell.health/cell.maxHealth * 100;
    var missingStacks = 200-game.empowerments.Wind.currentDebuffPower;
    
    var expectedNumHitsS = enemyHealth / ourAvgDmgS;
    var expectedNumHitsX = enemyHealth / ourAvgDmgX;
    var expectedNumHitsD = enemyHealth / ourAvgDmgD;
    
    var maxS = enemyMaxHealth / ourAvgDmgS;
    var maxX = enemyMaxHealth / ourAvgDmgX;
    var maxD = enemyMaxHealth / ourAvgDmgD;

    var stacks = game.empowerments.Wind.currentDebuffPower;
    
    debug(game.global.world + "." + cellNum + " " + stacks+"W S/X/D " + maxS.toFixed(0) + "/"+maxX.toFixed(0)+"/"+maxD.toFixed(0) + " " + expectedNumHitsS.toFixed(0)+"/" + expectedNumHitsX.toFixed(0)+"/" + expectedNumHitsD.toFixed(0) + " " + game.global.formation + "-" + game.global.antiStacks + " " + cell.corrupted + " " + enemyMaxHealth.toExponential(1), "spam");
    
    var chosenFormation;
    
    if(expectedNumHitsD > missingStacks){
        chosenFormation = 2;
        
        coordBuyThreshold = 40;
        
        if(cell.corrupted !== undefined && cell.corrupted != "none"){ //disregard non corrupted cells
            if(stacks + expectedNumHitsD > 220 && maxD > coordBuyThreshold && currentBadGuyNum != cellNum){ //if it takes more than this many hits in D, buy 1 coord.
                currentBadGuyNum = cellNum; //newly bought coordination doesnt take effect until next enemy, so only buy 1 coordination per enemy.
                allowBuyingCoords = true;
                maxCoords = game.upgrades.Coordination.done + 1;
            }
            //consider trimpicide for max stacks
            if(hiddenBreedTimer >= maxAnti && game.global.antiStacks < maxAnti && maxD > 30 && Math.min(stacks + expectedNumHitsD, 200) - Math.min(stacks*0.85 + expectedNumHitsD*(5+maxAnti)/(5+game.global.antiStacks), 200) < 20){ 
                debug("Trimpiciding to get max stacks");
                stackConservingTrimpicide();
                return;
            }
        }
    }
    else if (expectedNumHitsX > missingStacks)
        chosenFormation = '0';
    else {
        chosenFormation = 4;
        
        var minWasteRatio = 2; //check if we have too much damage. maybe we want to trimpicide to remove anticipation stacks
        minAnticipationStacks = 1;
        if(cell.corrupted !== undefined && cell.corrupted != "none"){ //disregard non corrupted cells
            if(!rushCell(cellNum) && expectedNumHitsS + stacks < 120 && (maxS/(1+0.2*game.global.antiStacks)) < 4 && game.global.antiStacks > minAnticipationStacks){ //gotta make sure the enemy isnt complete weakling that even with no stacks he'll die too fast
                trimpicide = true;
                getTargetAntiStack(minAnticipationStacks, true);
                return;
            }
        }
    }
    
    trimpicide = false;

    if (chosenFormation == '0' && game.global.soldierHealth < 0.55 * game.global.soldierHealthMax){ //dont swap to X if it will kill/almost kill us
        chosenFormation = 2;
    }
    
    if(getLastHealthyCell() <= cellNum && cellNum < 97) //super placeholder
        chosenFormation = 2; 
    

    
    /*//look ahead 1 cell -- sadly does not appear possible because enemy isnt generated until we're at his cell
     * can be done by looking at ingame world grid div at least...
    if(nextCell !== undefined){
        var nextPBDmg = nextCell.plaguebringer; //extra damage on next cell from PB
        var pbHits = Math.ceil(nextCell.plagueHits); //extra wind stacks on next cell from PB
        var nextStartingStacks = 1 + Math.ceil(game.empowerments.Wind.currentDebuffPower * getRetainModifier("Wind")) + pbHits;
        var missingStacksNext = 200-nextStartingStacks;
    }*/
    
    setFormation(chosenFormation); 
    
    //dont windstack vs sharp enemies. in filler runs go D vs dodge enemies as they are time inefficient
    if (getCurrentEnemy(1).corrupted == "healthyBleed" && (chosenFormation == '0' || chosenFormation == 1))
        setFormation(2);
    else if (getCurrentEnemy(1).corrupted == "corruptBleed" || (getCurrentEnemy(1).corrupted == "corruptDodge" && !(game.global.runningChallengeSquared || game.global.challengeActive)))
        setFormation(2);
}

function getTargetAntiStack(target, firstRun){
    if(target < 1 || target > 45){
        debug("error target anti stacks out of bounds " + target);
        return;
    }

    if (game.global.antiStacks <= target && game.global.antiStacks > 0){
        debug("getTargetAntiStacks target="+target+" firstRun="+firstRun+" got called, but our stacks="+game.global.antiStacks+" are fine.");
        trimpicide = false;
        switchToGAStep(oldGeneAssistIndexOfStep); //return to previous
        return;
    }
    
    if(game.global.preMapsActive){
       if (!game.global.switchToMaps){
            mapsClicked();
        }
    }
    
    if(firstRun){
        var deltaGenes = getDeltaGenes(minAnticipationStacks); //calculate how many geneticists we need to fire to be below minAnticipationStacks
        if(deltaGenes > 0){ //if we need to fire geneticists
            debug("Trimpicide to remove anticipation. Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes));
            oldGeneAssistIndexOfStep = game.global.GeneticistassistSteps.indexOf(game.global.GeneticistassistSetting); //back up our current geneassist setting
            switchToGAStep('0'); //pause autogeneticist            
            fireGeneticists(deltaGenes);
        }
        stackConservingTrimpicide();
        return;
    }
    
    if(game.global.breedBack < 0){ //breedback keeps track of our bred trimps. it starts from armysize/2 and counts down. when breedback trimps have been bred the geneticist bonus kicks in. that's what we're after.
        trimpicide = false; //we're done here
        switchToGAStep(oldGeneAssistIndexOfStep); //return to previous
        setFormation(4);
        fightManual();
        return;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0){ //we are in the world with an army that has too many anticipation stacks
        if (!game.global.switchToMaps){
            mapsClicked();
        }
    }
}

function getDeltaGenes(target){
    var timeLeft = getBreedTime(true);  //how much time untill we're full on trimps
    var ratio = timeLeft / target;      
    
    var deltaGenes = -1 * Math.floor(Math.log(ratio) / Math.log(0.98)); //we need to fire this many genes to reach our target breed timer
    return deltaGenes;
}

function switchToGAStep(step){
    var steps = game.global.GeneticistassistSteps;
    var currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    while(currentStep != step){ //get to the last active GA mode
        toggleGeneticistassist();
        currentStep = steps.indexOf(game.global.GeneticistassistSetting);
    }
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
    game.global.buyAmt = Math.floor(howMany);
    game.global.firing = true;
    buyJob('Geneticist', true, true); 
    game.global.firing = false;
    
    //since we are directly handling game memory to fire geneticists, we have to call the breed() function to update both game.global.lastLowGen and game.global.lowestGen through updateStoredGenInfo(breeding)
    //if we don't do this we may as well be cheating.
    //TODO: fire the geneticists through more conventional means
    breed();
}

function getLastHealthyCell(){
    if (game.global.world > lastZoneGridded){
        buildWorldArray();
        lastZoneGridded = game.global.world;
    }
    //lastZoneGridded
    return 50;
}

function rushCell(a){
    return (a > getLastHealthyCell() && a < 97);
}

function buildWorldArray(){
    worldArray = [];
    lastHealthyCell = -1;
    
    for (var i = 0; i < 100; i++){
        var cellTitle = document.getElementById("cell"+i);
        worldArray.push(cellTitle);
    }
}
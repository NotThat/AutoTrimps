
//calculates in game displayed Max damage multiplied by the on-top crit modifier (the dark lines in game display), in S stance
function calculateDamageAT() {
                //in game displayed min damage                                * min-max avg * crit dmg mult
    var critMult = calcCritModifier(getPlayerCritChance(), getPlayerCritDamageMult());
    var trimpATK = calculateDamage(game.global.soldierCurrentAttack, true, true, true) * critMult;

    var baseModifier = 1;
    switch (game.global.formation){
        case 0:
            baseModifier = 0.5;
            break;
        case 2:
            baseModifier = 0.125;
            break;
        case 4:
            baseModifier = 1;
            break;
    }
    
    trimpATK *= baseModifier;
            
return parseFloat(trimpATK);
}

function calcCritModifier(critChance, critDamage){
    ret = 0;
    if(critChance < 1){
        ret = critChance * critDamage + 1-critChance;
        return ret;
    }
    if(critChance <=2){
        ret = (5*(critChance-1) + (2-critChance))*critDamage;
        return ret;
    }
    return 5*calcCritModifier(critChance-1, critDamage);
}

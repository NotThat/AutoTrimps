// ==UserScript==
// @name         Trimps - Autoperks - PERKY
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  try to take over the world!
// @author       OG: Grimy -> Altizar -> Zeker0 -> genBTC -> Meowchan
// @match        https://trimps.github.io/*
// @include      *trimps.github.io*
// @include      *kongregate.com/games/GreenSatellite/trimps
// @grant        GM_xmlhttpRequest
// ==/UserScript==

//Create blank AutoPerks object
MODULES["perks"] = {};
var AutoPerks = {};

var AutoPerks = {
    data: {
        he_left: 0,
        zone: 60,
        targetzone: 60,
        perks: null,
        weight: {
            helium: 0,
            attack: 0,
            health: 0,
            xp: 0,
            trimps: 0
        },
        fluffy: {
            xp: 0,
            prestige: 0
        },
        mod: {
            storage: 0.125,
            soldiers: 0,
            dg: 0,
            tent_city: false,
            whip: false,
            magn: false,
            taunt: false,
            ven: false,
            chronojest: 0,
            prod: 0,
            loot: 0,
            breed_timer: 0
        }
    },
    preset: "z450",
    fixed: "",
    Perk: /** @class */ (function () {
        function Perk(base_cost, increment, cap, free, scaling) {
            if (scaling === void 0) {
                scaling = 30;
            }
            this.base_cost = base_cost;
            this.increment = increment;
            this.cap = cap;
            this.free = free;
            this.scaling = scaling;
            this.locked = true;
            this.level = 0;
            this.pack = 1;
            this.must = 0;
            this.spent = 0;
        }
        // Compute the current cost of a perk, based on its current level.
        Perk.prototype.cost = function () {
            return this.increment
                    ? this.pack *
                    (this.base_cost +
                            this.increment * (this.level + (this.pack - 1) / 2))
                    : Math.ceil(this.level / 2 + this.base_cost * AutoPerky.mult(this, this.scaling));
        };
        return Perk;
    })(),
    unlocks: "",
    notation: 2,
    perks: null,
    presets: {
        early: ["5", "4", "3"],
        broken: ["7", "3", "1"],
        mid: ["16", "5", "1"],
        corruption: ["25", "7", "1"],
        magma: ["35", "4", "3"],
        z280: ["42", "6", "1"],
        z400: ["88", "10", "1"],
        z450: ["500", "50", "1"],
        spire: ["0", "1", "1"],
        nerfed: ["0", "4", "3"],
        tent: ["5", "4", "3"],
        scientist: ["0", "1", "3"],
        carp: ["0", "0", "0"],
        trapper: ["0", "7", "1"],
        coord: ["0", "40", "1"],
        trimp: ["0", "99", "1"],
        metal: ["0", "7", "1"],
        c2: ["0", "7", "1"],
        custom: ["1", "1", "1"]
    },
    notations: [
        [],
        (
                "KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTgUtgDtgTtgQatg" +
                "QitgSxtgSptgOtgNtgQaaUqaDqaTqaQaqaQiqaSxqaSpqaOqaNqaQiaUqiDqiTqiQaqiQiqiSxqiSpqi" +
                "OqiNqiSxaUsxDsxTsxQasxQisxSxsxSpsxOsxNsxSpaUspDspTspQaspQispSxspSpspOspNspOgUog" +
                "DogTogQaogQiogSxogSpogOogNogNaUnDnTnQanQinSxnSpnOnNnCtUc"
                ).split(/(?=[A-Z])/),
        [],
        (
                "a b c d e f g h i j k l m n o p q r s t u v w x y z" +
                " aa ab ac ad ae af ag ah ai aj ak al am an ao ap aq ar as at au av aw ax ay az" +
                " ba bb bc bd be bf bg bh bi bj bk bl bm bn bo bp bq br bs bt bu bv bw bx by bz" +
                " ca cb cc cd ce cf cg ch ci cj ck cl cm cn co cp cq cr cs ct cu cv cw cx"
                ).split(" "),
        "KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTg".split(
                /(?=[A-Z])/
                )
    ],
    add: function (perk, x) {
        return 1 + perk.level * x / 100;
    },
    mult: function (perk, x) {
        return Math.pow(1 + x / 100, perk.level);
    },
    mastery: function (name) {
        if (!game.talents[name]) {
            throw "unknown mastery: " + name;
        }
        return game.talents[name].purchased;
    },
    parse_suffixes: function (str) {
        str = str.replace(/\*.*|[^--9+a-z]/gi, "");
        var suffixes = AutoPerky.notations[AutoPerky.notation === "3" ? 3 : 1];
        for (var i = suffixes.length; i > 0; --i) {
            str = str.replace(new RegExp(suffixes[i - 1] + "$", "i"), "E" + 3 * i);
        }
        return +str;
    },
    parse_perks: function (fixed, unlocks) {
        var perks = {
            Looting_II: new AutoPerky.Perk(100e3, 10e3, Infinity, 1e4),
            Carpentry_II: new AutoPerky.Perk(100e3, 10e3, Infinity, 1e4),
            Motivation_II: new AutoPerky.Perk(50e3, 1e3, Infinity, 1e4),
            Power_II: new AutoPerky.Perk(20e3, 500, Infinity, 1e4),
            Toughness_II: new AutoPerky.Perk(20e3, 500, Infinity, 1e4),
            Capable: new AutoPerky.Perk(1e8, 0, 10, 1e4, 900),
            Cunning: new AutoPerky.Perk(1e11, 0, Infinity, 1e4),
            Curious: new AutoPerky.Perk(1e14, 0, Infinity, 1e4),
            Overkill: new AutoPerky.Perk(1e6, 0, 30, 1e4),
            Resourceful: new AutoPerky.Perk(50e3, 0, Infinity, 1e6),
            Coordinated: new AutoPerky.Perk(150e3, 0, Infinity, 1e4),
            Siphonology: new AutoPerky.Perk(100e3, 0, 3, 1e4),
            Anticipation: new AutoPerky.Perk(1000, 0, 10, 1e4),
            Resilience: new AutoPerky.Perk(100, 0, Infinity, 1e4),
            Meditation: new AutoPerky.Perk(75, 0, 7, 1e4),
            Relentlessness: new AutoPerky.Perk(75, 0, 10, 1e4),
            Carpentry: new AutoPerky.Perk(25, 0, Infinity, 1e4),
            Artisanistry: new AutoPerky.Perk(15, 0, Infinity, 1e4),
            Range: new AutoPerky.Perk(1, 0, 10, 1e4),
            Agility: new AutoPerky.Perk(4, 0, 20, 1e4),
            Bait: new AutoPerky.Perk(4, 0, Infinity, 1e7),
            Trumps: new AutoPerky.Perk(3, 0, Infinity, 1e8),
            Pheromones: new AutoPerky.Perk(3, 0, Infinity, 1e6),
            Packrat: new AutoPerky.Perk(3, 0, Infinity, 1e7),
            Motivation: new AutoPerky.Perk(2, 0, Infinity, 1e4),
            Power: new AutoPerky.Perk(1, 0, Infinity, 1e4),
            Toughness: new AutoPerky.Perk(1, 0, Infinity, 1e4),
            Looting: new AutoPerky.Perk(1, 0, Infinity, 1e4)
        };
        if (!unlocks.match(/>/)) {
            unlocks = unlocks.replace(/(?=,|$)/g, ">0");
        }
        var list = (unlocks + "," + fixed).split(/,/).filter(x => x);
        for (var key in list) {
            var item = list[key];
            var m = (m = item.match(/(\S+) *([<=>])=?(.*)/));
            if (!m) {
                throw "Enter a list of perk levels, such as “power=42, toughness=51”.";
            }
            var tier2 = m[1].match(/2$|II$/);
            var name = m[1].replace(/[ _]?(2|II)/i, "").replace(/^OK/i, "O").replace(/^Looty/i, "L");
            var regex = new RegExp(`^${name}[a-z]*${tier2 ? "_II" : ""}$`, "i");
            var matches = Object.keys(perks).filter(p => p.match(regex));
            if (matches.length > 1) {
                throw `Ambiguous perk abbreviation: ${m[1]}.`;
            }
            if (matches.length < 1) {
                throw `Unknown perk: ${m[1]}.`;
            }
            let level = m[3];
            if (!isFinite(level)) {
                throw `Invalid number: ${m[3]}.`;
            }
            perks[matches[0]].locked = false;
            if (m[2] != ">") {
                perks[matches[0]].cap = parseInt(level);
            }
            if (m[2] != "<") {
                perks[matches[0]].must = parseInt(level);
            }
        }
        return perks;
    },
    select_preset: function (name, manually) {
        if (manually === void 0) {
            manually = true;
        }
        this.data.weight = {
            helium: parseInt(this.presets[name][0]),
            attack: parseInt(this.presets[name][1]),
            health: parseInt(this.presets[name][2]),
            xp: Math.floor((+this.presets[name][0] + +this.presets[name][1] + +this.presets[name][2]) / 5),
            trimps: 0
        };
    },
    read_data: function () {
        this.data.zone = this.data.targetzone;
        this.unlocks = Object.keys(game.portal).filter(function (perk) {
            return !game.portal[perk].locked;
        }).join(",");
        this.data.perks = this.parse_perks(this.fixed, this.unlocks);
        var preset = this.preset;
        this.select_preset(preset);
        if (preset == "trapper" && (!game || game.global.challengeActive != "Trapper")) {
            throw "This preset requires a save currently running Trapper². Start a new run using “Trapper² (initial)”, export, and try again.";
        }
        this.update_dg();
        //extra settings
        var zone = this.data.targetzone;
        var helium = game.global.viewingUpgrades ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
        for (var perk in game.portal) {
            helium += game.portal[perk].heliumSpent;
        }
        var unlocks = Object.keys(game.portal).filter(function (perk) {
            return !game.portal[perk].locked;
        });
        if (!game.global.canRespecPerks) {
            unlocks = unlocks.map(function (perk) {
                return perk + ">" + game.portal[perk].level;
            });
        }
        // Income
        var tt = this.mastery("turkimp4") ? 1 : this.mastery("turkimp3") ? 0.6 : this.mastery("turkimp2") ? 0.4 : this.mastery("turkimp") ? 0.3 : 0.25;
        var prod = 1 + tt;
        var loot = 1 + 0.333 * tt;
        var spires = Math.min(Math.floor((zone - 101) / 100), game.global.spiresCompleted);
        loot *= zone < 100 ? 0.7 : 1 + (this.mastery("stillRowing") ? 0.3 : 0.2) * spires;
        var chronojest = 27 * game.unlocks.imps.Jestimp + 15 * game.unlocks.imps.Chronoimp;
        var cache = zone < 60 ? 0 : zone < 85 ? 7 : zone < 160 ? 10 : zone < 185 ? 14 : 20;
        chronojest += (this.mastery("mapLoot2") ? 5 : 4) * cache;
        for (var _i = 0, _a = game.global.StaffEquipped.mods || []; _i < _a.length; _i++) {
            var mod = _a[_i];
            if (mod[0] === "MinerSpeed") {
                prod *= 1 + 0.01 * mod[1];
            } else if (mod[0] === "metalDrop") {
                loot *= 1 + 0.01 * mod[1];
            }
        }
        this.data.he_left = helium + (game.global.canRespecPerks ? 0 : game.resources.helium.owned);
        this.data.fluffy = {
            xp: game ? game.global.fluffyExp : 0,
            prestige: game ? game.global.fluffyPrestige : 0
        };
        this.data.mod = {
            storage: 0.125,
            soldiers: 0,
            dg: preset == "nerfed" ? 0 : this.data.mod.dg,
            tent_city: preset == "tent",
            whip: game.unlocks.imps.Whipimp,
            magn: game.unlocks.imps.Magnimp,
            taunt: game.unlocks.imps.Tauntimp,
            ven: game.unlocks.imps.Venimp,
            chronojest: chronojest,
            prod: prod,
            loot: loot,
            breed_timer: 45
        };
        if (preset == "nerfed") {
            this.data.he_left = 1e8;
            this.data.zone = 200;
            this.data.mod.dg = 0;
        }
        if (preset == "trapper") {
            this.data.mod.soldiers = game.resources.trimps.owned;
            this.data.mod.prod = 0;
            this.data.perks.Pheromones.cap = 0;
            this.data.perks.Anticipation.cap = 0;
        }
        if (preset == "spire") {
            this.data.mod.prod = this.data.mod.loot = 0;
            this.data.perks.Overkill.cap = 0;
            this.data.zone = game.global.world;
        }
        if (preset == "carp") {
            this.data.mod.prod = this.data.mod.loot = 0;
            this.data.weight.trimps = 1e6;
        }
        if (preset == "metal") {
            this.data.mod.prod = 0;
        }
        if (preset == "trimp") {
            this.data.mod.soldiers = 1;
        }
        if (preset == "nerfed") {
            this.data.perks.Overkill.cap = 1;
        }
        if (preset == "scientist") {
            this.data.perks.Coordinated.cap = 0;
        }
    },
    update_dg: function () {
        var max_zone = this.data.targetzone / 2 + 115;
        var eff = 500e6 + 50e6 * game.generatorUpgrades.Efficiency.upgrades;
        var capa = 3 + 0.4 * game.generatorUpgrades.Capacity.upgrades;
        var max_fuel = game.permanentGeneratorUpgrades.Storage.owned ? capa * 1.5 : capa;
        var supply = 230 + 2 * game.generatorUpgrades.Supply.upgrades;
        var overclock = game.generatorUpgrades.Overclocker.upgrades;
        overclock = overclock && 1 - 0.5 * Math.pow(0.99, overclock - 1);
        var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
        var cells = this.mastery("magmaFlow") ? 18 : 16;
        var accel = this.mastery("quickGen") ? 1.03 : 1.02;
        var hs2 = this.mastery("hyperspeed2") ? (game.global.highestLevelCleared + 1) / 2 : 0;
        var bs = 0.5 * this.mastery("blacksmith") + 0.25 * this.mastery("blacksmith2") + 0.15 * this.mastery("blacksmith3");
        bs *= game.global.highestLevelCleared + 1;
        var housing = 0;
        var fuel = 0;
        var time = 0;
        function tick(mult) {
            housing += mult * eff * Math.sqrt(Math.min(capa, fuel));
            fuel -= burn;
        }
        for (var zone = 230; zone <= max_zone; ++zone) {
            fuel += cells * (0.01 * Math.min(zone, supply) - 2.1);
            var tick_time = Math.ceil(60 / Math.pow(accel, Math.floor((zone - 230) / 3)));
            time += zone > bs ? 28 : zone > hs2 ? 20 : 15;
            while (time >= tick_time) {
                time -= tick_time;
                tick(1);
            }
            while (fuel > max_fuel) {
                tick(overclock);
            }
            housing *= 1.009;
        }
        while (fuel >= burn) {
            tick(1);
        }
        this.data.mod.dg = housing;
    },
    optimize: function (data) {
        var he_left = data.he_left,
                zone = data.zone,
                fluffy = data.fluffy,
                perks = data.perks,
                weight = data.weight,
                mod = data.mod;
        var Looting_II = perks.Looting_II,
                Carpentry_II = perks.Carpentry_II,
                Motivation_II = perks.Motivation_II,
                Power_II = perks.Power_II,
                Toughness_II = perks.Toughness_II,
                Capable = perks.Capable,
                Cunning = perks.Cunning,
                Curious = perks.Curious,
                Overkill = perks.Overkill,
                Resourceful = perks.Resourceful,
                Coordinated = perks.Coordinated,
                Siphonology = perks.Siphonology,
                Anticipation = perks.Anticipation,
                Resilience = perks.Resilience,
                Meditation = perks.Meditation,
                Relentlessness = perks.Relentlessness,
                Carpentry = perks.Carpentry,
                Artisanistry = perks.Artisanistry,
                Range = perks.Range,
                Agility = perks.Agility,
                Bait = perks.Bait,
                Trumps = perks.Trumps,
                Pheromones = perks.Pheromones,
                Packrat = perks.Packrat,
                Motivation = perks.Motivation,
                Power = perks.Power,
                Toughness = perks.Toughness,
                Looting = perks.Looting;
        for (var name in perks) {
            if (name.endsWith("_II")) {
                perks[name].pack = Math.pow(10, Math.max(0, Math.floor(Math.log(he_left) / Math.log(100) - 4.2)));
            }
        }
        for (var _i = 0, _a = ["whip", "magn", "taunt", "ven"]; _i < _a.length; _i++) {
            var name = _a[_i];
            mod[name] = Math.pow(1.003, zone * 99 * 0.03 * mod[name]);
        }
        var books = Math.pow(1.25, zone) * Math.pow(zone > 100 ? 1.28 : 1.2, Math.max(zone - 59, 0));
        var gigas = Math.max(0, Math.min(zone - 60, zone / 2 - 25, zone / 3 - 12, zone / 5, zone / 10 + 17, 39));
        var base_housing = Math.pow(1.25, Math.min(zone / 2, 30) + gigas);
        var mystic = zone >= 25 ? Math.floor(Math.min(zone / 5, 9 + zone / 25, 15)) : 0;
        var tacular = (20 + zone - zone % 5) / 100;
        var base_income = 600 * mod.whip * books;
        var base_helium = Math.pow(zone - 19, 2);
        var max_tiers = zone / 5 + +((zone - 1) % 10 < 5);
        var exponents = {
            cost: Math.pow(1.069, 0.85 * (zone < 60 ? 57 : 53)),
            attack: Math.pow(1.19, 13),
            health: Math.pow(1.19, 14),
            block: Math.pow(1.19, 10)
        };
        var equip_cost = {
            attack: 211 * (weight.attack + weight.health) / weight.attack,
            health: 248 * (weight.attack + weight.health) / weight.health,
            block: 5 * (weight.attack + weight.health) / weight.health
        };
        // Number of ticks it takes to one-shot an enemy.
        function ticks() {
            return 1 + +(Agility.level < 3) + Math.ceil(10 * AutoPerky.mult(Agility, -5));
        }
        var moti = function () {
            return AutoPerky.add(Motivation, 5) * AutoPerky.add(Motivation_II, 1);
        };
        var looting = function () {
            return AutoPerky.add(Looting, 5) * AutoPerky.add(Looting_II, 0.25);
        };
        function income(ignore_prod) {
            var storage = mod.storage * AutoPerky.mult(Resourceful, -5) / AutoPerky.add(Packrat, 20);
            var loot = looting() * mod.magn / ticks();
            var prod = ignore_prod ? 0 : moti() * AutoPerky.add(Meditation, 1) * mod.prod;
            var chronojest = mod.chronojest * 0.1 * prod * loot;
            return (base_income * (prod + loot * mod.loot + chronojest) * (1 - storage));
        }
        // Max population
        var trimps = mod.tent_city
                ? function () {
                    var carp = AutoPerky.mult(Carpentry, 10) * AutoPerky.add(Carpentry_II, 0.25);
                    var territory = AutoPerky.add(Trumps, 20);
                    return 10 * (mod.taunt + territory * (mod.taunt - 1) * 111) * carp;
                }
        : function () {
            var carp = AutoPerky.mult(Carpentry, 10) * AutoPerky.add(Carpentry_II, 0.25);
            var bonus = 3 + Math.max(Math.log(income() / base_income * carp / AutoPerky.mult(Resourceful, -5)), 0);
            var territory = AutoPerky.add(Trumps, 20) * zone;
            return (10 * (base_housing * bonus + territory) * carp * mod.taunt + mod.dg * carp);
        };
        function equip(stat) {
            var cost = equip_cost[stat] * AutoPerky.mult(Artisanistry, -5);
            var levels = 1.136;
            var tiers = Math.log(1 + income() * trimps() / cost) / Math.log(exponents.cost);
            if (tiers > max_tiers + 0.45) {
                levels = Math.log(1 + Math.pow(exponents.cost, tiers - max_tiers) * 0.2) / Math.log(1.2);
                tiers = max_tiers;
            }
            return levels * Math.pow(exponents[stat], tiers);
        }
        // Number of buildings of a given kind that can be built with the current income.
        // cost: base cost of the buildings
        // exp: cost increase for each new level of the building
        function building(cost, exp) {
            cost *= 4 * AutoPerky.mult(Resourceful, -5);
            return Math.log(1 + income(true) * trimps() * (exp - 1) / cost) / Math.log(exp);
        }
        // Number of zones spent in the Magma
        function magma() {
            return Math.max(zone - 229, 0);
        }
        // function mancers() {
        // let tributes = building(10000, 1.05);
        // let mancers = Math.log(loot * Math.pow(1.05, tributes) / 1e62) / Math.log(1.01);
        // return magma() ? 1 + 0.6 * (1 - Math.pow(0.9999, mancers)) : 1;
        // }
        // Breed speed
        function breed() {
            var nurseries = building(2e6, 1.06) / (1 + 0.1 * Math.min(magma(), 20));
            var potency = 0.0085 * (zone >= 60 ? 0.1 : 1) * Math.pow(1.1, Math.floor(zone / 5));
            return potency * Math.pow(1.01, nurseries) * AutoPerky.add(Pheromones, 10) * mod.ven;
        }
        var group_size = [];
        for (var coord = 0; coord <= Math.log(1 + he_left / 500e3) / Math.log(1.3); ++coord) {
            var ratio = 1 + 0.25 * Math.pow(0.98, coord);
            var result = 1;
            for (var i = 0; i < 100; ++i) {
                result = Math.ceil(result * ratio);
            }
            group_size[coord] = result / Math.pow(ratio, 100);
        }
        // Theoretical fighting group size (actual size is lower because of Coordinated)
        function soldiers() {
            var ratio = 1 + 0.25 * AutoPerky.mult(Coordinated, -2);
            var pop = (mod.soldiers || trimps()) / 3;
            if (mod.soldiers > 1)
                pop += 36000 * AutoPerky.add(Bait, 100);
            var coords = Math.log(pop / group_size[Coordinated.level]) / Math.log(ratio);
            var available = zone - 1 + (magma() ? 100 : 0);
            return group_size[0] * Math.pow(1.25, Math.min(coords, available));
        }
        // Total attack
        function attack() {
            var attack = (0.15 + equip("attack")) * Math.pow(0.8, magma());
            attack *= AutoPerky.add(Power, 5) * AutoPerky.add(Power_II, 1);
            attack *= AutoPerky.add(Relentlessness, 5 * AutoPerky.add(Relentlessness, 30));
            attack *= Math.pow(1 + Siphonology.level, 0.1) * AutoPerky.add(Range, 1);
            attack *= AutoPerky.add(Anticipation, 6);
            return soldiers() * attack;
        }
        // Total survivability (accounts for health and block)
        function health() {
            var health = (0.6 + equip("health")) * Math.pow(0.8, magma());
            health *= AutoPerky.add(Toughness, 5) * AutoPerky.add(Toughness_II, 1) * AutoPerky.mult(Resilience, 10);
            // block
            var gyms = building(400, 1.185);
            var trainers = (gyms * Math.log(1.185) - Math.log(1 + gyms)) / Math.log(1.1) + 25 - mystic;
            var block = 0.04 * gyms * Math.pow(1 + mystic / 100, gyms) * (1 + tacular * trainers);
            // target number of attacks to survive
            var attacks = 60;
            if (zone < 70) {
                // number of ticks needed to repopulate an army
                var timer =
                        Math.log(1 + soldiers() * breed() / AutoPerky.add(Bait, 100)) / Math.log(1 + breed());
                attacks = timer / ticks();
            } else {
                var ratio = 1 + 0.25 * AutoPerky.mult(Coordinated, -2);
                var available = zone - 1 + (magma() ? 100 : 0);
                var required = group_size[Coordinated.level] * Math.pow(ratio, available);
                var fighting = Math.min(required / trimps(), 1 / 3);
                var target_speed = fighting > 1e-9 ? (Math.pow(0.5 / (0.5 - fighting), 0.1 / mod.breed_timer) - 1) * 10 : fighting / mod.breed_timer;
                var geneticists = Math.log(breed() / target_speed) / -Math.log(0.98);
                health *= Math.pow(1.01, geneticists);
            }
            health /= attacks;
            if (zone < 60) {
                block += equip("block");
            } else {
                block = Math.min(block, 4 * health);
            }
            return soldiers() * (block + health);
        }
        // XP earned by Fluffy over the run
        fluffy.base = 0;
        for (var z = 301; z < zone; ++z) {
            fluffy.base += 50 * Math.pow(1.015, z - 300);
        }
        function xp() {
            var total = fluffy.base * AutoPerky.add(Cunning, 25) * AutoPerky.add(Curious, 60);
            var cap = Capable.level == 10 ? Infinity : 1000 * Math.pow(5, fluffy.prestige) * (AutoPerky.mult(Capable, 300) - 1) / 3;
            return Math.max(1, Math.min(total, cap - fluffy.xp) + Math.min(total * 7, cap - fluffy.xp));
        }
        var agility = function () {
            return 1 / AutoPerky.mult(Agility, -5);
        };
        var helium = function () {
            return base_helium * looting() + 45;
        };
        var overkill = function () {
            return Math.max(0.2, Overkill.level);
        };
        var stats = {
            agility: agility,
            helium: helium,
            xp: xp,
            attack: attack,
            health: health,
            overkill: overkill,
            trimps: trimps
        };
        function score() {
            var result = 0;
            for (var i in weight) {
                if (!weight[i]) {
                    continue;
                }
                var stat = stats[i]();
                if (!isFinite(stat)) {
                    throw Error(i + " is " + stat);
                }
                result += weight[i] * Math.log(stat);
            }
            return result;
        }
        function best_perk() {
            var best;
            var max = 0;
            var baseline = score();
            for (var name in perks) {
                var perk = perks[name];
                if (perk.locked || perk.level >= perk.cap || perk.cost() > he_left) {
                    continue;
                }
                perk.level += perk.pack;
                var gain = score() - baseline;
                perk.level -= perk.pack;
                var efficiency = gain / perk.cost();
                if (efficiency >= max) {
                    max = efficiency;
                    best = perk;
                }
            }
            return best;
        }
        mod.loot *= 20.8; // TODO: check that this is correct
        weight.agility = (weight.helium + weight.attack) / 2;
        weight.overkill = 0.25 * weight.attack * (2 - Math.pow(0.9, weight.helium / weight.attack));
        //Disable Bait if we are above z110
        if (zone > 110 && mod.soldiers <= 1 && Bait.must == 0) {
            Bait.cap = 0;
        }
        if (!Capable.must) {
            Capable.must = Math.ceil(Math.log(0.003 * fluffy.xp / Math.pow(5, fluffy.prestige) + 1) / Math.log(4));
        }
        // Dirty fix
        Capable.must = Math.min(Capable.must, 10, Math.floor(Math.log(he_left) / Math.log(10) - 7.5));
        for (var name in perks) {
            var perk = perks[name];
            while (perk.level < perk.must) {
                var cost = perk.cost();
                he_left -= cost;
                perk.level += perk.pack;
                perk.spent += cost;
            }
        }
        if (he_left < 0) {
            throw game && game.global.canRespecPerks ? "You don’t have enough Helium to afford your Fixed Perks." : "You don’t have a respec available.";
        }
        // Main loop
        for (var best = void 0; (best = best_perk()); ) {
            var spent = 0;
            while (best.level < best.cap && (best.level < best.must || spent < he_left / best.free)) {
                he_left -= best.cost();
                spent += best.cost();
                best.level += best.pack;
                if (best.level == 1000 * best.pack) {
                    best.pack *= 10;
                }
            }
            best.spent += spent;
        }
        for (var perk in perks) {
            //console.log(perk, "=", perks[perk].level, "=", perks[perk].must); 
        }
        return [he_left, perks];
    },
    init: function () {
        var ratio = JSON.parse(localStorage.getItem("AutoperkCustomRatio"));
        if (ratio !== null && ratio !== undefined && ratio.length === 3) {
            this.presets["custom"] = ratio;
        }
        this.buildButtons();
    },
    run: function () {
        this.inputs = this.read_data();
        this.optimize(this.data);
    },
    clickAllocate: function () {
        AutoPerky.run();
        this.applyCalculations(this.data.perks);
    },
    applyCalculations: function (perks) {
        var preBuyAmt = game.global.buyAmt;
        if (game.global.canRespecPerks) {
            respecPerks();
        }
        if (game.global.respecActive) {
            clearPerks();
            for (var i in perks) {
                if (!game.portal[i].locked) {
                    game.global.buyAmt = perks[i].level;
                    buyPortalUpgrade(i);
                }
            }
        }
        game.global.buyAmt = preBuyAmt;
        numTab(1, true); //selects the 1st number of the buy-amount tab-bar (Always 1)
        cancelTooltip(); //displays the last perk we bought's tooltip without this. idk why.
    },
    createInput: function (perkname, div) {
        var perk1input = document.createElement("Input");
        perk1input.id = perkname + "Ratio";
        var oldstyle = "text-align: center; width: 60px;";
        if (game.options.menu.darkTheme.enabled != 2) {
            perk1input.setAttribute("style", oldstyle + " color: black;");
        } else {
            perk1input.setAttribute("style", oldstyle);
        }
        perk1input.setAttribute("class", "perkRatios");
        var perk1label = document.createElement("Label");
        perk1label.id = perkname + "Label";
        perk1label.innerHTML = perkname;
        perk1label.setAttribute("style", "margin-right: 1vw; width: 120px; color: white;");
        //add to the div.
        perk1input.setAttribute("onchange", "AutoPerky.saveRatios()");
        div.appendChild(perk1input);
        div.appendChild(perk1label);
    },
    saveRatios: function () {
        if (this.preset === "custom") {
            this.presets[this.preset][0] = parseInt(document.getElementById("HeliumRatio").value);
            this.presets[this.preset][1] = parseInt(document.getElementById("AttackRatio").value);
            this.presets[this.preset][2] = parseInt(document.getElementById("HealthRatio").value);
            safeSetItems("AutoperkCustomRatio", JSON.stringify(this.presets[this.preset]));
        }
        if (this.fixed != document.getElementById("FixedRatio").value) {
            this.fixed = document.getElementById("FixedRatio").value;
            safeSetItems("AutoperkFixedPerks", this.fixed);
        }
        var loadZone = parseInt(document.getElementById("TargetRatio").value);
        if (loadZone > 0) {
            this.data.targetzone = loadZone;
            safeSetItems("AutoperkTargetZone", this.data.targetzone);
        }
    },
    setDefaultRatios: function () {
        if (this.preset !== document.getElementById("ratioPreset").value) {
            var ratioSet = document.getElementById("ratioPreset").selectedIndex;
            if (Number.isInteger(ratioSet)) {
                safeSetItems("AutoperkSelectedRatioPresetID", ratioSet);
            }
            this.preset = document.getElementById("ratioPreset").value;
        }
        document.getElementById("HeliumRatio").value = this.presets[this.preset][0];
        document.getElementById("AttackRatio").value = this.presets[this.preset][1];
        document.getElementById("HealthRatio").value = this.presets[this.preset][2];
        if (this.preset === "custom") {
            document.getElementById("HeliumRatio").disabled = false;
            document.getElementById("AttackRatio").disabled = false;
            document.getElementById("HealthRatio").disabled = false;
        } else {
            document.getElementById("HeliumRatio").disabled = true;
            document.getElementById("AttackRatio").disabled = true;
            document.getElementById("HealthRatio").disabled = true;
        }
        document.getElementById("FixedRatio").value = this.fixed;
        document.getElementById("TargetRatio").value = this.data.targetzone;
    },
    buildButtons: function () {
        var buttonbar = document.getElementById("portalBtnContainer");
        var customRatios = document.createElement("DIV");
        customRatios.id = 'customRatios';
        this.createInput("Helium", customRatios);
        this.createInput("Attack", customRatios);
        this.createInput("Health", customRatios);
        this.createInput("Target", customRatios);
        this.createInput("Fixed", customRatios);
        var loadFixed = localStorage.getItem("AutoperkFixedPerks");
        if (loadFixed !== null) {
            this.fixed = loadFixed;
        }
        var loadZone = parseInt(localStorage.getItem("AutoperkTargetZone"));
        if (loadZone > 0) {
            this.data.targetzone = loadZone;
        } else {
            this.data.targetzone =
                    game.stats.highestVoidMap.valueTotal || game.global.highestLevelCleared;
        }
        //Create Allocator button and add it to Trimps Perk Window
        var allocatorBtn1 = document.createElement("DIV");
        allocatorBtn1.id = "allocatorBTN1";
        allocatorBtn1.setAttribute("class", "btn inPortalBtn settingsBtn settingBtntrue");
        allocatorBtn1.setAttribute("onclick", "AutoPerky.clickAllocate();");
        allocatorBtn1.textContent = "Allocate Perks";
        buttonbar.appendChild(allocatorBtn1);
        buttonbar.setAttribute("style", "margin-bottom: 0.8vw;");

        var ratioPreset = document.createElement("select");
        ratioPreset.id = "ratioPreset";
        var oldstyle = "text-align: center; width: 110px;";
        if (game.options.menu.darkTheme.enabled != 2)
            ratioPreset.setAttribute("style", oldstyle + " color: black;");
        else
            ratioPreset.setAttribute("style", oldstyle);
        //Populate dump perk dropdown list :
        //        var AutoPerky.presetList = [preset_ZXV,preset_ZXVnew,preset_ZXV3,preset_TruthEarly,preset_TruthLate,preset_nsheetz,preset_nsheetzNew,preset_HiderHehr,preset_HiderBalance,preset_HiderMore,preset_genBTC,preset_genBTC2];
        var html = "";
        for (var key in this.presets) {
            html += '<option id="' + key + '">' + key + "</option>";
        }
        //Specific ratios labeled above are configured down in the bottom of this file.Lines 543-556
        ratioPreset.innerHTML = html;
        //load the last ratio used
        var loadLastPreset = localStorage.getItem("AutoperkSelectedRatioPresetID");
        if (loadLastPreset != null)
            ratioPreset.selectedIndex = loadLastPreset; // First element is zxv (default) ratio.
        else
            ratioPreset.selectedIndex = 0;
        ratioPreset.setAttribute("onchange", "AutoPerky.setDefaultRatios()");
        //Add the presets dropdown to UI Line 1
        customRatios.appendChild(ratioPreset);
        document.getElementById("portalWrapper").appendChild(customRatios);
        document.getElementById("FixedRatio").style["width"] = "480px";
        this.setDefaultRatios();
    }
};

AutoPerky.init();
//var AutoPerky = new AutoPerks();
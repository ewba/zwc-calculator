// global vars
let data = {};
let langs = {};
const langIdx = [ "en", "bg", "cs", "sl" ]; // match html!
let lang = "en";
let counted = false;

// http://www.zerowasteitaly.org/comuni-rifiuti-zero/zero-waste-municipalities-national-guarantee-board-for-zero-waste-italy/
// https://www.catasto-rifiuti.isprambiente.it/index.php?pg=gestregione&aa=2018&regid=&areaid=Italia&mappa=0#p
// Italian TREATMENT DATA is estimated
// unused
const castelcucco = { // 2021 2294
	wastegen: 473, //  residual
	separation: 94,
	compost: 30,
	recycling: 60,
	landfill: 5,
	wte: 5,
	name: "Castelcucco",
	country: "it",
	cc: "it",
	year: 2021
};

const tramutola = { // 2021 2925
	wastegen: 213, // 19 residual
	separation: 89,
	compost: 30,
	recycling: 60,
	landfill: 5,
	wte: 5,
	name: "Tramutola",
	country: "it",
	cc: "it",
	year: 2021
};

// unused city; numbers prefixed with 0 are placeholders
const capannori = { // 2017 46542
	wastegen: 458, // 55 residual
	separation: 88,
	compost: 020,
	recycling: 070,
	landfill: 05,
	wte: 05,
	name: "Capannori",
	country: "it",
	cc: "it",
	year: 2017
};

const vrhnika = { // 2018 16978 / 25021
	wastegen: 368, // 63 residual
	separation: 83,
	compost: 34,
	recycling: 45,
	landfill: 10,
	wte: 12,
	name: "Vrhnika",
	country: "si",
	cc: "si",
	year: 2021
};

const treviso = { // 2021 84793
	wastegen: 468, //  residual
	separation: 87,
	compost: 35,
	recycling: 50,
	landfill: 7,
	wte: 8,
	name: "Treviso",
	country: "it",
	cc: "it",
	year: 2021
};

const parma = {// 2021 196655
	wastegen: 571, //  residual
	separation: 82,
	compost: 30,
	recycling: 45,
	landfill: 15,
	wte: 10,
	name: "Parma",
	country: "it",
	cc: "it",
	year: 2021
};

// unused
const carpi = {// 2018 72837
	wastegen: 393, // 64,1 residual
	separation: 84,
	compost: 35,
	recycling: 45,
	landfill: 10,
	wte: 10,
	name: "Carpi",
	country: "it",
	cc: "it",
	year: 2018
};

const champ_5k = tramutola;
const champ_50k = vrhnika;
const champ_100k = treviso;
const champ_300k = parma;
const champions = {
	"5k": champ_5k,
	"50k": champ_50k,
	"100k": champ_100k,
	"300k": champ_300k,
};

// separation adjustment factors
const rejectsF = 0.10;
const recyCompF = 0.5;
const landWTEF = 0.5;
const savingF = 0.95; // 5 % for higher costs

// middle points of population classes
const avgSize = {
	"5k": 2500,
	"50k": 27500,
	"100k": 75000,
	"300k": 300000,
};

// how does ambition affect achievability?
const ambF = {
	"0": 1, // titular placeholder
	"1": 0.3,
	"2": 0.6,
	"3": 1,
}

// for each ton of waste, so much ghg got produced/saved
const ghgCosts = {
	"cost-compost": -20/322, // -0,062
	"cost-recycling": -500/753, // -0,664
	"cost-landfill": 0.17, // 0,187
	"cost-wte": 0.925, // 0,116
	"cost-pretreatment": 0 // 0,110, now folded into landfilling
	// "reuse": -29/7
};

// OECD PPP data for 2022
// https://stats.oecd.org/Index.aspx?DataSetCode=CPL
// choose Purchasing Power Parities for GDP and related indicators
// export Comparative price levels
// if new champions are added from other countries, change their dropdown value and key here as well (like Italy and Slovenia)
const PPP = {
	"Other": 100, // default, OECD average
	//"Australia": 125,
	"Austria": 94,
	"Belgium": 94,
	//"Canada": 120,
	//"Chile": 63,
	//"Colombia": 42,
	"Czech Republic": 68,
	"Denmark": 110,
	"Estonia": 75,
	"Finland": 105,
	"France": 91,
	"Germany": 95,
	"Greece": 69,
	"Hungary": 54,
	"Iceland": 137,
	"Ireland": 101,
	//"Israel": 139,
	"it": 81,
	//"Japan": 90,
	//"Korea": 79,
	"Latvia": 67,
	"Lithuania": 63,
	"Luxembourg": 109,
	//"Mexico": 66,
	"Netherlands": 98,
	//"New Zealand": 114,
	"Norway": 139,
	"Poland": 52,
	"Portugal": 72,
	"Slovak Republic": 70,
	"si": 73,
	"Spain": 78,
	"Sweden": 107,
	"Switzerland": 139,
	"Türkiye": 38,
	"United Kingdom": 102,
	//"United States": 125,
}

function switchLanguage(newLang) {
	const switcher = document.getElementById("lang-switcher");
	let reinit = false;
	if (typeof newLang != "string") {
		// use form value instead of passed
		newLang = switcher.selectedOptions[0].value;
		reinit = true;
	}
	lang = newLang;
	switcher.selectedIndex = Math.max(0, langIdx.indexOf(newLang));
	if (reinit) {
		initTranslation(newLang, true);
		const activeTab = getActiveTabId();
		// force redraw the results page, even if we're not on it
		switchTab(2);
		nextForm();
		switchTab(activeTab);
	}
}

function verifySelect() {
	const pop = document.getElementById("population");
	const amb = document.getElementById("ambition");
	const next = document.getElementById("next");
	
	if (pop.selectedIndex && amb.selectedIndex) {
		next.removeAttribute("disabled");
	} else {
		next.setAttribute("disabled", "");
	}
	return true;
}

function syncBtnText(idx) {
	const next = document.getElementById("next");
	if (idx < 4) {
		next.innerHTML = getTranslation("next");
	} else {
		next.innerHTML = getTranslation("next2");
	}
}

function getActiveTabId() {
	const tabs = Array.from(document.querySelectorAll(".tab-item"));
	return tabs.filter(t => t.classList.contains("active"))[0].getAttribute("data-idx") * 1;
}

function switchTab(newTab, force=false) {
	const tabs = Array.from(document.querySelectorAll(".tab-item"));
	
	// blame bizarre "this" handling
	if (newTab.target !== undefined) {
		newTab = newTab.target.parentElement;
	} else {
		// we got passed the tab index
		for (let tab of tabs) {
			if (tab.getAttribute("data-idx") == newTab) {
				newTab = tab;
				break;
			}
		}
	}
	// prevent too early browsing; only tab 1 and Learn more are always available
	let newIdx = newTab.getAttribute("data-idx");
	if (!force && next.hasAttribute("disabled") && !(newIdx == 4 || newIdx == 0)) return;
	
	syncBtnText(newIdx);
	
	if (newTab.classList.contains("active") && !force) {
		return false;
	}
	
	// toggle active tab header
	for (let tab of tabs) {
		tab.classList.remove("active");
	}
	newTab.classList.add("active");
	
	// toggle bodies
	const panels = document.getElementsByClassName("panel-body");
	for (let panel of panels) {
		if (!panel.classList.contains("d-none")) {
			panel.classList.add("d-none");
		}
		if (panel.getAttribute("data-idx") == newIdx) {
			panel.classList.toggle("d-none");
		}
	}
}

function ensure100() {
	const percents = document.querySelectorAll(".percent-100");
	let sum = 0;
	for (let per of percents) {
		sum += 1*per.value;
	}
	
	const total = document.getElementById("pertotal");
	total.innerText = sum;
	if (sum != 100) {
		percents.forEach(el => el.classList.add("is-error"));
	} else {
		percents.forEach(el => el.classList.remove("is-error"));
	}
}

function rounder(val, ghg) {
	let scale = ghg ? 100 : 1000;
	return Math.round(val/scale) * scale;
}

// multiply when used with champ, otherwise invert first
function getPPPadjustment(champ) {
	if (data.ppp == "Other") return 1; // ignore

	return PPP[data.ppp] / PPP[champ.cc];
}

function getGenCost(genAmount) {
	let treatments = [ "compost", "recycling", "landfill", "wte" ];
	let cost = 0;
	
	for (let treat of treatments) {
		let costname = "cost-" + treat;
		cost += genAmount / 1000 * data[treat] / 100 * data[costname];
	}
	
	// also consider pre-treatment, same percentage as landfilling
	cost += genAmount / 1000 * data["landfill"] / 100 * data["cost-pretreatment"];
	
	return rounder(cost * avgSize[data.population]);
}

function getSepCost(sepDiff) {
	let treatments = [ "compost", "recycling", "landfill", "wte" ];
	
	// higher separation -> less landfill and wte (90%, 50/50), moved to recycling&composting (50/50)
	// LIMITATION: not safe around boundaries (low separation + low landfill/wte could lead to negatives)
	const adjSepDiff = (1 - rejectsF) * sepDiff;
	let data2 = {
		"compost": data["compost"] + adjSepDiff * (1-recyCompF),
		"recycling": data["recycling"] + adjSepDiff * recyCompF,
		"landfill": data["landfill"] - adjSepDiff * landWTEF,
		"wte": data["wte"] - adjSepDiff * (1-landWTEF)
	};
	
	let costDiff = 0; // old - new treatments
	for (let treat of treatments) {
		let costname = "cost-" + treat;
		costDiff += data["wastegen"] / 1000 * (data[treat] - data2[treat]) / 100 * data[costname];
	}
	// also consider pre-treatment, same percentage as landfilling
	costDiff += data["wastegen"] / 1000 * (data["landfill"] - data2["landfill"]) / 100 * data["cost-pretreatment"];
	
	return rounder(costDiff * savingF * avgSize[data.population]);
}

function getTreatCost(champ) {
	let treatments = [ "compost", "recycling", "landfill", "wte" ];
	
	let costDiff = 0; // champion - our treatments
	for (let treat of treatments) {
		let costname = "cost-" + treat;
		costDiff += data["wastegen"] / 1000 * (data[treat] - champ[treat] * getPPPadjustment(champ)) / 100 * data[costname];
	}
	// also consider pre-treatment, same percentage as landfilling
	costDiff += data["wastegen"] / 1000 * (data["landfill"] - champ["landfill"] * getPPPadjustment(champ)) / 100 * data["cost-pretreatment"];
	
	return rounder(costDiff * avgSize[data.population]);
}

function getCompCost(genDiff, champ, ghg) {
	let treatments = [ "compost", "recycling", "landfill", "wte" ];
	let costs;
	if (ghg) {
		costs = ghgCosts;
	} else {
		costs = data;
	}
	
	let costDiff = 0; // champ - our management
	for (let treat of treatments) {
		let costname = "cost-" + treat;
		costDiff += champ["wastegen"] / 1000 * champ[treat] / 100 * costs[costname] * (ghg ? 1 : getPPPadjustment(champ))
		- data["wastegen"] / 1000 * data[treat] / 100 * costs[costname];
	}
	// also consider pre-treatment, same percentage as landfilling
	costDiff += champ["wastegen"] / 1000 * champ["landfill"] / 100 * costs["cost-pretreatment"] * (ghg ? 1 : getPPPadjustment(champ))
	- data["wastegen"] / 1000 * data["landfill"] / 100 * costs["cost-pretreatment"];
	
	return rounder(-costDiff * avgSize[data.population], ghg);
}

function inject(str, obj) {
	return str.replace(/\${(.*?)}/g, (x,g) => obj[g]);
}

function calculateBenefits() {
	// find analoguous champion to compare against
	let champ = champions[data["population"]];
	let cost = 0;
	let populationRange = document.getElementById("population").selectedOptions[0].text;
	let msg = inject(getTranslation("res-intro"), [champ.title, avgSize[data.population].toLocaleString(), populationRange]);
	// fix up ambition, since it's stored as a translatabled string
	data.ambition = document.getElementById("ambition").selectedIndex;
	
	// Four cost calculations:
	// 1. just from the difference in amount, not accounting for treatment
	let genDiff = data["wastegen"] - champ["wastegen"];
	let genCost = 0;
	if (genDiff < 0) {
		msg += getTranslation("res-con1") + `<br>`;
	}
	genCost = getGenCost(genDiff);
	if (genCost >= 0) {
		msg += inject(getTranslation("res-desc1"), [genCost.toLocaleString(), champ.wastegen, champ.year]) + `<br>`;
	}
	cost += genCost;
	
	// 2. separation -> adjust treatment percentages -> calc
	let sepDiff = champ["separation"] - data["separation"];
	let sepCost = 0;
	if (sepDiff > 0) {
		sepCost = getSepCost(sepDiff);
		if (sepCost > 0) {
			msg += inject(getTranslation("res-desc2"), [sepCost.toLocaleString(), champ.separation, champ.year]) + `<br>`;
		}
	} else {
		msg += getTranslation("res-con2") + `<br>`;
	}
	cost += sepCost;
	
	// 3. champion treatment of our waste
	let treatCost = getTreatCost(champ);
	if (treatCost >= 0) {
		msg += inject(getTranslation("res-desc3"), [treatCost.toLocaleString()]) + `<br>`;
	} else {
		msg += getTranslation("res-con3") + `<br>`;
	}
	cost += treatCost;
	
	// 4. full difference to champion
	msg += "<br><strong>" + getTranslation("res-overall") +":</strong><br>";
	let compCost = getCompCost(genDiff, champ, false);
	if (compCost > 0) {
		let reduced = rounder(compCost * ambF[data.ambition]);
		msg += inject(getTranslation("res-desc4a"), [champ.name, compCost.toLocaleString()]) + ".";
	} else {
		msg += inject(getTranslation("res-con4"), [champ.name]);
	}
	//msg += "1+2+3 vs 4: " + cost + " vs " + compCost;
	// potentially add gap to 65 % recycling target
	const totalRecycling = data["compost"] + data["recycling"];
	if (totalRecycling < 65) {
		msg += inject(getTranslation("res-desc4c"), [65 - totalRecycling]);
	}
	msg += "<br>";
	
	// GHG savings
	let ghgCost = getCompCost(genDiff, champ, true);
	if (ghgCost > 0) {
		msg += "<br><strong>" + getTranslation("res-ghg1") + ":</strong><br>";
		msg += inject(getTranslation("res-ghg2"), [champ.name, ghgCost.toLocaleString()]);
		// TODO: 8.5 t/year per capita — express as people? "This could offset as much emissions as of X people"
		msg += " " + getTranslation("res-ghg3");
	}
	
	return msg;
}

function nextForm() {
	// all data fields have defaults, so we can just save everything
	const inputs = document.querySelectorAll("input, select");
	for (let input of inputs) {
		data[input.id] = isNaN(input.value) ? input.value : input.value * 1;
	}
	
	// do the number crunching
	let inputDump = calculateBenefits();
	
	// update dump on results panel
	const resultDiv = document.getElementById("results");
	resultDiv.innerHTML = inputDump;
	
	// find the active tab/panel index
	let idx = getActiveTabId();
	
	// switch to next tab
	idx = (idx + 1) % 5;
	switchTab(idx);
	syncBtnText(idx);

	// ping a counter, once per session
	// fetch is nicer, but let's try a tiny bit more compatibility
	//fetch("https://ebm.si/p/zwcities-calc/hitit.php");
	if (!counted) {
		var oReq = new XMLHttpRequest();
		oReq.open("GET", "https://ebm.si/p/zwcities-calc/hitit.php");
		oReq.send();
		counted = true;
	}
}

function initEventListeners() {
	const pop = document.getElementById("population");
	pop.addEventListener("input", verifySelect);
	
	const amb = document.getElementById("ambition");
	amb.addEventListener("input", verifySelect);
	
	const tabs = Array.from(document.querySelectorAll(".tab-item"));
	for (let tab of tabs) {
		tab.addEventListener("click", switchTab);
	}
	// enable the panel of the active tab
	const activeTab = getActiveTabId();
	switchTab(activeTab, true);

	const percents = document.querySelectorAll(".percent-100");
	for (let per of percents) {
		per.addEventListener("input", ensure100);
	}

	const next = document.getElementById("next");
	next.addEventListener("click", nextForm);

	const langs = document.getElementById("lang-switcher");
	langs.addEventListener("input", switchLanguage);
}

function initTranslation(lang, override = false) {
	// handle localized country names
	for (const [cs, champ] of Object.entries(champions)) {
		let cc = "cc-" + champ.cc;
		let nc = getTranslation(cc);
		if (nc) {
			champ.country = nc;
			champ.title = champ.name + ", " + champ.country;
		}
	}
	
	if (!lang || (!override && lang == "en")) return;
	
	for (const [elid, eltxt] of Object.entries(langs[lang])) {
		let el = document.getElementById(elid);
		if (el && eltxt) el.innerHTML = eltxt;
	}
	
	// handle all the other price/ton labels, since ids need to be unique
	for (let i = 1; i < 5; i++) {
		const el = document.getElementById("ppt" + i);
		if (el) el.innerHTML = langs[lang]["ppt"];
	}
}

function getTranslation(key) {
	return langs[lang][key];
}

function modifyDefaults(searchParams) {
	for (let param of searchParams) {
		if (param[0] == "lang") continue;
		
		// adapt color if requested
		if (param[0] == "color") {
			let el = document.querySelectorAll("a");
			let color = "#" + param[1];
			for (let a of el) {
				a.style.color = color;
				//a.style.borderBottomColor = color;
			}
			el = document.getElementById("next");
			el.style.background = color;
			el.style.borderColor = color;
			continue;
		}
		
		let el = document.getElementById(param[0]);
		if (el) el.value = param[1];
	}
}

// init
function main() {
	let url = new URL(window.location.href);
	let searchParams = url.searchParams;
	
	if (searchParams) {
		let lang2 = searchParams.get('lang') || lang;
		lang = lang2;
		initTranslation(lang2);
		if (lang != "en") {
			switchLanguage(lang);
		}
		
		modifyDefaults(searchParams);
	}
	
	initEventListeners();
}

window.addEventListener("load", main);

/* IDEAS
 - print results (genera*te markup, prepare print.css, open new tab with it, fire print event)
 
 CO2 Savings scenario is calculated (based on data published by the German Environmental Agency (UBA) - The Climate Change Mitigation potential of the waste sector – 2015)
 https://www.umweltbundesamt.de/sites/default/files/medien/378/publikationen/texte_56_2015_the_climate_change_mitigation_potential_of_the_waste_sector.pdf
 
 costs:
 - vrednost reciklata 50-70€/t po zgornji UBA študiji (stran 176)
 - za postopke pa stran 175
 
 AT THE END:
 - write docs for i18n and other parameters
 - disable grey bg
 
 https://picturepan2.github.io/spectre/elements/forms.html
 */

// only translations from here on!
const english = {
	"main-title": "Zero Waste Cities calculator",
	"main-subtitle": "What are the potential savings?",
	"next": "Next",
	"next2": "Try other values",
	"tab1": "City data",
	"tab2": "Waste data",
	"tab3": "Cost data",
	"tab4": "Results",
	"tab5": "Learn more",
	"t1-intro": "Please enter some <strong>basic data about your city</strong>:",
	"t1-pop": "Population",
	"t1-5k": "Below 5,000",
	"t1-amb": "Ambition",
	"t1-amb1": "Low",
	"t1-amb2": "Medium",
	"t1-amb3": "High",
	"t1-note": "The data you submit through this form will be used to calculate potential savings through comparable scenarios and suggest further action for waste management optimization. It will take purchasing power parity into account if you selected a country.<br>The form contains default values which are 2021 EU-27 averages. You can modify these values in the next few steps",
	"msw": "Municipal solid waste",
	"gen": "Waste generation per capita",
	"kgpa": "kg / year",
	"sep": "Separate collection rate",
	"treat": "Waste treatment (total",
	"comp": "Composting",
	"recy": "Recycling",
	"land": "Landfilling",
	"w2e": "(Co)incineration",
	"t3-intro": "Cost of waste treatment per ton:",
	"c-comp": "Composting",
	"c-recy": "Recycling",
	"c-land": "Landfilling",
	"c-w2e": "(Co)incineration",
	"c-pret": "Pre-treatment",
	"c-value": "These default costs don't include offsets for the market value of recyclables",
	"t4-intro": "Results",
	"t5-p1": "Want to get familiar with key principles and myths of the Zero Waste approach, dive into case studies or learn through site visits? Explore the <a href='https://zerowastecities.eu/' target='_blank' rel='noopener'>Zero Waste Cities</a> website for that and more.",
	"t5-p2": "This calculator was developed by <a href='https://ebm.si/en/' target='_blank' rel='noopener'>Ekologi brez meja</a> during the <i>Creating zero waste methodology for municipalities</i> Erasmus+ project together with <a href='http://hnutiduha.cz/o-nas/about-us/' target='_blank' rel='noopener'>Hnutí Duha</a> and <a href='https://zerowasteeurope.eu/' target='_blank' rel='noopener'>Zero Waste Europe</a>. It was upgraded in 2023 with the support of the European Climate Foundation.",
	"t5-p3": "Besides Eurostat data, it uses City of London GHG emission figures for different waste treatment options, model city figures from their annual Zero Waste strategy reports and an estimate for the initial per-ton costs from a 2012 study.",
	"res-intro": 'For comparison, we picked a model city of similar size that is already implementing a Zero Waste strategy: <strong>${0}</strong>. Calculations assume a population of ${1} (you chose: ${2}).<br><br>',
	"res-con1": "Congratulations, you're producing even less waste than the model city!",
	"res-con2": "Congratulations, you're already very successful at waste separation!",
	"res-con3": "Congratulations, your waste treatment mix is more efficient than in the model city!",
	"res-con4": 'Congratulations, your waste management is already more cost efficent than in ${0}! Send us an email at <a href="mailto:info.zws@ocistimo.si">info.zws@ocistimo.si</a>!',
	"res-desc1": 'You could save <strong>${0} €</strong> per year if you produced the same amount of waste (${1} kg / year in ${2}).',
	"res-desc2": 'You could save <strong>${0} €</strong> per year if you separately collected the same amount of waste (${1} % in ${2}).',
	"res-desc3": 'You could save <strong>${0} €</strong> per year if you treated your waste the same.',
	"res-desc4a": 'If you managed your waste the same as in ${0}, <strong>you could save ${1} €</strong> per year',
	"res-desc4b": '${0} € at your level of ambition',
	"res-desc4c": ' <strong>Warning</strong>: ${0} % short of the EU 65 % recycling target!',
	"res-overall": "Overall comparison",
	"res-ghg1": 'Greenhouse gas savings',
	"res-ghg2": 'If you managed your waste the same as in ${0}, you could avoid at least <strong>${1} tons of CO<sub>2</sub>eq</strong> emissions per year.',
	"res-ghg3": 'Note that this is a lower bound not taking waste prevention measures into account.',
	"ppt": "€ / t",
	"cc-it": 'Italy',
	"cc-si": 'Slovenia'
};

const slovenian = {
	"main-title": "Kalkulator občin na poti k Zero Waste",
	"main-subtitle": "Kakšni so potencialni prihranki?",
	"next": "Naprej",
	"next2": "Poskusi z drugimi vrednostmi",
	"tab1": "Občina",
	"tab2": "Odpadki",
	"tab3": "Stroški",
	"tab4": "Rezultati",
	"tab5": "Več ...",
	"t1-intro": "Vnesite nekaj <strong>osnovnih podatkov o občini</strong>:",
	"t1-pop": "Prebivalcev",
	"t1-5k": "Do 5,000",
	"t1-amb": "Ambicija",
	"t1-amb1": "Nizka",
	"t1-amb2": "Srednja",
	"t1-amb3": "Visoka",  
	"t1-note": "Vnešeni podatki bodo uporabljeni za izračun potencialnih prihrankov preko primerjave z obstoječimi dobrimi primeri in za predloge nadaljnih izboljšav ravnanja z odpadki. Če ste izbrali državo, bo upoštevana tudi razlika v razvitosti (PPP).<br> Obrazec vsebuje privzete vrednosti, ki so večinoma povprečja za EU-27 za 2021. V naslednjih korakih jih lahko vse spremenite.",
	"msw": "Komunalni odpadki",
	"gen": "Nastali komunalni odpadki na osebo",
	"kgpa": "kg / leto",
	"sep": "Stopnja ločenega zbiranja",
	"treat": "Ravnanje z odpadki (skupaj",
	"comp": "Kompostiranje",
	"recy": "Recikliranje",
	"land": "Odlaganje",
	"w2e": "(So)sežig",
	"t3-intro": "Stroški ravnanja z odpadki na tono:",
	"c-comp": "Kompostiranje",
	"c-recy": "Recikliranje",
	"c-land": "Odlaganje",
	"c-w2e": "(So)sežig",
	"c-pret": "Predobdelava",
	"c-value": "Privzeti stroški ne vključujejo odbitkov za morebitno prodajo surovin.",
	"t4-intro": "Rezultati",
	"t5-p1": "Vas zanimajo ključna načela in miti koncepta Zero Waste? Študije primerov, ogledi dobrih praks? Za to in še več raziščite mednarodno spletno stran namenjeno <a href='https://zerowastecities.eu/' target='_blank' rel='noopener'>Zero Waste mestom</a> in stran slovenskega <a href='https://ebm.si/zw/obcine/' target='_blank' rel='noopener'>Zero Waste programa</a>.",
	"t5-p2": "Ta kalkulator smo razvili <a href='https://ebm.si/en/' target='_blank' rel='noopener'>Ekologi brez meja</a> med Erasmus+ projektom <i>Creating zero waste methodology for municipalities</i>, skupaj z <a href='http://hnutiduha.cz/o-nas/about-us/' target='_blank' rel='noopener'>Hnutí Duha</a> in <a href='https://zerowasteeurope.eu/' target='_blank' rel='noopener'>Zero Waste Europe</a>. V 2023 je bil nadgrajen s podporo European Climate Foundation.",
	"t5-p3": "Poleg podatkov Eurostata uporablja londonske podatke o emisijah različnih načinov ravnanja z odpadki, modelne podatke mest iz njihovih letnih Zero Waste poročil in oceno za privzete stroške ravnanja študije iz leta 2012.",
	"res-intro": 'Za primerjavo smo izbrali mesto podobne velikosti, ki že izvaja strategijo Zero Waste: <strong>${0}</strong>. Izračuni predpostavljajo ${1} prebivalcev (izbrali ste: ${2}).<br><br>',
	"res-con1": "Čestitamo, proizvedete celo manj odpadkov kot modelno mesto!",
	"res-con2": "Čestitamo, ste že zelo uspešni pri ločenem zbiranju!",
	"res-con3": "Čestitamo, vaš način obdelave odpadkov je bolj stroškovno učinkovit kot v modelnem mestu!",
	"res-con4": 'Čestitamo, vaše ravnanje z odpadki je celokupno bolj stroškovno učinkovito kot v ${0}! Pišite nam na <a href="mailto:info.zws@ocistimo.si">info.zws@ocistimo.si</a>!',
	"res-desc1": 'Letno bi lahko prihranili <strong>${0} €</strong> — če bi proizvedli enako količino odpadkov (${1} kg / leto v ${2}).',
	"res-desc2": 'Letno bi lahko prihranili <strong>${0} €</strong> — če bi ločeno zbrali enak delež odpadkov (${1} % v ${2}).',
	"res-desc3": 'Letno bi lahko prihranili <strong>${0} €</strong> — če bi odpadke obdelali na enak način.',
	"res-desc4a": 'Če bi enako ravnali z odpadki kot ${0}, bi lahko <strong>letno prihranili ${1} €</strong>',
	"res-desc4b": 'z vašo ambicioznostjo ${0} €',
	"res-desc4c": ' <strong>Pomni</strong>: ${0} % pod 65 % EU ciljem za recikliranje!',
	"res-overall": "Skupna primerjava",
	"res-ghg1": 'Prihranki izpustov toplogrednih plinov',
	"res-ghg2": 'Če bi enako ravnali z odpadki kot ${0}, bi se lahko letno izognili vsaj <strong>${1} tonam emisij CO<sub>2</sub>eq</strong>.',
	"res-ghg3": 'Opomba: ocenjena vrednost predstavlja spodnjo mejo, saj ne upošteva učinkov preprečevanja.',
	"ppt": "€ / t",
	"cc-it": 'Italija',
	"cc-si": ''
}

const czech = {
	"main-title": "Kalkulačka pro Zero Waste obce",
	"main-subtitle": "Jaké jsou potenciální úspory?",
	"next": "Další",
	"next2": "Zkuste zadat jiné hodnoty",
	"tab1": "Údaje o obci",
	"tab2": "Údaje o odpadech",
	"tab3": "Náklady",
	"tab4": "Výsledky",
	"tab5": "Více informací",
	"t1-intro": "Prosím zadejte <strong>základní údaje o vaší obci</strong>:",
	"t1-pop": "Obyvatelé",
	"t1-5k": "pod 5,000",
	"t1-amb": "Ambice",
	"t1-amb1": "Nízká",
	"t1-amb2": "Střední",
	"t1-amb3": "Vysoká",
	"t1-note": "Data, která zadáte do tohoto formuláře budou použita k výpočtu potenciálních úspor porovnáním srovnatelných scénářů a k návrhu dalších opatření ke zlepšení nakládání s odpady. Formulář obsahuje základní údaje, které vychází z průměrných hodnot zemí EU-27. Údaje lze modifikovat v dalších krocích",
	"msw": "Komunální odpad",
	"gen": "Produkce odpadu na obyvatele",
	"kgpa": "kg / rok",
	"sep": "Míra třídění",
	"treat": "Nakládání s odpady (celkem)",
	"comp": "Kompostování",
	"recy": "Recyklace",
	"land": "Skládkování",
	"w2e": "Spalování",
	"t3-intro": "Cena nakládání s odpady za tunu:",
	"c-comp": " Kompostování",
	"c-recy": " Recyklace",
	"c-land": " Skládkování",
	"c-w2e": " Spalování",
	"c-pret": "Předúprava",
	"c-value": "Tyto základní náklady nezahrnují kompenzaci trhové ceny recyklovaných materiálů",
	"t4-intro": "Výsledky",
	"t5-p1": "Chcete se dozvědět o základních principech a mýtech Zero Waste metod, podívat se na příklady dobré praxe, nebo se všemu naučit na návštěvě v jiném městě? Na webu <a href='https://zerowastecities.eu/' target='_blank' rel='noopener'>Zero Waste Cities</a> najdete všechny potřebné informace (web je v anglickém jazyce).",
	"t5-p2": "Tato kalkulačka byla vyvinuta organizací <a href='https://ebm.si/en/' target='_blank' rel='noopener'>Ekologi brez meja</a> v rámci projektu <i>Creating zero waste methodology for municipalities</i> Erasmus+ společně s organizacemi <a href='http://hnutiduha.cz/o-nas/about-us/' target='_blank' rel='noopener'>Hnutí Duha</a> a <a href='https://zerowasteeurope.eu/' target='_blank' rel='noopener'>Zero Waste Europe</a>.",
	"t5-p3": "Kromě dat z Eurostatu, kalkulačka využívá data o emisích skleníkových plynů z různých typů zpracování odpadů města Londýn waste, modelové údaje z jejich výročních Zero Waste strategy reports a odhad jejich počítečních nákladů za tunu podle studie z roku 2012.",
	"res-intro": 'Pro porovnání jsme vybrali modelové město podobné velikosti, které už pracuje na svojí strategii Zero Waste: <strong>${0}</strong>. Výpočet předpokládá s počtem obyvatel ${1} (vyberte: ${2}).<br><br>',
	"res-con1": "Velká gratulace, vytváříte méně odpadu než modelové město!",
	"res-con2": "Gratulujeme, máte velmi dobré výsledky v třídění odpadů!",
	"res-con3": "Gratulujeme, vaše způsoby nakládání s odpady jsou ještě efektivnější než modelové město!",
	"res-con4": 'Gratulujeme, váš systém nakládání s odpady je ještě efektivnější než ten ve městě ${0}! Pošlete nám email <a href="mailto:ivo.kropacek@hnutiduha.cz">ivo.kropacek@hnutiduha.cz</a>!',
	"res-desc1": 'Mohli byste ušetřit <strong>${0} €</strong> ročně, pokud vyprodukujete stejné množství odpadu (${1} kg / ročně v roce ${2}).',
	"res-desc2": 'Mohli byste ušetřit <strong>${0} €</strong> ročně, pokud vytřídíte stejné množství odpadu (${1} % v roce ${2}).',
	"res-desc3": 'Mohli byste ušetřit <strong>${0} €</strong> ročně pokud zavedete stejný systém nakládání s odpady.',
	"res-desc4a": 'Pokud by váš systém nakládání s odpady byl stejný jako v ${0}, <strong>mohli byste ušetřit ${1} €</strong> ročně',
	"res-desc4b": '${0} € při vaší ambici',
	"res-desc4c": ' <strong>Varování</strong>: ${0} % nedosahuje cíle EU 65 % recyklace!',
	"res-overall": "Celkové srovnání",
	"res-ghg1": 'Snížení množství skleníkových plynů',
	"res-ghg2": 'Pokud by váš systém nakládání s odpady byl stejný jako v ${0}, ušetříte nejméně <strong>${1} tun emisí CO<sub>2</sub>eq</strong> ročně.',
	"res-ghg3": 'Poznámka: jedná se o dolní hranici, která nezohledňuje opatření k předcházení vzniku odpadů.',
	"ppt": "CZK / t",
	"cc-it": 'Itálie',
	"cc-si": 'Slovinsko'
};

const bulgarian = {
	"main-title": "Калкулатор за общини с нулеви отпадъци",
	"main-subtitle": "Какви са потенциалните спестявания?",
	"next": "Продължи",
	"next2": "Опитайте с други стойности",
	"tab1": "Данни за общината",
	"tab2": "Данни за отпадъците",
	"tab3": "Данни за разходите",
	"tab4": "Резултати",
	"tab5": "Научете още",
	"t1-intro": "Моля, въведете следните <strong>основни данни за вашата община</strong>:",
	"t1-pop": "Население",
	"t1-5k": "Под 5 000",
	"t1-amb": "Ниво на амбиция",
	"t1-amb1": "Ниско",
	"t1-amb2": "Средно",
	"t1-amb3": "Високо",
	"t1-note": "Данните, които предоставяте чрез този формуляр, ще бъдат използвани за изчисляване на потенциалните спестявания при сравними обстоятелства, както и за предлагане на по-нататъшни действия за оптимизиране на управлението на отпадъците. Формулярът съдържа стойности по подразбиране, които са средните стойности за 2021 г. за държавите-членки на Европейския съюз (ЕС-27). Можете да промените тези стойности в следващите няколко стъпки.",
	"msw": "Твърди битови отпадъци",
	"gen": "Образуване на отпадъци на жител",
	"kgpa": "кг/година",
	"sep": "Степен на разделно събиране",
	"treat": "Waste treatment (общо",
	"comp": "Компостиране",
	"recy": "Рециклиране",
	"land": "Депониране",
	"w2e": "(Съвместно) изгаряне",
	"t3-intro": "Разходи за третиране на отпадъци на тон:",
	"c-comp": "Компостиране",
	"c-recy": "Рециклиране",
	"c-land": "Депониране",
	"c-w2e": "(Съвместно) изгаряне",
	"c-pret": "Предварително третиране",
	"c-value": "Зададените стандартни разходи не включват компенсациите за пазарната стойност на рециклируемите материали.",
	"t4-intro": "Резултати",
	"t5-p1": "Искате ли да се запознаете с основните принципи на подхода „Нулеви отпадъци“? Искате ли да задълбочите познанията си с помощта на конкретни примери от общини или да се учите чрез посещения на място? Следете <a href='https://chistaobshtina.eu/' target='_blank' rel='noopener'>уебсайта за общини с нулеви отпадъци</a>, където ще откриете тези и още много други полезни материали и възможности.",
	"t5-p2": "Този калкулатор е разработен от <a href='https://ebm.si/en/' target='_blank' rel='noopener'>словенската организация „Еколози без граници” / Ekologi brez meja</a> в рамките на проекта <i> „Създаване на методология за нулеви отпадъци за общините“</i>  по програма „Еразъм+“ съвместно с <a href='http://hnutiduha.cz/o-nas/about-us/' target='_blank' rel='noopener'>чешките партньори Hnutí Duha</a> и <a href='https://zerowasteeurope.eu/' target='_blank' rel='noopener'>Европейската мрежа за нулеви отпадъци</a>.",
	"t5-p3": "Освен данните от Евростат, за калкулатора са използвани данни за емисиите на парникови газове на град Лондон за различните начини на третиране на отпадъците, данни за примерните градове от техните годишни доклади за напредък по местната стратегия за нулеви отпадъци, както и оценка на първоначалните разходи на тон, изчислени въз основа на проучване от 2012 г. на Германската агенция по околна среда.",
	"res-intro": 'За сравнение избрахме модел на град със сходен размер, който вече прилага стратегия за нулеви отпадъци: <strong>${0}</strong>. Изчисленията предполагат население от ${1} (вие избрахте: ${2}).<br><br>',
	"res-con1": "Поздравления, вие образувате още по-малко отпадъци дори от града, който служи за пример!",
	"res-con2": "Поздравления, вече имате големи успехи с разделянето на отпадъците!",
	"res-con3": "Поздравления, съчетанието от начини на третиране на отпадъците във вашата община е по-ефективно, отколкото в града, който служи за пример!",
	"res-con4": '"Поздравления, управлението на отпадъците във вашата община вече е по-рентабилно от ${0}! Изпратете ни имейл на <a href="mailto:zerowaste@zazemiata.org">zerowaste@zazemiata.org</a>!',
	"res-desc1": 'Бихте могли да спестите <strong>${0} €</strong> годишно, ако образувате същото количество отпадъци (${1} kg / year in ${2}).',
	"res-desc2": 'Бихте могли да спестите <strong>${0} €</strong> годишно, ако събирате разделно същото количество отпадъци (${1} % in ${2}).',
	"res-desc3": 'Бихте могли да спестите <strong>${0} €</strong> 51 000 евро годишно, ако третирате отпадъците си по същия начин.',
	"res-desc4a": 'Ако управлявате отпадъците си по същия начин, както в ${0}, <strong>бихте могли да спестите ${1} €</strong> годишно',
	"res-desc4b": '${0} € при вашето ниво на амбиция',
	"res-desc4c": ' <strong>Предупреждение</strong>: ${0} % по-малко от целта за 65% рециклиране в ЕС!',
	"res-overall": "Цялостно сравнение",
	"res-ghg1": 'Спестени парникови газове',
	"res-ghg2": 'Ако управлявате отпадъците си по същия начин, както в ${0}, бихте могли да избегнете поне <strong>${1} тона емисии CO<sub>2</sub></strong> еквивалент годишно.',
	"res-ghg3": 'Имайте предвид, че това е долна граница, която не отчита мерките за предотвратяване на образуването на отпадъци.',
	"ppt": "€ / t",
	"cc-it": 'Италия',
	"cc-si": 'Словения'
};

langs["en"] = english;
langs["cs"] = czech;
langs["sl"] = slovenian;
langs["bg"] = bulgarian;
